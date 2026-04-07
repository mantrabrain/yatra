<?php

declare(strict_types=1);

namespace Yatra\Hooks;

use Yatra\Migration\MigrationProgress;
use Yatra\Migration\ProMigrationReadiness;

/**
 * WordPress admin notice when legacy Yatra 2.x / Pro 2.x data exists and migration is incomplete.
 * Intentionally not dismissible so upgrades are not missed; use Tools → Migration when done.
 */
class MigrationAdminNoticeHooks
{
    public static function init(): void
    {
        if (!is_admin()) {
            return;
        }

        add_action('admin_notices', [self::class, 'renderNotice'], 20);
    }

    public static function renderNotice(): void
    {
        if (!current_user_can('manage_options')) {
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

        echo '<div class="notice notice-warning yatra-legacy-migration-notice"><p>';
        echo '<strong>' . esc_html__('Yatra: Data migration required', 'yatra') . '</strong> — ';
        echo esc_html__(
            'Legacy Yatra 2.x or Yatra Pro 2.x data was detected. Open Tools → Migration to move trips, bookings, and settings into Yatra 3.x.',
            'yatra'
        );
        echo '</p>';

        $pro = ProMigrationReadiness::getState();
        if (!$pro['ready'] && $pro['warning_message'] !== '') {
            echo '<p><strong>' . esc_html__('Yatra Pro:', 'yatra') . '</strong> ';
            echo esc_html($pro['warning_message']);
            echo '</p>';
        }

        echo '<p>';
        printf(
            '<a class="button button-primary" href="%s">%s</a>',
            esc_url($toolsUrl),
            esc_html__('Open Tools → Migration', 'yatra')
        );
        echo '</p></div>';
    }
}
