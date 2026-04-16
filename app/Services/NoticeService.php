<?php

declare(strict_types=1);

namespace Yatra\Services;

use WP_Error;
use Yatra\Hooks\TelemetryHookNames;
use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\TripRepository;

defined('ABSPATH') || exit;

/**
 * Centralized notices service (React Admin UI + WP admin notices).
 *
 * Rules implemented:
 * - Review notice: after 1 published trip; dismiss cycles 15d → 60d → disabled.
 * - Buy Pro notice (only if Pro not active): after 1 booking; dismiss cycles:
 *   30d (then show only if bookings > 1) → 90d (then show only if bookings > 5) → disabled.
 */
final class NoticeService
{
    public const NOTICE_REVIEW = 'review';
    public const NOTICE_BUY_PRO = 'buy_pro';

    private const OPT_FIRST_TRIP_PUBLISHED_AT = 'yatra_notice_first_trip_published_at';
    private const OPT_FIRST_BOOKING_RECEIVED_AT = 'yatra_notice_first_booking_received_at';

    private const META_REVIEW_DISABLED = 'yatra_notice_review_disabled';
    private const META_REVIEW_DISMISS_COUNT = 'yatra_notice_review_dismiss_count';
    private const META_REVIEW_NEXT_SHOW_AT = 'yatra_notice_review_next_show_at';

    private const META_PRO_DISABLED = 'yatra_notice_buy_pro_disabled';
    private const META_PRO_STAGE = 'yatra_notice_buy_pro_stage';
    private const META_PRO_NEXT_SHOW_AT = 'yatra_notice_buy_pro_next_show_at';

    /**
     * Register hooks.
     */
    public static function init(): void
    {
        if (!is_admin()) {
            return;
        }

        add_action('admin_notices', [self::class, 'renderWordPressNotices'], 30);
        add_action('admin_enqueue_scripts', [self::class, 'enqueueWordPressNoticeScript']);
        add_action('wp_ajax_yatra_dismiss_notice', [self::class, 'ajaxDismissNotice']);

        // Lifecycle signals that unlock notices.
        add_action(TelemetryHookNames::BOOKING_CREATED, [self::class, 'markFirstBookingReceived'], 10, 2);
        add_action('yatra_trip_created_with_relations', [self::class, 'maybeMarkFirstTripPublished'], 10, 3);
        add_action('yatra_trip_updated_with_relations', [self::class, 'maybeMarkFirstTripPublished'], 10, 3);
    }

