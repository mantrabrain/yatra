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
    private const COUNTRY_NAMES = [
        'AF' => 'Afghanistan', 'AL' => 'Albania', 'DZ' => 'Algeria', 'AD' => 'Andorra',
        'AO' => 'Angola', 'AG' => 'Antigua and Barbuda', 'AR' => 'Argentina', 'AM' => 'Armenia',
        'AU' => 'Australia', 'AT' => 'Austria', 'AZ' => 'Azerbaijan', 'BS' => 'Bahamas',
        'BH' => 'Bahrain', 'BD' => 'Bangladesh', 'BB' => 'Barbados', 'BY' => 'Belarus',
        'BE' => 'Belgium', 'BZ' => 'Belize', 'BJ' => 'Benin', 'BT' => 'Bhutan',
        'BO' => 'Bolivia', 'BA' => 'Bosnia and Herzegovina', 'BW' => 'Botswana', 'BR' => 'Brazil',
        'BN' => 'Brunei', 'BG' => 'Bulgaria', 'BF' => 'Burkina Faso', 'BI' => 'Burundi',
        'KH' => 'Cambodia', 'CM' => 'Cameroon', 'CA' => 'Canada', 'CV' => 'Cape Verde',
        'CF' => 'Central African Republic', 'TD' => 'Chad', 'CL' => 'Chile', 'CN' => 'China',
        'CO' => 'Colombia', 'KM' => 'Comoros', 'CG' => 'Congo', 'CD' => 'DR Congo',
        'CR' => 'Costa Rica', 'CI' => 'Ivory Coast', 'HR' => 'Croatia', 'CU' => 'Cuba',
        'CY' => 'Cyprus', 'CZ' => 'Czech Republic', 'DK' => 'Denmark', 'DJ' => 'Djibouti',
        'DM' => 'Dominica', 'DO' => 'Dominican Republic', 'EC' => 'Ecuador', 'EG' => 'Egypt',
        'SV' => 'El Salvador', 'GQ' => 'Equatorial Guinea', 'ER' => 'Eritrea', 'EE' => 'Estonia',
        'SZ' => 'Eswatini', 'ET' => 'Ethiopia', 'FJ' => 'Fiji', 'FI' => 'Finland',
        'FR' => 'France', 'GA' => 'Gabon', 'GM' => 'Gambia', 'GE' => 'Georgia',
        'DE' => 'Germany', 'GH' => 'Ghana', 'GR' => 'Greece', 'GD' => 'Grenada',
        'GT' => 'Guatemala', 'GN' => 'Guinea', 'GW' => 'Guinea-Bissau', 'GY' => 'Guyana',
        'HT' => 'Haiti', 'HN' => 'Honduras', 'HU' => 'Hungary', 'IS' => 'Iceland',
        'IN' => 'India', 'ID' => 'Indonesia', 'IR' => 'Iran', 'IQ' => 'Iraq',
        'IE' => 'Ireland', 'IL' => 'Israel', 'IT' => 'Italy', 'JM' => 'Jamaica',
        'JP' => 'Japan', 'JO' => 'Jordan', 'KZ' => 'Kazakhstan', 'KE' => 'Kenya',
        'KI' => 'Kiribati', 'KP' => 'North Korea', 'KR' => 'South Korea', 'KW' => 'Kuwait',
        'KG' => 'Kyrgyzstan', 'LA' => 'Laos', 'LV' => 'Latvia', 'LB' => 'Lebanon',
        'LS' => 'Lesotho', 'LR' => 'Liberia', 'LY' => 'Libya', 'LI' => 'Liechtenstein',
        'LT' => 'Lithuania', 'LU' => 'Luxembourg', 'MG' => 'Madagascar', 'MW' => 'Malawi',
        'MY' => 'Malaysia', 'MV' => 'Maldives', 'ML' => 'Mali', 'MT' => 'Malta',
        'MH' => 'Marshall Islands', 'MR' => 'Mauritania', 'MU' => 'Mauritius', 'MX' => 'Mexico',
        'FM' => 'Micronesia', 'MD' => 'Moldova', 'MC' => 'Monaco', 'MN' => 'Mongolia',
        'ME' => 'Montenegro', 'MA' => 'Morocco', 'MZ' => 'Mozambique', 'MM' => 'Myanmar',
        'NA' => 'Namibia', 'NR' => 'Nauru', 'NP' => 'Nepal', 'NL' => 'Netherlands',
        'NZ' => 'New Zealand', 'NI' => 'Nicaragua', 'NE' => 'Niger', 'NG' => 'Nigeria',
        'MK' => 'North Macedonia', 'NO' => 'Norway', 'OM' => 'Oman', 'PK' => 'Pakistan',
        'PW' => 'Palau', 'PS' => 'Palestine', 'PA' => 'Panama', 'PG' => 'Papua New Guinea',
        'PY' => 'Paraguay', 'PE' => 'Peru', 'PH' => 'Philippines', 'PL' => 'Poland',
        'PT' => 'Portugal', 'QA' => 'Qatar', 'RO' => 'Romania', 'RU' => 'Russia',
        'RW' => 'Rwanda', 'KN' => 'Saint Kitts and Nevis', 'LC' => 'Saint Lucia',
        'VC' => 'Saint Vincent and the Grenadines', 'WS' => 'Samoa', 'SM' => 'San Marino',
        'ST' => 'Sao Tome and Principe', 'SA' => 'Saudi Arabia', 'SN' => 'Senegal',
        'RS' => 'Serbia', 'SC' => 'Seychelles', 'SL' => 'Sierra Leone', 'SG' => 'Singapore',
        'SK' => 'Slovakia', 'SI' => 'Slovenia', 'SB' => 'Solomon Islands', 'SO' => 'Somalia',
        'ZA' => 'South Africa', 'SS' => 'South Sudan', 'ES' => 'Spain', 'LK' => 'Sri Lanka',
        'SD' => 'Sudan', 'SR' => 'Suriname', 'SE' => 'Sweden', 'CH' => 'Switzerland',
        'SY' => 'Syria', 'TW' => 'Taiwan', 'TJ' => 'Tajikistan', 'TZ' => 'Tanzania',
        'TH' => 'Thailand', 'TL' => 'Timor-Leste', 'TG' => 'Togo', 'TO' => 'Tonga',
        'TT' => 'Trinidad and Tobago', 'TN' => 'Tunisia', 'TR' => 'Turkey', 'TM' => 'Turkmenistan',
        'TV' => 'Tuvalu', 'UG' => 'Uganda', 'UA' => 'Ukraine', 'AE' => 'United Arab Emirates',
        'GB' => 'United Kingdom', 'US' => 'United States', 'UY' => 'Uruguay', 'UZ' => 'Uzbekistan',
        'VU' => 'Vanuatu', 'VA' => 'Vatican City', 'VE' => 'Venezuela', 'VN' => 'Vietnam',
        'YE' => 'Yemen', 'ZM' => 'Zambia', 'ZW' => 'Zimbabwe',
        // ISO-3166-1 territories and special regions added so customers
        // from common tourism markets (Hong Kong, Puerto Rico, Greenland,
        // Gibraltar, Faroe Islands, etc.) can select their location.
        'HK' => 'Hong Kong', 'MO' => 'Macao', 'PR' => 'Puerto Rico',
        'GI' => 'Gibraltar', 'GL' => 'Greenland', 'FO' => 'Faroe Islands',
        'GG' => 'Guernsey', 'IM' => 'Isle of Man', 'JE' => 'Jersey',
        'AX' => 'Aland Islands', 'SJ' => 'Svalbard and Jan Mayen',
        'BM' => 'Bermuda', 'KY' => 'Cayman Islands', 'AI' => 'Anguilla',
        'AW' => 'Aruba', 'CW' => 'Curacao', 'SX' => 'Sint Maarten',
        'BQ' => 'Bonaire, Sint Eustatius and Saba',
        'MS' => 'Montserrat', 'VG' => 'British Virgin Islands',
        'TC' => 'Turks and Caicos Islands',
        'BL' => 'Saint Barthelemy', 'MF' => 'Saint Martin (French)',
        'PM' => 'Saint Pierre and Miquelon',
        'SH' => 'Saint Helena, Ascension and Tristan da Cunha',
        'FK' => 'Falkland Islands',
        'GS' => 'South Georgia and the South Sandwich Islands',
        'PF' => 'French Polynesia', 'NC' => 'New Caledonia',
        'WF' => 'Wallis and Futuna', 'CK' => 'Cook Islands',
        'NU' => 'Niue', 'TK' => 'Tokelau',
        'GP' => 'Guadeloupe', 'MQ' => 'Martinique',
        'RE' => 'Reunion', 'YT' => 'Mayotte',
        'AS' => 'American Samoa', 'GU' => 'Guam',
        'MP' => 'Northern Mariana Islands', 'VI' => 'U.S. Virgin Islands',
        'UM' => 'U.S. Minor Outlying Islands',
        'TF' => 'French Southern Territories',
        'IO' => 'British Indian Ocean Territory', 'BV' => 'Bouvet Island',
        'HM' => 'Heard Island and McDonald Islands',
        'AQ' => 'Antarctica', 'PN' => 'Pitcairn',
        'EH' => 'Western Sahara', 'XK' => 'Kosovo',
    ];

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
        return self::COUNTRY_NAMES[$code] ?? $code;
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
        $countries = self::COUNTRY_NAMES;

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

