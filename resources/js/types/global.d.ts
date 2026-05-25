declare global {
  function __(text: string, domain?: string): string;

  interface Window {
    yatraAdmin?: {
      apiUrl: string;
      nonce: string;
      /** PNG in assets/images/yatra-icon.png — sidebar branding */
      brandLogoUrl?: string;
      pluginUrl?: string;
      currency: string;
      currencyPosition: string;
      currencyDecimals: number;
      thousandSeparator: string;
      decimalSeparator: string;
      capabilities: Record<string, boolean>;
      // Pro / tier flags. These come from AdminAssetsProvider.php's
      // wp_localize_script output. wp_localize_script serialises bools
      // to "1" / "" strings — code that reads these should use truthy
      // checks (`!!flag`) rather than strict `=== true`. See the
      // BookingForm sub-tab gate + Discount Stacking tab visibility
      // fixes for examples of the gotcha.
      isPro?: boolean;
      isAgency?: boolean;
      isAiEligible?: boolean;
      isWpAdmin?: boolean;
      // Module-enabled flags. All are flipped by useModules() at runtime
      // (after the /modules REST query resolves) and persisted on the
      // window.yatraAdmin singleton so downstream components can read
      // them synchronously without re-querying.
      emailAutomationEnabled: boolean;
      tripConsentEnabled: boolean;
      additionalServicesEnabled: boolean;
      abandonedBookingRecoveryEnabled: boolean;
      dynamicPricingEnabled: boolean;
      flexiblePaymentsEnabled?: boolean;
      dynamicFormFieldEnabled?: boolean;
      customLandingPagesModuleEnabled?: boolean;
      showGoogleCalendarSettingsUI?: boolean;
      advancedDiscountEnabled?: boolean;
      aiAssistantEnabled?: boolean;
      whiteLabelEnabled?: boolean;
      whatsappEnabled?: boolean;
      channelManagerEnabled?: boolean;
      webhooksEnabled?: boolean;
      // Brand / chrome
      brandName?: string;
      brandPrimaryColor?: string;
      brandMenuOverrides?: Record<string, unknown>;
      brandMenuOrder?: Record<string, string[]> | string[];
      brandUiChrome?: Record<string, unknown>;
      // Misc context
      adminUrl?: string;
      siteUrl?: string;
      restUrl?: string;
      version?: string;
      proVersion?: string | null;
      locale?: string;
      timezone?: string;
      countries?: Array<{ code: string; name: string }>;
      userScopes?: { destinations?: number[]; activities?: number[]; trips?: number[]; categories?: number[] };
    };
    yatraBookingData?: {
      currency: string;
    };
  }
}

export {};