    /**
     * REST: build notices payload for current user.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function getActiveNoticesForCurrentUser(): array
    {
        $userId = get_current_user_id();
        if ($userId <= 0) {
            return [];
        }

        $notices = [];

        if (self::shouldShowReviewNotice($userId)) {
            $notices[] = self::buildReviewNotice();
        }

        if (self::shouldShowBuyProNotice($userId)) {
            $notices[] = self::buildBuyProNotice();
        }

        return $notices;
    }

    /**
     * REST/AJAX: dismiss notice for current user.
     *
     * @return bool|\WP_Error True when dismissed/ignored; WP_Error on failure.
     */
    public static function dismissForCurrentUser(string $noticeId)
    {
        $userId = get_current_user_id();
        if ($userId <= 0) {
            return new WP_Error('yatra_notice_unauthorized', __('Unauthorized.', 'yatra'), ['status' => 401]);
        }

        if (!current_user_can('manage_options') && !current_user_can('manage_yatra')) {
            return new WP_Error('yatra_notice_forbidden', __('Forbidden.', 'yatra'), ['status' => 403]);
        }

        $now = current_time('timestamp');

        if ($noticeId === self::NOTICE_REVIEW) {
            $disabled = (bool) get_user_meta($userId, self::META_REVIEW_DISABLED, true);
            if ($disabled) {
                return true;
            }

            $count = (int) get_user_meta($userId, self::META_REVIEW_DISMISS_COUNT, true);
            $count++;

            update_user_meta($userId, self::META_REVIEW_DISMISS_COUNT, $count);

            if ($count === 1) {
                update_user_meta($userId, self::META_REVIEW_NEXT_SHOW_AT, $now + 15 * DAY_IN_SECONDS);
            } elseif ($count === 2) {
                update_user_meta($userId, self::META_REVIEW_NEXT_SHOW_AT, $now + 60 * DAY_IN_SECONDS);
            } else {
                update_user_meta($userId, self::META_REVIEW_DISABLED, 1);
                delete_user_meta($userId, self::META_REVIEW_NEXT_SHOW_AT);
            }

            return true;
        }

        if ($noticeId === self::NOTICE_BUY_PRO) {
            $disabled = (bool) get_user_meta($userId, self::META_PRO_DISABLED, true);
            if ($disabled) {
                return true;
            }

            $stage = (int) get_user_meta($userId, self::META_PRO_STAGE, true);
            $stage = max(0, $stage);
            $stage++;

            update_user_meta($userId, self::META_PRO_STAGE, $stage);

            if ($stage === 1) {
                update_user_meta($userId, self::META_PRO_NEXT_SHOW_AT, $now + 30 * DAY_IN_SECONDS);
            } elseif ($stage === 2) {
                update_user_meta($userId, self::META_PRO_NEXT_SHOW_AT, $now + 90 * DAY_IN_SECONDS);
            } else {
                update_user_meta($userId, self::META_PRO_DISABLED, 1);
                delete_user_meta($userId, self::META_PRO_NEXT_SHOW_AT);
            }

            return true;
        }

        return new WP_Error('yatra_notice_invalid', __('Invalid notice.', 'yatra'), ['status' => 400]);
    }

