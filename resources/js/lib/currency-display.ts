/**
 * Central currency symbol placement for Yatra admin + public UIs.
 *
 * Settings → Currency uses: left, right, left_space, right_space.
 * Legacy stored values: before, after (mapped for backward compatibility).
 */

import { __ } from "./i18n";
import { getCurrency, getCurrencySymbol } from "../data/currencies";

export type CurrencyPlacement = "left" | "right" | "left_space" | "right_space";

/**
 * Normalize option / legacy values to one of the four placement modes.
 */
export function normalizeCurrencyPosition(
  raw: string | undefined | null,
): CurrencyPlacement {
  const p = (raw ?? "before").toString().toLowerCase().trim();
  if (p === "before") {
    return "left_space";
  }
  if (p === "after") {
    return "right_space";
  }
  if (
    p === "right" ||
    p === "right_space" ||
    p === "left" ||
    p === "left_space"
  ) {
    return p as CurrencyPlacement;
  }
  return "left_space";
}

/**
 * Join a pre-formatted numeric string with the currency symbol per placement.
 */
export function applyCurrencyPosition(
  formattedAmount: string,
  currencySymbol: string,
  rawPosition?: string | null,
): string {
  const mode = normalizeCurrencyPosition(rawPosition);
  switch (mode) {
    case "right":
      return `${formattedAmount}${currencySymbol}`;
    case "right_space":
      return `${formattedAmount} ${currencySymbol}`;
    case "left":
      return `${currencySymbol}${formattedAmount}`;
    case "left_space":
    default:
      return `${currencySymbol} ${formattedAmount}`;
  }
}

type AdminWindow = Window & {
  yatraAdmin?: Record<string, unknown>;
  yatraBookingData?: Record<string, unknown>;
  yatraTripData?: Record<string, unknown>;
  yatraAccountPage?: Record<string, unknown>;
};

/**
 * Read raw currency position from localized globals (camelCase or snake_case).
 */
export function readYatraCurrencyPositionFromWindow(): string {
  if (typeof window === "undefined") {
    return "before";
  }
  const w = window as AdminWindow;
  const pick = (o: Record<string, unknown> | undefined): string | undefined => {
    if (!o) {
      return undefined;
    }
    const a = o.currencyPosition;
    const b = o.currency_position;
    if (typeof a === "string" && a !== "") {
      return a;
    }
    if (typeof b === "string" && b !== "") {
      return b;
    }
    return undefined;
  };

  return (
    pick(w.yatraAdmin as Record<string, unknown> | undefined) ??
    pick(w.yatraBookingData as Record<string, unknown> | undefined) ??
    pick(w.yatraTripData as Record<string, unknown> | undefined) ??
    pick(w.yatraAccountPage as Record<string, unknown> | undefined) ??
    "before"
  );
}

function readAdminNumberFormatConfig(): {
  decimalPlaces: number;
  thousandSeparator: string;
  decimalSeparator: string;
} {
  if (typeof window === "undefined") {
    return { decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." };
  }
  const a = ((window as AdminWindow).yatraAdmin || {}) as Record<
    string,
    unknown
  >;
  const decimals = Number(a.decimalPlaces ?? a.currency_decimals ?? 2) || 2;
  return {
    decimalPlaces: Math.max(0, Math.min(4, decimals)),
    thousandSeparator:
      typeof a.thousandSeparator === "string" && a.thousandSeparator !== ""
        ? (a.thousandSeparator as string)
        : ",",
    decimalSeparator:
      typeof a.decimalSeparator === "string" && a.decimalSeparator !== ""
        ? (a.decimalSeparator as string)
        : ".",
  };
}

/**
 * Format a numeric amount using Yatra currency + separator settings and symbol placement.
 *
 * @param zeroAsUnknown When true, zero/empty shows “Contact for pricing” (trip/marketing UIs).
 */
export function formatYatraMoney(
  amount: number,
  currencyCode: string,
  options?: { zeroAsUnknown?: boolean },
): string {
  const zeroAsUnknown = options?.zeroAsUnknown === true;
  const num = Number(amount) || 0;
  if (zeroAsUnknown && num === 0) {
    return __("Contact for pricing", "yatra");
  }

  const { decimalPlaces, thousandSeparator, decimalSeparator } =
    readAdminNumberFormatConfig();
  const currencyData = getCurrency(currencyCode);
  const decimals =
    currencyData?.decimalDigits !== undefined
      ? Math.max(0, Math.min(4, currencyData.decimalDigits))
      : decimalPlaces;

  const formattedCore = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
    .format(num)
    .replace(/,/g, "TEMP_THOUSAND")
    .replace(/\./g, "TEMP_DECIMAL")
    .replace(/TEMP_THOUSAND/g, thousandSeparator)
    .replace(/TEMP_DECIMAL/g, decimalSeparator);

  const symbol = getCurrencySymbol(currencyCode);
  const position = readYatraCurrencyPositionFromWindow();

  return applyCurrencyPosition(formattedCore, symbol, position);
}
