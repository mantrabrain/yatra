/**
 * Settings Page
 * Comprehensive settings page for trip booking software
 * Left sidebar navigation + Right side form fields with detailed configurations
 */

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  Building2,
  Calendar,
  DollarSign,
  Mail,
  MapPin,
  Users,
  Star,
  Receipt,
  Globe,
  Bell,
  Plug,
  Shield,
  Info,
  ChevronDown,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ClipboardList,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Edit2,
  Lock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Check,
} from "lucide-react";
import { __ } from "../lib/i18n";
import { usePermissions } from "../hooks/usePermissions";
import { useToast } from "../components/ui/toast";
import { apiClient, apiService } from "../lib/api-client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { PageHeader } from "../components/common/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../components/ui/card";
import { ConditionalRender } from "../components/ui/conditional-render";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { getCurrencyOptions } from "../data/currencies";
import { SearchableSelect } from "../components/ui/searchable-select";
import { MultiSelect, MultiSelectOption } from "../components/ui/multi-select";

// Helper component for form field with description - MUST be outside component to prevent remounts
const FormField = React.memo(
  ({
    id,
    label,
    description,
    required = false,
    actionButton,
    children,
  }: {
    id: string;
    label: string;
    description?: React.ReactNode;
    required?: boolean;
    actionButton?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span className="min-w-0 leading-relaxed">{description}</span>
        </p>
      )}
      {actionButton ? (
        <div className="flex gap-2">
          <div className="flex-1">{children}</div>
          {actionButton}
        </div>
      ) : (
        children
      )}
    </div>
  ),
);
FormField.displayName = "FormField";

