<?php

declare(strict_types=1);

namespace Yatra\Helpers;

use Yatra\Services\SettingsService;

/**
 * Format Helper
 * 
 * Utility functions for formatting data.
 * All methods are static for easy access throughout the application.
 * 
 * Usage: FormatHelper::formatPrice(100, 'USD')
 * 
 * @package Yatra\Helpers
 */
class FormatHelper
{
    // Currency symbols are now managed by CurrencyHelper

    /**
     * Country codes to names mapping
     */
    /**
     * Country code => translated display name.
     *
     * Names are wrapped in __() at the definition so every consumer (booking
     * form, admin, confirmation) shows localized names, and so all of them are
     * extractable into the translation catalog. Cached per request.
     */
    private static ?array $countryNamesCache = null;

    private static function countryNames(): array
    {
        if (self::$countryNamesCache !== null) {
            return self::$countryNamesCache;
        }

        return self::$countryNamesCache = [

        'AF' => __('Afghanistan', 'yatra'), 'AL' => __('Albania', 'yatra'), 'DZ' => __('Algeria', 'yatra'), 'AD' => __('Andorra', 'yatra'),
        'AO' => __('Angola', 'yatra'), 'AG' => __('Antigua and Barbuda', 'yatra'), 'AR' => __('Argentina', 'yatra'), 'AM' => __('Armenia', 'yatra'),
        'AU' => __('Australia', 'yatra'), 'AT' => __('Austria', 'yatra'), 'AZ' => __('Azerbaijan', 'yatra'), 'BS' => __('Bahamas', 'yatra'),
        'BH' => __('Bahrain', 'yatra'), 'BD' => __('Bangladesh', 'yatra'), 'BB' => __('Barbados', 'yatra'), 'BY' => __('Belarus', 'yatra'),
        'BE' => __('Belgium', 'yatra'), 'BZ' => __('Belize', 'yatra'), 'BJ' => __('Benin', 'yatra'), 'BT' => __('Bhutan', 'yatra'),
        'BO' => __('Bolivia', 'yatra'), 'BA' => __('Bosnia and Herzegovina', 'yatra'), 'BW' => __('Botswana', 'yatra'), 'BR' => __('Brazil', 'yatra'),
        'BN' => __('Brunei', 'yatra'), 'BG' => __('Bulgaria', 'yatra'), 'BF' => __('Burkina Faso', 'yatra'), 'BI' => __('Burundi', 'yatra'),
        'KH' => __('Cambodia', 'yatra'), 'CM' => __('Cameroon', 'yatra'), 'CA' => __('Canada', 'yatra'), 'CV' => __('Cape Verde', 'yatra'),
        'CF' => __('Central African Republic', 'yatra'), 'TD' => __('Chad', 'yatra'), 'CL' => __('Chile', 'yatra'), 'CN' => __('China', 'yatra'),
        'CO' => __('Colombia', 'yatra'), 'KM' => __('Comoros', 'yatra'), 'CG' => __('Congo', 'yatra'), 'CD' => __('DR Congo', 'yatra'),
        'CR' => __('Costa Rica', 'yatra'), 'CI' => __('Ivory Coast', 'yatra'), 'HR' => __('Croatia', 'yatra'), 'CU' => __('Cuba', 'yatra'),
        'CY' => __('Cyprus', 'yatra'), 'CZ' => __('Czech Republic', 'yatra'), 'DK' => __('Denmark', 'yatra'), 'DJ' => __('Djibouti', 'yatra'),
        'DM' => __('Dominica', 'yatra'), 'DO' => __('Dominican Republic', 'yatra'), 'EC' => __('Ecuador', 'yatra'), 'EG' => __('Egypt', 'yatra'),
        'SV' => __('El Salvador', 'yatra'), 'GQ' => __('Equatorial Guinea', 'yatra'), 'ER' => __('Eritrea', 'yatra'), 'EE' => __('Estonia', 'yatra'),
        'SZ' => __('Eswatini', 'yatra'), 'ET' => __('Ethiopia', 'yatra'), 'FJ' => __('Fiji', 'yatra'), 'FI' => __('Finland', 'yatra'),
        'FR' => __('France', 'yatra'), 'GA' => __('Gabon', 'yatra'), 'GM' => __('Gambia', 'yatra'), 'GE' => __('Georgia', 'yatra'),
        'DE' => __('Germany', 'yatra'), 'GH' => __('Ghana', 'yatra'), 'GR' => __('Greece', 'yatra'), 'GD' => __('Grenada', 'yatra'),
        'GT' => __('Guatemala', 'yatra'), 'GN' => __('Guinea', 'yatra'), 'GW' => __('Guinea-Bissau', 'yatra'), 'GY' => __('Guyana', 'yatra'),
        'HT' => __('Haiti', 'yatra'), 'HN' => __('Honduras', 'yatra'), 'HU' => __('Hungary', 'yatra'), 'IS' => __('Iceland', 'yatra'),
        'IN' => __('India', 'yatra'), 'ID' => __('Indonesia', 'yatra'), 'IR' => __('Iran', 'yatra'), 'IQ' => __('Iraq', 'yatra'),
        'IE' => __('Ireland', 'yatra'), 'IL' => __('Israel', 'yatra'), 'IT' => __('Italy', 'yatra'), 'JM' => __('Jamaica', 'yatra'),
        'JP' => __('Japan', 'yatra'), 'JO' => __('Jordan', 'yatra'), 'KZ' => __('Kazakhstan', 'yatra'), 'KE' => __('Kenya', 'yatra'),
        'KI' => __('Kiribati', 'yatra'), 'KP' => __('North Korea', 'yatra'), 'KR' => __('South Korea', 'yatra'), 'KW' => __('Kuwait', 'yatra'),
        'KG' => __('Kyrgyzstan', 'yatra'), 'LA' => __('Laos', 'yatra'), 'LV' => __('Latvia', 'yatra'), 'LB' => __('Lebanon', 'yatra'),
        'LS' => __('Lesotho', 'yatra'), 'LR' => __('Liberia', 'yatra'), 'LY' => __('Libya', 'yatra'), 'LI' => __('Liechtenstein', 'yatra'),
        'LT' => __('Lithuania', 'yatra'), 'LU' => __('Luxembourg', 'yatra'), 'MG' => __('Madagascar', 'yatra'), 'MW' => __('Malawi', 'yatra'),
        'MY' => __('Malaysia', 'yatra'), 'MV' => __('Maldives', 'yatra'), 'ML' => __('Mali', 'yatra'), 'MT' => __('Malta', 'yatra'),
        'MH' => __('Marshall Islands', 'yatra'), 'MR' => __('Mauritania', 'yatra'), 'MU' => __('Mauritius', 'yatra'), 'MX' => __('Mexico', 'yatra'),
        'FM' => __('Micronesia', 'yatra'), 'MD' => __('Moldova', 'yatra'), 'MC' => __('Monaco', 'yatra'), 'MN' => __('Mongolia', 'yatra'),
        'ME' => __('Montenegro', 'yatra'), 'MA' => __('Morocco', 'yatra'), 'MZ' => __('Mozambique', 'yatra'), 'MM' => __('Myanmar', 'yatra'),
        'NA' => __('Namibia', 'yatra'), 'NR' => __('Nauru', 'yatra'), 'NP' => __('Nepal', 'yatra'), 'NL' => __('Netherlands', 'yatra'),
        'NZ' => __('New Zealand', 'yatra'), 'NI' => __('Nicaragua', 'yatra'), 'NE' => __('Niger', 'yatra'), 'NG' => __('Nigeria', 'yatra'),
        'MK' => __('North Macedonia', 'yatra'), 'NO' => __('Norway', 'yatra'), 'OM' => __('Oman', 'yatra'), 'PK' => __('Pakistan', 'yatra'),
        'PW' => __('Palau', 'yatra'), 'PS' => __('Palestine', 'yatra'), 'PA' => __('Panama', 'yatra'), 'PG' => __('Papua New Guinea', 'yatra'),
        'PY' => __('Paraguay', 'yatra'), 'PE' => __('Peru', 'yatra'), 'PH' => __('Philippines', 'yatra'), 'PL' => __('Poland', 'yatra'),
        'PT' => __('Portugal', 'yatra'), 'QA' => __('Qatar', 'yatra'), 'RO' => __('Romania', 'yatra'), 'RU' => __('Russia', 'yatra'),
        'RW' => __('Rwanda', 'yatra'), 'KN' => __('Saint Kitts and Nevis', 'yatra'), 'LC' => __('Saint Lucia', 'yatra'),
        'VC' => __('Saint Vincent and the Grenadines', 'yatra'), 'WS' => __('Samoa', 'yatra'), 'SM' => __('San Marino', 'yatra'),
        'ST' => __('Sao Tome and Principe', 'yatra'), 'SA' => __('Saudi Arabia', 'yatra'), 'SN' => __('Senegal', 'yatra'),
        'RS' => __('Serbia', 'yatra'), 'SC' => __('Seychelles', 'yatra'), 'SL' => __('Sierra Leone', 'yatra'), 'SG' => __('Singapore', 'yatra'),
        'SK' => __('Slovakia', 'yatra'), 'SI' => __('Slovenia', 'yatra'), 'SB' => __('Solomon Islands', 'yatra'), 'SO' => __('Somalia', 'yatra'),
        'ZA' => __('South Africa', 'yatra'), 'SS' => __('South Sudan', 'yatra'), 'ES' => __('Spain', 'yatra'), 'LK' => __('Sri Lanka', 'yatra'),
        'SD' => __('Sudan', 'yatra'), 'SR' => __('Suriname', 'yatra'), 'SE' => __('Sweden', 'yatra'), 'CH' => __('Switzerland', 'yatra'),
        'SY' => __('Syria', 'yatra'), 'TW' => __('Taiwan', 'yatra'), 'TJ' => __('Tajikistan', 'yatra'), 'TZ' => __('Tanzania', 'yatra'),
        'TH' => __('Thailand', 'yatra'), 'TL' => __('Timor-Leste', 'yatra'), 'TG' => __('Togo', 'yatra'), 'TO' => __('Tonga', 'yatra'),
        'TT' => __('Trinidad and Tobago', 'yatra'), 'TN' => __('Tunisia', 'yatra'), 'TR' => __('Turkey', 'yatra'), 'TM' => __('Turkmenistan', 'yatra'),
        'TV' => __('Tuvalu', 'yatra'), 'UG' => __('Uganda', 'yatra'), 'UA' => __('Ukraine', 'yatra'), 'AE' => __('United Arab Emirates', 'yatra'),
        'GB' => __('United Kingdom', 'yatra'), 'US' => __('United States', 'yatra'), 'UY' => __('Uruguay', 'yatra'), 'UZ' => __('Uzbekistan', 'yatra'),
        'VU' => __('Vanuatu', 'yatra'), 'VA' => __('Vatican City', 'yatra'), 'VE' => __('Venezuela', 'yatra'), 'VN' => __('Vietnam', 'yatra'),
        'YE' => __('Yemen', 'yatra'), 'ZM' => __('Zambia', 'yatra'), 'ZW' => __('Zimbabwe', 'yatra'),
        // ISO-3166-1 territories and special regions added so customers
        // from common tourism markets (Hong Kong, Puerto Rico, Greenland,
        // Gibraltar, Faroe Islands, etc.) can select their location.
        'HK' => __('Hong Kong', 'yatra'), 'MO' => __('Macao', 'yatra'), 'PR' => __('Puerto Rico', 'yatra'),
        'GI' => __('Gibraltar', 'yatra'), 'GL' => __('Greenland', 'yatra'), 'FO' => __('Faroe Islands', 'yatra'),
        'GG' => __('Guernsey', 'yatra'), 'IM' => __('Isle of Man', 'yatra'), 'JE' => __('Jersey', 'yatra'),
        'AX' => __('Aland Islands', 'yatra'), 'SJ' => __('Svalbard and Jan Mayen', 'yatra'),
        'BM' => __('Bermuda', 'yatra'), 'KY' => __('Cayman Islands', 'yatra'), 'AI' => __('Anguilla', 'yatra'),
        'AW' => __('Aruba', 'yatra'), 'CW' => __('Curacao', 'yatra'), 'SX' => __('Sint Maarten', 'yatra'),
        'BQ' => __('Bonaire, Sint Eustatius and Saba', 'yatra'),
        'MS' => __('Montserrat', 'yatra'), 'VG' => __('British Virgin Islands', 'yatra'),
        'TC' => __('Turks and Caicos Islands', 'yatra'),
        'BL' => __('Saint Barthelemy', 'yatra'), 'MF' => __('Saint Martin (French)', 'yatra'),
        'PM' => __('Saint Pierre and Miquelon', 'yatra'),
        'SH' => __('Saint Helena, Ascension and Tristan da Cunha', 'yatra'),
        'FK' => __('Falkland Islands', 'yatra'),
        'GS' => __('South Georgia and the South Sandwich Islands', 'yatra'),
        'PF' => __('French Polynesia', 'yatra'), 'NC' => __('New Caledonia', 'yatra'),
        'WF' => __('Wallis and Futuna', 'yatra'), 'CK' => __('Cook Islands', 'yatra'),
        'NU' => __('Niue', 'yatra'), 'TK' => __('Tokelau', 'yatra'),
        'GP' => __('Guadeloupe', 'yatra'), 'MQ' => __('Martinique', 'yatra'),
        'RE' => __('Reunion', 'yatra'), 'YT' => __('Mayotte', 'yatra'),
        'AS' => __('American Samoa', 'yatra'), 'GU' => __('Guam', 'yatra'),
        'MP' => __('Northern Mariana Islands', 'yatra'), 'VI' => __('U.S. Virgin Islands', 'yatra'),
        'UM' => __('U.S. Minor Outlying Islands', 'yatra'),
        'TF' => __('French Southern Territories', 'yatra'),
        'IO' => __('British Indian Ocean Territory', 'yatra'), 'BV' => __('Bouvet Island', 'yatra'),
        'HM' => __('Heard Island and McDonald Islands', 'yatra'),
        'AQ' => __('Antarctica', 'yatra'), 'PN' => __('Pitcairn', 'yatra'),
        'EH' => __('Western Sahara', 'yatra'), 'XK' => __('Kosovo', 'yatra'),
        ];
    }

