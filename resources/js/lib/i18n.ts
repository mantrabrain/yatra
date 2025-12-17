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
      isProActive?: boolean;
      version?: string;
      proVersion?: string | null;
      translations?: Record<string, string>;
      locale?: string;
      emailAutomationEnabled?: boolean;
      tripConsentEnabled?: boolean;
      additionalServicesEnabled?: boolean;
      dynamicFormFieldEnabled?: boolean;
      advancedDiscountEnabled?: boolean;
      showGoogleCalendarSettingsUI?: boolean;
      showMailchimpSettingsUI?: boolean;
      showFacebookPixelSettingsUI?: boolean;
      showGoogleAnalyticsSettingsUI?: boolean;
      mailchimpConnected?: boolean;
      mailchimp?: {
        connected?: boolean;
        listId?: string;
        listName?: string;
        syncOnBooking?: boolean;
        syncOnPayment?: boolean;
        addTags?: boolean;
        defaultTags?: string[];
        doubleOptin?: boolean;
        fieldMapping?: Record<string, string>;
      };
      facebookPixel?: {
        connected?: boolean;
        pixelId?: string;
        trackViewContent?: boolean;
        trackInitiateCheckout?: boolean;
        trackPurchase?: boolean;
        trackAddToCart?: boolean;
        useConversionsApi?: boolean;
        testEventCode?: string;
        eventConfig?: Record<string, { enabled: boolean; custom_params?: string[] }>;
        parameterMapping?: Record<string, string>;
      };
      googleAnalytics?: {
        connected?: boolean;
        measurementId?: string;
        trackViewItem?: boolean;
        trackAddToCart?: boolean;
        trackBeginCheckout?: boolean;
        trackPurchase?: boolean;
        useMeasurementProtocol?: boolean;
        debugMode?: boolean;
        customDimensions?: Array<{ name: string; yatra_field: string; scope?: string }>;
        eventConfig?: Record<string, { enabled: boolean; custom_params?: string[] }>;
      };
      googleCalendar?: {
        client_id?: string;
        client_secret?: string;
        calendar_id?: string;
        calendar_name?: string;
        connected?: boolean;
        redirect_uri?: string;
        last_sync?: string | null;
      };
      googleCalendarRedirectUri?: string;
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

