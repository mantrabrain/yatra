/**
 * Phone helpers for admin displays. Reads the localized `window.yatraPhoneData`
 * (countries + dial-code priority + flag base URL) to turn a stored
 * "+<code><number>" value into a flag + readable number. Mirrors the server-side
 * FormatHelper detection so front and back agree.
 *
 * A value with no leading "+" (a legacy national-only number) is returned as-is
 * with no flag — never reinterpreted.
 */

export interface PhoneCountry {
  iso: string;
  name: string;
  dial: string;
}

interface PhoneData {
  countries?: PhoneCountry[];
  priority?: Record<string, string>;
  flagBase?: string;
}

function phoneData(): PhoneData {
  return (
    (window as unknown as { yatraPhoneData?: PhoneData }).yatraPhoneData || {}
  );
}

export interface DetectedPhone {
  iso: string;
  dial: string;
  national: string;
}

/** Detect country from a value beginning with "+". Longest-prefix match, then priority tiebreak. */
export function detectPhoneCountry(raw: string): DetectedPhone | null {
  raw = (raw || "").trim();
  if (!raw || raw.charAt(0) !== "+") return null;
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return null;
  const countries = phoneData().countries || [];
  const priority = phoneData().priority || {};
  for (let len = Math.min(4, digits.length); len >= 1; len--) {
    const prefix = digits.slice(0, len);
    const matches = countries.filter((c) => c.dial === prefix);
    if (matches.length) {
      const iso = priority[prefix] || matches[0].iso;
      return { iso, dial: prefix, national: digits.slice(len) };
    }
  }
  return null;
}

/** URL of a country's flag SVG, or "" if the flag base isn't localized. */
export function flagUrl(iso: string): string {
  const base = phoneData().flagBase || "";
  return base ? `${base}${String(iso).toLowerCase()}.svg` : "";
}

/** Human-readable form: "+977 9806015400" for international, unchanged for legacy. */
export function formatPhone(raw: string): string {
  const d = detectPhoneCountry(raw);
  if (!d) return raw;
  return `+${d.dial}${d.national ? " " + d.national : ""}`;
}
