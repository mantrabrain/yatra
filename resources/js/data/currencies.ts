/**
 * Currency Data
 *
 * Centralized currency definitions for use throughout the application.
 * Keep in sync with PHP: app/Helpers/CurrencyHelper.php
 */

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalDigits: number;
}

export const CURRENCIES: Record<string, Currency> = {
  // Major Currencies
  USD: { code: "USD", name: "US Dollar", symbol: "$", decimalDigits: 2 },
  EUR: { code: "EUR", name: "Euro", symbol: "€", decimalDigits: 2 },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", decimalDigits: 2 },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥", decimalDigits: 0 },
  CNY: { code: "CNY", name: "Chinese Yuan", symbol: "¥", decimalDigits: 2 },
  CHF: { code: "CHF", name: "Swiss Franc", symbol: "CHF", decimalDigits: 2 },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "C$", decimalDigits: 2 },
  AUD: {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    decimalDigits: 2,
  },
  NZD: {
    code: "NZD",
    name: "New Zealand Dollar",
    symbol: "NZ$",
    decimalDigits: 2,
  },

  // Asian Currencies
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", decimalDigits: 2 },
  NPR: { code: "NPR", name: "Nepalese Rupee", symbol: "Rs", decimalDigits: 2 },
  PKR: { code: "PKR", name: "Pakistani Rupee", symbol: "₨", decimalDigits: 2 },
  BDT: { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", decimalDigits: 2 },
  LKR: {
    code: "LKR",
    name: "Sri Lankan Rupee",
    symbol: "Rs",
    decimalDigits: 2,
  },
  MMK: { code: "MMK", name: "Myanmar Kyat", symbol: "K", decimalDigits: 2 },
  THB: { code: "THB", name: "Thai Baht", symbol: "฿", decimalDigits: 2 },
  VND: { code: "VND", name: "Vietnamese Dong", symbol: "₫", decimalDigits: 0 },
  IDR: {
    code: "IDR",
    name: "Indonesian Rupiah",
    symbol: "Rp",
    decimalDigits: 2,
  },
  MYR: {
    code: "MYR",
    name: "Malaysian Ringgit",
    symbol: "RM",
    decimalDigits: 2,
  },
  SGD: {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
    decimalDigits: 2,
  },
  PHP: { code: "PHP", name: "Philippine Peso", symbol: "₱", decimalDigits: 2 },
  KRW: { code: "KRW", name: "South Korean Won", symbol: "₩", decimalDigits: 0 },
  TWD: { code: "TWD", name: "Taiwan Dollar", symbol: "NT$", decimalDigits: 2 },
  HKD: {
    code: "HKD",
    name: "Hong Kong Dollar",
    symbol: "HK$",
    decimalDigits: 2,
  },
  MOP: {
    code: "MOP",
    name: "Macanese Pataca",
    symbol: "MOP$",
    decimalDigits: 2,
  },
  KHR: { code: "KHR", name: "Cambodian Riel", symbol: "៛", decimalDigits: 2 },
  LAK: { code: "LAK", name: "Lao Kip", symbol: "₭", decimalDigits: 2 },
  BND: { code: "BND", name: "Brunei Dollar", symbol: "B$", decimalDigits: 2 },
  MNT: { code: "MNT", name: "Mongolian Tugrik", symbol: "₮", decimalDigits: 2 },
  KZT: {
    code: "KZT",
    name: "Kazakhstani Tenge",
    symbol: "₸",
    decimalDigits: 2,
  },
  UZS: {
    code: "UZS",
    name: "Uzbekistani Som",
    symbol: "сўм",
    decimalDigits: 2,
  },
  KGS: {
    code: "KGS",
    name: "Kyrgyzstani Som",
    symbol: "сом",
    decimalDigits: 2,
  },
  TJS: {
    code: "TJS",
    name: "Tajikistani Somoni",
    symbol: "ЅМ",
    decimalDigits: 2,
  },
  TMT: {
    code: "TMT",
    name: "Turkmenistani Manat",
    symbol: "m",
    decimalDigits: 2,
  },
  AFN: { code: "AFN", name: "Afghan Afghani", symbol: "؋", decimalDigits: 2 },

  // Middle Eastern Currencies
  AED: { code: "AED", name: "UAE Dirham", symbol: "د.إ", decimalDigits: 2 },
  SAR: { code: "SAR", name: "Saudi Riyal", symbol: "﷼", decimalDigits: 2 },
  QAR: { code: "QAR", name: "Qatari Riyal", symbol: "﷼", decimalDigits: 2 },
  KWD: { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", decimalDigits: 3 },
  BHD: {
    code: "BHD",
    name: "Bahraini Dinar",
    symbol: ".د.ب",
    decimalDigits: 3,
  },
  OMR: { code: "OMR", name: "Omani Rial", symbol: "﷼", decimalDigits: 3 },
  JOD: {
    code: "JOD",
    name: "Jordanian Dinar",
    symbol: "د.ا",
    decimalDigits: 3,
  },
  ILS: { code: "ILS", name: "Israeli Shekel", symbol: "₪", decimalDigits: 2 },
  LBP: { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل", decimalDigits: 2 },
  SYP: { code: "SYP", name: "Syrian Pound", symbol: "£S", decimalDigits: 2 },
  IQD: { code: "IQD", name: "Iraqi Dinar", symbol: "ع.د", decimalDigits: 3 },
  IRR: { code: "IRR", name: "Iranian Rial", symbol: "﷼", decimalDigits: 2 },
  YER: { code: "YER", name: "Yemeni Rial", symbol: "﷼", decimalDigits: 2 },
  EGP: { code: "EGP", name: "Egyptian Pound", symbol: "E£", decimalDigits: 2 },
  TRY: { code: "TRY", name: "Turkish Lira", symbol: "₺", decimalDigits: 2 },

  // European Currencies
  SEK: { code: "SEK", name: "Swedish Krona", symbol: "kr", decimalDigits: 2 },
  NOK: { code: "NOK", name: "Norwegian Krone", symbol: "kr", decimalDigits: 2 },
  DKK: { code: "DKK", name: "Danish Krone", symbol: "kr", decimalDigits: 2 },
  ISK: { code: "ISK", name: "Icelandic Króna", symbol: "kr", decimalDigits: 0 },
  PLN: { code: "PLN", name: "Polish Zloty", symbol: "zł", decimalDigits: 2 },
  CZK: { code: "CZK", name: "Czech Koruna", symbol: "Kč", decimalDigits: 2 },
  HUF: {
    code: "HUF",
    name: "Hungarian Forint",
    symbol: "Ft",
    decimalDigits: 2,
  },
  RON: { code: "RON", name: "Romanian Leu", symbol: "lei", decimalDigits: 2 },
  BGN: { code: "BGN", name: "Bulgarian Lev", symbol: "лв", decimalDigits: 2 },
  HRK: { code: "HRK", name: "Croatian Kuna", symbol: "kn", decimalDigits: 2 },
  RSD: { code: "RSD", name: "Serbian Dinar", symbol: "дин.", decimalDigits: 2 },
  MKD: {
    code: "MKD",
    name: "Macedonian Denar",
    symbol: "ден",
    decimalDigits: 2,
  },
  BAM: {
    code: "BAM",
    name: "Bosnia-Herzegovina Mark",
    symbol: "KM",
    decimalDigits: 2,
  },
  ALL: { code: "ALL", name: "Albanian Lek", symbol: "L", decimalDigits: 2 },
  MDL: { code: "MDL", name: "Moldovan Leu", symbol: "L", decimalDigits: 2 },
  UAH: {
    code: "UAH",
    name: "Ukrainian Hryvnia",
    symbol: "₴",
    decimalDigits: 2,
  },
  BYN: {
    code: "BYN",
    name: "Belarusian Ruble",
    symbol: "Br",
    decimalDigits: 2,
  },
  RUB: { code: "RUB", name: "Russian Ruble", symbol: "₽", decimalDigits: 2 },
  GEL: { code: "GEL", name: "Georgian Lari", symbol: "₾", decimalDigits: 2 },
  AMD: { code: "AMD", name: "Armenian Dram", symbol: "֏", decimalDigits: 2 },
  AZN: {
    code: "AZN",
    name: "Azerbaijani Manat",
    symbol: "₼",
    decimalDigits: 2,
  },

  // African Currencies
  ZAR: {
    code: "ZAR",
    name: "South African Rand",
    symbol: "R",
    decimalDigits: 2,
  },
  NGN: { code: "NGN", name: "Nigerian Naira", symbol: "₦", decimalDigits: 2 },
  KES: {
    code: "KES",
    name: "Kenyan Shilling",
    symbol: "KSh",
    decimalDigits: 2,
  },
  GHS: { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", decimalDigits: 2 },
  TZS: {
    code: "TZS",
    name: "Tanzanian Shilling",
    symbol: "TSh",
    decimalDigits: 2,
  },
  UGX: {
    code: "UGX",
    name: "Ugandan Shilling",
    symbol: "USh",
    decimalDigits: 0,
  },
  RWF: { code: "RWF", name: "Rwandan Franc", symbol: "FRw", decimalDigits: 0 },
  ETB: { code: "ETB", name: "Ethiopian Birr", symbol: "Br", decimalDigits: 2 },
  MAD: {
    code: "MAD",
    name: "Moroccan Dirham",
    symbol: "د.م.",
    decimalDigits: 2,
  },
  TND: { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", decimalDigits: 3 },
  DZD: { code: "DZD", name: "Algerian Dinar", symbol: "د.ج", decimalDigits: 2 },
  LYD: { code: "LYD", name: "Libyan Dinar", symbol: "ل.د", decimalDigits: 3 },
  SDG: {
    code: "SDG",
    name: "Sudanese Pound",
    symbol: "ج.س.",
    decimalDigits: 2,
  },
  XOF: {
    code: "XOF",
    name: "West African CFA Franc",
    symbol: "CFA",
    decimalDigits: 0,
  },
  XAF: {
    code: "XAF",
    name: "Central African CFA Franc",
    symbol: "FCFA",
    decimalDigits: 0,
  },
  MUR: { code: "MUR", name: "Mauritian Rupee", symbol: "₨", decimalDigits: 2 },
  SCR: {
    code: "SCR",
    name: "Seychellois Rupee",
    symbol: "₨",
    decimalDigits: 2,
  },
  MGA: { code: "MGA", name: "Malagasy Ariary", symbol: "Ar", decimalDigits: 2 },
  MZN: {
    code: "MZN",
    name: "Mozambican Metical",
    symbol: "MT",
    decimalDigits: 2,
  },
  ZMW: { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", decimalDigits: 2 },
  BWP: { code: "BWP", name: "Botswana Pula", symbol: "P", decimalDigits: 2 },
  NAD: { code: "NAD", name: "Namibian Dollar", symbol: "N$", decimalDigits: 2 },
  AOA: { code: "AOA", name: "Angolan Kwanza", symbol: "Kz", decimalDigits: 2 },
  CDF: { code: "CDF", name: "Congolese Franc", symbol: "FC", decimalDigits: 2 },

  // Americas Currencies
  BRL: { code: "BRL", name: "Brazilian Real", symbol: "R$", decimalDigits: 2 },
  MXN: { code: "MXN", name: "Mexican Peso", symbol: "$", decimalDigits: 2 },
  ARS: { code: "ARS", name: "Argentine Peso", symbol: "$", decimalDigits: 2 },
  CLP: { code: "CLP", name: "Chilean Peso", symbol: "$", decimalDigits: 0 },
  COP: { code: "COP", name: "Colombian Peso", symbol: "$", decimalDigits: 2 },
  PEN: { code: "PEN", name: "Peruvian Sol", symbol: "S/", decimalDigits: 2 },
  UYU: { code: "UYU", name: "Uruguayan Peso", symbol: "$U", decimalDigits: 2 },
  PYG: {
    code: "PYG",
    name: "Paraguayan Guarani",
    symbol: "₲",
    decimalDigits: 0,
  },
  BOB: {
    code: "BOB",
    name: "Bolivian Boliviano",
    symbol: "Bs.",
    decimalDigits: 2,
  },
  VES: {
    code: "VES",
    name: "Venezuelan Bolívar",
    symbol: "Bs.S",
    decimalDigits: 2,
  },
  CRC: {
    code: "CRC",
    name: "Costa Rican Colón",
    symbol: "₡",
    decimalDigits: 2,
  },
  PAB: {
    code: "PAB",
    name: "Panamanian Balboa",
    symbol: "B/.",
    decimalDigits: 2,
  },
  GTQ: {
    code: "GTQ",
    name: "Guatemalan Quetzal",
    symbol: "Q",
    decimalDigits: 2,
  },
  HNL: { code: "HNL", name: "Honduran Lempira", symbol: "L", decimalDigits: 2 },
  NIO: {
    code: "NIO",
    name: "Nicaraguan Córdoba",
    symbol: "C$",
    decimalDigits: 2,
  },
  SVC: { code: "SVC", name: "Salvadoran Colón", symbol: "₡", decimalDigits: 2 },
  DOP: { code: "DOP", name: "Dominican Peso", symbol: "RD$", decimalDigits: 2 },
  CUP: { code: "CUP", name: "Cuban Peso", symbol: "₱", decimalDigits: 2 },
  HTG: { code: "HTG", name: "Haitian Gourde", symbol: "G", decimalDigits: 2 },
  JMD: { code: "JMD", name: "Jamaican Dollar", symbol: "J$", decimalDigits: 2 },
  TTD: {
    code: "TTD",
    name: "Trinidad & Tobago Dollar",
    symbol: "TT$",
    decimalDigits: 2,
  },
  BBD: {
    code: "BBD",
    name: "Barbadian Dollar",
    symbol: "Bds$",
    decimalDigits: 2,
  },
  BSD: { code: "BSD", name: "Bahamian Dollar", symbol: "B$", decimalDigits: 2 },
  BZD: { code: "BZD", name: "Belize Dollar", symbol: "BZ$", decimalDigits: 2 },
  GYD: { code: "GYD", name: "Guyanese Dollar", symbol: "G$", decimalDigits: 2 },
  SRD: {
    code: "SRD",
    name: "Surinamese Dollar",
    symbol: "$",
    decimalDigits: 2,
  },
  XCD: {
    code: "XCD",
    name: "East Caribbean Dollar",
    symbol: "EC$",
    decimalDigits: 2,
  },
  AWG: { code: "AWG", name: "Aruban Florin", symbol: "ƒ", decimalDigits: 2 },
  ANG: {
    code: "ANG",
    name: "Netherlands Antillean Guilder",
    symbol: "ƒ",
    decimalDigits: 2,
  },
  KYD: {
    code: "KYD",
    name: "Cayman Islands Dollar",
    symbol: "CI$",
    decimalDigits: 2,
  },
  BMD: { code: "BMD", name: "Bermudian Dollar", symbol: "$", decimalDigits: 2 },

  // Oceania Currencies
  FJD: { code: "FJD", name: "Fijian Dollar", symbol: "FJ$", decimalDigits: 2 },
  PGK: {
    code: "PGK",
    name: "Papua New Guinean Kina",
    symbol: "K",
    decimalDigits: 2,
  },
  SBD: {
    code: "SBD",
    name: "Solomon Islands Dollar",
    symbol: "SI$",
    decimalDigits: 2,
  },
  VUV: { code: "VUV", name: "Vanuatu Vatu", symbol: "VT", decimalDigits: 0 },
  WST: { code: "WST", name: "Samoan Tala", symbol: "WS$", decimalDigits: 2 },
  TOP: { code: "TOP", name: "Tongan Paʻanga", symbol: "T$", decimalDigits: 2 },
  XPF: { code: "XPF", name: "CFP Franc", symbol: "₣", decimalDigits: 0 },

  // Crypto
  BTC: { code: "BTC", name: "Bitcoin", symbol: "₿", decimalDigits: 8 },
  ETH: { code: "ETH", name: "Ethereum", symbol: "Ξ", decimalDigits: 8 },
};

/**
 * Get all currencies as array for dropdowns
 */
export const getCurrencyOptions = (): Array<{
  value: string;
  label: string;
}> => {
  return Object.values(CURRENCIES).map((currency) => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name} (${currency.symbol})`,
  }));
};

/**
 * Get popular currencies (for quick selection)
 */
export const POPULAR_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "CAD",
  "AUD",
  "CHF",
  "INR",
  "NPR",
];

export const getPopularCurrencyOptions = (): Array<{
  value: string;
  label: string;
}> => {
  return POPULAR_CURRENCIES.filter((code) => CURRENCIES[code]).map((code) => ({
    value: code,
    label: `${code} - ${CURRENCIES[code].name} (${CURRENCIES[code].symbol})`,
  }));
};

/**
 * Get currency by code
 */
export const getCurrency = (code: string): Currency | undefined => {
  return CURRENCIES[code.toUpperCase()];
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (code: string): string => {
  return CURRENCIES[code.toUpperCase()]?.symbol || code;
};

/**
 * Format amount with currency
 */
export const formatCurrency = (
  amount: number,
  code: string = "USD",
  showCode: boolean = false,
): string => {
  const currency = CURRENCIES[code.toUpperCase()];
  if (!currency) {
    return `${amount.toFixed(2)} ${code}`;
  }

  const formatted = amount.toFixed(currency.decimalDigits);
  const result = `${currency.symbol}${formatted}`;

  return showCode ? `${result} ${code}` : result;
};