// Google Calendar Integration Section - inline component to avoid lazy loading issues
const GoogleCalendarIntegrationSection: React.FC<{
  formData: SettingsData;
  setFormData: React.Dispatch<React.SetStateAction<SettingsData | null>>;
}> = ({ formData, setFormData }) => {
  const yatraAdmin = (window as any).yatraAdmin || {};
  const gcSettings = yatraAdmin.googleCalendar || {};
  const siteUrl = yatraAdmin.siteUrl || "";

  // Use state from parent formData if available, otherwise use from yatraAdmin
  const [clientId, setClientId] = useState(
    formData.google_calendar_client_id || gcSettings.client_id || "",
  );
  const [clientSecret, setClientSecret] = useState(
    formData.google_calendar_client_secret || gcSettings.client_secret || "",
  );
  const [calendarId, setCalendarId] = useState(
    formData.google_calendar_calendar_id || gcSettings.calendar_id || "",
  );
  const [calendarName, setCalendarName] = useState(
    formData.google_calendar_calendar_name || gcSettings.calendar_name || "",
  );
  const [connected, setConnected] = useState(
    formData.google_calendar_connected || gcSettings.connected || false,
  );
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const redirectUri =
    yatraAdmin.googleCalendarRedirectUri ||
    gcSettings.redirect_uri ||
    `${siteUrl}/wp-json/yatra/v1/google-calendar/callback`;
  const lastSync =
    formData.google_calendar_last_sync || gcSettings.last_sync || null;

  // Dynamic mapping of settings to formData
  const syncSettingsToFormData = () => {
    // Get all available settings from the backend
    const allSettings = {
      google_calendar_client_id: clientId,
      google_calendar_client_secret: clientSecret,
      google_calendar_enabled: true, // Enable by default when settings are provided
    };

    // Update formData with all settings
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...allSettings,
      };
    });
  };

  // Update formData when any setting changes
  useEffect(() => {
    syncSettingsToFormData();
  }, [clientId, clientSecret]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await apiClient.post("/google-calendar/connect");
      if (response.data?.auth_url) {
        window.open(response.data.auth_url, "_blank");
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        __(
          "Are you sure you want to disconnect from Google Calendar?",
          "yatra",
        ),
      )
    ) {
      return;
    }
    try {
      await apiClient.post("/google-calendar/disconnect");

      // Update settings state
      setConnected(false);
      setCalendarId("");
      setCalendarName("");
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await apiClient.post("/google-calendar/sync-all");
      // No need to update lastSync state directly as it's derived from formData
      // The API response will be handled by the backend and reflected in the next load
    } catch (error) {
      console.error("Failed to sync:", error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            {__("Google Calendar Settings", "yatra")}
          </CardTitle>
          <div className="flex items-center gap-2">
            {connected ? (
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                {__("Connected", "yatra")}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <XCircle className="w-4 h-4" />
                {__("Not Connected", "yatra")}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {__(
              "Connect your Google Calendar to automatically sync bookings and departures. Events will be created for each booking with trip details, traveler information, and departure dates.",
              "yatra",
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="gc_client_id"
              label={__("Client ID", "yatra")}
              description={
                <>
                  {__("Create an OAuth client in", "yatra")}{" "}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500 dark:text-blue-400 underline"
                  >
                    {__("Google Cloud Credentials", "yatra")}
                  </a>
                  {__(", then paste the OAuth 2.0 Client ID here.", "yatra")}{" "}
                  {__("Example:", "yatra")}{" "}
                  <code className="font-mono">
                    123...apps.googleusercontent.com
                  </code>
                </>
              }
            >
              <Input
                id="gc_client_id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="123456789-xxxxx.apps.googleusercontent.com"
              />
            </FormField>
            <FormField
              id="gc_client_secret"
              label={__("Client Secret", "yatra")}
              description={
                <>
                  {__(
                    "Copy the Client Secret from the same OAuth client in",
                    "yatra",
                  )}{" "}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500 dark:text-blue-400 underline"
                  >
                    {__("Google Cloud Credentials", "yatra")}
                  </a>
                  {__(".", "yatra")} {__("Keep this private.", "yatra")}
                </>
              }
            >
              <Input
                id="gc_client_secret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="GOCSPX-xxxxxxxxxxxxxxxxxx"
              />
            </FormField>
          </div>

          <FormField
            id="gc_redirect_uri"
            label={__("Redirect URI (OAuth Callback URL)", "yatra")}
            description={
              <>
                {__(
                  'Add this to your OAuth client under "Authorized redirect URIs" in',
                  "yatra",
                )}{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 underline"
                >
                  {__("Google Cloud Credentials", "yatra")}
                </a>
                {__(".", "yatra")} {__("Make sure the", "yatra")}{" "}
                <a
                  href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 underline"
                >
                  {__("Google Calendar API", "yatra")}
                </a>{" "}
                {__("is enabled.", "yatra")}
              </>
            }
          >
            <div className="flex items-center gap-2">
              <Input
                id="gc_redirect_uri"
                value={redirectUri}
                readOnly
                className="bg-gray-50 dark:bg-gray-900 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(redirectUri)}
              >
                {__("Copy", "yatra")}
              </Button>
            </div>
          </FormField>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="min-w-0 leading-relaxed">
                {__(
                  "OAuth scopes required (add these on the Google OAuth consent screen):",
                  "yatra",
                )}{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials/consent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-900 dark:text-amber-200 underline"
                >
                  {__("OAuth Consent Screen", "yatra")}
                </a>
              </span>
            </p>
            <div className="mt-2 space-y-1">
              <div className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <code className="text-[11px] bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">
                  https://www.googleapis.com/auth/calendar
                </code>
              </div>
              <div className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <code className="text-[11px] bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">
                  https://www.googleapis.com/auth/calendar.events
                </code>
              </div>
            </div>
          </div>

          {connected && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md space-y-4">
              <h4 className="font-medium text-sm text-green-800 dark:text-green-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {__("Connected Calendar", "yatra")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  id="gc_calendar_id"
                  label={__("Calendar ID", "yatra")}
                  description={__(
                    'The ID of the Google Calendar to sync events to. Use "primary" for your main calendar, or enter a specific calendar ID.',
                    "yatra",
                  )}
                >
                  <Input
                    id="gc_calendar_id"
                    value={calendarId}
                    onChange={(e) => setCalendarId(e.target.value)}
                    placeholder="primary"
                  />
                </FormField>
                <FormField
                  id="gc_calendar_name"
                  label={__("Calendar Name", "yatra")}
                  description={__(
                    "A friendly name for this calendar connection (for your reference only).",
                    "yatra",
                  )}
                >
                  <Input
                    id="gc_calendar_name"
                    value={calendarName}
                    onChange={(e) => setCalendarName(e.target.value)}
                    placeholder={__("My Booking Calendar", "yatra")}
                  />
                </FormField>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-400">
                  {lastSync ? (
                    <>
                      {__("Last sync:", "yatra")}{" "}
                      {new Date(lastSync).toLocaleString()}
                    </>
                  ) : (
                    __("Never synced", "yatra")
                  )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
                  />
                  {__("Sync Now", "yatra")}
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-between items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-3">
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm"
              >
                <ExternalLink className="w-3 h-3" />
                {__("Credentials", "yatra")}
              </a>
              <a
                href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm"
              >
                <ExternalLink className="w-3 h-3" />
                {__("Calendar API", "yatra")}
              </a>
              <a
                href="https://console.cloud.google.com/apis/credentials/consent"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm"
              >
                <ExternalLink className="w-3 h-3" />
                {__("OAuth Consent", "yatra")}
              </a>
            </div>

            {connected ? (
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                {__("Disconnect", "yatra")}
              </Button>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={connecting || !clientId || !clientSecret}
                className="flex items-center gap-2"
              >
                {connecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                {__("Connect to Google Calendar", "yatra")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

type SettingsSection =
  | "general"
  | "booking"
  | "booking_form"
  | "payment"
  | "email"
  | "trip"
  | "customer"
  | "review"
  | "tax"
  | "currency"
  | "notification"
  | "integration"
  | "permalink"
  | "advanced";

// Form Builder Types
interface FormFieldConfig {
  id: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "date"
    | "select"
    | "country"
    | "textarea"
    | "checkbox"
    | "number";
  label: string;
  placeholder: string;
  required: boolean;
  enabled: boolean;
  order: number;
  width: "full" | "half" | "third";
  section?: string;
  options?: { value: string; label: string }[];
  locked?: boolean; // If true, field cannot be deleted and required cannot be changed
}

interface FormSectionConfig {
  title: string;
  description: string;
  enabled?: boolean;
  fields: FormFieldConfig[];
}

interface BookingFormConfig {
  contact_form: FormSectionConfig;
  emergency_contact_form: FormSectionConfig;
  traveler_form: FormSectionConfig;
}

interface PaymentGatewayConfig {
  enabled: boolean;
  icon?: string;
  title?: string;
  description?: string;
  [key: string]: any;
}

interface GatewayField {
  id: string;
  type: string;
  label: string;
  description?: string;
  placeholder?: string;
  default?: any;
  options?: Record<string, string>;
  condition?: string;
  show_when?: Record<string, string>; // Conditional display based on other field values
  min?: number;
  max?: number;
  readonly?: boolean;
  help_text?: string;
  help_url?: string;
  help_url_test?: string;
  help_url_live?: string;
}

interface GatewayDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  sandbox_url?: string;
  is_offline: boolean;
  supports: string[];
  fields: GatewayField[];
  config: PaymentGatewayConfig;
  enabled: boolean;
}

interface SettingsData {
  // General Settings
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_city: string;
  company_state: string;
  company_country: string;
  company_zip: string;
  company_website: string;
  company_logo: string;
  timezone: string;
  date_format: string;
  time_format: string;
  language: string;

  // Google Calendar Settings
  google_calendar_client_id?: string;
  google_calendar_client_secret?: string;
  google_calendar_calendar_id?: string;
  google_calendar_calendar_name?: string;
  google_calendar_connected?: boolean;
  google_calendar_last_sync?: string | null;
  google_calendar_enabled?: boolean;

  // Booking Settings
  booking_confirmation: boolean;
  auto_confirm_bookings: boolean;
  require_login: boolean;
  allow_guest_checkout: boolean;
  cancellation_policy: string;
  cancellation_days: number;
  refund_policy: string;
  booking_expiry_hours: number;
  booking_reminder_days: number;
  allow_waitlist: boolean;
  waitlist_auto_confirm: boolean;

  // Payment Settings
  currency: string;
  payment_test_mode: boolean;
  payment_gateways: string[];
  payment_methods: string[];
  partial_payment: boolean;
  partial_payment_percentage: number;
  deposit_required: boolean;
  deposit_percentage: number;
  auto_confirm_pay_later: boolean;
  gateway_configs: Record<string, PaymentGatewayConfig>;
  gateway_order?: string[];

  // Email Settings
  admin_email: string;
  from_email: string;
  from_name: string;
  email_template_booking: boolean;
  email_template_confirmation: boolean;
  email_template_cancellation: boolean;
  email_template_reminder: boolean;
  smtp_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: string;

  // Trip Settings
  default_trip_status: string;
  require_availability: boolean;
  max_group_size: number;
  min_group_size: number;
  booking_advance_days: number;
  allow_custom_dates: boolean;
  require_minimum_participants: boolean;
  minimum_participants: number;

  // Customer Settings
  customer_registration: boolean;
  customer_fields: string[];
  require_email_verification: boolean;
  customer_account_page: string;
  allow_customer_reviews: boolean;
  customer_dashboard_enabled: boolean;

  // Review Settings
  enable_reviews: boolean;
  require_booking: boolean;
  auto_approve_reviews: boolean;
  review_moderation: boolean;
  min_rating: number;
  allow_anonymous_reviews: boolean;
  review_reminder_days: number;

  // Tax Settings
  enable_tax: boolean;
  tax_rate: number;
  tax_inclusive: boolean;
  vat_number: string;
  tax_by_country: boolean;
  tax_rates: Record<string, number>;

  // Currency Settings
  default_currency: string;
  multi_currency: boolean;
  currency_position: string;
  currency_decimals: number;
  supported_currencies: string[];
  auto_currency_detection: boolean;

  // Notification Settings
  notify_new_booking: boolean;
  notify_payment: boolean;
  notify_cancellation: boolean;
  notify_admin: boolean;
  notify_customer_booking: boolean;
  notify_customer_payment: boolean;
  sms_notifications: boolean;
  sms_provider: string;
  sms_api_key: string;

  // Integration Settings
  google_analytics: string;
  facebook_pixel: string;
  google_maps_api: string;
  recaptcha_enabled: boolean;
  recaptcha_site_key: string;
  recaptcha_secret_key: string;

  // Mailchimp Integration (Pro)
  mailchimp_api_key?: string;
  mailchimp_list_id?: string;
  mailchimp_list_name?: string;
  mailchimp_sync_on_booking?: boolean;
  mailchimp_sync_on_payment?: boolean;
  mailchimp_double_optin?: boolean;
  mailchimp_add_tags?: boolean;
  mailchimp_default_tags?: string[];
  mailchimp_field_mapping?: Record<string, string>;

  // Facebook Pixel Enhanced (Pro)
  facebook_pixel_id?: string;
  fb_track_view_content?: boolean;
  fb_track_initiate_checkout?: boolean;
  fb_track_purchase?: boolean;
  fb_track_add_to_cart?: boolean;
  fb_use_conversions_api?: boolean;
  facebook_access_token?: string;
  fb_test_event_code?: string;
  fb_event_config?: Record<
    string,
    { enabled: boolean; custom_params?: string[] }
  >;
  fb_parameter_mapping?: Record<string, string>;

  // Google Analytics 4 Enhanced (Pro)
  ga4_measurement_id?: string;
  ga4_track_view_item?: boolean;
  ga4_track_add_to_cart?: boolean;
  ga4_track_begin_checkout?: boolean;
  ga4_track_purchase?: boolean;
  ga4_use_measurement_protocol?: boolean;
  ga4_api_secret?: string;
  ga4_debug_mode?: boolean;
  ga4_custom_dimensions?: Array<{
    name: string;
    yatra_field: string;
    scope?: string;
  }>;
  ga4_event_config?: Record<
    string,
    { enabled: boolean; custom_params?: string[] }
  >;

  // Permalink Settings
  trip_base: string;
  destination_base: string;
  activity_base: string;
  trip_category_base: string;
  booking_base: string;

  // Booking Page Settings
  use_booking_page: boolean;
  booking_page_id: number;

  // Advanced Settings
  debug_mode: boolean;
  enable_logging: boolean;
  cache_enabled: boolean;
  api_key: string;
  api_rate_limit: number;
  session_timeout: number;

  // Booking Form Builder
  booking_form_config: BookingFormConfig;
}

// Form Builder Component
type BookingFormSubTab =
  | "contact_form"
  | "emergency_contact_form"
  | "traveler_form";

interface BookingFormBuilderProps {
  formData: SettingsData;
  setFormData: React.Dispatch<React.SetStateAction<SettingsData | null>>;
}

// Get initial sub-tab from localStorage
const getInitialFormSubTab = (): BookingFormSubTab => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("yatra_settings_booking_form_subtab");
    if (
      saved &&
      ["contact_form", "emergency_contact_form", "traveler_form"].includes(
        saved,
      )
    ) {
      return saved as BookingFormSubTab;
    }
  }
  return "contact_form";
};

const BookingFormBuilder: React.FC<BookingFormBuilderProps> = ({
  formData,
  setFormData,
}) => {
  const [activeFormTab, setActiveFormTab] =
    useState<BookingFormSubTab>(getInitialFormSubTab);

  // Check if Dynamic Form Field module is enabled via modules API
  const { data: modulesData } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const response = await apiService.getModules();
      return response;
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Check if module is enabled from API response or fallback to yatraAdmin
  const isDynamicFormFieldEnabled = React.useMemo(() => {
    if (modulesData?.data) {
      const module = modulesData.data.find(
        (m: any) => m.slug === "dynamic_form_field",
      );
      return module?.enabled === true && module?.is_available === true;
    }
    // Fallback to yatraAdmin if modules API hasn't loaded yet
    return window.yatraAdmin?.dynamicFormFieldEnabled === true;
  }, [modulesData]);

  // Save sub-tab to localStorage when it changes
  const handleSubTabChange = (tab: BookingFormSubTab) => {
    setActiveFormTab(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem("yatra_settings_booking_form_subtab", tab);
    }
  };
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState<Partial<FormFieldConfig>>({
    id: "",
    type: "text",
    label: "",
    placeholder: "",
    required: false,
    enabled: true,
    width: "full",
    options: [],
  });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    fieldId: string | null;
    fieldLabel: string;
  }>({
    isOpen: false,
    fieldId: null,
    fieldLabel: "",
  });

  // Drag and drop state
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null);

  // Helper to generate ID from label
  const generateIdFromLabel = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  };

  // Helper to sanitize ID input
  const sanitizeId = (id: string): string => {
    return id
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  };

  // Handle label change with auto ID generation
  const handleNewFieldLabelChange = (label: string) => {
    const autoId = generateIdFromLabel(label);
    setNewField((prev) => ({
      ...prev,
      label,
      // Only auto-generate ID if it hasn't been manually edited
      id:
        prev.id === "" || prev.id === generateIdFromLabel(prev.label || "")
          ? autoId
          : prev.id,
    }));
  };

  const formTabs = [
    {
      id: "contact_form" as const,
      label: __("Contact Form", "yatra"),
      description: "Lead traveler contact details",
    },
    {
      id: "emergency_contact_form" as const,
      label: __("Emergency Contact", "yatra"),
      description: "Emergency contact information",
    },
    {
      id: "traveler_form" as const,
      label: __("Traveler Form", "yatra"),
      description: "Individual traveler details",
    },
  ];

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "email", label: "Email" },
    { value: "tel", label: "Phone" },
    { value: "date", label: "Date" },
    { value: "select", label: "Dropdown" },
    { value: "country", label: "Country Selector" },
    { value: "textarea", label: "Text Area" },
    { value: "number", label: "Number" },
  ];

  const widthOptions = [
    { value: "full", label: "Full Width" },
    { value: "half", label: "Half Width" },
    { value: "third", label: "One Third" },
  ];

  const getCurrentFormConfig = () => {
    return (
      formData?.booking_form_config?.[activeFormTab] || {
        title: "",
        description: "",
        enabled: true,
        fields: [],
      }
    );
  };

  const updateFormConfig = (updates: Partial<FormSectionConfig>) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        booking_form_config: {
          ...prev.booking_form_config,
          [activeFormTab]: {
            ...prev.booking_form_config[activeFormTab],
            ...updates,
          },
        },
      };
    });
  };

  const updateField = (fieldId: string, updates: Partial<FormFieldConfig>) => {
    const currentConfig = getCurrentFormConfig();
    const updatedFields = currentConfig.fields.map((field) =>
      field.id === fieldId ? { ...field, ...updates } : field,
    );
    updateFormConfig({ fields: updatedFields });
  };

  const toggleFieldEnabled = (fieldId: string) => {
    const currentConfig = getCurrentFormConfig();
    const field = currentConfig.fields.find((f) => f.id === fieldId);
    // Locked fields cannot be disabled
    if (field && !field.locked) {
      updateField(fieldId, { enabled: !field.enabled });
    }
  };

  const toggleFieldRequired = (fieldId: string) => {
    const currentConfig = getCurrentFormConfig();
    const field = currentConfig.fields.find((f) => f.id === fieldId);
    if (field) {
      updateField(fieldId, { required: !field.required });
    }
  };

  const moveField = (fieldId: string, direction: "up" | "down") => {
    const currentConfig = getCurrentFormConfig();
    const fields = [...currentConfig.fields];
    const index = fields.findIndex((f) => f.id === fieldId);

    if (direction === "up" && index > 0) {
      [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
    } else if (direction === "down" && index < fields.length - 1) {
      [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
    }

    // Update order values
    fields.forEach((field, i) => {
      field.order = i + 1;
    });

    updateFormConfig({ fields });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedFieldId(fieldId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (fieldId !== draggedFieldId) {
      setDragOverFieldId(fieldId);
    }
  };

  const handleDragLeave = () => {
    setDragOverFieldId(null);
  };

  const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault();
    if (!draggedFieldId || draggedFieldId === targetFieldId) {
      setDraggedFieldId(null);
      setDragOverFieldId(null);
      return;
    }

    const currentConfig = getCurrentFormConfig();
    const fields = [...currentConfig.fields];
    const draggedIndex = fields.findIndex((f) => f.id === draggedFieldId);
    const targetIndex = fields.findIndex((f) => f.id === targetFieldId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedField] = fields.splice(draggedIndex, 1);
      fields.splice(targetIndex, 0, draggedField);

      // Update order values
      fields.forEach((field, i) => {
        field.order = i + 1;
      });

      updateFormConfig({ fields });
    }

    setDraggedFieldId(null);
    setDragOverFieldId(null);
  };

  const handleDragEnd = () => {
    setDraggedFieldId(null);
    setDragOverFieldId(null);
  };

  const deleteField = (fieldId: string) => {
    const currentConfig = getCurrentFormConfig();
    const updatedFields = currentConfig.fields.filter((f) => f.id !== fieldId);
    updatedFields.forEach((field, i) => {
      field.order = i + 1;
    });
    updateFormConfig({ fields: updatedFields });
    setDeleteConfirm({ isOpen: false, fieldId: null, fieldLabel: "" });
  };

  const addNewField = () => {
    if (!newField.label || !newField.id) return;

    const currentConfig = getCurrentFormConfig();
    const fieldId = sanitizeId(newField.id);

    // Check if ID already exists
    if (currentConfig.fields.some((f) => f.id === fieldId)) {
      // TODO: Replace with toast notification when refactoring this nested component
      window.alert(
        "A field with this ID already exists. Please use a different ID.",
      );
      return;
    }

    const newFieldConfig: FormFieldConfig = {
      id: fieldId,
      type: (newField.type as FormFieldConfig["type"]) || "text",
      label: newField.label || "",
      placeholder: newField.placeholder || "",
      required: newField.required || false,
      enabled: true,
      order: currentConfig.fields.length + 1,
      width: (newField.width as FormFieldConfig["width"]) || "full",
    };

    // Add options if field type is select
    if (
      newField.type === "select" &&
      newField.options &&
      newField.options.length > 0
    ) {
      newFieldConfig.options = newField.options.filter(
        (opt) => opt.value && opt.label,
      );
    }

    updateFormConfig({ fields: [...currentConfig.fields, newFieldConfig] });
    setNewField({
      id: "",
      type: "text",
      label: "",
      placeholder: "",
      required: false,
      enabled: true,
      width: "full",
      options: [],
    });
    setShowAddField(false);
  };

  const currentConfig = getCurrentFormConfig();

  // Show upgrade message if module is not enabled
  if (!isDynamicFormFieldEnabled) {
    return (
      <div className="space-y-6">
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-800/30 rounded-full">
                <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  {__("Dynamic Form Field Module Required", "yatra")}
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                  {__(
                    "Customize your booking forms with drag-and-drop field builder. Add custom fields for traveler information, emergency contacts, and more. This feature requires the Dynamic Form Field module.",
                    "yatra",
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => (window.location.href = "#/modules")}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {__("Enable Module", "yatra")}
                  </Button>
                  <a
                    href="https://wpyatra.com/pricing?module=dynamic-form-field"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    {__("Learn More", "yatra")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview of what they'll get */}
        <Card className="opacity-60 pointer-events-none">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              {__("Form Builder Preview", "yatra")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Type Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4" aria-label="Form Types">
          {formTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSubTabChange(tab.id)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeFormTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Form Section Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {__("Form Section Settings", "yatra")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <input
              type="checkbox"
              id="form_section_enabled"
              checked={currentConfig.enabled !== false}
              onChange={(e) => updateFormConfig({ enabled: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label
              htmlFor="form_section_enabled"
              className="font-medium cursor-pointer"
            >
              {__("Enable this form section", "yatra")}
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="form_title">{__("Section Title", "yatra")}</Label>
              <Input
                id="form_title"
                value={currentConfig.title || ""}
                onChange={(e) => updateFormConfig({ title: e.target.value })}
                placeholder="Enter section title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="form_description">
                {__("Section Description", "yatra")}
              </Label>
              <Input
                id="form_description"
                value={currentConfig.description || ""}
                onChange={(e) =>
                  updateFormConfig({ description: e.target.value })
                }
                placeholder="Enter description"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {__("Form Fields", "yatra")}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddField(!showAddField)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {__("Add Field", "yatra")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add New Field Form */}
          {showAddField && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
              <h4 className="font-medium text-sm mb-3">
                {__("Add New Field", "yatra")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <Label className="text-xs">{__("Field Type", "yatra")}</Label>
                  <Select
                    value={newField.type || "text"}
                    onChange={(e) =>
                      setNewField((prev) => ({
                        ...prev,
                        type: e.target.value as FormFieldConfig["type"],
                      }))
                    }
                    className="mt-1"
                  >
                    {fieldTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{__("Label", "yatra")} *</Label>
                  <Input
                    value={newField.label || ""}
                    onChange={(e) => handleNewFieldLabelChange(e.target.value)}
                    placeholder="Field label"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">{__("Field ID", "yatra")} *</Label>
                  <Input
                    value={newField.id || ""}
                    onChange={(e) =>
                      setNewField((prev) => ({
                        ...prev,
                        id: sanitizeId(e.target.value),
                      }))
                    }
                    placeholder="field_id"
                    className="mt-1 font-mono text-xs"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {__("Lowercase, no spaces", "yatra")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs">
                    {__("Placeholder", "yatra")}
                  </Label>
                  <Input
                    value={newField.placeholder || ""}
                    onChange={(e) =>
                      setNewField((prev) => ({
                        ...prev,
                        placeholder: e.target.value,
                      }))
                    }
                    placeholder="Placeholder text"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">{__("Width", "yatra")}</Label>
                  <Select
                    value={newField.width || "full"}
                    onChange={(e) =>
                      setNewField((prev) => ({
                        ...prev,
                        width: e.target.value as FormFieldConfig["width"],
                      }))
                    }
                    className="mt-1"
                  >
                    {widthOptions.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              {/* Options editor for select fields */}
              {newField.type === "select" && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-900">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium">
                      {__("Dropdown Options", "yatra")}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentOptions = newField.options || [];
                        setNewField((prev) => ({
                          ...prev,
                          options: [
                            ...currentOptions,
                            { value: "", label: "" },
                          ],
                        }));
                      }}
                      className="h-6 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {__("Add Option", "yatra")}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(newField.options || []).map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <Input
                          value={option.value}
                          onChange={(e) => {
                            const newOptions = [...(newField.options || [])];
                            newOptions[optIndex] = {
                              ...newOptions[optIndex],
                              value: e.target.value,
                            };
                            setNewField((prev) => ({
                              ...prev,
                              options: newOptions,
                            }));
                          }}
                          placeholder="Value (e.g., option1)"
                          className="text-xs flex-1"
                        />
                        <Input
                          value={option.label}
                          onChange={(e) => {
                            const newOptions = [...(newField.options || [])];
                            newOptions[optIndex] = {
                              ...newOptions[optIndex],
                              label: e.target.value,
                            };
                            setNewField((prev) => ({
                              ...prev,
                              options: newOptions,
                            }));
                          }}
                          placeholder="Label (e.g., Option 1)"
                          className="text-xs flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = (newField.options || []).filter(
                              (_, i) => i !== optIndex,
                            );
                            setNewField((prev) => ({
                              ...prev,
                              options: newOptions,
                            }));
                          }}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {(!newField.options || newField.options.length === 0) && (
                      <p className="text-xs text-gray-400 italic">
                        {__(
                          'Click "Add Option" to add dropdown choices.',
                          "yatra",
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mt-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newField.required || false}
                    onChange={(e) =>
                      setNewField((prev) => ({
                        ...prev,
                        required: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  {__("Required", "yatra")}
                </label>
                <div className="flex-1"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddField(false)}
                >
                  {__("Cancel", "yatra")}
                </Button>
                <Button
                  size="sm"
                  onClick={addNewField}
                  disabled={!newField.label || !newField.id}
                >
                  {__("Add Field", "yatra")}
                </Button>
              </div>
            </div>
          )}

          {/* Field List */}
          {currentConfig.fields?.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>
                {__(
                  'No fields configured. Click "Add Field" to get started.',
                  "yatra",
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentConfig.fields?.map((field, index) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, field.id)}
                  onDragOver={(e) => handleDragOver(e, field.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, field.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                    draggedFieldId === field.id
                      ? "opacity-50 border-dashed"
                      : ""
                  } ${
                    dragOverFieldId === field.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  } ${
                    field.enabled
                      ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60"
                  }`}
                >
                  {/* Drag Handle & Order */}
                  <div className="flex items-center gap-1">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveField(field.id, "up")}
                        disabled={index === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(field.id, "down")}
                        disabled={index === currentConfig.fields.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Field Info */}
                  <div className="flex-1 min-w-0">
                    {editingField === field.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-2">
                          <Input
                            value={field.label}
                            onChange={(e) =>
                              updateField(field.id, { label: e.target.value })
                            }
                            placeholder="Label"
                            className="text-sm"
                          />
                          <Input
                            value={field.placeholder}
                            onChange={(e) =>
                              updateField(field.id, {
                                placeholder: e.target.value,
                              })
                            }
                            placeholder="Placeholder"
                            className="text-sm"
                          />
                          <Select
                            value={field.type}
                            onChange={(e) =>
                              updateField(field.id, {
                                type: e.target.value as FormFieldConfig["type"],
                              })
                            }
                            className="text-sm"
                          >
                            {fieldTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </Select>
                          <Select
                            value={field.width}
                            onChange={(e) =>
                              updateField(field.id, {
                                width: e.target
                                  .value as FormFieldConfig["width"],
                              })
                            }
                            className="text-sm"
                          >
                            {widthOptions.map((w) => (
                              <option key={w.value} value={w.value}>
                                {w.label}
                              </option>
                            ))}
                          </Select>
                        </div>

                        {/* Field ID - Below other fields */}
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                          <Label className="text-xs text-gray-500 whitespace-nowrap">
                            {__("Field ID:", "yatra")}
                          </Label>
                          <Input
                            value={field.id}
                            onChange={(e) => {
                              if (!field.locked) {
                                updateField(field.id, {
                                  id: sanitizeId(e.target.value),
                                });
                              }
                            }}
                            placeholder="field_id"
                            className="text-sm font-mono flex-1 max-w-xs"
                            disabled={field.locked}
                            title={
                              field.locked
                                ? "Locked fields cannot change ID"
                                : "Field ID (lowercase, no spaces)"
                            }
                          />
                          {field.locked && (
                            <span className="text-xs text-amber-600">
                              {__("(locked)", "yatra")}
                            </span>
                          )}
                        </div>

                        {/* Dropdown Options Editor */}
                        {field.type === "select" && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs font-medium">
                                {__("Dropdown Options", "yatra")}
                              </Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newOptions = [
                                    ...(field.options || []),
                                    { value: "", label: "" },
                                  ];
                                  updateField(field.id, {
                                    options: newOptions,
                                  });
                                }}
                                className="h-6 text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                {__("Add Option", "yatra")}
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {(field.options || []).map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center gap-2"
                                >
                                  <Input
                                    value={option.value}
                                    onChange={(e) => {
                                      const newOptions = [
                                        ...(field.options || []),
                                      ];
                                      newOptions[optIndex] = {
                                        ...newOptions[optIndex],
                                        value: e.target.value,
                                      };
                                      updateField(field.id, {
                                        options: newOptions,
                                      });
                                    }}
                                    placeholder="Value (e.g., spouse)"
                                    className="text-xs flex-1"
                                  />
                                  <Input
                                    value={option.label}
                                    onChange={(e) => {
                                      const newOptions = [
                                        ...(field.options || []),
                                      ];
                                      newOptions[optIndex] = {
                                        ...newOptions[optIndex],
                                        label: e.target.value,
                                      };
                                      updateField(field.id, {
                                        options: newOptions,
                                      });
                                    }}
                                    placeholder="Label (e.g., Spouse/Partner)"
                                    className="text-xs flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptions = (
                                        field.options || []
                                      ).filter((_, i) => i !== optIndex);
                                      updateField(field.id, {
                                        options: newOptions,
                                      });
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {(!field.options ||
                                field.options.length === 0) && (
                                <p className="text-xs text-gray-400 italic">
                                  {__(
                                    'No options. Click "Add Option" to add dropdown choices.',
                                    "yatra",
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-sm">
                          {field.label}
                        </span>
                        <code className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                          {field.id}
                        </code>
                        <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                          {fieldTypes.find((t) => t.value === field.type)
                            ?.label || field.type}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {widthOptions.find((w) => w.value === field.width)
                            ?.label || "Full"}
                        </span>
                        {field.type === "select" &&
                          field.options &&
                          field.options.length > 0 && (
                            <span className="text-xs text-blue-500 dark:text-blue-400">
                              ({field.options.length}{" "}
                              {field.options.length === 1
                                ? "option"
                                : "options"}
                              )
                            </span>
                          )}
                        {field.required && (
                          <span className="text-xs text-red-500 font-medium">
                            {__("Required", "yatra")}
                          </span>
                        )}
                        {field.locked && (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded"
                            title="This field is protected and cannot be deleted"
                          >
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        !field.locked && toggleFieldRequired(field.id)
                      }
                      disabled={field.locked}
                      className={`p-1.5 rounded ${field.locked ? "cursor-not-allowed opacity-50" : ""} ${field.required ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-gray-400 hover:text-gray-600"}`}
                      title={
                        field.locked
                          ? "This field is required and cannot be changed"
                          : field.required
                            ? "Make optional"
                            : "Make required"
                      }
                    >
                      <Star
                        className="w-4 h-4"
                        fill={field.required ? "currentColor" : "none"}
                      />
                    </button>
                    {/* Show enable/disable toggle only for non-locked fields */}
                    {!field.locked && (
                      <button
                        type="button"
                        onClick={() => toggleFieldEnabled(field.id)}
                        className={`p-1.5 rounded ${field.enabled ? "text-green-500" : "text-gray-400"}`}
                        title={field.enabled ? "Disable field" : "Enable field"}
                      >
                        {field.enabled ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setEditingField(
                          editingField === field.id ? null : field.id,
                        )
                      }
                      className="p-1.5 rounded text-gray-400 hover:text-blue-500"
                      title="Edit field"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {/* Show delete button only for non-locked fields */}
                    {!field.locked && (
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirm({
                            isOpen: true,
                            fieldId: field.id,
                            fieldLabel: field.label,
                          })
                        }
                        className="p-1.5 rounded text-gray-400 hover:text-red-500"
                        title="Delete field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, fieldId: null, fieldLabel: "" })
        }
        onConfirm={() => {
          if (deleteConfirm.fieldId) {
            deleteField(deleteConfirm.fieldId);
          }
        }}
        title={__("Delete Field", "yatra")}
        message={`Are you sure you want to delete the field "${deleteConfirm.fieldLabel}"? This action cannot be undone.`}
        confirmText={__("Delete", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
      />

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{__("Preview", "yatra")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-lg mb-1">
              {currentConfig.title || "Form Section"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {currentConfig.description}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {currentConfig.fields
                ?.filter((f) => f.enabled)
                .map((field) => (
                  <div
                    key={field.id}
                    className={
                      field.width === "full"
                        ? "col-span-2"
                        : field.width === "third"
                          ? "col-span-1"
                          : "col-span-1"
                    }
                  >
                    <Label className="text-sm">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    {field.type === "select" || field.type === "country" ? (
                      <Select disabled className="mt-1 w-full">
                        <option>{field.placeholder || "Select..."}</option>
                      </Select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        disabled
                        placeholder={field.placeholder}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-sm"
                        rows={2}
                      />
                    ) : (
                      <Input
                        disabled
                        type={field.type}
                        placeholder={field.placeholder}
                        className="mt-1"
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();

  // Get active section from localStorage or default to 'general'
  const getInitialActiveSection = (): SettingsSection => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("yatra_settings_active_section");
      if (
        saved &&
        [
          "general",
          "booking",
          "booking_form",
          "payment",
          "email",
          "trip",
          "customer",
          "review",
          "tax",
          "currency",
          "notification",
          "integration",
          "permalink",
          "advanced",
        ].includes(saved)
      ) {
        return saved as SettingsSection;
      }
    }
    return "general";
  };

  const [activeSection, setActiveSection] = useState<SettingsSection>(
    getInitialActiveSection(),
  );
  // Temporary viewing section that changes on tab click, but only becomes activeSection on save
  const [viewingSection, setViewingSection] = useState<SettingsSection>(
    getInitialActiveSection(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [expandedGateways, setExpandedGateways] = useState<
    Record<string, boolean>
  >({});
  const [gatewayOrder, setGatewayOrder] = useState<string[]>([]);
  const [draggedGateway, setDraggedGateway] = useState<string | null>(null);

  // Initialize viewingSection from activeSection on mount
  useEffect(() => {
    setViewingSection(activeSection);
  }, [activeSection]);

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/settings");
        return response;
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to load settings", "yatra"),
          "error",
        );
        throw error;
      }
    },
    enabled: can("manage_yatra"),
    // Avoid overwriting in-progress edits due to background refetches
  });

  // Cancellation settings are now saved with main settings

  // Fetch payment gateway definitions from server
  const { data: gatewayDefinitions } = useQuery<
    Record<string, GatewayDefinition>
  >({
    queryKey: ["payment-gateways-definitions"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/payment/gateways/definitions");
        return response.gateways || {};
      } catch (error: any) {
        console.error("Failed to load gateway definitions:", error);
        return {};
      }
    },
    enabled: can("manage_yatra"),
    staleTime: Infinity,
  });

  // Default settings fallback
  const defaultSettings: SettingsData = useMemo<SettingsData>(
    () => ({
      company_name: "Yatra Travel Agency",
      company_email: "info@yatra.com",
      company_phone: "+1-234-567-8900",
      company_address: "123 Travel Street",
      company_city: "Kathmandu",
      company_state: "Bagmati",
      company_country: "Nepal",
      company_zip: "44600",
      company_website: "https://yatra.com",
      company_logo: "",
      timezone: "Asia/Kathmandu",
      date_format: "Y-m-d",
      time_format: "H:i",
      language: "en",
      booking_confirmation: true,
      auto_confirm_bookings: false,
      require_login: false,
      allow_guest_checkout: true,
      cancellation_policy: "full_refund",
      cancellation_days: 7,
      refund_policy: "Full refund if cancelled 7 days before departure",
      booking_expiry_hours: 24,
      booking_reminder_days: 3,
      allow_waitlist: true,
      waitlist_auto_confirm: false,

      currency: "USD",
      payment_test_mode: true,
      payment_gateways: ["stripe", "paypal"],
      payment_methods: ["credit_card", "paypal", "bank_transfer"],
      partial_payment: true,
      partial_payment_percentage: 30,
      deposit_required: true,
      deposit_percentage: 20,
      auto_confirm_pay_later: true,
      gateway_configs: {
        stripe: {
          enabled: true,
          title: "Stripe",
          description: "Accept credit and debit cards",
          api_key: "",
          api_secret: "",
          webhook_secret: "",
        },
        paypal: {
          enabled: true,
          title: "PayPal",
          description: "Accept PayPal payments",
          client_id: "",
          client_secret: "",
        },
        razorpay: {
          enabled: false,
          title: "Razorpay",
          description: "Accept payments via Razorpay",
          api_key: "",
          api_secret: "",
        },
        square: {
          enabled: false,
          title: "Square",
          description: "Accept payments via Square",
          api_key: "",
          api_secret: "",
        },
        authorize_net: {
          enabled: false,
          title: "Authorize.net",
          description: "Accept payments via Authorize.net",
          api_key: "",
          api_secret: "",
        },
        bank_transfer: {
          enabled: false,
          title: "Bank Transfer",
          description: "Accept manual bank transfer payments",
          api_key: "", // Used for bank account name
          api_secret: "", // Used for bank account number
          public_key: "", // Used for bank name
          private_key: "", // Used for routing/SWIFT code
        },
        esewa: {
          enabled: false,
          title: "eSewa",
          description: "Accept payments via eSewa (Nepal)",
          api_key: "",
          api_secret: "",
        },
        khalti: {
          enabled: false,
          title: "Khalti",
          description: "Accept payments via Khalti (Nepal)",
          api_key: "",
          api_secret: "",
        },
        pay_later: {
          enabled: false,
          title: "Book Now, Pay Later",
          description: "Allow customers to reserve now and pay before the trip",
          api_key: "", // Used for payment deadline days
          api_secret: "", // Used for auto-cancel days
        },
      },
      gateway_order: [
        "pay_later",
        "stripe",
        "paypal",
        "razorpay",
        "square",
        "authorize_net",
        "bank_transfer",
        "esewa",
        "khalti",
      ],
      admin_email: "admin@yatra.com",
      from_email: "noreply@yatra.com",
      from_name: "Yatra Travel",
      email_template_booking: true,
      email_template_confirmation: true,
      email_template_cancellation: true,
      email_template_reminder: true,
      smtp_enabled: false,
      smtp_host: "smtp.gmail.com",
      smtp_port: 587,
      smtp_username: "",
      smtp_password: "",
      smtp_encryption: "tls",
      default_trip_status: "active",
      require_availability: true,
      max_group_size: 20,
      min_group_size: 2,
      booking_advance_days: 30,
      allow_custom_dates: false,
      require_minimum_participants: true,
      minimum_participants: 2,
      customer_registration: true,
      customer_fields: ["name", "email", "phone", "address"],
      require_email_verification: false,
      customer_account_page: "/my-account",
      allow_customer_reviews: true,
      customer_dashboard_enabled: true,
      enable_reviews: true,
      require_booking: true,
      auto_approve_reviews: false,
      review_moderation: true,
      min_rating: 1,
      allow_anonymous_reviews: false,
      review_reminder_days: 7,
      enable_tax: true,
      tax_rate: 10,
      tax_inclusive: false,
      vat_number: "",
      tax_by_country: false,
      tax_rates: {},
      default_currency: "USD",
      multi_currency: false,
      currency_position: "left",
      currency_decimals: 2,
      supported_currencies: ["USD", "EUR", "GBP"],
      auto_currency_detection: false,
      notify_new_booking: true,
      notify_payment: true,
      notify_cancellation: true,
      notify_admin: true,
      notify_customer_booking: true,
      notify_customer_payment: true,
      sms_notifications: false,
      sms_provider: "twilio",
      sms_api_key: "",
      google_analytics: "",
      facebook_pixel: "",
      google_maps_api: "",
      recaptcha_enabled: false,
      recaptcha_site_key: "",
      recaptcha_secret_key: "",
      trip_base: "trip",
      destination_base: "destination",
      activity_base: "activity",
      trip_category_base: "trip-category",
      booking_base: "book",
      use_booking_page: false,
      booking_page_id: 0,
      debug_mode: false,
      enable_logging: false,
      cache_enabled: true,
      api_key: "",
      api_rate_limit: 100,
      session_timeout: 3600,

      // Booking Form Builder
      booking_form_config: {
        contact_form: {
          title: "Lead Traveler / Contact Information",
          description: "Primary contact person for this booking",
          enabled: true,
          fields: [
            {
              id: "first_name",
              type: "text",
              label: "First Name",
              placeholder: "Enter first name",
              required: true,
              enabled: true,
              order: 1,
              width: "half",
              locked: true,
            },
            {
              id: "last_name",
              type: "text",
              label: "Last Name",
              placeholder: "Enter last name",
              required: true,
              enabled: true,
              order: 2,
              width: "half",
              locked: true,
            },
            {
              id: "email",
              type: "email",
              label: "Email Address",
              placeholder: "your@email.com",
              required: true,
              enabled: true,
              order: 3,
              width: "half",
              locked: true,
            },
            {
              id: "phone",
              type: "tel",
              label: "Phone Number",
              placeholder: "+1 234 567 8900",
              required: true,
              enabled: true,
              order: 4,
              width: "half",
              locked: true,
            },
            {
              id: "country",
              type: "country",
              label: "Country",
              placeholder: "Select Country",
              required: true,
              enabled: true,
              order: 5,
              width: "half",
              locked: true,
            },
            {
              id: "nationality",
              type: "country",
              label: "Nationality",
              placeholder: "Select Nationality",
              required: false,
              enabled: true,
              order: 6,
              width: "half",
            },
            {
              id: "address",
              type: "text",
              label: "Address",
              placeholder: "Street address (optional)",
              required: false,
              enabled: true,
              order: 7,
              width: "full",
            },
          ],
        },
        emergency_contact_form: {
          title: "Emergency Contact",
          description: "Person to contact in case of emergency",
          enabled: true,
          fields: [
            {
              id: "name",
              type: "text",
              label: "Contact Name",
              placeholder: "Full name",
              required: true,
              enabled: true,
              order: 1,
              width: "half",
            },
            {
              id: "phone",
              type: "tel",
              label: "Contact Phone",
              placeholder: "+1 234 567 8900",
              required: true,
              enabled: true,
              order: 2,
              width: "half",
            },
            {
              id: "relationship",
              type: "select",
              label: "Relationship",
              placeholder: "Select Relationship",
              required: false,
              enabled: true,
              order: 3,
              width: "full",
              options: [
                { value: "spouse", label: "Spouse/Partner" },
                { value: "parent", label: "Parent" },
                { value: "sibling", label: "Sibling" },
                { value: "child", label: "Child" },
                { value: "friend", label: "Friend" },
                { value: "other", label: "Other" },
              ],
            },
          ],
        },
        traveler_form: {
          title: "Traveler Information",
          description: "Please provide details for each traveler",
          enabled: true,
          fields: [
            {
              id: "first_name",
              type: "text",
              label: "First Name",
              placeholder: "As in passport",
              required: true,
              enabled: true,
              order: 1,
              width: "half",
            },
            {
              id: "last_name",
              type: "text",
              label: "Last Name",
              placeholder: "As in passport",
              required: true,
              enabled: true,
              order: 2,
              width: "half",
            },
            {
              id: "date_of_birth",
              type: "date",
              label: "Date of Birth",
              placeholder: "",
              required: true,
              enabled: true,
              order: 3,
              width: "half",
            },
            {
              id: "gender",
              type: "select",
              label: "Gender",
              placeholder: "Select Gender",
              required: true,
              enabled: true,
              order: 4,
              width: "half",
              options: [
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ],
            },
            {
              id: "nationality",
              type: "country",
              label: "Nationality",
              placeholder: "Select Nationality",
              required: true,
              enabled: true,
              order: 5,
              width: "full",
            },
            {
              id: "passport",
              type: "text",
              label: "Passport Number",
              placeholder: "Enter passport number",
              required: true,
              enabled: true,
              order: 6,
              width: "half",
              section: "passport",
            },
            {
              id: "passport_expiry",
              type: "date",
              label: "Passport Expiry",
              placeholder: "",
              required: true,
              enabled: true,
              order: 7,
              width: "half",
              section: "passport",
            },
            {
              id: "dietary",
              type: "select",
              label: "Dietary Requirements",
              placeholder: "Select",
              required: false,
              enabled: true,
              order: 8,
              width: "half",
              section: "dietary_medical",
              options: [
                { value: "none", label: "No special requirements" },
                { value: "vegetarian", label: "Vegetarian" },
                { value: "vegan", label: "Vegan" },
                { value: "halal", label: "Halal" },
                { value: "kosher", label: "Kosher" },
                { value: "gluten_free", label: "Gluten Free" },
                { value: "lactose_free", label: "Lactose Free" },
                { value: "other", label: "Other (specify in notes)" },
              ],
            },
            {
              id: "medical",
              type: "text",
              label: "Medical Conditions / Allergies",
              placeholder: "Any allergies or conditions",
              required: false,
              enabled: true,
              order: 9,
              width: "half",
              section: "dietary_medical",
            },
          ],
        },
      },
    }),
    [],
  );

  const [formData, setFormData] = useState<SettingsData | null>(null);
  const isInitializedRef = React.useRef(false);

  // Mailchimp state
  const [mailchimpValidating, setMailchimpValidating] = useState(false);
  const [mailchimpConnectionStatus, setMailchimpConnectionStatus] = useState<{
    connected: boolean;
    error?: string;
  } | null>(null);
  const [mailchimpLoadingLists, setMailchimpLoadingLists] = useState(false);
  const [mailchimpLists, setMailchimpLists] = useState<Array<{
    id: string;
    name: string;
  }>>([]);
  const [mailchimpMergeFields, setMailchimpMergeFields] = useState<Array<{
    tag: string;
    name: string;
    type: string;
    required: boolean;
  }>>([]);
  const [mailchimpLoadingFields, setMailchimpLoadingFields] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [validatingApiKey, setValidatingApiKey] = useState(false);
  const [showFacebookToken, setShowFacebookToken] = useState(false);
  const [showGaSecret, setShowGaSecret] = useState(false);
  
  // Facebook Pixel validation state
  const [validatingPixel, setValidatingPixel] = useState(false);
  const [validatingToken, setValidatingToken] = useState(false);
  
  // Google Analytics validation state
  const [validatingMeasurementId, setValidatingMeasurementId] = useState(false);
  const [validatingApiSecret, setValidatingApiSecret] = useState(false);

  // Mailchimp functions
  const validateMailchimpApiKey = async () => {
    if (!formData?.mailchimp_api_key) return;
    
    setValidatingApiKey(true);
    try {
      const response = await apiClient.post("/mailchimp/test", {
        api_key: formData.mailchimp_api_key
      });
      
      if (response.success) {
        // Update the yatraAdmin object with new connection status
        const updatedMailchimpData = {
          ...(window as any).yatraAdmin?.mailchimp || {},
          connectionStatus: {
            connected: true,
            error: null
          }
        };
        
        // Update the global yatraAdmin object
        if ((window as any).yatraAdmin) {
          (window as any).yatraAdmin.mailchimp = updatedMailchimpData;
        }
        
        // Update local connection status
        setMailchimpConnectionStatus({
          connected: true,
          error: null
        });
        
        // Load lists after successful validation
        await loadMailchimpLists();
      }
    } catch (error: any) {
      // Update connection status with error
      const updatedMailchimpData = {
        ...(window as any).yatraAdmin?.mailchimp || {},
        connectionStatus: {
          connected: false,
          error: error.message || __("Invalid API key", "yatra")
        }
      };
      
      if ((window as any).yatraAdmin) {
        (window as any).yatraAdmin.mailchimp = updatedMailchimpData;
      }
      
      // Update local connection status
      setMailchimpConnectionStatus({
        connected: false,
        error: error.message || __("Invalid API key", "yatra")
      });
      
      console.error("API key validation failed:", error);
    } finally {
      setValidatingApiKey(false);
    }
  };

  const loadMailchimpLists = async () => {
    setMailchimpLoadingLists(true);
    try {
      const response = await apiClient.get("/mailchimp/lists");
      
      if (response.success && response.data) {
        setMailchimpLists(response.data);
        
        // Update the yatraAdmin object with available lists
        const updatedMailchimpData = {
          ...(window as any).yatraAdmin?.mailchimp || {},
          availableLists: response.data
        };
        
        if ((window as any).yatraAdmin) {
          (window as any).yatraAdmin.mailchimp = updatedMailchimpData;
        }
      }
    } catch (error: any) {
      console.error("Error loading Mailchimp lists:", error);
      setMailchimpLists([]);
    } finally {
      setMailchimpLoadingLists(false);
    }
  };

  const loadMailchimpMergeFields = async (listId: string) => {
    if (!listId) {
      setMailchimpMergeFields([]);
      return;
    }
    
    setMailchimpLoadingFields(true);
    try {
      const response = await apiClient.get(`/mailchimp/lists/${listId}/merge-fields`);
      
      if (response.success && response.data) {
        setMailchimpMergeFields(response.data);
        
        // Update the yatraAdmin object with merge fields
        const updatedMailchimpData = {
          ...(window as any).yatraAdmin?.mailchimp || {},
          mergeFields: response.data
        };
        
        if ((window as any).yatraAdmin) {
          (window as any).yatraAdmin.mailchimp = updatedMailchimpData;
        }
      }
    } catch (error: any) {
      console.error("Error loading Mailchimp merge fields:", error);
      setMailchimpMergeFields([]);
    } finally {
      setMailchimpLoadingFields(false);
    }
  };

  // Load merge fields when list is selected
  React.useEffect(() => {
    if (formData?.mailchimp_list_id && mailchimpConnectionStatus?.connected) {
      loadMailchimpMergeFields(formData.mailchimp_list_id);
    }
  }, [formData?.mailchimp_list_id, mailchimpConnectionStatus?.connected]);

  // Initialize local connection status from global state
  React.useEffect(() => {
    if ((window as any).yatraAdmin?.mailchimp?.connectionStatus) {
      setMailchimpConnectionStatus((window as any).yatraAdmin.mailchimp.connectionStatus);
    }
  }, []);

  // Google Analytics validation functions
  const validateMeasurementId = async () => {
    if (!formData?.ga4_measurement_id) return;
    
    setValidatingMeasurementId(true);
    try {
      const response = await apiService.validateGoogleAnalyticsMeasurementId(formData.ga4_measurement_id);
      
      if (response.success) {
        showToast(__('Measurement ID validated successfully!', 'yatra'), 'success');
      } else {
        showToast(response.message || __('Measurement ID validation failed.', 'yatra'), 'error');
      }
    } catch (error: any) {
      showToast(error.message || __('Failed to validate Measurement ID.', 'yatra'), 'error');
    } finally {
      setValidatingMeasurementId(false);
    }
  };

  const validateApiSecret = async () => {
    if (!formData?.ga4_measurement_id || !formData?.ga4_api_secret) return;
    
    setValidatingApiSecret(true);
    try {
      const response = await apiService.validateGoogleAnalyticsApiSecret(
        formData.ga4_measurement_id,
        formData.ga4_api_secret
      );
      
      if (response.success) {
        showToast(__('API Secret validated successfully!', 'yatra'), 'success');
      } else {
        showToast(response.message || __('API Secret validation failed.', 'yatra'), 'error');
      }
    } catch (error: any) {
      showToast(error.message || __('Failed to validate API Secret.', 'yatra'), 'error');
    } finally {
      setValidatingApiSecret(false);
    }
  };

  // Facebook Pixel validation functions
  const validateFacebookPixel = async () => {
    if (!formData?.facebook_pixel_id) return;
    
    setValidatingPixel(true);
    try {
      const response = await apiClient.post("/facebook-pixel/test", {
        pixel_id: formData.facebook_pixel_id
      });
      
      if (response.success) {
        // Update the yatraAdmin object with new connection status
        const updatedFacebookPixelData = {
          ...(window as any).yatraAdmin?.facebookPixel || {},
          connectionStatus: {
            ...(window as any).yatraAdmin?.facebookPixel?.connectionStatus || {},
            pixelConnected: true,
            pixelError: null
          }
        };
        
        if ((window as any).yatraAdmin) {
          (window as any).yatraAdmin.facebookPixel = updatedFacebookPixelData;
        }
      }
    } catch (error: any) {
      // Update connection status with error
      const updatedFacebookPixelData = {
        ...(window as any).yatraAdmin?.facebookPixel || {},
        connectionStatus: {
          ...(window as any).yatraAdmin?.facebookPixel?.connectionStatus || {},
          pixelConnected: false,
          pixelError: error.message || __("Invalid Pixel ID", "yatra")
        }
      };
      
      if ((window as any).yatraAdmin) {
        (window as any).yatraAdmin.facebookPixel = updatedFacebookPixelData;
      }
      
      console.error("Pixel validation failed:", error);
    } finally {
      setValidatingPixel(false);
    }
  };

  const validateFacebookToken = async () => {
    if (!formData?.facebook_access_token) return;
    
    setValidatingToken(true);
    try {
      const response = await apiClient.post("/facebook-pixel/test-token", {
        access_token: formData.facebook_access_token
      });
      
      if (response.success) {
        // Update the yatraAdmin object with new connection status
        const updatedFacebookPixelData = {
          ...(window as any).yatraAdmin?.facebookPixel || {},
          connectionStatus: {
            ...(window as any).yatraAdmin?.facebookPixel?.connectionStatus || {},
            tokenConnected: true,
            tokenError: null
          }
        };
        
        if ((window as any).yatraAdmin) {
          (window as any).yatraAdmin.facebookPixel = updatedFacebookPixelData;
        }
      }
    } catch (error: any) {
      // Update connection status with error
      const updatedFacebookPixelData = {
        ...(window as any).yatraAdmin?.facebookPixel || {},
        connectionStatus: {
          ...(window as any).yatraAdmin?.facebookPixel?.connectionStatus || {},
          tokenConnected: false,
          tokenError: error.message || __("Invalid access token", "yatra")
        }
      };
      
      if ((window as any).yatraAdmin) {
        (window as any).yatraAdmin.facebookPixel = updatedFacebookPixelData;
      }
      
      console.error("Access token validation failed:", error);
    } finally {
      setValidatingToken(false);
    }
  };

  // Initialize form data only once - merge API settings with defaults
  React.useEffect(() => {
    if (isInitializedRef.current) return;

    if (settings) {
      // Merge settings with defaults, especially for gateway_configs
      const mergedSettings = {
        ...defaultSettings,
        ...settings,
        // Ensure gateway_configs from defaults are merged with any saved configs
        gateway_configs: {
          ...defaultSettings.gateway_configs,
          ...(settings.gateway_configs || {}),
        },
      };
      setFormData(mergedSettings);
      isInitializedRef.current = true;
    } else if (!isLoading && !settings) {
      // Use default settings if API fails or returns empty
      setFormData(defaultSettings);
      isInitializedRef.current = true;
    }
  }, [settings, isLoading]);

  // Initialize gateway order when gateway definitions are loaded
  React.useEffect(() => {
    if (
      gatewayDefinitions &&
      Object.keys(gatewayDefinitions).length > 0 &&
      gatewayOrder.length === 0
    ) {
      // Use saved order if available, otherwise use default order from definitions
      const savedOrder = settings?.gateway_order as string[] | undefined;
      if (savedOrder) {
        // Merge saved order with any new gateways
        const allGateways = Object.keys(gatewayDefinitions);
        const validSavedOrder = savedOrder.filter((id) =>
          allGateways.includes(id),
        );
        const newGateways = allGateways.filter(
          (id) => !validSavedOrder.includes(id),
        );
        setGatewayOrder([...validSavedOrder, ...newGateways]);
      } else {
        setGatewayOrder(Object.keys(gatewayDefinitions));
      }
    }
  }, [gatewayDefinitions, settings?.gateway_order, gatewayOrder.length]);

  // Single stable onChange handler that reads field name from input's name or id attribute
  const handleFieldChange = React.useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const field = (e.target.name || e.target.id) as keyof SettingsData;
      let value: any;

      if (e.target.type === "checkbox") {
        value = (e.target as HTMLInputElement).checked;
      } else if (e.target.type === "number") {
        const numValue = parseFloat(e.target.value);
        value = isNaN(numValue) ? 0 : numValue;
      } else {
        value = e.target.value;
      }

      setFormData((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });
    },
    [],
  );

  const handleGatewayConfigChange = React.useCallback(
    (gateway: string, field: keyof PaymentGatewayConfig, value: any) => {
      setFormData((prev) => {
        if (!prev) return prev;
        const configs = { ...(prev.gateway_configs || {}) };
        const existingConfig = configs[gateway] || {
          enabled: false,
          title: gateway,
          description: "",
        };
        configs[gateway] = { ...existingConfig, [field]: value };
        return { ...prev, gateway_configs: configs };
      });

      // Auto-expand when enabling a gateway
      if (field === "enabled" && value === true) {
        setExpandedGateways((prev) => ({ ...prev, [gateway]: true }));
      }
      // Auto-collapse when disabling a gateway
      if (field === "enabled" && value === false) {
        setExpandedGateways((prev) => ({ ...prev, [gateway]: false }));
      }
    },
    [],
  );

  const toggleGatewayExpanded = (gateway: string) => {
    setExpandedGateways((prev) => ({ ...prev, [gateway]: !prev[gateway] }));
  };

  // Gateway sorting functions
  const moveGatewayUp = (gatewayId: string) => {
    setGatewayOrder((prev) => {
      const index = prev.indexOf(gatewayId);
      if (index <= 0) return prev;
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [
        newOrder[index],
        newOrder[index - 1],
      ];
      // Save order to formData
      setFormData((current) =>
        current ? { ...current, gateway_order: newOrder } : current,
      );
      return newOrder;
    });
  };

  const moveGatewayDown = (gatewayId: string) => {
    setGatewayOrder((prev) => {
      const index = prev.indexOf(gatewayId);
      if (index < 0 || index >= prev.length - 1) return prev;
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [
        newOrder[index + 1],
        newOrder[index],
      ];
      // Save order to formData
      setFormData((current) =>
        current ? { ...current, gateway_order: newOrder } : current,
      );
      return newOrder;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, gatewayId: string) => {
    setDraggedGateway(gatewayId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetGatewayId: string) => {
    e.preventDefault();
    if (!draggedGateway || draggedGateway === targetGatewayId) {
      setDraggedGateway(null);
      return;
    }

    setGatewayOrder((prev) => {
      const dragIndex = prev.indexOf(draggedGateway);
      const dropIndex = prev.indexOf(targetGatewayId);
      if (dragIndex < 0 || dropIndex < 0) return prev;

      const newOrder = [...prev];
      newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, draggedGateway);

      // Save order to formData
      setFormData((current) =>
        current ? { ...current, gateway_order: newOrder } : current,
      );
      return newOrder;
    });
    setDraggedGateway(null);
  };

  const handleDragEnd = () => {
    setDraggedGateway(null);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsData) => {
      try {
        await apiClient.put("/settings", data);
        return data;
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to save settings", "yatra"),
          "error",
        );
        throw error;
      }
    },
    onSuccess: (savedData) => {
      queryClient.setQueryData(["settings"], savedData);
      showToast(__("Settings saved successfully", "yatra"), "success");
      setIsSaving(false);
      setFormData(savedData);
      isInitializedRef.current = true; // Keep initialized after save
    },
    onError: (error: any) => {
      setIsSaving(false);
      const errorMessage =
        error?.message || __("Error saving settings", "yatra");
      showToast(errorMessage, "error");
    },
  });

  // Flush rewrite rules mutation - must be at top level
  const flushRewriteRulesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/settings/flush-rewrite-rules");
      return response;
    },
    onSuccess: () => {
      showToast(__("Rewrite rules flushed successfully", "yatra"), "success");
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to flush rewrite rules", "yatra"),
        "error",
      );
    },
  });

  // Fetch WordPress pages for booking page selection (without shortcode check for performance)
  const { data: pagesData } = useQuery({
    queryKey: ["wordpress-pages"],
    queryFn: async () => {
      const response = await apiClient.get("/settings/pages");
      return response as Array<{
        id: number;
        title: string;
        slug: string;
        url: string;
      }>;
    },
    enabled: can("manage_yatra") && viewingSection === "permalink",
  });

  // Check shortcode on-demand when user selects a page
  const checkShortcodeMutation = useMutation({
    mutationFn: async (pageId: number) => {
      const response = await apiClient.get(
        `/settings/check-shortcode/${pageId}`,
      );
      return response as {
        has_shortcode: boolean;
        page_title: string;
        page_url: string;
        edit_url: string;
      };
    },
  });

  // Insert shortcode mutation
  const insertShortcodeMutation = useMutation({
    mutationFn: async (pageId: number) => {
      const response = await apiClient.post(
        `/settings/insert-shortcode/${pageId}`,
      );
      return response;
    },
    onSuccess: () => {
      showToast(__("Shortcode added successfully", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["wordpress-pages"] });
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to add shortcode", "yatra"),
        "error",
      );
    },
  });

  // State for shortcode dialog
  const [showShortcodeDialog, setShowShortcodeDialog] = useState(false);
  const [selectedPageForShortcode, setSelectedPageForShortcode] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [isCheckingShortcode, setIsCheckingShortcode] = useState(false);

  // Handle booking page selection - checks shortcode in real-time
  const handleBookingPageChange = async (pageId: number) => {
    if (pageId === 0) {
      handleFieldChange({
        target: { name: "booking_page_id", value: 0 },
      } as any);
      handleFieldChange({
        target: { name: "use_booking_page", value: false },
      } as any);
      return;
    }

    const page = pagesData?.find((p) => p.id === pageId);
    if (!page) return;

    // Check shortcode in real-time
    setIsCheckingShortcode(true);
    try {
      const result = await checkShortcodeMutation.mutateAsync(pageId);

      if (result.has_shortcode) {
        // Page has shortcode - save directly
        handleFieldChange({
          target: { name: "booking_page_id", value: pageId },
        } as any);
        handleFieldChange({
          target: { name: "use_booking_page", value: true },
        } as any);
        showToast(__("Booking page selected successfully", "yatra"), "success");
      } else {
        // Page doesn't have shortcode - show dialog
        setSelectedPageForShortcode({ id: pageId, title: page.title });
        setShowShortcodeDialog(true);
      }
    } catch (error: any) {
      showToast(error?.message || __("Failed to check page", "yatra"), "error");
    } finally {
      setIsCheckingShortcode(false);
    }
  };

  const handleConfirmInsertShortcode = async () => {
    if (!selectedPageForShortcode) return;

    try {
      await insertShortcodeMutation.mutateAsync(selectedPageForShortcode.id);
      handleFieldChange({
        target: { name: "booking_page_id", value: selectedPageForShortcode.id },
      } as any);
      handleFieldChange({
        target: { name: "use_booking_page", value: true },
      } as any);
      setShowShortcodeDialog(false);
      setSelectedPageForShortcode(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSave = () => {
    if (formData) {
      setIsSaving(true);

      // Include cancellation settings in formData if needed
      let updatedFormData: any = { ...formData };

      // Single API call to save all settings
      saveMutation.mutate(updatedFormData, {
        onSuccess: () => {
          // Update activeSection to the current viewingSection when save is successful
          setActiveSection(viewingSection);
          // Save to localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "yatra_settings_active_section",
              viewingSection,
            );
          }
        },
        onSettled: () => {
          setIsSaving(false);
        },
      });
    }
  };

  const settingsSections = [
    {
      id: "general" as SettingsSection,
      label: __("General", "yatra"),
      icon: Building2,
    },
    {
      id: "booking" as SettingsSection,
      label: __("Booking", "yatra"),
      icon: Calendar,
    },
    {
      id: "booking_form" as SettingsSection,
      label: __("Booking Form", "yatra"),
      icon: ClipboardList,
    },
    {
      id: "payment" as SettingsSection,
      label: __("Payment", "yatra"),
      icon: DollarSign,
    },
    { id: "email" as SettingsSection, label: __("Email", "yatra"), icon: Mail },
    { id: "trip" as SettingsSection, label: __("Trip", "yatra"), icon: MapPin },
    {
      id: "customer" as SettingsSection,
      label: __("Customer", "yatra"),
      icon: Users,
    },
    {
      id: "review" as SettingsSection,
      label: __("Review", "yatra"),
      icon: Star,
    },
    { id: "tax" as SettingsSection, label: __("Tax", "yatra"), icon: Receipt },
    {
      id: "currency" as SettingsSection,
      label: __("Currency", "yatra"),
      icon: Globe,
    },
    {
      id: "notification" as SettingsSection,
      label: __("Notification", "yatra"),
      icon: Bell,
    },
    {
      id: "integration" as SettingsSection,
      label: __("Integration", "yatra"),
      icon: Plug,
    },
    {
      id: "permalink" as SettingsSection,
      label: __("Permalink", "yatra"),
      icon: Globe,
    },
    {
      id: "advanced" as SettingsSection,
      label: __("Advanced", "yatra"),
      icon: Shield,
    },
  ];

  // Helper component for section divider
  const SectionDivider = ({ title }: { title: string }) => (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
    </div>
  );

  const renderSettingsContent = () => {
    if (!formData) return null;

    switch (viewingSection) {
      case "general":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {__("Company Information", "yatra")}
              </h3>
              <div className="space-y-4">
                <FormField
                  id="company_name"
                  label={__("Company Name", "yatra")}
                  description={__(
                    "Your travel agency or company name",
                    "yatra",
                  )}
                  required
                >
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name || ""}
                    onChange={handleFieldChange}
                    placeholder={__("Enter company name", "yatra")}
                  />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="company_email"
                    label={__("Company Email", "yatra")}
                    description={__("Primary contact email address", "yatra")}
                    required
                  >
                    <Input
                      id="company_email"
                      name="company_email"
                      type="email"
                      value={formData.company_email || ""}
                      onChange={handleFieldChange}
                      placeholder={__("company@example.com", "yatra")}
                    />
                  </FormField>

                  <FormField
                    id="company_phone"
                    label={__("Company Phone", "yatra")}
                    description={__("Primary contact phone number", "yatra")}
                  >
                    <Input
                      id="company_phone"
                      name="company_phone"
                      value={formData.company_phone || ""}
                      onChange={handleFieldChange}
                      placeholder={__("+1-234-567-8900", "yatra")}
                    />
                  </FormField>
                </div>

                <FormField
                  id="company_address"
                  label={__("Street Address", "yatra")}
                  description={__("Street address of your company", "yatra")}
                >
                  <Input
                    id="company_address"
                    name="company_address"
                    value={formData.company_address || ""}
                    onChange={handleFieldChange}
                    placeholder={__("123 Main Street", "yatra")}
                  />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField id="company_city" label={__("City", "yatra")}>
                    <Input
                      id="company_city"
                      name="company_city"
                      value={formData.company_city || ""}
                      onChange={handleFieldChange}
                      placeholder={__("City", "yatra")}
                    />
                  </FormField>

                  <FormField
                    id="company_state"
                    label={__("State/Province", "yatra")}
                  >
                    <Input
                      id="company_state"
                      name="company_state"
                      value={formData.company_state || ""}
                      onChange={handleFieldChange}
                      placeholder={__("State or Province", "yatra")}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="company_country"
                    label={__("Country", "yatra")}
                  >
                    <Input
                      id="company_country"
                      name="company_country"
                      value={formData.company_country || ""}
                      onChange={handleFieldChange}
                      placeholder={__("Country", "yatra")}
                    />
                  </FormField>

                  <FormField
                    id="company_zip"
                    label={__("ZIP/Postal Code", "yatra")}
                  >
                    <Input
                      id="company_zip"
                      value={formData.company_zip}
                      name="company_zip"
                      onChange={handleFieldChange}
                      placeholder={__("ZIP Code", "yatra")}
                    />
                  </FormField>
                </div>

                <FormField
                  id="company_website"
                  label={__("Website URL", "yatra")}
                  description={__("Your company website address", "yatra")}
                >
                  <Input
                    id="company_website"
                    type="url"
                    value={formData.company_website}
                    name="company_website"
                    onChange={handleFieldChange}
                    placeholder={__("https://example.com", "yatra")}
                  />
                </FormField>
              </div>
            </div>

            <SectionDivider title={__("Regional Settings", "yatra")} />

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  id="timezone"
                  label={__("Timezone", "yatra")}
                  description={__("Select your local timezone", "yatra")}
                >
                  <Select
                    id="timezone"
                    value={formData.timezone}
                    name="timezone"
                    onChange={handleFieldChange}
                  >
                    <option value="UTC">{__("UTC", "yatra")}</option>
                    <option value="America/New_York">
                      {__("America/New_York", "yatra")}
                    </option>
                    <option value="Europe/London">
                      {__("Europe/London", "yatra")}
                    </option>
                    <option value="Asia/Kathmandu">
                      {__("Asia/Kathmandu", "yatra")}
                    </option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                  </Select>
                </FormField>

                <FormField
                  id="date_format"
                  label={__("Date Format", "yatra")}
                  description={__("How dates are displayed", "yatra")}
                >
                  <Select
                    id="date_format"
                    value={formData.date_format}
                    name="date_format"
                    onChange={handleFieldChange}
                  >
                    <option value="Y-m-d">
                      {new Date().toLocaleDateString("en-CA")} (YYYY-MM-DD)
                    </option>
                    <option value="Y/m/d">
                      {`${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${String(new Date().getDate()).padStart(2, "0")}`}{" "}
                      (YYYY/MM/DD)
                    </option>
                    <option value="m/d/Y">
                      {`${String(new Date().getMonth() + 1).padStart(2, "0")}/${String(new Date().getDate()).padStart(2, "0")}/${new Date().getFullYear()}`}{" "}
                      (MM/DD/YYYY)
                    </option>
                    <option value="d/m/Y">
                      {`${String(new Date().getDate()).padStart(2, "0")}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`}{" "}
                      (DD/MM/YYYY)
                    </option>
                    <option value="d-m-Y">
                      {`${String(new Date().getDate()).padStart(2, "0")}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${new Date().getFullYear()}`}{" "}
                      (DD-MM-YYYY)
                    </option>
                    <option value="d.m.Y">
                      {`${String(new Date().getDate()).padStart(2, "0")}.${String(new Date().getMonth() + 1).padStart(2, "0")}.${new Date().getFullYear()}`}{" "}
                      (DD.MM.YYYY)
                    </option>
                    <option value="M j, Y">
                      {new Date().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      (Mon D, YYYY)
                    </option>
                    <option value="F j, Y">
                      {new Date().toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      (Month D, YYYY)
                    </option>
                    <option value="j M Y">
                      {`${new Date().getDate()} ${new Date().toLocaleDateString("en-US", { month: "short" })} ${new Date().getFullYear()}`}{" "}
                      (D Mon YYYY)
                    </option>
                    <option value="j F Y">
                      {`${new Date().getDate()} ${new Date().toLocaleDateString("en-US", { month: "long" })} ${new Date().getFullYear()}`}{" "}
                      (D Month YYYY)
                    </option>
                    <option value="Y M j">
                      {`${new Date().getFullYear()} ${new Date().toLocaleDateString("en-US", { month: "short" })} ${new Date().getDate()}`}{" "}
                      (YYYY Mon D)
                    </option>
                    <option value="Y F j">
                      {`${new Date().getFullYear()} ${new Date().toLocaleDateString("en-US", { month: "long" })} ${new Date().getDate()}`}{" "}
                      (YYYY Month D)
                    </option>
                    <option value="l, F j, Y">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      (Day, Month D, YYYY)
                    </option>
                    <option value="D, M j, Y">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      (Day, Mon D, YYYY)
                    </option>
                  </Select>
                </FormField>

                <FormField
                  id="time_format"
                  label={__("Time Format", "yatra")}
                  description={__("12-hour or 24-hour format", "yatra")}
                >
                  <Select
                    id="time_format"
                    value={formData.time_format}
                    name="time_format"
                    onChange={handleFieldChange}
                  >
                    <option value="H:i">24 Hour (14:30)</option>
                    <option value="h:i A">12 Hour (2:30 PM)</option>
                  </Select>
                </FormField>
              </div>

              <FormField
                id="language"
                label={__("Default Language", "yatra")}
                description={__("Default language for your website", "yatra")}
              >
                <Select
                  id="language"
                  value={formData.language}
                  name="language"
                  onChange={handleFieldChange}
                >
                  <option value="en">{__("English", "yatra")}</option>
                  <option value="es">{__("Spanish", "yatra")}</option>
                  <option value="fr">{__("French", "yatra")}</option>
                  <option value="de">{__("German", "yatra")}</option>
                  <option value="ne">{__("Nepali", "yatra")}</option>
                </Select>
              </FormField>
            </div>
          </div>
        );

      case "booking_form":
        return (
          <BookingFormBuilder formData={formData} setFormData={setFormData} />
        );

      case "payment":
        return (
          <>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  {__("Flexible Payments", "yatra")}
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    PRO
                  </span>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {__(
                    "Enable deposit and partial payment options for bookings. Allow customers to pay a percentage upfront and the rest later.",
                    "yatra",
                  )}
                </p>

                {(window as any).yatraAdmin?.isProActive &&
                (window as any).yatraAdmin?.flexiblePaymentsEnabled ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <input
                        type="checkbox"
                        id="partial_payment"
                        checked={formData.partial_payment}
                        name="partial_payment"
                        onChange={handleFieldChange}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="partial_payment"
                          className="font-medium cursor-pointer"
                        >
                          {__("Enable Partial Payment", "yatra")}
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {__(
                            "Allow customers to pay a portion now and the rest later",
                            "yatra",
                          )}
                        </p>
                      </div>
                    </div>

                    {formData.partial_payment && (
                      <FormField
                        id="partial_payment_percentage"
                        label={__("Partial Payment Percentage", "yatra")}
                        description={__(
                          "Percentage of total amount required for partial payment",
                          "yatra",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            id="partial_payment_percentage"
                            type="number"
                            value={formData.partial_payment_percentage}
                            name="partial_payment_percentage"
                            onChange={handleFieldChange}
                            min="0"
                            max="100"
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            %
                          </span>
                        </div>
                      </FormField>
                    )}

                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <input
                        type="checkbox"
                        id="deposit_required"
                        checked={formData.deposit_required}
                        name="deposit_required"
                        onChange={handleFieldChange}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="deposit_required"
                          className="font-medium cursor-pointer"
                        >
                          {__("Require Deposit", "yatra")}
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {__("Require a deposit to confirm bookings", "yatra")}
                        </p>
                      </div>
                    </div>

                    {formData.deposit_required && (
                      <FormField
                        id="deposit_percentage"
                        label={__("Deposit Percentage", "yatra")}
                        description={__(
                          "Percentage of total amount required as deposit",
                          "yatra",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            id="deposit_percentage"
                            type="number"
                            value={formData.deposit_percentage}
                            name="deposit_percentage"
                            onChange={handleFieldChange}
                            min="0"
                            max="100"
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            %
                          </span>
                        </div>
                      </FormField>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-purple-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                          {__("Upgrade to Pro for Flexible Payments", "yatra")}
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                          {__(
                            "Enable the Flexible Payments module in Yatra Pro to offer deposit and partial payment options to your customers.",
                            "yatra",
                          )}
                        </p>
                        <a
                          href="https://wpyatra.com/pricing?module=flexible-payments"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400"
                        >
                          {__("Learn More", "yatra")}
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-confirm Pay Later Bookings - Available in Free version */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="auto_confirm_pay_later"
                  checked={formData.auto_confirm_pay_later}
                  name="auto_confirm_pay_later"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="auto_confirm_pay_later"
                    className="font-medium cursor-pointer"
                  >
                    {__('Auto-confirm "Pay Later" Bookings', "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      'Automatically confirm bookings when "Book Now, Pay Later" is selected. If disabled, bookings will remain pending until payment is received.',
                      "yatra",
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <SectionDivider title={__("Payment Gateways", "yatra")} />

              {/* Global Test Mode Toggle */}
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                <input
                  type="checkbox"
                  id="payment_test_mode"
                  checked={formData.payment_test_mode}
                  name="payment_test_mode"
                  onChange={handleFieldChange}
                  className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="payment_test_mode"
                    className="font-semibold cursor-pointer text-amber-800 dark:text-amber-200"
                  >
                    {__("Test Mode", "yatra")}
                  </Label>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    {__(
                      "Enable test/sandbox mode for all payment gateways. Use test API keys for development and testing. Disable this for live payments.",
                      "yatra",
                    )}
                  </p>
                </div>
                {formData.payment_test_mode && (
                  <span className="px-2 py-1 text-xs font-semibold bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded">
                    {__("TEST", "yatra")}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                {__(
                  "Drag and drop to reorder gateways. Use arrows for precise positioning.",
                  "yatra",
                )}
              </p>

              <div className="space-y-3">
                {/* Dynamic Payment Gateway Rendering from Server - Sorted */}
                {gatewayDefinitions &&
                  gatewayOrder
                    .filter((id) => gatewayDefinitions[id])
                    .map((gatewayId, index) => {
                      const gateway = gatewayDefinitions[gatewayId];
                      const config = formData.gateway_configs?.[gatewayId] ||
                        gateway.config || { enabled: false };
                      const isExpanded = expandedGateways[gatewayId];
                      const isDragging = draggedGateway === gatewayId;

                      return (
                        <Card
                          key={gatewayId}
                          className={`border transition-all ${
                            isDragging
                              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 opacity-75"
                              : config.enabled
                                ? "border-green-200 dark:border-green-800"
                                : "border-gray-200 dark:border-gray-700"
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, gatewayId)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, gatewayId)}
                          onDragEnd={handleDragEnd}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* Drag handle */}
                                <div className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                  <GripVertical className="w-4 h-4" />
                                </div>

                                {/* Sort arrows */}
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => moveGatewayUp(gatewayId)}
                                    disabled={index === 0}
                                    className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={__("Move up", "yatra")}
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveGatewayDown(gatewayId)}
                                    disabled={index === gatewayOrder.length - 1}
                                    className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={__("Move down", "yatra")}
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>

                                <input
                                  type="checkbox"
                                  id={`gateway_enable_${gatewayId}`}
                                  checked={config.enabled || false}
                                  onChange={(e) =>
                                    handleGatewayConfigChange(
                                      gatewayId,
                                      "enabled",
                                      e.target.checked,
                                    )
                                  }
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex items-center gap-2">
                                  {gateway.icon && (
                                    <img
                                      src={gateway.icon}
                                      alt={gateway.title}
                                      className="w-6 h-6 object-contain"
                                    />
                                  )}
                                  <div>
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                      {gateway.title}
                                      {config.enabled && (
                                        <span className="text-xs font-normal px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                                          {__("Active", "yatra")}
                                        </span>
                                      )}
                                      {formData.payment_test_mode &&
                                        gateway.sandbox_url && (
                                          <a
                                            href={gateway.sandbox_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-normal px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {__("Sandbox Docs →", "yatra")}
                                          </a>
                                        )}
                                    </CardTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {gateway.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleGatewayExpanded(gatewayId)}
                                className="h-8"
                                disabled={!gateway.fields?.length}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                          {isExpanded && (
                            <CardContent className="pt-4 space-y-4 border-t border-gray-100 dark:border-gray-700">
                              {/* Info banner for offline gateways */}
                              {gateway.is_offline && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md mb-4">
                                  <p className="text-sm text-blue-700 dark:text-blue-300">
                                    {gateway.id === "pay_later"
                                      ? __(
                                          "Allow customers to book now and pay later. Payment must be completed before the trip date.",
                                          "yatra",
                                        )
                                      : __(
                                          "This is an offline payment method. Customers will be shown these details after booking.",
                                          "yatra",
                                        )}
                                  </p>
                                </div>
                              )}

                              {/* Frontend Display Settings */}
                              <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {__("Frontend Display Settings", "yatra")}
                                </h4>

                                <FormField
                                  id={`${gatewayId}_icon`}
                                  label={__("Gateway Icon", "yatra")}
                                  description={__(
                                    "Icon URL or path displayed on the booking page",
                                    "yatra",
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <Input
                                      type="text"
                                      value={config.icon || gateway.icon || ""}
                                      onChange={(e) =>
                                        handleGatewayConfigChange(
                                          gatewayId,
                                          "icon",
                                          e.target.value,
                                        )
                                      }
                                      placeholder={__(
                                        "Enter icon URL or leave empty to use default",
                                        "yatra",
                                      )}
                                      className="flex-1"
                                    />
                                    {config.icon || gateway.icon ? (
                                      <img
                                        src={config.icon || gateway.icon}
                                        alt={gateway.title}
                                        className="w-10 h-10 object-contain border border-gray-300 dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-800"
                                        onError={(e) => {
                                          (
                                            e.target as HTMLImageElement
                                          ).style.display = "none";
                                        }}
                                      />
                                    ) : null}
                                  </div>
                                </FormField>

                                <FormField
                                  id={`${gatewayId}_title`}
                                  label={__("Gateway Title", "yatra")}
                                  description={__(
                                    "Title displayed on the booking page",
                                    "yatra",
                                  )}
                                >
                                  <Input
                                    type="text"
                                    value={config.title || gateway.title || ""}
                                    onChange={(e) =>
                                      handleGatewayConfigChange(
                                        gatewayId,
                                        "title",
                                        e.target.value,
                                      )
                                    }
                                    placeholder={
                                      gateway.title ||
                                      __("Enter gateway title", "yatra")
                                    }
                                  />
                                </FormField>

                                <FormField
                                  id={`${gatewayId}_description`}
                                  label={__("Gateway Description", "yatra")}
                                  description={__(
                                    "Description displayed below the title on the booking page",
                                    "yatra",
                                  )}
                                >
                                  <textarea
                                    value={
                                      config.description ||
                                      gateway.description ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleGatewayConfigChange(
                                        gatewayId,
                                        "description",
                                        e.target.value,
                                      )
                                    }
                                    placeholder={
                                      gateway.description ||
                                      __("Enter gateway description", "yatra")
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={2}
                                  />
                                </FormField>
                              </div>

                              {/* Dynamic field rendering */}
                              {gateway.fields && gateway.fields.length > 0 && (
                                <div className="space-y-4">
                                  {gateway.fields.map((field: GatewayField) => {
                                    // Check conditional visibility (legacy condition)
                                    if (
                                      field.condition &&
                                      !config[field.condition]
                                    ) {
                                      return null;
                                    }

                                    // Check show_when conditional visibility
                                    if (field.show_when) {
                                      const shouldShow = Object.entries(
                                        field.show_when,
                                      ).every(
                                        ([key, value]) =>
                                          (config[key] ||
                                            gateway.fields.find(
                                              (f) => f.id === key,
                                            )?.default) === value,
                                      );
                                      if (!shouldShow) {
                                        return null;
                                      }
                                    }

                                    // Render checkbox fields differently
                                    if (field.type === "checkbox") {
                                      return (
                                        <div
                                          key={field.id}
                                          className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md"
                                        >
                                          <input
                                            type="checkbox"
                                            id={`${gatewayId}_${field.id}`}
                                            checked={config[field.id] || false}
                                            onChange={(e) =>
                                              handleGatewayConfigChange(
                                                gatewayId,
                                                field.id,
                                                e.target.checked,
                                              )
                                            }
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          />
                                          <Label
                                            htmlFor={`${gatewayId}_${field.id}`}
                                            className="font-normal cursor-pointer"
                                          >
                                            {field.label}{" "}
                                            {field.description &&
                                              `- ${field.description}`}
                                          </Label>
                                        </div>
                                      );
                                    }

                                    // Render textarea
                                    if (field.type === "textarea") {
                                      return (
                                        <FormField
                                          key={field.id}
                                          id={`${gatewayId}_${field.id}`}
                                          label={field.label}
                                          description={field.description}
                                        >
                                          <textarea
                                            value={
                                              config[field.id] ||
                                              field.default ||
                                              ""
                                            }
                                            onChange={(e) =>
                                              handleGatewayConfigChange(
                                                gatewayId,
                                                field.id,
                                                e.target.value,
                                              )
                                            }
                                            placeholder={field.placeholder}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            rows={3}
                                          />
                                        </FormField>
                                      );
                                    }

                                    // Special handling for Stripe enabled payment methods (multi-select UI)
                                    if (
                                      gateway.id === "stripe" &&
                                      field.id === "enabled_methods"
                                    ) {
                                      const rawValue = config[field.id];
                                      const selectedValues = Array.isArray(
                                        rawValue,
                                      )
                                        ? rawValue
                                        : typeof rawValue === "string" &&
                                            rawValue.length > 0
                                          ? rawValue
                                              .split(",")
                                              .map((val) => val.trim())
                                              .filter(Boolean)
                                          : ["card", "google_pay", "apple_pay"];

                                      const methodOptions: MultiSelectOption[] =
                                        [
                                          {
                                            value: "card",
                                            label: __(
                                              "Card (Stripe Elements)",
                                              "yatra",
                                            ),
                                          },
                                          {
                                            value: "google_pay",
                                            label: __(
                                              "Google Pay (Payment Request Button)",
                                              "yatra",
                                            ),
                                          },
                                          {
                                            value: "apple_pay",
                                            label: __(
                                              "Apple Pay (Payment Request Button)",
                                              "yatra",
                                            ),
                                          },
                                        ];

                                      const handleStripeMethodsChange = (
                                        values: (string | number)[],
                                      ) => {
                                        handleGatewayConfigChange(
                                          gatewayId,
                                          field.id,
                                          values.join(","),
                                        );
                                      };

                                      return (
                                        <div
                                          key={field.id}
                                          className="space-y-2"
                                        >
                                          <FormField
                                            id={`${gatewayId}_${field.id}`}
                                            label={field.label}
                                            description={field.description}
                                          >
                                            <MultiSelect
                                              value={selectedValues}
                                              onChange={
                                                handleStripeMethodsChange
                                              }
                                              options={methodOptions}
                                              placeholder={__(
                                                "Select payment methods...",
                                                "yatra",
                                              )}
                                            />
                                          </FormField>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {__(
                                              "Apple Pay requires domain verification inside your Stripe Dashboard.",
                                              "yatra",
                                            )}
                                            {(field.help_url ||
                                              field.help_url_test ||
                                              field.help_url_live) && (
                                              <a
                                                href={
                                                  formData.payment_test_mode
                                                    ? field.help_url_test ||
                                                      field.help_url
                                                    : field.help_url_live ||
                                                      field.help_url
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-1 border-b border-blue-600 dark:border-blue-400 hover:border-transparent"
                                              >
                                                {__("Learn more →", "yatra")}
                                              </a>
                                            )}
                                          </p>
                                        </div>
                                      );
                                    }

                                    // Render multiselect fields (for Mollie, Paystack, etc.)
                                    if (
                                      field.type === "multiselect" &&
                                      field.options
                                    ) {
                                      const rawValue = config[field.id];
                                      const selectedValues = Array.isArray(
                                        rawValue,
                                      )
                                        ? rawValue
                                        : typeof rawValue === "string" &&
                                            rawValue.length > 0
                                          ? rawValue
                                              .split(",")
                                              .map((val: string) => val.trim())
                                              .filter(Boolean)
                                          : Array.isArray(field.default)
                                            ? field.default
                                            : [];

                                      const methodOptions: MultiSelectOption[] =
                                        Object.entries(field.options).map(
                                          ([value, label]) => ({
                                            value,
                                            label: String(label),
                                          }),
                                        );

                                      const handleMultiSelectChange = (
                                        values: (string | number)[],
                                      ) => {
                                        handleGatewayConfigChange(
                                          gatewayId,
                                          field.id,
                                          values,
                                        );
                                      };

                                      return (
                                        <div
                                          key={field.id}
                                          className="space-y-2"
                                        >
                                          <FormField
                                            id={`${gatewayId}_${field.id}`}
                                            label={field.label}
                                            description={field.description}
                                          >
                                            <MultiSelect
                                              value={selectedValues}
                                              onChange={handleMultiSelectChange}
                                              options={methodOptions}
                                              placeholder={__(
                                                "Select options...",
                                                "yatra",
                                              )}
                                            />
                                          </FormField>
                                          {field.help_text && (
                                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                              {field.help_text}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    }

                                    // Render select/dropdown fields
                                    if (
                                      field.type === "select" &&
                                      field.options
                                    ) {
                                      return (
                                        <div
                                          key={field.id}
                                          className="space-y-2"
                                        >
                                          <FormField
                                            id={`${gatewayId}_${field.id}`}
                                            label={field.label}
                                            description={field.description}
                                          >
                                            <Select
                                              value={
                                                config[field.id] ??
                                                field.default ??
                                                ""
                                              }
                                              onChange={(e) =>
                                                handleGatewayConfigChange(
                                                  gatewayId,
                                                  field.id,
                                                  e.target.value,
                                                )
                                              }
                                            >
                                              {Object.entries(
                                                field.options,
                                              ).map(([value, label]) => (
                                                <option
                                                  key={value}
                                                  value={value}
                                                >
                                                  {label}
                                                </option>
                                              ))}
                                            </Select>
                                          </FormField>
                                          {field.help_text && (
                                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                              {field.help_text}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    }

                                    // Render text, password, number, email inputs
                                    return (
                                      <div key={field.id} className="space-y-2">
                                        <FormField
                                          id={`${gatewayId}_${field.id}`}
                                          label={field.label}
                                          description={field.description}
                                        >
                                          <Input
                                            type={
                                              field.type === "email"
                                                ? "email"
                                                : field.type
                                            }
                                            value={
                                              config[field.id] ??
                                              field.default ??
                                              ""
                                            }
                                            onChange={(e) =>
                                              handleGatewayConfigChange(
                                                gatewayId,
                                                field.id,
                                                field.type === "number"
                                                  ? parseFloat(
                                                      e.target.value,
                                                    ) || 0
                                                  : e.target.value,
                                              )
                                            }
                                            placeholder={field.placeholder}
                                            min={field.min}
                                            max={field.max}
                                          />
                                        </FormField>
                                        {field.help_text && (
                                          <p className="text-xs text-blue-600 dark:text-blue-400">
                                            {field.help_text}
                                            {(field.help_url ||
                                              field.help_url_test ||
                                              field.help_url_live) && (
                                              <a
                                                href={
                                                  formData.payment_test_mode
                                                    ? field.help_url_test ||
                                                      field.help_url
                                                    : field.help_url_live ||
                                                      field.help_url
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-1 border-b border-blue-600 dark:border-blue-400 hover:border-transparent transition-colors"
                                              >
                                                {__("Learn more →", "yatra")}
                                              </a>
                                            )}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}

                {/* Show message if no gateways loaded */}
                {(!gatewayDefinitions ||
                  Object.keys(gatewayDefinitions).length === 0) && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>{__("Loading payment gateways...", "yatra")}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        );

      // Continue with other sections... (I'll add the most important ones)
      case "booking":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="booking_confirmation"
                  checked={formData.booking_confirmation}
                  name="booking_confirmation"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="booking_confirmation"
                    className="font-medium cursor-pointer"
                  >
                    {__("Enable Booking Confirmation", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Send confirmation emails when bookings are made",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="auto_confirm_bookings"
                  checked={formData.auto_confirm_bookings}
                  name="auto_confirm_bookings"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="auto_confirm_bookings"
                    className="font-medium cursor-pointer"
                  >
                    {__("Auto-Confirm Bookings", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Automatically confirm bookings without manual approval",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="require_login"
                  checked={formData.require_login}
                  name="require_login"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="require_login"
                    className="font-medium cursor-pointer"
                  >
                    {__("Require Login for Booking", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Customers must create an account to make bookings",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="allow_guest_checkout"
                  checked={formData.allow_guest_checkout}
                  name="allow_guest_checkout"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="allow_guest_checkout"
                    className="font-medium cursor-pointer"
                  >
                    {__("Allow Guest Checkout", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Allow customers to book without creating an account",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>
            </div>

            <SectionDivider
              title={__("Cancellation & Refund Policy", "yatra")}
            />

            <div className="space-y-4">
              <FormField
                id="cancellation_policy"
                label={__("Cancellation Policy", "yatra")}
                description={__(
                  "What happens when a booking is cancelled",
                  "yatra",
                )}
              >
                <Select
                  id="cancellation_policy"
                  value={formData.cancellation_policy}
                  name="cancellation_policy"
                  onChange={handleFieldChange}
                >
                  <option value="no_refund">{__("No Refund", "yatra")}</option>
                  <option value="full_refund">
                    {__("Full Refund", "yatra")}
                  </option>
                  <option value="partial_refund">
                    {__("Partial Refund", "yatra")}
                  </option>
                </Select>
              </FormField>

              <FormField
                id="cancellation_days"
                label={__("Cancellation Days Before Departure", "yatra")}
                description={__(
                  "Number of days before departure when cancellation is allowed",
                  "yatra",
                )}
              >
                <Input
                  id="cancellation_days"
                  type="number"
                  value={formData.cancellation_days}
                  name="cancellation_days"
                  onChange={handleFieldChange}
                  min="0"
                />
              </FormField>

              <FormField
                id="refund_policy"
                label={__("Refund Policy", "yatra")}
                description={__(
                  "Detailed refund policy description shown to customers",
                  "yatra",
                )}
              >
                <textarea
                  id="refund_policy"
                  value={formData.refund_policy}
                  name="refund_policy"
                  onChange={handleFieldChange}
                  rows={4}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                  placeholder={__(
                    "Enter your refund policy details...",
                    "yatra",
                  )}
                />
              </FormField>
            </div>

            <SectionDivider title={__("Booking Expiry & Reminders", "yatra")} />

            <div className="space-y-4">
              <FormField
                id="booking_expiry_hours"
                label={__("Booking Expiry Hours", "yatra")}
                description={__(
                  "Hours before unpaid bookings expire and are cancelled",
                  "yatra",
                )}
              >
                <Input
                  id="booking_expiry_hours"
                  type="number"
                  value={formData.booking_expiry_hours}
                  name="booking_expiry_hours"
                  onChange={handleFieldChange}
                  min="1"
                />
              </FormField>

              <FormField
                id="booking_reminder_days"
                label={__("Booking Reminder Days", "yatra")}
                description={__(
                  "Send reminder emails this many days before departure",
                  "yatra",
                )}
              >
                <Input
                  id="booking_reminder_days"
                  type="number"
                  value={formData.booking_reminder_days}
                  name="booking_reminder_days"
                  onChange={handleFieldChange}
                  min="0"
                />
              </FormField>
            </div>
          </div>
        );

      case "email":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {__("Email Configuration", "yatra")}
              </h3>
              <div className="space-y-4">
                <FormField
                  id="admin_email"
                  label={__("Admin Email", "yatra")}
                  description={__(
                    "Email address to receive admin notifications",
                    "yatra",
                  )}
                  required
                >
                  <Input
                    id="admin_email"
                    type="email"
                    value={formData.admin_email}
                    name="admin_email"
                    onChange={handleFieldChange}
                    placeholder={__("admin@example.com", "yatra")}
                  />
                </FormField>

                <FormField
                  id="from_email"
                  label={__("From Email", "yatra")}
                  description={__(
                    "Email address used as sender for customer emails",
                    "yatra",
                  )}
                  required
                >
                  <Input
                    id="from_email"
                    type="email"
                    value={formData.from_email}
                    name="from_email"
                    onChange={handleFieldChange}
                    placeholder={__("noreply@example.com", "yatra")}
                  />
                </FormField>

                <FormField
                  id="from_name"
                  label={__("From Name", "yatra")}
                  description={__(
                    "Name displayed as sender in customer emails",
                    "yatra",
                  )}
                >
                  <Input
                    id="from_name"
                    value={formData.from_name}
                    name="from_name"
                    onChange={handleFieldChange}
                    placeholder={__("Your Company Name", "yatra")}
                  />
                </FormField>
              </div>
            </div>

            <SectionDivider title={__("Email Templates", "yatra")} />

            <div className="space-y-3">
              {[
                {
                  id: "email_template_booking",
                  label: __("Booking Confirmation Email", "yatra"),
                  desc: __("Send email when booking is confirmed", "yatra"),
                },
                {
                  id: "email_template_confirmation",
                  label: __("Payment Confirmation Email", "yatra"),
                  desc: __("Send email when payment is received", "yatra"),
                },
                {
                  id: "email_template_cancellation",
                  label: __("Cancellation Email", "yatra"),
                  desc: __("Send email when booking is cancelled", "yatra"),
                },
                {
                  id: "email_template_reminder",
                  label: __("Booking Reminder Email", "yatra"),
                  desc: __("Send reminder email before departure", "yatra"),
                },
              ].map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <input
                    type="checkbox"
                    id={template.id}
                    checked={
                      formData[template.id as keyof SettingsData] as boolean
                    }
                    name={template.id}
                    onChange={handleFieldChange}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={template.id}
                      className="font-medium cursor-pointer"
                    >
                      {template.label}
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {template.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <SectionDivider title={__("SMTP Settings (Optional)", "yatra")} />

            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="smtp_enabled"
                  checked={formData.smtp_enabled}
                  name="smtp_enabled"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="smtp_enabled"
                    className="font-medium cursor-pointer"
                  >
                    {__("Enable SMTP", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Use custom SMTP server instead of default WordPress mail",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>

              {formData.smtp_enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      id="smtp_host"
                      label={__("SMTP Host", "yatra")}
                      description={__("SMTP server address", "yatra")}
                    >
                      <Input
                        id="smtp_host"
                        value={formData.smtp_host}
                        name="smtp_host"
                        onChange={handleFieldChange}
                        placeholder="smtp.gmail.com"
                      />
                    </FormField>

                    <FormField
                      id="smtp_port"
                      label={__("SMTP Port", "yatra")}
                      description={__(
                        "SMTP server port (usually 587 or 465)",
                        "yatra",
                      )}
                    >
                      <Input
                        id="smtp_port"
                        type="number"
                        value={formData.smtp_port}
                        name="smtp_port"
                        onChange={handleFieldChange}
                        placeholder="587"
                      />
                    </FormField>
                  </div>

                  <FormField
                    id="smtp_encryption"
                    label={__("Encryption", "yatra")}
                    description={__("Connection encryption type", "yatra")}
                  >
                    <Select
                      id="smtp_encryption"
                      value={formData.smtp_encryption}
                      name="smtp_encryption"
                      onChange={handleFieldChange}
                    >
                      <option value="tls">{__("TLS", "yatra")}</option>
                      <option value="ssl">{__("SSL", "yatra")}</option>
                      <option value="none">{__("None", "yatra")}</option>
                    </Select>
                  </FormField>

                  <FormField
                    id="smtp_username"
                    label={__("SMTP Username", "yatra")}
                    description={__("Your SMTP account username", "yatra")}
                  >
                    <Input
                      id="smtp_username"
                      value={formData.smtp_username}
                      name="smtp_username"
                      onChange={handleFieldChange}
                      placeholder={__("your-email@gmail.com", "yatra")}
                    />
                  </FormField>

                  <FormField
                    id="smtp_password"
                    label={__("SMTP Password", "yatra")}
                    description={__(
                      "Your SMTP account password or app password",
                      "yatra",
                    )}
                  >
                    <Input
                      id="smtp_password"
                      type="password"
                      value={formData.smtp_password}
                      name="smtp_password"
                      onChange={handleFieldChange}
                      placeholder={__("Enter SMTP password", "yatra")}
                    />
                  </FormField>
                </>
              )}
            </div>
          </div>
        );

      case "trip":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <FormField
                id="default_trip_status"
                label={__("Default Trip Status", "yatra")}
                description={__(
                  "Status assigned to new trips by default",
                  "yatra",
                )}
              >
                <Select
                  id="default_trip_status"
                  value={formData.default_trip_status}
                  name="default_trip_status"
                  onChange={handleFieldChange}
                >
                  <option value="draft">{__("Draft", "yatra")}</option>
                  <option value="active">{__("Active", "yatra")}</option>
                  <option value="inactive">{__("Inactive", "yatra")}</option>
                </Select>
              </FormField>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="require_availability"
                  checked={formData.require_availability}
                  name="require_availability"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="require_availability"
                    className="font-medium cursor-pointer"
                  >
                    {__("Require Availability Check", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Check trip availability before allowing bookings",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  id="max_group_size"
                  label={__("Maximum Group Size", "yatra")}
                  description={__(
                    "Maximum number of participants per booking",
                    "yatra",
                  )}
                >
                  <Input
                    id="max_group_size"
                    type="number"
                    value={formData.max_group_size}
                    name="max_group_size"
                    onChange={handleFieldChange}
                    min="1"
                  />
                </FormField>

                <FormField
                  id="min_group_size"
                  label={__("Minimum Group Size", "yatra")}
                  description={__(
                    "Minimum number of participants required",
                    "yatra",
                  )}
                >
                  <Input
                    id="min_group_size"
                    type="number"
                    value={formData.min_group_size}
                    name="min_group_size"
                    onChange={handleFieldChange}
                    min="1"
                  />
                </FormField>
              </div>

              <FormField
                id="booking_advance_days"
                label={__("Maximum Booking Advance Days", "yatra")}
                description={__(
                  "How many days in advance customers can book",
                  "yatra",
                )}
              >
                <Input
                  id="booking_advance_days"
                  type="number"
                  value={formData.booking_advance_days}
                  name="booking_advance_days"
                  onChange={handleFieldChange}
                  min="1"
                />
              </FormField>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="allow_custom_dates"
                  checked={formData.allow_custom_dates}
                  name="allow_custom_dates"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="allow_custom_dates"
                    className="font-medium cursor-pointer"
                  >
                    {__("Allow Custom Dates", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Allow customers to request custom departure dates",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="require_minimum_participants"
                  checked={formData.require_minimum_participants}
                  name="require_minimum_participants"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="require_minimum_participants"
                    className="font-medium cursor-pointer"
                  >
                    {__("Require Minimum Participants", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Trip requires minimum participants to proceed",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>

              {formData.require_minimum_participants && (
                <FormField
                  id="minimum_participants"
                  label={__("Minimum Participants", "yatra")}
                  description={__(
                    "Minimum number of participants required for trip to proceed",
                    "yatra",
                  )}
                >
                  <Input
                    id="minimum_participants"
                    type="number"
                    value={formData.minimum_participants}
                    name="minimum_participants"
                    onChange={handleFieldChange}
                    min="1"
                  />
                </FormField>
              )}
            </div>
          </div>
        );

      case "customer":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="customer_registration"
                  checked={formData.customer_registration}
                  name="customer_registration"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="customer_registration"
                    className="font-medium cursor-pointer"
                  >
                    {__("Enable Customer Registration", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Allow customers to create accounts on your website",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>

              <FormField
                id="customer_account_page"
                label={__("Customer Account Page", "yatra")}
                description={__(
                  "URL slug for customer account page (e.g., /my-account)",
                  "yatra",
                )}
              >
                <div className="flex items-center gap-2">
                  <Input
                    id="customer_account_page"
                    value={formData.customer_account_page}
                    name="customer_account_page"
                    onChange={handleFieldChange}
                    placeholder="/my-account"
                    className="flex-1"
                  />
                  {formData.customer_account_page &&
                    (() => {
                      const siteUrl = (window as any).yatraAdmin?.siteUrl || "";
                      const slug = formData.customer_account_page.trim();
                      // Ensure slug starts with / for proper URL construction
                      const accountSlug = slug.startsWith("/")
                        ? slug
                        : "/" + slug;
                      // Construct URL: siteUrl + slug (WordPress will handle permalink structure)
                      const accountUrl =
                        siteUrl.replace(/\/$/, "") + accountSlug;
                      return (
                        <a
                          href={accountUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          {__("View Page", "yatra")} →
                        </a>
                      );
                    })()}
                </div>
              </FormField>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="require_email_verification"
                  checked={formData.require_email_verification}
                  name="require_email_verification"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="require_email_verification"
                    className="font-medium cursor-pointer"
                  >
                    {__("Require Email Verification", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Customers must verify their email before account activation",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="customer_dashboard_enabled"
                  checked={formData.customer_dashboard_enabled}
                  name="customer_dashboard_enabled"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="customer_dashboard_enabled"
                    className="font-medium cursor-pointer"
                  >
                    {__("Enable Customer Dashboard", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Show dashboard with bookings and account information",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>
            </div>

            <SectionDivider title={__("Customer Fields", "yatra")} />

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {__(
                  "Select which fields to collect from customers during registration",
                  "yatra",
                )}
              </p>
              {[
                "name",
                "email",
                "phone",
                "address",
                "city",
                "country",
                "date_of_birth",
              ].map((field) => (
                <div
                  key={field}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <input
                    type="checkbox"
                    id={`field_${field}`}
                    checked={formData.customer_fields.includes(field)}
                    onChange={(e) => {
                      const fields = e.target.checked
                        ? [...formData.customer_fields, field]
                        : formData.customer_fields.filter((f) => f !== field);
                      setFormData((prev) =>
                        prev ? { ...prev, customer_fields: fields } : prev,
                      );
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor={`field_${field}`}
                    className="font-normal cursor-pointer"
                  >
                    {field.charAt(0).toUpperCase() +
                      field.slice(1).replace("_", " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="enable_reviews"
                  checked={formData.enable_reviews}
                  name="enable_reviews"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="enable_reviews"
                    className="font-medium cursor-pointer"
                  >
                    {__("Enable Reviews", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Allow customers to leave reviews and ratings",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>

              {formData.enable_reviews && (
                <>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <input
                      type="checkbox"
                      id="require_booking"
                      checked={formData.require_booking}
                      name="require_booking"
                      onChange={handleFieldChange}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="require_booking"
                        className="font-medium cursor-pointer"
                      >
                        {__("Require Booking to Review", "yatra")}
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {__(
                          "Only customers who have booked can leave reviews",
                          "yatra",
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <input
                      type="checkbox"
                      id="auto_approve_reviews"
                      checked={formData.auto_approve_reviews}
                      name="auto_approve_reviews"
                      onChange={handleFieldChange}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="auto_approve_reviews"
                        className="font-medium cursor-pointer"
                      >
                        {__("Auto-Approve Reviews", "yatra")}
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {__(
                          "Automatically publish reviews without moderation",
                          "yatra",
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <input
                      type="checkbox"
                      id="review_moderation"
                      checked={formData.review_moderation}
                      name="review_moderation"
                      onChange={handleFieldChange}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="review_moderation"
                        className="font-medium cursor-pointer"
                      >
                        {__("Enable Review Moderation", "yatra")}
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {__(
                          "Manually approve reviews before they are published",
                          "yatra",
                        )}
                      </p>
                    </div>
                  </div>

                  <FormField
                    id="min_rating"
                    label={__("Minimum Rating", "yatra")}
                    description={__(
                      "Lowest rating value allowed (1-5 stars)",
                      "yatra",
                    )}
                  >
                    <Select
                      id="min_rating"
                      value={formData.min_rating}
                      name="min_rating"
                      onChange={handleFieldChange}
                    >
                      <option value="1">1 {__("Star", "yatra")}</option>
                      <option value="2">2 {__("Stars", "yatra")}</option>
                      <option value="3">3 {__("Stars", "yatra")}</option>
                      <option value="4">4 {__("Stars", "yatra")}</option>
                      <option value="5">5 {__("Stars", "yatra")}</option>
                    </Select>
                  </FormField>

                  <FormField
                    id="review_reminder_days"
                    label={__("Review Reminder Days", "yatra")}
                    description={__(
                      "Send review reminder email this many days after trip completion",
                      "yatra",
                    )}
                  >
                    <Input
                      id="review_reminder_days"
                      type="number"
                      value={formData.review_reminder_days}
                      name="review_reminder_days"
                      onChange={handleFieldChange}
                      min="0"
                    />
                  </FormField>
                </>
              )}
            </div>
          </div>
        );

      case "tax":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="enable_tax"
                  checked={formData.enable_tax}
                  name="enable_tax"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="enable_tax"
                    className="font-medium cursor-pointer"
                  >
                    {__("Enable Tax", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__("Add tax to booking prices", "yatra")}
                  </p>
                </div>
              </div>

              {formData.enable_tax && (
                <>
                  <FormField
                    id="tax_rate"
                    label={__("Tax Rate (%)", "yatra")}
                    description={__("Default tax rate percentage", "yatra")}
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        id="tax_rate"
                        type="number"
                        value={formData.tax_rate}
                        name="tax_rate"
                        onChange={handleFieldChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        %
                      </span>
                    </div>
                  </FormField>

                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <input
                      type="checkbox"
                      id="tax_inclusive"
                      checked={formData.tax_inclusive}
                      name="tax_inclusive"
                      onChange={handleFieldChange}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="tax_inclusive"
                        className="font-medium cursor-pointer"
                      >
                        {__("Tax Inclusive Pricing", "yatra")}
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {__("Tax is included in displayed prices", "yatra")}
                      </p>
                    </div>
                  </div>

                  <FormField
                    id="vat_number"
                    label={__("VAT Number", "yatra")}
                    description={__(
                      "Your company VAT or tax identification number",
                      "yatra",
                    )}
                  >
                    <Input
                      id="vat_number"
                      value={formData.vat_number}
                      name="vat_number"
                      onChange={handleFieldChange}
                      placeholder={__("Enter VAT number", "yatra")}
                    />
                  </FormField>
                </>
              )}
            </div>
          </div>
        );

      case "currency":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <FormField
                id="currency"
                label={__("Default Currency", "yatra")}
                description={__(
                  "Primary currency for all transactions",
                  "yatra",
                )}
                required
              >
                <SearchableSelect
                  value={formData.currency}
                  onChange={(val) =>
                    setFormData((prev) =>
                      prev ? { ...prev, currency: val } : prev,
                    )
                  }
                  options={getCurrencyOptions()}
                  placeholder={__("Select currency...", "yatra")}
                  searchPlaceholder={__("Search currencies...", "yatra")}
                  showValueId={false}
                />
              </FormField>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="multi_currency"
                  checked={formData.multi_currency}
                  name="multi_currency"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="multi_currency"
                    className="font-medium cursor-pointer"
                  >
                    {__("Enable Multi-Currency", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Allow customers to view prices in different currencies",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>

              <FormField
                id="currency_position"
                label={__("Currency Position", "yatra")}
                description={__(
                  "Where to display currency symbol relative to amount",
                  "yatra",
                )}
              >
                <Select
                  id="currency_position"
                  value={formData.currency_position}
                  name="currency_position"
                  onChange={handleFieldChange}
                >
                  <option value="left">$100 (Left)</option>
                  <option value="right">100$ (Right)</option>
                  <option value="left_space">$ 100 (Left with Space)</option>
                  <option value="right_space">100 $ (Right with Space)</option>
                </Select>
              </FormField>

              <FormField
                id="currency_decimals"
                label={__("Decimal Places", "yatra")}
                description={__(
                  "Number of decimal places to show in prices",
                  "yatra",
                )}
              >
                <Input
                  id="currency_decimals"
                  type="number"
                  value={formData.currency_decimals}
                  name="currency_decimals"
                  onChange={handleFieldChange}
                  min="0"
                  max="4"
                />
              </FormField>
            </div>
          </div>
        );

      case "notification":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {__("Email Notifications", "yatra")}
              </h3>
              <div className="space-y-3">
                {[
                  {
                    id: "notify_new_booking",
                    label: __("Notify on New Booking", "yatra"),
                    desc: __("Send email when new booking is created", "yatra"),
                  },
                  {
                    id: "notify_payment",
                    label: __("Notify on Payment", "yatra"),
                    desc: __("Send email when payment is received", "yatra"),
                  },
                  {
                    id: "notify_cancellation",
                    label: __("Notify on Cancellation", "yatra"),
                    desc: __("Send email when booking is cancelled", "yatra"),
                  },
                  {
                    id: "notify_admin",
                    label: __("Notify Admin on All Events", "yatra"),
                    desc: __(
                      "Admin receives notifications for all booking events",
                      "yatra",
                    ),
                  },
                  {
                    id: "notify_customer_booking",
                    label: __("Notify Customer on Booking", "yatra"),
                    desc: __("Send confirmation email to customer", "yatra"),
                  },
                  {
                    id: "notify_customer_payment",
                    label: __("Notify Customer on Payment", "yatra"),
                    desc: __("Send payment confirmation to customer", "yatra"),
                  },
                ].map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                  >
                    <input
                      type="checkbox"
                      id={notif.id}
                      checked={
                        formData[notif.id as keyof SettingsData] as boolean
                      }
                      name={notif.id}
                      onChange={handleFieldChange}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={notif.id}
                        className="font-medium cursor-pointer"
                      >
                        {notif.label}
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {notif.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <SectionDivider
              title={__("SMS Notifications (Optional)", "yatra")}
            />

            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="sms_notifications"
                  checked={formData.sms_notifications}
                  name="sms_notifications"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="sms_notifications"
                    className="font-medium cursor-pointer"
                  >
                    {__("Enable SMS Notifications", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Send SMS notifications for bookings and payments",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>

              {formData.sms_notifications && (
                <>
                  <FormField
                    id="sms_provider"
                    label={__("SMS Provider", "yatra")}
                    description={__(
                      "Select your SMS service provider",
                      "yatra",
                    )}
                  >
                    <Select
                      id="sms_provider"
                      value={formData.sms_provider}
                      name="sms_provider"
                      onChange={handleFieldChange}
                    >
                      <option value="twilio">{__("Twilio", "yatra")}</option>
                      <option value="nexmo">
                        {__("Nexmo (Vonage)", "yatra")}
                      </option>
                      <option value="aws_sns">{__("AWS SNS", "yatra")}</option>
                    </Select>
                  </FormField>

                  <FormField
                    id="sms_api_key"
                    label={__("SMS API Key", "yatra")}
                    description={__("API key from your SMS provider", "yatra")}
                  >
                    <Input
                      id="sms_api_key"
                      type="password"
                      value={formData.sms_api_key}
                      name="sms_api_key"
                      onChange={handleFieldChange}
                      placeholder={__("Enter SMS API key", "yatra")}
                    />
                  </FormField>
                </>
              )}
            </div>
          </div>
        );

      case "integration":
        return (
          <div className="space-y-6">
            {/* Google Calendar Integration - Only show if Pro is active */}
            {window.yatraAdmin &&
              (window as any).yatraAdmin.showGoogleCalendarSettingsUI && (
                <>
                  <SectionDivider
                    title={__("Google Calendar Integration", "yatra")}
                  />
                  <GoogleCalendarIntegrationSection
                    formData={formData}
                    setFormData={setFormData}
                  />
                </>
              )}

            {/* Mailchimp Integration - Pro Feature */}
            <SectionDivider title={__("Mailchimp Integration", "yatra")} />
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5 text-yellow-500" />
                  {__("Mailchimp", "yatra")}
                  {(window as any).yatraAdmin?.isPro && !(window as any).yatraAdmin?.showMailchimpSettingsUI && (
                    <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full font-medium">
                      PRO
                    </span>
                  )}
                </CardTitle>
                {(window as any).yatraAdmin?.mailchimp?.connectionStatus?.connected ? (
                  <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    {__("Connected", "yatra")}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <XCircle className="w-4 h-4" />
                    {__("Not Connected", "yatra")}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {__(
                    "Automatically sync customers to Mailchimp lists when they book. Add tags based on trips booked and build targeted email campaigns.",
                    "yatra",
                  )}
                </p>

                {(window as any).yatraAdmin?.showMailchimpSettingsUI ? (
                  <div className="space-y-4">
                    <FormField
                      id="mailchimp_api_key"
                      label={__("API Key", "yatra")}
                      description={
                        <>
                          {__("Get your API key from", "yatra")}{" "}
                          <a
                            href="https://admin.mailchimp.com/account/api/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 underline"
                          >
                            {__("Mailchimp Account Settings", "yatra")}
                          </a>
                        </>
                      }
                    >
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="mailchimp_api_key"
                            type={showApiKey ? "text" : "password"}
                            value={formData.mailchimp_api_key || ""}
                            name="mailchimp_api_key"
                            onChange={handleFieldChange}
                            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            tabIndex={-1}
                          >
                            {showApiKey ? (
                              <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={validateMailchimpApiKey}
                          disabled={!formData.mailchimp_api_key || validatingApiKey}
                          className="whitespace-nowrap"
                        >
                          {validatingApiKey ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              {__("Validating...", "yatra")}
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              {__("Validate", "yatra")}
                            </>
                          )}
                        </Button>
                      </div>
                      {formData.mailchimp_api_key && (
                        <div className={`mt-2 text-sm ${(window as any).yatraAdmin?.mailchimp?.connectionStatus?.connected ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {(window as any).yatraAdmin?.mailchimp?.connectionStatus?.connected ? (
                            <>
                              <CheckCircle className="h-4 w-4 inline mr-1" />
                              {__("Connected successfully!", "yatra")}
                            </>
                          ) : (window as any).yatraAdmin?.mailchimp?.connectionStatus?.error ? (
                            <>
                              <XCircle className="h-4 w-4 inline mr-1" />
                              {(window as any).yatraAdmin?.mailchimp?.connectionStatus?.error}
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 inline mr-1" />
                              {__("API key entered. Click 'Validate' to test connection.", "yatra")}
                            </>
                          )}
                        </div>
                      )}
                    </FormField>

                    <FormField
                      id="mailchimp_list_id"
                      label={__("Audience/List", "yatra")}
                      description={__(
                        "Select the Mailchimp audience to sync subscribers to.",
                        "yatra",
                      )}
                    >
                      <Select
                        id="mailchimp_list_id"
                        value={formData.mailchimp_list_id || ""}
                        name="mailchimp_list_id"
                        onChange={handleFieldChange}
                        disabled={!(window as any).yatraAdmin?.mailchimp?.connectionStatus?.connected}
                      >
                        <option value="">
                          {!(window as any).yatraAdmin?.mailchimp?.connectionStatus?.connected
                            ? __("Please validate API key first", "yatra")
                            : __("Select an audience", "yatra")}
                        </option>
                        {(window as any).yatraAdmin?.mailchimp?.availableLists?.map((list: any) => (
                          <option key={list.id} value={list.id}>
                            {list.name}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <input
                        type="checkbox"
                        id="mailchimp_sync_on_booking"
                        checked={formData.mailchimp_sync_on_booking ?? true}
                        name="mailchimp_sync_on_booking"
                        onChange={handleFieldChange}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="mailchimp_sync_on_booking"
                          className="font-medium cursor-pointer"
                        >
                          {__("Sync on Booking", "yatra")}
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {__(
                            "Automatically add customers to Mailchimp when they make a booking",
                            "yatra",
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <input
                        type="checkbox"
                        id="mailchimp_double_optin"
                        checked={formData.mailchimp_double_optin ?? false}
                        name="mailchimp_double_optin"
                        onChange={handleFieldChange}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="mailchimp_double_optin"
                          className="font-medium cursor-pointer"
                        >
                          {__("Double Opt-in", "yatra")}
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {__(
                            "Require email confirmation before adding to list (recommended for GDPR)",
                            "yatra",
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Advanced Field Mapping Section */}
                    {formData.mailchimp_api_key &&
                      formData.mailchimp_list_id && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" />
                            {__("Field Mapping", "yatra")}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            {__(
                              "Map Yatra customer fields to Mailchimp merge fields. This controls what data is synced when a customer is added to your list.",
                              "yatra",
                            )}
                          </p>

                          <div className="space-y-3">
                            {(window as any).yatraAdmin?.mailchimp?.mergeFields?.length > 0 ? (
                              (window as any).yatraAdmin?.mailchimp?.mergeFields.map((field: any) => {
                                const currentMapping = (formData as any).mailchimp_field_mapping || {};
                                const yatraFields = (window as any).yatraAdmin?.mailchimp?.yatraFields || {};
                                const yatraFieldOptions = yatraFields[field.type] || yatraFields['text'] || [];
                                
                                return (
                                  <div key={field.tag} className="grid grid-cols-2 gap-3 items-center">
                                    <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                                      <div className="flex items-center gap-2">
                                        <span>{field.name}</span>
                                        {field.required && (
                                          <span className="text-xs text-red-500">*</span>
                                        )}
                                        <span className="text-xs text-gray-400">({field.tag})</span>
                                      </div>
                                    </div>
                                    <Select
                                      value={currentMapping[field.tag] || ""}
                                      onChange={(e) => {
                                        const newMapping = { ...(formData as any).mailchimp_field_mapping || {} };
                                        if (e.target.value) {
                                          newMapping[field.tag] = e.target.value;
                                        } else {
                                          delete newMapping[field.tag];
                                        }
                                        setFormData((prev: any) => ({
                                          ...prev,
                                          mailchimp_field_mapping: newMapping,
                                        }));
                                      }}
                                    >
                                      <option value="">
                                        {__("Do not sync", "yatra")}
                                      </option>
                                      {Object.entries(yatraFieldOptions).map(([value, label]) => (
                                        <option key={value} value={value}>
                                          {label}
                                        </option>
                                      ))}
                                    </Select>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                                {__("No merge fields available. Please select a list first.", "yatra")}
                              </div>
                            )}
                          </div>

                          {/* Tags Configuration */}
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <input
                                type="checkbox"
                                id="mailchimp_add_tags"
                                checked={
                                  (formData as any).mailchimp_add_tags ?? true
                                }
                                onChange={(e) =>
                                  setFormData((prev: any) => ({
                                    ...prev,
                                    mailchimp_add_tags: e.target.checked,
                                  }))
                                }
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <Label
                                  htmlFor="mailchimp_add_tags"
                                  className="font-medium cursor-pointer"
                                >
                                  {__("Add Trip Tags", "yatra")}
                                </Label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {__(
                                    "Automatically tag subscribers with the trip name they booked",
                                    "yatra",
                                  )}
                                </p>
                              </div>
                            </div>

                            <FormField
                              id="mailchimp_default_tags"
                              label={__("Default Tags", "yatra")}
                              description={__(
                                'Comma-separated tags to add to all synced subscribers (e.g., "yatra, booking")',
                                "yatra",
                              )}
                            >
                              <Input
                                id="mailchimp_default_tags"
                                value={
                                  (formData as any).mailchimp_default_tags || ""
                                }
                                onChange={(e) =>
                                  setFormData((prev: any) => ({
                                    ...prev,
                                    mailchimp_default_tags: e.target.value,
                                  }))
                                }
                                placeholder="yatra, booking"
                              />
                            </FormField>
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-sm text-purple-800 dark:text-purple-300 mb-3">
                      {__(
                        "Upgrade to Yatra Pro to unlock Mailchimp integration and automatically sync your customers.",
                        "yatra",
                      )}
                    </p>
                    <a
                      href="https://wpyatra.com/pricing?module=mailchimp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                    >
                      {__("Upgrade to Pro", "yatra")}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Facebook Pixel Integration - Pro Feature */}
            <SectionDivider title={__("Facebook Pixel", "yatra")} />
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  {__("Facebook Pixel", "yatra")}
                  {(window as any).yatraAdmin?.isPro && !(window as any).yatraAdmin?.showFacebookPixelSettingsUI && (
                    <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full font-medium">
                      PRO
                    </span>
                  )}
                </CardTitle>
                {(window as any).yatraAdmin?.facebookPixel?.connectionStatus?.pixelConnected ? (
                  <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    {__("Connected", "yatra")}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <XCircle className="w-4 h-4" />
                    {__("Not Connected", "yatra")}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {__(
                    "Track booking conversions with Facebook Pixel. Retarget visitors who viewed trips and optimize ad campaigns with accurate conversion data.",
                    "yatra",
                  )}
                </p>

                {(window as any).yatraAdmin?.showFacebookPixelSettingsUI ? (
                  <div className="space-y-4">
                    <FormField
                      id="facebook_pixel_id"
                      label={__("Pixel ID", "yatra")}
                      description={
                        <div className="space-y-2">
                          <p>{__("Your Facebook Pixel ID (e.g., 123456789012345).", "yatra")}</p>
                          <details className="text-sm">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium">
                              {__("How to get your Pixel ID:", "yatra")}
                            </summary>
                            <ol className="mt-2 ml-4 list-decimal space-y-1 text-gray-600 dark:text-gray-400">
                              <li>{__("Go to Facebook Business Manager: business.facebook.com", "yatra")}</li>
                              <li>{__("Select your Business Account", "yatra")}</li>
                              <li>{__("Click 'All tools' and select 'Pixels'", "yatra")}</li>
                              <li>{__("Click 'Add Pixel' if you don't have one", "yatra")}</li>
                              <li>{__("Enter a Pixel name and enter your website URL", "yatra")}</li>
                              <li>{__("Click 'Create Pixel'", "yatra")}</li>
                              <li>{__("Your Pixel ID will be displayed (e.g., 123456789012345)", "yatra")}</li>
                              <li>{__("Copy this Pixel ID and paste it in the field above", "yatra")}</li>
                            </ol>
                          </details>
                          <div className="mt-2">
                            <a
                              href="https://business.facebook.com/events_manager"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 underline text-sm"
                            >
                              {__("Open Facebook Events Manager →", "yatra")}
                            </a>
                          </div>
                        </div>
                      }
                    >
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            id="facebook_pixel_id"
                            value={formData.facebook_pixel_id || ""}
                            name="facebook_pixel_id"
                            onChange={handleFieldChange}
                            placeholder="123456789012345"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={validateFacebookPixel}
                          disabled={!formData.facebook_pixel_id || validatingPixel}
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          {validatingPixel ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {__("Validating...", "yatra")}
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              {__("Validate", "yatra")}
                            </>
                          )}
                        </Button>
                      </div>
                      {formData.facebook_pixel_id && (
                        <div className={`mt-2 text-sm ${(window as any).yatraAdmin?.facebookPixel?.connectionStatus?.pixelConnected ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {(window as any).yatraAdmin?.facebookPixel?.connectionStatus?.pixelConnected ? (
                            <>
                              <CheckCircle className="h-4 w-4 inline mr-1" />
                              {__("Pixel ID is valid!", "yatra")}
                            </>
                          ) : (window as any).yatraAdmin?.facebookPixel?.connectionStatus?.pixelError ? (
                            <>
                              <XCircle className="h-4 w-4 inline mr-1" />
                              {(window as any).yatraAdmin?.facebookPixel?.connectionStatus?.pixelError}
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 inline mr-1" />
                              {__("Click 'Validate' to test Pixel ID.", "yatra")}
                            </>
                          )}
                        </div>
                      )}
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <input
                          type="checkbox"
                          id="fb_track_view_content"
                          checked={formData.fb_track_view_content ?? true}
                          name="fb_track_view_content"
                          onChange={handleFieldChange}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label
                          htmlFor="fb_track_view_content"
                          className="text-sm cursor-pointer"
                        >
                          {__("Track ViewContent", "yatra")}
                        </Label>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <input
                          type="checkbox"
                          id="fb_track_initiate_checkout"
                          checked={formData.fb_track_initiate_checkout ?? true}
                          name="fb_track_initiate_checkout"
                          onChange={handleFieldChange}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label
                          htmlFor="fb_track_initiate_checkout"
                          className="text-sm cursor-pointer"
                        >
                          {__("Track InitiateCheckout", "yatra")}
                        </Label>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <input
                          type="checkbox"
                          id="fb_track_purchase"
                          checked={formData.fb_track_purchase ?? true}
                          name="fb_track_purchase"
                          onChange={handleFieldChange}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label
                          htmlFor="fb_track_purchase"
                          className="text-sm cursor-pointer"
                        >
                          {__("Track Purchase", "yatra")}
                        </Label>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <input
                          type="checkbox"
                          id="fb_use_conversions_api"
                          checked={formData.fb_use_conversions_api ?? false}
                          name="fb_use_conversions_api"
                          onChange={handleFieldChange}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label
                          htmlFor="fb_use_conversions_api"
                          className="text-sm cursor-pointer"
                        >
                          {__("Use Conversions API", "yatra")}
                        </Label>
                      </div>
                    </div>

                    {formData.fb_use_conversions_api && (
                      <FormField
                        id="facebook_access_token"
                        label={__("Access Token", "yatra")}
                        description={
                          <div className="space-y-2">
                            <p>{__("Required for Conversions API. Enables server-side tracking for better accuracy.", "yatra")}</p>
                            <details className="text-sm">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium">
                                {__("How to get Access Token:", "yatra")}
                              </summary>
                              <ol className="mt-2 ml-4 list-decimal space-y-1 text-gray-600 dark:text-gray-400">
                                <li>{__("Go to Facebook Business Manager: business.facebook.com", "yatra")}</li>
                                <li>{__("Select your Business Account", "yatra")}</li>
                                <li>{__("Click 'All tools' and select 'Events Manager'", "yatra")}</li>
                                <li>{__("Find your Pixel ID in the data sources list (it should match the Pixel ID you entered above)", "yatra")}</li>
                                <li>{__("Click on your Pixel name to open its settings", "yatra")}</li>
                                <li>{__("Click 'Settings' (gear icon ⚙️) in the top right", "yatra")}</li>
                                <li>{__("Scroll down to 'Conversions API' section", "yatra")}</li>
                                <li>{__("Click 'Generate access token'", "yatra")}</li>
                                <li>{__("Choose permissions: 'ads_management' and 'business_management'", "yatra")}</li>
                                <li>{__("Click 'Generate token'", "yatra")}</li>
                                <li>{__("Copy the generated access token", "yatra")}</li>
                                <li>{__("Paste it in the field above", "yatra")}</li>
                              </ol>
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                                <p className="text-xs text-blue-800 dark:text-blue-300">
                                  <strong>{__("💡 Tip:", "yatra")}</strong> {__("If you have multiple Pixels, look for the one that matches the Pixel ID you entered above. The Pixel ID is displayed next to each Pixel name in the list.", "yatra")}
                                </p>
                              </div>
                              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                                  {__("⚠️ Keep your access token secure and never share it publicly.", "yatra")}
                                </p>
                              </div>
                            </details>
                            <div className="mt-2">
                              <a
                                href="https://business.facebook.com/settings/conversions-api"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 underline text-sm"
                              >
                                {__("Open Conversions API Settings →", "yatra")}
                              </a>
                            </div>
                          </div>
                        }
                      >
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <Input
                                id="facebook_access_token"
                                type={showFacebookToken ? "text" : "password"}
                                value={formData.facebook_access_token || ""}
                                name="facebook_access_token"
                                onChange={handleFieldChange}
                                placeholder="EAAC..."
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowFacebookToken(!showFacebookToken)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                tabIndex={-1}
                              >
                                {showFacebookToken ? (
                                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                )}
                              </button>
                            </div>
                            <Button
                              type="button"
                              onClick={validateFacebookToken}
                              disabled={!formData.facebook_access_token || validatingToken}
                              variant="outline"
                              size="sm"
                              className="whitespace-nowrap"
                            >
                              {validatingToken ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {__("Validating...", "yatra")}
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  {__("Validate", "yatra")}
                                </>
                              )}
                            </Button>
                          </div>
                          {formData.facebook_access_token && (
                            <div className={`text-sm ${(window as any).yatraAdmin?.facebookPixel?.connectionStatus?.tokenConnected ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                              {(window as any).yatraAdmin?.facebookPixel?.connectionStatus?.tokenConnected ? (
                                <>
                                  <CheckCircle className="h-4 w-4 inline mr-1" />
                                  {__("Access token is valid!", "yatra")}
                                </>
                              ) : (window as any).yatraAdmin?.facebookPixel?.connectionStatus?.tokenError ? (
                                <>
                                  <XCircle className="h-4 w-4 inline mr-1" />
                                  {(window as any).yatraAdmin?.facebookPixel?.connectionStatus?.tokenError}
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-4 w-4 inline mr-1" />
                                  {__("Click 'Validate' to test access token.", "yatra")}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </FormField>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-sm text-purple-800 dark:text-purple-300 mb-3">
                      {__(
                        "Upgrade to Yatra Pro to unlock Facebook Pixel integration with advanced conversion tracking.",
                        "yatra",
                      )}
                    </p>
                    <a
                      href="https://wpyatra.com/pricing?module=facebook-pixel"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                    >
                      {__("Upgrade to Pro", "yatra")}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
                
                {/* Facebook Pixel Monitoring Notice */}
                {(window as any).yatraAdmin?.facebookPixel?.pixelId && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm">
                        <span className="text-blue-800 dark:text-blue-300 font-medium">{__("Facebook Pixel Monitoring:", "yatra")}</span>
                        <span className="text-blue-700 dark:text-blue-400 ml-1">
                          {__("View event statistics and activity in the ", "yatra")}
                          <a 
                            href={`${(window as any).yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=reports`}
                            className="underline hover:text-blue-600 dark:hover:text-blue-300 font-medium"
                          >
                            {__("Reports page", "yatra")}
                          </a>
                          {__(" → Facebook Pixel tab.", "yatra")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
              </CardContent>
            </Card>

            {/* Google Analytics 4 Enhanced - Pro Feature */}
            <SectionDivider
              title={__("Google Analytics 4 Enhanced", "yatra")}
            />
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-orange-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
                  </svg>
                  {__("Google Analytics 4 Enhanced", "yatra")}
                  {(window as any).yatraAdmin?.isPro && !(window as any).yatraAdmin?.showGoogleAnalyticsSettingsUI && (
                    <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full font-medium">
                      PRO
                    </span>
                  )}
                </CardTitle>
                {(window as any).yatraAdmin?.googleAnalytics?.connected ? (
                  <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    {__("Connected", "yatra")}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <XCircle className="w-4 h-4" />
                    {__("Not Connected", "yatra")}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {__(
                    "Enhanced e-commerce tracking for GA4. Track view_item, begin_checkout, and purchase events with server-side Measurement Protocol support.",
                    "yatra",
                  )}
                </p>

                {(window as any).yatraAdmin?.showGoogleAnalyticsSettingsUI ? (
                  <div className="space-y-4">
                    <FormField
                      id="ga4_measurement_id"
                      label={__("Measurement ID", "yatra")}
                      description={
                        <>
                          {__("Get your Measurement ID from", "yatra")}{" "}
                          <a
                            href="https://analytics.google.com/analytics/web/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 underline"
                          >
                            {__("Google Analytics", "yatra")}
                          </a>{" "}
                          {__("(Admin > Data Streams)", "yatra")}
                        </>
                      }
                      actionButton={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => validateMeasurementId()}
                          disabled={!formData.ga4_measurement_id || validatingMeasurementId}
                          className="shrink-0"
                        >
                          {validatingMeasurementId ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {__("Validating...", "yatra")}
                            </>
                          ) : (
                            <>
                              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {__("Validate", "yatra")}
                            </>
                          )}
                        </Button>
                      }
                    >
                      <Input
                        id="ga4_measurement_id"
                        value={formData.ga4_measurement_id || ""}
                        name="ga4_measurement_id"
                        onChange={handleFieldChange}
                        placeholder="G-XXXXXXXXXX"
                      />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <input
                          type="checkbox"
                          id="ga4_track_view_item"
                          checked={formData.ga4_track_view_item ?? true}
                          name="ga4_track_view_item"
                          onChange={handleFieldChange}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label
                          htmlFor="ga4_track_view_item"
                          className="text-sm cursor-pointer"
                        >
                          {__("Track view_item", "yatra")}
                        </Label>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <input
                          type="checkbox"
                          id="ga4_track_begin_checkout"
                          checked={formData.ga4_track_begin_checkout ?? true}
                          name="ga4_track_begin_checkout"
                          onChange={handleFieldChange}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label
                          htmlFor="ga4_track_begin_checkout"
                          className="text-sm cursor-pointer"
                        >
                          {__("Track begin_checkout", "yatra")}
                        </Label>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <input
                          type="checkbox"
                          id="ga4_track_purchase"
                          checked={formData.ga4_track_purchase ?? true}
                          name="ga4_track_purchase"
                          onChange={handleFieldChange}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label
                          htmlFor="ga4_track_purchase"
                          className="text-sm cursor-pointer"
                        >
                          {__("Track purchase", "yatra")}
                        </Label>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <input
                          type="checkbox"
                          id="ga4_use_measurement_protocol"
                          checked={
                            formData.ga4_use_measurement_protocol ?? false
                          }
                          name="ga4_use_measurement_protocol"
                          onChange={handleFieldChange}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label
                          htmlFor="ga4_use_measurement_protocol"
                          className="text-sm cursor-pointer"
                        >
                          {__("Use Measurement Protocol", "yatra")}
                        </Label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-sm text-purple-800 dark:text-purple-300 mb-3">
                      {__(
                        "Upgrade to Yatra Pro to unlock Google Analytics 4 Enhanced e-commerce tracking.",
                        "yatra",
                      )}
                    </p>
                    <a
                      href="https://wpyatra.com/pricing?module=google-analytics"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                    >
                      {__("Upgrade to Pro", "yatra")}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
                
                {/* Google Analytics Monitoring Notice */}
                {(window as any).yatraAdmin?.googleAnalytics?.measurementId && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm">
                        <span className="text-blue-800 dark:text-blue-300 font-medium">{__("Google Analytics Monitoring:", "yatra")}</span>
                        <span className="text-blue-700 dark:text-blue-400 ml-1">
                          {__("View event statistics and activity in the ", "yatra")}
                          <a 
                            href={`${(window as any).yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=reports`}
                            className="underline hover:text-blue-600 dark:hover:text-blue-300 font-medium"
                          >
                            {__("Reports page", "yatra")}
                          </a>
                          {__(" → Google Analytics 4 tab.", "yatra")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Google Maps API - Free Feature */}
            <SectionDivider title={__("Google Maps", "yatra")} />
            <div className="space-y-4">
              <FormField
                id="google_maps_api"
                label={__("Google Maps API Key", "yatra")}
                description={__(
                  "API key for displaying maps and location features",
                  "yatra",
                )}
              >
                <Input
                  id="google_maps_api"
                  type="password"
                  value={formData.google_maps_api}
                  name="google_maps_api"
                  onChange={handleFieldChange}
                  placeholder={__("Enter Google Maps API Key", "yatra")}
                />
              </FormField>
            </div>

            <SectionDivider title={__("reCAPTCHA Settings", "yatra")} />

            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="recaptcha_enabled"
                  checked={formData.recaptcha_enabled}
                  name="recaptcha_enabled"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="recaptcha_enabled"
                    className="font-medium cursor-pointer"
                  >
                    {__("Enable reCAPTCHA", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__("Protect forms from spam and bots", "yatra")}
                  </p>
                </div>
              </div>

              {formData.recaptcha_enabled && (
                <>
                  <FormField
                    id="recaptcha_site_key"
                    label={__("Site Key", "yatra")}
                    description={__("Your reCAPTCHA site key", "yatra")}
                  >
                    <Input
                      id="recaptcha_site_key"
                      value={formData.recaptcha_site_key}
                      name="recaptcha_site_key"
                      onChange={handleFieldChange}
                      placeholder={__("Enter site key", "yatra")}
                    />
                  </FormField>

                  <FormField
                    id="recaptcha_secret_key"
                    label={__("Secret Key", "yatra")}
                    description={__(
                      "Your reCAPTCHA secret key (keep this secure)",
                      "yatra",
                    )}
                  >
                    <Input
                      id="recaptcha_secret_key"
                      type="password"
                      value={formData.recaptcha_secret_key}
                      name="recaptcha_secret_key"
                      onChange={handleFieldChange}
                      placeholder={__("Enter secret key", "yatra")}
                    />
                  </FormField>
                </>
              )}
            </div>
          </div>
        );

      case "permalink":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {__("Permalink Settings", "yatra")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {__(
                  "Configure URL slugs for your Yatra content types. These settings control how your trips, destinations, and activities appear in URLs.",
                  "yatra",
                )}
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                id="trip_base"
                label={__("Trip Base", "yatra")}
                description={__(
                  'URL slug for trip single pages (e.g., "trip" will create URLs like /trip/everest-base-camp)',
                  "yatra",
                )}
              >
                <Input
                  id="trip_base"
                  name="trip_base"
                  value={formData.trip_base || "trip"}
                  onChange={handleFieldChange}
                  placeholder="trip"
                  className="font-mono"
                />
                {formData.trip_base && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <span>
                      {__("Example URL:", "yatra")}{" "}
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                        {(window as any)?.yatraAdmin?.permalinkStructure ===
                        "plain"
                          ? `?yatra_trip_slug=trip-name`
                          : `/${formData.trip_base || "trip"}/trip-name`}
                      </code>
                    </span>
                    <a
                      href={
                        (window as any)?.yatraAdmin?.siteUrl
                          ? `${(window as any).yatraAdmin.siteUrl.replace(/\/$/, "")}${
                              (window as any)?.yatraAdmin
                                ?.permalinkStructure === "plain"
                                ? `?yatra_trip_slug=trip-name`
                                : `/${formData.trip_base || "trip"}/trip-name`
                            }`
                          : `/${formData.trip_base || "trip"}/trip-name`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> {__("View", "yatra")}
                    </a>
                  </div>
                )}
              </FormField>

              <FormField
                id="destination_base"
                label={__("Destination Base", "yatra")}
                description={__(
                  'URL slug for destination archive pages (e.g., "destination" will create URLs like /destination/nepal)',
                  "yatra",
                )}
              >
                <Input
                  id="destination_base"
                  name="destination_base"
                  value={formData.destination_base || "destination"}
                  onChange={handleFieldChange}
                  placeholder="destination"
                  className="font-mono"
                />
                {formData.destination_base && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <span>
                      {__("Example URL:", "yatra")}{" "}
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                        {(window as any)?.yatraAdmin?.permalinkStructure ===
                        "plain"
                          ? `?yatra_destination_slug=nepal`
                          : `/${formData.destination_base || "destination"}/nepal`}
                      </code>
                    </span>
                    <a
                      href={
                        (window as any)?.yatraAdmin?.siteUrl
                          ? `${(window as any).yatraAdmin.siteUrl.replace(/\/$/, "")}${
                              (window as any)?.yatraAdmin
                                ?.permalinkStructure === "plain"
                                ? `?yatra_destination_slug=nepal`
                                : `/${formData.destination_base || "destination"}/nepal`
                            }`
                          : `/${formData.destination_base || "destination"}/nepal`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> {__("View", "yatra")}
                    </a>
                  </div>
                )}
              </FormField>

              <FormField
                id="activity_base"
                label={__("Activity Base", "yatra")}
                description={__(
                  'URL slug for activity archive pages (e.g., "activity" will create URLs like /activity/trekking)',
                  "yatra",
                )}
              >
                <Input
                  id="activity_base"
                  name="activity_base"
                  value={formData.activity_base || "activity"}
                  onChange={handleFieldChange}
                  placeholder="activity"
                  className="font-mono"
                />
                {formData.activity_base && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <span>
                      {__("Example URL:", "yatra")}{" "}
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                        {(window as any)?.yatraAdmin?.permalinkStructure ===
                        "plain"
                          ? `?yatra_activity_slug=trekking`
                          : `/${formData.activity_base || "activity"}/trekking`}
                      </code>
                    </span>
                    <a
                      href={
                        (window as any)?.yatraAdmin?.siteUrl
                          ? `${(window as any).yatraAdmin.siteUrl.replace(/\/$/, "")}${
                              (window as any)?.yatraAdmin
                                ?.permalinkStructure === "plain"
                                ? `?yatra_activity_slug=trekking`
                                : `/${formData.activity_base || "activity"}/trekking`
                            }`
                          : `/${formData.activity_base || "activity"}/trekking`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> {__("View", "yatra")}
                    </a>
                  </div>
                )}
              </FormField>

              <FormField
                id="trip_category_base"
                label={__("Trip Category Base", "yatra")}
                description={__(
                  'URL slug for trip category archive pages (e.g., "trip-category" will create URLs like /trip-category/adventure)',
                  "yatra",
                )}
              >
                <Input
                  id="trip_category_base"
                  name="trip_category_base"
                  value={formData.trip_category_base || "trip-category"}
                  onChange={handleFieldChange}
                  placeholder="trip-category"
                  className="font-mono"
                />
                {formData.trip_category_base && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <span>
                      {__("Example URL:", "yatra")}{" "}
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                        {(window as any)?.yatraAdmin?.permalinkStructure ===
                        "plain"
                          ? `?yatra_category_slug=adventure`
                          : `/${formData.trip_category_base || "trip-category"}/adventure`}
                      </code>
                    </span>
                    <a
                      href={
                        (window as any)?.yatraAdmin?.siteUrl
                          ? `${(window as any).yatraAdmin.siteUrl.replace(/\/$/, "")}${
                              (window as any)?.yatraAdmin
                                ?.permalinkStructure === "plain"
                                ? `?yatra_category_slug=adventure`
                                : `/${formData.trip_category_base || "trip-category"}/adventure`
                            }`
                          : `/${formData.trip_category_base || "trip-category"}/adventure`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> {__("View", "yatra")}
                    </a>
                  </div>
                )}
              </FormField>
            </div>

            {/* Booking Page Settings */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {__("Booking Page Settings", "yatra")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {__(
                  "Configure the booking page URL. By default, bookings use /book/{trip-slug}. You can customize the URL base or use a custom WordPress page.",
                  "yatra",
                )}
              </p>

              <div className="space-y-4">
                <FormField
                  id="booking_base"
                  label={__("Default Booking URL Base", "yatra")}
                  description={__(
                    'URL slug for the booking page (e.g., "book" will create URLs like /book/trip-name)',
                    "yatra",
                  )}
                >
                  <Input
                    id="booking_base"
                    name="booking_base"
                    value={formData.booking_base || "book"}
                    onChange={handleFieldChange}
                    placeholder="book"
                    className="font-mono"
                  />
                  {formData.booking_base && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                      <span>
                        {__("Example URL:", "yatra")}{" "}
                        <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                          {(window as any)?.yatraAdmin?.permalinkStructure ===
                          "plain"
                            ? `?yatra_booking_page=main`
                            : `/${formData.booking_base || "book"}/trip-name`}
                        </code>
                      </span>
                      <a
                        href={
                          (window as any)?.yatraAdmin?.siteUrl
                            ? `${(window as any).yatraAdmin.siteUrl.replace(/\/$/, "")}${
                                (window as any)?.yatraAdmin
                                  ?.permalinkStructure === "plain"
                                  ? `?yatra_booking_page=main`
                                  : `/${formData.booking_base || "book"}/trip-name`
                              }`
                            : `/${formData.booking_base || "book"}/trip-name`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />{" "}
                        {__("View", "yatra")}
                      </a>
                    </div>
                  )}
                </FormField>

                {formData.use_booking_page && (
                  <FormField
                    id="booking_page_id"
                    label={__("Select Booking Page", "yatra")}
                    description={__(
                      "Choose a page that contains the [yatra_booking] shortcode. If the page doesn't have the shortcode, you'll be prompted to add it.",
                      "Choose a page that contains the [yatra_booking] shortcode. If the page doesn't have the shortcode, you'll be prompted to add it.",
                    )}
                  >
                    <div className="relative">
                      <select
                        id="booking_page_id"
                        name="booking_page_id"
                        value={formData.booking_page_id || 0}
                        onChange={(e) =>
                          handleBookingPageChange(parseInt(e.target.value))
                        }
                        disabled={isCheckingShortcode}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-wait"
                      >
                        <option value={0}>
                          {__("-- Select a page --", "yatra")}
                        </option>
                        {pagesData?.map((page) => (
                          <option key={page.id} value={page.id}>
                            {page.title}
                          </option>
                        ))}
                      </select>
                      {isCheckingShortcode && (
                        <div className="absolute right-8 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>
                    {formData.booking_page_id > 0 && pagesData && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {__("Booking URL:", "yatra")}{" "}
                        <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                          {pagesData.find(
                            (p) => p.id === formData.booking_page_id,
                          )?.url || ""}
                        </code>
                      </p>
                    )}
                  </FormField>
                )}
              </div>
            </div>

            {/* Shortcode Dialog */}
            {showShortcodeDialog && selectedPageForShortcode && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {__("Shortcode Required", "yatra")}
                  </h3>
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {__("The page", "yatra")}{" "}
                      <strong>"{selectedPageForShortcode.title}"</strong>{" "}
                      {__("doesn't have the", "doesn't have the")}{" "}
                      <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                        [yatra_booking]
                      </code>{" "}
                      {__("shortcode.", "yatra")}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {__(
                        "Would you like to add it automatically, or edit the page manually to place it where you want?",
                        "yatra",
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleConfirmInsertShortcode}
                      disabled={insertShortcodeMutation.isPending}
                      className="w-full justify-center"
                    >
                      {insertShortcodeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          {__("Adding...", "yatra")}
                        </>
                      ) : (
                        __("Add Shortcode Automatically", "yatra")
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const editUrl = pagesData?.find(
                          (p) => p.id === selectedPageForShortcode.id,
                        )?.url;
                        if (editUrl) {
                          window.open(
                            `/wp-admin/post.php?post=${selectedPageForShortcode.id}&action=edit`,
                            "_blank",
                          );
                        }
                        setShowShortcodeDialog(false);
                        setSelectedPageForShortcode(null);
                      }}
                      className="w-full justify-center"
                    >
                      {__("Edit Page Manually", "yatra")}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowShortcodeDialog(false);
                        setSelectedPageForShortcode(null);
                        handleFieldChange({
                          target: { name: "booking_page_id", value: 0 },
                        } as any);
                      }}
                      className="w-full justify-center"
                    >
                      {__("Skip for now", "yatra")}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">
                    {__("Important:", "yatra")}
                  </p>
                  <p className="mb-3">
                    {__(
                      "After changing permalink settings, you must flush rewrite rules for the changes to take effect.",
                      "yatra",
                    )}
                  </p>
                  <Button
                    type="button"
                    onClick={() => flushRewriteRulesMutation.mutate()}
                    disabled={flushRewriteRulesMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {flushRewriteRulesMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {__("Flushing...", "yatra")}
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        {__("Flush Rewrite Rules", "yatra")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case "advanced":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="debug_mode"
                  checked={formData.debug_mode}
                  name="debug_mode"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="debug_mode"
                    className="font-medium cursor-pointer"
                  >
                    {__("Enable Debug Mode", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Show detailed error messages (disable in production)",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="enable_logging"
                  checked={formData.enable_logging}
                  name="enable_logging"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="enable_logging"
                    className="font-medium cursor-pointer"
                  >
                    {__("Enable Logging", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Log system events and errors for troubleshooting",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="cache_enabled"
                  checked={formData.cache_enabled}
                  name="cache_enabled"
                  onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="cache_enabled"
                    className="font-medium cursor-pointer"
                  >
                    {__("Enable Cache", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__("Cache data to improve performance", "yatra")}
                  </p>
                </div>
              </div>

              <FormField
                id="api_key"
                label={__("API Key", "yatra")}
                description={__(
                  "API key for external integrations and webhooks",
                  "yatra",
                )}
              >
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  name="api_key"
                  onChange={handleFieldChange}
                  placeholder={__("Enter API Key", "yatra")}
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  id="api_rate_limit"
                  label={__("API Rate Limit", "yatra")}
                  description={__("Maximum API requests per hour", "yatra")}
                >
                  <Input
                    id="api_rate_limit"
                    type="number"
                    value={formData.api_rate_limit}
                    name="api_rate_limit"
                    onChange={handleFieldChange}
                    min="1"
                  />
                </FormField>

                <FormField
                  id="session_timeout"
                  label={__("Session Timeout (seconds)", "yatra")}
                  description={__("User session timeout in seconds", "yatra")}
                >
                  <Input
                    id="session_timeout"
                    type="number"
                    value={formData.session_timeout}
                    name="session_timeout"
                    onChange={handleFieldChange}
                    min="60"
                  />
                </FormField>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {__("Settings section coming soon", "yatra")}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Left Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1 p-2">
                  {[...Array(12)].map((_, index) => (
                    <div
                      key={`skeleton-nav-${index}`}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md"
                    >
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Right Content Skeleton */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-4">
                {/* Form Fields Skeleton */}
                {[...Array(6)].map((_, index) => (
                  <div key={`skeleton-field-${index}`} className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                ))}
                {/* Grid fields skeleton */}
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={`skeleton-grid-${index}`} className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={__("Settings", "yatra")}
        description={__(
          "Configure your travel booking plugin settings",
          "yatra",
        )}
        actions={
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {__("Saving...", "yatra")}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {__("Save Settings", "yatra")}
              </>
            )}
          </Button>
        }
      />

      <ConditionalRender capability="manage_yatra">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1 p-2">
                  {settingsSections.map((section) => {
                    const Icon = section.icon;
                    const isViewing = viewingSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setViewingSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                          isViewing
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {section.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {(() => {
                    const section = settingsSections.find(
                      (s) => s.id === viewingSection,
                    );
                    const Icon = section?.icon || SettingsIcon;
                    return (
                      <>
                        <Icon className="w-4 h-4" />
                        {section?.label || __("Settings", "yatra")}
                      </>
                    );
                  })()}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {renderSettingsContent()}
              </CardContent>
              <CardFooter className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700/50">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !formData}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {__("Saving...", "yatra")}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {__("Save Settings", "yatra")}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </ConditionalRender>
    </div>
  );
};

export default Settings;
