<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\BookingRepository;

/**
 * Payment links: ask a customer to pay any part of a booking's balance.
 *
 * The operator creates a link on the booking screen (an amount up to the
 * balance, an optional note) and copies it or emails it. Whoever opens the
 * link pays that amount by card/PayPal through Yatra's normal balance
 * checkout — no login needed: the link itself is the permission, like the
 * booking confirmation link. It works once, expires after LIFETIME_DAYS, and
 * can be cancelled. The amount is checked again on the server when paying
 * (never more than what is still due).
 *
 * Links live in the booking's meta (`payment_links`), the secret only as a
 * keyed hash. URL: {home}/?yatra_pay={bookingId}.{linkId}.{secret}
 *
 * @since 3.2.0
 */
final class PaymentLinkService
{
    public const LIFETIME_DAYS = 14;
    public const QUERY_ARG = 'yatra_pay';

    /**
     * @return array{success: bool, message?: string, link?: array<string, mixed>, url?: string}
     */
    public static function create(int $bookingId, float $amount, string $note = '', bool $email = false): array
    {
        $repo = new BookingRepository();
        $booking = $repo->find($bookingId);
        if (!$booking) {
            return ['success' => false, 'message' => __('Booking not found.', 'yatra')];
        }
        if (in_array((string) ($booking->status ?? ''), ['cancelled', 'refunded', 'failed'], true)) {
            return ['success' => false, 'message' => __('This booking is cancelled.', 'yatra')];
        }
        $due = self::balance($booking);
        $amount = round($amount, 2);
        if ($amount <= 0) {
            return ['success' => false, 'message' => __('Enter an amount.', 'yatra')];
        }
        if ($amount > $due + 0.009) {
            return ['success' => false, 'message' => sprintf(
                /* translators: %s: balance due. */
                __('That is more than the balance due (%s).', 'yatra'),
                yatra_format_price($due, (string) ($booking->currency ?: SettingsService::getCurrency()), false)
            )];
        }

        if (!self::canPayOnline()) {
            return ['success' => false, 'message' => __('No online payment method is turned on, so the customer could not pay this link. Turn on a card or PayPal payment method first.', 'yatra')];
        }
        // Open links must not ask for more than is owed between them, or a
        // customer paying each one would overpay.
        $requested = 0.0;
        foreach (self::links($booking) as $open) {
            if (self::publicLink($open)['status'] === 'open') {
                $requested += (float) ($open['amount'] ?? 0);
            }
        }
        if ($requested > 0 && $requested + $amount > $due + 0.009) {
            $currency = (string) ($booking->currency ?: SettingsService::getCurrency());
            return ['success' => false, 'message' => sprintf(
                /* translators: 1: amount already requested by open links, 2: balance due, 3: most that can still be requested. */
                __('Open payment links already ask for %1$s of the %2$s balance. Cancel one, or ask for at most %3$s.', 'yatra'),
                yatra_format_price($requested, $currency, false),
                yatra_format_price($due, $currency, false),
                yatra_format_price(max(0.0, $due - $requested), $currency, false)
            )];
        }

        $secret = wp_generate_password(32, false, false);
        $link = [
            'id' => strtolower(wp_generate_password(8, false, false)),
            'hash' => self::hash($secret),
            'amount' => $amount,
            'note' => sanitize_textarea_field($note),
            'status' => 'open',
            'created_at' => current_time('mysql'),
            'expires_at' => gmdate('Y-m-d H:i:s', time() + self::LIFETIME_DAYS * DAY_IN_SECONDS),
            'created_by' => get_current_user_id(),
        ];
        $links = self::links($booking);
        $links[] = $link;
        self::save($bookingId, $links);

        $url = add_query_arg(self::QUERY_ARG, $bookingId . '.' . $link['id'] . '.' . $secret, home_url('/'));
        if ($email) {
            self::email($booking, $link, $url);
        }
        do_action('yatra_payment_link_created', $bookingId, self::publicLink($link), $url);

        return ['success' => true, 'link' => self::publicLink($link), 'url' => $url];
    }

    public static function cancel(int $bookingId, string $linkId): bool
    {
        $booking = (new BookingRepository())->find($bookingId);
        if (!$booking) {
            return false;
        }
        $links = self::links($booking);
        $changed = false;
        foreach ($links as &$link) {
            if (($link['id'] ?? '') === $linkId && ($link['status'] ?? '') === 'open') {
                $link['status'] = 'cancelled';
                $changed = true;
            }
        }
        unset($link);
        if ($changed) {
            self::save($bookingId, $links);
        }

        return $changed;
    }

