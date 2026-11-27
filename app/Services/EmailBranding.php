<?php
/**
 * Email branding (3.3): your logo and brand colour in Yatra's customer emails.
 *
 * Applied when an email is sent, so it works for the templates already saved
 * on a site: Yatra's email layout has a coloured header band (#0d9488) and
 * buttons in the same colour; the brand colour replaces it (with a readable
 * text colour), and the logo goes at the top of the header band. Emails whose
 * HTML doesn't use Yatra's layout are left alone. Off unless set in
 * Settings → Email.
 *
 * @package Yatra\Services
 * @since 3.3.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class EmailBranding
{
    /** The header / button colour of Yatra's email layout. */
    public const LAYOUT_COLOR = '#0d9488';

    public static function brandColor(): string
    {
        $color = strtolower(trim((string) SettingsService::get('email_brand_color', '')));

        return preg_match('/^#[0-9a-f]{6}$/', $color) ? $color : '';
    }

    public static function logoUrl(): string
    {
        if (!SettingsService::isEnabled('email_show_logo')) {
            return '';
        }
        $logo = (string) SettingsService::get('company_logo', '');
        if (is_numeric($logo) && (int) $logo > 0) {
            $logo = (string) wp_get_attachment_image_url((int) $logo, 'medium');
        }
        if (trim($logo) === '') {
            // No company logo set: the site's own logo (Appearance → Customize / Site Editor).
            $siteLogo = (int) get_theme_mod('custom_logo');
            if ($siteLogo <= 0) {
                $siteLogo = (int) get_option('site_logo');
            }
            if ($siteLogo > 0) {
                $logo = (string) wp_get_attachment_image_url($siteLogo, 'medium');
            }
        }
        $logo = trim($logo);

        return preg_match('#^https?://#i', $logo) ? esc_url_raw($logo) : '';
    }

    /** #ffffff or #111827, whichever reads better on the colour. */
    public static function textOn(string $hex): string
    {
        $r = hexdec(substr($hex, 1, 2)) / 255;
        $g = hexdec(substr($hex, 3, 2)) / 255;
        $b = hexdec(substr($hex, 5, 2)) / 255;
        $lin = static function (float $c): float {
            return $c <= 0.03928 ? $c / 12.92 : (($c + 0.055) / 1.055) ** 2.4;
        };
        $l = 0.2126 * $lin($r) + 0.7152 * $lin($g) + 0.0722 * $lin($b);

        return $l > 0.45 ? '#111827' : '#ffffff';
    }

    public static function apply(string $html): string
    {
        if ($html === '' || (self::logoUrl() === '' && self::brandColor() === '')) {
            return $html;
        }
        if (stripos($html, self::LAYOUT_COLOR) === false) {
            return $html;
        }

        $logo = self::logoUrl();
        if ($logo !== '' && strpos($html, 'data-yatra-email-logo') === false) {
            $marker = 'background:' . self::LAYOUT_COLOR . ';padding:28px 32px;text-align:center;">';
            $pos = stripos($html, $marker);
            if ($pos !== false) {
                $name = (string) SettingsService::get('company_name', get_bloginfo('name'));
                $img = '<img data-yatra-email-logo="1" src="' . esc_url($logo) . '" alt="' . esc_attr($name) . '" style="display:block;margin:0 auto 14px;max-height:56px;max-width:220px;height:auto;border:0;">';
                $at = $pos + strlen($marker);
                $html = substr($html, 0, $at) . $img . substr($html, $at);
            }
        }

        $color = self::brandColor();
        if ($color !== '' && $color !== self::LAYOUT_COLOR) {
            $text = self::textOn($color);
            // The header heading and the button text sit on the brand colour.
            $html = str_ireplace(
                ['color:#f0fdfa;', 'color:#ffffff;text-decoration:none;'],
                ['color:' . $text . ';', 'color:' . $text . ';text-decoration:none;'],
                $html
            );
            $html = str_ireplace(self::LAYOUT_COLOR, $color, $html);
        }

        /**
         * Email HTML after Yatra's branding.
         *
         * @since 3.3.0
         */
        return (string) apply_filters('yatra_email_branded_html', $html);
    }
}
