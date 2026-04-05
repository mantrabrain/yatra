<?php

declare(strict_types=1);

namespace Yatra\Hooks;

use Yatra\Migration\MigrationProgress;

/**
 * WordPress admin notice when legacy Yatra (< 3.0) data exists and migration is not fully done.
 */
class MigrationAdminNoticeHooks
{
    public static function init(): void
    {
        if (!is_admin()) {
            return;
        }

        add_action('admin_init', [self::class, 'handleDismiss'], 20);
        add_action('admin_notices', [self::class, 'renderNotice']);
    }

    public static function handleDismiss(): void
    {
        if (empty($_GET['yatra_dismiss_legacy_migration'])) {
            return;
        }

        if (!is_user_logged_in() || !current_user_can('manage_options')) {
            return;
        }

        $nonce = isset($_GET['_wpnonce']) ? sanitize_text_field((string) wp_unslash($_GET['_wpnonce'])) : '';
        if (!wp_verify_nonce($nonce, 'yatra_dismiss_legacy_migration')) {
            return;
        }

        update_user_meta(get_current_user_id(), 'yatra_legacy_migration_notice_dismissed', '1');

        wp_safe_redirect(
            remove_query_arg(
                ['yatra_dismiss_legacy_migration', '_wpnonce'],
                wp_get_referer() ?: admin_url()
            )
        );
        exit;
    }

    public static function renderNotice(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        if (get_user_meta(get_current_user_id(), 'yatra_legacy_migration_notice_dismissed', true)) {
            return;
        }

        if (!class_exists(MigrationProgress::class)) {
            return;
        }

        $migration = new MigrationProgress();
        if (!$migration->legacyMigrationNeedsAttention()) {
            return;
        }

        $toolsUrl = admin_url('admin.php?page=yatra&subpage=tools&tools_tab=migration');
        $dismissUrl = wp_nonce_url(
            add_query_arg('yatra_dismiss_legacy_migration', '1'),
            'yatra_dismiss_legacy_migration'
        );

        echo '<div class="notice notice-warning"><p>';
        echo '<strong>' . esc_html__('Yatra: Data migration required', 'yatra') . '</strong> — ';
        echo esc_html__(
            'We detected tours, bookings, or other data from Yatra 2.x (or earlier). Run the migration tool to move everything into the new Yatra 3.0 database tables.',
            'yatra'
        );
        echo ' ';
        printf(
            '<a href="%1$s">%2$s</a>',
            esc_url($toolsUrl),
            esc_html__('Open Tools → Migration', 'yatra')
        );
        echo ' ';
        printf(
            '<a href="%1$s" class="button-link">%2$s</a>',
            esc_url($dismissUrl),
            esc_html__('Dismiss for this user', 'yatra')
        );
        echo '</p></div>';
    }
}
