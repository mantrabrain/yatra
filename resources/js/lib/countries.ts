/**
 * Country data — single source of truth on the client.
 *
 * The canonical list lives in PHP at `Yatra\Helpers\FormatHelper::getCountries()`
 * (full ISO-3166-1 alpha-2 + commonly-accepted territories). The backend
 * localizes it into `window.yatraAdmin.countries` on every admin page
 * load, so this module's job is just to:
 *
 *   1. Read from that localized payload (zero network round-trip)
 *   2. Offer the two shapes the React code happens to want — a
 *      `{code => name}` map (what the canonical PHP returns) and an
 *      `Array<{code, name}>` (what dropdown components prefer)
 *   3. Provide a tiny code→name lookup helper for badge/label render
 *
 * If the localized payload is missing (very early bootstrap, tests,
 * etc.) we fall back to a minimal hardcoded set so the UI doesn't
 * crash. That fallback is intentionally tiny — production should
 * always hit the real localized list.
 *
 * Operators that want a custom order / curated subset apply the
 * `yatra_countries_list` PHP filter once; the change propagates here
 * automatically on the next page load.
 */

export type CountryMap = Record<string, string>;
export interface CountryOption {
  code: string;
  name: string;
}

const FALLBACK_COUNTRIES: CountryMap = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  IN: "India",
  NP: "Nepal",
};

/**
 * Return the canonical `{CODE: 'Name'}` map. Reads from the localized
 * payload first; falls back to the minimal set when missing.
 */
export function getCountryMap(): CountryMap {
  // Admin app localizes onto `yatraAdmin`; the front-end account page localizes
  // onto `yatraAccountPage`. Read whichever is present so the same helper works
  // in both contexts (otherwise the account page silently fell back to a tiny
  // 6-country list and rendered ISO codes like "BH" instead of "Bahrain").
  const w = window as any;
  const sources = [w?.yatraAdmin?.countries, w?.yatraAccountPage?.countries];
  for (const raw of sources) {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const map = raw as CountryMap;
      // Guard against an accidentally-empty object from the server.
      if (Object.keys(map).length > 0) return map;
    }
  }
  return FALLBACK_COUNTRIES;
}

/**
 * Return countries as an array of `{code, name}` — the shape dropdown
 * components and `<Select>` inputs typically want.
 *
 * The PHP source already returns alphabetically sorted by name, so we
 * preserve insertion order. (Object.entries respects insertion order
 * for string keys per ES2015.)
 */
export function getCountryOptions(): CountryOption[] {
  const map = getCountryMap();
  return Object.entries(map).map(([code, name]) => ({ code, name }));
}

/**
 * Look up a single country's display name by ISO-3166 code.
 * Returns the code itself when unknown — same fallback the PHP
 * helper uses, so the two never disagree on rendering.
 */
export function getCountryName(code: string): string {
  if (!code) return "";
  const map = getCountryMap();
  return map[code.toUpperCase()] ?? code;
}
