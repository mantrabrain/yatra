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
$current_tab_label = isset($tabs[$current_tab]) ? $tabs[$current_tab] : '';

if (!$tab_exists) {
    wp_safe_redirect(admin_url('admin.php?page=yatra-settings'));
    exit;
}
?>
<div class="wrap yatra-admin-setting-page-wrap">
    <form method="<?php echo esc_attr(apply_filters('yatra_settings_form_method_tab_' . $current_tab, 'post')); ?>"
          id="mainform" action="" enctype="multipart/form-data">
        <nav class="nav-tab-wrapper yatra-nav-tab-wrapper">
            <?php

            foreach ($tabs as $slug => $label) {
                echo '<a href="' . esc_html(admin_url('admin.php?page=yatra-settings&tab=' . esc_attr($slug))) . '" class="nav-tab ' . ($current_tab === $slug ? 'nav-tab-active' : '') . '">' . esc_html($label) . '</a>';
            }

            do_action('yatra_settings_tabs');

            ?>
        </nav>
        <h1 class="screen-reader-text"><?php echo esc_html($current_tab_label); ?></h1>
        <?php
        do_action('yatra_sections_' . $current_tab);

        self::show_messages();

        do_action('yatra_settings_' . $current_tab);
        do_action('yatra_settings_tabs_' . $current_tab);
        ?>
        <p class="submit">
            <?php if (empty($GLOBALS['hide_save_button'])) : ?>
                <button name="save" class="button-primary yatra-save-button" type="submit"
                        value="<?php esc_attr_e('Save changes', 'yatra'); ?>"><?php esc_html_e('Save changes', 'yatra'); ?></button>
            <?php endif; ?>
            <?php wp_nonce_field('yatra-settings'); ?>
        </p>
    </form>
</div>
