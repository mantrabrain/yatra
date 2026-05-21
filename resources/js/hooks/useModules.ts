import {
  useQuery,
  UseQueryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { __ } from "../lib/i18n";
import { useToast } from "../components/ui/toast";

/**
 * Plan tier a module belongs to.
 *
 * - `free`     — bundled with the free Yatra plugin, no license required.
 * - `personal` — unlocked by the entry-level Pro license.
 * - `growth`   — middle tier (AI Assistant + the same-band modules).
 * - `agency`   — top tier (white-label + agency-only modules).
 *
 * `growth` was previously missing from this union even though
 * `Modules.tsx` already renders a `module.plan === "growth"` badge, which
 * surfaced a `TS2367` "no overlap" warning on every type-check.
 */
export type ModulePlan = "free" | "personal" | "growth" | "agency";

export interface ModuleDefinition {
  slug: string;
  name: string;
  description?: string;
  category?: string;
  version?: string;
  docs_url?: string;
  is_core?: boolean;
  is_premium?: boolean;
  is_available?: boolean;
  requires_pro?: boolean;
  requires_agency?: boolean;
  plan?: ModulePlan;
  purchase_url?: string;
  video_url?: string;
  enabled: boolean;
  tags?: string[];
  updated_at?: string | null;
  settings_page?: string;
}

interface ModulesResponse {
  data?: ModuleDefinition[];
}

const fetchModules = async (): Promise<ModuleDefinition[]> => {
  const response: ModulesResponse = await apiClient.get("/modules");
  if (Array.isArray(response)) {
    return response;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  return [];
};

export const useModulesQuery = (
  options?: Partial<UseQueryOptions<ModuleDefinition[], Error>>,
) => {
  return useQuery<ModuleDefinition[], Error>({
    queryKey: ["modules"],
    queryFn: fetchModules,
    staleTime: 0,
    ...options,
  });
};

interface TogglePayload {
  slug: string;
  enabled: boolean;
  name?: string;
}

const formatNamesList = (names: string[]) => {
  if (names.length <= 2) {
    return names.join(", ");
  }
  return `${names.slice(0, 2).join(", ")} ${__("and", "yatra")} ${names.length - 2} ${__("more", "yatra")}`;
};

export const useToggleModule = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ slug, enabled }: TogglePayload) => {
      const response: ModulesResponse = await apiClient.post(
        `/modules/${slug}/toggle`,
        { enabled },
      );
      return Array.isArray(response?.data) ? response.data : [];
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["modules"], data);

      // Update global admin variables for navigation
      if (window.yatraAdmin) {
        // Update module-specific flags based on the enabled modules
        const enabledModules = data.filter((m) => m.enabled);

        // Check for specific modules that affect navigation
        window.yatraAdmin.emailAutomationEnabled = enabledModules.some(
          (m) => m.slug === "email_automation" || m.slug === "email-automation",
        );
        window.yatraAdmin.tripConsentEnabled = enabledModules.some(
          (m) => m.slug === "trip_consent" || m.slug === "trip-consent",
        );
        window.yatraAdmin.additionalServicesEnabled = enabledModules.some(
          (m) =>
            m.slug === "additional_services" ||
            m.slug === "additional-services",
        );
        window.yatraAdmin.abandonedBookingRecoveryEnabled = enabledModules.some(
          (m) =>
            m.slug === "abandoned_booking_recovery" ||
            m.slug === "abandoned-booking-recovery",
        );
        window.yatraAdmin.dynamicPricingEnabled = enabledModules.some(
          (m) => m.slug === "dynamic_pricing" || m.slug === "dynamic-pricing",
        );
        window.yatraAdmin.flexiblePaymentsEnabled = enabledModules.some(
          (m) => m.slug === "flexible_payments",
        );
        window.yatraAdmin.dynamicFormFieldEnabled = enabledModules.some(
          (m) => m.slug === "dynamic_form_field",
        );
        window.yatraAdmin.customLandingPagesModuleEnabled = enabledModules.some(
          (m) => m.slug === "custom_landing_pages",
        );
        window.yatraAdmin.showGoogleCalendarSettingsUI = enabledModules.some(
          (m) => m.slug === "google_calendar" || m.slug === "google-calendar",
        );
        window.yatraAdmin.advancedDiscountEnabled = enabledModules.some(
          (m) =>
            m.slug === "advanced_discount" || m.slug === "advanced-discount",
        );
        // AI Assistant + White Label + WhatsApp control top-level
        // sidebar menus. Updating these flags here means the menu
        // appears / disappears instantly when the operator toggles
        // any of them — Layout.tsx re-evaluates its memoized menuItems
        // on the `yatra-modules-updated` event dispatched below.
        window.yatraAdmin.aiAssistantEnabled = enabledModules.some(
          (m) => m.slug === "ai_assistant" || m.slug === "ai-assistant",
        );
        window.yatraAdmin.whiteLabelEnabled = enabledModules.some(
          (m) => m.slug === "white_label" || m.slug === "white-label",
        );
        window.yatraAdmin.whatsappEnabled = enabledModules.some(
          (m) => m.slug === "whatsapp",
        );
        // Channel Manager controls a top-level Agency-only sidebar menu.
        // Updating this flag here means the menu appears / disappears
        // instantly when the operator toggles the module — Layout.tsx
        // re-evaluates its memoized menuItems on the
        // `yatra-modules-updated` event dispatched below.
        window.yatraAdmin.channelManagerEnabled = enabledModules.some(
          (m) => m.slug === "channel_manager" || m.slug === "channel-manager",
        );
        // Add flags for Pro feature modules
        window.yatraAdmin.showMailchimpSettingsUI = enabledModules.some(
          (m) => m.slug === "mailchimp",
        );
        window.yatraAdmin.showFacebookPixelSettingsUI = enabledModules.some(
          (m) => m.slug === "facebook_pixel",
        );
        window.yatraAdmin.showGoogleAnalyticsSettingsUI = enabledModules.some(
          (m) => m.slug === "google_analytics",
        );
        // Note: availabilityModuleEnabled and departuresModuleEnabled removed - now FREE features

        // Trigger a navigation refresh by updating a custom event
        window.dispatchEvent(
          new CustomEvent("yatra-modules-updated", {
            detail: {
              enabledModules: enabledModules,
              updatedModule: variables,
            },
          }),
        );

        // Force a layout re-render by updating the URL key
        const urlKey = (window as any).__yatraUrlKey || 0;
        (window as any).__yatraUrlKey = urlKey + 1;
        window.dispatchEvent(new CustomEvent("yatra-force-nav-refresh"));
      }

      const label = variables.name || variables.slug;
      showToast(
        variables.enabled
          ? __("{module} enabled successfully.", "yatra").replace(
              "{module}",
              label,
            )
          : __("{module} disabled successfully.", "yatra").replace(
              "{module}",
              label,
            ),
        "success",
      );
    },
    onError: (error: Error) => {
      showToast(
        error.message || __("Failed to update module.", "yatra"),
        "error",
      );
    },
  });
};

