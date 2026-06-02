<?php

declare(strict_types=1);

namespace Yatra\Security;

use Yatra\Utils\Logger;

/**
 * Yatra Security Guard — monitor-first rollout switch for hardening checks.
 *
 * Newly added ownership / CSRF / amount-integrity checks call into this guard so
 * they can ship in **monitor mode** (the default): when a check would reject or
 * override a request, it instead {@see self::flag()}s a log line and lets the
 * pre-existing behaviour proceed unchanged. This guarantees zero behavioural
 * change for existing Free/Pro installs on update.
 *
 * Once an operator has watched the logs on real traffic and confirmed that honest
 * users never trip a guard, they flip to **enforce mode** and the checks start
 * actually blocking tampered / cross-customer requests.
 *
 * Enforce mode is enabled by EITHER:
 *   - defining `YATRA_SECURITY_ENFORCE` truthy in wp-config.php, OR
 *   - setting the `yatra_security_enforce` option to a truthy value
 *     (Settings → Tools/Advanced toggle), OR
 *   - returning true from the `yatra_security_enforce` filter.
 *
 * Default: false (monitor mode).
 */
class Guard
{
    /** Option name backing the admin toggle. */
    public const OPTION = 'yatra_security_enforce';

    /** Prefix for every monitor-mode log line, so operators can grep one tag. */
    private const LOG_TAG = '[Yatra Security]';

    /**
     * Are the hardening checks in ENFORCE mode (actually block) vs MONITOR (log only)?
     */
    public static function enforcing(): bool
    {
        // Constant wins so power users / staging can force-enable regardless of DB state.
        if (defined('YATRA_SECURITY_ENFORCE')) {
            $enforce = (bool) constant('YATRA_SECURITY_ENFORCE');
        } else {
            $enforce = (bool) get_option(self::OPTION, false);
        }

        /**
         * Filter the security enforce mode.
         *
         * @param bool $enforce True to enforce (block), false to monitor (log only).
         */
        return (bool) apply_filters('yatra_security_enforce', $enforce);
    }

    /**
     * Record a would-block event. Always safe to call; in monitor mode this is the
     * only effect, in enforce mode it documents what was blocked.
     *
     * Keep $context PII-light — booking/user ids and a coarse client IP are fine,
     * raw names / emails / card data are not.
     *
     * @param string               $reason  Short machine-ish reason, e.g. 'payment_complete_ownership'.
     * @param array<string, mixed> $context Small id-only context map.
     */
    public static function flag(string $reason, array $context = []): void
    {
        $mode = self::enforcing() ? 'blocked' : 'would-block';

        if (!isset($context['ip'])) {
            $context['ip'] = self::clientIpHint();
        }
        $context['mode'] = $mode;

        if (class_exists(Logger::class)) {
            Logger::warning(self::LOG_TAG . ' ' . $mode . ': ' . $reason, $context);
        } elseif (defined('WP_DEBUG') && WP_DEBUG) {
            // Logger should always exist, but never let logging itself fatal a request.
            error_log(self::LOG_TAG . ' ' . $mode . ': ' . $reason . ' ' . wp_json_encode($context));
        }
    }

    /**
     * Convenience: a check failed. Always logs; returns whether the caller should
     * actually block (true only in enforce mode). Callers keep their own reject
     * response so HTTP status / message stay route-appropriate.
     *
     *   if (!$ownsBooking && Guard::denied('payment_complete_ownership', $ctx)) {
     *       return new WP_REST_Response([...], 403);
     *   }
     *
     * @param array<string, mixed> $context
     */
    public static function denied(string $reason, array $context = []): bool
    {
        self::flag($reason, $context);

        return self::enforcing();
    }

    /**
     * Coarse client IP for log correlation. Uses REMOTE_ADDR only (not forwarded
     * headers) so it can't be trivially spoofed into the logs.
     */
    private static function clientIpHint(): string
    {
        $ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';

        return $ip !== '' ? sanitize_text_field($ip) : 'unknown';
    }
}