    /**
     * WordPress admin notice renderer (standard WP UI).
     */
    public static function renderWordPressNotices(): void
    {
        if (!current_user_can('manage_options') && !current_user_can('manage_yatra')) {
            return;
        }

        $notices = self::getActiveNoticesForCurrentUser();
        if ($notices === []) {
            return;
        }

        foreach ($notices as $notice) {
            $id = isset($notice['id']) ? (string) $notice['id'] : '';
            $title = isset($notice['title']) ? (string) $notice['title'] : '';
            $message = isset($notice['message']) ? (string) $notice['message'] : '';
            $actions = isset($notice['actions']) && is_array($notice['actions']) ? $notice['actions'] : [];

            if ($id === '' || $message === '') {
                continue;
            }

            // Upgrade notice — match screenshot UI exactly.
            if ($id === self::NOTICE_BUY_PRO) {
                $primary = $actions[0] ?? null;
                $ctaLabel = is_array($primary) && !empty($primary['label']) ? (string) $primary['label'] : esc_html__('Upgrade to Pro', 'yatra');
                $ctaUrl = is_array($primary) && !empty($primary['url']) ? (string) $primary['url'] : 'https://wpyatra.com/pricing/';
                $ctaTarget = is_array($primary) && !empty($primary['target']) ? (string) $primary['target'] : '_blank';
                $ctaAttrs = $ctaTarget === '_blank' ? ' target="_blank" rel="noopener noreferrer"' : '';

                $bookingCount = self::getTotalBookingsCount();
                if ($bookingCount < 0) {
                    $bookingCount = 0;
                }

                // Use the exact Easy Invoice style markup (adapted for Yatra).
                echo '<div id="yatra-promotion-notice" class="notice is-dismissible yatra-notice" data-yatra-notice-id="' . esc_attr($id) . '" style="background: linear-gradient(135deg, #fdf6f0 0%, #f8f9fa 50%, #fff5ee 100%); border: 1px solid #f0e6d8; border-left: 4px solid #ff9500; border-radius: 6px; margin: 15px 0; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); position: relative;">';

                echo '<div style="position: absolute; top: 8px; right: 80px; background: #ff9500; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">⚡ ' . esc_html__('Limited Time', 'yatra') . '</div>';

                echo '<div class="yatra-promotion-content" style="padding: 18px;">';
                echo '<div style="display: flex; align-items: flex-start; gap: 15px;">';
                echo '<div style="flex: 1;">';

                echo '<h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 17px; font-weight: 600;">🚀 ' . esc_html__('Upgrade to Yatra Pro - Save 30%+!', 'yatra') . '</h3>';

                echo '<p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.5; color: #495057;">';
                echo wp_kses_post(
                    sprintf(
                        /* translators: %d: booking count */
                        __('You’ve received <strong style="color: #ff9500;">%d</strong> booking(s)! Get <strong style="color: #ff9500;">30%%+ OFF</strong> on Yatra Pro. Unlock premium payment gateways, advanced modules, automation tools, and priority support.', 'yatra'),
                        (int) $bookingCount
                    )
                );
                echo '</p>';

                echo '<div style="background: rgba(255, 149, 0, 0.08); padding: 10px; border-radius: 4px; margin-bottom: 15px; border-left: 3px solid #ff9500;">';
                echo '<p style="margin: 0; font-size: 13px; color: #495057; font-weight: 600;">🎉 <strong>' . esc_html__('Special Offer:', 'yatra') . '</strong> ' . esc_html__('Save 30%+ on your Pro upgrade with premium features and priority support!', 'yatra') . '</p>';
                echo '</div>';

                echo '<div style="display: flex; align-items: center; gap: 12px;">';
                echo '<a href="' . esc_url($ctaUrl) . '"' . $ctaAttrs . ' class="button button-primary" style="background-color: #ff9500; border-color: #ff9500; color: white; padding: 6px 14px; font-weight: 600; font-size: 13px; border-radius: 4px; text-decoration: none; box-shadow: 0 1px 4px rgba(255, 149, 0, 0.25); transition: all 0.3s ease;">⚡ ' . esc_html__('Save 30%+ - Upgrade to Pro', 'yatra') . '</a>';
                echo '<a href="#" id="yatra-promotion-dismiss" data-yatra-notice-dismiss="1" style="color: #6c757d; text-decoration: none; font-size: 13px; transition: color 0.3s ease;">' . esc_html__('Maybe later', 'yatra') . '</a>';
                echo '</div>';

                // Close: flex:1, flex row, content wrapper. Outer notice stays open for dismiss button.
                echo '</div></div></div>';

                echo '<button type="button" class="notice-dismiss"><span class="screen-reader-text">' . esc_html__('Dismiss this notice.', 'yatra') . '</span></button>';
                echo '</div>';
                continue;
            }

            // Default notice card (currently only used for review notice).
            $class = 'notice is-dismissible yatra-notice yatra-notice-card yatra-notice-card--review';

            $iconSvg = '';
            // star icon
            $iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 17.3l-6.18 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73L18.18 21z"/></svg>';

            echo '<div class="' . esc_attr($class) . '" data-yatra-notice-id="' . esc_attr($id) . '">';
            echo '<div class="yatra-notice-card__wrap">';
            echo '<div class="yatra-notice-card__row">';

            echo '<div class="yatra-notice-card__left">';
            echo '<div class="yatra-notice-card__icon" aria-hidden="true">' . $iconSvg . '</div>';
            echo '<div class="yatra-notice-card__content">';
            echo '<div class="yatra-notice-card__meta">';
            if ($title !== '') {
                echo '<div class="yatra-notice-card__title">' . esc_html($title) . '</div>';
            }
            echo '</div>';
            echo '<div class="yatra-notice-card__message">' . wp_kses_post($message) . '</div>';
            echo '</div>'; // content
            echo '</div>'; // left

            echo '<div class="yatra-notice-card__actions">';
            if ($actions !== []) {
                $primary = $actions[0] ?? null;
                if (is_array($primary)) {
                    $label = isset($primary['label']) ? (string) $primary['label'] : '';
                    $url = isset($primary['url']) ? (string) $primary['url'] : '';
                    $target = isset($primary['target']) ? (string) $primary['target'] : '';
                    if ($label !== '' && $url !== '') {
                        $attrs = $target === '_blank'
                            ? ' target="_blank" rel="noopener noreferrer"'
                            : '';
                        echo '<a class="button button-primary yatra-notice-card__cta" href="' . esc_url($url) . '"' . $attrs . '>' . esc_html($label) . '</a>';
                    }
                }
            }
            echo '</div>'; // actions

            echo '</div>'; // row
            echo '</div>'; // wrap
            echo '</div>'; // notice
        }
    }