    /**
     * Links as the booking screen shows them (no secrets).
     *
     * @return array<int, array<string, mixed>>
     */
    public static function forBooking(object $booking): array
    {
        return array_map([self::class, 'publicLink'], self::links($booking));
    }

    /**
     * The open link a URL token points at, with the amount payable now.
     *
     * @return array{booking: object, link: array<string, mixed>, amount: float}|null
     */
    public static function resolve(string $token): ?array
    {
        if (!preg_match('/^(\d+)\.([a-z0-9]{8})\.([A-Za-z0-9]{32})$/', $token, $m)) {
            return null;
        }
        $booking = (new BookingRepository())->find((int) $m[1]);
        if (!$booking || in_array((string) ($booking->status ?? ''), ['cancelled', 'refunded', 'failed'], true)) {
            return null;
        }
        foreach (self::links($booking) as $link) {
            if (($link['id'] ?? '') !== $m[2]) {
                continue;
            }
            if (($link['status'] ?? '') !== 'open' || !hash_equals((string) ($link['hash'] ?? ''), self::hash($m[3]))) {
                return null;
            }
            if (strtotime((string) ($link['expires_at'] ?? '') . ' UTC') < time()) {
                return null;
            }
            $amount = min((float) $link['amount'], self::balance($booking));
            if ($amount <= 0) {
                return null;
            }

            return ['booking' => $booking, 'link' => $link, 'amount' => round($amount, 2)];
        }

        return null;
    }

    /**
     * A payment arrived on a booking: the link being paid (started from the
     * balance checkout) is now paid.
     */
    public static function onPaymentCompleted(int $bookingId, float $amount): void
    {
        $booking = (new BookingRepository())->find($bookingId);
        if (!$booking) {
            return;
        }
        $links = self::links($booking);
        $changed = false;
        $meta = $booking->meta ?? null;
        $meta = is_string($meta) ? json_decode($meta, true) : (is_object($meta) ? json_decode((string) wp_json_encode($meta), true) : $meta);
        $pending = is_array($meta) && is_array($meta['payment_link_pending'] ?? null) ? $meta['payment_link_pending'] : null;
        foreach ($links as &$link) {
            // Only the link whose checkout started this payment, for its amount.
            if ($pending !== null && ($link['id'] ?? '') === ($pending['id'] ?? '') && ($link['status'] ?? '') === 'open'
                && abs($amount - (float) $link['amount']) < 0.01) {
                $link['status'] = 'paid';
                $link['paid_at'] = current_time('mysql');
                $changed = true;
                break;
            }
        }
        unset($link);
        // The balance is settled: no other link can take more money.
        if (self::balance((new BookingRepository())->find($bookingId) ?: $booking) <= 0) {
            foreach ($links as &$link) {
                if (($link['status'] ?? '') === 'open') {
                    $link['status'] = 'cancelled';
                    $changed = true;
                }
            }
            unset($link);
        }
        if ($changed) {
            self::save($bookingId, $links);
        }
    }

    /**
     * The amount an open link still asks for (null: not open any more).
     */
    public static function openAmount(object $booking, string $linkId): ?float
    {
        if (in_array((string) ($booking->status ?? ''), ['cancelled', 'refunded', 'failed'], true)) {
            return null;
        }
        foreach (self::links($booking) as $link) {
            if (($link['id'] ?? '') === $linkId && ($link['status'] ?? '') === 'open'
                && strtotime((string) ($link['expires_at'] ?? '') . ' UTC') >= time()) {
                $amount = min((float) $link['amount'], self::balance($booking));
                return $amount > 0 ? round($amount, 2) : null;
            }
        }

        return null;
    }

