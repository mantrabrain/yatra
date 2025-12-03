<?php

declare(strict_types=1);

namespace Yatra\Helpers;

/**
 * Currency Helper
 * 
 * Centralized currency data for use throughout the application.
 * 
 * Usage: 
 *   CurrencyHelper::getAll()
 *   CurrencyHelper::getSymbol('USD')
 *   CurrencyHelper::getName('USD')
 * 
 * @package Yatra\Helpers
 */
class CurrencyHelper
{
    /**
     * Complete list of world currencies with code, name, and symbol
     */
    private const CURRENCIES = [
        // Major Currencies
        'USD' => ['name' => 'US Dollar', 'symbol' => '$', 'decimal_digits' => 2],
        'EUR' => ['name' => 'Euro', 'symbol' => '€', 'decimal_digits' => 2],
        'GBP' => ['name' => 'British Pound', 'symbol' => '£', 'decimal_digits' => 2],
        'JPY' => ['name' => 'Japanese Yen', 'symbol' => '¥', 'decimal_digits' => 0],
        'CNY' => ['name' => 'Chinese Yuan', 'symbol' => '¥', 'decimal_digits' => 2],
        'CHF' => ['name' => 'Swiss Franc', 'symbol' => 'CHF', 'decimal_digits' => 2],
        'CAD' => ['name' => 'Canadian Dollar', 'symbol' => 'C$', 'decimal_digits' => 2],
        'AUD' => ['name' => 'Australian Dollar', 'symbol' => 'A$', 'decimal_digits' => 2],
        'NZD' => ['name' => 'New Zealand Dollar', 'symbol' => 'NZ$', 'decimal_digits' => 2],
        
        // Asian Currencies
        'INR' => ['name' => 'Indian Rupee', 'symbol' => '₹', 'decimal_digits' => 2],
        'NPR' => ['name' => 'Nepalese Rupee', 'symbol' => 'Rs', 'decimal_digits' => 2],
        'PKR' => ['name' => 'Pakistani Rupee', 'symbol' => '₨', 'decimal_digits' => 2],
        'BDT' => ['name' => 'Bangladeshi Taka', 'symbol' => '৳', 'decimal_digits' => 2],
        'LKR' => ['name' => 'Sri Lankan Rupee', 'symbol' => 'Rs', 'decimal_digits' => 2],
        'MMK' => ['name' => 'Myanmar Kyat', 'symbol' => 'K', 'decimal_digits' => 2],
        'THB' => ['name' => 'Thai Baht', 'symbol' => '฿', 'decimal_digits' => 2],
        'VND' => ['name' => 'Vietnamese Dong', 'symbol' => '₫', 'decimal_digits' => 0],
        'IDR' => ['name' => 'Indonesian Rupiah', 'symbol' => 'Rp', 'decimal_digits' => 2],
        'MYR' => ['name' => 'Malaysian Ringgit', 'symbol' => 'RM', 'decimal_digits' => 2],
        'SGD' => ['name' => 'Singapore Dollar', 'symbol' => 'S$', 'decimal_digits' => 2],
        'PHP' => ['name' => 'Philippine Peso', 'symbol' => '₱', 'decimal_digits' => 2],
        'KRW' => ['name' => 'South Korean Won', 'symbol' => '₩', 'decimal_digits' => 0],
        'TWD' => ['name' => 'Taiwan Dollar', 'symbol' => 'NT$', 'decimal_digits' => 2],
        'HKD' => ['name' => 'Hong Kong Dollar', 'symbol' => 'HK$', 'decimal_digits' => 2],
        'MOP' => ['name' => 'Macanese Pataca', 'symbol' => 'MOP$', 'decimal_digits' => 2],
        'KHR' => ['name' => 'Cambodian Riel', 'symbol' => '៛', 'decimal_digits' => 2],
        'LAK' => ['name' => 'Lao Kip', 'symbol' => '₭', 'decimal_digits' => 2],
        'BND' => ['name' => 'Brunei Dollar', 'symbol' => 'B$', 'decimal_digits' => 2],
        'MNT' => ['name' => 'Mongolian Tugrik', 'symbol' => '₮', 'decimal_digits' => 2],
        'KZT' => ['name' => 'Kazakhstani Tenge', 'symbol' => '₸', 'decimal_digits' => 2],
        'UZS' => ['name' => 'Uzbekistani Som', 'symbol' => 'сўм', 'decimal_digits' => 2],
        'KGS' => ['name' => 'Kyrgyzstani Som', 'symbol' => 'сом', 'decimal_digits' => 2],
        'TJS' => ['name' => 'Tajikistani Somoni', 'symbol' => 'ЅМ', 'decimal_digits' => 2],
        'TMT' => ['name' => 'Turkmenistani Manat', 'symbol' => 'm', 'decimal_digits' => 2],
        'AFN' => ['name' => 'Afghan Afghani', 'symbol' => '؋', 'decimal_digits' => 2],
        
        // Middle Eastern Currencies
        'AED' => ['name' => 'UAE Dirham', 'symbol' => 'د.إ', 'decimal_digits' => 2],
        'SAR' => ['name' => 'Saudi Riyal', 'symbol' => '﷼', 'decimal_digits' => 2],
        'QAR' => ['name' => 'Qatari Riyal', 'symbol' => '﷼', 'decimal_digits' => 2],
        'KWD' => ['name' => 'Kuwaiti Dinar', 'symbol' => 'د.ك', 'decimal_digits' => 3],
        'BHD' => ['name' => 'Bahraini Dinar', 'symbol' => '.د.ب', 'decimal_digits' => 3],
        'OMR' => ['name' => 'Omani Rial', 'symbol' => '﷼', 'decimal_digits' => 3],
        'JOD' => ['name' => 'Jordanian Dinar', 'symbol' => 'د.ا', 'decimal_digits' => 3],
        'ILS' => ['name' => 'Israeli Shekel', 'symbol' => '₪', 'decimal_digits' => 2],
        'LBP' => ['name' => 'Lebanese Pound', 'symbol' => 'ل.ل', 'decimal_digits' => 2],
        'SYP' => ['name' => 'Syrian Pound', 'symbol' => '£S', 'decimal_digits' => 2],
        'IQD' => ['name' => 'Iraqi Dinar', 'symbol' => 'ع.د', 'decimal_digits' => 3],
        'IRR' => ['name' => 'Iranian Rial', 'symbol' => '﷼', 'decimal_digits' => 2],
        'YER' => ['name' => 'Yemeni Rial', 'symbol' => '﷼', 'decimal_digits' => 2],
        'EGP' => ['name' => 'Egyptian Pound', 'symbol' => 'E£', 'decimal_digits' => 2],
        'TRY' => ['name' => 'Turkish Lira', 'symbol' => '₺', 'decimal_digits' => 2],
        
        // European Currencies
        'SEK' => ['name' => 'Swedish Krona', 'symbol' => 'kr', 'decimal_digits' => 2],
        'NOK' => ['name' => 'Norwegian Krone', 'symbol' => 'kr', 'decimal_digits' => 2],
        'DKK' => ['name' => 'Danish Krone', 'symbol' => 'kr', 'decimal_digits' => 2],
        'ISK' => ['name' => 'Icelandic Króna', 'symbol' => 'kr', 'decimal_digits' => 0],
        'PLN' => ['name' => 'Polish Zloty', 'symbol' => 'zł', 'decimal_digits' => 2],
        'CZK' => ['name' => 'Czech Koruna', 'symbol' => 'Kč', 'decimal_digits' => 2],
        'HUF' => ['name' => 'Hungarian Forint', 'symbol' => 'Ft', 'decimal_digits' => 2],
        'RON' => ['name' => 'Romanian Leu', 'symbol' => 'lei', 'decimal_digits' => 2],
        'BGN' => ['name' => 'Bulgarian Lev', 'symbol' => 'лв', 'decimal_digits' => 2],
        'HRK' => ['name' => 'Croatian Kuna', 'symbol' => 'kn', 'decimal_digits' => 2],
        'RSD' => ['name' => 'Serbian Dinar', 'symbol' => 'дин.', 'decimal_digits' => 2],
        'MKD' => ['name' => 'Macedonian Denar', 'symbol' => 'ден', 'decimal_digits' => 2],
        'BAM' => ['name' => 'Bosnia-Herzegovina Mark', 'symbol' => 'KM', 'decimal_digits' => 2],
        'ALL' => ['name' => 'Albanian Lek', 'symbol' => 'L', 'decimal_digits' => 2],
        'MDL' => ['name' => 'Moldovan Leu', 'symbol' => 'L', 'decimal_digits' => 2],
        'UAH' => ['name' => 'Ukrainian Hryvnia', 'symbol' => '₴', 'decimal_digits' => 2],
        'BYN' => ['name' => 'Belarusian Ruble', 'symbol' => 'Br', 'decimal_digits' => 2],
        'RUB' => ['name' => 'Russian Ruble', 'symbol' => '₽', 'decimal_digits' => 2],
        'GEL' => ['name' => 'Georgian Lari', 'symbol' => '₾', 'decimal_digits' => 2],
        'AMD' => ['name' => 'Armenian Dram', 'symbol' => '֏', 'decimal_digits' => 2],
        'AZN' => ['name' => 'Azerbaijani Manat', 'symbol' => '₼', 'decimal_digits' => 2],
        
        // African Currencies
        'ZAR' => ['name' => 'South African Rand', 'symbol' => 'R', 'decimal_digits' => 2],
        'NGN' => ['name' => 'Nigerian Naira', 'symbol' => '₦', 'decimal_digits' => 2],
        'KES' => ['name' => 'Kenyan Shilling', 'symbol' => 'KSh', 'decimal_digits' => 2],
        'GHS' => ['name' => 'Ghanaian Cedi', 'symbol' => '₵', 'decimal_digits' => 2],
        'TZS' => ['name' => 'Tanzanian Shilling', 'symbol' => 'TSh', 'decimal_digits' => 2],
        'UGX' => ['name' => 'Ugandan Shilling', 'symbol' => 'USh', 'decimal_digits' => 0],
        'RWF' => ['name' => 'Rwandan Franc', 'symbol' => 'FRw', 'decimal_digits' => 0],
        'ETB' => ['name' => 'Ethiopian Birr', 'symbol' => 'Br', 'decimal_digits' => 2],
        'MAD' => ['name' => 'Moroccan Dirham', 'symbol' => 'د.م.', 'decimal_digits' => 2],
        'TND' => ['name' => 'Tunisian Dinar', 'symbol' => 'د.ت', 'decimal_digits' => 3],
        'DZD' => ['name' => 'Algerian Dinar', 'symbol' => 'د.ج', 'decimal_digits' => 2],
        'LYD' => ['name' => 'Libyan Dinar', 'symbol' => 'ل.د', 'decimal_digits' => 3],
        'SDG' => ['name' => 'Sudanese Pound', 'symbol' => 'ج.س.', 'decimal_digits' => 2],
        'XOF' => ['name' => 'West African CFA Franc', 'symbol' => 'CFA', 'decimal_digits' => 0],
        'XAF' => ['name' => 'Central African CFA Franc', 'symbol' => 'FCFA', 'decimal_digits' => 0],
        'MUR' => ['name' => 'Mauritian Rupee', 'symbol' => '₨', 'decimal_digits' => 2],
        'SCR' => ['name' => 'Seychellois Rupee', 'symbol' => '₨', 'decimal_digits' => 2],
        'MGA' => ['name' => 'Malagasy Ariary', 'symbol' => 'Ar', 'decimal_digits' => 2],
        'MZN' => ['name' => 'Mozambican Metical', 'symbol' => 'MT', 'decimal_digits' => 2],
        'ZMW' => ['name' => 'Zambian Kwacha', 'symbol' => 'ZK', 'decimal_digits' => 2],
        'BWP' => ['name' => 'Botswana Pula', 'symbol' => 'P', 'decimal_digits' => 2],
        'NAD' => ['name' => 'Namibian Dollar', 'symbol' => 'N$', 'decimal_digits' => 2],
        'AOA' => ['name' => 'Angolan Kwanza', 'symbol' => 'Kz', 'decimal_digits' => 2],
        'CDF' => ['name' => 'Congolese Franc', 'symbol' => 'FC', 'decimal_digits' => 2],
        
        // Americas Currencies
        'BRL' => ['name' => 'Brazilian Real', 'symbol' => 'R$', 'decimal_digits' => 2],
        'MXN' => ['name' => 'Mexican Peso', 'symbol' => '$', 'decimal_digits' => 2],
        'ARS' => ['name' => 'Argentine Peso', 'symbol' => '$', 'decimal_digits' => 2],
        'CLP' => ['name' => 'Chilean Peso', 'symbol' => '$', 'decimal_digits' => 0],
        'COP' => ['name' => 'Colombian Peso', 'symbol' => '$', 'decimal_digits' => 2],
        'PEN' => ['name' => 'Peruvian Sol', 'symbol' => 'S/', 'decimal_digits' => 2],
        'UYU' => ['name' => 'Uruguayan Peso', 'symbol' => '$U', 'decimal_digits' => 2],
        'PYG' => ['name' => 'Paraguayan Guarani', 'symbol' => '₲', 'decimal_digits' => 0],
        'BOB' => ['name' => 'Bolivian Boliviano', 'symbol' => 'Bs.', 'decimal_digits' => 2],
        'VES' => ['name' => 'Venezuelan Bolívar', 'symbol' => 'Bs.S', 'decimal_digits' => 2],
        'CRC' => ['name' => 'Costa Rican Colón', 'symbol' => '₡', 'decimal_digits' => 2],
        'PAB' => ['name' => 'Panamanian Balboa', 'symbol' => 'B/.', 'decimal_digits' => 2],
        'GTQ' => ['name' => 'Guatemalan Quetzal', 'symbol' => 'Q', 'decimal_digits' => 2],
        'HNL' => ['name' => 'Honduran Lempira', 'symbol' => 'L', 'decimal_digits' => 2],
        'NIO' => ['name' => 'Nicaraguan Córdoba', 'symbol' => 'C$', 'decimal_digits' => 2],
        'SVC' => ['name' => 'Salvadoran Colón', 'symbol' => '₡', 'decimal_digits' => 2],
        'DOP' => ['name' => 'Dominican Peso', 'symbol' => 'RD$', 'decimal_digits' => 2],
        'CUP' => ['name' => 'Cuban Peso', 'symbol' => '₱', 'decimal_digits' => 2],
        'HTG' => ['name' => 'Haitian Gourde', 'symbol' => 'G', 'decimal_digits' => 2],
        'JMD' => ['name' => 'Jamaican Dollar', 'symbol' => 'J$', 'decimal_digits' => 2],
        'TTD' => ['name' => 'Trinidad & Tobago Dollar', 'symbol' => 'TT$', 'decimal_digits' => 2],
        'BBD' => ['name' => 'Barbadian Dollar', 'symbol' => 'Bds$', 'decimal_digits' => 2],
        'BSD' => ['name' => 'Bahamian Dollar', 'symbol' => 'B$', 'decimal_digits' => 2],
        'BZD' => ['name' => 'Belize Dollar', 'symbol' => 'BZ$', 'decimal_digits' => 2],
        'GYD' => ['name' => 'Guyanese Dollar', 'symbol' => 'G$', 'decimal_digits' => 2],
        'SRD' => ['name' => 'Surinamese Dollar', 'symbol' => '$', 'decimal_digits' => 2],
        'XCD' => ['name' => 'East Caribbean Dollar', 'symbol' => 'EC$', 'decimal_digits' => 2],
        'AWG' => ['name' => 'Aruban Florin', 'symbol' => 'ƒ', 'decimal_digits' => 2],
        'ANG' => ['name' => 'Netherlands Antillean Guilder', 'symbol' => 'ƒ', 'decimal_digits' => 2],
        'KYD' => ['name' => 'Cayman Islands Dollar', 'symbol' => 'CI$', 'decimal_digits' => 2],
        'BMD' => ['name' => 'Bermudian Dollar', 'symbol' => '$', 'decimal_digits' => 2],
        
        // Oceania Currencies
        'FJD' => ['name' => 'Fijian Dollar', 'symbol' => 'FJ$', 'decimal_digits' => 2],
        'PGK' => ['name' => 'Papua New Guinean Kina', 'symbol' => 'K', 'decimal_digits' => 2],
        'SBD' => ['name' => 'Solomon Islands Dollar', 'symbol' => 'SI$', 'decimal_digits' => 2],
        'VUV' => ['name' => 'Vanuatu Vatu', 'symbol' => 'VT', 'decimal_digits' => 0],
        'WST' => ['name' => 'Samoan Tala', 'symbol' => 'WS$', 'decimal_digits' => 2],
        'TOP' => ['name' => 'Tongan Paʻanga', 'symbol' => 'T$', 'decimal_digits' => 2],
        'XPF' => ['name' => 'CFP Franc', 'symbol' => '₣', 'decimal_digits' => 0],
        
        // Crypto (optional, for modern support)
        'BTC' => ['name' => 'Bitcoin', 'symbol' => '₿', 'decimal_digits' => 8],
        'ETH' => ['name' => 'Ethereum', 'symbol' => 'Ξ', 'decimal_digits' => 8],
    ];

