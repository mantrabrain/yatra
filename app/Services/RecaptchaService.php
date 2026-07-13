<?php
/**
 * reCAPTCHA Service (Google reCAPTCHA v3)
 *
 * Loads the v3 script (invisible, score-based), verifies tokens server-side
 * against a score threshold, and exposes per-form gating so operators can
 * choose which Yatra forms to protect. Previously this service rendered a v2
 * checkbox and was never wired into any form, so reCAPTCHA never actually ran.
 *
 * @package Yatra\Services
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class RecaptchaService
{
    /** Default v3 score threshold (0.0 = likely bot, 1.0 = likely human). */
    public const DEFAULT_SCORE_THRESHOLD = 0.5;

    /** Form key => the setting that toggles protection for that form. */
    private const FORM_SETTINGS = [
        'enquiry'      => 'recaptcha_protect_enquiry',
        'booking'      => 'recaptcha_protect_booking',
        'registration' => 'recaptcha_protect_registration',
    ];

    /**
     * reCAPTCHA is usable only when enabled AND both keys are configured.
     */
    public static function isEnabled(): bool
    {
        return SettingsService::isEnabled('recaptcha_enabled')
            && self::getSiteKey() !== ''
            && self::getSecretKey() !== '';
    }

    public static function getSiteKey(): string
    {
        return trim(SettingsService::getString('recaptcha_site_key', ''));
    }

    private static function getSecretKey(): string
    {
        return trim(SettingsService::getString('recaptcha_secret_key', ''));
    }

    /**
     * v3 score threshold, clamped to [0,1] and filterable.
     */
    public static function scoreThreshold(): float
    {
        $threshold = (float) SettingsService::getFloat('recaptcha_score_threshold', self::DEFAULT_SCORE_THRESHOLD);
        if ($threshold < 0.0 || $threshold > 1.0) {
            $threshold = self::DEFAULT_SCORE_THRESHOLD;
        }

        return (float) apply_filters('yatra_recaptcha_score_threshold', $threshold);
    }

    /**
     * Whether a given form (enquiry|booking|registration) is protected.
     */
    public static function protectsForm(string $form): bool
    {
        if (!self::isEnabled()) {
            return false;
        }

        $setting = self::FORM_SETTINGS[$form] ?? '';
        if ($setting === '') {
            return false;
        }

        return (bool) apply_filters(
            'yatra_recaptcha_protects_form',
            SettingsService::isEnabled($setting),
            $form
        );
    }

    /**
     * Verify a token against a form. Returns success when the form is NOT
     * protected (no-op), so callers can always call this unconditionally.
     *
     * @return array{success:bool, message?:string, score?:float|null, action?:string|null}
     */
    public static function verifyForm(string $form, string $token, ?string $remoteIp = null): array
    {
        if (!self::protectsForm($form)) {
            return ['success' => true];
        }

        return self::verify($token, $form, $remoteIp);
    }

    /**
     * Verify a reCAPTCHA v3 token with Google (success + score + optional action).
     *
     * @param string      $token          The token from grecaptcha.execute().
     * @param string|null $expectedAction  The action the token should carry.
     * @param string|null $remoteIp        Client IP.
     * @return array{success:bool, message?:string, score?:float|null, action?:string|null}
     */
    public static function verify(string $token, ?string $expectedAction = null, ?string $remoteIp = null): array
    {
        if (!SettingsService::isEnabled('recaptcha_enabled')) {
            return ['success' => true, 'message' => 'reCAPTCHA is disabled'];
        }

        $secret_key = self::getSecretKey();
        if ($secret_key === '') {
            return ['success' => false, 'message' => __('reCAPTCHA is not fully configured.', 'yatra')];
        }

        $token = trim($token);
        if ($token === '') {
            return ['success' => false, 'message' => __('reCAPTCHA verification failed. Please try again.', 'yatra')];
        }

        $data = [
            'secret'   => $secret_key,
            'response' => $token,
        ];
        if ($remoteIp) {
            $data['remoteip'] = $remoteIp;
        }

        $http = wp_remote_post('https://www.google.com/recaptcha/api/siteverify', [
            'body'    => $data,
            'timeout' => 10,
        ]);

        if (is_wp_error($http)) {
            return ['success' => false, 'message' => __('Could not reach the reCAPTCHA service. Please try again.', 'yatra')];
        }

        $result = json_decode(wp_remote_retrieve_body($http), true);
        if (!is_array($result) || !isset($result['success'])) {
            return ['success' => false, 'message' => __('Invalid reCAPTCHA response.', 'yatra')];
        }

        if (empty($result['success'])) {
            return [
                'success' => false,
                'message' => self::getErrorMessage($result['error-codes'] ?? []),
            ];
        }

        $score = isset($result['score']) ? (float) $result['score'] : null;
        $action = $result['action'] ?? null;

        // v3 score gate. (A v2 token has no score; treat missing score as pass so
        // a mistakenly-configured v2 key still validates presence.)
        if ($score !== null && $score < self::scoreThreshold()) {
            return [
                'success' => false,
                'message' => __('reCAPTCHA score too low — your request looked automated. Please try again.', 'yatra'),
                'score'   => $score,
                'action'  => $action,
            ];
        }

        // Optional action binding (defence in depth; only enforced when both sides present).
        if ($expectedAction !== null && $action !== null && $action !== '' && $action !== $expectedAction) {
            return [
                'success' => false,
                'message' => __('reCAPTCHA action mismatch. Please try again.', 'yatra'),
                'score'   => $score,
                'action'  => $action,
            ];
        }

        return [
            'success' => true,
            'message' => __('reCAPTCHA verification successful', 'yatra'),
            'score'   => $score,
            'action'  => $action,
        ];
    }

    /**
     * Map Google error codes to a friendly message.
     */
    private static function getErrorMessage(array $errorCodes): string
    {
        if (empty($errorCodes)) {
            return __('reCAPTCHA verification failed. Please try again.', 'yatra');
        }

        $messages = [
            'missing-input-secret'   => __('The reCAPTCHA secret key is missing.', 'yatra'),
            'invalid-input-secret'   => __('The reCAPTCHA secret key is invalid or malformed.', 'yatra'),
            'missing-input-response' => __('reCAPTCHA verification failed. Please try again.', 'yatra'),
            'invalid-input-response' => __('reCAPTCHA verification failed. Please try again.', 'yatra'),
            'bad-request'            => __('The reCAPTCHA request was invalid or malformed.', 'yatra'),
            'timeout-or-duplicate'   => __('The reCAPTCHA response expired. Please try again.', 'yatra'),
        ];

        return $messages[$errorCodes[0]] ?? __('reCAPTCHA verification failed. Please try again.', 'yatra');
    }

    /**
     * Enqueue the reCAPTCHA v3 script + Yatra helper on the frontend.
     * Hooked on wp_enqueue_scripts; self-guards on isEnabled().
     */
    public static function enqueueScript(): void
    {
        if (!self::isEnabled()) {
            return;
        }

        // Skip in wp-admin (v3 badge / tokens are for public forms).
        if (is_admin()) {
            return;
        }

        wp_enqueue_script(
            'google-recaptcha',
            'https://www.google.com/recaptcha/api.js?render=' . rawurlencode(self::getSiteKey()),
            [],
            null,
            true
        );

        wp_enqueue_script(
            'yatra-recaptcha',
            YATRA_PLUGIN_URL . 'assets/js/recaptcha.js',
            ['google-recaptcha'],
            defined('YATRA_VERSION') ? YATRA_VERSION : false,
            true
        );

        wp_localize_script('yatra-recaptcha', 'yatraRecaptcha', [
            'siteKey' => self::getSiteKey(),
            'enabled' => true,
            'forms'   => [
                'enquiry'      => self::protectsForm('enquiry'),
                'booking'      => self::protectsForm('booking'),
                'registration' => self::protectsForm('registration'),
            ],
        ]);
    }
}