    /**
     * Someone opened a payment link: start the balance checkout for its
     * amount and send them there. Invalid/used/expired links get a page
     * saying so.
     */
    public static function handleRequest(): void
    {
        if (!isset($_GET[self::QUERY_ARG]) || !function_exists('yatra_set_remaining_session')) {
            return;
        }
        $token = sanitize_text_field((string) wp_unslash($_GET[self::QUERY_ARG]));
        $resolved = self::resolve($token);
        nocache_headers();
        if ($resolved === null) {
            wp_die(
                esc_html__('This payment link has already been used, was cancelled or has expired. Please contact us for a new one.', 'yatra'),
                esc_html__('Payment link', 'yatra'),
                ['response' => 410, 'back_link' => false]
            );
        }
        $booking = $resolved['booking'];
        $trip = (new \Yatra\Repositories\TripRepository())->find((int) $booking->trip_id);
        $travellers = max(1, (int) ($booking->travelers_count ?? 1));

        yatra_clear_booking_session();
        yatra_set_remaining_session([
            'booking_id' => (int) $booking->id,
            'booking_reference' => (string) ($booking->reference ?? ''),
            'trip_id' => (int) ($booking->trip_id ?? 0),
            'trip_title' => $trip ? (string) $trip->title : '',
            'trip_slug' => $trip ? (string) $trip->slug : '',
            'trip_price' => (float) ($booking->total_amount ?? 0) / $travellers,
            'trip_featured_image' => $trip ? ($trip->featured_image ?? '') : '',
            'currency' => (string) ($booking->currency ?: SettingsService::getCurrency()),
            'travel_date' => (string) ($booking->travel_date ?? ''),
            'travelers' => $travellers,
            // What this link asks for — not necessarily the whole balance.
            'remaining_amount' => $resolved['amount'],
            'amount_paid' => (float) ($booking->amount_paid ?? 0),
            'total_amount' => (float) ($booking->total_amount ?? 0),
            // The whole balance, shown beside the requested amount.
            'balance_due' => self::balance($booking),
            'contact_first_name' => (string) ($booking->contact_first_name ?? ''),
            'contact_last_name' => (string) ($booking->contact_last_name ?? ''),
            'contact_email' => (string) ($booking->contact_email ?? ''),
            'contact_phone' => (string) ($booking->contact_phone ?? ''),
            'payment_link_id' => (string) $resolved['link']['id'],
        ]);

        $url = yatra_get_checkout_url();
        if ($trip && !empty($trip->slug) && SettingsService::useCustomBookingPage()) {
            $url = add_query_arg('trip', rawurlencode((string) $trip->slug), $url);
        }
        wp_safe_redirect($url);
        exit;
    }

    /**
     * The link's checkout is about to charge. Only one checkout may be paying
     * a link at a time (another tab, a forwarded link): a second one from a
     * different browser session is refused for 30 minutes; the same session
     * may retry (e.g. after a declined card).
     *
     * @return bool False when another checkout is already paying this link.
     */
    public static function start(int $bookingId, string $linkId, string $sessionKey): bool
    {
        $booking = (new BookingRepository())->find($bookingId);
        if (!$booking) {
            return false;
        }
        $links = self::links($booking);
        $now = time();
        foreach ($links as &$link) {
            if (($link['id'] ?? '') !== $linkId) {
                continue;
            }
            $busy = !empty($link['started_at']) && $now - (int) strtotime((string) $link['started_at']) < 30 * MINUTE_IN_SECONDS
                && (string) ($link['session'] ?? '') !== '' && (string) ($link['session'] ?? '') !== $sessionKey;
            if ($busy) {
                return false;
            }
            $link['started_at'] = current_time('mysql');
            $link['session'] = $sessionKey;
        }
        unset($link);
        self::save($bookingId, $links);
        // The next payment of this amount on this booking is this link's.
        self::setPending($bookingId, $linkId);

        return true;
    }

    private static function setPending(int $bookingId, string $linkId): void
    {
        $repo = new BookingRepository();
        $booking = $repo->find($bookingId);
        if (!$booking) {
            return;
        }
        $meta = $booking->meta ?? null;
        if (is_string($meta)) {
            $meta = json_decode($meta, true);
        } elseif (is_object($meta)) {
            $meta = json_decode((string) wp_json_encode($meta), true);
        }
        $meta = is_array($meta) ? $meta : [];
        $meta['payment_link_pending'] = ['id' => $linkId, 'at' => time()];
        $repo->update($bookingId, ['meta' => $meta]);
    }

    public static function balance(object $booking): float
    {
        $due = (float) ($booking->amount_due ?? 0);
        if ($due <= 0) {
            $due = max(0.0, (float) ($booking->total_amount ?? 0) - (float) ($booking->amount_paid ?? 0));
        }

        return round(max(0.0, $due), 2);
    }

    /**
     * Whether a link could be paid at all: a balance needs a payment method
     * that takes money now (the same rule the balance checkout applies).
     */
    public static function canPayOnline(): bool
    {
        if (!class_exists('Yatra\\PaymentGateways\\PaymentGatewayRegistry')) {
            return false;
        }
        try {
            $registry = \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance();
            foreach ((array) $registry->getForCheckout() as $gateway) {
                $id = (string) ($gateway['id'] ?? '');
                if ($id === '') {
                    continue;
                }
                $gw = $registry->get($id);
                $offline = $gw && method_exists($gw, 'isOffline') ? $gw->isOffline() : in_array($id, ['pay_later', 'bank_transfer'], true);
                if (!$offline || apply_filters('yatra_remaining_payment_allow_offline_gateway', false, $id, null)) {
                    return true;
                }
            }
        } catch (\Throwable $e) {
            return false;
        }

        return false;
    }

