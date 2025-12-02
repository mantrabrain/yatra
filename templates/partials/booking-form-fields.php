<?php
/**
 * Booking Form Fields Partial
 * 
 * Dynamically renders form fields based on saved configuration from Settings -> Booking Form
 * All form fields, sections, and their properties are controlled by the admin form builder.
 * 
 * @package Yatra
 * 
 * Expected variables:
 * - $trip_id
 * - $trip_slug (optional)
 * - $total_travelers
 * - $deposit_required
 * - $deposit_percentage
 * - $partial_payment
 * - $partial_payment_percentage
 * - $enabled_gateways
 * 
 * Form Configuration Structure:
 * - contact_form: Lead traveler contact information (prefix: contact_)
 * - emergency_contact_form: Emergency contact details (prefix: emergency_)
 * - traveler_form: Individual traveler details (array format: travelers[1][field_id])
 */

if (!defined('ABSPATH')) {
    exit;
}

// Get form configuration from Settings -> Booking Form builder
$form_config = yatra_get_booking_form_config();

// Country list for country type fields
$countries = [
    'AF' => 'Afghanistan', 'AL' => 'Albania', 'DZ' => 'Algeria', 'AR' => 'Argentina',
    'AU' => 'Australia', 'AT' => 'Austria', 'BD' => 'Bangladesh', 'BE' => 'Belgium',
    'BR' => 'Brazil', 'BT' => 'Bhutan', 'CA' => 'Canada', 'CN' => 'China',
    'CO' => 'Colombia', 'CZ' => 'Czech Republic', 'DK' => 'Denmark', 'EG' => 'Egypt',
    'FI' => 'Finland', 'FR' => 'France', 'DE' => 'Germany', 'GR' => 'Greece',
    'HK' => 'Hong Kong', 'HU' => 'Hungary', 'IS' => 'Iceland', 'IN' => 'India',
    'ID' => 'Indonesia', 'IE' => 'Ireland', 'IL' => 'Israel', 'IT' => 'Italy',
    'JP' => 'Japan', 'KE' => 'Kenya', 'KR' => 'South Korea', 'MY' => 'Malaysia',
    'MV' => 'Maldives', 'MX' => 'Mexico', 'NL' => 'Netherlands', 'NZ' => 'New Zealand',
    'NP' => 'Nepal', 'NO' => 'Norway', 'PK' => 'Pakistan', 'PE' => 'Peru',
    'PH' => 'Philippines', 'PL' => 'Poland', 'PT' => 'Portugal', 'RO' => 'Romania',
    'RU' => 'Russia', 'SA' => 'Saudi Arabia', 'SG' => 'Singapore', 'ZA' => 'South Africa',
    'ES' => 'Spain', 'LK' => 'Sri Lanka', 'SE' => 'Sweden', 'CH' => 'Switzerland',
    'TW' => 'Taiwan', 'TH' => 'Thailand', 'TR' => 'Turkey', 'AE' => 'United Arab Emirates',
    'GB' => 'United Kingdom', 'US' => 'United States', 'VN' => 'Vietnam'
];

/**
 * Render a single form field based on configuration
 * 
 * @param array $field Field configuration
 * @param string $prefix Field name prefix (e.g., 'contact_', 'emergency_')
 * @param array $countries Country list for country fields
 * @param string $custom_name Optional custom field name (for array-style names like travelers[1][field_id])
 * @param string $custom_id Optional custom field ID
 */