    /**
     * Format price with currency
     * 
     * @param float  $amount   Amount to format
     * @param string $currency Currency code (default: USD)
     * @param bool   $showCode Show currency code alongside symbol
     * @return string Formatted price
     */
    public static function formatPrice(float $amount, string $currency = 'USD', bool $showCode = false): string
    {
        if (function_exists('yatra_format_price')) {
            $main = yatra_format_price($amount, $currency, false);
        } else {
            $main = CurrencyHelper::format($amount, $currency, false);
        }

        if ($showCode) {
            return $main . ' ' . strtoupper($currency);
        }

        return $main;
    }

    /**
     * Get currency symbol
     * 
     * @param string $currency Currency code
     * @return string Currency symbol
     */
    public static function getCurrencySymbol(string $currency): string
    {
        return CurrencyHelper::getSymbol($currency);
    }

    /**
     * Format date for display
     * 
     * @param string $date   Date string
     * @param string $format PHP date format (default: from WordPress settings)
     * @return string Formatted date
     */
    public static function formatDate(string $date, string $format = ''): string
    {
        if (empty($date)) {
            return '';
        }

        $format = $format ?: SettingsService::getString('date_format', (string) get_option('date_format', 'F j, Y'));
        
        $timestamp = strtotime($date);
        if ($timestamp === false) {
            return $date;
        }

        return self::formatTimestampWithTz($timestamp, $format);
    }