    /** @return array<int, array<string, mixed>> */
    private static function links(object $booking): array
    {
        $meta = $booking->meta ?? null;
        if (is_string($meta)) {
            $meta = json_decode($meta, true);
        } elseif (is_object($meta)) {
            $meta = json_decode((string) wp_json_encode($meta), true);
        }

        return is_array($meta) && is_array($meta['payment_links'] ?? null) ? array_values($meta['payment_links']) : [];
    }

    /** @param array<int, array<string, mixed>> $links */
    private static function save(int $bookingId, array $links): void
    {
        $repo = new BookingRepository();
        $booking = $repo->find($bookingId);
        if (!$booking) {
            return;
        }
        $meta = $booking->meta ?? null;
        if (is_string($meta)) {
            $meta = json_decode($meta, true);
        } elseif (is_object($meta)) {
            $meta = json_decode((string) wp_json_encode($meta), true);
        }
        $meta = is_array($meta) ? $meta : [];
        $meta['payment_links'] = array_values($links);
        $repo->update($bookingId, ['meta' => $meta]);
    }

    /**
     * @param array<string, mixed> $link
     * @return array<string, mixed>
     */
    private static function publicLink(array $link): array
    {
        $status = (string) ($link['status'] ?? 'open');
        if ($status === 'open' && strtotime((string) ($link['expires_at'] ?? '') . ' UTC') < time()) {
            $status = 'expired';
        }

        return [
            'id' => (string) ($link['id'] ?? ''),
            'amount' => (float) ($link['amount'] ?? 0),
            'note' => (string) ($link['note'] ?? ''),
            'status' => $status,
            'created_at' => (string) ($link['created_at'] ?? ''),
            'expires_at' => (string) ($link['expires_at'] ?? ''),
            'paid_at' => (string) ($link['paid_at'] ?? ''),
        ];
    }

    private static function hash(string $secret): string
    {
        return hash_hmac('sha256', $secret, wp_salt('nonce'));
    }

    /**
     * @param array<string, mixed> $link
     */
    private static function email(object $booking, array $link, string $url): void
    {
        /** This filter is documented in TransactionalEmailTemplateService::sendIfEnabled(). */
        $to = apply_filters('yatra_transactional_email_recipients', (string) ($booking->contact_email ?? ''), 'payment_link', ['booking_id' => (string) $booking->id]);
        // A filter may return several addresses (e.g. agency and guest).
        $recipients = [];
        foreach ((array) $to as $address) {
            $address = sanitize_email((string) $address);
            if ($address !== '' && is_email($address)) {
                $recipients[strtolower($address)] = $address;
            }
        }
        if ($recipients === []) {
            return;
        }
        $currency = (string) ($booking->currency ?: SettingsService::getCurrency());
        $amount = yatra_format_price((float) $link['amount'], $currency, false);
        $name = trim((string) ($booking->contact_first_name ?? ''));
        $inner = '<p>' . esc_html($name !== '' ? sprintf(
            /* translators: %s: customer first name. */
            __('Hello %s,', 'yatra'),
            $name
        ) : __('Hello,', 'yatra')) . '</p>'
            . '<p>' . esc_html(sprintf(
                /* translators: 1: amount, 2: booking reference. */
                __('Please pay %1$s towards your booking %2$s.', 'yatra'),
                $amount,
                (string) $booking->reference
            )) . '</p>'
            . ((string) $link['note'] !== '' ? '<p>' . nl2br(esc_html((string) $link['note'])) . '</p>' : '')
            . EmailTemplateLayout::button($url, __('Pay now', 'yatra'))
            . '<p style="color:#6b7280;font-size:12px;">' . esc_html(sprintf(
                /* translators: %d: number of days. */
                __('This link can be used once and expires in %d days.', 'yatra'),
                self::LIFETIME_DAYS
            )) . '</p>';
        $html = EmailTemplateLayout::customer('', __('Payment request', 'yatra'), $inner, (string) get_bloginfo('name'));
        $subject = sprintf(
            /* translators: 1: amount, 2: booking reference. */
            __('Payment request: %1$s for booking %2$s', 'yatra'),
            $amount,
            (string) $booking->reference
        );
        foreach ($recipients as $address) {
            EmailService::send($address, $subject, $html, ['Content-Type: text/html; charset=UTF-8']);
        }
    }
}
