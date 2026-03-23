<?php
/**
 * Yatra Promotional Notice Class
 * 
 * Handles promotional notices for Yatra Pro pricing increase
 * with dismiss logic and timing controls.
 *
 * @package Yatra
 * @since   1.0.0
 */

defined('ABSPATH') || exit;

/**
 * Promotional Notice Class
 */
class Yatra_Promotional_Notice
{
    /**
     * Option key for the promotional notice
     */
    const OPTION_KEY = 'yatra_promotional_notice_dismissed';

    /**
     * Dismiss states
     */
    const STATE_SHOW = 'show';
    const STATE_TEMP_DISMISSED = 'temp_dismissed';
    const STATE_PERMANENT_DISMISSED = 'permanent_dismissed';

    /**
     * Time intervals in seconds
     */
    const TEMP_DISMISS_TIME = 15 * DAY_IN_SECONDS; // 15 days

    /**
     * Purchase URL
     */
    const PURCHASE_URL = 'https://wpyatra.com/pricing';

    /**
     * The single instance of the class.
     *
     * @var Yatra_Promotional_Notice
     */
    protected static $_instance = null;

    /**
     * Main Yatra_Promotional_Notice Instance.
     *
     * @return Yatra_Promotional_Notice - Main instance.
     * @static
     */
    public static function instance()
    {
        if (is_null(self::$_instance)) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }

    /**
     * Constructor
     */
    public function __construct()
    {
        // Add test notice to verify class is loaded
        add_action('admin_notices', array($this, 'test_notice'));
        add_action('admin_notices', array($this, 'display_notice'));
        
        // Register AJAX handlers for both logged-in and non-logged-in users
        add_action('wp_ajax_yatra_dismiss_promotional_notice', array($this, 'ajax_dismiss_notice'));
        add_action('wp_ajax_nopriv_yatra_dismiss_promotional_notice', array($this, 'ajax_dismiss_notice'));
        
        add_action('admin_init', array($this, 'reset_dismiss_data'));
    }
    
    /**
     * Test notice to verify class is loaded
     */
    public function test_notice()
    {
        if (current_user_can('manage_yatra') && isset($_GET['yatra_test_promo']) && $_GET['yatra_test_promo'] == '1') {
            echo '<div class="notice notice-info"><p>✅ Yatra_Promotional_Notice class is loaded and working!</p></div>';
        }
    }

    /**
     * Check if notice should be displayed
     *
     * @return bool
     */
    public function should_display()
    {
        // Don't show if user can't manage Yatra
        if (!current_user_can('manage_yatra')) {
            return false;
        }

        // Don't show if Yatra Pro is active
        if ($this->is_yatra_pro_active()) {
            return false;
        }

        // Get dismiss state
        $dismiss_data = $this->get_dismiss_data();

        // Temporarily always show for debugging
        // Remove this block after testing
        if (isset($_GET['yatra_debug_promo']) && $_GET['yatra_debug_promo'] == '1') {
            return true;
        }

        // If permanently dismissed, don't show
        if ($dismiss_data['state'] === self::STATE_PERMANENT_DISMISSED) {
            return false;
        }

        // If temporarily dismissed, check if 15 days have passed
        if ($dismiss_data['state'] === self::STATE_TEMP_DISMISSED) {
            $time_since_dismiss = current_time('timestamp') - $dismiss_data['dismissed_at'];
            if ($time_since_dismiss < self::TEMP_DISMISS_TIME) {
                return false;
            }
            // Reset to show state after 15 days
            $this->update_dismiss_data(self::STATE_SHOW);
        }

        return true;
    }

