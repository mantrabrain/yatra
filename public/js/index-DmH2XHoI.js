var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { r as reactExports, j as jsxRuntimeExports, X, I as Info, J as AlertTriangle, a1 as AlertCircle, aq as CheckCircle2 } from "./react-vendor-iXoRXq_s.js";
const __ = (key, defaultValue = "") => {
  var _a;
  const translations = ((_a = window.yatraAdmin) == null ? void 0 : _a.translations) || {};
  return translations[key] || defaultValue || key;
};
const ToastContext = reactExports.createContext(void 0);
const useToast = () => {
  const context = reactExports.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = reactExports.useState([]);
  const showToast = reactExports.useCallback((message, type = "success", duration = 4e3) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);
  const removeToast = reactExports.useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ToastContext.Provider, { value: { showToast, removeToast }, children: [
    children,
    /* @__PURE__ */ jsxRuntimeExports.jsx(ToastContainer, { toasts, onRemove: removeToast })
  ] });
};
const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none", children: toasts.map((toast) => /* @__PURE__ */ jsxRuntimeExports.jsx(ToastItem, { toast, onRemove }, toast.id)) });
};
const ToastItem = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);
  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "w-5 h-5 text-green-600" });
      case "error":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-5 h-5 text-red-600" });
      case "warning":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "w-5 h-5 text-yellow-600" });
      case "info":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-5 h-5 text-blue-600" });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-5 h-5 text-gray-600" });
    }
  };
  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400";
      case "error":
        return "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-400";
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `
        pointer-events-auto
        flex items-start gap-3
        p-4 rounded-lg border
        shadow-lg backdrop-blur-sm
        min-w-[320px] max-w-[400px]
        transition-all duration-300 ease-out
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        ${getStyles()}
      `,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 mt-0.5", children: getIcon() }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 text-sm font-medium", children: toast.message }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleRemove,
            className: "flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors",
            "aria-label": __("Close", "Close"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
          }
        )
      ]
    }
  );
};
class ApiClient {
  constructor() {
    __publicField(this, "baseUrl");
    __publicField(this, "nonce");
    var _a, _b;
    const rawUrl = ((_a = window.yatraAdmin) == null ? void 0 : _a.apiUrl) || "/wp-json/yatra/v1";
    this.baseUrl = rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
    this.nonce = ((_b = window.yatraAdmin) == null ? void 0 : _b.nonce) || "";
  }
  async request(endpoint, options = {}, queryParams) {
    const [endpointPath, endpointQuery] = endpoint.split("?");
    const cleanEndpoint = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
    let url;
    if (this.baseUrl.includes("?rest_route=")) {
      const [base, queryString] = this.baseUrl.split("?");
      const params = new URLSearchParams(queryString);
      const restRoute = params.get("rest_route") || "";
      params.set("rest_route", restRoute + cleanEndpoint);
      if (endpointQuery) {
        const endpointParams = new URLSearchParams(endpointQuery);
        endpointParams.forEach((value, key) => {
          params.append(key, value);
        });
      }
      if (queryParams) {
        queryParams.forEach((value, key) => {
          params.append(key, value);
        });
      }
      url = `${base}?${params.toString()}`;
    } else {
      url = `${this.baseUrl}${cleanEndpoint}`;
      if (endpointQuery || queryParams) {
        const params = new URLSearchParams();
        if (endpointQuery) {
          const endpointParams = new URLSearchParams(endpointQuery);
          endpointParams.forEach((value, key) => {
            params.append(key, value);
          });
        }
        if (queryParams) {
          queryParams.forEach((value, key) => {
            params.append(key, value);
          });
        }
        url += `?${params.toString()}`;
      }
    }
    const headers = {
      "Content-Type": "application/json",
      "X-WP-Nonce": this.nonce,
      ...options.headers
    };
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include"
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "An error occurred" }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
  async get(endpoint, config) {
    let queryParams;
    if (config == null ? void 0 : config.params) {
      queryParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== void 0 && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return this.request(endpoint, {
      method: "GET"
    }, queryParams);
  }
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }
  async delete(endpoint, config) {
    return this.request(endpoint, {
      method: "DELETE",
      body: (config == null ? void 0 : config.data) ? JSON.stringify(config.data) : void 0
    });
  }
}
const apiClient = new ApiClient();
const CURRENCIES = {
  // Major Currencies
  USD: { code: "USD", name: "US Dollar", symbol: "$", decimalDigits: 2 },
  EUR: { code: "EUR", name: "Euro", symbol: "€", decimalDigits: 2 },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", decimalDigits: 2 },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥", decimalDigits: 0 },
  CNY: { code: "CNY", name: "Chinese Yuan", symbol: "¥", decimalDigits: 2 },
  CHF: { code: "CHF", name: "Swiss Franc", symbol: "CHF", decimalDigits: 2 },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "C$", decimalDigits: 2 },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "A$", decimalDigits: 2 },
  NZD: { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", decimalDigits: 2 },
  // Asian Currencies
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", decimalDigits: 2 },
  NPR: { code: "NPR", name: "Nepalese Rupee", symbol: "Rs", decimalDigits: 2 },
  PKR: { code: "PKR", name: "Pakistani Rupee", symbol: "₨", decimalDigits: 2 },
  BDT: { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", decimalDigits: 2 },
  LKR: { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs", decimalDigits: 2 },
  MMK: { code: "MMK", name: "Myanmar Kyat", symbol: "K", decimalDigits: 2 },
  THB: { code: "THB", name: "Thai Baht", symbol: "฿", decimalDigits: 2 },
  VND: { code: "VND", name: "Vietnamese Dong", symbol: "₫", decimalDigits: 0 },
  IDR: { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", decimalDigits: 2 },
  MYR: { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", decimalDigits: 2 },
  SGD: { code: "SGD", name: "Singapore Dollar", symbol: "S$", decimalDigits: 2 },
  PHP: { code: "PHP", name: "Philippine Peso", symbol: "₱", decimalDigits: 2 },
  KRW: { code: "KRW", name: "South Korean Won", symbol: "₩", decimalDigits: 0 },
  TWD: { code: "TWD", name: "Taiwan Dollar", symbol: "NT$", decimalDigits: 2 },
  HKD: { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", decimalDigits: 2 },
  MOP: { code: "MOP", name: "Macanese Pataca", symbol: "MOP$", decimalDigits: 2 },
  KHR: { code: "KHR", name: "Cambodian Riel", symbol: "៛", decimalDigits: 2 },
  LAK: { code: "LAK", name: "Lao Kip", symbol: "₭", decimalDigits: 2 },
  BND: { code: "BND", name: "Brunei Dollar", symbol: "B$", decimalDigits: 2 },
  MNT: { code: "MNT", name: "Mongolian Tugrik", symbol: "₮", decimalDigits: 2 },
  KZT: { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸", decimalDigits: 2 },
  UZS: { code: "UZS", name: "Uzbekistani Som", symbol: "сўм", decimalDigits: 2 },
  KGS: { code: "KGS", name: "Kyrgyzstani Som", symbol: "сом", decimalDigits: 2 },
  TJS: { code: "TJS", name: "Tajikistani Somoni", symbol: "ЅМ", decimalDigits: 2 },
  TMT: { code: "TMT", name: "Turkmenistani Manat", symbol: "m", decimalDigits: 2 },
  AFN: { code: "AFN", name: "Afghan Afghani", symbol: "؋", decimalDigits: 2 },
  // Middle Eastern Currencies
  AED: { code: "AED", name: "UAE Dirham", symbol: "د.إ", decimalDigits: 2 },
  SAR: { code: "SAR", name: "Saudi Riyal", symbol: "﷼", decimalDigits: 2 },
  QAR: { code: "QAR", name: "Qatari Riyal", symbol: "﷼", decimalDigits: 2 },
  KWD: { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", decimalDigits: 3 },
  BHD: { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب", decimalDigits: 3 },
  OMR: { code: "OMR", name: "Omani Rial", symbol: "﷼", decimalDigits: 3 },
  JOD: { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا", decimalDigits: 3 },
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
  HUF: { code: "HUF", name: "Hungarian Forint", symbol: "Ft", decimalDigits: 2 },
  RON: { code: "RON", name: "Romanian Leu", symbol: "lei", decimalDigits: 2 },
  BGN: { code: "BGN", name: "Bulgarian Lev", symbol: "лв", decimalDigits: 2 },
  HRK: { code: "HRK", name: "Croatian Kuna", symbol: "kn", decimalDigits: 2 },
  RSD: { code: "RSD", name: "Serbian Dinar", symbol: "дин.", decimalDigits: 2 },
  MKD: { code: "MKD", name: "Macedonian Denar", symbol: "ден", decimalDigits: 2 },
  BAM: { code: "BAM", name: "Bosnia-Herzegovina Mark", symbol: "KM", decimalDigits: 2 },
  ALL: { code: "ALL", name: "Albanian Lek", symbol: "L", decimalDigits: 2 },
  MDL: { code: "MDL", name: "Moldovan Leu", symbol: "L", decimalDigits: 2 },
  UAH: { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", decimalDigits: 2 },
  BYN: { code: "BYN", name: "Belarusian Ruble", symbol: "Br", decimalDigits: 2 },
  RUB: { code: "RUB", name: "Russian Ruble", symbol: "₽", decimalDigits: 2 },
  GEL: { code: "GEL", name: "Georgian Lari", symbol: "₾", decimalDigits: 2 },
  AMD: { code: "AMD", name: "Armenian Dram", symbol: "֏", decimalDigits: 2 },
  AZN: { code: "AZN", name: "Azerbaijani Manat", symbol: "₼", decimalDigits: 2 },
  // African Currencies
  ZAR: { code: "ZAR", name: "South African Rand", symbol: "R", decimalDigits: 2 },
  NGN: { code: "NGN", name: "Nigerian Naira", symbol: "₦", decimalDigits: 2 },
  KES: { code: "KES", name: "Kenyan Shilling", symbol: "KSh", decimalDigits: 2 },
  GHS: { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", decimalDigits: 2 },
  TZS: { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", decimalDigits: 2 },
  UGX: { code: "UGX", name: "Ugandan Shilling", symbol: "USh", decimalDigits: 0 },
  RWF: { code: "RWF", name: "Rwandan Franc", symbol: "FRw", decimalDigits: 0 },
  ETB: { code: "ETB", name: "Ethiopian Birr", symbol: "Br", decimalDigits: 2 },
  MAD: { code: "MAD", name: "Moroccan Dirham", symbol: "د.م.", decimalDigits: 2 },
  TND: { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", decimalDigits: 3 },
  DZD: { code: "DZD", name: "Algerian Dinar", symbol: "د.ج", decimalDigits: 2 },
  LYD: { code: "LYD", name: "Libyan Dinar", symbol: "ل.د", decimalDigits: 3 },
  SDG: { code: "SDG", name: "Sudanese Pound", symbol: "ج.س.", decimalDigits: 2 },
  XOF: { code: "XOF", name: "West African CFA Franc", symbol: "CFA", decimalDigits: 0 },
  XAF: { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", decimalDigits: 0 },
  MUR: { code: "MUR", name: "Mauritian Rupee", symbol: "₨", decimalDigits: 2 },
  SCR: { code: "SCR", name: "Seychellois Rupee", symbol: "₨", decimalDigits: 2 },
  MGA: { code: "MGA", name: "Malagasy Ariary", symbol: "Ar", decimalDigits: 2 },
  MZN: { code: "MZN", name: "Mozambican Metical", symbol: "MT", decimalDigits: 2 },
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
  PYG: { code: "PYG", name: "Paraguayan Guarani", symbol: "₲", decimalDigits: 0 },
  BOB: { code: "BOB", name: "Bolivian Boliviano", symbol: "Bs.", decimalDigits: 2 },
  VES: { code: "VES", name: "Venezuelan Bolívar", symbol: "Bs.S", decimalDigits: 2 },
  CRC: { code: "CRC", name: "Costa Rican Colón", symbol: "₡", decimalDigits: 2 },
  PAB: { code: "PAB", name: "Panamanian Balboa", symbol: "B/.", decimalDigits: 2 },
  GTQ: { code: "GTQ", name: "Guatemalan Quetzal", symbol: "Q", decimalDigits: 2 },
  HNL: { code: "HNL", name: "Honduran Lempira", symbol: "L", decimalDigits: 2 },
  NIO: { code: "NIO", name: "Nicaraguan Córdoba", symbol: "C$", decimalDigits: 2 },
  SVC: { code: "SVC", name: "Salvadoran Colón", symbol: "₡", decimalDigits: 2 },
  DOP: { code: "DOP", name: "Dominican Peso", symbol: "RD$", decimalDigits: 2 },
  CUP: { code: "CUP", name: "Cuban Peso", symbol: "₱", decimalDigits: 2 },
  HTG: { code: "HTG", name: "Haitian Gourde", symbol: "G", decimalDigits: 2 },
  JMD: { code: "JMD", name: "Jamaican Dollar", symbol: "J$", decimalDigits: 2 },
  TTD: { code: "TTD", name: "Trinidad & Tobago Dollar", symbol: "TT$", decimalDigits: 2 },
  BBD: { code: "BBD", name: "Barbadian Dollar", symbol: "Bds$", decimalDigits: 2 },
  BSD: { code: "BSD", name: "Bahamian Dollar", symbol: "B$", decimalDigits: 2 },
  BZD: { code: "BZD", name: "Belize Dollar", symbol: "BZ$", decimalDigits: 2 },
  GYD: { code: "GYD", name: "Guyanese Dollar", symbol: "G$", decimalDigits: 2 },
  SRD: { code: "SRD", name: "Surinamese Dollar", symbol: "$", decimalDigits: 2 },
  XCD: { code: "XCD", name: "East Caribbean Dollar", symbol: "EC$", decimalDigits: 2 },
  AWG: { code: "AWG", name: "Aruban Florin", symbol: "ƒ", decimalDigits: 2 },
  ANG: { code: "ANG", name: "Netherlands Antillean Guilder", symbol: "ƒ", decimalDigits: 2 },
  KYD: { code: "KYD", name: "Cayman Islands Dollar", symbol: "CI$", decimalDigits: 2 },
  BMD: { code: "BMD", name: "Bermudian Dollar", symbol: "$", decimalDigits: 2 },
  // Oceania Currencies
  FJD: { code: "FJD", name: "Fijian Dollar", symbol: "FJ$", decimalDigits: 2 },
  PGK: { code: "PGK", name: "Papua New Guinean Kina", symbol: "K", decimalDigits: 2 },
  SBD: { code: "SBD", name: "Solomon Islands Dollar", symbol: "SI$", decimalDigits: 2 },
  VUV: { code: "VUV", name: "Vanuatu Vatu", symbol: "VT", decimalDigits: 0 },
  WST: { code: "WST", name: "Samoan Tala", symbol: "WS$", decimalDigits: 2 },
  TOP: { code: "TOP", name: "Tongan Paʻanga", symbol: "T$", decimalDigits: 2 },
  XPF: { code: "XPF", name: "CFP Franc", symbol: "₣", decimalDigits: 0 },
  // Crypto
  BTC: { code: "BTC", name: "Bitcoin", symbol: "₿", decimalDigits: 8 },
  ETH: { code: "ETH", name: "Ethereum", symbol: "Ξ", decimalDigits: 8 }
};
const getCurrencyOptions = () => {
  return Object.values(CURRENCIES).map((currency) => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name} (${currency.symbol})`
  }));
};
const getCurrency = (code) => {
  return CURRENCIES[code.toUpperCase()];
};
const getCurrencySymbol = (code) => {
  var _a;
  return ((_a = CURRENCIES[code.toUpperCase()]) == null ? void 0 : _a.symbol) || code;
};
export {
  ToastProvider as T,
  __ as _,
  apiClient as a,
  getCurrency as b,
  getCurrencyOptions as c,
  getCurrencySymbol as g,
  useToast as u
};
//# sourceMappingURL=index-DmH2XHoI.js.map