    /**
     * Format datetime for display
     * 
     * @param string $datetime Datetime string
     * @param string $format   PHP date format
     * @return string Formatted datetime
     */
    public static function formatDateTime(string $datetime, string $format = ''): string
    {
        if (empty($datetime)) {
            return '';
        }

        $dateFormat = SettingsService::getString('date_format', (string) get_option('date_format', 'F j, Y'));
        $timeFormat = SettingsService::getString('time_format', (string) get_option('time_format', 'g:i a'));
        $format = $format ?: $dateFormat . ' ' . $timeFormat;
        
        $timestamp = strtotime($datetime);
        if ($timestamp === false) {
            return $datetime;
        }

        return self::formatTimestampWithTz($timestamp, $format);
    }

    /**
     * Format time for display
     * 
     * @param string $time Time string (e.g., "14:30")
     * @return string Formatted time (e.g., "2:30 PM")
     */
    public static function formatTime(string $time): string
    {
        return self::formatTimeForDisplay($time);
    }

    /**
     * Format time for display using plugin settings (fallback to WordPress settings)
     * 
     * @param string $time Time string (e.g., "14:30")
     * @return string Formatted time (e.g., "2:30 PM")
     */
    public static function formatTimeForDisplay(string $time): string
    {
        if (empty($time)) {
            return '';
        }
        
        $timestamp = strtotime($time);
        if ($timestamp === false) {
            return $time;
        }
        
        $format = SettingsService::getString('time_format', (string) get_option('time_format', 'g:i a'));
        return self::formatTimestampWithTz($timestamp, $format);
    }

