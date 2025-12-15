/**
 * Internationalization (i18n) utility
 * Handles translations for UI text
 */

declare global {
  interface Window {
    yatraAdmin?: {
      apiUrl?: string;
      nonce?: string;
      currentUser?: number;
      siteUrl?: string;
      permissions?: string[];
      roles?: string[];
      capabilities?: Record<string, boolean>;
      isPro?: boolean;
      version?: string;
      proVersion?: string | null;
      translations?: Record<string, string>;
      locale?: string;
    };
  }
}

/**
 * Get translated string
 * @param key - Translation key
 * @param defaultValue - Default value if translation not found
 * @returns Translated string
 */
export const __ = (key: string, defaultValue: string = ''): string => {
  const translations = window.yatraAdmin?.translations || {};
  return translations[key] || defaultValue || key;
};

/**
 * Get translated string with context
 * @param key - Translation key
 * @param context - Context for translation
 * @param defaultValue - Default value if translation not found
 * @returns Translated string
 */
export const _x = (key: string, context: string, defaultValue: string = ''): string => {
  const contextKey = `${key}_${context}`;
  const translations = window.yatraAdmin?.translations || {};
  return translations[contextKey] || translations[key] || defaultValue || key;
};

/**
 * Get translated string with number
 * @param single - Single form
 * @param plural - Plural form
 * @param number - Number to determine form
 * @returns Translated string
 */
export const _n = (single: string, plural: string, number: number): string => {
  return number === 1 ? __(single, single) : __(plural, plural);
};

