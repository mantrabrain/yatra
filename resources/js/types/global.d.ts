declare global {
  function __(text: string, domain?: string): string;

  interface Window {
    yatraAdmin?: {
      apiUrl: string;
      nonce: string;
      currency: string;
      currencyPosition: string;
      currencyDecimals: number;
      thousandSeparator: string;
      decimalSeparator: string;
      capabilities: Record<string, boolean>;
      // Module enabled flags
      emailAutomationEnabled: boolean;
      tripConsentEnabled: boolean;
      additionalServicesEnabled: boolean;
      abandonedBookingRecoveryEnabled: boolean;
      dynamicPricingEnabled: boolean;
    };
    yatraBookingData?: {
      currency: string;
    };
  }
}

export {};
