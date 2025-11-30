<?php

declare(strict_types=1);

namespace Yatra\Helpers;

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
    /**
     * Currency symbols mapping
     */
    private const CURRENCY_SYMBOLS = [
        'USD' => '$',
        'EUR' => '€',
        'GBP' => '£',
        'JPY' => '¥',
        'CNY' => '¥',
        'INR' => '₹',
        'NPR' => 'Rs',
        'AUD' => 'A$',
        'CAD' => 'C$',
        'CHF' => 'CHF',
        'NZD' => 'NZ$',
        'SGD' => 'S$',
        'HKD' => 'HK$',
        'SEK' => 'kr',
        'NOK' => 'kr',
        'DKK' => 'kr',
        'THB' => '฿',
        'MYR' => 'RM',
        'PHP' => '₱',
        'IDR' => 'Rp',
        'VND' => '₫',
        'KRW' => '₩',
        'BRL' => 'R$',
        'MXN' => '$',
        'AED' => 'د.إ',
        'SAR' => '﷼',
    ];

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
        $currency = strtoupper($currency);
        $symbol = self::CURRENCY_SYMBOLS[$currency] ?? $currency;
        
        $formatted = number_format($amount, 2);
        
        if ($showCode && isset(self::CURRENCY_SYMBOLS[$currency])) {
            return $symbol . $formatted . ' ' . $currency;
        }
        
        return $symbol . $formatted;
    }

    /**
     * Get currency symbol
     * 
     * @param string $currency Currency code
     * @return string Currency symbol
     */
    public static function getCurrencySymbol(string $currency): string
    {
        $currency = strtoupper($currency);
        return self::CURRENCY_SYMBOLS[$currency] ?? $currency;
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

        $format = $format ?: get_option('date_format', 'F j, Y');
        
        $timestamp = strtotime($date);
        if ($timestamp === false) {
            return $date;
        }

        return date_i18n($format, $timestamp);
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

        $dateFormat = get_option('date_format', 'F j, Y');
        $timeFormat = get_option('time_format', 'g:i a');
        $format = $format ?: $dateFormat . ' ' . $timeFormat;
        
        $timestamp = strtotime($datetime);
        if ($timestamp === false) {
            return $datetime;
        }

        return date_i18n($format, $timestamp);
    }

    /**
     * Format time for display (24h to 12h) with uppercase AM/PM
     * 
     * @param string $time Time string (e.g., "14:30")
     * @return string Formatted time (e.g., "2:30 PM")
     */
    public static function formatTime(string $time): string
    {
        if (empty($time)) {
            return '';
        }

        $timestamp = strtotime($time);
        if ($timestamp === false) {
            return $time;
        }

        // Always use uppercase AM/PM format (g:i A)
        return date_i18n('g:i A', $timestamp);
    }

    /**
     * Format time for display with uppercase AM/PM
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
        
        // Always use uppercase AM/PM format (g:i A)
        return date_i18n('g:i A', $timestamp);
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
     * Get all countries as options array
     * 
     * @return array [code => name]
     */
    public static function getCountries(): array
    {
        return self::COUNTRY_NAMES;
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
}