    /**
     * Get all currencies
     * 
     * @return array [code => ['name' => ..., 'symbol' => ..., 'decimal_digits' => ...]]
     */
    public static function getAll(): array
    {
        return self::CURRENCIES;
    }

    /**
     * Get currencies as simple options array for dropdowns
     * 
     * @param bool $includeSymbol Include symbol in label
     * @return array [code => label]
     */
    public static function getOptions(bool $includeSymbol = true): array
    {
        $options = [];
        foreach (self::CURRENCIES as $code => $data) {
            if ($includeSymbol) {
                $options[$code] = "{$data['name']} ({$data['symbol']})";
            } else {
                $options[$code] = "{$data['name']} ({$code})";
            }
        }
        return $options;
    }

    /**
     * Get currency symbol
     * 
     * @param string $code Currency code
     * @return string Symbol or code if not found
     */
    public static function getSymbol(string $code): string
    {
        $code = strtoupper($code);
        return self::CURRENCIES[$code]['symbol'] ?? $code;
    }

    /**
     * Get currency name
     * 
     * @param string $code Currency code
     * @return string Name or code if not found
     */
    public static function getName(string $code): string
    {
        $code = strtoupper($code);
        return self::CURRENCIES[$code]['name'] ?? $code;
    }

    /**
     * Get decimal digits for currency
     * 
     * @param string $code Currency code
     * @return int Decimal digits (default 2)
     */
    public static function getDecimalDigits(string $code): int
    {
        $code = strtoupper($code);
        return self::CURRENCIES[$code]['decimal_digits'] ?? 2;
    }

