/**
 * Internationalization (i18n) utility
 * Handles translations for UI text
 */

declare global {
  interface Window {
    yatraAdmin?: {
      apiUrl?: string;
      restUrl?: string;
      nonce?: string;
      brandLogoUrl?: string;
      /**
       * Operator-facing brand name. When the White Label module is
       * active (Agency-tier only) and the operator has filled in
       * "Plugin name" in WL settings, this is THAT value — otherwise
       * it's "Yatra". Use this everywhere instead of hardcoding
       * "Yatra" so the UI reflects the operator's brand for resellers.
       *
       * Injected by AdminAssetsProvider via `yatra_get_brand_name()`.
       */
      brandName?: string;
      pluginUrl?: string;
      currentUserAvatar?: string;
      currentUser?: number;
      siteUrl?: string;
      permissions?: string[];
      roles?: string[];
      capabilities?: Record<string, boolean>;
      isPro?: boolean;
      /** Yatra → Modules → Custom Landing Pages enabled (Pro). */
      customLandingPagesModuleEnabled?: boolean;
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
      flexiblePaymentsEnabled?: boolean;
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
        useConversionsApi?: boolean;
        testEventCode?: string;
        eventConfig?: Record<
          string,
          { enabled: boolean; custom_params?: string[] }
        >;
        parameterMapping?: Record<string, string>;
      };
      googleAnalytics?: {
        connected?: boolean;
        measurementId?: string;
        trackViewItem?: boolean;
        trackBeginCheckout?: boolean;
        trackPurchase?: boolean;
        useMeasurementProtocol?: boolean;
        debugMode?: boolean;
        customDimensions?: Array<{
          name: string;
          yatra_field: string;
          scope?: string;
        }>;
        eventConfig?: Record<
          string,
          { enabled: boolean; custom_params?: string[] }
        >;
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
      // Team & Access (Agency-tier) — injected by Team module's
      // LocalizedData service. Absent when module isn't installed.
      teamEnabled?: boolean;
      /**
       * Forward-looking "keep access on module disable" setting.
       * Only consulted when the Team & Access module is DISABLED:
       *   - `false` (default): yatra_* caps are stripped for non-admin
       *     users until the module is re-enabled.
       *   - `true`: WP-native role machinery keeps resolving caps from
       *     the stored role records — team members keep their access
       *     even after disabling the module.
       *
       * When the module is enabled, this setting is irrelevant —
       * caps resolve normally through the full layered chain (admin
       * fallback, expiry, revoke, role, grant).
       */
      teamKeepAccessOnModuleDisable?: boolean;
      isWpAdmin?: boolean;
      userCaps?: string[];
      userScopes?: {
        destinations: number[];
        activities: number[];
        trips: number[];
        categories: number[];
      };
    };
  }
}

/**
 * Internationalization (i18n) utility
 * Handles translations for UI text
 */

import {
  __ as wpI18n__,
  _x as wpI18n_x,
  sprintf as wpSprintf,
} from "@wordpress/i18n";

function __(key: string): string;
function __(key: string, textDomain: string): string;
function __(key: string, textDomain?: string): string {
  // If the frontend bootstrapped a translations map (e.g., account page),
  // use it as the highest priority source. This allows Loco Translate / PHP
  // string catalogs to power React UIs without requiring JS translation JSON files.
  if (typeof window !== "undefined") {
    const w = window as unknown as {
      yatraAccountPage?: { translations?: Record<string, string> };
      yatraAdmin?: { translations?: Record<string, string> };
    };
    const fromAccount = w.yatraAccountPage?.translations?.[key];
    if (typeof fromAccount === "string" && fromAccount !== "") {
      return fromAccount;
    }
    const fromAdmin = w.yatraAdmin?.translations?.[key];
    if (typeof fromAdmin === "string" && fromAdmin !== "") {
      return fromAdmin;
    }
  }

  // Use direct WordPress i18n function which is working correctly
  if (typeof window !== "undefined" && (window as any).wp?.i18n?.__) {
    return (window as any).wp.i18n.__(key, textDomain || "yatra");
  }
  // Fallback to @wordpress/i18n
  return wpI18n__(key, textDomain || "yatra");
}

function _x(key: string, context: string): string;
function _x(key: string, context: string, textDomain: string): string;
function _x(key: string, context: string, textDomain?: string): string {
  // Use direct WordPress i18n function which is working correctly
  if (typeof window !== "undefined" && (window as any).wp?.i18n?._x) {
    return (window as any).wp.i18n._x(key, context, textDomain || "yatra");
  }
  // Fallback to @wordpress/i18n
  return wpI18n_x(key, context, textDomain || "yatra");
}

function sprintf(format: string, ...args: (string | number)[]): string {
  if (typeof window !== "undefined" && (window as any).wp?.i18n?.sprintf) {
    return (window as any).wp.i18n.sprintf(format, ...args);
  }
  return (wpSprintf as (fmt: string, ...a: (string | number)[]) => string)(
    format,
    ...args,
  );
}

/**
 * Operator brand name — "Yatra" by default, or whatever the operator
 * has set in the White Label module (Agency tier).
 *
 * Use this in user-visible strings instead of hardcoding "Yatra":
 *
 *   const brand = brandName();
 *   sprintf(__("%s role", "yatra"), brand)   // "Acme role" if rebranded
 *
 * Always pass the brand as an interpolated argument so the translatable
 * string stays generic — that keeps `make-pot` extraction working AND
 * means a translator only has to translate "%s role" once, regardless
 * of brand.
 */
function brandName(): string {
  if (typeof window === "undefined") return "Yatra";
  return (window.yatraAdmin?.brandName as string | undefined) || "Yatra";
}

export { __, _x, sprintf, brandName };

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