function yatra_render_form_field($field, $prefix = '', $countries = [], $custom_name = null, $custom_id = null) {
    if (empty($field['enabled'])) {
        return;
    }
    
    $field_id = $custom_id ? esc_attr($custom_id) : esc_attr($prefix . $field['id']);
    $field_name = $custom_name ? esc_attr($custom_name) : esc_attr($prefix . $field['id']);
    $required = !empty($field['required']);
    $required_attr = $required ? 'required' : '';
    $required_star = $required ? '<span class="required">*</span>' : '';
    
    $width_class = '';
    if (!empty($field['width'])) {
        switch ($field['width']) {
            case 'half':
                $width_class = 'yatra-field-half';
                break;
            case 'third':
                $width_class = 'yatra-field-third';
                break;
            default:
                $width_class = 'yatra-field-full';
        }
    }
    ?>
    <div class="yatra-form-group <?php echo esc_attr($width_class); ?>">
        <label for="<?php echo $field_id; ?>">
            <?php echo esc_html($field['label']); ?> <?php echo $required_star; ?>
        </label>
        <?php
        switch ($field['type']) {
            case 'select':
                ?>
                <select id="<?php echo $field_id; ?>" name="<?php echo $field_name; ?>" <?php echo $required_attr; ?>>
                    <option value=""><?php echo esc_html($field['placeholder'] ?? 'Select...'); ?></option>
                    <?php if (!empty($field['options'])) : ?>
                        <?php foreach ($field['options'] as $option) : ?>
                            <option value="<?php echo esc_attr($option['value']); ?>">
                                <?php echo esc_html($option['label']); ?>
                            </option>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </select>
                <?php
                break;
                
            case 'country':
                ?>
                <select id="<?php echo $field_id; ?>" name="<?php echo $field_name; ?>" <?php echo $required_attr; ?>>
                    <option value=""><?php echo esc_html($field['placeholder'] ?? 'Select Country'); ?></option>
                    <?php foreach ($countries as $code => $name) : ?>
                        <option value="<?php echo esc_attr($code); ?>">
                            <?php echo esc_html($name); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <?php
                break;
                
            case 'textarea':
                ?>
                <textarea 
                    id="<?php echo $field_id; ?>" 
                    name="<?php echo $field_name; ?>" 
                    placeholder="<?php echo esc_attr($field['placeholder'] ?? ''); ?>"
                    <?php echo $required_attr; ?>
                    rows="3"
                ></textarea>
                <?php
                break;
                
            case 'date':
                $min_attr = '';
                if ($field['id'] === 'passport_expiry') {
                    $min_date = date('Y-m-d', strtotime('+6 months'));
                    $min_attr = 'min="' . esc_attr($min_date) . '"';
                }
                ?>
                <input 
                    type="date" 
                    id="<?php echo $field_id; ?>" 
                    name="<?php echo $field_name; ?>"
                    <?php echo $min_attr; ?>
                    <?php echo $required_attr; ?>
                >
                <?php
                break;
                
            default: // text, email, tel, number
                ?>
                <input 
                    type="<?php echo esc_attr($field['type']); ?>" 
                    id="<?php echo $field_id; ?>" 
                    name="<?php echo $field_name; ?>" 
                    placeholder="<?php echo esc_attr($field['placeholder'] ?? ''); ?>"
                    <?php echo $required_attr; ?>
                >
                <?php
                break;
        }
        ?>
    </div>
    <?php
}

/**
 * Render a form section with all its fields
 */
function yatra_render_form_section($section_config, $prefix = '', $countries = []) {
    if (isset($section_config['enabled']) && !$section_config['enabled']) {
        return;
    }
    
    $fields = $section_config['fields'] ?? [];
    
    // Sort fields by order
    usort($fields, function($a, $b) {
        return ($a['order'] ?? 0) - ($b['order'] ?? 0);
    });
    
    // Group fields by section (for subsections like passport, dietary)
    $grouped_fields = [];
    $current_section = null;
    
    foreach ($fields as $field) {
        if (!empty($field['enabled'])) {
            $section = $field['section'] ?? 'main';
            if (!isset($grouped_fields[$section])) {
                $grouped_fields[$section] = [];
            }
            $grouped_fields[$section][] = $field;
        }
    }
    ?>
    <div class="yatra-booking-section">
        <h2 class="yatra-section-title"><?php echo esc_html($section_config['title'] ?? ''); ?></h2>
        <?php if (!empty($section_config['description'])) : ?>
            <p class="yatra-section-description"><?php echo esc_html($section_config['description']); ?></p>
        <?php endif; ?>
        
        <?php foreach ($grouped_fields as $section_key => $section_fields) : ?>
            <?php if ($section_key !== 'main') : ?>
                <div class="yatra-traveler-subsection">
                    <h4 class="yatra-subsection-title">
                        <?php
                        switch ($section_key) {
                            case 'passport':
                                esc_html_e('Passport Details', 'yatra');
                                break;
                            case 'dietary_medical':
                                esc_html_e('Dietary & Medical Requirements', 'yatra');
                                break;
                            default:
                                echo esc_html(ucwords(str_replace('_', ' ', $section_key)));
                        }
                        ?>
                    </h4>
            <?php endif; ?>
            
            <div class="yatra-form-row">
                <?php foreach ($section_fields as $field) : ?>
                    <?php yatra_render_form_field($field, $prefix, $countries); ?>
                <?php endforeach; ?>
            </div>
            
            <?php if ($section_key !== 'main') : ?>
                </div>
            <?php endif; ?>
        <?php endforeach; ?>
    </div>
    <?php
}
?>

