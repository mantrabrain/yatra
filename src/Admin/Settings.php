<?php
namespace Yatra\Admin;

/**
 * Handles Yatra plugin settings: config, rendering, saving, sanitization, and validation.
 */
class Settings
{
    /**
     * Settings configuration array.
     * Each field can have 'sanitize_callback' and 'validate_callback'.
     *
     * @var array
     */
    protected $config = [
        [
            'id' => 'general',
            'title' => 'General',
            'fields' => [
                [
                    'id' => 'company_name',
                    'label' => 'Company Name',
                    'type' => 'text',
                    'desc' => 'Enter your company\'s public name as it will appear to customers.',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'company_logo',
                    'label' => 'Company Logo URL',
                    'type' => 'text',
                    'desc' => 'Paste a direct link to your company logo image (optional).',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'company_address',
                    'label' => 'Company Address',
                    'type' => 'textarea',
                    'desc' => 'Your business address for invoices and customer communication.',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'company_contact',
                    'label' => 'Contact Email/Phone',
                    'type' => 'text',
                    'desc' => 'How can customers reach you? Email or phone number.',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'currency',
                    'label' => 'Currency',
                    'type' => 'select',
                    'options' => [
                        'USD' => 'US Dollar',
                        'EUR' => 'Euro',
                        'GBP' => 'British Pound',
                    ],
                    'desc' => 'Choose the main currency for your bookings.',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'date_format',
                    'label' => 'Date Format',
                    'type' => 'text',
                    'desc' => 'How dates will be shown to users (e.g., Y-m-d for 2024-06-01).',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'timezone',
                    'label' => 'Timezone',
                    'type' => 'text',
                    'desc' => 'Set your local timezone (e.g., America/New_York).',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'brand_color',
                    'label' => 'Brand Color',
                    'type' => 'text',
                    'desc' => 'Accent color for your brand (hex code, e.g., #2563eb).',
                    'sanitize_callback' => 'sanitize_hex_color',
                    'validate_callback' => null,
                ],
            ],
        ],
        [
            'id' => 'payment',
            'title' => 'Payment Gateways',
            'fields' => [
                [
                    'id' => 'paypal_enabled',
                    'label' => 'Enable PayPal',
                    'type' => 'checkbox',
                    'sanitize_callback' => 'rest_sanitize_boolean',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'paypal_client_id',
                    'label' => 'PayPal Client ID',
                    'type' => 'text',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'paypal_secret',
                    'label' => 'PayPal Secret',
                    'type' => 'text',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'stripe_enabled',
                    'label' => 'Enable Stripe',
                    'type' => 'checkbox',
                    'sanitize_callback' => 'rest_sanitize_boolean',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'stripe_publishable_key',
                    'label' => 'Stripe Publishable Key',
                    'type' => 'text',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'stripe_secret_key',
                    'label' => 'Stripe Secret Key',
                    'type' => 'text',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'payment_instructions',
                    'label' => 'Payment Instructions',
                    'type' => 'textarea',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
            ],
        ],
        [
            'id' => 'email',
            'title' => 'Email Templates',
            'fields' => [
                [
                    'id' => 'email_sender_name',
                    'label' => 'Sender Name',
                    'type' => 'text',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'email_sender_address',
                    'label' => 'Sender Email',
                    'type' => 'text',
                    'sanitize_callback' => 'sanitize_email',
                    'validate_callback' => 'is_email',
                ],
                [
                    'id' => 'booking_confirmation_template',
                    'label' => 'Booking Confirmation Template',
                    'type' => 'textarea',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'payment_receipt_template',
                    'label' => 'Payment Receipt Template',
                    'type' => 'textarea',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'admin_notification_template',
                    'label' => 'Admin Notification Template',
                    'type' => 'textarea',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
            ],
        ],
        [
            'id' => 'policies',
            'title' => 'Booking Policies',
            'fields' => [
                [
                    'id' => 'booking_window_min',
                    'label' => 'Minimum Days in Advance',
                    'type' => 'number',
                    'sanitize_callback' => 'absint',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'booking_window_max',
                    'label' => 'Maximum Days in Advance',
                    'type' => 'number',
                    'sanitize_callback' => 'absint',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'cancellation_policy',
                    'label' => 'Cancellation Policy',
                    'type' => 'textarea',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'terms_conditions',
                    'label' => 'Terms & Conditions',
                    'type' => 'textarea',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'privacy_policy_link',
                    'label' => 'Privacy Policy Link',
                    'type' => 'text',
                    'sanitize_callback' => 'esc_url_raw',
                    'validate_callback' => null,
                ],
            ],
        ],
        [
            'id' => 'advanced',
            'title' => 'Advanced',
            'fields' => [
                [
                    'id' => 'enable_debug',
                    'label' => 'Enable Debug/Logging',
                    'type' => 'checkbox',
                    'sanitize_callback' => 'rest_sanitize_boolean',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'api_key',
                    'label' => 'API Key',
                    'type' => 'text',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'webhook_url',
                    'label' => 'Webhook URL',
                    'type' => 'text',
                    'sanitize_callback' => 'esc_url_raw',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'custom_css',
                    'label' => 'Custom CSS',
                    'type' => 'textarea',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'custom_js',
                    'label' => 'Custom JS',
                    'type' => 'textarea',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
            ],
        ],
    ];

    /**
     * Render the settings page HTML (tabs, form, fields, errors).
     */
    public function render() {
        $sections = $this->config;
        $active_tab = $_POST['active_tab'] ?? ($_GET['tab'] ?? $sections[0]['id']);
        $result = null;
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $result = $this->save($active_tab);
        }
        $ajax_action = 'save_settings';
        $nonce = wp_create_nonce('yatra_admin_nonce');
        ?>
        <div class="yatra-page-content" id="page-content">
            <div class="yatra-settings-card-header">
                <h2 class="yatra-settings-card-title">Settings</h2>
                <div class="yatra-settings-savebar-top">
                    <button type="button" class="yatra-btn yatra-btn-primary yatra-ajax-save-btn">Save Settings</button>
                </div>
            </div>
            <div class="yatra-settings">
                <div class="yatra-settings-card">
                    <div class="yatra-settings-card-body">
                        <div class="yatra-settings-tabs">
                            <?php foreach ($sections as $section): ?>
                                <button class="yatra-settings-tab<?php echo $active_tab === $section['id'] ? ' active' : ''; ?>" data-tab="<?php echo esc_attr($section['id']); ?>">
                                    <?php echo esc_html($section['title']); ?>
                                </button>
                            <?php endforeach; ?>
                        </div>
                        <div class="yatra-settings-main">
                            <?php if ($result && !$result['success']): ?>
                                <div class="yatra-form-error" style="margin-bottom:18px;">
                                    <?php foreach ($result['errors'] as $msg): ?>
                                        <div><?php echo esc_html($msg); ?></div>
                                    <?php endforeach; ?>
                                </div>
                            <?php elseif ($result && $result['success']): ?>
                                <div class="yatra-form-success" style="margin-bottom:18px;">Settings saved successfully!</div>
                            <?php endif; ?>
                            <form method="post" class="yatra-form-grid yatra-ajax-form">
                                <input type="hidden" name="active_tab" value="<?php echo esc_attr($active_tab); ?>" />
                                <input type="hidden" name="yatra_ajax_action" value="<?php echo esc_attr($ajax_action); ?>" />
                                <input type="hidden" name="yatra_admin_nonce" value="<?php echo esc_attr($nonce); ?>" />
                                <?php foreach ($sections as $section): ?>
                                    <div class="yatra-settings-section" data-tab-content="<?php echo esc_attr($section['id']); ?>" style="<?php echo $active_tab === $section['id'] ? '' : 'display:none;'; ?>">
                                        <h3><?php echo esc_html($section['title']); ?></h3>
                                        <?php foreach ($section['fields'] as $field): ?>
                                            <?php $value = $this->get_option($field['id']); ?>
                                            <div class="yatra-form-group">
                                                <label class="yatra-form-label" for="<?php echo esc_attr($field['id']); ?>"><?php echo esc_html($field['label']); ?></label>
                                                <?php if (!empty($field['desc'])): ?>
                                                    <div class="yatra-form-desc"><?php echo esc_html($field['desc']); ?></div>
                                                <?php endif; ?>
                                                <?php if ($field['type'] === 'select'): ?>
                                                    <select class="yatra-form-input yatra-form-select" id="<?php echo esc_attr($field['id']); ?>" name="<?php echo esc_attr($field['id']); ?>">
                                                        <?php foreach ($field['options'] as $val => $label): ?>
                                                            <option value="<?php echo esc_attr($val); ?>" <?php selected($value, $val); ?>><?php echo esc_html($label); ?></option>
                                                        <?php endforeach; ?>
                                                    </select>
                                                <?php elseif ($field['type'] === 'checkbox'): ?>
                                                    <label class="yatra-form-checkbox">
                                                        <input type="checkbox" id="<?php echo esc_attr($field['id']); ?>" name="<?php echo esc_attr($field['id']); ?>" value="1" <?php checked($value, true); ?> />
                                                        <?php echo esc_html($field['label']); ?>
                                                    </label>
                                                <?php elseif ($field['type'] === 'textarea'): ?>
                                                    <textarea class="yatra-form-input yatra-form-textarea" id="<?php echo esc_attr($field['id']); ?>" name="<?php echo esc_attr($field['id']); ?>"><?php echo esc_textarea($value); ?></textarea>
                                                <?php elseif ($field['type'] === 'number'): ?>
                                                    <input type="number" class="yatra-form-input" id="<?php echo esc_attr($field['id']); ?>" name="<?php echo esc_attr($field['id']); ?>" value="<?php echo esc_attr($value); ?>" />
                                                <?php else: ?>
                                                    <input type="text" class="yatra-form-input" id="<?php echo esc_attr($field['id']); ?>" name="<?php echo esc_attr($field['id']); ?>" value="<?php echo esc_attr($value); ?>" />
                                                <?php endif; ?>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>
                                <?php endforeach; ?>
                                <div class="yatra-settings-savebar">
                                    <button type="button" class="yatra-btn yatra-btn-primary yatra-ajax-save-btn">Save Settings</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script>
        // Tab switching logic for vertical tabs
        document.querySelectorAll('.yatra-settings-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.yatra-settings-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab');
                document.querySelector('input[name=active_tab]').value = tabId;
                
                // Update URL to include the tab parameter
                const currentUrl = new URL(window.location);
                currentUrl.searchParams.set('tab', tabId);
                window.history.pushState({ tab: tabId }, '', currentUrl.toString());
                
                document.querySelectorAll('.yatra-settings-section').forEach(section => {
                    if (section.getAttribute('data-tab-content') === tabId) {
                        section.style.display = '';
                    } else {
                        section.style.display = 'none';
                    }
                });
            });
        });
        
        // Handle browser back/forward for tab navigation
        window.addEventListener('popstate', function(event) {
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get('tab');
            if (tab) {
                // Find and click the corresponding tab
                const tabElement = document.querySelector(`.yatra-settings-tab[data-tab="${tab}"]`);
                if (tabElement) {
                    tabElement.click();
                }
            }
        });
        
        // Initialize tab from URL on page load
        document.addEventListener('DOMContentLoaded', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get('tab');
            if (tab) {
                // Find and click the corresponding tab
                const tabElement = document.querySelector(`.yatra-settings-tab[data-tab="${tab}"]`);
                if (tabElement) {
                    tabElement.click();
                }
            }
        });
        </script>
        <?php
    }

    /**
     * Handle saving settings: sanitize, validate, and store options.
     *
     * @return array [ 'success' => bool, 'errors' => array ]
     */
    public function save($active_tab = null) {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') return null;
        if (!current_user_can('manage_options')) return null;
        if (!$active_tab) return null;

        $settings = get_option('yatra_settings', []);
        $errors = [];
        $new_values = $settings;

        // Find the section for the active tab
        $section = null;
        foreach ($this->config as $sec) {
            if ($sec['id'] === $active_tab) {
                $section = $sec;
                break;
            }
        }
        if (!$section) return null;

        foreach ($section['fields'] as $field) {
            $field_id = $field['id'];
            $raw = $_POST[$field_id] ?? null;
            $sanitized = $raw;
            if (isset($field['sanitize_callback']) && is_callable($field['sanitize_callback'])) {
                $sanitized = call_user_func($field['sanitize_callback'], $raw);
            }
            if (isset($field['validate_callback']) && is_callable($field['validate_callback'])) {
                $valid = call_user_func($field['validate_callback'], $sanitized);
                if (!$valid) {
                    $errors[$field_id] = $field['label'] . ' is invalid.';
                    continue;
                }
            }
            $new_values[$field_id] = $sanitized;
        }
        if (empty($errors)) {
            update_option('yatra_settings', $new_values);
            return ['success' => true, 'errors' => []];
        } else {
            return ['success' => false, 'errors' => $errors];
        }
    }

    /**
     * Get the settings config array.
     *
     * @return array
     */
    public function get_config() {
        return $this->config;
    }

    /**
     * Get a single option value.
     *
     * @param string $field_id
     * @param mixed $default
     * @return mixed
     */
    public function get_option($field_id, $default = '') {
        $settings = get_option('yatra_settings', []);
        return $settings[$field_id] ?? $default;
    }

    /**
     * Set a single option value.
     *
     * @param string $field_id
     * @param mixed $value
     */
    public function set_option($field_id, $value) {
        // ...
    }
} 