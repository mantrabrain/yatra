<?php
/**
 * reCAPTCHA Service
 * 
 * Handles Google reCAPTCHA verification
 * 
 * @package Yatra\Services
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class RecaptchaService
{
    /**
     * Verify reCAPTCHA response
     * 
     * @param string $response reCAPTCHA response token
     * @param string|null $remoteIp User's IP address
     * @return array Verification result
     */
    public static function verify(string $response, ?string $remoteIp = null): array
    {
        // Check if reCAPTCHA is enabled
        if (!SettingsService::isEnabled('recaptcha_enabled')) {
            return [
                'success' => true,
                'message' => 'reCAPTCHA is disabled'
            ];
        }
        
        $secret_key = SettingsService::getString('recaptcha_secret_key', '');
        
        if (empty($secret_key)) {
            return [
                'success' => false,
                'message' => __('reCAPTCHA secret key is not configured', 'yatra')
            ];
        }
        
        if (empty($response)) {
            return [
                'success' => false,
                'message' => __('Please complete the reCAPTCHA verification', 'yatra')
            ];
        }
        
        // Prepare verification request
        $verify_url = 'https://www.google.com/recaptcha/api/siteverify';
        $data = [
            'secret' => $secret_key,
            'response' => $response,
        ];
        
        if ($remoteIp) {
            $data['remoteip'] = $remoteIp;
        }
        
        // Send verification request
        $response = wp_remote_post($verify_url, [
            'body' => $data,
            'timeout' => 10,
        ]);
        
        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => __('reCAPTCHA verification failed: ', 'yatra') . $response->get_error_message()
            ];
        }
        
        $body = wp_remote_retrieve_body($response);
        $result = json_decode($body, true);
        
        if (!isset($result['success'])) {
            return [
                'success' => false,
                'message' => __('Invalid reCAPTCHA response', 'yatra')
            ];
        }
        
        if (!$result['success']) {
            $error_codes = $result['error-codes'] ?? [];
            $error_message = self::getErrorMessage($error_codes);
            
            return [
                'success' => false,
                'message' => $error_message
            ];
        }
        
        return [
            'success' => true,
            'message' => __('reCAPTCHA verification successful', 'yatra'),
            'score' => $result['score'] ?? null,
            'action' => $result['action'] ?? null,
        ];
    }
    
    /**
     * Get user-friendly error message from error codes
     * 
     * @param array $errorCodes Error codes from reCAPTCHA
     * @return string Error message
     */
    private static function getErrorMessage(array $errorCodes): string
    {
        if (empty($errorCodes)) {
            return __('reCAPTCHA verification failed', 'yatra');
        }
        
        $messages = [
            'missing-input-secret' => __('The secret parameter is missing', 'yatra'),
            'invalid-input-secret' => __('The secret parameter is invalid or malformed', 'yatra'),
            'missing-input-response' => __('The response parameter is missing', 'yatra'),
            'invalid-input-response' => __('The response parameter is invalid or malformed', 'yatra'),
            'bad-request' => __('The request is invalid or malformed', 'yatra'),
            'timeout-or-duplicate' => __('The response is no longer valid: either is too old or has been used previously', 'yatra'),
        ];
        
        $errorCode = $errorCodes[0];
        return $messages[$errorCode] ?? __('reCAPTCHA verification failed', 'yatra');
    }
    
    /**
     * Get reCAPTCHA site key
     * 
     * @return string Site key
     */
    public static function getSiteKey(): string
    {
        return SettingsService::getString('recaptcha_site_key', '');
    }
    
    /**
     * Check if reCAPTCHA is enabled
     * 
     * @return bool
     */
    public static function isEnabled(): bool
    {
        return SettingsService::isEnabled('recaptcha_enabled') && 
               !empty(self::getSiteKey()) && 
               !empty(SettingsService::getString('recaptcha_secret_key', ''));
    }
    
    /**
     * Render reCAPTCHA widget HTML
     * 
     * @return string HTML for reCAPTCHA widget
     */
    public static function renderWidget(): string
    {
        if (!self::isEnabled()) {
            return '';
        }
        
        $site_key = self::getSiteKey();
        
        return sprintf(
            '<div class="g-recaptcha" data-sitekey="%s"></div>',
            esc_attr($site_key)
        );
    }
    
    /**
     * Enqueue reCAPTCHA script
     */
    public static function enqueueScript(): void
    {
        if (!self::isEnabled()) {
            return;
        }
        
        wp_enqueue_script(
            'google-recaptcha',
            'https://www.google.com/recaptcha/api.js',
            [],
            null,
            true
        );
    }
}
