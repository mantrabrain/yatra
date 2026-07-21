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
     * Build a customer's postal address as display lines, for invoices and any
     * other document that has to show where the customer actually is.
     *
     * Two sources, in order of authority:
     *   1. The booking's own contact data — what the customer entered at the time
     *      of purchase, which is what an invoice should reflect.
     *   2. The linked customer record, which carries the structured city / state /
     *      postal code / country that the booking form does not always collect.
     *
     * @param object|array|null $booking Booking (or payment joined to one) carrying
     *                                   contact_data / contact_country / customer_id.
     * @return string[] Non-empty address lines, ready to render one per line.
     */
    public static function customerAddressLines($booking): array
    {
        $get = static function ($source, string $key) {
            if (is_array($source)) {
                return $source[$key] ?? null;
            }
            if (is_object($source)) {
                return $source->$key ?? null;
            }
            return null;
        };

        $parts = ['address' => '', 'city' => '', 'state' => '', 'postal_code' => '', 'country' => ''];

        // 1. What the customer typed when booking.
        $contactData = $get($booking, 'contact_data');
        if (is_string($contactData) && $contactData !== '') {
            $contactData = json_decode($contactData, true);
        }
        if (is_array($contactData)) {
            foreach (array_keys($parts) as $key) {
                if (!empty($contactData[$key]) && is_scalar($contactData[$key])) {
                    $parts[$key] = trim((string) $contactData[$key]);
                }
            }
            // The booking form stores the postcode under either name.
            if ($parts['postal_code'] === '' && !empty($contactData['zip'])) {
                $parts['postal_code'] = trim((string) $contactData['zip']);
            }
        }

        if ($parts['country'] === '') {
            $parts['country'] = trim((string) ($get($booking, 'contact_country') ?? ''));
        }

        // 2. Fill the gaps from the customer record.
        $customerId = (int) ($get($booking, 'customer_id') ?? 0);
        if ($customerId > 0 && in_array('', $parts, true)) {
            $customer = (new \Yatra\Repositories\CustomerRepository())->find($customerId);

            if ($customer) {
                foreach (array_keys($parts) as $key) {
                    if ($parts[$key] === '' && !empty($customer->$key)) {
                        $parts[$key] = trim((string) $customer->$key);
                    }
                }
            }
        }

        // "City, State 12345" reads as one line; street and country get their own.
        $locality = trim(implode(', ', array_filter([$parts['city'], $parts['state']])));
        if ($parts['postal_code'] !== '') {
            $locality = trim($locality . ' ' . $parts['postal_code']);
        }

        $country = $parts['country'] !== '' ? self::getCountryName($parts['country']) : '';

        return array_values(array_filter([$parts['address'], $locality, $country], static function ($line) {
            return $line !== '';
        }));
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
     * International dialing codes, keyed by ISO-3166-1 alpha-2 (digits only,
     * no leading "+"). Aligned to the {@see countryNames()} set. Multiple
     * countries legitimately share a code (all NANP countries use "1", RU/KZ
     * use "7", GB/GG/IM/JE use "44") — {@see dialingCodePriority()} resolves
     * which one an incoming "+code" auto-selects.
     *
     * @return array<string, string> [ISO code => dialing code]
     */
    private static function dialingCodes(): array
    {
        return [
            'AF' => '93', 'AL' => '355', 'DZ' => '213', 'AD' => '376', 'AO' => '244', 'AI' => '1', 'AQ' => '672',
            'AG' => '1', 'AR' => '54', 'AM' => '374', 'AW' => '297', 'AU' => '61', 'AT' => '43', 'AZ' => '994',
            'BS' => '1', 'BH' => '973', 'BD' => '880', 'BB' => '1', 'BY' => '375', 'BE' => '32', 'BZ' => '501',
            'BJ' => '229', 'BM' => '1', 'BT' => '975', 'BO' => '591', 'BQ' => '599', 'BA' => '387', 'BW' => '267',
            'BR' => '55', 'IO' => '246', 'BN' => '673', 'BG' => '359', 'BF' => '226', 'BI' => '257', 'KH' => '855',
            'CM' => '237', 'CA' => '1', 'CV' => '238', 'KY' => '1', 'CF' => '236', 'TD' => '235', 'CL' => '56',
            'CN' => '86', 'CO' => '57', 'KM' => '269', 'CG' => '242', 'CD' => '243', 'CK' => '682', 'CR' => '506',
            'CI' => '225', 'HR' => '385', 'CU' => '53', 'CW' => '599', 'CY' => '357', 'CZ' => '420', 'DK' => '45',
            'DJ' => '253', 'DM' => '1', 'DO' => '1', 'EC' => '593', 'EG' => '20', 'SV' => '503', 'GQ' => '240',
            'ER' => '291', 'EE' => '372', 'SZ' => '268', 'ET' => '251', 'FK' => '500', 'FO' => '298', 'FJ' => '679',
            'FI' => '358', 'FR' => '33', 'GF' => '594', 'PF' => '689', 'GA' => '241', 'GM' => '220', 'GE' => '995',
            'DE' => '49', 'GH' => '233', 'GI' => '350', 'GR' => '30', 'GL' => '299', 'GD' => '1', 'GP' => '590',
            'GU' => '1', 'GT' => '502', 'GG' => '44', 'GN' => '224', 'GW' => '245', 'GY' => '592', 'HT' => '509',
            'HN' => '504', 'HK' => '852', 'HU' => '36', 'IS' => '354', 'IN' => '91', 'ID' => '62', 'IR' => '98',
            'IQ' => '964', 'IE' => '353', 'IM' => '44', 'IL' => '972', 'IT' => '39', 'JM' => '1', 'JP' => '81',
            'JE' => '44', 'JO' => '962', 'KZ' => '7', 'KE' => '254', 'KI' => '686', 'KP' => '850', 'KR' => '82',
            'KW' => '965', 'KG' => '996', 'LA' => '856', 'LV' => '371', 'LB' => '961', 'LS' => '266', 'LR' => '231',
            'LY' => '218', 'LI' => '423', 'LT' => '370', 'LU' => '352', 'MO' => '853', 'MK' => '389', 'MG' => '261',
            'MW' => '265', 'MY' => '60', 'MV' => '960', 'ML' => '223', 'MT' => '356', 'MH' => '692', 'MQ' => '596',
            'MR' => '222', 'MU' => '230', 'YT' => '262', 'MX' => '52', 'FM' => '691', 'MD' => '373', 'MC' => '377',
            'MN' => '976', 'ME' => '382', 'MS' => '1', 'MA' => '212', 'MZ' => '258', 'MM' => '95', 'NA' => '264',
            'NR' => '674', 'NP' => '977', 'NL' => '31', 'NC' => '687', 'NZ' => '64', 'NI' => '505', 'NE' => '227',
            'NG' => '234', 'NU' => '683', 'NF' => '672', 'MP' => '1', 'NO' => '47', 'OM' => '968', 'PK' => '92',
            'PW' => '680', 'PS' => '970', 'PA' => '507', 'PG' => '675', 'PY' => '595', 'PE' => '51', 'PH' => '63',
            'PN' => '64', 'PL' => '48', 'PT' => '351', 'PR' => '1', 'QA' => '974', 'RE' => '262', 'RO' => '40',
            'RU' => '7', 'RW' => '250', 'BL' => '590', 'SH' => '290', 'KN' => '1', 'LC' => '1', 'MF' => '590',
            'PM' => '508', 'VC' => '1', 'WS' => '685', 'SM' => '378', 'ST' => '239', 'SA' => '966', 'SN' => '221',
            'RS' => '381', 'SC' => '248', 'SL' => '232', 'SG' => '65', 'SX' => '1', 'SK' => '421', 'SI' => '386',
            'SB' => '677', 'SO' => '252', 'ZA' => '27', 'GS' => '500', 'SS' => '211', 'ES' => '34', 'LK' => '94',
            'SD' => '249', 'SR' => '597', 'SJ' => '47', 'SE' => '46', 'CH' => '41', 'SY' => '963', 'TW' => '886',
            'TJ' => '992', 'TZ' => '255', 'TH' => '66', 'TL' => '670', 'TG' => '228', 'TK' => '690', 'TO' => '676',
            'TT' => '1', 'TN' => '216', 'TR' => '90', 'TM' => '993', 'TC' => '1', 'TV' => '688', 'UG' => '256',
            'UA' => '380', 'AE' => '971', 'GB' => '44', 'US' => '1', 'UY' => '598', 'UZ' => '998', 'VU' => '678',
            'VA' => '39', 'VE' => '58', 'VN' => '84', 'VG' => '1', 'VI' => '1', 'WF' => '681', 'EH' => '212',
            'YE' => '967', 'ZM' => '260', 'ZW' => '263', 'XK' => '383', 'AS' => '1', 'AX' => '358',
            'UM' => '1', 'CX' => '61', 'CC' => '61', 'TA' => '290',
        ];
    }

    /**
     * Preferred country for a dialing code that several countries share. When
     * an operator types a raw "+<code><number>" we must pick one country to
     * auto-select; this is the conventional primary (e.g. "1" => US, not one of
     * the ~20 other NANP countries). Codes not listed here fall back to the
     * first ISO that declares them.
     *
     * @return array<string, string> [dialing code => primary ISO]
     */
    private static function dialingCodePriority(): array
    {
        return [
            '1' => 'US', '7' => 'RU', '39' => 'IT', '44' => 'GB', '47' => 'NO', '61' => 'AU',
            '212' => 'MA', '262' => 'RE', '290' => 'SH', '358' => 'FI', '500' => 'FK',
            '590' => 'GP', '599' => 'CW', '64' => 'NZ', '672' => 'AQ',
        ];
    }

    /**
     * Preferred ISO per shared dialing code (dial => ISO), for the front-end
     * detector to resolve which country a "+code" auto-selects. Mirrors the
     * server-side {@see dialingCodePriority()}.
     *
     * @return array<string, string>
     */
    public static function getPhonePriority(): array
    {
        return self::dialingCodePriority();
    }

    /**
     * Dialing code (digits only, no "+") for one ISO code, or '' if unknown.
     */
    public static function getDialingCode(string $iso): string
    {
        $codes = self::dialingCodes();
        return $codes[strtoupper($iso)] ?? '';
    }

    /**
     * Country list for the phone-number field: ISO code, display name and
     * dialing code, sorted by display name. Filterable via
     * `yatra_phone_countries` (e.g. to pin popular countries to the top).
     *
     * @return array<int, array{iso:string, name:string, dial:string}>
     */
    public static function getPhoneCountries(): array
    {
        $names = self::getCountries();      // [iso => name], already sorted/filtered
        $dial  = self::dialingCodes();
        $out   = [];
        foreach ($names as $iso => $name) {
            $iso = strtoupper((string) $iso);
            if (!isset($dial[$iso]) || $dial[$iso] === '') {
                continue;
            }
            $out[] = ['iso' => $iso, 'name' => (string) $name, 'dial' => $dial[$iso]];
        }
        if (\function_exists('apply_filters')) {
            $filtered = apply_filters('yatra_phone_countries', $out);
            if (\is_array($filtered) && $filtered !== []) {
                return $filtered;
            }
        }
        return $out;
    }

    /**
     * Detect the country/dialing-code from a raw phone value. Only a value that
     * begins with "+" is treated as international; anything else returns null so
     * an existing bare national number is left untouched (backward compatible).
     *
     * Uses longest-prefix matching so "+9779806015400" → NP (977), not a shorter
     * false match, then applies {@see dialingCodePriority()} for shared codes.
     *
     * @return array{iso:string, dial:string, national:string}|null
     */
    public static function detectPhoneCountry(string $raw): ?array
    {
        $raw = trim($raw);
        if ($raw === '' || $raw[0] !== '+') {
            return null;
        }
        $digits = preg_replace('/\D+/', '', $raw);
        if ($digits === '' || $digits === null) {
            return null;
        }
        $codes    = self::dialingCodes();
        $priority = self::dialingCodePriority();
        $maxLen   = min(4, strlen($digits));
        for ($len = $maxLen; $len >= 1; $len--) {
            $prefix  = substr($digits, 0, $len);
            $matches = array_keys($codes, $prefix, true);
            if ($matches === []) {
                continue;
            }
            $iso = $priority[$prefix] ?? (string) $matches[0];
            return [
                'iso'      => $iso,
                'dial'     => $prefix,
                'national' => substr($digits, $len),
            ];
        }
        return null;
    }

    /**
     * Default country pre-selected in the phone field. Priority: the
     * `default_phone_country` setting → the site locale suffix (en_US → US,
     * ne_NP → NP) → "US". Filterable via `yatra_default_phone_country`.
     */
    public static function getDefaultPhoneCountry(): string
    {
        $codes   = self::dialingCodes();
        $default = '';

        if (\class_exists(SettingsService::class)) {
            $setting = strtoupper((string) SettingsService::getString('default_phone_country', ''));
            if ($setting !== '' && isset($codes[$setting])) {
                $default = $setting;
            }
        }
        if ($default === '' && \function_exists('get_locale')) {
            if (preg_match('/_([A-Z]{2})$/', (string) get_locale(), $m) && isset($codes[$m[1]])) {
                $default = $m[1];
            }
        }
        if ($default === '') {
            $default = 'US';
        }
        if (\function_exists('apply_filters')) {
            $default = (string) apply_filters('yatra_default_phone_country', $default);
        }
        return isset($codes[$default]) ? $default : 'US';
    }

    /**
     * Combine a national number with a country (ISO) into the stored value.
     *
     * - Empty number → '' (nothing to store).
     * - Already-international ("+...") → returned unchanged (a pasted full number
     *   or the no-JS fallback where the customer typed the "+code" themselves).
     * - National number + known ISO → "+<dial><digits>" (spaces/dashes stripped).
     * - No/unknown ISO → the number left as typed (legacy behavior, backward
     *   compatible — nothing is invented).
     */
    public static function combineInternationalPhone(string $number, string $iso): string
    {
        $number = trim($number);
        if ($number === '') {
            return '';
        }
        if ($number[0] === '+') {
            return $number;
        }
        $iso  = strtoupper(trim($iso));
        $dial = $iso !== '' ? self::getDialingCode($iso) : '';
        if ($dial === '') {
            return $number;
        }
        $digits = preg_replace('/\D+/', '', $number);
        if ($digits === '' || $digits === null) {
            return $number;
        }
        return '+' . $dial . $digits;
    }

    /**
     * Format a stored phone value for human display. A value saved with a
     * country code ("+9779806015400") is shown as "+977 9806015400"; a legacy
     * bare value is returned unchanged (never corrupted). Optionally accepts a
     * known ISO to disambiguate shared codes.
     */
    public static function formatPhoneForDisplay(string $stored, string $iso = ''): string
    {
        $stored = trim($stored);
        if ($stored === '') {
            return '';
        }
        $detected = self::detectPhoneCountry($stored);
        if ($detected === null) {
            return $stored; // legacy / national-only value — leave as-is
        }
        $national = $detected['national'] !== '' ? ' ' . $detected['national'] : '';
        return '+' . $detected['dial'] . $national;
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

        // Rounds to the nearest half star (see yatra_rating_star_parts), so this
        // renderer agrees with the confirmation page and reviews block.
        if (function_exists('yatra_rating_star_parts')) {
            $parts = yatra_rating_star_parts($rating);
            $fullStars = $parts['full'];
            $hasHalfStar = $parts['half'];
        } else {
            $halves = (int) round($rating * 2);
            $fullStars = intdiv($halves, 2);
            $hasHalfStar = ($halves % 2) === 1;
        }
        
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