export const useBulkToggleModules = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (items: TogglePayload[]) => {
      const response: ModulesResponse = await apiClient.post(
        "/modules/bulk-toggle",
        { items },
      );
      return Array.isArray(response?.data) ? response.data : [];
    },
    onSuccess: (data, variables = [], context) => {
      queryClient.setQueryData(["modules"], data);

      // Check if there's a partial success message (some modules blocked)
      const response = context as any;
      if (response?.message) {
        // Show partial success message with warning
        showToast(response.message, "warning");
      }

      // Update global admin variables for navigation
      if (window.yatraAdmin && data) {
        // Update module-specific flags based on the enabled modules
        const enabledModules = data.filter((m) => m.enabled);

        // Check for specific modules that affect navigation
        window.yatraAdmin.emailAutomationEnabled = enabledModules.some(
          (m) => m.slug === "email_automation" || m.slug === "email-automation",
        );
        window.yatraAdmin.tripConsentEnabled = enabledModules.some(
          (m) => m.slug === "trip_consent" || m.slug === "trip-consent",
        );
        window.yatraAdmin.additionalServicesEnabled = enabledModules.some(
          (m) =>
            m.slug === "additional_services" ||
            m.slug === "additional-services",
        );
        window.yatraAdmin.abandonedBookingRecoveryEnabled = enabledModules.some(
          (m) =>
            m.slug === "abandoned_booking_recovery" ||
            m.slug === "abandoned-booking-recovery",
        );
        window.yatraAdmin.dynamicPricingEnabled = enabledModules.some(
          (m) => m.slug === "dynamic_pricing" || m.slug === "dynamic-pricing",
        );
        window.yatraAdmin.flexiblePaymentsEnabled = enabledModules.some(
          (m) => m.slug === "flexible_payments",
        );
        window.yatraAdmin.dynamicFormFieldEnabled = enabledModules.some(
          (m) => m.slug === "dynamic_form_field",
        );
        window.yatraAdmin.customLandingPagesModuleEnabled = enabledModules.some(
          (m) => m.slug === "custom_landing_pages",
        );
        window.yatraAdmin.showGoogleCalendarSettingsUI = enabledModules.some(
          (m) => m.slug === "google_calendar" || m.slug === "google-calendar",
        );
        window.yatraAdmin.advancedDiscountEnabled = enabledModules.some(
          (m) =>
            m.slug === "advanced_discount" || m.slug === "advanced-discount",
        );
        // AI Assistant + White Label + WhatsApp control top-level
        // sidebar menus. Updating these flags here means the menu
        // appears / disappears instantly when the operator toggles
        // any of them — Layout.tsx re-evaluates its memoized menuItems
        // on the `yatra-modules-updated` event dispatched below.
        window.yatraAdmin.aiAssistantEnabled = enabledModules.some(
          (m) => m.slug === "ai_assistant" || m.slug === "ai-assistant",
        );
        window.yatraAdmin.whiteLabelEnabled = enabledModules.some(
          (m) => m.slug === "white_label" || m.slug === "white-label",
        );
        window.yatraAdmin.whatsappEnabled = enabledModules.some(
          (m) => m.slug === "whatsapp",
        );
        // Channel Manager controls a top-level Agency-only sidebar menu.
        // Updating this flag here means the menu appears / disappears
        // instantly when the operator toggles the module — Layout.tsx
        // re-evaluates its memoized menuItems on the
        // `yatra-modules-updated` event dispatched below.
        window.yatraAdmin.channelManagerEnabled = enabledModules.some(
          (m) => m.slug === "channel_manager" || m.slug === "channel-manager",
        );
        // Add flags for Pro feature modules
        window.yatraAdmin.showMailchimpSettingsUI = enabledModules.some(
          (m) => m.slug === "mailchimp",
        );
        window.yatraAdmin.showFacebookPixelSettingsUI = enabledModules.some(
          (m) => m.slug === "facebook_pixel",
        );
        window.yatraAdmin.showGoogleAnalyticsSettingsUI = enabledModules.some(
          (m) => m.slug === "google_analytics",
        );
        // Note: availabilityModuleEnabled and departuresModuleEnabled removed - now FREE features

        // Trigger a navigation refresh by updating a custom event
        window.dispatchEvent(
          new CustomEvent("yatra-modules-updated", {
            detail: {
              enabledModules: enabledModules,
              updatedModules: variables || [],
            },
          }),
        );

        // Force a layout re-render by updating the URL key
        const urlKey = (window as any).__yatraUrlKey || 0;
        (window as any).__yatraUrlKey = urlKey + 1;
        window.dispatchEvent(new CustomEvent("yatra-force-nav-refresh"));
      }

      // Only show success message if there wasn't a partial success message
      if (!response?.message && variables.length > 0) {
        const names = variables.map((item) => item.name || item.slug);
        const summary = formatNamesList(names);
        const message = variables[0].enabled
          ? __("Enabled: {modules}", "yatra").replace("{modules}", summary)
          : __("Disabled: {modules}", "yatra").replace("{modules}", summary);
        showToast(message, "success");
      } else if (!response?.message) {
        showToast(__("Modules updated successfully.", "yatra"), "success");
      }
    },
    onError: (error: Error) => {
      showToast(
        error.message || __("Failed to update modules.", "yatra"),
        "error",
      );
    },
  });
};
