<?php
/**
 * Yatra Pro Compatibility Checker
 * 
 * Checks for old individual plugins and shows notice to upgrade to Yatra Pro 2.0.0
 * 
 * @package Yatra
 * @since 2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class Yatra_Pro_Compatibility
{
    /**
     * List of old individual plugins that are now integrated into Yatra Pro 2.0.0
     */
    private $old_plugins = [
        'yatra-downloads/yatra-downloads.php',
        'yatra-2checkout/yatra-2checkout.php',
        'yatra-authorizenet/yatra-authorizenet.php',
        'yatra-availability-conditions/yatra-availability-conditions.php',
        'yatra-google-calendar/yatra-google-calendar.php',
        'yatra-partial-payment/yatra-partial-payment.php',
        'yatra-razorpay/yatra-razorpay.php',
        'yatra-review/yatra-review.php',
        'yatra-services/yatra-services.php',
        'yatra-square/yatra-square.php',
        'yatra-stripe/yatra-stripe.php'
    ];

    /**
     * Plugin names for display
     */
    private $plugin_names = [
        'yatra-downloads/yatra-downloads.php' => 'Yatra Downloads',
        'yatra-2checkout/yatra-2checkout.php' => 'Yatra 2Checkout',
        'yatra-authorizenet/yatra-authorizenet.php' => 'Yatra AuthorizeNet',
        'yatra-availability-conditions/yatra-availability-conditions.php' => 'Yatra Availability Conditions',
        'yatra-google-calendar/yatra-google-calendar.php' => 'Yatra Google Calendar',
        'yatra-partial-payment/yatra-partial-payment.php' => 'Yatra Partial Payment',
        'yatra-razorpay/yatra-razorpay.php' => 'Yatra Razorpay',
        'yatra-review/yatra-review.php' => 'Yatra Review',
        'yatra-services/yatra-services.php' => 'Yatra Services',
        'yatra-square/yatra-square.php' => 'Yatra Square',
        'yatra-stripe/yatra-stripe.php' => 'Yatra Stripe'
    ];

    /**
     * Mapping of old plugins to Yatra Pro features
     */
    private $plugin_to_feature_mapping = [
        'yatra-downloads/yatra-downloads.php' => 'downloads',
        'yatra-2checkout/yatra-2checkout.php' => 'payment_gateways',
        'yatra-authorizenet/yatra-authorizenet.php' => 'payment_gateways',
        'yatra-availability-conditions/yatra-availability-conditions.php' => 'availability_conditions',
        'yatra-google-calendar/yatra-google-calendar.php' => 'google_calendar',
        'yatra-partial-payment/yatra-partial-payment.php' => 'partial_payment',
        'yatra-razorpay/yatra-razorpay.php' => 'payment_gateways',
        'yatra-review/yatra-review.php' => 'review_ratings',
        'yatra-services/yatra-services.php' => 'services',
        'yatra-square/yatra-square.php' => 'payment_gateways',
        'yatra-stripe/yatra-stripe.php' => 'payment_gateways'
    ];

    /**
     * Constructor
     */
    public function __construct()
    {
        add_action('admin_init', array($this, 'check_compatibility'));
        add_action('admin_notices', array($this, 'show_compatibility_notice'));
        add_action('wp_ajax_yatra_enable_feature_and_deactivate', array($this, 'handle_enable_feature_and_deactivate'));
        add_action('wp_ajax_yatra_go_to_features', array($this, 'handle_go_to_features'));
        add_action('wp_ajax_yatra_activate_pro', array($this, 'handle_activate_pro'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_scripts'));
    }

    /**
     * Check if any old plugins are active
     * 
     * @return array Array of active old plugins
     */
    public function get_active_old_plugins()
    {
        $active_plugins = get_option('active_plugins', array());
        $active_old_plugins = array();

        foreach ($this->old_plugins as $plugin) {
            if (in_array($plugin, $active_plugins)) {
                $active_old_plugins[] = $plugin;
            }
        }

        return $active_old_plugins;
    }

    /**
     * Check if all old plugins are deactivated
     * 
     * @return bool True if all old plugins are deactivated
     */
    public function are_all_old_plugins_deactivated()
    {
        $active_old_plugins = $this->get_active_old_plugins();
        return empty($active_old_plugins);
    }

    /**
     * Get plugin display name
     * 
     * @param string $plugin_file Plugin file path
     * @return string Plugin display name
     */
    public function get_plugin_display_name($plugin_file)
    {
        return isset($this->plugin_names[$plugin_file]) ? $this->plugin_names[$plugin_file] : $plugin_file;
    }

    /**
     * Check compatibility on admin init
     */
    public function check_compatibility()
    {
        // Only show notice if there are active old plugins
        if (!$this->are_all_old_plugins_deactivated()) {
            add_action('admin_notices', array($this, 'show_compatibility_notice'));
        }
    }

    /**
     * Show compatibility notice
     */
    public function show_compatibility_notice()
    {
        $active_old_plugins = $this->get_active_old_plugins();
        
        if (empty($active_old_plugins)) {
            return;
        }

        $plugin_names = array();
        foreach ($active_old_plugins as $plugin) {
            $plugin_names[] = $this->get_plugin_display_name($plugin);
        }

        $plugin_list = implode(', ', $plugin_names);
        $plugin_count = count($active_old_plugins);
        $yatra_pro_status = $this->get_yatra_pro_status();

        // Different messages based on Yatra Pro status
        if ($yatra_pro_status['needs_installation']) {
            $message = sprintf(
                _n(
                    'The following plugin has been integrated into Yatra Pro 2.0.0 and onwards: <strong>%s</strong>. To use these features, you need to install Yatra Pro 2.0.0. <em>Note: Updates for this plugin will only be available in Yatra Pro from now onwards.</em>',
                    'The following plugins have been integrated into Yatra Pro 2.0.0 and onwards: <strong>%s</strong>. To use these features, you need to install Yatra Pro 2.0.0. <em>Note: Updates for these plugins will only be available in Yatra Pro from now onwards.</em>',
                    $plugin_count,
                    'yatra'
                ),
                $plugin_list
            );
        } elseif ($yatra_pro_status['needs_activation']) {
            $message = sprintf(
                _n(
                    'The following plugin has been integrated into Yatra Pro 2.0.0 and onwards: <strong>%s</strong>. Please activate Yatra Pro 2.0.0 to use these features. <em>Note: Updates for this plugin will only be available in Yatra Pro from now onwards.</em>',
                    'The following plugins have been integrated into Yatra Pro 2.0.0 and onwards: <strong>%s</strong>. Please activate Yatra Pro 2.0.0 to use these features. <em>Note: Updates for these plugins will only be available in Yatra Pro from now onwards.</em>',
                    $plugin_count,
                    'yatra'
                ),
                $plugin_list
            );
        } elseif ($yatra_pro_status['needs_upgrade']) {
            $message = sprintf(
                _n(
                    'The following plugin has been integrated into Yatra Pro 2.0.0 and onwards: <strong>%s</strong>. Please upgrade Yatra Pro to version 2.0.0 or higher to use these features. <em>Note: Updates for this plugin will only be available in Yatra Pro from now onwards.</em>',
                    'The following plugins have been integrated into Yatra Pro 2.0.0 and onwards: <strong>%s</strong>. Please upgrade Yatra Pro to version 2.0.0 or higher to use these features. <em>Note: Updates for these plugins will only be available in Yatra Pro from now onwards.</em>',
                    $plugin_count,
                    'yatra'
                ),
                $plugin_list
            );
        } else {
            $message = sprintf(
                _n(
                    'The following plugin has been integrated into Yatra Pro 2.0.0 and onwards: <strong>%s</strong>. Please make sure you have updated Yatra Pro to version 2.0.0, enable the related features, and deactivate this plugin. <em>Note: Updates for this plugin will only be available in Yatra Pro from now onwards.</em>',
                    'The following plugins have been integrated into Yatra Pro 2.0.0 and onwards: <strong>%s</strong>. Please make sure you have updated Yatra Pro to version 2.0.0, enable the related features, and deactivate these plugins. <em>Note: Updates for these plugins will only be available in Yatra Pro from now onwards.</em>',
                    $plugin_count,
                    'yatra'
                ),
                $plugin_list
            );
        }

        ?>
        <div class="notice notice-warning is-dismissible yatra-pro-compatibility-notice" style="border-left: 4px solid #f0b849; background: linear-gradient(135deg, #fff8e1 0%, #fffbf0 100%); box-shadow: 0 2px 8px rgba(240, 184, 73, 0.15); margin: 20px 0; padding: 20px;">
            <div style="display: flex; align-items: flex-start; gap: 15px;">
                <div style="flex-shrink: 0; margin-top: 2px;">
                    <span class="dashicons dashicons-warning" style="font-size: 24px; color: #f0b849; text-shadow: 0 1px 2px rgba(240, 184, 73, 0.3);"></span>
                </div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 12px 0; color: #8a6914; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <span class="dashicons dashicons-update" style="color: #f0b849; animation: pulse 2s ease-in-out infinite;"></span>
                        <?php _e('Yatra Pro 2.0.0 Compatibility Update', 'yatra'); ?>
                    </h3>
                    <div style="background: rgba(255, 255, 255, 0.7); padding: 15px; border-radius: 8px; border: 1px solid rgba(240, 184, 73, 0.2); margin-bottom: 15px;">
                        <p style="margin: 0; color: #5d4e37; line-height: 1.6; font-size: 14px;">
                            <?php echo $message; ?>
                        </p>
                    </div>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                        <?php if ($yatra_pro_status['is_compatible']): ?>
                            <button type="button" class="button button-primary yatra-enable-feature-btn" data-nonce="<?php echo wp_create_nonce('yatra_enable_feature'); ?>" style="background: linear-gradient(135deg, #0073aa 0%, #005a87 100%); border: none; border-radius: 6px; padding: 10px 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(0, 115, 170, 0.3); transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 6px;">
                                <span class="dashicons dashicons-yes-alt" style="font-size: 16px; line-height: 1;"></span>
                                <span><?php _e('Enable Feature & Deactivate', 'yatra'); ?></span>
                            </button>
                            
                            <button type="button" class="button button-secondary yatra-go-to-features-btn" data-nonce="<?php echo wp_create_nonce('yatra_go_to_features'); ?>" style="background: linear-gradient(135deg, #f0f0f1 0%, #e8e8e9 100%); border: 1px solid #c3c4c7; border-radius: 6px; padding: 10px 16px; font-weight: 600; color: #50575e; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 6px;">
                                <span class="dashicons dashicons-admin-generic" style="font-size: 16px; line-height: 1;"></span>
                                <span><?php _e('Go to Features', 'yatra'); ?></span>
                            </button>
                        <?php elseif ($yatra_pro_status['needs_installation']): ?>
                            <a href="https://store.mantrabrain.com/account" target="_blank" class="button button-primary" style="background: linear-gradient(135deg, #0073aa 0%, #005a87 100%); border: none; border-radius: 6px; padding: 10px 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(0, 115, 170, 0.3); transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                                <span class="dashicons dashicons-download" style="font-size: 16px; line-height: 1;"></span>
                                <span><?php _e('Download Yatra Pro', 'yatra'); ?></span>
                            </a>
                            
                            <a href="https://wpyatra.com/pricing/" target="_blank" class="button button-secondary" style="background: linear-gradient(135deg, #f0f0f1 0%, #e8e8e9 100%); border: 1px solid #c3c4c7; border-radius: 6px; padding: 10px 16px; font-weight: 600; color: #50575e; text-decoration: none; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 6px;">
                                <span class="dashicons dashicons-cart" style="font-size: 16px; line-height: 1;"></span>
                                <span><?php _e('Purchase License', 'yatra'); ?></span>
                            </a>
                        <?php elseif ($yatra_pro_status['needs_activation']): ?>
                            <button type="button" class="button button-primary yatra-activate-pro-btn" data-nonce="<?php echo wp_create_nonce('yatra_activate_pro'); ?>" style="background: linear-gradient(135deg, #0073aa 0%, #005a87 100%); border: none; border-radius: 6px; padding: 10px 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(0, 115, 170, 0.3); transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 6px;">
                                <span class="dashicons dashicons-yes" style="font-size: 16px; line-height: 1;"></span>
                                <span><?php _e('Activate Yatra Pro', 'yatra'); ?></span>
                            </button>
                        <?php elseif ($yatra_pro_status['needs_upgrade']): ?>
                            <a href="<?php echo admin_url('plugins.php'); ?>" class="button button-primary" style="background: linear-gradient(135deg, #0073aa 0%, #005a87 100%); border: none; border-radius: 6px; padding: 10px 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(0, 115, 170, 0.3); transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                                <span class="dashicons dashicons-update" style="font-size: 16px; line-height: 1;"></span>
                                <span><?php _e('Upgrade Yatra Pro', 'yatra'); ?></span>
                            </a>
                        <?php endif; ?>
                        
                        <a href="<?php echo admin_url('plugins.php'); ?>" class="button button-secondary" style="background: linear-gradient(135deg, #f0f0f1 0%, #e8e8e9 100%); border: 1px solid #c3c4c7; border-radius: 6px; padding: 10px 16px; font-weight: 600; color: #50575e; text-decoration: none; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 6px;">
                            <span class="dashicons dashicons-admin-plugins" style="font-size: 16px; line-height: 1;"></span>
                            <span><?php _e('Go to Plugins Page', 'yatra'); ?></span>
                        </a>
                    </div>
                    
                    <div style="margin-top: 15px; padding: 12px; background: rgba(240, 184, 73, 0.1); border-radius: 6px; border-left: 3px solid #f0b849;">
                        <p style="margin: 0; color: #8a6914; font-size: 13px; font-style: italic;">
                            <span class="dashicons dashicons-info" style="margin-right: 6px; color: #f0b849;"></span>
                            <?php 
                            if ($yatra_pro_status['is_compatible']) {
                                _e('This will automatically deactivate the old plugins and enable the corresponding features in Yatra Pro 2.0.0. Future updates for these plugins will only be available in Yatra Pro.', 'yatra');
                            } elseif ($yatra_pro_status['needs_installation']) {
                                _e('Yatra Pro 2.0.0 is required to use these integrated features. Download Yatra Pro from your account at store.mantrabrain.com/account or purchase a license to unlock all premium functionality and receive future updates.', 'yatra');
                            } elseif ($yatra_pro_status['needs_activation']) {
                                _e('Yatra Pro is installed but not activated. Activate it to use the integrated features and receive future updates.', 'yatra');
                            } elseif ($yatra_pro_status['needs_upgrade']) {
                                _e('Your Yatra Pro version is outdated. Upgrade to version 2.0.0 or higher to use these features and receive future updates.', 'yatra');
                            }
                            ?>
                        </p>
                    </div>
                    
                    <?php if ($yatra_pro_status['needs_installation']): ?>
                    <div style="margin-top: 15px; padding: 15px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border: 1px solid #dee2e6;">
                        <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                            <span class="dashicons dashicons-admin-tools" style="color: #0073aa;"></span>
                            <?php _e('Installation Instructions:', 'yatra'); ?>
                        </h4>
                        <ol style="margin: 0; padding-left: 20px; color: #6c757d; font-size: 13px; line-height: 1.6;">
                            <li><?php _e('Click "Download Yatra Pro" to go to your account page', 'yatra'); ?></li>
                            <li><?php _e('Download the Yatra Pro plugin file from your account', 'yatra'); ?></li>
                            <li><?php _e('Go to WordPress Admin → Plugins → Add New → Upload Plugin', 'yatra'); ?></li>
                            <li><?php _e('Upload and activate the Yatra Pro plugin', 'yatra'); ?></li>
                            <li><?php _e('Return here and click "Enable Feature & Deactivate" to migrate your old plugins', 'yatra'); ?></li>
                        </ol>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
            
            <div class="yatra-compatibility-status" style="display: none; margin-top: 15px; padding: 15px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border: 1px solid #dee2e6;">
                <p class="yatra-status-message" style="margin: 0; font-weight: 500; display: flex; align-items: center; gap: 8px;"></p>
            </div>
        </div>
        
        <style>
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
        }
        
        .yatra-pro-compatibility-notice .button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .yatra-pro-compatibility-notice .button-primary:hover {
            background: linear-gradient(135deg, #005a87 0%, #004a70 100%) !important;
        }
        
        .yatra-pro-compatibility-notice .button-secondary:hover {
            background: linear-gradient(135deg, #e8e8e9 0%, #dcdcde 100%) !important;
            border-color: #8c8f94 !important;
        }
        </style>
        <?php
    }

    /**
     * Get list of all old plugins (for reference)
     * 
     * @return array Array of all old plugin files
     */
    public function get_all_old_plugins()
    {
        return $this->old_plugins;
    }

    /**
     * Get plugin names mapping (for reference)
     * 
     * @return array Array of plugin file to display name mapping
     */
    public function get_plugin_names()
    {
        return $this->plugin_names;
    }

    /**
     * Check if a specific plugin is active
     * 
     * @param string $plugin_file Plugin file path
     * @return bool True if plugin is active
     */
    public function is_plugin_active($plugin_file)
    {
        $active_plugins = get_option('active_plugins', array());
        return in_array($plugin_file, $active_plugins);
    }

    /**
     * Get compatibility status
     * 
     * @return array Array with compatibility information
     */
    public function get_compatibility_status()
    {
        $active_old_plugins = $this->get_active_old_plugins();
        
        return array(
            'is_compatible' => $this->are_all_old_plugins_deactivated(),
            'active_old_plugins' => $active_old_plugins,
            'active_old_plugins_count' => count($active_old_plugins),
            'all_old_plugins' => $this->old_plugins,
            'plugin_names' => $this->plugin_names
        );
    }

    /**
     * Enqueue scripts and styles
     */
    public function enqueue_scripts()
    {
        if (!$this->are_all_old_plugins_deactivated()) {
            ?>
            <script type="text/javascript">
            jQuery(document).ready(function($) {
                // Handle Enable Feature & Deactivate button
                $('.yatra-enable-feature-btn').on('click', function(e) {
                    e.preventDefault();
                    
                    var $btn = $(this);
                    var $status = $('.yatra-compatibility-status');
                    var $message = $('.yatra-status-message');
                    var nonce = $btn.data('nonce');
                    
                    // Disable button and show loading
                    $btn.prop('disabled', true);
                    $btn.find('.dashicons').removeClass('dashicons-yes-alt').addClass('dashicons-update').css('animation', 'spin 1s linear infinite');
                    $btn.find('span:not(.dashicons)').text('<?php _e('Processing...', 'yatra'); ?>');
                    
                    // Show status area
                    $status.show();
                    $message.html('<span class="dashicons dashicons-update" style="animation: spin 1s linear infinite;"></span> <?php _e('Deactivating plugins and enabling features...', 'yatra'); ?>');
                    
                    $.ajax({
                        url: ajaxurl,
                        type: 'POST',
                        data: {
                            action: 'yatra_enable_feature_and_deactivate',
                            nonce: nonce
                        },
                        success: function(response) {
                            if (response.success) {
                                $message.html('<span class="dashicons dashicons-yes" style="color: #46b450;"></span> ' + response.data.message);
                                
                                // Reload page after 2 seconds
                                setTimeout(function() {
                                    window.location.reload();
                                }, 2000);
                            } else {
                                $message.html('<span class="dashicons dashicons-warning" style="color: #dc3232;"></span> ' + response.data.message);
                                $btn.prop('disabled', false);
                                $btn.find('.dashicons').removeClass('dashicons-update').addClass('dashicons-yes-alt').css('animation', '');
                                $btn.find('span:not(.dashicons)').text('<?php _e('Enable Feature & Deactivate', 'yatra'); ?>');
                            }
                        },
                        error: function() {
                            $message.html('<span class="dashicons dashicons-warning" style="color: #dc3232;"></span> <?php _e('An error occurred. Please try again.', 'yatra'); ?>');
                            $btn.prop('disabled', false);
                            $btn.find('.dashicons').removeClass('dashicons-update').addClass('dashicons-yes-alt').css('animation', '');
                            $btn.find('span:not(.dashicons)').text('<?php _e('Enable Feature & Deactivate', 'yatra'); ?>');
                        }
                    });
                });
                
                // Handle Go to Features button
                $('.yatra-go-to-features-btn').on('click', function(e) {
                    e.preventDefault();
                    
                    var $btn = $(this);
                    var nonce = $btn.data('nonce');
                    
                    // Disable button and show loading
                    $btn.prop('disabled', true);
                    $btn.find('.dashicons').removeClass('dashicons-admin-generic').addClass('dashicons-update').css('animation', 'spin 1s linear infinite');
                    
                    $.ajax({
                        url: ajaxurl,
                        type: 'POST',
                        data: {
                            action: 'yatra_go_to_features',
                            nonce: nonce
                        },
                        success: function(response) {
                            if (response.success) {
                                window.location.href = response.data.redirect_url;
                            } else {
                                alert(response.data.message);
                                $btn.prop('disabled', false);
                                $btn.find('.dashicons').removeClass('dashicons-update').addClass('dashicons-admin-generic').css('animation', '');
                            }
                        },
                        error: function() {
                            alert('<?php _e('An error occurred. Please try again.', 'yatra'); ?>');
                            $btn.prop('disabled', false);
                            $btn.find('.dashicons').removeClass('dashicons-update').addClass('dashicons-admin-generic').css('animation', '');
                        }
                    });
                });
                
                // Handle Activate Yatra Pro button
                $('.yatra-activate-pro-btn').on('click', function(e) {
                    e.preventDefault();
                    
                    var $btn = $(this);
                    var $status = $('.yatra-compatibility-status');
                    var $message = $('.yatra-status-message');
                    var nonce = $btn.data('nonce');
                    
                    // Disable button and show loading
                    $btn.prop('disabled', true);
                    $btn.find('.dashicons').removeClass('dashicons-yes').addClass('dashicons-update').css('animation', 'spin 1s linear infinite');
                    $btn.find('span:not(.dashicons)').text('<?php _e('Activating...', 'yatra'); ?>');
                    
                    // Show status area
                    $status.show();
                    $message.html('<span class="dashicons dashicons-update" style="animation: spin 1s linear infinite;"></span> <?php _e('Activating Yatra Pro...', 'yatra'); ?>');
                    
                    $.ajax({
                        url: ajaxurl,
                        type: 'POST',
                        data: {
                            action: 'yatra_activate_pro',
                            nonce: nonce
                        },
                        success: function(response) {
                            if (response.success) {
                                $message.html('<span class="dashicons dashicons-yes" style="color: #46b450;"></span> ' + response.data.message);
                                
                                // Reload page after 2 seconds
                                setTimeout(function() {
                                    window.location.reload();
                                }, 2000);
                            } else {
                                $message.html('<span class="dashicons dashicons-warning" style="color: #dc3232;"></span> ' + response.data.message);
                                $btn.prop('disabled', false);
                                $btn.find('.dashicons').removeClass('dashicons-update').addClass('dashicons-yes').css('animation', '');
                                $btn.find('span:not(.dashicons)').text('<?php _e('Activate Yatra Pro', 'yatra'); ?>');
                            }
                        },
                        error: function() {
                            $message.html('<span class="dashicons dashicons-warning" style="color: #dc3232;"></span> <?php _e('An error occurred. Please try again.', 'yatra'); ?>');
                            $btn.prop('disabled', false);
                            $btn.find('.dashicons').removeClass('dashicons-update').addClass('dashicons-yes').css('animation', '');
                            $btn.find('span:not(.dashicons)').text('<?php _e('Activate Yatra Pro', 'yatra'); ?>');
                        }
                    });
                });
            });
            
            // CSS for spin animation
            var style = document.createElement('style');
            style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
            document.head.appendChild(style);
            </script>
            <?php
        }
    }

    /**
     * Handle Enable Feature & Deactivate AJAX request
     */
    public function handle_enable_feature_and_deactivate()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'yatra_enable_feature')) {
            wp_die('Security check failed');
        }

        // Check if user has permission
        if (!current_user_can('activate_plugins')) {
            wp_send_json_error(array('message' => __('You do not have permission to perform this action.', 'yatra')));
        }

        $active_old_plugins = $this->get_active_old_plugins();
        
        if (empty($active_old_plugins)) {
            wp_send_json_error(array('message' => __('No old plugins found to deactivate.', 'yatra')));
        }

        // Check Yatra Pro status
        $yatra_pro_status = $this->get_yatra_pro_status();
        
        if ($yatra_pro_status['needs_installation']) {
            wp_send_json_error(array('message' => __('Yatra Pro is not installed. Please install and activate Yatra Pro 2.0.0 first.', 'yatra')));
        }
        
        if ($yatra_pro_status['needs_activation']) {
            wp_send_json_error(array('message' => __('Yatra Pro is not activated. Please activate Yatra Pro 2.0.0 first.', 'yatra')));
        }
        
        if ($yatra_pro_status['needs_upgrade']) {
            wp_send_json_error(array('message' => __('Please upgrade Yatra Pro to version 2.0.0 or higher to use this feature.', 'yatra')));
        }

        if (!$yatra_pro_status['is_compatible']) {
            wp_send_json_error(array('message' => __('Yatra Pro 2.0.0 is required but not properly configured.', 'yatra')));
        }

        $deactivated_plugins = array();
        $enabled_features = array();

        // Deactivate old plugins
        foreach ($active_old_plugins as $plugin) {
            if (is_plugin_active($plugin)) {
                deactivate_plugins($plugin);
                $deactivated_plugins[] = $this->get_plugin_display_name($plugin);
            }
        }

        // Enable corresponding features in Yatra Pro
        foreach ($active_old_plugins as $plugin) {
            if (isset($this->plugin_to_feature_mapping[$plugin])) {
                $feature = $this->plugin_to_feature_mapping[$plugin];
                $this->enable_yatra_pro_feature($feature);
                $enabled_features[] = $feature;
            }
        }

        $message = sprintf(
            __('Successfully deactivated %d plugin(s) and enabled corresponding features in Yatra Pro 2.0.0. The page will reload shortly.', 'yatra'),
            count($deactivated_plugins)
        );

        wp_send_json_success(array('message' => $message));
    }

    /**
     * Handle Go to Features AJAX request
     */
    public function handle_go_to_features()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'yatra_go_to_features')) {
            wp_die('Security check failed');
        }

        // Check Yatra Pro status
        $yatra_pro_status = $this->get_yatra_pro_status();
        
        if ($yatra_pro_status['needs_installation']) {
            wp_send_json_error(array('message' => __('Yatra Pro is not installed. Please install and activate Yatra Pro 2.0.0 first.', 'yatra')));
        }
        
        if ($yatra_pro_status['needs_activation']) {
            wp_send_json_error(array('message' => __('Yatra Pro is not activated. Please activate Yatra Pro 2.0.0 first.', 'yatra')));
        }
        
        if ($yatra_pro_status['needs_upgrade']) {
            wp_send_json_error(array('message' => __('Please upgrade Yatra Pro to version 2.0.0 or higher to access the features page.', 'yatra')));
        }

        if (!$yatra_pro_status['is_compatible']) {
            wp_send_json_error(array('message' => __('Yatra Pro 2.0.0 is required but not properly configured.', 'yatra')));
        }

        // Redirect to Yatra Pro features page
        $redirect_url = admin_url('admin.php?page=yatra-pro-features');
        
        wp_send_json_success(array('redirect_url' => $redirect_url));
    }

    /**
     * Handle Activate Yatra Pro AJAX request
     */
    public function handle_activate_pro()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'yatra_activate_pro')) {
            wp_die('Security check failed');
        }

        // Check if user has permission
        if (!current_user_can('activate_plugins')) {
            wp_send_json_error(array('message' => __('You do not have permission to perform this action.', 'yatra')));
        }

        // Check if Yatra Pro is installed
        if (!$this->is_yatra_pro_installed()) {
            wp_send_json_error(array('message' => __('Yatra Pro is not installed. Please install Yatra Pro first.', 'yatra')));
        }

        // Check if Yatra Pro is already activated
        if ($this->is_yatra_pro_activated()) {
            wp_send_json_error(array('message' => __('Yatra Pro is already activated.', 'yatra')));
        }

        // Activate Yatra Pro
        $plugin_file = 'yatra-pro/yatra-pro.php';
        $result = activate_plugin($plugin_file);

        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => sprintf(__('Failed to activate Yatra Pro: %s', 'yatra'), $result->get_error_message())));
        }

        // Check if activation was successful
        if (!is_plugin_active($plugin_file)) {
            wp_send_json_error(array('message' => __('Yatra Pro activation failed. Please try again.', 'yatra')));
        }

        $message = __('Yatra Pro has been successfully activated! The page will reload shortly.', 'yatra');
        wp_send_json_success(array('message' => $message));
    }

    /**
     * Get Yatra Pro version
     * 
     * @return string|false Yatra Pro version or false if not found
     */
    private function get_yatra_pro_version()
    {
        if (!function_exists('get_plugin_data')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $plugin_file = 'yatra-pro/yatra-pro.php';
        
        if (is_plugin_active($plugin_file)) {
            $plugin_data = get_plugin_data(WP_PLUGIN_DIR . '/' . $plugin_file);
            return isset($plugin_data['Version']) ? $plugin_data['Version'] : false;
        }

        return false;
    }

    /**
     * Check if Yatra Pro is installed
     * 
     * @return bool True if Yatra Pro is installed
     */
    private function is_yatra_pro_installed()
    {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $plugins = get_plugins();
        return isset($plugins['yatra-pro/yatra-pro.php']);
    }

    /**
     * Check if Yatra Pro is activated
     * 
     * @return bool True if Yatra Pro is activated
     */
    private function is_yatra_pro_activated()
    {
        return is_plugin_active('yatra-pro/yatra-pro.php');
    }

    /**
     * Get Yatra Pro installation status
     * 
     * @return array Array with installation status information
     */
    private function get_yatra_pro_status()
    {
        $is_installed = $this->is_yatra_pro_installed();
        $is_activated = $this->is_yatra_pro_activated();
        $version = $this->get_yatra_pro_version();

        return array(
            'is_installed' => $is_installed,
            'is_activated' => $is_activated,
            'version' => $version,
            'is_compatible' => $is_activated && $version && version_compare($version, '2.0.0', '>='),
            'needs_installation' => !$is_installed,
            'needs_activation' => $is_installed && !$is_activated,
            'needs_upgrade' => $is_activated && $version && version_compare($version, '2.0.0', '<')
        );
    }

    /**
     * Enable Yatra Pro feature
     * 
     * @param string $feature Feature name to enable
     * @return bool True if feature was enabled successfully
     */
    private function enable_yatra_pro_feature($feature)
    {
        // Get current enabled features
        $enabled_features = get_option('yatra_pro_enabled_features', array());
        
        // Add the feature if not already enabled
        if (!in_array($feature, $enabled_features)) {
            $enabled_features[] = $feature;
            update_option('yatra_pro_enabled_features', $enabled_features);
        }

        // Also enable specific feature settings if needed
        switch ($feature) {
            case 'downloads':
                update_option('yatra_pro_downloads_enabled', 'yes');
                break;
            case 'payment_gateways':
                update_option('yatra_pro_payment_gateways_enabled', 'yes');
                break;
            case 'availability_conditions':
                update_option('yatra_pro_availability_conditions_enabled', 'yes');
                break;
            case 'google_calendar':
                update_option('yatra_pro_google_calendar_enabled', 'yes');
                break;
            case 'partial_payment':
                update_option('yatra_pro_partial_payment_enabled', 'yes');
                break;
            case 'review_ratings':
                update_option('yatra_pro_review_ratings_enabled', 'yes');
                break;
            case 'services':
                update_option('yatra_pro_services_enabled', 'yes');
                break;
        }

        return true;
    }

    /**
     * Get plugin to feature mapping
     * 
     * @return array Array of plugin to feature mapping
     */
    public function get_plugin_to_feature_mapping()
    {
        return $this->plugin_to_feature_mapping;
    }
}

// Initialize the compatibility checker
new Yatra_Pro_Compatibility();
