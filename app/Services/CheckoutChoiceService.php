<?php
/**
 * Accommodation choice and travel insurance at checkout (3.3).
 *
 * Accommodation: a trip lists its accommodation options in custom_fields
 *   accommodation_options = [{id, name, description, price, price_per}, …]
 * (price_per: person|booking). With options, the customer picks one at
 * checkout; the first is preselected (and used when nothing was chosen, for
 * example a cart or API booking), so it is normally the standard option.
 *
 * Travel insurance: Settings → Payment → Travel Insurance offers an add-on
 * priced per traveller, as a percentage of the trip price, or per booking.
 * A trip can opt out (custom_fields travel_insurance_disabled). The customer
 * says yes or no at checkout; with "ask every customer" on, they must choose.
 *
 * Both are priced like the rest of the booking (part of the subtotal, so
 * coupons, tax and deposits include them), show as their own lines, and are
 * stored on the booking (meta `_accommodation`, `_travel_insurance`) as they
 * were when booked.
 *
 * @package Yatra\Services
 * @since 3.3.0
 */

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Database\Tables\BookingsTable;

class CheckoutChoiceService
{
    public const ACCOMMODATION_ROW_ID = -7003;
    public const INSURANCE_ROW_ID = -7004;
    public const MAX_OPTIONS = 20;

    private static bool $booted = false;

    /** @var array<int, array{options: list<array>, insurance_off: bool}> */
    private static array $tripCache = [];

    /** Choices of the pricing run in progress (yatra_before_calculation_params). */
    private static ?array $pricing = null;

    public static function init(): void
    {
        if (self::$booted) {
            return;
        }
        self::$booted = true;
        add_filter('yatra_session_calculation_params', [self::class, 'sessionParams'], 10, 2);
        add_filter('yatra_summary_calculation_params', [self::class, 'summaryParams'], 10, 1);
        add_filter('yatra_before_calculation_params', [self::class, 'beforeCalculation'], 6, 1);
        add_filter('yatra_calculate_subtotal', [self::class, 'addToSubtotal'], 16, 2);
        add_filter('yatra_after_calculation_result', [self::class, 'addRows'], 9, 2);
        add_filter('yatra_booking_get_services', [self::class, 'bookingServices'], 31, 2);
        add_action('yatra_checkout_before_contact_details', [self::class, 'renderCheckout'], 15, 1);
    }