<!-- Hidden Fields -->
<input type="hidden" name="trip_id" value="<?php echo esc_attr($trip_id); ?>">
<?php if (!empty($trip_slug)) : ?>
<input type="hidden" name="trip_slug" value="<?php echo esc_attr($trip_slug); ?>">
<?php endif; ?>

<?php if ($is_remaining_payment) : ?>
    <input type="hidden" name="is_remaining_payment" value="1">
    <?php if (!empty($existing_booking_id)) : ?>
        <input type="hidden" name="existing_booking_id" value="<?php echo esc_attr($existing_booking_id); ?>">
    <?php endif; ?>
    <?php if (!empty($booking_reference)) : ?>
        <input type="hidden" name="booking_reference" value="<?php echo esc_attr($booking_reference); ?>">
    <?php endif; ?>
    <?php if ($remaining_amount !== null) : ?>
        <input type="hidden" name="remaining_amount" value="<?php echo esc_attr($remaining_amount); ?>">
    <?php endif; ?>
    <?php if (!empty($booking->amount_paid)) : ?>
        <input type="hidden" name="amount_paid" value="<?php echo esc_attr($booking->amount_paid); ?>">
    <?php endif; ?>
    <?php if (!empty($booking->total_amount)) : ?>
        <input type="hidden" name="total_amount" value="<?php echo esc_attr($booking->total_amount); ?>">
    <?php endif; ?>
<?php endif; ?>

<?php if (!$is_remaining_payment) : ?>
    <!-- Contact Form Section -->
    <?php 
    $contact_config = $form_config['contact_form'] ?? [];
    if (!empty($contact_config)) {
        yatra_render_form_section($contact_config, 'contact_', $countries);
    }
    ?>

    <!-- Emergency Contact Section -->
    <?php 
    $emergency_config = $form_config['emergency_contact_form'] ?? [];
    if (!empty($emergency_config) && (!isset($emergency_config['enabled']) || $emergency_config['enabled'])) {
        yatra_render_form_section($emergency_config, 'emergency_', $countries);
    }
    ?>

    <!-- Traveler Information Section -->
    <?php 
    $traveler_config = $form_config['traveler_form'] ?? [];
    ?>
<?php endif; ?>

<?php 
$traveler_config = $form_config['traveler_form'] ?? [];
$traveler_count = isset($total_travelers) ? max(1, (int)$total_travelers) : 1;

// Check if we have traveler-based pricing info
$pricing_type = isset($pricing_type) ? $pricing_type : 'regular';
$price_types = isset($price_types) ? $price_types : [];
$traveler_counts = isset($traveler_counts) ? $traveler_counts : [];

// Build traveler-to-category mapping for traveler-based pricing
$traveler_category_map = [];
if ($pricing_type === 'traveler_based' && !empty($price_types) && !empty($traveler_counts)) {
    $traveler_index = 1;
    foreach ($price_types as $index => $pt) {
        $pt = (object) $pt;
        $category_id = $pt->category_id ?? $index;
        $category_label = $pt->category_label ?? __('Traveler', 'yatra');
        $count = isset($traveler_counts[$category_id]) ? (int) $traveler_counts[$category_id] : 0;
        
        for ($c = 1; $c <= $count; $c++) {
            $traveler_category_map[$traveler_index] = [
                'category_id' => $category_id,
                'category_label' => $category_label,
                'category_index' => $c,
            ];
            $traveler_index++;
        }
    }
}

$price_candidates = [
    isset($trip->price) ? (float) $trip->price : 0,
    isset($booking->session_price) ? (float) $booking->session_price : 0,
    isset($trip->sale_price) ? (float) $trip->sale_price : 0,
    isset($trip->original_price) ? (float) $trip->original_price : 0,
];