    /**
     * Format a timestamp using Yatra timezone when set.
     *
     * @param int $timestamp Unix timestamp
     * @param string $format PHP date format
     * @return string
     */
    private static function formatTimestampWithTz(int $timestamp, string $format): string
    {
        $tz = trim((string) SettingsService::getString('timezone', ''));
        if ($tz === '') {
            // WP site timezone fallback
            return function_exists('wp_date')
                ? wp_date($format, $timestamp)
                : date_i18n($format, $timestamp);
        }

        try {
            $dtz = new \DateTimeZone($tz);
        } catch (\Exception $e) {
            return function_exists('wp_date')
                ? wp_date($format, $timestamp)
                : date_i18n($format, $timestamp);
        }

        if (function_exists('wp_date')) {
            return wp_date($format, $timestamp, $dtz);
        }

        // Older WP fallback: shift timestamp into requested timezone via DateTime.
        $d = new \DateTime('@' . $timestamp);
        $d->setTimezone($dtz);
        return $d->format($format);
    }

    /**
     * Get relative time (e.g., "2 hours ago")
     * 
     * @param string $datetime Datetime string
     * @return string Relative time
     */
    public static function timeAgo(string $datetime): string
    {
        if (empty($datetime)) {
            return '';
        }

        $timestamp = strtotime($datetime);
        if ($timestamp === false) {
            return $datetime;
        }

        return human_time_diff($timestamp, current_time('timestamp')) . ' ' . __('ago', 'yatra');
    }