    /** The accommodation and insurance choices on the checkout form. @param mixed $session */
    public static function renderCheckout($session = []): void
    {
        $session = is_array($session) ? $session : [];
        $tripId = (int) ($session['trip_id'] ?? 0);
        if ($tripId <= 0 || !empty($session['is_remaining_payment'])) {
            return;
        }
        $options = self::accommodationOptions($tripId);
        $insurance = self::insuranceOffered($tripId) ? self::insuranceSettings() : null;
        if ($options === [] && $insurance === null) {
            return;
        }
        $travellers = max(1, (int) ($session['travelers'] ?? 1));
        $format = static function (float $amount): string {
            return function_exists('yatra_format_price') ? wp_strip_all_tags((string) yatra_format_price($amount)) : number_format($amount, 2);
        };

        if ($options !== []) {
            $current = self::resolveAccommodation($tripId, (string) ($session['accommodation'] ?? '')) ?? $options[0];
            ?>
            <div class="yatra-booking-section yatra-accommodation-section" data-testid="checkout-accommodation">
                <h2 class="yatra-section-title"><?php esc_html_e('Accommodation', 'yatra'); ?></h2>
                <p class="yatra-section-description"><?php esc_html_e('Choose where you stay. The price updates in your summary.', 'yatra'); ?></p>
                <div class="yatra-choice-list" role="radiogroup" aria-label="<?php esc_attr_e('Accommodation', 'yatra'); ?>">
                    <?php foreach ($options as $option) :
                        $amount = self::accommodationAmount($option, $travellers);
                        if ($option['price'] <= 0) {
                            $priceText = __('Included', 'yatra');
                        } elseif ($option['price_per'] === 'booking') {
                            /* translators: %s: price */
                            $priceText = sprintf(__('+%s per booking', 'yatra'), $format($option['price']));
                        } else {
                            /* translators: %s: price */
                            $priceText = sprintf(__('+%s per person', 'yatra'), $format($option['price']));
                        }
                        ?>
                        <label class="yatra-choice-option" style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;cursor:pointer;">
                            <input type="radio" name="accommodation" value="<?php echo esc_attr($option['id']); ?>" <?php checked($option['id'], $current['id']); ?> data-amount="<?php echo esc_attr((string) $amount); ?>" style="margin-top:4px;">
                            <span style="flex:1;">
                                <strong><?php echo esc_html($option['name']); ?></strong>
                                <?php if ($option['description'] !== '') : ?>
                                    <br><small><?php echo esc_html($option['description']); ?></small>
                                <?php endif; ?>
                            </span>
                            <span class="yatra-choice-price" style="white-space:nowrap;"><?php echo esc_html($priceText); ?></span>
                        </label>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php
        }

        if ($insurance !== null) {
            $answer = array_key_exists('travel_insurance', $session) ? self::insuranceAnswer($session['travel_insurance']) : null;
            if ($answer === null && !$insurance['require_choice']) {
                $answer = false;
            }
            if ($insurance['type'] === 'percent') {
                /* translators: %s: percentage */
                $priceText = sprintf(__('%s%% of the trip price', 'yatra'), rtrim(rtrim(number_format($insurance['amount'], 2), '0'), '.'));
            } elseif ($insurance['type'] === 'fixed') {
                /* translators: %s: price */
                $priceText = sprintf(__('%s per booking', 'yatra'), $format($insurance['amount']));
            } else {
                /* translators: %s: price */
                $priceText = sprintf(__('%s per person', 'yatra'), $format($insurance['amount']));
            }
            ?>
            <div class="yatra-booking-section yatra-insurance-section" data-testid="checkout-insurance">
                <h2 class="yatra-section-title"><?php echo esc_html($insurance['title']); ?></h2>
                <?php if ($insurance['description'] !== '') : ?>
                    <p class="yatra-section-description"><?php echo esc_html($insurance['description']); ?></p>
                <?php endif; ?>
                <div class="yatra-choice-list" role="radiogroup" aria-label="<?php echo esc_attr($insurance['title']); ?>">
                    <label class="yatra-choice-option" style="display:flex;gap:10px;align-items:center;padding:10px 12px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;cursor:pointer;">
                        <input type="radio" name="travel_insurance" value="yes" <?php checked($answer === true); ?><?php echo $insurance['require_choice'] ? ' required' : ''; ?>>
                        <span style="flex:1;"><strong><?php esc_html_e('Yes, add it', 'yatra'); ?></strong></span>
                        <span class="yatra-choice-price" style="white-space:nowrap;">+<?php echo esc_html($priceText); ?></span>
                    </label>
                    <label class="yatra-choice-option" style="display:flex;gap:10px;align-items:center;padding:10px 12px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;cursor:pointer;">
                        <input type="radio" name="travel_insurance" value="no" <?php checked($answer === false); ?><?php echo $insurance['require_choice'] ? ' required' : ''; ?>>
                        <span style="flex:1;"><?php esc_html_e('No, I have my own cover or will travel without it', 'yatra'); ?></span>
                    </label>
                </div>
                <?php if ($insurance['terms_url'] !== '') : ?>
                    <p style="margin:4px 0 0;font-size:0.9em;"><a href="<?php echo esc_url($insurance['terms_url']); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('What the insurance covers', 'yatra'); ?></a></p>
                <?php endif; ?>
            </div>
            <?php
        }
    }

    // -- Accommodation ------------------------------------------------------------

    /**
     * @param mixed $raw
     * @return list<array{id:string,name:string,description:string,price:float,price_per:string}>
     */
    public static function sanitizeAccommodation($raw): array
    {
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            $raw = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($raw)) {
            return [];
        }
        $out = [];
        $seen = [];
        foreach ($raw as $row) {
            $row = is_object($row) ? (array) $row : $row;
            if (!is_array($row)) {
                continue;
            }
            $name = trim(sanitize_text_field((string) ($row['name'] ?? '')));
            if ($name === '') {
                continue;
            }
            $id = substr(sanitize_key((string) ($row['id'] ?? '')), 0, 32);
            if ($id === '' || isset($seen[$id])) {
                $id = 'a' . substr(md5($name . '|' . count($out)), 0, 8);
            }
            $seen[$id] = true;
            $per = (string) ($row['price_per'] ?? 'person');
            $price = is_numeric($row['price'] ?? null) ? max(0.0, round((float) $row['price'], 2)) : 0.0;
            $desc = trim(sanitize_textarea_field((string) ($row['description'] ?? '')));
            $out[] = [
                'id' => $id,
                'name' => function_exists('mb_substr') ? mb_substr($name, 0, 120) : substr($name, 0, 120),
                'description' => function_exists('mb_substr') ? mb_substr($desc, 0, 300) : substr($desc, 0, 300),
                'price' => $price,
                'price_per' => $per === 'booking' ? 'booking' : 'person',
            ];
            if (count($out) >= self::MAX_OPTIONS) {
                break;
            }
        }