$effective_trip_price = 0;
foreach ($price_candidates as $candidate) {
    if ($candidate > 0) {
        $effective_trip_price = $candidate;
        break;
    }
}

$traveler_price_rows = [];
$calculated_total = 0;

if ($pricing_type === 'traveler_based' && !empty($price_types)) {
    foreach ($price_types as $index => $pt) {
        $pt = (object) $pt;
        $category_id = $pt->category_id ?? $index;
        $category_label = $pt->category_label ?? __('Traveler', 'yatra');
        $category_price = isset($pt->effective_price) ? (float) $pt->effective_price : ($pt->sale_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
        $count = isset($traveler_counts[$category_id]) ? (int) $traveler_counts[$category_id] : ($index === 0 ? 1 : 0);
        $subtotal = $category_price * $count;

        $age_info = '';
        if (isset($pt->age_min) || isset($pt->age_max)) {
            if (isset($pt->age_min) && isset($pt->age_max)) {
                $age_info = sprintf(__('(Age %d-%d)', 'yatra'), $pt->age_min, $pt->age_max);
            } elseif (isset($pt->age_min)) {
                $age_info = sprintf(__('(Age %d+)', 'yatra'), $pt->age_min);
            } else {
                $age_info = sprintf(__('(Up to age %d)', 'yatra'), $pt->age_max);
            }
        }

        $traveler_price_rows[] = [
            'category_id' => $category_id,
            'category_label' => $category_label,
            'category_price' => $category_price,
            'count' => $count,
            'subtotal' => $subtotal,
            'age_info' => $age_info,
        ];

        $calculated_total += $subtotal;

        if ($effective_trip_price <= 0 && $category_price > 0) {
            $effective_trip_price = $category_price;
        }
    }
}

if ($effective_trip_price <= 0) {
    $effective_trip_price = 0;
}

$initial_total_amount = $calculated_total > 0
    ? $calculated_total
    : ($effective_trip_price * max(1, (int) $total_travelers));

if ($initial_total_amount <= 0 && $effective_trip_price > 0) {
    $initial_total_amount = $effective_trip_price * max(1, (int) $total_travelers);
}

$initial_due_amount = $initial_total_amount;

?>

<?php if (!empty($traveler_config) && !$is_remaining_payment) : ?>
<div class="yatra-booking-section">
    <h2 class="yatra-section-title"><?php echo esc_html($traveler_config['title'] ?? __('Traveler Information', 'yatra')); ?></h2>
    <?php if (!empty($traveler_config['description'])) : ?>
        <p class="yatra-section-description"><?php echo esc_html($traveler_config['description']); ?></p>
    <?php endif; ?>
    
    <div id="yatra-travelers-container">
        <?php 
        $traveler_fields = $traveler_config['fields'] ?? [];
        usort($traveler_fields, function($a, $b) {
            return ($a['order'] ?? 0) - ($b['order'] ?? 0);
        });
        
        // Group fields by section
        $grouped_traveler_fields = [];
        foreach ($traveler_fields as $field) {
            if (!empty($field['enabled'])) {
                $section = $field['section'] ?? 'main';
                if (!isset($grouped_traveler_fields[$section])) {
                    $grouped_traveler_fields[$section] = [];
                }
                $grouped_traveler_fields[$section][] = $field;
            }
        }
        
        for ($i = 1; $i <= $traveler_count; $i++) : 
            // Determine traveler label based on category if traveler-based pricing
            if (!empty($traveler_category_map[$i])) {
                $category_info = $traveler_category_map[$i];
                $category_label = $category_info['category_label'];
                $category_index = $category_info['category_index'];
                $traveler_label = sprintf(__('%s %d', 'yatra'), $category_label, $category_index);
                if ($i === 1) {
                    $traveler_label .= ' (' . __('Lead Traveler', 'yatra') . ')';
                }
            } else {
            $traveler_label = ($i === 1) ? __('Traveler 1 (Lead Traveler)', 'yatra') : sprintf(__('Traveler %d', 'yatra'), $i);
            }
        ?>
        <div class="yatra-traveler-form" data-traveler-index="<?php echo esc_attr($i); ?>" <?php if (!empty($traveler_category_map[$i])): ?>data-category-id="<?php echo esc_attr($traveler_category_map[$i]['category_id']); ?>" data-category-label="<?php echo esc_attr($traveler_category_map[$i]['category_label']); ?>"<?php endif; ?>>
            <div class="yatra-traveler-header">
                <h3 class="yatra-traveler-title"><?php echo esc_html($traveler_label); ?></h3>
                <?php if ($i > 1) : ?>
                    <span class="yatra-traveler-note"><?php esc_html_e('Additional traveler', 'yatra'); ?></span>
                <?php endif; ?>
            </div>
            
            <?php foreach ($grouped_traveler_fields as $section_key => $section_fields) : ?>
                <?php if ($section_key !== 'main') : ?>
                    <div class="yatra-traveler-subsection">
                        <h4 class="yatra-subsection-title">
                            <?php
                            switch ($section_key) {
                                case 'passport':
                                    esc_html_e('Passport Details', 'yatra');
                                    break;
                                case 'dietary_medical':
                                    esc_html_e('Dietary & Medical Requirements', 'yatra');
                                    break;
                                default:
                                    echo esc_html(ucwords(str_replace('_', ' ', $section_key)));
                            }
                            ?>
                        </h4>
                <?php endif; ?>
                
                <div class="yatra-form-row">
                    <?php foreach ($section_fields as $field) : 
                        $field_id = "traveler-{$i}-" . esc_attr($field['id']);
                        $field_name = "travelers[{$i}][" . esc_attr($field['id']) . "]";
                        yatra_render_form_field($field, '', $countries, $field_name, $field_id);
                    endforeach; ?>
                </div>
                
                <?php if ($section_key !== 'main') : ?>
                    </div>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>
        <?php endfor; ?>
    </div>
</div>
<?php endif; ?>

<!-- Payment Method Section -->
<?php if (!$is_remaining_payment && ($deposit_required || $partial_payment)) : ?>
<div class="yatra-booking-section">
    <h2 class="yatra-section-title"><?php esc_html_e('Payment Method', 'yatra'); ?></h2>
    
    <div class="yatra-payment-methods">
        <label class="yatra-payment-option">
            <input type="radio" name="payment_method" value="full" checked>
            <span class="yatra-payment-label">
                <strong><?php esc_html_e('Pay in Full', 'yatra'); ?></strong>
                <span><?php esc_html_e('Pay the total amount now', 'yatra'); ?></span>
            </span>
        </label>
        
        <?php if ($deposit_required) : ?>
        <label class="yatra-payment-option">
            <input type="radio" name="payment_method" value="deposit">
            <span class="yatra-payment-label">
                <strong><?php printf(esc_html__('Pay %d%% Deposit', 'yatra'), (int) $deposit_percentage); ?></strong>
                <span><?php esc_html_e('Pay deposit now, rest later', 'yatra'); ?></span>
            </span>
        </label>
        <?php endif; ?>
        
        <?php if ($partial_payment) : ?>
        <label class="yatra-payment-option">
            <input type="radio" name="payment_method" value="partial">
            <span class="yatra-payment-label">
                <strong><?php printf(esc_html__('Pay %d%% Now', 'yatra'), (int) $partial_payment_percentage); ?></strong>
                <span><?php esc_html_e('Partial payment option', 'yatra'); ?></span>
            </span>
        </label>
        <?php endif; ?>
    </div>
</div>
<?php endif; ?>

<!-- Payment Gateway Section -->
<?php if (!empty($enabled_gateways)) : ?>
<div class="yatra-booking-section">
    <h2 class="yatra-section-title"><?php esc_html_e('Select Payment Gateway', 'yatra'); ?></h2>
    
    <div class="yatra-gateway-options">
        <?php 
        $first = true;
        foreach ($enabled_gateways as $gateway_id => $gateway) : 
            $icon = !empty($gateway['icon']) ? $gateway['icon'] : plugins_url('public/images/payment-placeholder.png', dirname(__DIR__));
        ?>
        <div class="yatra-gateway-option-wrapper">
            <label class="yatra-gateway-option">
                <input type="radio" name="payment_gateway" value="<?php echo esc_attr($gateway_id); ?>" <?php checked($first); ?>>
                <span class="yatra-gateway-icon-wrap">
                    <img src="<?php echo esc_url($icon); ?>" alt="<?php echo esc_attr($gateway['title']); ?>" class="yatra-gateway-icon">
                </span>
                <span class="yatra-gateway-content">
                    <strong class="yatra-gateway-title"><?php echo esc_html($gateway['title']); ?></strong>
                    <span class="yatra-gateway-desc"><?php echo esc_html($gateway['description']); ?></span>
                </span>
            </label>
            <div class="yatra-gateway-extra" id="yatra-gateway-extra-<?php echo esc_attr($gateway_id); ?>" data-gateway="<?php echo esc_attr($gateway_id); ?>"></div>
        </div>
        <?php 
        $first = false;
        endforeach; 
        ?>
    </div>
</div>
<?php endif; ?>

<?php if (!$is_remaining_payment) : ?>
    <!-- Special Requests -->
    <div class="yatra-booking-section">
        <h2 class="yatra-section-title"><?php esc_html_e('Special Requests', 'yatra'); ?></h2>
        <p class="yatra-section-description"><?php esc_html_e('Any special requests or notes for your trip (optional)', 'yatra'); ?></p>
        
        <div class="yatra-form-group yatra-field-full">
            <textarea 
                id="special-requests" 
                name="special_requests" 
                rows="4" 
                placeholder="<?php esc_attr_e('E.g., dietary requirements, accessibility needs, celebration requests...', 'yatra'); ?>"
            ></textarea>
        </div>
    </div>
<?php endif; ?>

<!-- Account Creation Section (only for guests) -->
<?php 
$allow_guest_checkout = \Yatra\Services\SettingsService::isEnabled('allow_guest_checkout');
$require_login = \Yatra\Services\SettingsService::isEnabled('require_login');

// Show account section if user is not logged in
if (!is_user_logged_in() && !$is_remaining_payment) : 
?>
<div class="yatra-booking-section yatra-account-section">
    <h2 class="yatra-section-title"><?php esc_html_e('Account', 'yatra'); ?></h2>
    
    <?php if ($require_login) : ?>
        <!-- Login Required Message -->
        <div class="yatra-login-required-notice" style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" style="flex-shrink: 0;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div>
                    <p style="font-weight: 600; color: #92400e; margin: 0 0 8px 0;"><?php esc_html_e('Login Required', 'yatra'); ?></p>
                    <p style="color: #a16207; margin: 0 0 12px 0; font-size: 14px;">
                        <?php esc_html_e('You must be logged in to complete this booking. Please log in or create an account.', 'yatra'); ?>
                    </p>
                    <a href="<?php echo esc_url(wp_login_url(get_permalink())); ?>" class="yatra-login-btn" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                        </svg>
                        <?php esc_html_e('Log In', 'yatra'); ?>
                    </a>
                    <span style="margin: 0 12px; color: #a16207;"><?php esc_html_e('or', 'yatra'); ?></span>
                    <a href="<?php echo esc_url(wp_registration_url()); ?>" style="color: #3b82f6; text-decoration: none; font-weight: 500;">
                        <?php esc_html_e('Create an Account', 'yatra'); ?>
                    </a>
                </div>
            </div>
        </div>
        <input type="hidden" name="login_required" value="1">
        
    <?php elseif (!$allow_guest_checkout) : ?>
        <!-- Account Required - Must Create Account -->
        <p class="yatra-section-description" style="margin-bottom: 16px;">
            <?php esc_html_e('Please create an account to complete your booking. This allows you to manage your bookings and receive important updates.', 'yatra'); ?>
        </p>
        
        <div class="yatra-form-row">
            <div class="yatra-form-group yatra-field-half">
                <label for="account_password">
                    <?php esc_html_e('Password', 'yatra'); ?> <span class="required">*</span>
                </label>
                <input type="password" id="account_password" name="account_password" required minlength="8" 
                       placeholder="<?php esc_attr_e('Minimum 8 characters', 'yatra'); ?>">
            </div>
            <div class="yatra-form-group yatra-field-half">
                <label for="account_password_confirm">
                    <?php esc_html_e('Confirm Password', 'yatra'); ?> <span class="required">*</span>
                </label>
                <input type="password" id="account_password_confirm" name="account_password_confirm" required minlength="8"
                       placeholder="<?php esc_attr_e('Re-enter password', 'yatra'); ?>">
            </div>
        </div>
        <p class="yatra-field-hint" style="font-size: 13px; color: #6b7280; margin-top: 8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
            </svg>
            <?php esc_html_e('Your email address will be used as your username.', 'yatra'); ?>
        </p>
        <input type="hidden" name="create_account" value="1">
        
    <?php else : ?>
        <!-- Guest Checkout Allowed - Optional Account Creation -->
        <p class="yatra-section-description" style="margin-bottom: 16px;">
            <?php esc_html_e('Create an account to easily manage your bookings and receive travel updates.', 'yatra'); ?>
        </p>
        
        <label class="yatra-checkbox-label" style="margin-bottom: 16px;">
            <input type="checkbox" name="create_account" id="create-account" value="1">
            <span><?php esc_html_e('Create an account for easier booking management', 'yatra'); ?></span>
        </label>
        
        <div class="yatra-account-fields" id="yatra-account-fields" style="display: none;">
            <div class="yatra-form-row">
                <div class="yatra-form-group yatra-field-half">
                    <label for="account_password">
                        <?php esc_html_e('Password', 'yatra'); ?> <span class="required">*</span>
                    </label>
                    <input type="password" id="account_password" name="account_password" minlength="8"
                           placeholder="<?php esc_attr_e('Minimum 8 characters', 'yatra'); ?>">
                </div>
                <div class="yatra-form-group yatra-field-half">
                    <label for="account_password_confirm">
                        <?php esc_html_e('Confirm Password', 'yatra'); ?> <span class="required">*</span>
                    </label>
                    <input type="password" id="account_password_confirm" name="account_password_confirm" minlength="8"
                           placeholder="<?php esc_attr_e('Re-enter password', 'yatra'); ?>">
                </div>
            </div>
            <p class="yatra-field-hint" style="font-size: 13px; color: #6b7280; margin-top: 8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                </svg>
                <?php esc_html_e('Your email address will be used as your username.', 'yatra'); ?>
            </p>
        </div>
    <?php endif; ?>
</div>
<?php elseif (!is_user_logged_in()) : ?>
    <!-- User is logged in -->
    <div class="yatra-booking-section yatra-logged-in-notice">
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div>
                <span style="font-weight: 500; color: #065f46;">
                    <?php 
                    $current_user = wp_get_current_user();
                    printf(
                        /* translators: %s: User display name */
                        esc_html__('Logged in as %s', 'yatra'),
                        '<strong>' . esc_html($current_user->display_name) . '</strong>'
                    ); 
                    ?>
                </span>
                <a href="<?php echo esc_url(wp_logout_url(get_permalink())); ?>" style="margin-left: 12px; color: #059669; font-size: 13px;">
                    <?php esc_html_e('Log out', 'yatra'); ?>
                </a>
            </div>
        </div>
    </div>
<?php endif; ?>

<!-- Terms & Conditions -->
<div class="yatra-booking-section">
    <div class="yatra-terms-container">
        <label class="yatra-checkbox-label">
            <input type="checkbox" name="accept_terms" id="accept-terms" required>
            <span>
                <?php 
                printf(
                    /* translators: %s: Terms and Conditions link */
                    esc_html__('I have read and agree to the %s', 'yatra'),
                    '<a href="#" target="_blank">' . esc_html__('Terms and Conditions', 'yatra') . '</a>'
                ); 
                ?>
                <span class="required">*</span>
            </span>
        </label>
        
        <label class="yatra-checkbox-label">
            <input type="checkbox" name="accept_privacy" id="accept-privacy" required>
            <span>
                <?php 
                printf(
                    /* translators: %s: Privacy Policy link */
                    esc_html__('I agree to the %s and consent to my data being processed', 'yatra'),
                    '<a href="#" target="_blank">' . esc_html__('Privacy Policy', 'yatra') . '</a>'
                ); 
                ?>
                <span class="required">*</span>
            </span>
        </label>
        
        <label class="yatra-checkbox-label">
            <input type="checkbox" name="subscribe_newsletter" id="subscribe-newsletter">
            <span><?php esc_html_e('Subscribe to our newsletter for travel tips and exclusive offers', 'yatra'); ?></span>
        </label>
    </div>
</div>