    /**
     * Get country name from code
     * 
     * @param string $code Country code (e.g., "US")
     * @return string Country name
     */
    public static function getCountryName(string $code): string
    {
        $code = strtoupper($code);
        return self::countryNames()[$code] ?? $code;
    }

    /**
     * Canonical country list — single source of truth used by every
     * country / nationality dropdown in both Free and Pro plugins.
     *
     * Returns the full ISO-3166-1 alpha-2 set (sovereign states +
     * dependent territories + commonly-accepted regions). Sorted
     * alphabetically by name so the rendered dropdown is browseable
     * without operators having to scan a code-ordered list.
     *
     * Filterable via `yatra_countries_list` for operators that want
     * to:
     *   - Prepend "popular" entries (US, GB, IN, etc.) above an
     *     `---` separator for faster picking
     *   - Remove territories that don't apply to their market
     *   - Rename a region (e.g. business-language preferences)
     *
     * @return array<string, string>  [ISO-3166 code => display name]
     */
    public static function getCountries(): array
    {
        $countries = self::countryNames();

        // Stable alphabetical sort by display name. Operators expect
        // "Argentina" before "Australia" before "Austria" — code-order
        // (AR/AU/AT) is computer-friendly but not human-friendly.
        asort($countries, SORT_STRING | SORT_FLAG_CASE);

        if (\function_exists('apply_filters')) {
            $filtered = apply_filters('yatra_countries_list', $countries);
            if (\is_array($filtered) && $filtered !== []) {
                return $filtered;
            }
        }
        return $countries;
    }

    /**
     * Format phone number for display
     * 
     * @param string $phone Phone number
     * @return string Formatted phone
     */
    public static function formatPhone(string $phone): string
    {
        // Remove non-numeric characters except + and spaces
        $phone = preg_replace('/[^\d\+\s\-\(\)]/', '', $phone);
        return trim($phone);
    }

    /**
     * Format duration (days/nights)
     * 
     * @param int      $days   Number of days
     * @param int|null $nights Number of nights (optional)
     * @return string Formatted duration
     */
    public static function formatDuration(int $days, ?int $nights = null): string
    {
        if ($nights !== null) {
            return sprintf(
                _n('%d Day', '%d Days', $days, 'yatra'),
                $days
            ) . ' / ' . sprintf(
                _n('%d Night', '%d Nights', $nights, 'yatra'),
                $nights
            );
        }

        return sprintf(_n('%d Day', '%d Days', $days, 'yatra'), $days);
    }