    /**
     * Display the promotional notice
     */
    public function display_notice()
    {
        // Debug: Log why notice might not be showing
        $debug_info = array(
            'can_manage_yatra' => current_user_can('manage_yatra'),
            'is_pro_active' => $this->is_yatra_pro_active(),
            'should_display' => $this->should_display(),
            'dismiss_data' => $this->get_dismiss_data()
        );
        
        // Log to error_log for debugging (remove in production)
        error_log('Yatra Promotional Notice Debug: ' . print_r($debug_info, true));
        
        if (!$this->should_display()) {
            return;
        }

        $dismiss_data = $this->get_dismiss_data();
        $dismiss_count = $dismiss_data['dismiss_count'] ?? 0;
        ?>
        <div id="yatra-promotional-notice" class="notice notice-warning is-dismissible yatra-promotional-notice">
            <div class="yatra-promotional-notice-content">
                <div class="yatra-promotional-notice-icon">
                    <span class="dashicons dashicons-megaphone"></span>
                </div>
                <div class="yatra-promotional-notice-text">
                    <h3><?php esc_html_e('🔥 Yatra Pro Price Increase Alert!', 'yatra'); ?></h3>
                    <p>
                        <strong><?php esc_html_e('Important Notice:', 'yatra'); ?></strong>
                        <?php esc_html_e('Yatra Pro pricing will be increasing by 20% soon. Lock in current pricing before the increase!', 'yatra'); ?>
                    </p>
                    <p>
                        <?php esc_html_e('Get Yatra Pro now at the current price and enjoy all premium features including advanced booking management, priority updates, and premium customer support.', 'yatra'); ?>
                    </p>
                    <div class="yatra-promotional-notice-actions">
                        <a href="<?php echo esc_url(self::PURCHASE_URL); ?>" 
                           target="_blank" 
                           class="button button-primary yatra-promotional-cta">
                            <?php esc_html_e('Get Yatra Pro Now', 'yatra'); ?>
                        </a>
                        <a href="<?php echo esc_url(self::PURCHASE_URL); ?>#pricing" 
                           target="_blank" 
                           class="button">
                            <?php esc_html_e('View Pricing', 'yatra'); ?>
                        </a>
                    </div>
                </div>
            </div>
            <style>
                .yatra-promotional-notice {
                    border-left: 4px solid #ff6b35;
                    background: #fff8f5;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 8px;
                }
                .yatra-promotional-notice-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                }
                .yatra-promotional-notice-icon {
                    font-size: 24px;
                    color: #ff6b35;
                    flex-shrink: 0;
                }
                .yatra-promotional-notice-text h3 {
                    margin: 0 0 10px 0;
                    color: #d63031;
                    font-size: 16px;
                }
                .yatra-promotional-notice-text p {
                    margin: 0 0 10px 0;
                    line-height: 1.5;
                }
                .yatra-promotional-notice-text p:last-child {
                    margin-bottom: 15px;
                }
                .yatra-promotional-notice-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .yatra-promotional-cta {
                    background: #ff6b35;
                    border-color: #ff6b35;
                    color: white;
                }
                .yatra-promotional-cta:hover {
                    background: #e85a2b;
                    border-color: #e85a2b;
                }
                @media (max-width: 768px) {
                    .yatra-promotional-notice-content {
                        flex-direction: column;
                    }
                    .yatra-promotional-notice-actions {
                        flex-direction: column;
                    }
                    .yatra-promotional-notice-actions .button {
                        width: 100%;
                        text-align: center;
                    }
                }
            </style>
            <script>
                jQuery(document).ready(function($) {
                    // Debug: Log when script loads
                    console.log('Yatra Promotional Notice script loaded');
                    
                    // Handle dismiss button click
                    $(document).on('click', '#yatra-promotional-notice .notice-dismiss, #yatra-promotional-notice button.notice-dismiss', function(e) {
                        e.preventDefault();
                        console.log('Dismiss button clicked');
                        
                        var $notice = $('#yatra-promotional-notice');
                        
                        $.ajax({
                            url: ajaxurl,
                            type: 'POST',
                            data: {
                                action: 'yatra_dismiss_promotional_notice',
                                nonce: '<?php echo wp_create_nonce('yatra_dismiss_promotional_notice'); ?>'
                            },
                            beforeSend: function() {
                                console.log('Sending dismiss request...');
                            },
                            success: function(response) {
                                console.log('Dismiss response:', response);
                                if (response.success) {
                                    console.log('Dismiss successful, removing notice');
                                    $notice.fadeOut(300, function() {
                                        $(this).remove();
                                    });
                                } else {
                                    console.log('Dismiss failed:', response.data);
                                }
                            },
                            error: function(xhr, status, error) {
                                console.log('AJAX error:', error);
                                // Fallback: just hide the notice if AJAX fails
                                $notice.fadeOut(300, function() {
                                    $(this).remove();
                                });
                            }
                        });
                    });
                });
            </script>
        </div>
        <?php
    }

    /**
     * AJAX handler for dismissing notice
     */
    public function ajax_dismiss_notice()
    {
        check_ajax_referer('yatra_dismiss_promotional_notice', 'nonce');

        if (!current_user_can('manage_yatra')) {
            wp_die(__('You do not have sufficient permissions to perform this action.', 'yatra'));
        }

        $dismiss_data = $this->get_dismiss_data();
        $dismiss_count = $dismiss_data['dismiss_count'] ?? 0;
        $dismiss_count++;

        // First dismiss = temporary (15 days)
        // Second dismiss = permanent
        if ($dismiss_count === 1) {
            $state = self::STATE_TEMP_DISMISSED;
            $message = 'Notice dismissed for 15 days';
        } else {
            $state = self::STATE_PERMANENT_DISMISSED;
            $message = 'Notice dismissed permanently';
        }

        $this->update_dismiss_data($state, $dismiss_count);

        // Debug: Log the dismiss action
        error_log('Yatra Promotional Notice Dismissed: ' . $message . ' (count: ' . $dismiss_count . ')');

        wp_send_json_success(array(
            'state' => $state,
            'dismiss_count' => $dismiss_count,
            'message' => $message
        ));
    }

    /**
     * Get dismiss data
     *
     * @return array
     */
    private function get_dismiss_data()
    {
        $data = get_option(self::OPTION_KEY, array(
            'state' => self::STATE_SHOW,
            'dismissed_at' => 0,
            'dismiss_count' => 0
        ));

        return $data;
    }

    /**
     * Update dismiss data
     *
     * @param string $state
     * @param int $dismiss_count
     */
    private function update_dismiss_data($state, $dismiss_count = null)
    {
        $data = array(
            'state' => $state,
            'dismissed_at' => current_time('timestamp'),
            'dismiss_count' => $dismiss_count ?? ($this->get_dismiss_data()['dismiss_count'] ?? 0)
        );

        update_option(self::OPTION_KEY, $data);
    }

    /**
     * Check if Yatra Pro is active
     *
     * @return bool
     */
    private function is_yatra_pro_active()
    {
        // Check if Yatra Pro plugin is active
        if (!function_exists('is_plugin_active')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        // Common Yatra Pro plugin files to check
        $pro_plugins = array(
            'yatra-pro/yatra-pro.php',
            'yatra-pro-premium/yatra-pro-premium.php',
            'yatra-pro-plus/yatra-pro-plus.php'
        );

        foreach ($pro_plugins as $plugin) {
            if (is_plugin_active($plugin)) {
                return true;
            }
        }

        // Check for Yatra Pro constant
        if (defined('YATRA_PRO_VERSION') || defined('YATRA_PRO_ACTIVE')) {
            return true;
        }

        // Check for Yatra Pro class
        if (class_exists('Yatra_Pro') || class_exists('YatraPro')) {
            return true;
        }

        return false;
    }

    /**
     * Reset dismiss data for testing
     * 
     * This method can be called via URL: /wp-admin/?yatra_reset_promo_notice=1
     */
    public function reset_dismiss_data()
    {
        if (!current_user_can('manage_yatra')) {
            return;
        }
        
        if (isset($_GET['yatra_reset_promo_notice']) && $_GET['yatra_reset_promo_notice'] == '1') {
            delete_option(self::OPTION_KEY);
            add_action('admin_notices', function() {
                echo '<div class="notice notice-success"><p>Promotional notice data has been reset. It should now appear.</p></div>';
            });
        }
    }
}
