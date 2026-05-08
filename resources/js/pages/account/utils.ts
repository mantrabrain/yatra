import { __, sprintf } from "../../lib/i18n";
import {
  applyCurrencyPosition,
  formatYatraMoney,
} from "../../lib/currency-display";

function toBrowserLocaleTag(locale: string | undefined | null): string | undefined {
  const raw = String(locale || "").trim();
  if (!raw) return undefined;
  // WP locales are often like "en_US"; Intl expects BCP47 like "en-US".
  return raw.replace(/_/g, "-");
}

function getAccountLocale(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = (window as unknown as { yatraAccountPage?: { locale?: string } })
    .yatraAccountPage?.locale;
  return toBrowserLocaleTag(raw);
}

export const formatDate = (value: string | undefined | null) => {
  if (!value) {
    return __("N/A", "yatra");
  }

  try {
    const date = new Date(value);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return __("Invalid date", "yatra");
    }

    return date.toLocaleDateString(getAccountLocale(), {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    return __("Invalid date", "yatra");
  }
};

/** Leading Y-m-d from API datetime strings for stable range comparison. */
function extractYmd(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }
  const m = String(value)
    .trim()
    .match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/**
 * Format trip window for the account UI: one localized date, or start–end when different.
 * translators: %1$s: trip start date, %2$s: trip end date (localized).
 */
export const formatTravelDateRange = (
  travelDate?: string | null,
  endDate?: string | null,
): string => {
  const startKey = extractYmd(travelDate);
  const endKey = extractYmd(endDate);
  if (!startKey) {
    return formatDate(travelDate);
  }
  if (!endKey || endKey === startKey) {
    return formatDate(travelDate);
  }
  return sprintf(
    __("%1$s – %2$s", "yatra"),
    formatDate(travelDate),
    formatDate(endDate),
  );
};

export const getBadge = (status: string | undefined | null) => {
  const base = "px-2.5 py-0.5 rounded-full text-xs font-medium";

  // Handle undefined/null/empty status
  if (!status || typeof status !== "string") {
    return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`;
  }

  switch (status.toLowerCase()) {
    case "paid":
    case "confirmed":
    case "resolved":
      return `${base} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`;
    case "pending":
    case "partial":
    case "awaiting_response":
      return `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`;
    case "failed":
    case "cancelled":
      return `${base} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`;
    default:
      return `${base} bg-yatra-chip-bg text-yatra-primary-darker dark:bg-yatra-surface-dark dark:text-yatra-primary-light`;
  }
};

type PriceConfigWindow = Window & {
  yatraAdmin?: Record<string, unknown>;
  yatraAccountPage?: Record<string, unknown>;
};

function readPriceConfig() {
  if (typeof window === "undefined") {
    return {
      globalCurrency: "USD",
      currencyPosition: "before",
      decimalPlaces: 2,
      thousandSeparator: ",",
      decimalSeparator: ".",
    };
  }
  const w = window as PriceConfigWindow;
  const a = (w.yatraAdmin || {}) as Record<string, unknown>;
  const p = (w.yatraAccountPage || {}) as Record<string, unknown>;
  return {
    globalCurrency: (a.currency || p.currency || "USD") as string,
    currencyPosition: (a.currencyPosition ||
      a.currency_position ||
      p.currencyPosition ||
      p.currency_position ||
      "before") as string,
    decimalPlaces: Number(a.decimalPlaces ?? p.decimalPlaces ?? 2) || 2,
    thousandSeparator: (a.thousandSeparator ||
      p.thousandSeparator ||
      ",") as string,
    decimalSeparator: (a.decimalSeparator ||
      p.decimalSeparator ||
      ".") as string,
  };
}

export const formatPrice = (price: number) => {
  const {
    globalCurrency,
    currencyPosition,
    decimalPlaces,
    thousandSeparator,
    decimalSeparator,
  } = readPriceConfig();

  if (!price || price === 0) {
    return __("Contact for pricing", "yatra");
  }

  const formattedAmount = new Intl.NumberFormat(getAccountLocale(), {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })
    .format(price)
    .replace(/,/g, "TEMP_THOUSAND")
    .replace(/\./g, decimalSeparator)
    .replace(/TEMP_THOUSAND/g, thousandSeparator);

  const currencySymbol = new Intl.NumberFormat(getAccountLocale(), {
    style: "currency",
    currency: globalCurrency,
  })
    .format(0)
    .replace(/[\d\s.,]/g, "")
    .trim();

  return applyCurrencyPosition(
    formattedAmount,
    currencySymbol,
    currencyPosition,
  );
};

export const formatPriceForBooking = (price: number, currency?: string) => {
  const cfg = readPriceConfig();
  const globalCurrency = currency || cfg.globalCurrency;
  const {
    currencyPosition,
    decimalPlaces,
    thousandSeparator,
    decimalSeparator,
  } = cfg;

  const currencyToUse = globalCurrency;

  // Always format the price, even if 0 - don't show "Contact for pricing" for bookings
  const numPrice = Number(price) || 0;

  const formattedAmount = new Intl.NumberFormat(getAccountLocale(), {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })
    .format(numPrice)
    .replace(/,/g, "TEMP_THOUSAND")
    .replace(/\./g, decimalSeparator)
    .replace(/TEMP_THOUSAND/g, thousandSeparator);

  const currencySymbol = new Intl.NumberFormat(getAccountLocale(), {
    style: "currency",
    currency: currencyToUse,
  })
    .format(0)
    .replace(/[\d\s.,]/g, "")
    .trim();

  return applyCurrencyPosition(
    formattedAmount,
    currencySymbol,
    currencyPosition,
  );
};

export const currency = (value: number, currencyCode?: string) => {
  const cfg = readPriceConfig();
  const code = (currencyCode || cfg.globalCurrency || "USD") as string;
  return formatYatraMoney(Number(value) || 0, code, { zeroAsUnknown: false });
};

/** Values from `wp_localize_script(…, 'yatraAccountPage', …)` on the account page. */
export function getYatraAccountPageGlobals(): {
  logoutUrl: string;
  companyPhone: string;
  companyName: string;
  companyEmail: string;
  locale: string;
} {
  if (typeof window === "undefined") {
    return {
      logoutUrl: "",
      companyPhone: "",
      companyName: "",
      companyEmail: "",
      locale: "",
    };
  }
  const p = (window as unknown as { yatraAccountPage?: Record<string, string> })
    .yatraAccountPage;
  const raw = p || {};
  return {
    logoutUrl: String(raw.logoutUrl || "").trim(),
    companyPhone: String(raw.companyPhone || "").trim(),
    companyName: String(raw.companyName || "").trim(),
    companyEmail: String(raw.companyEmail || "").trim(),
    locale: String((raw as any).locale || "").trim(),
  };
}

export function phoneToTelHref(phone: string): string {
  const t = String(phone).trim();
  if (!t) {
    return "";
  }
  const compact = t.replace(/[^\d+]/g, "");
  return compact ? `tel:${compact}` : `tel:${encodeURIComponent(t)}`;
}