        return $out;
    }

    /** @return list<array{id:string,name:string,description:string,price:float,price_per:string}> */
    public static function accommodationOptions(int $tripId): array
    {
        return self::loadTrip($tripId)['options'];
    }

    /**
     * The option a checkout ends up with: the chosen one, else the first.
     * Null when the trip has no options. An unknown id gives null too
     * (see validateAccommodation()).
     */
    public static function resolveAccommodation(int $tripId, string $chosen): ?array
    {
        $options = self::accommodationOptions($tripId);
        if ($options === []) {
            return null;
        }
        $chosen = trim($chosen);
        if ($chosen === '') {
            return $options[0];
        }
        foreach ($options as $option) {
            if ($option['id'] === $chosen) {
                return $option;
            }
        }

        return null;
    }

    public static function validateAccommodation(int $tripId, string $chosen): string
    {
        if (self::accommodationOptions($tripId) === [] || trim($chosen) === '') {
            return '';
        }

        return self::resolveAccommodation($tripId, $chosen) === null
            ? __('That accommodation option is no longer available. Please choose another one.', 'yatra')
            : '';
    }

    public static function accommodationAmount(array $option, int $travellers): float
    {
        $amount = $option['price_per'] === 'booking' ? $option['price'] : $option['price'] * max(1, $travellers);

        return round(max(0.0, $amount), 2);
    }

    // -- Travel insurance --------------------------------------------------------

    /** @return array{enabled:bool,title:string,description:string,type:string,amount:float,terms_url:string,require_choice:bool} */
    public static function insuranceSettings(): array
    {
        $type = (string) SettingsService::get('travel_insurance_price_type', 'per_person');
        $type = in_array($type, ['per_person', 'percent', 'fixed'], true) ? $type : 'per_person';
        $amount = max(0.0, (float) SettingsService::get('travel_insurance_amount', 0));
        if ($type === 'percent') {
            $amount = min(100.0, $amount);
        }
        $title = trim((string) SettingsService::get('travel_insurance_title', ''));
        $terms = trim((string) SettingsService::get('travel_insurance_terms_url', ''));

        return [
            'enabled' => SettingsService::isEnabled('travel_insurance_enabled') && $amount > 0,
            'title' => $title !== '' ? $title : __('Travel insurance', 'yatra'),
            'description' => trim((string) SettingsService::get('travel_insurance_description', '')),
            'type' => $type,
            'amount' => $amount,
            'terms_url' => preg_match('#^https?://#i', $terms) ? esc_url_raw($terms) : '',
            'require_choice' => SettingsService::isEnabled('travel_insurance_require_choice'),
        ];
    }

    public static function insuranceOffered(int $tripId): bool
    {
        return $tripId > 0 && self::insuranceSettings()['enabled'] && !self::loadTrip($tripId)['insurance_off'];
    }

    public static function insuranceAmount(int $tripId, float $baseAmount, int $travellers): float
    {
        $s = self::insuranceSettings();
        if ($s['type'] === 'percent') {
            $amount = $baseAmount * $s['amount'] / 100;
        } elseif ($s['type'] === 'fixed') {
            $amount = $s['amount'];
        } else {
            $amount = $s['amount'] * max(1, $travellers);
        }

        /**
         * Travel insurance price for a booking.
         *
         * @since 3.3.0
         * @param float $amount     Price from the settings.
         * @param int   $tripId     Trip.
         * @param float $baseAmount Trip price before discounts.
         * @param int   $travellers Travellers.
         */
        return max(0.0, round((float) apply_filters('yatra_travel_insurance_amount', $amount, $tripId, $baseAmount, $travellers), 2));
    }

    /**
     * Normalise a yes/no answer: true, false, or null (not answered).
     *
     * @param mixed $value
     */
    public static function insuranceAnswer($value): ?bool
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_bool($value)) {
            return $value;
        }
        $v = strtolower(trim((string) $value));
        if (in_array($v, ['1', 'yes', 'true', 'on'], true)) {
            return true;
        }
        if (in_array($v, ['0', 'no', 'false', 'off'], true)) {
            return false;
        }

        return null;
    }

    public static function validateInsurance(int $tripId, ?bool $answer): string
    {
        if (!self::insuranceOffered($tripId) || $answer !== null) {
            return '';
        }

        return self::insuranceSettings()['require_choice']
            ? __('Please choose whether to add travel insurance.', 'yatra')
            : '';
    }

    // -- Pricing ------------------------------------------------------------------

    /** Copy the session's choices into the calculation parameters. @param mixed $params @param mixed $session */
    public static function sessionParams($params, $session = [])
    {
        if (!is_array($params) || !is_array($session) || !empty($session['is_remaining_payment'])) {
            return $params;
        }
        if (isset($session['accommodation']) && is_scalar($session['accommodation'])) {
            $params['accommodation'] = (string) $session['accommodation'];
        }
        if (array_key_exists('travel_insurance', $session)) {
            $params['travel_insurance'] = self::insuranceAnswer($session['travel_insurance']);
        }
        $params['checkout_choices'] = true;

        return $params;
    }

    /** The summary endpoint builds its own session-like data: carry the choices over. @param mixed $calc */
    public static function summaryParams($calc)
    {
        if (!is_array($calc) || !is_array($calc['session_data'] ?? null)) {
            return $calc;
        }
        $session = function_exists('yatra_get_booking_session') ? yatra_get_booking_session() : [];
        if (is_array($session) && (int) ($session['trip_id'] ?? 0) === (int) ($calc['session_data']['trip_id'] ?? -1)) {
            foreach (['accommodation', 'travel_insurance', 'is_remaining_payment'] as $key) {
                if (array_key_exists($key, $session) && !array_key_exists($key, $calc['session_data'])) {
                    $calc['session_data'][$key] = $session[$key];
                }
            }
        }

        return $calc;
    }

    /** @param mixed $params */
    public static function beforeCalculation($params)
    {
        $params = is_array($params) ? $params : [];
        self::$pricing = null;
        // Only checkout pricing (from a booking session) gets the defaults; other
        // callers (trip cards, admin quotes) are left exactly as they were.
        if (empty($params['checkout_choices']) && !array_key_exists('accommodation', $params) && !array_key_exists('travel_insurance', $params)) {
            return $params;
        }
        $tripId = (int) ($params['trip_id'] ?? 0);
        $accommodation = self::resolveAccommodation($tripId, (string) ($params['accommodation'] ?? ''));
        $insurance = array_key_exists('travel_insurance', $params) ? self::insuranceAnswer($params['travel_insurance']) : null;
        self::$pricing = [
            'trip_id' => $tripId,
            'accommodation' => $accommodation,
            'insurance' => $insurance === true && self::insuranceOffered($tripId),
        ];

        return $params;
    }

    /** @param mixed $subtotal @param mixed $context */
    public static function addToSubtotal($subtotal, $context = [])
    {
        $context = is_array($context) ? $context : [];
        $tripId = (int) ($context['trip_id'] ?? 0);
        if (self::$pricing === null || $tripId <= 0 || $tripId !== self::$pricing['trip_id']) {
            return $subtotal;
        }
        $travellers = (int) ($context['travelers_count'] ?? 1);
        $add = 0.0;
        if (self::$pricing['accommodation'] !== null) {
            $add += self::accommodationAmount(self::$pricing['accommodation'], $travellers);
        }
        if (self::$pricing['insurance']) {
            $add += self::insuranceAmount($tripId, (float) ($context['base_amount'] ?? 0), $travellers);
        }

        return $add > 0 ? round((float) $subtotal + $add, 2) : $subtotal;
    }

    /** @param mixed $pricing @param mixed $params */
    public static function addRows($pricing, $params = [])
    {
        if (!is_array($pricing) || self::$pricing === null) {
            return $pricing;
        }
        $tripId = (int) ($pricing['trip_id'] ?? 0);
        if ($tripId !== self::$pricing['trip_id']) {
            return $pricing;
        }
        $travellers = (int) ($pricing['travelers_count'] ?? 1);
        $services = is_array($pricing['additional_services'] ?? null) ? $pricing['additional_services'] : [];

        $option = self::$pricing['accommodation'];
        if ($option !== null) {
            $amount = self::accommodationAmount($option, $travellers);
            $pricing['accommodation'] = [
                'id' => $option['id'],
                'name' => $option['name'],
                'price' => $option['price'],
                'price_per' => $option['price_per'],
                'amount' => $amount,
            ];
            $services[] = [
                'id' => self::ACCOMMODATION_ROW_ID,
                /* translators: %s: accommodation option name */
                'name' => sprintf(__('Accommodation: %s', 'yatra'), $option['name']),
                'price' => $amount,
                'calculated_price' => $amount,
                'selected' => true,
                'is_required' => false,
                'is_included' => $amount <= 0,
                'is_accommodation' => true,
            ];
        }

        if (self::insuranceOffered($tripId)) {
            $answer = array_key_exists('travel_insurance', (array) $params) ? self::insuranceAnswer($params['travel_insurance']) : null;
            $amount = self::$pricing['insurance'] ? self::insuranceAmount($tripId, (float) ($pricing['base_amount'] ?? 0), $travellers) : 0.0;
            $pricing['travel_insurance'] = [
                'title' => self::insuranceSettings()['title'],
                'accepted' => self::$pricing['insurance'],
                'answered' => $answer !== null,
                'amount' => $amount,
            ];
            if (self::$pricing['insurance']) {
                $services[] = [
                    'id' => self::INSURANCE_ROW_ID,
                    'name' => self::insuranceSettings()['title'],
                    'price' => $amount,
                    'calculated_price' => $amount,
                    'selected' => true,
                    'is_required' => false,
                    'is_included' => false,
                    'is_travel_insurance' => true,
                ];
            }
        }
        $pricing['additional_services'] = $services;

        return $pricing;
    }

    // -- Booking ------------------------------------------------------------------

    /** Store a checkout booking's choices (as they were when booked). */
    public static function saveOnBooking(int $bookingId, array $pricing): void
    {
        global $wpdb;
        $acc = is_array($pricing['accommodation'] ?? null) ? $pricing['accommodation'] : null;
        $ins = is_array($pricing['travel_insurance'] ?? null) ? $pricing['travel_insurance'] : null;
        if ($bookingId <= 0 || ($acc === null && ($ins === null || empty($ins['answered'])))) {
            return;
        }
        $table = BookingsTable::getTableName();
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $meta = $wpdb->get_var($wpdb->prepare("SELECT meta FROM `{$table}` WHERE id = %d", $bookingId));
        $decoded = is_string($meta) && $meta !== '' ? json_decode($meta, true) : [];
        $decoded = is_array($decoded) ? $decoded : [];
        if ($acc !== null) {
            $decoded['_accommodation'] = [
                'id' => (string) ($acc['id'] ?? ''),
                'name' => (string) ($acc['name'] ?? ''),
                'price' => (float) ($acc['price'] ?? 0),
                'price_per' => (string) ($acc['price_per'] ?? 'person'),
                'amount' => round((float) ($acc['amount'] ?? 0), 2),
            ];
        }
        if ($ins !== null && !empty($ins['answered'])) {
            // A "no" is kept too: the operator can see the customer declined.
            $decoded['_travel_insurance'] = [
                'title' => (string) ($ins['title'] ?? ''),
                'accepted' => !empty($ins['accepted']),
                'amount' => round((float) ($ins['amount'] ?? 0), 2),
            ];
        }
        $wpdb->update($table, ['meta' => wp_json_encode($decoded)], ['id' => $bookingId], ['%s'], ['%d']);
    }

    /**
     * @param object|int $booking
     * @return array{accommodation: ?array, travel_insurance: ?array}
     */
    public static function forBooking($booking): array
    {
        $meta = null;
        if (is_object($booking) && property_exists($booking, 'meta')) {
            $meta = $booking->meta;
        } else {
            $id = is_object($booking) ? (int) ($booking->id ?? 0) : (int) $booking;
            if ($id > 0) {
                global $wpdb;
                $table = BookingsTable::getTableName();
                // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
                $meta = $wpdb->get_var($wpdb->prepare("SELECT meta FROM `{$table}` WHERE id = %d", $id));
            }
        }
        if (is_string($meta)) {
            $meta = json_decode($meta, true);
        }
        $meta = is_array($meta) ? $meta : [];
        $acc = is_array($meta['_accommodation'] ?? null) && trim((string) ($meta['_accommodation']['name'] ?? '')) !== '' ? $meta['_accommodation'] : null;
        $ins = is_array($meta['_travel_insurance'] ?? null) ? $meta['_travel_insurance'] : null;

        return [
            'accommodation' => $acc === null ? null : [
                'id' => (string) ($acc['id'] ?? ''),
                'name' => (string) $acc['name'],
                'price_per' => (string) ($acc['price_per'] ?? 'person'),
                'amount' => (float) ($acc['amount'] ?? 0),
            ],
            'travel_insurance' => $ins === null ? null : [
                'title' => (string) ($ins['title'] ?? ''),
                'accepted' => !empty($ins['accepted']),
                'amount' => (float) ($ins['amount'] ?? 0),
            ],
        ];
    }

    /** "Added (US$40.00)" / "Declined" / ''. */
    public static function insuranceLabel(?array $insurance): string
    {
        if ($insurance === null) {
            return '';
        }

        return $insurance['accepted'] ? __('Added', 'yatra') : __('Declined', 'yatra');
    }

    /** @param mixed $services @param mixed $bookingId */
    public static function bookingServices($services, $bookingId = 0)
    {
        $services = is_array($services) ? $services : [];
        $bookingId = (int) $bookingId;
        if ($bookingId <= 0) {
            return $services;
        }
        $choices = self::forBooking($bookingId);
        $rows = [];
        if ($choices['accommodation'] !== null) {
            /* translators: %s: accommodation option name */
            $rows[] = [self::ACCOMMODATION_ROW_ID, sprintf(__('Accommodation: %s', 'yatra'), $choices['accommodation']['name']), $choices['accommodation']['amount'], 'is_accommodation'];
        }
        if ($choices['travel_insurance'] !== null && $choices['travel_insurance']['accepted']) {
            $title = $choices['travel_insurance']['title'] !== '' ? $choices['travel_insurance']['title'] : __('Travel insurance', 'yatra');
            $rows[] = [self::INSURANCE_ROW_ID, $title, $choices['travel_insurance']['amount'], 'is_travel_insurance'];
        }
        foreach ($rows as [$id, $name, $amount, $flag]) {
            $services[] = [
                'id' => $id,
                'service_id' => $id,
                'name' => $name,
                'service_name' => $name,
                'quantity' => 1,
                'unit_price' => $amount,
                'price' => $amount,
                'total_price' => $amount,
                'calculated_price' => $amount,
                $flag => true,
            ];
        }

        return $services;
    }

    public static function flush(): void
    {
        self::$tripCache = [];
    }

    /** @return array{options: list<array>, insurance_off: bool} */
    private static function loadTrip(int $tripId): array
    {
        if (isset(self::$tripCache[$tripId])) {
            return self::$tripCache[$tripId];
        }
        $empty = ['options' => [], 'insurance_off' => false];
        if ($tripId <= 0 || !class_exists('\\Yatra\\Repositories\\TripRepository')) {
            return self::$tripCache[$tripId] = $empty;
        }
        $trip = (new \Yatra\Repositories\TripRepository())->find($tripId);
        $fields = $trip->custom_fields ?? null;
        if (is_string($fields)) {
            $decoded = json_decode($fields, true);
            if (!is_array($decoded)) {
                $decoded = maybe_unserialize($fields);
            }
            $fields = is_array($decoded) ? $decoded : [];
        }
        $fields = is_array($fields) ? $fields : (is_object($fields) ? (array) $fields : []);
        $off = $fields['travel_insurance_disabled'] ?? false;

        return self::$tripCache[$tripId] = [
            'options' => self::sanitizeAccommodation($fields['accommodation_options'] ?? []),
            'insurance_off' => $off === true || $off === 1 || $off === '1' || $off === 'true',
        ];
    }
}