    public static function enqueueWordPressNoticeScript(): void
    {
        if (!is_admin()) {
            return;
        }
        if (!current_user_can('manage_options') && !current_user_can('manage_yatra')) {
            return;
        }

        // Only enqueue if there is at least one notice to show.
        $notices = self::getActiveNoticesForCurrentUser();
        if ($notices === []) {
            return;
        }

        wp_enqueue_style(
            'yatra-admin-notices',
            YATRA_PLUGIN_URL . 'assets/admin/css/notices.css',
            [],
            defined('YATRA_VERSION') ? YATRA_VERSION : null
        );

        wp_enqueue_script(
            'yatra-wp-notices',
            YATRA_PLUGIN_URL . 'assets/admin/js/wp-notices.js',
            ['jquery'],
            defined('YATRA_VERSION') ? YATRA_VERSION : null,
            true
        );

        wp_localize_script('yatra-wp-notices', 'yatraWpNotices', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('yatra_dismiss_notice'),
        ]);
    }

    public static function ajaxDismissNotice(): void
    {
        check_ajax_referer('yatra_dismiss_notice', 'nonce');

        $noticeId = isset($_POST['notice_id']) ? sanitize_key((string) wp_unslash($_POST['notice_id'])) : '';
        $result = self::dismissForCurrentUser($noticeId);
        if ($result === true) {
            wp_send_json_success(['dismissed' => true]);
        }

        wp_send_json_error([
            'code' => $result->get_error_code(),
            'message' => $result->get_error_message(),
        ], (int) ($result->get_error_data()['status'] ?? 400));
    }

    public static function markFirstBookingReceived(int $bookingId, object $booking): void
    {
        if (get_option(self::OPT_FIRST_BOOKING_RECEIVED_AT)) {
            return;
        }

        update_option(self::OPT_FIRST_BOOKING_RECEIVED_AT, current_time('timestamp'), false);
    }

    /**
     * Called for both create_with_relations and update_with_relations.
     *
     * @param int $tripId
     * @param array $relationships
     * @param array $data
     */
    public static function maybeMarkFirstTripPublished(int $tripId, array $relationships, array $data): void
    {
        if (get_option(self::OPT_FIRST_TRIP_PUBLISHED_AT)) {
            return;
        }

        $status = isset($data['status']) ? (string) $data['status'] : '';
        if ($status === '') {
            // If status isn't in payload, fallback to current DB row.
            $repo = new TripRepository();
            $trip = $repo->find((int) $tripId);
            $status = is_object($trip) && isset($trip->status) ? (string) $trip->status : '';
        }

        if (!in_array($status, ['publish', 'published'], true)) {
            return;
        }

        update_option(self::OPT_FIRST_TRIP_PUBLISHED_AT, current_time('timestamp'), false);
    }

    private static function isProActive(): bool
    {
        return defined('YATRA_PRO_VERSION') || defined('YATRA_PRO_ACTIVE') || class_exists('Yatra_Pro');
    }

    private static function shouldShowReviewNotice(int $userId): bool
    {
        $publishedAt = (int) get_option(self::OPT_FIRST_TRIP_PUBLISHED_AT, 0);
        if ($publishedAt <= 0) {
            // Backfill for sites that already have published trips.
            $tripRepo = new TripRepository();
            $publishedCount = $tripRepo->countByStatus('publish') + $tripRepo->countByStatus('published');
            if ($publishedCount > 0) {
                $publishedAt = current_time('timestamp');
                update_option(self::OPT_FIRST_TRIP_PUBLISHED_AT, $publishedAt, false);
            }
        }
        if ($publishedAt <= 0) {
            return false;
        }

        if ((bool) get_user_meta($userId, self::META_REVIEW_DISABLED, true)) {
            return false;
        }

        $nextShowAt = (int) get_user_meta($userId, self::META_REVIEW_NEXT_SHOW_AT, true);
        if ($nextShowAt > 0 && current_time('timestamp') < $nextShowAt) {
            return false;
        }

        return true;
    }

    private static function shouldShowBuyProNotice(int $userId): bool
    {
        if (self::isProActive()) {
            return false;
        }

        $firstBookingAt = (int) get_option(self::OPT_FIRST_BOOKING_RECEIVED_AT, 0);
        if ($firstBookingAt <= 0) {
            // Backfill for sites that already have bookings.
            if (self::getTotalBookingsCount() > 0) {
                $firstBookingAt = current_time('timestamp');
                update_option(self::OPT_FIRST_BOOKING_RECEIVED_AT, $firstBookingAt, false);
            }
        }
        if ($firstBookingAt <= 0) {
            return false;
        }

        if ((bool) get_user_meta($userId, self::META_PRO_DISABLED, true)) {
            return false;
        }

        $stage = (int) get_user_meta($userId, self::META_PRO_STAGE, true);
        $stage = max(0, $stage);

        $bookingCount = self::getTotalBookingsCount();

        // Gate by booking thresholds per stage.
        if ($stage === 0 && $bookingCount < 1) {
            return false;
        }
        if ($stage === 1 && $bookingCount < 2) {
            return false;
        }
        if ($stage >= 2 && $bookingCount < 6) {
            return false;
        }

        $nextShowAt = (int) get_user_meta($userId, self::META_PRO_NEXT_SHOW_AT, true);
        if ($nextShowAt > 0 && current_time('timestamp') < $nextShowAt) {
            return false;
        }

        return true;
    }

    private static function getTotalBookingsCount(): int
    {
        $repo = new BookingRepository();
        $table = $repo->getBookingsTableName();
        global $wpdb;

        $n = $wpdb->get_var("SELECT COUNT(*) FROM {$table}");
        return (int) $n;
    }

    /**
     * @return array<string, mixed>
     */
    private static function buildReviewNotice(): array
    {
        return [
            'id' => self::NOTICE_REVIEW,
            'type' => 'info',
            'title' => __('How’s Yatra working for you?', 'yatra'),
            'message' => __(
                'You’ve published your first trip — congratulations. If Yatra is helping your business, a quick 5‑star review would mean a lot and helps other site owners choose with confidence.',
                'yatra'
            ),
            'actions' => [
                [
                    'label' => __('Leave a 5‑star review', 'yatra'),
                    'url' => 'https://wordpress.org/support/plugin/yatra/reviews/?filter=5#new-post',
                    'target' => '_blank',
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function buildBuyProNotice(): array
    {
        return [
            'id' => self::NOTICE_BUY_PRO,
            'type' => 'warning',
            'title' => __('Upgrade to Yatra Pro — save time on every booking', 'yatra'),
            'message' => __(
                'You’re now receiving bookings. Yatra Pro helps you scale with premium payment gateways, advanced modules, and automation tools — built to reduce admin work and increase conversions.',
                'yatra'
            ),
            'actions' => [
                [
                    'label' => __('Upgrade to Pro', 'yatra'),
                    'url' => 'https://wpyatra.com/pricing/',
                    'target' => '_blank',
                ],
            ],
        ];
    }
}

