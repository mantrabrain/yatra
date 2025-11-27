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
$traveler_count = isset($total_travelers) ? max(1, (int)$total_travelers) : 1;

if (!empty($traveler_config)) : 
?>
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
            $traveler_label = ($i === 1) ? __('Traveler 1 (Lead Traveler)', 'yatra') : sprintf(__('Traveler %d', 'yatra'), $i);
        ?>
        <div class="yatra-traveler-form" data-traveler-index="<?php echo esc_attr($i); ?>">
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
<?php if ($deposit_required || $partial_payment) : ?>
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
        <?php 
        $first = false;
        endforeach; 
        ?>
    </div>
</div>
<?php endif; ?>

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