    /**
     * Format file size
     * 
     * @param int $bytes File size in bytes
     * @return string Formatted size
     */
    public static function formatFileSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $unitIndex = 0;
        
        while ($bytes >= 1024 && $unitIndex < count($units) - 1) {
            $bytes /= 1024;
            $unitIndex++;
        }

        return round($bytes, 2) . ' ' . $units[$unitIndex];
    }

    /**
     * Truncate text with ellipsis
     * 
     * @param string $text   Text to truncate
     * @param int    $length Maximum length
     * @param string $suffix Suffix to add (default: ...)
     * @return string Truncated text
     */
    public static function truncate(string $text, int $length = 100, string $suffix = '...'): string
    {
        if (mb_strlen($text) <= $length) {
            return $text;
        }

        return mb_substr($text, 0, $length - mb_strlen($suffix)) . $suffix;
    }

    /**
     * Generate excerpt from HTML content
     * 
     * @param string $html   HTML content
     * @param int    $length Maximum length
     * @return string Plain text excerpt
     */
    public static function excerpt(string $html, int $length = 150): string
    {
        $text = wp_strip_all_tags($html);
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);
        
        return self::truncate($text, $length);
    }

    /**
     * Format rating as stars HTML
     * 
     * @param float $rating Rating (0-5)
     * @param bool  $showNumber Show rating number
     * @return string HTML stars
     */
    public static function formatRatingStars(float $rating, bool $showNumber = false): string
    {
        $rating = max(0, min(5, $rating));
        $fullStars = (int) floor($rating);
        $hasHalfStar = ($rating - $fullStars) >= 0.5;
        
        $html = '<span class="yatra-rating-stars">';
        
        for ($i = 1; $i <= 5; $i++) {
            if ($i <= $fullStars) {
                $html .= '<span class="yatra-star filled">★</span>';
            } elseif ($i === $fullStars + 1 && $hasHalfStar) {
                $html .= '<span class="yatra-star half">★</span>';
            } else {
                $html .= '<span class="yatra-star">★</span>';
            }
        }
        
        $html .= '</span>';
        
        if ($showNumber) {
            $html .= '<span class="yatra-rating-number">' . number_format($rating, 1) . '</span>';
        }
        
        return $html;
    }

    /**
     * Format booking status as badge
     * 
     * @param string $status Booking status
     * @return string HTML badge
     */
    public static function formatStatusBadge(string $status): string
    {
        $statusClasses = [
            'pending' => 'yatra-badge yatra-badge-warning',
            'confirmed' => 'yatra-badge yatra-badge-success',
            'processing' => 'yatra-badge yatra-badge-info',
            'completed' => 'yatra-badge yatra-badge-success',
            'cancelled' => 'yatra-badge yatra-badge-danger',
            'refunded' => 'yatra-badge yatra-badge-secondary',
            'failed' => 'yatra-badge yatra-badge-danger',
            'on_hold' => 'yatra-badge yatra-badge-warning',
        ];

        $class = $statusClasses[$status] ?? 'yatra-badge';
        $label = ucfirst(str_replace('_', ' ', $status));

        return '<span class="' . esc_attr($class) . '">' . esc_html($label) . '</span>';
    }

    /**
     * Sanitize and format slug
     * 
     * @param string $text Text to slugify
     * @return string URL-safe slug
     */
    public static function slugify(string $text): string
    {
        return sanitize_title($text);
    }

    /**
     * Convert array to HTML attributes string
     * 
     * @param array $attributes Key-value pairs
     * @return string HTML attributes
     */
    public static function arrayToAttributes(array $attributes): string
    {
        $html = [];
        
        foreach ($attributes as $key => $value) {
            if ($value === true) {
                $html[] = esc_attr($key);
            } elseif ($value !== false && $value !== null) {
                $html[] = esc_attr($key) . '="' . esc_attr($value) . '"';
            }
        }

        return implode(' ', $html);
    }

    /**
     * Sanitize Quill editor HTML output
     * 
     * This function sanitizes HTML content from the Quill rich text editor,
     * allowing only safe HTML tags and attributes that match the Quill toolbar configuration.
     * 
     * Allowed features based on Quill toolbar:
     * - Headers: h1, h2, h3
     * - Text formatting: bold, italic, underline, strike
     * - Lists: ordered (ol, li), unordered (ul, li)
     * - Alignment: text-align attribute on p tags
     * - Links: a tags with href attribute
     * - Paragraphs: p tags
     * 
     * @param string $html Raw HTML from Quill editor
     * @return string Sanitized HTML safe for database storage
     */
    public static function sanitizeQuillHtml(string $html): string
    {
        // Return empty string if input is empty or just whitespace
        if (empty(trim($html)) || $html === '<p><br></p>') {
            return '';
        }

        // Define allowed HTML tags and attributes based on Quill configuration
        $allowed_tags = [
            // Headers (from Quill header dropdown: 1, 2, 3)
            'h1' => [],
            'h2' => [],
            'h3' => [],
            
            // Paragraphs with alignment support
            'p' => [
                'style' => true, // For text-align
                'class' => true, // Quill may add alignment classes
            ],
            
            // Text formatting (bold, italic, underline, strike)
            'strong' => [],
            'b' => [],
            'em' => [],
            'i' => [],
            'u' => [],
            's' => [],
            'strike' => [],
            
            // Lists (ordered and unordered)
            'ol' => [],
            'ul' => [],
            'li' => [],
            
            // Links
            'a' => [
                'href' => true,
                'title' => true,
                'target' => true,
                'rel' => true,
            ],
            
            // Line breaks
            'br' => [],
        ];

        // Use wp_kses to sanitize with allowed tags
        $sanitized = wp_kses($html, $allowed_tags);

        // Additional cleanup for alignment styles
        // Only allow text-align in style attribute
        $sanitized = preg_replace_callback(
            '/style="([^"]*)"/i',
            function ($matches) {
                $styles = $matches[1];
                // Extract only text-align property
                if (preg_match('/text-align:\s*(left|center|right|justify)/i', $styles, $align)) {
                    return 'style="text-align: ' . esc_attr($align[1]) . '"';
                }
                return ''; // Remove style attribute if no valid text-align
            },
            $sanitized
        );

        // Ensure links have proper rel attribute for security
        $sanitized = preg_replace_callback(
            '/<a\s+([^>]*?)>/i',
            function ($matches) {
                $attrs = $matches[1];
                // If target="_blank" exists, ensure rel="noopener noreferrer"
                if (stripos($attrs, 'target="_blank"') !== false) {
                    if (stripos($attrs, 'rel=') === false) {
                        $attrs .= ' rel="noopener noreferrer"';
                    } elseif (stripos($attrs, 'noopener') === false || stripos($attrs, 'noreferrer') === false) {
                        $attrs = preg_replace(
                            '/rel="([^"]*)"/i',
                            'rel="$1 noopener noreferrer"',
                            $attrs
                        );
                    }
                }
                return '<a ' . $attrs . '>';
            },
            $sanitized
        );

        // Remove empty paragraphs and normalize whitespace
        $sanitized = preg_replace('/<p[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/p>/i', '', $sanitized);
        
        // Trim whitespace
        $sanitized = trim($sanitized);

        return $sanitized;
    }

    /**
     * Prepare Quill HTML for display (output escaping)
     * 
     * Use this when outputting sanitized Quill content to the frontend.
     * This assumes the content was already sanitized with sanitizeQuillHtml() before storage.
     * 
     * @param string $html Sanitized HTML from database
     * @return string HTML safe for display
     */
    public static function displayQuillHtml(string $html): string
    {
        if (empty($html)) {
            return '';
        }

        // Apply WordPress content filters (auto-paragraphs, shortcodes, etc.)
        // But skip wpautop since Quill already handles paragraphs
        remove_filter('the_content', 'wpautop');
        $content = apply_filters('the_content', $html);
        add_filter('the_content', 'wpautop');

        return $content;
    }

    /**
     * Strip all HTML tags from Quill content (for excerpts, meta descriptions, etc.)
     * 
     * @param string $html Quill HTML content
     * @return string Plain text
     */
    public static function quillToPlainText(string $html): string
    {
        if (empty($html)) {
            return '';
        }

        // Remove all HTML tags
        $text = wp_strip_all_tags($html);
        
        // Normalize whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        
        // Trim
        $text = trim($text);

        return $text;
    }
}