    /**
     * Get currency data
     * 
     * @param string $code Currency code
     * @return array|null Currency data or null if not found
     */
    public static function get(string $code): ?array
    {
        $code = strtoupper($code);
        return self::CURRENCIES[$code] ?? null;
    }

    /**
     * Check if currency exists
     * 
     * @param string $code Currency code
     * @return bool
     */
    public static function exists(string $code): bool
    {
        return isset(self::CURRENCIES[strtoupper($code)]);
    }

    /**
     * Format amount with currency
     * 
     * @param float  $amount   Amount to format
     * @param string $code     Currency code
     * @param bool   $showCode Show currency code after amount
     * @return string Formatted amount
     */
    public static function format(float $amount, string $code = 'USD', bool $showCode = false): string
    {
        $code = strtoupper($code);
        $currency = self::CURRENCIES[$code] ?? null;
        
        if (!$currency) {
            return number_format($amount, 2) . ' ' . $code;
        }
        
        $formatted = number_format($amount, $currency['decimal_digits']);
        $result = $currency['symbol'] . $formatted;
        
        if ($showCode) {
            $result .= ' ' . $code;
        }
        
        return $result;
    }

    /**
     * Get currencies for JavaScript (to be localized)
     * 
     * @return array
     */
    public static function getForJavaScript(): array
    {
        $currencies = [];
        foreach (self::CURRENCIES as $code => $data) {
            $currencies[$code] = [
                'code' => $code,
                'name' => $data['name'],
                'symbol' => $data['symbol'],
                'decimalDigits' => $data['decimal_digits'],
                'label' => "{$data['name']} ({$data['symbol']})",
            ];
        }
        return $currencies;
    }

    /**
     * Get popular/common currencies (for quick selection)
     * 
     * @return array
     */
    public static function getPopular(): array
    {
        $popular = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF', 'INR', 'NPR'];
        $result = [];
        foreach ($popular as $code) {
            if (isset(self::CURRENCIES[$code])) {
                $result[$code] = self::CURRENCIES[$code];
            }
        }
        return $result;
    }
}
