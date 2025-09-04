<?php
/**
 * Admin View: Settings
 *
 * @package AgencyEcommerceAddons
 */

if (!defined('ABSPATH')) {
    exit;
}

$tab_exists = isset($tabs[$current_tab]) || has_action('yatra_sections_' . $current_tab) || has_action('yatra_settings_' . $current_tab) || has_action('yatra_settings_tabs_' . $current_tab);
$current_tab_label = isset($tabs[$current_tab]) ? (is_array($tabs[$current_tab]) ? $tabs[$current_tab]['label'] : $tabs[$current_tab]) : '';

if (!$tab_exists) {
    wp_safe_redirect(admin_url('admin.php?page=yatra-settings'));
    exit;
}

// Helper function to get tab icon from the tabs array
function get_tab_icon($tab_slug) {
    global $tabs;
    if (isset($tabs[$tab_slug]) && is_array($tabs[$tab_slug]) && isset($tabs[$tab_slug]['icon']) && !empty($tabs[$tab_slug]['icon'])) {
        return $tabs[$tab_slug]['icon'];
    }
    // Fallback to default icon if no custom icon is set
    return '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 15a7 7 0 01-7-7h2a5 5 0 005 5v2zm0-13a7 7 0 017 7h-2a5 5 0 00-5-5V2z"/></svg>';
}

// Helper function to get tab description from the tabs array
function get_tab_description($tab_slug) {
    global $tabs;
    if (isset($tabs[$tab_slug]) && is_array($tabs[$tab_slug]) && isset($tabs[$tab_slug]['description'])) {
        return $tabs[$tab_slug]['description'];
    }
    return '';
}
?>
<div class="wrap yatra-admin-setting-page-wrap yatra-settings">
    <div class="yatra-settings-container">
        <div class="yatra-settings-sidebar">
            <div class="yatra-settings-sidebar-header">
                <h2 class="yatra-settings-sidebar-title">Settings</h2>
                <p class="yatra-settings-sidebar-subtitle">Manage your tour configuration</p>
            </div>
            <nav class="yatra-settings-nav">
                <?php
                foreach ($tabs as $slug => $tab_data) {
                    $is_active = ($current_tab === $slug);
                    $icon = get_tab_icon($slug);
                    
                    // Handle both old format (string) and new format (array)
                    if (is_array($tab_data)) {
                        $label = $tab_data['label'];
                        $description = $tab_data['description'];
                    } else {
                        $label = $tab_data;
                        $description = '';
                    }
                    
                    echo '<a href="' . esc_html(admin_url('admin.php?page=yatra-settings&tab=' . esc_attr($slug))) . '" class="yatra-settings-nav-item ' . ($is_active ? 'active' : '') . '" role="tab" aria-selected="' . ($is_active ? 'true' : 'false') . '">';
                    echo '<span class="yatra-settings-nav-icon">' . $icon . '</span>';
                    echo '<div class="yatra-settings-nav-content">';
                    echo '<span class="yatra-settings-nav-title">' . esc_html($label) . '</span>';
                    if ($description) {
                        echo '<span class="yatra-settings-nav-description">' . esc_html($description) . '</span>';
                    }
                    echo '</div>';
                    echo '</a>';
                }
                do_action('yatra_settings_tabs');
                ?>
            </nav>
        </div>
        
        <div class="yatra-settings-content">
            <div class="yatra-settings-content-header">
                <h2 class="yatra-settings-content-title">
                    <span class="dashicons dashicons-admin-generic"></span>
                    <?php echo esc_html($current_tab_label); ?>
                </h2>
                <?php 
                $description = get_tab_description($current_tab);
                if ($description) : ?>
                    <p class="yatra-settings-content-description"><?php echo esc_html($description); ?></p>
                <?php endif; ?>
            </div>
            
            <div class="yatra-settings-content-body">
                <form method="<?php echo esc_attr(apply_filters('yatra_settings_form_method_tab_' . $current_tab, 'post')); ?>"
                      id="mainform" action="" enctype="multipart/form-data">
                    
                    <?php
                    do_action('yatra_sections_' . $current_tab);
                    self::show_messages();
                    do_action('yatra_settings_' . $current_tab);
                    do_action('yatra_settings_tabs_' . $current_tab);
                    ?>
                    
                    <div class="yatra-settings-actions">
                        <?php if (empty($GLOBALS['hide_save_button'])) : ?>
                            <button name="save" class="button-primary yatra-save-button" type="submit"
                                    value="<?php esc_attr_e('Save changes', 'yatra'); ?>">
                                <span class="dashicons dashicons-saved"></span>
                                <?php esc_html_e('Save changes', 'yatra'); ?>
                            </button>
                        <?php endif; ?>
                        <?php wp_nonce_field('yatra-settings'); ?>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
