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
      abandonedBookingRecoveryEnabled?: boolean;
      dynamicPricingEnabled?: boolean;
      dynamicFormFieldEnabled?: boolean;
      advancedDiscountEnabled?: boolean;
      showGoogleCalendarSettingsUI?: boolean;
      showMailchimpSettingsUI?: boolean;
      showFacebookPixelSettingsUI?: boolean;
      showGoogleAnalyticsSettingsUI?: boolean;
      currency?: string;
      date_format?: string;
      time_format?: string;
      calendar_name?: string;
      connected?: boolean;
      redirect_uri?: string;
      last_sync?: string | null;
      googleCalendarRedirectUri?: string;
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
    };
  }
}

/**
 * Internationalization (i18n) utility
 * Handles translations for UI text
 */

import { __ as wpI18n__, _x as wpI18n_x } from '@wordpress/i18n';

function __(key: string): string;
function __(key: string, textDomain: string): string;
function __(key: string, textDomain?: string): string {
    // Use direct WordPress i18n function which is working correctly
    if (typeof window !== 'undefined' && (window as any).wp?.i18n?.__) {
        return (window as any).wp.i18n.__(key, textDomain || 'yatra');
    }
    // Fallback to @wordpress/i18n
    return wpI18n__(key, textDomain || 'yatra');
}

function _x(key: string, context: string): string;
function _x(key: string, context: string, textDomain: string): string;
function _x(key: string, context: string, textDomain?: string): string {
    // Use direct WordPress i18n function which is working correctly
    if (typeof window !== 'undefined' && (window as any).wp?.i18n?._x) {
        return (window as any).wp.i18n._x(key, context, textDomain || 'yatra');
    }
    // Fallback to @wordpress/i18n
    return wpI18n_x(key, context, textDomain || 'yatra');
}

export { __, _x };

/**
 * Get translated string with number
 * @param single - Single form
 * @param plural - Plural form
 * @param number - Number to determine form
 * @returns Translated string
 */
export const _n = (single: string, plural: string, number: number): string => {
  return number === 1 ? __(single) : __(plural);
};

