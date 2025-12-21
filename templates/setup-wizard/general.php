<?php
/**
 * Setup Wizard - General Settings Step
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;

$enable_tour_archive = get_option('yatra_general_enable_tour_archive', 'yes');
$tour_listing_display = get_option('yatra_general_tour_listing_page_displays', 'grid');
$tours_per_page = get_option('yatra_general_number_of_tour_list_per_page', 9);
?>

<form method="post" class="wizard-step">
    <?php wp_nonce_field('yatra-setup'); ?>
    <input type="hidden" name="save_step" value="general">
    
    <div class="wizard-header">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"></path>
            </svg>
            <h1 style="margin: 0;"><?php esc_html_e('General Settings', 'yatra'); ?></h1>
        </div>
        <p style="text-align: center;"><?php esc_html_e('Configure how tours are displayed on your website', 'yatra'); ?></p>
    </div>

    <div class="wizard-content">
        <div class="form-group">
            <label class="form-label">
                <input type="checkbox" name="enable_tour_archive" value="yes" <?php checked($enable_tour_archive, 'yes'); ?>>
                <span><?php esc_html_e('Enable tour archive page', 'yatra'); ?></span>
            </label>
            <p class="form-help"><?php esc_html_e('Display all tours on a dedicated archive page', 'yatra'); ?></p>
        </div>

        <div class="form-group">
            <label class="form-label" for="tour_listing_display"><?php esc_html_e('Display Style', 'yatra'); ?></label>
            <select id="tour_listing_display" name="tour_listing_display" class="form-control">
                <option value="grid" <?php selected($tour_listing_display, 'grid'); ?>><?php esc_html_e('Grid View', 'yatra'); ?></option>
                <option value="list" <?php selected($tour_listing_display, 'list'); ?>><?php esc_html_e('List View', 'yatra'); ?></option>
            </select>
            <p class="form-help"><?php esc_html_e('How tours are displayed on the archive page', 'yatra'); ?></p>
        </div>

        <div class="form-group">
            <label class="form-label" for="tours_per_page"><?php esc_html_e('Tours Per Page', 'yatra'); ?></label>
            <input type="number" id="tours_per_page" name="tours_per_page" value="<?php echo esc_attr($tours_per_page); ?>" min="1" max="100" class="form-control">
            <p class="form-help"><?php esc_html_e('Number of tours to show per page', 'yatra'); ?></p>
        </div>
    </div>

    <div class="wizard-footer">
        <a href="<?php echo esc_url(add_query_arg('step', 'welcome', remove_query_arg('activate_error'))); ?>" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <?php esc_html_e('Back', 'yatra'); ?>
        </a>
        <a href="<?php echo esc_url($this->get_next_step_link()); ?>" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px;">
            <?php esc_html_e('Skip', 'yatra'); ?>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
                <polyline points="12 5 19 12 12 19" transform="translate(5, 0)"></polyline>
            </svg>
        </a>
        <button type="submit" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
            <?php esc_html_e('Continue', 'yatra'); ?>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
        </button>
    </div>
</form>
