<?php

declare(strict_types=1);

namespace Yatra\Blocks;

use Yatra\Shortcodes\LoginShortcode;

/**
 * Login Block (yatra/login)
 *
 * The [yatra_login] customer login / register form.
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
class LoginBlock extends AbstractShortcodeBlock
{
    public function slug(): string
    {
        return 'login';
    }

    public function title(): string
    {
        return __('Customer Login', 'yatra');
    }

    public function elementorIcon(): string
    {
        return 'eicon-lock-user';
    }

    protected function shortcodeTag(): string
    {
        return 'yatra_login';
    }

    protected function editorStyles(): array
    {
        return ['yatra-common', 'yatra-blocks', 'yatra-blocks-login-preview'];
    }

    public function controls(): array
    {
        return [
            ['name' => 'title', 'type' => 'text', 'label' => __('Title', 'yatra'), 'default' => '', 'help' => __('Leave empty for "Customer Login".', 'yatra')],
            ['name' => 'subtitle', 'type' => 'text', 'label' => __('Subtitle', 'yatra'), 'default' => ''],
            ['name' => 'show_register', 'type' => 'toggle', 'label' => __('Show registration tab', 'yatra'), 'default' => true],
            ['name' => 'show_forgot_password', 'type' => 'toggle', 'label' => __('Show "Forgot password"', 'yatra'), 'default' => true],
            ['name' => 'remember_me', 'type' => 'toggle', 'label' => __('Show "Remember me"', 'yatra'), 'default' => true],
            ['name' => 'redirect_url', 'type' => 'text', 'label' => __('Redirect after login (this site only)', 'yatra'), 'default' => ''],
        ];
    }

    public function render(array $attributes): string
    {
        // [yatra_login] only queues its files when the page content holds the
        // shortcode; a block or widget queues them as it renders.
        if (! is_user_logged_in()) {
            LoginShortcode::enqueueLoginAssets();
        }

        return parent::render($attributes);
    }

    protected function shortcodeAttributes(array $attributes): array
    {
        $atts = [
            'show_register' => self::bool($attributes['show_register'] ?? true, true) ? 'yes' : 'no',
            'show_forgot_password' => self::bool($attributes['show_forgot_password'] ?? true, true) ? 'yes' : 'no',
            'remember_me' => self::bool($attributes['remember_me'] ?? true, true) ? 'yes' : 'no',
        ];

        // LoginShortcode sanitizes these again and only allows same-host redirects.
        foreach (['title', 'subtitle'] as $key) {
            $value = isset($attributes[$key]) && is_scalar($attributes[$key]) ? sanitize_text_field((string) $attributes[$key]) : '';
            if ($value !== '') {
                $atts[$key] = $value;
            }
        }
        $redirect = isset($attributes['redirect_url']) && is_scalar($attributes['redirect_url']) ? esc_url_raw((string) $attributes['redirect_url']) : '';
        if ($redirect !== '') {
            $atts['redirect_url'] = $redirect;
        }

        return $atts;
    }
}
