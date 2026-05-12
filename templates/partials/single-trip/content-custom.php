<?php
/**
 * Single-trip — Custom tab partial.
 *
 * Renders a user-defined "custom" frontend tab. Mirrors the structure of the
 * other content-* partials so the admin-chosen icon and label resolve through
 * the same `yatra_render_tab_icon()` pipeline (icons.json + IconPicker support).
 *
 * Expected vars:
 * @var object $trip Trip model.
 * @var object $tab  Frontend-tab entry (id, label, icon, custom_content).
 */

if (!defined('ABSPATH')) {
    exit;
}

$tab_id = isset($tab->id) ? (string) $tab->id : 'custom';
$tab_label = isset($tab->label) ? (string) $tab->label : __('Section', 'yatra');
$tab_icon = $tab->icon ?? null;
$custom_content = isset($tab->custom_content) ? (string) $tab->custom_content : '';
?>

<section class="yatra-trip-section yatra-trip-section-custom" id="<?php echo esc_attr($tab_id); ?>">
    <h2 class="yatra-trip-section-title">
        <?php yatra_render_tab_icon($tab_icon, 'book', 'yatra-trip-section-title-icon', $tab_label); ?>
        <?php echo esc_html($tab_label); ?>
    </h2>
    <div class="yatra-custom-content">
        <?php if ($custom_content !== '') : ?>
            <?php echo wp_kses_post($custom_content); ?>
        <?php else : ?>
            <p class="text-gray-500 text-center py-8">
                <?php esc_html_e('No custom content available for this section.', 'yatra'); ?>
            </p>
        <?php endif; ?>
    </div>
</section>
