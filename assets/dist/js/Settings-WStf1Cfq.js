import { t as useQueryClient, r as reactExports, u as useQuery, a5 as React, v as useMutation, bK as Building2, bL as Palette, p as Calendar, bM as ClipboardList, bN as SlidersHorizontal, as as DollarSign, bO as Percent, U as Users, n as Star, bP as Receipt, a_ as Globe, bQ as Plug, T as TrendingUp, au as Shield, j as jsxRuntimeExports, D as Loader2, aV as Save, l as Settings$1, m as BarChart3, V as ExternalLink, J as RefreshCw, ax as X, aS as Image, aw as Plus, aF as Info, d as Mail, av as CheckCircle, b6 as XCircle, bu as EyeOff, aQ as Eye, aA as Check, az as AlertCircle, b9 as GripVertical, aK as ArrowUp, aL as ArrowDown, x as ChevronDown, y as ChevronRight, aN as Trash2, b8 as Lock, aU as Pen } from "./react-vendor-zODANjVp.js";
import { a as apiClient, A as API_ENDPOINTS, u as useToast, _ as __, k as getCurrencyOptions, b as apiService } from "./index-zauBMzvd.js";
import { r as unwrapApiPayload, u as usePermissions, C as Card, d as CardContent, f as CardHeader, P as PageHeader, B as Button, s as ConditionalRender, g as CardTitle, t as CardFooter, v as PremiumUpgradeDialog, w as Label, I as Input, o as prepareWordPressMediaFrameOpen, S as Select, x as SearchableSelect, y as buildYatraAccountViewUrl, z as navigateMenu, E as saveSettings, F as buildYatraListingPublicUrl, m as isWordPressPlainPermalink, G as postInsertBookingShortcode, J as postFlushRewriteRules, k as ConfirmationDialog, K as fetchBookingPageShortcodeStatus, q as fetchSettings, N as fetchPaymentGatewayDefinitions, O as fetchWordPressPages } from "../../admin/dist/js/app.js";
import { P as ProBadge, a as ProFeature, M as MultiSelect } from "./ProFeature-Bq-2isy8.js";
async function fetchUsageTrackingStatus() {
  return unwrapApiPayload(
    await apiClient.get(API_ENDPOINTS.USAGE_TRACKING_STATUS)
  );
}
async function postUsageTrackingSettings(enabled) {
  return unwrapApiPayload(
    await apiClient.post(API_ENDPOINTS.USAGE_TRACKING_SETTINGS, { enabled })
  );
}
async function postUsageTrackingSend(options) {
  const body = {};
  if (options == null ? void 0 : options.force) {
    body.force = true;
  }
  return apiClient.post(API_ENDPOINTS.USAGE_TRACKING_SEND, body);
}
const MultipleTaxesEditor = React.memo(
  ({
    taxes,
    onChange
  }) => {
    const removeTax = (index) => {
      onChange(taxes.filter((_, i) => i !== index));
    };
    const updateTax = (index, field, value) => {
      const updated = [...taxes];
      if (field === "rate") {
        updated[index].rate = parseFloat(value) || 0;
      } else {
        updated[index].name = value;
      }
      onChange(updated);
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: taxes.filter((tax) => tax.name && tax.name.trim() !== "").map((tax, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "relative p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 w-full",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: () => removeTax(index),
              className: "absolute top-3 right-3 text-red-600 hover:text-red-700 p-2",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 pr-12", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: tax.name,
                onChange: (e) => updateTax(index, "name", e.target.value),
                placeholder: __("Tax name (e.g., VAT, GST)", "yatra"),
                className: "w-full"
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: tax.rate,
                  onChange: (e) => updateTax(index, "rate", e.target.value),
                  min: "0",
                  max: "100",
                  step: "0.01",
                  placeholder: __("Rate", "yatra"),
                  className: "w-full"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: "%" })
            ] }) })
          ] })
        ]
      },
      index
    )) }) });
  }
);
const FormField = React.memo(
  ({
    id,
    label,
    description,
    required = false,
    actionButton,
    children
  }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: id, className: "flex items-center gap-1.5", children: [
      label,
      required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
    ] }),
    description && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-3.5 h-3.5 mt-0.5 flex-shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 leading-relaxed", children: description })
    ] }),
    actionButton ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children }),
      actionButton
    ] }) : children
  ] })
);
FormField.displayName = "FormField";
const GoogleCalendarIntegrationSection = ({ formData, setFormData }) => {
  const yatraAdmin = window.yatraAdmin || {};
  const gcSettings = yatraAdmin.googleCalendar || {};
  const siteUrl = yatraAdmin.siteUrl || "";
  const gcDashboardUrl = `${yatraAdmin.adminUrl || "admin.php"}?page=yatra&subpage=google-calendar`;
  const [clientId, setClientId] = reactExports.useState(
    formData.google_calendar_client_id || gcSettings.client_id || ""
  );
  const [clientSecret, setClientSecret] = reactExports.useState(
    formData.google_calendar_client_secret || gcSettings.client_secret || ""
  );
  const [calendarId, setCalendarId] = reactExports.useState(
    formData.google_calendar_calendar_id || gcSettings.calendar_id || ""
  );
  const [calendarName, setCalendarName] = reactExports.useState(
    formData.google_calendar_calendar_name || gcSettings.calendar_name || ""
  );
  const [connected, setConnected] = reactExports.useState(
    formData.google_calendar_connected || gcSettings.connected || false
  );
  const [connecting, setConnecting] = reactExports.useState(false);
  const [syncing, setSyncing] = reactExports.useState(false);
  const { showToast } = useToast();
  const redirectUri = yatraAdmin.googleCalendarRedirectUri || gcSettings.redirect_uri || `${siteUrl}/wp-json/yatra/v1/google-calendar/callback`;
  const lastSync = formData.google_calendar_last_sync || gcSettings.last_sync || null;
  const syncSettingsToFormData = () => {
    const allSettings = {
      google_calendar_client_id: clientId,
      google_calendar_client_secret: clientSecret,
      google_calendar_enabled: true
      // Enable by default when settings are provided
    };
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...allSettings
      };
    });
  };
  reactExports.useEffect(() => {
    syncSettingsToFormData();
  }, [clientId, clientSecret]);
  const handleConnect = async () => {
    var _a;
    setConnecting(true);
    try {
      const response = await apiClient.post("/google-calendar/connect");
      if ((_a = response.data) == null ? void 0 : _a.auth_url) {
        window.open(response.data.auth_url, "_blank");
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setConnecting(false);
    }
  };
  const handleDisconnect = async () => {
    if (!confirm(
      __(
        "Are you sure you want to disconnect from Google Calendar?",
        "yatra"
      )
    )) {
      return;
    }
    try {
      await apiClient.post("/google-calendar/disconnect");
      setConnected(false);
      setCalendarId("");
      setCalendarName("");
      showToast(__("Disconnected from Google Calendar.", "yatra"), "success");
    } catch (error) {
      showToast(
        __("Failed to disconnect. Please try again.", "yatra"),
        "error"
      );
    }
  };
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await apiClient.post("/google-calendar/sync-all");
      if (res && res.success === false) {
        showToast(
          res.message || __("Failed to sync bookings.", "yatra"),
          "error"
        );
      } else {
        showToast(
          res && res.message || __("Bookings synced to Google Calendar.", "yatra"),
          "success"
        );
      }
    } catch (error) {
      showToast(
        __("Failed to sync bookings. Please try again.", "yatra"),
        "error"
      );
    } finally {
      setSyncing(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-5 h-5 text-blue-500" }),
        __("Google Calendar Settings", "yatra")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: connected ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm text-green-600 dark:text-green-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4" }),
        __("Connected", "yatra")
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "w-4 h-4" }),
        __("Not Connected", "yatra")
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: __(
        "Connect your Google Calendar to automatically sync bookings and departures. Events will be created for each booking with trip details, traveler information, and departure dates.",
        "yatra"
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            id: "gc_client_id",
            label: __("Client ID", "yatra"),
            description: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              __("Create an OAuth client in", "yatra"),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  href: "https://console.cloud.google.com/apis/credentials",
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "text-blue-600 hover:text-blue-500 dark:text-blue-400 underline",
                  children: __("Google Cloud Credentials", "yatra")
                }
              ),
              __(", then paste the OAuth 2.0 Client ID here.", "yatra"),
              " ",
              __("Example:", "yatra"),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono", children: "123...apps.googleusercontent.com" })
            ] }),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "gc_client_id",
                value: clientId,
                onChange: (e) => setClientId(e.target.value),
                placeholder: "123456789-xxxxx.apps.googleusercontent.com"
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            id: "gc_client_secret",
            label: __("Client Secret", "yatra"),
            description: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              __(
                "Copy the Client Secret from the same OAuth client in",
                "yatra"
              ),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  href: "https://console.cloud.google.com/apis/credentials",
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "text-blue-600 hover:text-blue-500 dark:text-blue-400 underline",
                  children: __("Google Cloud Credentials", "yatra")
                }
              ),
              __(".", "yatra"),
              " ",
              __("Keep this private.", "yatra")
            ] }),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "gc_client_secret",
                type: "password",
                value: clientSecret,
                onChange: (e) => setClientSecret(e.target.value),
                placeholder: "GOCSPX-xxxxxxxxxxxxxxxxxx"
              }
            )
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FormField,
        {
          id: "gc_redirect_uri",
          label: __("Redirect URI (OAuth Callback URL)", "yatra"),
          description: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            __(
              'Add this to your OAuth client under "Authorized redirect URIs" in',
              "yatra"
            ),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "a",
              {
                href: "https://console.cloud.google.com/apis/credentials",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-blue-600 hover:text-blue-500 dark:text-blue-400 underline",
                children: __("Google Cloud Credentials", "yatra")
              }
            ),
            __(".", "yatra"),
            " ",
            __("Make sure the", "yatra"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "a",
              {
                href: "https://console.cloud.google.com/apis/library/calendar-json.googleapis.com",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-blue-600 hover:text-blue-500 dark:text-blue-400 underline",
                children: __("Google Calendar API", "yatra")
              }
            ),
            " ",
            __("is enabled.", "yatra")
          ] }),
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "gc_redirect_uri",
                value: redirectUri,
                readOnly: true,
                className: "bg-gray-50 dark:bg-gray-900 font-mono text-sm"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => navigator.clipboard.writeText(redirectUri),
                children: __("Copy", "yatra")
              }
            )
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "w-4 h-4 mt-0.5 flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 leading-relaxed", children: [
            __(
              "OAuth scopes required (add these on the Google OAuth consent screen):",
              "yatra"
            ),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "a",
              {
                href: "https://console.cloud.google.com/apis/credentials/consent",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-amber-900 dark:text-amber-200 underline",
                children: __("OAuth Consent Screen", "yatra")
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4 mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-[11px] bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded", children: "https://www.googleapis.com/auth/calendar" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4 mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-[11px] bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded", children: "https://www.googleapis.com/auth/calendar.events" })
          ] })
        ] })
      ] }),
      connected && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-medium text-sm text-green-800 dark:text-green-400 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4" }),
          __("Connected Calendar", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 md:items-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FormField,
            {
              id: "gc_calendar_id",
              label: __("Calendar ID", "yatra"),
              description: __(
                'The ID of the Google Calendar to sync events to. Use "primary" for your main calendar, or enter a specific calendar ID.',
                "yatra"
              ),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "gc_calendar_id",
                  value: calendarId,
                  onChange: (e) => setCalendarId(e.target.value),
                  placeholder: "primary"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FormField,
            {
              id: "gc_calendar_name",
              label: __("Calendar Name", "yatra"),
              description: __(
                "A friendly name for this calendar connection (for your reference only).",
                "yatra"
              ),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "gc_calendar_name",
                  value: calendarName,
                  onChange: (e) => setCalendarName(e.target.value),
                  placeholder: __("My Booking Calendar", "yatra")
                }
              )
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-2 border-t border-green-200 dark:border-green-800", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-green-700 dark:text-green-400", children: lastSync ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            __("Last sync:", "yatra"),
            " ",
            new Date(lastSync).toLocaleString()
          ] }) : __("Never synced", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "a",
              {
                href: gcDashboardUrl,
                className: "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4" }),
                  __("Open dashboard", "yatra")
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: handleSync,
                disabled: syncing,
                className: "flex items-center gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    RefreshCw,
                    {
                      className: `w-4 h-4 ${syncing ? "animate-spin" : ""}`
                    }
                  ),
                  __("Sync Now", "yatra")
                ]
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap justify-between items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: gcDashboardUrl,
              className: "flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm font-medium",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3.5 h-3.5" }),
                __("Open Google Calendar dashboard", "yatra")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: "https://console.cloud.google.com/apis/credentials",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" }),
                __("Credentials", "yatra")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: "https://console.cloud.google.com/apis/library/calendar-json.googleapis.com",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" }),
                __("Calendar API", "yatra")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: "https://console.cloud.google.com/apis/credentials/consent",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" }),
                __("OAuth Consent", "yatra")
              ]
            }
          )
        ] }),
        connected ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "destructive",
            onClick: handleDisconnect,
            className: "flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "w-4 h-4" }),
              __("Disconnect", "yatra")
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: handleConnect,
            disabled: connecting || !clientId || !clientSecret,
            className: "flex items-center gap-2",
            children: [
              connecting ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4" }),
              __("Connect to Google Calendar", "yatra")
            ]
          }
        )
      ] })
    ] })
  ] }) });
};
const getInitialFormSubTab = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("yatra_settings_booking_form_subtab");
    if (saved && ["contact_form", "emergency_contact_form", "traveler_form"].includes(
      saved
    )) {
      return saved;
    }
  }
  return "contact_form";
};
const BookingFormBuilder = ({
  formData,
  setFormData
}) => {
  var _a, _b, _c, _d;
  const [activeFormTab, setActiveFormTab] = reactExports.useState(getInitialFormSubTab);
  const { data: modulesData } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const response = await apiService.getModules();
      return response;
    },
    staleTime: 3e4
    // Cache for 30 seconds
  });
  const isDynamicFormFieldEnabled = React.useMemo(() => {
    var _a2;
    if (modulesData == null ? void 0 : modulesData.data) {
      const module = modulesData.data.find(
        (m) => m.slug === "dynamic_form_field"
      );
      return (module == null ? void 0 : module.enabled) === true && (module == null ? void 0 : module.is_available) === true;
    }
    return !!((_a2 = window.yatraAdmin) == null ? void 0 : _a2.dynamicFormFieldEnabled);
  }, [modulesData]);
  const handleSubTabChange = (tab) => {
    setActiveFormTab(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem("yatra_settings_booking_form_subtab", tab);
    }
  };
  const [editingField, setEditingField] = reactExports.useState(null);
  const [showAddField, setShowAddField] = reactExports.useState(false);
  const [newField, setNewField] = reactExports.useState({
    id: "",
    type: "text",
    label: "",
    placeholder: "",
    required: false,
    enabled: true,
    width: "full",
    options: []
  });
  const [deleteConfirm, setDeleteConfirm] = reactExports.useState({
    isOpen: false,
    fieldId: null,
    fieldLabel: ""
  });
  const [draggedFieldId, setDraggedFieldId] = reactExports.useState(null);
  const [dragOverFieldId, setDragOverFieldId] = reactExports.useState(null);
  const generateIdFromLabel = (label) => {
    return label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  };
  const sanitizeId = (id) => {
    return id.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  };
  const handleNewFieldLabelChange = (label) => {
    const autoId = generateIdFromLabel(label);
    setNewField((prev) => ({
      ...prev,
      label,
      // Only auto-generate ID if it hasn't been manually edited
      id: prev.id === "" || prev.id === generateIdFromLabel(prev.label || "") ? autoId : prev.id
    }));
  };
  const formTabs = [
    {
      id: "contact_form",
      label: __("Contact Form", "yatra"),
      description: "Lead traveler contact details"
    },
    {
      id: "emergency_contact_form",
      label: __("Emergency Contact", "yatra"),
      description: "Emergency contact information"
    },
    {
      id: "traveler_form",
      label: __("Traveler Form", "yatra"),
      description: "Individual traveler details"
    }
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
    { value: "checkbox", label: "Checkbox" }
  ];
  const widthOptions = [
    { value: "full", label: "Full Width" },
    { value: "half", label: "Half Width" },
    { value: "third", label: "One Third" }
  ];
  const getCurrentFormConfig = () => {
    var _a2;
    return ((_a2 = formData == null ? void 0 : formData.booking_form_config) == null ? void 0 : _a2[activeFormTab]) || {
      title: "",
      description: "",
      enabled: true,
      fields: []
    };
  };
  const bookingFormCapturesEmail = (() => {
    const cfg = formData == null ? void 0 : formData.booking_form_config;
    if (!cfg) return true;
    const sectionHasEnabledEmail = (section) => {
      if (!section || section.enabled === false) return false;
      return (section.fields || []).some(
        (f) => (f.type === "email" || f.id === "email") && f.enabled !== false
      );
    };
    return sectionHasEnabledEmail(cfg.contact_form) || sectionHasEnabledEmail(cfg.traveler_form);
  })();
  const updateFormConfig = (updates) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        booking_form_config: {
          ...prev.booking_form_config,
          [activeFormTab]: {
            ...prev.booking_form_config[activeFormTab],
            ...updates
          }
        }
      };
    });
  };
  const updateField = (fieldId, updates) => {
    const currentConfig2 = getCurrentFormConfig();
    const updatedFields = currentConfig2.fields.map(
      (field) => field.id === fieldId ? { ...field, ...updates } : field
    );
    updateFormConfig({ fields: updatedFields });
  };
  const toggleFieldEnabled = (fieldId) => {
    const currentConfig2 = getCurrentFormConfig();
    const field = currentConfig2.fields.find((f) => f.id === fieldId);
    if (field && !field.locked) {
      updateField(fieldId, { enabled: !field.enabled });
    }
  };
  const toggleFieldRequired = (fieldId) => {
    const currentConfig2 = getCurrentFormConfig();
    const field = currentConfig2.fields.find((f) => f.id === fieldId);
    if (field) {
      updateField(fieldId, { required: !field.required });
    }
  };
  const moveField = (fieldId, direction) => {
    const currentConfig2 = getCurrentFormConfig();
    const fields = [...currentConfig2.fields];
    const index = fields.findIndex((f) => f.id === fieldId);
    if (direction === "up" && index > 0) {
      [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
    } else if (direction === "down" && index < fields.length - 1) {
      [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
    }
    fields.forEach((field, i) => {
      field.order = i + 1;
    });
    updateFormConfig({ fields });
  };
  const handleDragStart = (e, fieldId) => {
    setDraggedFieldId(fieldId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e, fieldId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (fieldId !== draggedFieldId) {
      setDragOverFieldId(fieldId);
    }
  };
  const handleDragLeave = () => {
    setDragOverFieldId(null);
  };
  const handleDrop = (e, targetFieldId) => {
    e.preventDefault();
    if (!draggedFieldId || draggedFieldId === targetFieldId) {
      setDraggedFieldId(null);
      setDragOverFieldId(null);
      return;
    }
    const currentConfig2 = getCurrentFormConfig();
    const fields = [...currentConfig2.fields];
    const draggedIndex = fields.findIndex((f) => f.id === draggedFieldId);
    const targetIndex = fields.findIndex((f) => f.id === targetFieldId);
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedField] = fields.splice(draggedIndex, 1);
      fields.splice(targetIndex, 0, draggedField);
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
  const deleteField = (fieldId) => {
    const currentConfig2 = getCurrentFormConfig();
    const updatedFields = currentConfig2.fields.filter((f) => f.id !== fieldId);
    updatedFields.forEach((field, i) => {
      field.order = i + 1;
    });
    updateFormConfig({ fields: updatedFields });
    setDeleteConfirm({ isOpen: false, fieldId: null, fieldLabel: "" });
  };
  const addNewField = () => {
    if (!newField.label || !newField.id) return;
    const currentConfig2 = getCurrentFormConfig();
    const fieldId = sanitizeId(newField.id);
    if (currentConfig2.fields.some((f) => f.id === fieldId)) {
      window.alert(
        "A field with this ID already exists. Please use a different ID."
      );
      return;
    }
    const newFieldConfig = {
      id: fieldId,
      type: newField.type || "text",
      label: newField.label || "",
      placeholder: newField.placeholder || "",
      required: newField.required || false,
      enabled: true,
      order: currentConfig2.fields.length + 1,
      width: newField.width || "full"
    };
    if (newField.type === "select" && newField.options && newField.options.length > 0) {
      newFieldConfig.options = newField.options.filter(
        (opt) => opt.value && opt.label
      );
    }
    updateFormConfig({ fields: [...currentConfig2.fields, newFieldConfig] });
    setNewField({
      id: "",
      type: "text",
      label: "",
      placeholder: "",
      required: false,
      enabled: true,
      width: "full",
      options: []
    });
    setShowAddField(false);
  };
  const currentConfig = getCurrentFormConfig();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    ProFeature,
    {
      title: __("Dynamic Form Field", "yatra"),
      description: __(
        "customize your booking forms with drag-and-drop field builder",
        "yatra"
      ),
      moduleName: "Dynamic Form Field",
      pricingUrl: "https://wpyatra.com/pricing?module=dynamic-form-field",
      isProActive: (_a = window.yatraAdmin) == null ? void 0 : _a.isPro,
      isModuleEnabled: isDynamicFormFieldEnabled,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex gap-4", "aria-label": "Form Types", children: formTabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => handleSubTabChange(tab.id),
            className: `pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeFormTab === tab.id ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}`,
            children: tab.label
          },
          tab.id
        )) }) }),
        !bookingFormCapturesEmail && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-3 rounded-md border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20 text-sm text-red-800 dark:text-red-300", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "⚠" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __(
            "No form is set to collect an email address. An email is required for booking confirmation, the customer account and the voucher. Please enable an email field on the Contact or Traveler form — otherwise customers can't complete checkout.",
            "yatra"
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Form Section Settings", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "form_section_enabled",
                  checked: currentConfig.enabled !== false,
                  onChange: (e) => updateFormConfig({ enabled: e.target.checked }),
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Label,
                {
                  htmlFor: "form_section_enabled",
                  className: "font-medium cursor-pointer",
                  children: __("Enable this form section", "yatra")
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "form_title", children: __("Section Title", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "form_title",
                    value: currentConfig.title || "",
                    onChange: (e) => updateFormConfig({ title: e.target.value }),
                    placeholder: "Enter section title",
                    className: "mt-1"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "form_description", children: __("Section Description", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "form_description",
                    value: currentConfig.description || "",
                    onChange: (e) => updateFormConfig({ description: e.target.value }),
                    placeholder: "Enter description",
                    className: "mt-1"
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Form Fields", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => setShowAddField(!showAddField),
                className: "flex items-center gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                  __("Add Field", "yatra")
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            showAddField && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-sm mb-3", children: __("Add New Field", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: __("Field Type", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Select,
                    {
                      value: newField.type || "text",
                      onChange: (e) => setNewField((prev) => ({
                        ...prev,
                        type: e.target.value
                      })),
                      className: "mt-1",
                      children: fieldTypes.map((type) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: type.value, children: type.label }, type.value))
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs", children: [
                    __("Label", "yatra"),
                    " *"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: newField.label || "",
                      onChange: (e) => handleNewFieldLabelChange(e.target.value),
                      placeholder: "Field label",
                      className: "mt-1"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs", children: [
                    __("Field ID", "yatra"),
                    " *"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: newField.id || "",
                      onChange: (e) => setNewField((prev) => ({
                        ...prev,
                        id: sanitizeId(e.target.value)
                      })),
                      placeholder: "field_id",
                      className: "mt-1 font-mono text-xs"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-gray-400 mt-0.5", children: __("Lowercase, no spaces", "yatra") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: __("Placeholder", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: newField.placeholder || "",
                      onChange: (e) => setNewField((prev) => ({
                        ...prev,
                        placeholder: e.target.value
                      })),
                      placeholder: "Placeholder text",
                      className: "mt-1"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: __("Width", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Select,
                    {
                      value: newField.width || "full",
                      onChange: (e) => setNewField((prev) => ({
                        ...prev,
                        width: e.target.value
                      })),
                      className: "mt-1",
                      children: widthOptions.map((w) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: w.value, children: w.label }, w.value))
                    }
                  )
                ] })
              ] }),
              newField.type === "select" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-900", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-medium", children: __("Dropdown Options", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "sm",
                      onClick: () => {
                        const currentOptions = newField.options || [];
                        setNewField((prev) => ({
                          ...prev,
                          options: [
                            ...currentOptions,
                            { value: "", label: "" }
                          ]
                        }));
                      },
                      className: "h-6 text-xs",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                        __("Add Option", "yatra")
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  (newField.options || []).map((option, optIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        value: option.value,
                        onChange: (e) => {
                          const newOptions = [...newField.options || []];
                          newOptions[optIndex] = {
                            ...newOptions[optIndex],
                            value: e.target.value
                          };
                          setNewField((prev) => ({
                            ...prev,
                            options: newOptions
                          }));
                        },
                        placeholder: "Value (e.g., option1)",
                        className: "text-xs flex-1"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        value: option.label,
                        onChange: (e) => {
                          const newOptions = [...newField.options || []];
                          newOptions[optIndex] = {
                            ...newOptions[optIndex],
                            label: e.target.value
                          };
                          setNewField((prev) => ({
                            ...prev,
                            options: newOptions
                          }));
                        },
                        placeholder: "Label (e.g., Option 1)",
                        className: "text-xs flex-1"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          const newOptions = (newField.options || []).filter((_, i) => i !== optIndex);
                          setNewField((prev) => ({
                            ...prev,
                            options: newOptions
                          }));
                        },
                        className: "p-1 text-gray-400 hover:text-red-500",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
                      }
                    )
                  ] }, optIndex)),
                  (!newField.options || newField.options.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 italic", children: __(
                    'Click "Add Option" to add dropdown choices.',
                    "yatra"
                  ) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mt-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: newField.required || false,
                      onChange: (e) => setNewField((prev) => ({
                        ...prev,
                        required: e.target.checked
                      })),
                      className: "w-4 h-4 rounded border-gray-300 text-blue-600"
                    }
                  ),
                  __("Required", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    onClick: () => setShowAddField(false),
                    children: __("Cancel", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    size: "sm",
                    onClick: addNewField,
                    disabled: !newField.label || !newField.id,
                    children: __("Add Field", "yatra")
                  }
                )
              ] })
            ] }),
            ((_b = currentConfig.fields) == null ? void 0 : _b.length) === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-gray-500 dark:text-gray-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __(
              'No fields configured. Click "Add Field" to get started.',
              "yatra"
            ) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: (_c = currentConfig.fields) == null ? void 0 : _c.map((field, index) => {
              var _a2, _b2;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  draggable: true,
                  onDragStart: (e) => handleDragStart(e, field.id),
                  onDragOver: (e) => handleDragOver(e, field.id),
                  onDragLeave: handleDragLeave,
                  onDrop: (e) => handleDrop(e, field.id),
                  onDragEnd: handleDragEnd,
                  className: `flex items-center gap-3 p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${draggedFieldId === field.id ? "opacity-50 border-dashed" : ""} ${dragOverFieldId === field.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""} ${field.enabled ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(GripVertical, { className: "w-4 h-4 text-gray-400" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-0.5", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => moveField(field.id, "up"),
                            disabled: index === 0,
                            className: "p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { className: "w-3 h-3" })
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => moveField(field.id, "down"),
                            disabled: index === currentConfig.fields.length - 1,
                            className: "p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { className: "w-3 h-3" })
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: editingField === field.id ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            value: field.label,
                            onChange: (e) => updateField(field.id, { label: e.target.value }),
                            placeholder: "Label",
                            className: "text-sm"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            value: field.placeholder,
                            onChange: (e) => updateField(field.id, {
                              placeholder: e.target.value
                            }),
                            placeholder: "Placeholder",
                            className: "text-sm"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Select,
                          {
                            value: field.type,
                            onChange: (e) => updateField(field.id, {
                              type: e.target.value
                            }),
                            className: "text-sm",
                            children: fieldTypes.map((type) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: type.value, children: type.label }, type.value))
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Select,
                          {
                            value: field.width,
                            onChange: (e) => updateField(field.id, {
                              width: e.target.value
                            }),
                            className: "text-sm",
                            children: widthOptions.map((w) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: w.value, children: w.label }, w.value))
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-gray-500 whitespace-nowrap", children: __("Field ID:", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            value: field.id,
                            onChange: (e) => {
                              if (!field.locked) {
                                updateField(field.id, {
                                  id: sanitizeId(e.target.value)
                                });
                              }
                            },
                            placeholder: "field_id",
                            className: "text-sm font-mono flex-1 max-w-xs",
                            disabled: field.locked,
                            title: field.locked ? "Locked fields cannot change ID" : "Field ID (lowercase, no spaces)"
                          }
                        ),
                        field.locked && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-amber-600", children: __("(locked)", "yatra") })
                      ] }),
                      field.type === "select" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-medium", children: __("Dropdown Options", "yatra") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Button,
                            {
                              type: "button",
                              variant: "ghost",
                              size: "sm",
                              onClick: () => {
                                const newOptions = [
                                  ...field.options || [],
                                  { value: "", label: "" }
                                ];
                                updateField(field.id, {
                                  options: newOptions
                                });
                              },
                              className: "h-6 text-xs",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                                __("Add Option", "yatra")
                              ]
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                          (field.options || []).map(
                            (option, optIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              "div",
                              {
                                className: "flex items-center gap-2",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    Input,
                                    {
                                      value: option.value,
                                      onChange: (e) => {
                                        const newOptions = [
                                          ...field.options || []
                                        ];
                                        newOptions[optIndex] = {
                                          ...newOptions[optIndex],
                                          value: e.target.value
                                        };
                                        updateField(field.id, {
                                          options: newOptions
                                        });
                                      },
                                      placeholder: "Value (e.g., spouse)",
                                      className: "text-xs flex-1"
                                    }
                                  ),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    Input,
                                    {
                                      value: option.label,
                                      onChange: (e) => {
                                        const newOptions = [
                                          ...field.options || []
                                        ];
                                        newOptions[optIndex] = {
                                          ...newOptions[optIndex],
                                          label: e.target.value
                                        };
                                        updateField(field.id, {
                                          options: newOptions
                                        });
                                      },
                                      placeholder: "Label (e.g., Spouse/Partner)",
                                      className: "text-xs flex-1"
                                    }
                                  ),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    "button",
                                    {
                                      type: "button",
                                      onClick: () => {
                                        const newOptions = (field.options || []).filter((_, i) => i !== optIndex);
                                        updateField(field.id, {
                                          options: newOptions
                                        });
                                      },
                                      className: "p-1 text-gray-400 hover:text-red-500",
                                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
                                    }
                                  )
                                ]
                              },
                              optIndex
                            )
                          ),
                          (!field.options || field.options.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 italic", children: __(
                            'No options. Click "Add Option" to add dropdown choices.',
                            "yatra"
                          ) })
                        ] })
                      ] })
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm", children: field.label }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono", children: field.id }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400 dark:text-gray-500 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded", children: ((_a2 = fieldTypes.find((t) => t.value === field.type)) == null ? void 0 : _a2.label) || field.type }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400 dark:text-gray-500", children: ((_b2 = widthOptions.find((w) => w.value === field.width)) == null ? void 0 : _b2.label) || "Full" }),
                      field.type === "select" && field.options && field.options.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-blue-500 dark:text-blue-400", children: [
                        "(",
                        field.options.length,
                        " ",
                        field.options.length === 1 ? "option" : "options",
                        ")"
                      ] }),
                      field.required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-red-500 font-medium", children: __("Required", "yatra") }),
                      field.locked && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "span",
                        {
                          className: "inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded",
                          title: "This field is protected and cannot be deleted",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-3 h-3" }),
                            "Locked"
                          ]
                        }
                      )
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => !field.locked && toggleFieldRequired(field.id),
                          disabled: field.locked,
                          className: `p-1.5 rounded ${field.locked ? "cursor-not-allowed opacity-50" : ""} ${field.required ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-gray-400 hover:text-gray-600"}`,
                          title: field.locked ? "This field is required and cannot be changed" : field.required ? "Make optional" : "Make required",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Star,
                            {
                              className: "w-4 h-4",
                              fill: field.required ? "currentColor" : "none"
                            }
                          )
                        }
                      ),
                      !field.locked && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => toggleFieldEnabled(field.id),
                          className: `p-1.5 rounded ${field.enabled ? "text-green-500" : "text-gray-400"}`,
                          title: field.enabled ? "Disable field" : "Enable field",
                          children: field.enabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "w-4 h-4" })
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => setEditingField(
                            editingField === field.id ? null : field.id
                          ),
                          className: "p-1.5 rounded text-gray-400 hover:text-blue-500",
                          title: "Edit field",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "w-4 h-4" })
                        }
                      ),
                      !field.locked && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => setDeleteConfirm({
                            isOpen: true,
                            fieldId: field.id,
                            fieldLabel: field.label
                          }),
                          className: "p-1.5 rounded text-gray-400 hover:text-red-500",
                          title: "Delete field",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" })
                        }
                      )
                    ] })
                  ]
                },
                field.id
              );
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ConfirmationDialog,
          {
            isOpen: deleteConfirm.isOpen,
            onClose: () => setDeleteConfirm({ isOpen: false, fieldId: null, fieldLabel: "" }),
            onConfirm: () => {
              if (deleteConfirm.fieldId) {
                deleteField(deleteConfirm.fieldId);
              }
            },
            title: __("Delete Field", "yatra"),
            message: `Are you sure you want to delete the field "${deleteConfirm.fieldLabel}"? This action cannot be undone.`,
            confirmText: __("Delete", "yatra"),
            cancelText: __("Cancel", "yatra"),
            variant: "danger"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Preview", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-800 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-lg mb-1", children: currentConfig.title || "Form Section" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-4", children: currentConfig.description }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4", children: (_d = currentConfig.fields) == null ? void 0 : _d.filter((f) => f.enabled).map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: field.width === "full" ? "col-span-2" : field.width === "third" ? "col-span-1" : "col-span-1",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-sm", children: [
                    field.label,
                    field.required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500 ml-1", children: "*" })
                  ] }),
                  field.type === "select" || field.type === "country" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Select, { disabled: true, className: "mt-1 w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: field.placeholder || "Select..." }) }) : field.type === "textarea" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "textarea",
                    {
                      disabled: true,
                      placeholder: field.placeholder,
                      className: "mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-sm",
                      rows: 2
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      disabled: true,
                      type: field.type,
                      placeholder: field.placeholder,
                      className: "mt-1"
                    }
                  )
                ]
              },
              field.id
            )) })
          ] }) })
        ] })
      ]
    }
  ) });
};
const Settings = () => {
  var _a, _b;
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const getInitialActiveSection = () => {
    const VALID_SECTIONS = [
      "general",
      "design",
      "booking",
      "booking_form",
      "payment",
      "trip",
      "customer",
      "review",
      "tax",
      "currency",
      "integration",
      "permalink",
      "seo",
      "advanced"
    ];
    if (typeof window !== "undefined") {
      const fromUrl = new URLSearchParams(window.location.search).get(
        "section"
      );
      if (fromUrl && VALID_SECTIONS.includes(fromUrl)) {
        return fromUrl;
      }
      const saved = localStorage.getItem("yatra_settings_active_section");
      if (saved === "email" || saved === "notification") {
        return "general";
      }
      if (saved && [
        "general",
        "design",
        "booking",
        "booking_form",
        "payment",
        "trip",
        "customer",
        "review",
        "tax",
        "currency",
        "integration",
        "permalink",
        "seo",
        "advanced"
      ].includes(saved)) {
        return saved;
      }
    }
    return "general";
  };
  const [activeSection, setActiveSection] = reactExports.useState(
    getInitialActiveSection()
  );
  const [viewingSection, setViewingSection] = reactExports.useState(
    getInitialActiveSection()
  );
  const [isSaving, setIsSaving] = reactExports.useState(false);
  const [expandedGateways, setExpandedGateways] = reactExports.useState({});
  const [gatewayOrder, setGatewayOrder] = reactExports.useState([]);
  const [draggedGateway, setDraggedGateway] = reactExports.useState(null);
  const [usageStatus, setUsageStatus] = reactExports.useState(
    null
  );
  const [usageBusy, setUsageBusy] = reactExports.useState(false);
  const [usageLoading, setUsageLoading] = reactExports.useState(false);
  const [usageError, setUsageError] = reactExports.useState("");
  reactExports.useEffect(() => {
    setViewingSection(activeSection);
  }, [activeSection]);
  const {
    data: settings,
    isLoading,
    error
  } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        return await fetchSettings();
      } catch (error2) {
        console.error("Error fetching settings:", error2);
        showToast(
          (error2 == null ? void 0 : error2.message) || __("Failed to load settings", "yatra"),
          "error"
        );
        throw error2;
      }
    },
    enabled: can("yatra_manage_settings")
    // Avoid overwriting in-progress edits due to background refetches
  });
  const { data: gatewayDefinitions } = useQuery({
    queryKey: ["payment-gateways-definitions"],
    queryFn: async () => {
      try {
        const response = await fetchPaymentGatewayDefinitions();
        return response.gateways || {};
      } catch (error2) {
        console.error("Failed to load gateway definitions:", error2);
        return {};
      }
    },
    enabled: can("yatra_manage_settings"),
    staleTime: Infinity
  });
  reactExports.useEffect(() => {
    if (viewingSection !== "advanced" || !can("yatra_manage_settings")) {
      return;
    }
    let cancelled = false;
    setUsageLoading(true);
    setUsageError("");
    (async () => {
      var _a2;
      try {
        const s = await fetchUsageTrackingStatus();
        if (!cancelled) {
          setUsageStatus(s);
        }
      } catch (e) {
        if (!cancelled) {
          setUsageStatus(null);
          const status = ((_a2 = e == null ? void 0 : e.response) == null ? void 0 : _a2.status) != null ? ` (HTTP ${e.response.status})` : "";
          const msg = (typeof (e == null ? void 0 : e.message) === "string" && e.message.trim() !== "" ? e.message : __("Failed to load usage tracking status", "yatra")) + status;
          setUsageError(msg);
        }
      } finally {
        setUsageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewingSection, can]);
  const defaultSettings = reactExports.useMemo(
    () => ({
      company_name: "Yatra Travel Agency",
      company_email: "info@wpyatra.com",
      company_phone: "+1-234-567-8900",
      company_address: "123 Travel Street",
      company_city: "Kathmandu",
      company_state: "Bagmati",
      company_country: "Nepal",
      company_zip: "44600",
      company_website: "https://wpyatra.com",
      company_logo: "",
      timezone: "Asia/Kathmandu",
      date_format: "Y-m-d",
      time_format: "H:i",
      frontend_primary_color: "#3b82f6",
      frontend_container_max_width: "",
      // Search & Listing — defaults match current behaviour (all fields shown,
      // mobile filters expanded) so existing sites are unchanged.
      search_show_keyword: true,
      search_show_destination: true,
      search_show_activities: true,
      search_show_duration: true,
      search_show_budget: true,
      collapse_filters_on_mobile: false,
      booking_confirmation: true,
      auto_confirm_bookings: false,
      require_login: false,
      allow_guest_checkout: true,
      require_guest_email_verification: false,
      booking_expiry_hours: 24,
      booking_reminder_days: 3,
      allow_waitlist: true,
      waitlist_auto_confirm: false,
      date_picker_as_dropdown: false,
      currency: "USD",
      payment_test_mode: true,
      payment_gateways: ["pay_later"],
      payment_methods: ["credit_card", "paypal", "bank_transfer"],
      partial_payment: true,
      partial_payment_percentage: 30,
      deposit_required: true,
      deposit_percentage: 20,
      auto_confirm_pay_later: true,
      enable_scheduled_payments: false,
      scheduled_payment_type: "single",
      scheduled_payment_days: 15,
      scheduled_payment_installments: 1,
      discount_stacking_mode: "both",
      scheduled_payment_interval: 30,
      scheduled_payment_reminder_days: 3,
      gateway_configs: {
        stripe: {
          enabled: true,
          title: "Stripe",
          description: "Accept credit and debit cards",
          api_key: "",
          api_secret: "",
          webhook_secret: ""
        },
        paypal: {
          enabled: true,
          title: "PayPal",
          description: "Accept PayPal payments",
          client_id: "",
          client_secret: ""
        },
        razorpay: {
          enabled: false,
          title: "Razorpay",
          description: "Accept payments via Razorpay",
          api_key: "",
          api_secret: ""
        },
        square: {
          enabled: false,
          title: "Square",
          description: "Accept payments via Square",
          api_key: "",
          api_secret: ""
        },
        authorize_net: {
          enabled: false,
          title: "Authorize.net",
          description: "Accept payments via Authorize.net",
          api_key: "",
          api_secret: ""
        },
        bank_transfer: {
          enabled: false,
          title: "Bank Transfer",
          description: "Accept manual bank transfer payments",
          api_key: "",
          // Used for bank account name
          api_secret: "",
          // Used for bank account number
          public_key: "",
          // Used for bank name
          private_key: ""
          // Used for routing/SWIFT code
        },
        esewa: {
          enabled: false,
          title: "eSewa",
          description: "Accept payments via eSewa (Nepal)",
          api_key: "",
          api_secret: ""
        },
        khalti: {
          enabled: false,
          title: "Khalti",
          description: "Accept payments via Khalti (Nepal)",
          api_key: "",
          api_secret: ""
        },
        pay_later: {
          enabled: false,
          title: "Book Now, Pay Later",
          description: "Allow customers to reserve now and pay before the trip",
          api_key: "",
          // Used for payment deadline days
          api_secret: ""
          // Used for auto-cancel days
        }
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
        "khalti"
      ],
      admin_email: "admin@wpyatra.com",
      from_email: "noreply@wpyatra.com",
      from_name: "Yatra Travel",
      email_template_booking: true,
      email_template_confirmation: true,
      email_template_cancellation: true,
      email_template_reminder: true,
      email_template_admin_new_booking: true,
      email_template_admin_payment: true,
      email_template_admin_cancellation: true,
      email_template_trip_consent: true,
      email_template_customer_verification: true,
      email_template_booking_completed: true,
      email_template_booking_expired_customer: true,
      email_template_admin_booking_expired: true,
      email_template_scheduled_payment_reminder: true,
      email_template_scheduled_payment_succeeded: true,
      email_template_scheduled_payment_failed: true,
      email_template_admin_scheduled_payment_failed: true,
      email_template_enquiry_received: true,
      email_template_enquiry_admin: true,
      email_template_enquiry_response: true,
      email_template_review_request: true,
      email_template_abandoned_booking_recovery_first: true,
      email_template_abandoned_booking_recovery_second: true,
      email_template_abandoned_booking_recovery_final: true,
      smtp_enabled: false,
      smtp_host: "smtp.gmail.com",
      smtp_port: 587,
      smtp_username: "",
      smtp_password: "",
      smtp_encryption: "tls",
      email_tpl_booking_subject: "",
      email_tpl_booking_body: "",
      email_tpl_payment_subject: "",
      email_tpl_payment_body: "",
      email_tpl_cancellation_subject: "",
      email_tpl_cancellation_body: "",
      email_tpl_reminder_subject: "",
      email_tpl_reminder_body: "",
      email_tpl_admin_booking_subject: "",
      email_tpl_admin_booking_body: "",
      email_tpl_admin_payment_subject: "",
      email_tpl_admin_payment_body: "",
      email_tpl_admin_cancellation_subject: "",
      email_tpl_admin_cancellation_body: "",
      email_tpl_trip_consent_subject: "",
      email_tpl_trip_consent_body: "",
      email_tpl_customer_verification_subject: "",
      email_tpl_customer_verification_body: "",
      email_tpl_booking_completed_subject: "",
      email_tpl_booking_completed_body: "",
      email_tpl_booking_expired_customer_subject: "",
      email_tpl_booking_expired_customer_body: "",
      email_tpl_admin_booking_expired_subject: "",
      email_tpl_admin_booking_expired_body: "",
      email_tpl_scheduled_payment_reminder_subject: "",
      email_tpl_scheduled_payment_reminder_body: "",
      email_tpl_scheduled_payment_succeeded_subject: "",
      email_tpl_scheduled_payment_succeeded_body: "",
      email_tpl_scheduled_payment_failed_subject: "",
      email_tpl_scheduled_payment_failed_body: "",
      email_tpl_admin_scheduled_payment_failed_subject: "",
      email_tpl_admin_scheduled_payment_failed_body: "",
      email_tpl_enquiry_received_subject: "",
      email_tpl_enquiry_received_body: "",
      email_tpl_enquiry_admin_subject: "",
      email_tpl_enquiry_admin_body: "",
      email_tpl_enquiry_response_subject: "",
      email_tpl_enquiry_response_body: "",
      email_tpl_review_request_subject: "",
      email_tpl_review_request_body: "",
      email_tpl_abandoned_booking_recovery_first_subject: "",
      email_tpl_abandoned_booking_recovery_first_body: "",
      email_tpl_abandoned_booking_recovery_second_subject: "",
      email_tpl_abandoned_booking_recovery_second_body: "",
      email_tpl_abandoned_booking_recovery_final_subject: "",
      email_tpl_abandoned_booking_recovery_final_body: "",
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
      tax_name: __("Tax", "yatra"),
      tax_rate: 10,
      tax_inclusive: false,
      vat_number: "",
      tax_by_country: false,
      tax_rates: {},
      multiple_taxes_enabled: false,
      multiple_taxes: [],
      multiple_taxes_by_country: {},
      default_currency: "USD",
      multi_currency: false,
      currency_position: "left",
      currency_decimals: 2,
      thousand_separator: ",",
      decimal_separator: ".",
      sms_notifications: false,
      sms_provider: "twilio",
      sms_api_key: "",
      google_analytics: "",
      facebook_pixel: "",
      recaptcha_enabled: false,
      recaptcha_site_key: "",
      recaptcha_secret_key: "",
      trip_base: "trip",
      destination_base: "destination",
      activity_base: "activity",
      trip_category_base: "trip-category",
      booking_base: "book",
      enable_wishlist: false,
      use_booking_page: false,
      booking_page_id: 0,
      terms_page_id: 0,
      privacy_policy_page_id: 0,
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
              locked: true
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
              locked: true
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
              locked: true
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
              locked: true
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
              locked: true
            },
            {
              id: "nationality",
              type: "country",
              label: "Nationality",
              placeholder: "Select Nationality",
              required: false,
              enabled: true,
              order: 6,
              width: "half"
            },
            {
              id: "address",
              type: "text",
              label: "Address",
              placeholder: "Street address (optional)",
              required: false,
              enabled: true,
              order: 7,
              width: "full"
            }
          ]
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
              width: "half"
            },
            {
              id: "phone",
              type: "tel",
              label: "Contact Phone",
              placeholder: "+1 234 567 8900",
              required: true,
              enabled: true,
              order: 2,
              width: "half"
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
                { value: "other", label: "Other" }
              ]
            }
          ]
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
              placeholder: "Legal first name",
              required: true,
              enabled: true,
              order: 1,
              width: "half"
            },
            {
              id: "last_name",
              type: "text",
              label: "Last Name",
              placeholder: "Legal last name",
              required: true,
              enabled: true,
              order: 2,
              width: "half"
            },
            {
              id: "date_of_birth",
              type: "date",
              label: "Date of Birth",
              placeholder: "",
              required: true,
              enabled: true,
              order: 3,
              width: "half"
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
                { value: "other", label: "Other" }
              ]
            },
            {
              id: "nationality",
              type: "country",
              label: "Nationality",
              placeholder: "Select Nationality",
              required: true,
              enabled: true,
              order: 5,
              width: "full"
            },
            {
              id: "dietary",
              type: "select",
              label: "Dietary Requirements",
              placeholder: "Select",
              required: false,
              enabled: true,
              order: 6,
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
                { value: "other", label: "Other (specify in notes)" }
              ]
            },
            {
              id: "medical",
              type: "text",
              label: "Medical Conditions / Allergies",
              placeholder: "Any allergies or conditions",
              required: false,
              enabled: true,
              order: 7,
              width: "half",
              section: "dietary_medical"
            }
          ]
        }
      },
      // SEO Settings
      seo_trip_meta_title: "",
      seo_trip_meta_description: "",
      seo_trip_meta_keywords: "",
      seo_trip_meta_image: 0
    }),
    []
  );
  const [formData, setFormData] = reactExports.useState(null);
  const isInitializedRef = React.useRef(false);
  const [mailchimpConnectionStatus, setMailchimpConnectionStatus] = reactExports.useState(null);
  const [mailchimpLists, setMailchimpLists] = reactExports.useState([]);
  const [mailchimpMergeFields, setMailchimpMergeFields] = reactExports.useState([]);
  const [showApiKey, setShowApiKey] = reactExports.useState(false);
  const [validatingApiKey, setValidatingApiKey] = reactExports.useState(false);
  const [showFacebookToken, setShowFacebookToken] = reactExports.useState(false);
  const [showGa4ApiSecret, setShowGa4ApiSecret] = reactExports.useState(false);
  const [seoImageUrl, setSeoImageUrl] = reactExports.useState("");
  const [seoImageLoading, setSeoImageLoading] = reactExports.useState(false);
  const [seoImageError, setSeoImageError] = reactExports.useState("");
  const [newTaxName, setNewTaxName] = reactExports.useState("");
  const [newTaxRate, setNewTaxRate] = reactExports.useState("");
  const [showPremiumDialog, setShowPremiumDialog] = reactExports.useState(false);
  const [selectedPremiumGateway, setSelectedPremiumGateway] = reactExports.useState("");
  const [validatingPixel, setValidatingPixel] = reactExports.useState(false);
  const [validatingToken, setValidatingToken] = reactExports.useState(false);
  const [validatingMeasurementId, setValidatingMeasurementId] = reactExports.useState(false);
  const [validatingApiSecret, setValidatingApiSecret] = reactExports.useState(false);
  const validateMailchimpApiKey = async () => {
    var _a2, _b2;
    if (!(formData == null ? void 0 : formData.mailchimp_api_key)) return;
    setValidatingApiKey(true);
    try {
      const response = await apiClient.post("/mailchimp/test", {
        api_key: formData.mailchimp_api_key
      });
      if (response.success) {
        const updatedMailchimpData = {
          ...((_a2 = window.yatraAdmin) == null ? void 0 : _a2.mailchimp) || {},
          connectionStatus: {
            connected: true,
            error: null
          }
        };
        if (window.yatraAdmin) {
          window.yatraAdmin.mailchimp = updatedMailchimpData;
        }
        setMailchimpConnectionStatus({
          connected: true,
          error: void 0
        });
        await loadMailchimpLists();
      }
    } catch (error2) {
      const updatedMailchimpData = {
        ...((_b2 = window.yatraAdmin) == null ? void 0 : _b2.mailchimp) || {},
        connectionStatus: {
          connected: false,
          error: error2.message || __("Invalid API key", "yatra")
        }
      };
      if (window.yatraAdmin) {
        window.yatraAdmin.mailchimp = updatedMailchimpData;
      }
      setMailchimpConnectionStatus({
        connected: false,
        error: error2.message || __("Invalid API key", "yatra")
      });
      console.error("API key validation failed:", error2);
    } finally {
      setValidatingApiKey(false);
    }
  };
  const loadMailchimpLists = async () => {
    var _a2;
    try {
      const response = await apiClient.get("/mailchimp/lists");
      if (response.success && response.data) {
        setMailchimpLists(response.data);
        const updatedMailchimpData = {
          ...((_a2 = window.yatraAdmin) == null ? void 0 : _a2.mailchimp) || {},
          availableLists: response.data
        };
        if (window.yatraAdmin) {
          window.yatraAdmin.mailchimp = updatedMailchimpData;
        }
      }
    } catch (error2) {
      console.error("Error loading Mailchimp lists:", error2);
      setMailchimpLists([]);
    }
  };
  const loadMailchimpMergeFields = async (listId) => {
    var _a2;
    if (!listId) {
      setMailchimpMergeFields([]);
      return;
    }
    try {
      const response = await apiClient.get(
        `/mailchimp/lists/${listId}/merge-fields`
      );
      if (response.success && response.data) {
        setMailchimpMergeFields(response.data);
        const updatedMailchimpData = {
          ...((_a2 = window.yatraAdmin) == null ? void 0 : _a2.mailchimp) || {},
          mergeFields: response.data
        };
        if (window.yatraAdmin) {
          window.yatraAdmin.mailchimp = updatedMailchimpData;
        }
      }
    } catch (error2) {
      console.error("Error loading Mailchimp merge fields:", error2);
      setMailchimpMergeFields([]);
    }
  };
  React.useEffect(() => {
    if ((formData == null ? void 0 : formData.mailchimp_list_id) && (mailchimpConnectionStatus == null ? void 0 : mailchimpConnectionStatus.connected)) {
      loadMailchimpMergeFields(formData.mailchimp_list_id);
    }
  }, [formData == null ? void 0 : formData.mailchimp_list_id, mailchimpConnectionStatus == null ? void 0 : mailchimpConnectionStatus.connected]);
  React.useEffect(() => {
    var _a2, _b2;
    if ((_b2 = (_a2 = window.yatraAdmin) == null ? void 0 : _a2.mailchimp) == null ? void 0 : _b2.connectionStatus) {
      setMailchimpConnectionStatus(
        window.yatraAdmin.mailchimp.connectionStatus
      );
    }
  }, []);
  const validateMeasurementId = async () => {
    if (!(formData == null ? void 0 : formData.ga4_measurement_id)) return;
    setValidatingMeasurementId(true);
    try {
      const raw = await apiService.validateGoogleAnalyticsMeasurementId(
        formData.ga4_measurement_id
      );
      if (raw == null ? void 0 : raw.success) {
        showToast(
          __("Measurement ID validated successfully!", "yatra"),
          "success"
        );
      } else {
        showToast(
          (raw == null ? void 0 : raw.message) || __("Measurement ID validation failed.", "yatra"),
          "error"
        );
      }
    } catch (error2) {
      showToast(
        error2.message || __("Failed to validate Measurement ID.", "yatra"),
        "error"
      );
    } finally {
      setValidatingMeasurementId(false);
    }
  };
  const validateApiSecret = async () => {
    if (!(formData == null ? void 0 : formData.ga4_measurement_id) || !(formData == null ? void 0 : formData.ga4_api_secret)) return;
    setValidatingApiSecret(true);
    try {
      const raw = await apiService.validateGoogleAnalyticsApiSecret(
        formData.ga4_measurement_id,
        formData.ga4_api_secret
      );
      if (raw == null ? void 0 : raw.success) {
        showToast(__("API Secret validated successfully!", "yatra"), "success");
      } else {
        showToast(
          (raw == null ? void 0 : raw.message) || __("API Secret validation failed.", "yatra"),
          "error"
        );
      }
    } catch (error2) {
      showToast(
        error2.message || __("Failed to validate API Secret.", "yatra"),
        "error"
      );
    } finally {
      setValidatingApiSecret(false);
    }
  };
  const validateFacebookPixel = async () => {
    var _a2, _b2, _c, _d, _e, _f;
    if (!(formData == null ? void 0 : formData.facebook_pixel_id)) return;
    setValidatingPixel(true);
    try {
      const response = await apiClient.post("/facebook-pixel/test", {
        pixel_id: formData.facebook_pixel_id
      });
      if (response.success) {
        const updatedFacebookPixelData = {
          ...((_a2 = window.yatraAdmin) == null ? void 0 : _a2.facebookPixel) || {},
          connectionStatus: {
            ...((_c = (_b2 = window.yatraAdmin) == null ? void 0 : _b2.facebookPixel) == null ? void 0 : _c.connectionStatus) || {},
            pixelConnected: true,
            pixelError: null
          }
        };
        if (window.yatraAdmin) {
          window.yatraAdmin.facebookPixel = updatedFacebookPixelData;
        }
      }
    } catch (error2) {
      const updatedFacebookPixelData = {
        ...((_d = window.yatraAdmin) == null ? void 0 : _d.facebookPixel) || {},
        connectionStatus: {
          ...((_f = (_e = window.yatraAdmin) == null ? void 0 : _e.facebookPixel) == null ? void 0 : _f.connectionStatus) || {},
          pixelConnected: false,
          pixelError: error2.message || __("Invalid Pixel ID", "yatra")
        }
      };
      if (window.yatraAdmin) {
        window.yatraAdmin.facebookPixel = updatedFacebookPixelData;
      }
      console.error("Pixel validation failed:", error2);
    } finally {
      setValidatingPixel(false);
    }
  };
  const validateFacebookToken = async () => {
    var _a2, _b2, _c, _d, _e, _f;
    if (!(formData == null ? void 0 : formData.facebook_access_token)) return;
    setValidatingToken(true);
    try {
      const response = await apiClient.post("/facebook-pixel/test-token", {
        access_token: formData.facebook_access_token
      });
      if (response.success) {
        const updatedFacebookPixelData = {
          ...((_a2 = window.yatraAdmin) == null ? void 0 : _a2.facebookPixel) || {},
          connectionStatus: {
            ...((_c = (_b2 = window.yatraAdmin) == null ? void 0 : _b2.facebookPixel) == null ? void 0 : _c.connectionStatus) || {},
            tokenConnected: true,
            tokenError: null
          }
        };
        if (window.yatraAdmin) {
          window.yatraAdmin.facebookPixel = updatedFacebookPixelData;
        }
      }
    } catch (error2) {
      const updatedFacebookPixelData = {
        ...((_d = window.yatraAdmin) == null ? void 0 : _d.facebookPixel) || {},
        connectionStatus: {
          ...((_f = (_e = window.yatraAdmin) == null ? void 0 : _e.facebookPixel) == null ? void 0 : _f.connectionStatus) || {},
          tokenConnected: false,
          tokenError: error2.message || __("Invalid access token", "yatra")
        }
      };
      if (window.yatraAdmin) {
        window.yatraAdmin.facebookPixel = updatedFacebookPixelData;
      }
      console.error("Access token validation failed:", error2);
    } finally {
      setValidatingToken(false);
    }
  };
  React.useEffect(() => {
    if (isInitializedRef.current) return;
    if (settings) {
      const mergedSettings = {
        ...defaultSettings,
        ...settings,
        // Ensure gateway_configs from defaults are merged with any saved configs
        gateway_configs: {
          ...defaultSettings.gateway_configs,
          ...settings.gateway_configs || {}
        }
      };
      setFormData(mergedSettings);
      isInitializedRef.current = true;
    } else if (!isLoading && !settings) {
      setFormData(defaultSettings);
      isInitializedRef.current = true;
    }
  }, [settings, isLoading]);
  React.useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const fetchSeoImageUrl = async () => {
      var _a2;
      const imageId = formData == null ? void 0 : formData.seo_trip_meta_image;
      if (!imageId || imageId <= 0) {
        if (isMounted) {
          setSeoImageUrl("");
          setSeoImageLoading(false);
          setSeoImageError("");
        }
        return;
      }
      if (isMounted) {
        setSeoImageLoading(true);
        setSeoImageError("");
      }
      try {
        const siteUrl = ((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || "";
        const response = await fetch(
          `${siteUrl}/wp-json/wp/v2/media/${imageId}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json"
            }
          }
        );
        if (!isMounted) return;
        if (response.ok) {
          const mediaData = await response.json();
          const imageUrl = mediaData == null ? void 0 : mediaData.source_url;
          if (imageUrl && typeof imageUrl === "string") {
            setSeoImageUrl(imageUrl);
            setSeoImageError("");
          } else {
            setSeoImageUrl("");
            setSeoImageError("Image not found");
          }
        } else {
          setSeoImageUrl("");
          setSeoImageError(`Failed to load image (${response.status})`);
        }
      } catch (error2) {
        if (isMounted) {
          console.error("Error fetching SEO image:", error2);
          setSeoImageUrl("");
          setSeoImageError(
            error2 instanceof Error ? error2.message : "Unknown error"
          );
        }
      } finally {
        if (isMounted) {
          setSeoImageLoading(false);
        }
      }
    };
    fetchSeoImageUrl();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [formData == null ? void 0 : formData.seo_trip_meta_image]);
  React.useEffect(() => {
    if (gatewayDefinitions && Object.keys(gatewayDefinitions).length > 0 && gatewayOrder.length === 0) {
      const savedOrder = settings == null ? void 0 : settings.gateway_order;
      if (savedOrder) {
        const allGateways = Object.keys(gatewayDefinitions);
        const validSavedOrder = savedOrder.filter(
          (id) => allGateways.includes(id)
        );
        const newGateways = allGateways.filter(
          (id) => !validSavedOrder.includes(id)
        );
        setGatewayOrder([...validSavedOrder, ...newGateways]);
      } else {
        setGatewayOrder(Object.keys(gatewayDefinitions));
      }
    }
  }, [gatewayDefinitions, settings == null ? void 0 : settings.gateway_order, gatewayOrder.length]);
  const handleFieldChange = React.useCallback(
    (e) => {
      const field = e.target.name || e.target.id;
      let value;
      if (e.target.type === "checkbox") {
        value = e.target.checked;
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
    []
  );
  const timeZoneSelectOptions = reactExports.useMemo(() => {
    var _a2;
    const ya = window.yatraAdmin || {};
    const raw = ya.timeZoneIdentifiers;
    let ids = [];
    if (Array.isArray(raw) && raw.length > 0 && raw.every((x) => typeof x === "string")) {
      ids = raw;
    } else {
      ids = [
        "UTC",
        "America/New_York",
        "America/Los_Angeles",
        "Europe/London",
        "Europe/Paris",
        "Asia/Dubai",
        "Asia/Kolkata",
        "Asia/Kathmandu",
        "Australia/Sydney"
      ];
    }
    const set = new Set(ids);
    const wpTz = typeof ya.wordPressTimezone === "string" ? ya.wordPressTimezone.trim() : "";
    if (wpTz) {
      set.add(wpTz);
    }
    const current = (_a2 = formData == null ? void 0 : formData.timezone) == null ? void 0 : _a2.trim();
    if (current) {
      set.add(current);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b)).map((z) => ({ value: z, label: z }));
  }, [formData == null ? void 0 : formData.timezone]);
  const handleGatewayConfigChange = React.useCallback(
    (gateway, field, value) => {
      setFormData((prev) => {
        if (!prev) return prev;
        const configs = { ...prev.gateway_configs || {} };
        const existingConfig = configs[gateway] || {
          enabled: false,
          title: gateway,
          description: ""
        };
        configs[gateway] = { ...existingConfig, [field]: value };
        return { ...prev, gateway_configs: configs };
      });
      if (field === "enabled" && value === true) {
        setExpandedGateways((prev) => ({ ...prev, [gateway]: true }));
      }
      if (field === "enabled" && value === false) {
        setExpandedGateways((prev) => ({ ...prev, [gateway]: false }));
      }
    },
    []
  );
  const toggleGatewayExpanded = (gateway) => {
    setExpandedGateways((prev) => ({ ...prev, [gateway]: !prev[gateway] }));
  };
  const moveGatewayUp = (gatewayId) => {
    setGatewayOrder((prev) => {
      const index = prev.indexOf(gatewayId);
      if (index <= 0) return prev;
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [
        newOrder[index],
        newOrder[index - 1]
      ];
      setFormData(
        (current) => current ? { ...current, gateway_order: newOrder } : current
      );
      return newOrder;
    });
  };
  const moveGatewayDown = (gatewayId) => {
    setGatewayOrder((prev) => {
      const index = prev.indexOf(gatewayId);
      if (index < 0 || index >= prev.length - 1) return prev;
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [
        newOrder[index + 1],
        newOrder[index]
      ];
      setFormData(
        (current) => current ? { ...current, gateway_order: newOrder } : current
      );
      return newOrder;
    });
  };
  const handleDragStart = (e, gatewayId) => {
    setDraggedGateway(gatewayId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (e, targetGatewayId) => {
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
      setFormData(
        (current) => current ? { ...current, gateway_order: newOrder } : current
      );
      return newOrder;
    });
    setDraggedGateway(null);
  };
  const handleDragEnd = () => {
    setDraggedGateway(null);
  };
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      try {
        await saveSettings(data);
        return data;
      } catch (error2) {
        showToast(
          (error2 == null ? void 0 : error2.message) || __("Failed to save settings", "yatra"),
          "error"
        );
        throw error2;
      }
    },
    onSuccess: (savedData) => {
      queryClient.setQueryData(["settings"], savedData);
      showToast(__("Settings saved successfully", "yatra"), "success");
      setIsSaving(false);
      setFormData(savedData);
      isInitializedRef.current = true;
    },
    onError: (error2) => {
      setIsSaving(false);
      const errorMessage = (error2 == null ? void 0 : error2.message) || __("Error saving settings", "yatra");
      showToast(errorMessage, "error");
    }
  });
  const flushRewriteRulesMutation = useMutation({
    mutationFn: async () => {
      return await postFlushRewriteRules();
    },
    onSuccess: () => {
      showToast(__("Rewrite rules flushed successfully", "yatra"), "success");
    },
    onError: (error2) => {
      showToast(
        (error2 == null ? void 0 : error2.message) || __("Failed to flush rewrite rules", "yatra"),
        "error"
      );
    }
  });
  const { data: pagesData } = useQuery({
    queryKey: ["wordpress-pages"],
    queryFn: async () => {
      const response = await fetchWordPressPages();
      return response;
    },
    // Used by multiple sections (Booking page, Legal pages, etc.), so keep it available
    // whenever the user can manage Yatra settings.
    enabled: can("yatra_manage_settings")
  });
  const checkShortcodeMutation = useMutation({
    mutationFn: async (pageId) => {
      const response = await fetchBookingPageShortcodeStatus(pageId);
      return response;
    }
  });
  const insertShortcodeMutation = useMutation({
    mutationFn: async (pageId) => {
      return await postInsertBookingShortcode(pageId);
    },
    onSuccess: () => {
      showToast(__("Shortcode added successfully", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["wordpress-pages"] });
    },
    onError: (error2) => {
      showToast(
        (error2 == null ? void 0 : error2.message) || __("Failed to add shortcode", "yatra"),
        "error"
      );
    }
  });
  const [showShortcodeDialog, setShowShortcodeDialog] = reactExports.useState(false);
  const [selectedPageForShortcode, setSelectedPageForShortcode] = reactExports.useState(null);
  const [isCheckingShortcode, setIsCheckingShortcode] = reactExports.useState(false);
  const handleBookingPageChange = async (pageId) => {
    if (pageId === 0) {
      handleFieldChange({
        target: { name: "booking_page_id", value: 0 }
      });
      handleFieldChange({
        target: { name: "use_booking_page", value: false }
      });
      return;
    }
    const page = pagesData == null ? void 0 : pagesData.find((p) => p.id === pageId);
    if (!page) return;
    setIsCheckingShortcode(true);
    try {
      const result = await checkShortcodeMutation.mutateAsync(pageId);
      if (result.has_shortcode) {
        handleFieldChange({
          target: { name: "booking_page_id", value: pageId }
        });
        handleFieldChange({
          target: { name: "use_booking_page", value: true }
        });
        showToast(__("Booking page selected successfully", "yatra"), "success");
      } else {
        setSelectedPageForShortcode({ id: pageId, title: page.title });
        setShowShortcodeDialog(true);
      }
    } catch (error2) {
      showToast((error2 == null ? void 0 : error2.message) || __("Failed to check page", "yatra"), "error");
    } finally {
      setIsCheckingShortcode(false);
    }
  };
  const handleConfirmInsertShortcode = async () => {
    if (!selectedPageForShortcode) return;
    try {
      await insertShortcodeMutation.mutateAsync(selectedPageForShortcode.id);
      handleFieldChange({
        target: { name: "booking_page_id", value: selectedPageForShortcode.id }
      });
      handleFieldChange({
        target: { name: "use_booking_page", value: true }
      });
      setShowShortcodeDialog(false);
      setSelectedPageForShortcode(null);
    } catch (error2) {
    }
  };
  const handleSave = () => {
    if (formData) {
      setIsSaving(true);
      let updatedFormData = { ...formData };
      saveMutation.mutate(updatedFormData, {
        onSuccess: () => {
          setActiveSection(viewingSection);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "yatra_settings_active_section",
              viewingSection
            );
          }
        },
        onSettled: () => {
          setIsSaving(false);
        }
      });
    }
  };
  const settingsSections = [
    {
      id: "general",
      label: __("General", "yatra"),
      icon: Building2
    },
    {
      id: "design",
      label: __("Design", "yatra"),
      icon: Palette
    },
    {
      id: "booking",
      label: __("Booking", "yatra"),
      icon: Calendar
    },
    {
      id: "booking_form",
      label: __("Booking Form", "yatra"),
      icon: ClipboardList
    },
    {
      id: "search",
      label: __("Search & Listing", "yatra"),
      icon: SlidersHorizontal
    },
    {
      id: "payment",
      label: __("Payment", "yatra"),
      icon: DollarSign
    },
    // Pricing tab — visible on every Pro install so the Discount
    // Stacking control is *discoverable*. The setting itself only
    // takes effect when BOTH Advanced Discount and Dynamic Pricing
    // are enabled; the case "pricing" render gives a clear status
    // banner + disables the dropdown when prerequisites are missing.
    //
    // Truthy check (not `=== true`) because some WP installs end up
    // with `isPro` serialized as `1` instead of `true` through the
    // PHP→JSON→JS pipeline. Free installs serialize false (or omit
    // the key), which stays falsy and correctly hides the tab.
    ...((_a = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a.isPro) ? [
      {
        id: "pricing",
        label: __("Pricing", "yatra"),
        icon: Percent
      }
    ] : [],
    {
      id: "customer",
      label: __("Customer", "yatra"),
      icon: Users
    },
    {
      id: "review",
      label: __("Review", "yatra"),
      icon: Star
    },
    { id: "tax", label: __("Tax", "yatra"), icon: Receipt },
    {
      id: "currency",
      label: __("Currency", "yatra"),
      icon: Globe
    },
    {
      id: "integration",
      label: __("Integration", "yatra"),
      icon: Plug
    },
    {
      id: "permalink",
      label: __("Permalink", "yatra"),
      icon: Globe
    },
    {
      id: "seo",
      label: __("SEO", "yatra"),
      icon: TrendingUp
    },
    {
      id: "advanced",
      label: __("Advanced", "yatra"),
      icon: Shield
    }
  ];
  const SectionDivider = ({ title }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-4 mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4", children: title }) });
  const renderSettingsContent = () => {
    var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __2, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga, _ha, _ia, _ja, _ka, _la, _ma, _na, _oa, _pa, _qa, _ra, _sa, _ta, _ua, _va, _wa, _xa, _ya, _za, _Aa, _Ba, _Ca, _Da, _Ea, _Fa, _Ga;
    if (!formData) return null;
    switch (viewingSection) {
      case "general":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4", children: __("Company Information", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormField,
                {
                  id: "company_name",
                  label: __("Company Name", "yatra"),
                  description: __(
                    "Your travel agency or company name",
                    "yatra"
                  ),
                  required: true,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "company_name",
                      name: "company_name",
                      value: formData.company_name || "",
                      onChange: handleFieldChange,
                      placeholder: __("Enter company name", "yatra")
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  FormField,
                  {
                    id: "company_email",
                    label: __("Company Email", "yatra"),
                    description: __("Primary contact email address", "yatra"),
                    required: true,
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "company_email",
                        name: "company_email",
                        type: "email",
                        value: formData.company_email || "",
                        onChange: handleFieldChange,
                        placeholder: __("company@example.com", "yatra")
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  FormField,
                  {
                    id: "company_phone",
                    label: __("Company Phone", "yatra"),
                    description: __("Primary contact phone number", "yatra"),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "company_phone",
                        name: "company_phone",
                        value: formData.company_phone || "",
                        onChange: handleFieldChange,
                        placeholder: __("+1-234-567-8900", "yatra")
                      }
                    )
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormField,
                {
                  id: "company_address",
                  label: __("Street Address", "yatra"),
                  description: __("Street address of your company", "yatra"),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "company_address",
                      name: "company_address",
                      value: formData.company_address || "",
                      onChange: handleFieldChange,
                      placeholder: __("123 Main Street", "yatra")
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FormField, { id: "company_city", label: __("City", "yatra"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "company_city",
                    name: "company_city",
                    value: formData.company_city || "",
                    onChange: handleFieldChange,
                    placeholder: __("City", "yatra")
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  FormField,
                  {
                    id: "company_state",
                    label: __("State/Province", "yatra"),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "company_state",
                        name: "company_state",
                        value: formData.company_state || "",
                        onChange: handleFieldChange,
                        placeholder: __("State or Province", "yatra")
                      }
                    )
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  FormField,
                  {
                    id: "company_country",
                    label: __("Country", "yatra"),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "company_country",
                        name: "company_country",
                        value: formData.company_country || "",
                        onChange: handleFieldChange,
                        placeholder: __("Country", "yatra")
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  FormField,
                  {
                    id: "company_zip",
                    label: __("ZIP/Postal Code", "yatra"),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "company_zip",
                        value: formData.company_zip,
                        name: "company_zip",
                        onChange: handleFieldChange,
                        placeholder: __("ZIP Code", "yatra")
                      }
                    )
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormField,
                {
                  id: "company_website",
                  label: __("Website URL", "yatra"),
                  description: __("Your company website address", "yatra"),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "company_website",
                      type: "url",
                      value: formData.company_website,
                      name: "company_website",
                      onChange: handleFieldChange,
                      placeholder: __("https://example.com", "yatra")
                    }
                  )
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionDivider, { title: __("Regional Settings", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormField,
              {
                id: "timezone",
                label: __("Timezone", "yatra"),
                description: __(
                  "Used for booking logic, emails, and date display. Search the full IANA list (same identifiers PHP uses).",
                  "yatra"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  ((_a2 = window.yatraAdmin) == null ? void 0 : _a2.wordPressTimezone) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      className: "w-full sm:w-auto",
                      onClick: () => handleFieldChange({
                        target: {
                          name: "timezone",
                          id: "timezone",
                          value: String(
                            window.yatraAdmin.wordPressTimezone
                          ),
                          type: "select-one"
                        }
                      }),
                      children: [
                        __("Use WordPress site timezone", "yatra"),
                        ": ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: window.yatraAdmin.wordPressTimezone })
                      ]
                    }
                  ) : null,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SearchableSelect,
                    {
                      value: formData.timezone,
                      onChange: (val) => handleFieldChange({
                        target: {
                          name: "timezone",
                          id: "timezone",
                          value: val,
                          type: "select-one"
                        }
                      }),
                      options: timeZoneSelectOptions,
                      searchPlaceholder: __(
                        "Search by city, region, or code…",
                        "yatra"
                      ),
                      placeholder: __("Select timezone…", "yatra"),
                      showValueId: false
                    }
                  )
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormField,
              {
                id: "date_format",
                label: __("Date Format", "yatra"),
                description: __("How dates are displayed", "yatra"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    id: "date_format",
                    value: formData.date_format,
                    name: "date_format",
                    onChange: handleFieldChange,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "Y-m-d", children: [
                        (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA"),
                        " (YYYY-MM-DD)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "Y/m/d", children: [
                        `${(/* @__PURE__ */ new Date()).getFullYear()}/${String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0")}/${String((/* @__PURE__ */ new Date()).getDate()).padStart(2, "0")}`,
                        " ",
                        "(YYYY/MM/DD)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "m/d/Y", children: [
                        `${String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0")}/${String((/* @__PURE__ */ new Date()).getDate()).padStart(2, "0")}/${(/* @__PURE__ */ new Date()).getFullYear()}`,
                        " ",
                        "(MM/DD/YYYY)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "d/m/Y", children: [
                        `${String((/* @__PURE__ */ new Date()).getDate()).padStart(2, "0")}/${String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0")}/${(/* @__PURE__ */ new Date()).getFullYear()}`,
                        " ",
                        "(DD/MM/YYYY)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "d-m-Y", children: [
                        `${String((/* @__PURE__ */ new Date()).getDate()).padStart(2, "0")}-${String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0")}-${(/* @__PURE__ */ new Date()).getFullYear()}`,
                        " ",
                        "(DD-MM-YYYY)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "d.m.Y", children: [
                        `${String((/* @__PURE__ */ new Date()).getDate()).padStart(2, "0")}.${String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0")}.${(/* @__PURE__ */ new Date()).getFullYear()}`,
                        " ",
                        "(DD.MM.YYYY)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "M j, Y", children: [
                        (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        }),
                        " ",
                        "(Mon D, YYYY)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "F j, Y", children: [
                        (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric"
                        }),
                        " ",
                        "(Month D, YYYY)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "j M Y", children: [
                        `${(/* @__PURE__ */ new Date()).getDate()} ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short" })} ${(/* @__PURE__ */ new Date()).getFullYear()}`,
                        " ",
                        "(D Mon YYYY)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "j F Y", children: [
                        `${(/* @__PURE__ */ new Date()).getDate()} ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "long" })} ${(/* @__PURE__ */ new Date()).getFullYear()}`,
                        " ",
                        "(D Month YYYY)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "Y M j", children: [
                        `${(/* @__PURE__ */ new Date()).getFullYear()} ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short" })} ${(/* @__PURE__ */ new Date()).getDate()}`,
                        " ",
                        "(YYYY Mon D)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "Y F j", children: [
                        `${(/* @__PURE__ */ new Date()).getFullYear()} ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "long" })} ${(/* @__PURE__ */ new Date()).getDate()}`,
                        " ",
                        "(YYYY Month D)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "l, F j, Y", children: [
                        (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric"
                        }),
                        " ",
                        "(Day, Month D, YYYY)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "D, M j, Y", children: [
                        (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        }),
                        " ",
                        "(Day, Mon D, YYYY)"
                      ] })
                    ]
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormField,
              {
                id: "time_format",
                label: __("Time Format", "yatra"),
                description: __("12-hour or 24-hour format", "yatra"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    id: "time_format",
                    value: formData.time_format,
                    name: "time_format",
                    onChange: handleFieldChange,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "H:i", children: "24 Hour (14:30)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "h:i A", children: "12 Hour (2:30 PM)" })
                    ]
                  }
                )
              }
            )
          ] }) })
        ] });
      case "design":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __(
            "Control how Yatra looks on the public site (trip pages, booking, listings, and shortcodes). These options complement your WordPress theme.",
            "yatra"
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormField,
              {
                id: "frontend_primary_color",
                label: __("Primary brand color", "yatra"),
                description: __(
                  "Buttons, links, and highlights. Default is the standard Yatra blue; choose a hex color that matches your brand or theme accent.",
                  "yatra"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "color",
                      id: "frontend_primary_color_picker",
                      "aria-label": __("Pick primary color", "yatra"),
                      className: "h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-0.5 dark:border-gray-600",
                      value: /^#[0-9A-Fa-f]{6}$/.test(
                        (formData.frontend_primary_color || "").trim()
                      ) ? (formData.frontend_primary_color || "").trim() : "#3b82f6",
                      onChange: (e) => handleFieldChange({
                        target: {
                          name: "frontend_primary_color",
                          id: "frontend_primary_color",
                          value: e.target.value,
                          type: "text"
                        }
                      })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "frontend_primary_color",
                      name: "frontend_primary_color",
                      className: "max-w-[10rem] font-mono text-sm",
                      value: formData.frontend_primary_color || "",
                      onChange: handleFieldChange,
                      placeholder: "#3b82f6",
                      spellCheck: false
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      onClick: () => handleFieldChange({
                        target: {
                          name: "frontend_primary_color",
                          id: "frontend_primary_color",
                          value: "#3b82f6",
                          type: "text"
                        }
                      }),
                      children: __("Reset to default", "yatra")
                    }
                  )
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormField,
              {
                id: "frontend_container_max_width",
                label: __("Container max width", "yatra"),
                description: __(
                  "Optional. CSS width for trip listings, booking flow, and shortcode layouts (e.g. 1200px, 72rem, min(100%,80rem)). Leave empty to use your block theme layout (theme.json) or theme content width.",
                  "yatra"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "frontend_container_max_width",
                    name: "frontend_container_max_width",
                    className: "max-w-md font-mono text-sm",
                    value: formData.frontend_container_max_width || "",
                    onChange: handleFieldChange,
                    placeholder: "1200px",
                    spellCheck: false,
                    autoComplete: "off"
                  }
                )
              }
            )
          ] })
        ] });
      case "booking_form":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(BookingFormBuilder, { formData, setFormData });
      case "payment":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4", children: [
                __("Flexible Payments", "yatra"),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ProBadge, { isProActive: (_b2 = window.yatraAdmin) == null ? void 0 : _b2.isPro })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300 mb-4", children: __(
                "Enable deposit and partial payment options for bookings. Allow customers to pay a percentage upfront and the rest later.",
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ProFeature,
                {
                  title: __("Flexible Payments", "yatra"),
                  description: __(
                    "offer deposit and partial payment options to your customers",
                    "yatra"
                  ),
                  moduleName: "Flexible Payments",
                  pricingUrl: "https://wpyatra.com/pricing?module=flexible-payments",
                  isProActive: (_c = window.yatraAdmin) == null ? void 0 : _c.isPro,
                  isModuleEnabled: (_d = window.yatraAdmin) == null ? void 0 : _d.flexiblePaymentsEnabled,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "checkbox",
                          id: "partial_payment",
                          checked: formData.partial_payment,
                          name: "partial_payment",
                          onChange: handleFieldChange,
                          className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Label,
                          {
                            htmlFor: "partial_payment",
                            className: "font-medium cursor-pointer",
                            children: __("Enable Partial Payment", "yatra")
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                          "Allow customers to pay a portion now and the rest later",
                          "yatra"
                        ) })
                      ] })
                    ] }),
                    formData.partial_payment && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      FormField,
                      {
                        id: "partial_payment_percentage",
                        label: __("Partial Payment Percentage", "yatra"),
                        description: __(
                          "Percentage of total amount required for partial payment",
                          "yatra"
                        ),
                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              id: "partial_payment_percentage",
                              type: "number",
                              value: formData.partial_payment_percentage,
                              name: "partial_payment_percentage",
                              onChange: handleFieldChange,
                              min: "0",
                              max: "100",
                              className: "flex-1"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: "%" })
                        ] })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "checkbox",
                          id: "deposit_required",
                          checked: formData.deposit_required,
                          name: "deposit_required",
                          onChange: handleFieldChange,
                          className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Label,
                          {
                            htmlFor: "deposit_required",
                            className: "font-medium cursor-pointer",
                            children: __("Require Deposit", "yatra")
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __("Require a deposit to confirm bookings", "yatra") })
                      ] })
                    ] }),
                    formData.deposit_required && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      FormField,
                      {
                        id: "deposit_percentage",
                        label: __("Deposit Percentage", "yatra"),
                        description: __(
                          "Percentage of total amount required as deposit",
                          "yatra"
                        ),
                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              id: "deposit_percentage",
                              type: "number",
                              value: formData.deposit_percentage,
                              name: "deposit_percentage",
                              onChange: handleFieldChange,
                              min: "0",
                              max: "100",
                              className: "flex-1"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: "%" })
                        ] })
                      }
                    )
                  ] })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4", children: [
                __("Scheduled balance payments", "yatra"),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ProBadge, { isProActive: (_e = window.yatraAdmin) == null ? void 0 : _e.isPro })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300 mb-4", children: __(
                "After a deposit or partial payment, automatically schedule the remaining balance with your gateway (Stripe invoices or subscription schedules). Requires a gateway customer and payment method from checkout.",
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ProFeature,
                {
                  title: __("Scheduled Payments", "yatra"),
                  description: __(
                    "schedule the remaining balance after partial or deposit payments",
                    "yatra"
                  ),
                  moduleName: "Scheduled Payments",
                  pricingUrl: "https://wpyatra.com/pricing?module=scheduled-payments",
                  isProActive: (_f = window.yatraAdmin) == null ? void 0 : _f.isPro,
                  isModuleEnabled: (_g = window.yatraAdmin) == null ? void 0 : _g.scheduledPaymentsEnabled,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "checkbox",
                          id: "enable_scheduled_payments",
                          checked: formData.enable_scheduled_payments,
                          name: "enable_scheduled_payments",
                          onChange: handleFieldChange,
                          className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Label,
                          {
                            htmlFor: "enable_scheduled_payments",
                            className: "font-medium cursor-pointer",
                            children: __("Enable scheduled balance payments", "yatra")
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                          "When a booking still has an amount due after checkout, create gateway-side schedules using the rules below.",
                          "yatra"
                        ) })
                      ] })
                    ] }),
                    formData.enable_scheduled_payments && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        FormField,
                        {
                          id: "scheduled_payment_type",
                          label: __("Schedule type", "yatra"),
                          description: __(
                            "Single final charge on a date, or multiple installments.",
                            "yatra"
                          ),
                          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Select,
                            {
                              id: "scheduled_payment_type",
                              name: "scheduled_payment_type",
                              value: formData.scheduled_payment_type,
                              onChange: handleFieldChange,
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "single", children: __("Single balance payment", "yatra") }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "installments", children: __("Multiple installments", "yatra") })
                              ]
                            }
                          )
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        FormField,
                        {
                          id: "scheduled_payment_days",
                          label: __("Days until first charge", "yatra"),
                          description: __(
                            "How many days after the initial payment to schedule the first balance collection.",
                            "yatra"
                          ),
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              id: "scheduled_payment_days",
                              type: "number",
                              min: 0,
                              max: 365,
                              value: formData.scheduled_payment_days,
                              name: "scheduled_payment_days",
                              onChange: handleFieldChange,
                              className: "max-w-xs"
                            }
                          )
                        }
                      ),
                      formData.scheduled_payment_type === "installments" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          FormField,
                          {
                            id: "scheduled_payment_installments",
                            label: __("Number of installments", "yatra"),
                            description: __(
                              "Total installments including the scheduled balance (Stripe subscription schedule).",
                              "yatra"
                            ),
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                id: "scheduled_payment_installments",
                                type: "number",
                                min: 2,
                                max: 24,
                                value: formData.scheduled_payment_installments,
                                name: "scheduled_payment_installments",
                                onChange: handleFieldChange,
                                className: "max-w-xs"
                              }
                            )
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          FormField,
                          {
                            id: "scheduled_payment_interval",
                            label: __("Days between installments", "yatra"),
                            description: __(
                              "Spacing between installment charges when using multiple installments.",
                              "yatra"
                            ),
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                id: "scheduled_payment_interval",
                                type: "number",
                                min: 1,
                                max: 365,
                                value: formData.scheduled_payment_interval,
                                name: "scheduled_payment_interval",
                                onChange: handleFieldChange,
                                className: "max-w-xs"
                              }
                            )
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        FormField,
                        {
                          id: "scheduled_payment_reminder_days",
                          label: __("Payment reminder (days before)", "yatra"),
                          description: __(
                            "Send the scheduled payment reminder email this many days before the due date (0 to disable reminders).",
                            "yatra"
                          ),
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              id: "scheduled_payment_reminder_days",
                              type: "number",
                              min: 0,
                              max: 30,
                              value: formData.scheduled_payment_reminder_days,
                              name: "scheduled_payment_reminder_days",
                              onChange: handleFieldChange,
                              className: "max-w-xs"
                            }
                          )
                        }
                      )
                    ] })
                  ] })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "auto_confirm_pay_later",
                  checked: formData.auto_confirm_pay_later,
                  name: "auto_confirm_pay_later",
                  onChange: handleFieldChange,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "auto_confirm_pay_later",
                    className: "font-medium cursor-pointer",
                    children: __('Auto-confirm "Pay Later" Bookings', "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                  'Automatically confirm bookings when "Book Now, Pay Later" is selected. If disabled, bookings will remain pending until payment is received.',
                  "yatra"
                ) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SectionDivider, { title: __("Payment Gateways", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "payment_test_mode",
                  checked: formData.payment_test_mode,
                  name: "payment_test_mode",
                  onChange: handleFieldChange,
                  className: "w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "payment_test_mode",
                    className: "font-semibold cursor-pointer text-amber-800 dark:text-amber-200",
                    children: __("Test Mode", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-700 dark:text-amber-300 mt-0.5", children: __(
                  "Enable test/sandbox mode for all payment gateways. Use test API keys for development and testing. Disable this for live payments.",
                  "yatra"
                ) })
              ] }),
              formData.payment_test_mode && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-1 text-xs font-semibold bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded", children: __("TEST", "yatra") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-3.5 h-3.5" }),
              __(
                "Drag and drop to reorder gateways. Use arrows for precise positioning.",
                "yatra"
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              gatewayDefinitions && gatewayOrder.filter((id) => gatewayDefinitions[id]).map((gatewayId, index) => {
                var _a3, _b3;
                const gateway = gatewayDefinitions[gatewayId];
                const config = ((_a3 = formData.gateway_configs) == null ? void 0 : _a3[gatewayId]) || gateway.config || { enabled: false };
                const isExpanded = expandedGateways[gatewayId];
                const isDragging = draggedGateway === gatewayId;
                const isPremium = gateway.requires_pro || false;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Card,
                  {
                    className: `relative border transition-all !py-0 ${isDragging ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 opacity-75" : config.enabled ? "border-green-200 dark:border-green-800" : "border-gray-200 dark:border-gray-700"}`,
                    draggable: !isPremium,
                    onDragStart: (e) => !isPremium && handleDragStart(e, gatewayId),
                    onDragOver: !isPremium ? handleDragOver : void 0,
                    onDrop: (e) => !isPremium && handleDrop(e, gatewayId),
                    onDragEnd: !isPremium ? handleDragEnd : void 0,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GripVertical, { className: "w-4 h-4" }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-0.5", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "button",
                              {
                                type: "button",
                                onClick: () => moveGatewayUp(gatewayId),
                                disabled: index === 0,
                                className: "p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed",
                                title: __("Move up", "yatra"),
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { className: "w-3 h-3" })
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "button",
                              {
                                type: "button",
                                onClick: () => moveGatewayDown(gatewayId),
                                disabled: index === gatewayOrder.length - 1,
                                className: "p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed",
                                title: __("Move down", "yatra"),
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { className: "w-3 h-3" })
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "checkbox",
                              id: `gateway_enable_${gatewayId}`,
                              checked: config.enabled || false,
                              onChange: (e) => {
                                var _a4;
                                if (gateway.requires_pro && e.target.checked) {
                                  e.preventDefault();
                                  const pricingUrl = ((_a4 = window.yatraAdmin) == null ? void 0 : _a4.pricingUrl) || "https://wpyatra.com/pricing";
                                  window.open(pricingUrl, "_blank");
                                  return;
                                }
                                handleGatewayConfigChange(
                                  gatewayId,
                                  "enabled",
                                  e.target.checked
                                );
                              },
                              className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                            gateway.icon && /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "img",
                              {
                                src: gateway.icon,
                                alt: gateway.title,
                                className: "w-10 h-10 object-contain"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [
                                gateway.title,
                                config.enabled && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-normal px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded", children: __("Active", "yatra") }),
                                formData.payment_test_mode && gateway.sandbox_url && /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  "a",
                                  {
                                    href: gateway.sandbox_url,
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    className: "text-xs font-normal px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors",
                                    onClick: (e) => e.stopPropagation(),
                                    children: __("Sandbox Docs →", "yatra")
                                  }
                                )
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: gateway.description })
                            ] })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                          gateway.requires_pro && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-sm", children: "PRO" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Button,
                            {
                              variant: "ghost",
                              size: "sm",
                              onClick: () => toggleGatewayExpanded(gatewayId),
                              className: "h-8",
                              disabled: !((_b3 = gateway.fields) == null ? void 0 : _b3.length),
                              children: isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-4 h-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4" })
                            }
                          )
                        ] })
                      ] }) }),
                      isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-4 space-y-4 border-t border-gray-100 dark:border-gray-700", children: [
                        gateway.is_offline && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-blue-700 dark:text-blue-300", children: gateway.id === "pay_later" ? __(
                          "Allow customers to book now and pay later. Payment must be completed before the trip date.",
                          "yatra"
                        ) : __(
                          "This is an offline payment method. Customers will be shown these details after booking.",
                          "yatra"
                        ) }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: __("Frontend Display Settings", "yatra") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            FormField,
                            {
                              id: `${gatewayId}_icon`,
                              label: __("Gateway Icon", "yatra"),
                              description: __(
                                "Icon URL or path displayed on the booking page",
                                "yatra"
                              ),
                              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Input,
                                  {
                                    type: "text",
                                    value: config.icon || gateway.icon || "",
                                    onChange: (e) => handleGatewayConfigChange(
                                      gatewayId,
                                      "icon",
                                      e.target.value
                                    ),
                                    placeholder: __(
                                      "Enter icon URL or leave empty to use default",
                                      "yatra"
                                    ),
                                    className: "flex-1"
                                  }
                                ),
                                config.icon || gateway.icon ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  "img",
                                  {
                                    src: config.icon || gateway.icon,
                                    alt: gateway.title,
                                    className: "w-10 h-10 object-contain border border-gray-300 dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-800",
                                    onError: (e) => {
                                      e.target.style.display = "none";
                                    }
                                  }
                                ) : null
                              ] })
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            FormField,
                            {
                              id: `${gatewayId}_title`,
                              label: __("Gateway Title", "yatra"),
                              description: __(
                                "Title displayed on the booking page",
                                "yatra"
                              ),
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Input,
                                {
                                  type: "text",
                                  value: config.title || gateway.title || "",
                                  onChange: (e) => handleGatewayConfigChange(
                                    gatewayId,
                                    "title",
                                    e.target.value
                                  ),
                                  placeholder: gateway.title || __("Enter gateway title", "yatra")
                                }
                              )
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            FormField,
                            {
                              id: `${gatewayId}_description`,
                              label: __("Gateway Description", "yatra"),
                              description: __(
                                "Description displayed below the title on the booking page",
                                "yatra"
                              ),
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "textarea",
                                {
                                  value: config.description || gateway.description || "",
                                  onChange: (e) => handleGatewayConfigChange(
                                    gatewayId,
                                    "description",
                                    e.target.value
                                  ),
                                  placeholder: gateway.description || __("Enter gateway description", "yatra"),
                                  className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none",
                                  rows: 2
                                }
                              )
                            }
                          )
                        ] }),
                        gateway.fields && gateway.fields.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: gateway.fields.map((field) => {
                          if (field.condition && !config[field.condition]) {
                            return null;
                          }
                          if (field.show_when) {
                            const shouldShow = Object.entries(
                              field.show_when
                            ).every(
                              ([key, value]) => {
                                var _a4;
                                return (config[key] || ((_a4 = gateway.fields.find(
                                  (f) => f.id === key
                                )) == null ? void 0 : _a4.default)) === value;
                              }
                            );
                            if (!shouldShow) {
                              return null;
                            }
                          }
                          if (field.type === "checkbox") {
                            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              "div",
                              {
                                className: "flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    "input",
                                    {
                                      type: "checkbox",
                                      id: `${gatewayId}_${field.id}`,
                                      checked: config[field.id] || false,
                                      onChange: (e) => handleGatewayConfigChange(
                                        gatewayId,
                                        field.id,
                                        e.target.checked
                                      ),
                                      className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    }
                                  ),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                    Label,
                                    {
                                      htmlFor: `${gatewayId}_${field.id}`,
                                      className: "font-normal cursor-pointer",
                                      children: [
                                        field.label,
                                        " ",
                                        field.description && `- ${field.description}`
                                      ]
                                    }
                                  )
                                ]
                              },
                              field.id
                            );
                          }
                          if (field.type === "textarea") {
                            return /* @__PURE__ */ jsxRuntimeExports.jsx(
                              FormField,
                              {
                                id: `${gatewayId}_${field.id}`,
                                label: field.label,
                                description: field.description,
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  "textarea",
                                  {
                                    value: config[field.id] || field.default || "",
                                    onChange: (e) => handleGatewayConfigChange(
                                      gatewayId,
                                      field.id,
                                      e.target.value
                                    ),
                                    placeholder: field.placeholder,
                                    className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none",
                                    rows: 3
                                  }
                                )
                              },
                              field.id
                            );
                          }
                          if (gateway.id === "stripe" && field.id === "enabled_methods") {
                            const rawValue = config[field.id];
                            const selectedValues = Array.isArray(
                              rawValue
                            ) ? rawValue : typeof rawValue === "string" && rawValue.length > 0 ? rawValue.split(",").map((val) => val.trim()).filter(Boolean) : ["card", "google_pay", "apple_pay"];
                            const methodOptions = [
                              {
                                value: "card",
                                label: __(
                                  "Card (Stripe Elements)",
                                  "yatra"
                                )
                              },
                              {
                                value: "google_pay",
                                label: __(
                                  "Google Pay (Payment Request Button)",
                                  "yatra"
                                )
                              },
                              {
                                value: "apple_pay",
                                label: __(
                                  "Apple Pay (Payment Request Button)",
                                  "yatra"
                                )
                              }
                            ];
                            const handleStripeMethodsChange = (values) => {
                              handleGatewayConfigChange(
                                gatewayId,
                                field.id,
                                values.join(",")
                              );
                            };
                            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              "div",
                              {
                                className: "space-y-2",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    FormField,
                                    {
                                      id: `${gatewayId}_${field.id}`,
                                      label: field.label,
                                      description: field.description,
                                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                        MultiSelect,
                                        {
                                          value: selectedValues,
                                          onChange: handleStripeMethodsChange,
                                          options: methodOptions,
                                          placeholder: __(
                                            "Select payment methods...",
                                            "yatra"
                                          )
                                        }
                                      )
                                    }
                                  ),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
                                    __(
                                      "Apple Pay requires domain verification inside your Stripe Dashboard.",
                                      "yatra"
                                    ),
                                    (field.help_url || field.help_url_test || field.help_url_live) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                                      "a",
                                      {
                                        href: formData.payment_test_mode ? field.help_url_test || field.help_url : field.help_url_live || field.help_url,
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        className: "ml-1 border-b border-blue-600 dark:border-blue-400 hover:border-transparent",
                                        children: __("Learn more →", "yatra")
                                      }
                                    )
                                  ] })
                                ]
                              },
                              field.id
                            );
                          }
                          if (field.type === "multiselect" && field.options) {
                            const rawValue = config[field.id];
                            const selectedValues = Array.isArray(
                              rawValue
                            ) ? rawValue : typeof rawValue === "string" && rawValue.length > 0 ? rawValue.split(",").map((val) => val.trim()).filter(Boolean) : Array.isArray(field.default) ? field.default : [];
                            const methodOptions = Object.entries(field.options).map(
                              ([value, label]) => ({
                                value,
                                label: String(label)
                              })
                            );
                            const handleMultiSelectChange = (values) => {
                              handleGatewayConfigChange(
                                gatewayId,
                                field.id,
                                values
                              );
                            };
                            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              "div",
                              {
                                className: "space-y-2",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    FormField,
                                    {
                                      id: `${gatewayId}_${field.id}`,
                                      label: field.label,
                                      description: field.description,
                                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                        MultiSelect,
                                        {
                                          value: selectedValues,
                                          onChange: handleMultiSelectChange,
                                          options: methodOptions,
                                          placeholder: __(
                                            "Select options...",
                                            "yatra"
                                          )
                                        }
                                      )
                                    }
                                  ),
                                  field.help_text && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-blue-600 dark:text-blue-400", children: field.help_text })
                                ]
                              },
                              field.id
                            );
                          }
                          if (field.type === "select" && field.options) {
                            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              "div",
                              {
                                className: "space-y-2",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    FormField,
                                    {
                                      id: `${gatewayId}_${field.id}`,
                                      label: field.label,
                                      description: field.description,
                                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                        Select,
                                        {
                                          value: config[field.id] ?? field.default ?? "",
                                          onChange: (e) => handleGatewayConfigChange(
                                            gatewayId,
                                            field.id,
                                            e.target.value
                                          ),
                                          children: Object.entries(
                                            field.options
                                          ).map(([value, label]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                                            "option",
                                            {
                                              value,
                                              children: label
                                            },
                                            value
                                          ))
                                        }
                                      )
                                    }
                                  ),
                                  field.help_text && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-blue-600 dark:text-blue-400", children: field.help_text })
                                ]
                              },
                              field.id
                            );
                          }
                          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              FormField,
                              {
                                id: `${gatewayId}_${field.id}`,
                                label: field.label,
                                description: field.description,
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Input,
                                  {
                                    type: field.type === "email" ? "email" : field.type,
                                    value: config[field.id] ?? field.default ?? "",
                                    onChange: (e) => handleGatewayConfigChange(
                                      gatewayId,
                                      field.id,
                                      field.type === "number" ? parseFloat(
                                        e.target.value
                                      ) || 0 : e.target.value
                                    ),
                                    placeholder: field.placeholder,
                                    min: field.min,
                                    max: field.max
                                  }
                                )
                              }
                            ),
                            field.help_text && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-blue-600 dark:text-blue-400", children: [
                              field.help_text,
                              (field.help_url || field.help_url_test || field.help_url_live) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "a",
                                {
                                  href: formData.payment_test_mode ? field.help_url_test || field.help_url : field.help_url_live || field.help_url,
                                  target: "_blank",
                                  rel: "noopener noreferrer",
                                  className: "ml-1 border-b border-blue-600 dark:border-blue-400 hover:border-transparent transition-colors",
                                  children: __("Learn more →", "yatra")
                                }
                              )
                            ] })
                          ] }, field.id);
                        }) })
                      ] }),
                      isPremium && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: "absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 dark:from-purple-500/10 dark:to-blue-500/10 rounded-lg cursor-pointer hover:from-purple-500/10 hover:to-blue-500/10 dark:hover:from-purple-500/15 dark:hover:to-blue-500/15 transition-all duration-200",
                          onClick: () => {
                            setSelectedPremiumGateway(gateway.title);
                            setShowPremiumDialog(true);
                          }
                        }
                      )
                    ]
                  },
                  gatewayId
                );
              }),
              (!gatewayDefinitions || Object.keys(gatewayDefinitions).length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-gray-500 dark:text-gray-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __("Loading payment gateways...", "yatra") }) })
            ] })
          ] })
        ] });
      case "search":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-1", children: __("Search Bar Fields", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-4", children: __(
              "Choose which fields appear in the trip search bar. Turn off the ones you don't need for a cleaner search.",
              "yatra"
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: [
              {
                key: "search_show_keyword",
                label: __("Keyword search", "yatra"),
                description: __(
                  "Free-text field to search by trip name or keyword.",
                  "yatra"
                )
              },
              {
                key: "search_show_destination",
                label: __("Destination", "yatra"),
                description: __(
                  "Dropdown to filter trips by destination.",
                  "yatra"
                )
              },
              {
                key: "search_show_activities",
                label: __("Activities", "yatra"),
                description: __(
                  "Dropdown to filter trips by activity.",
                  "yatra"
                )
              },
              {
                key: "search_show_duration",
                label: __("Duration", "yatra"),
                description: __(
                  "Range slider to filter trips by number of days.",
                  "yatra"
                )
              },
              {
                key: "search_show_budget",
                label: __("Budget", "yatra"),
                description: __(
                  "Dropdown to filter trips by price range.",
                  "yatra"
                )
              }
            ].map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "checkbox",
                      id: row.key,
                      checked: !!formData[row.key],
                      name: row.key,
                      onChange: handleFieldChange,
                      className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Label,
                      {
                        htmlFor: row.key,
                        className: "font-medium cursor-pointer",
                        children: row.label
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: row.description })
                  ] })
                ]
              },
              row.key
            )) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-1", children: __("Mobile Filters", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-4", children: __(
              "Controls the filter sidebar on the trip listing page on mobile devices.",
              "yatra"
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "collapse_filters_on_mobile",
                  checked: !!formData.collapse_filters_on_mobile,
                  name: "collapse_filters_on_mobile",
                  onChange: handleFieldChange,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "collapse_filters_on_mobile",
                    className: "font-medium cursor-pointer",
                    children: __("Collapse filters by default on mobile", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                  "On mobile, show filter sections collapsed so trip listings are visible right away. Visitors tap a section to expand it. Desktop is unaffected.",
                  "yatra"
                ) })
              ] })
            ] })
          ] })
        ] });
      case "booking":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "booking_confirmation",
                  checked: formData.booking_confirmation,
                  name: "booking_confirmation",
                  onChange: handleFieldChange,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "booking_confirmation",
                    className: "font-medium cursor-pointer",
                    children: __("Send Booking Confirmation Email", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                  "Send a confirmation email to the customer immediately after a successful booking. The post-checkout page is always shown; this toggle only controls the email.",
                  "yatra"
                ) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "auto_confirm_bookings",
                  checked: formData.auto_confirm_bookings,
                  name: "auto_confirm_bookings",
                  onChange: handleFieldChange,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "auto_confirm_bookings",
                    className: "font-medium cursor-pointer",
                    children: __("Auto-Confirm Bookings", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                  "Automatically confirm bookings without manual approval",
                  "yatra"
                ) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "require_login",
                  checked: formData.require_login,
                  name: "require_login",
                  onChange: handleFieldChange,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "require_login",
                    className: "font-medium cursor-pointer",
                    children: __("Require Login for Booking", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                  "Customers must create an account to make bookings",
                  "yatra"
                ) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "allow_guest_checkout",
                  checked: formData.allow_guest_checkout,
                  name: "allow_guest_checkout",
                  onChange: handleFieldChange,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "allow_guest_checkout",
                    className: "font-medium cursor-pointer",
                    children: __("Allow Guest Checkout", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                  "Allow customers to book without creating an account",
                  "yatra"
                ) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "require_guest_email_verification",
                  checked: formData.require_guest_email_verification,
                  name: "require_guest_email_verification",
                  onChange: handleFieldChange,
                  disabled: !formData.allow_guest_checkout || formData.require_login,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "require_guest_email_verification",
                    className: "font-medium cursor-pointer",
                    children: __("Require Guest Email Verification", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                  "Hold guest bookings until the customer clicks a magic link sent to their email. Stops typo'd addresses and form-spam bots. Only applies when guest checkout is allowed and login isn't required — logged-in customers are already verified.",
                  "yatra"
                ) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "allow_waitlist",
                  checked: formData.allow_waitlist,
                  name: "allow_waitlist",
                  onChange: handleFieldChange,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "allow_waitlist",
                    className: "font-medium cursor-pointer",
                    children: __("Allow waitlist when a date is full", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                  "Customers can join a waitlist instead of being blocked when seats are gone (per-trip caps still apply).",
                  "yatra"
                ) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "waitlist_auto_confirm",
                  checked: formData.waitlist_auto_confirm,
                  name: "waitlist_auto_confirm",
                  onChange: handleFieldChange,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "waitlist_auto_confirm",
                    className: "font-medium cursor-pointer",
                    children: __("Auto-confirm promoted waitlist bookings", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                  "When a spot opens, move the next waitlisted booking to confirmed; otherwise it becomes pending for staff review.",
                  "yatra"
                ) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "date_picker_as_dropdown",
                  checked: !!formData.date_picker_as_dropdown,
                  name: "date_picker_as_dropdown",
                  onChange: handleFieldChange,
                  disabled: !((_h = window.yatraAdmin) == null ? void 0 : _h.isPro),
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Label,
                  {
                    htmlFor: "date_picker_as_dropdown",
                    className: "font-medium cursor-pointer inline-flex items-center",
                    children: [
                      __("Show available dates as a dropdown", "yatra"),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        ProBadge,
                        {
                          isProActive: !!((_i = window.yatraAdmin) == null ? void 0 : _i.isPro)
                        }
                      )
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                  "Replace the calendar date picker with a dropdown listing every available departure date on the single-trip sidebar and the mobile sticky bar. Best for trips with a small set of fixed departures.",
                  "yatra"
                ) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionDivider, { title: __("Booking Expiry & Reminders", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormField,
              {
                id: "booking_expiry_hours",
                label: __("Booking Expiry Hours", "yatra"),
                description: __(
                  "Hours before unpaid bookings expire and are cancelled",
                  "yatra"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "booking_expiry_hours",
                    type: "number",
                    value: formData.booking_expiry_hours,
                    name: "booking_expiry_hours",
                    onChange: handleFieldChange,
                    min: "1"
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormField,
              {
                id: "booking_reminder_days",
                label: __("Booking Reminder Days", "yatra"),
                description: __(
                  "Send reminder emails this many days before departure",
                  "yatra"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "booking_reminder_days",
                    type: "number",
                    value: formData.booking_reminder_days,
                    name: "booking_reminder_days",
                    onChange: handleFieldChange,
                    min: "0"
                  }
                )
              }
            )
          ] })
        ] });
      case "pricing": {
        const adEnabled = !!((_j = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _j.advancedDiscountEnabled);
        const dpEnabled = !!((_k = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _k.dynamicPricingEnabled);
        const bothActive = adEnabled && dpEnabled;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400", children: __(
            "Controls what happens when both a Discount (coupon or group discount) and a Dynamic Pricing rule could apply to the same booking. The control only takes effect when both the Advanced Discount and Dynamic Pricing modules are turned on.",
            "yatra"
          ) }),
          bothActive ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mt-0.5 h-4 w-4 flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: __("Active", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5", children: __(
                "Advanced Discount and Dynamic Pricing are both enabled. Your stacking choice below is being applied to every new booking calculation.",
                "yatra"
              ) })
            ] })
          ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "mt-0.5 h-4 w-4 flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: __("Not active yet", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5", children: __(
                "This setting only applies when BOTH modules below are enabled. Without both, bookings calculate exactly as they do today (no stacking control).",
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-2 space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-1.5", children: [
                  adEnabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5 text-green-600 dark:text-green-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "h-3.5 w-3.5 text-amber-600 dark:text-amber-400" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    __("Advanced Discount module", "yatra"),
                    " ",
                    adEnabled ? __("(enabled)", "yatra") : __("(not enabled)", "yatra")
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-1.5", children: [
                  dpEnabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5 text-green-600 dark:text-green-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "h-3.5 w-3.5 text-amber-600 dark:text-amber-400" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    __("Dynamic Pricing module", "yatra"),
                    " ",
                    dpEnabled ? __("(enabled)", "yatra") : __("(not enabled)", "yatra")
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => navigateMenu("modules"),
                  className: "mt-2 inline-flex items-center gap-1 text-amber-900 underline hover:text-amber-700 dark:text-amber-100 dark:hover:text-amber-300",
                  children: [
                    __("Open Modules", "yatra"),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
                  ]
                }
              )
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FormField,
            {
              id: "discount_stacking_mode",
              label: __("Discount Stacking", "yatra"),
              description: __(
                "Pick how Discounts and Dynamic Pricing combine on the same booking.",
                "yatra"
              ),
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  id: "discount_stacking_mode",
                  name: "discount_stacking_mode",
                  value: formData.discount_stacking_mode ?? "both",
                  onChange: handleFieldChange,
                  disabled: !bothActive,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "both", children: __(
                      "Both apply (legacy) — Dynamic Pricing and Discount stack",
                      "yatra"
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "best_for_customer", children: __(
                      "Best for the customer — pick whichever single mechanism gives the larger reduction",
                      "yatra"
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "discount_only", children: __(
                      "Discount only — if a coupon or group discount applies, ignore Dynamic Pricing",
                      "yatra"
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "dynamic_pricing_only", children: __(
                      "Dynamic Pricing only — if a Dynamic Pricing rule fires, ignore the discount",
                      "yatra"
                    ) })
                  ]
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200", children: [
            __("What each mode does:", "yatra"),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-2 ml-4 list-disc space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: __("Both apply", "yatra") }),
                " — ",
                __(
                  "default and matches the original behavior. A coupon stacks on top of the Dynamic Pricing-adjusted price.",
                  "yatra"
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: __("Best for the customer", "yatra") }),
                " — ",
                __(
                  "calculates both scenarios and picks the cheaper one for the customer. Never combines.",
                  "yatra"
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: __("Discount only", "yatra") }),
                " — ",
                __(
                  "when a discount is valid, Dynamic Pricing is skipped for that booking.",
                  "yatra"
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: __("Dynamic Pricing only", "yatra") }),
                " — ",
                __(
                  "when a Dynamic Pricing rule reduced the price, discount codes and group discounts are ignored for that booking.",
                  "yatra"
                )
              ] })
            ] })
          ] })
        ] });
      }
      case "customer":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                id: "customer_registration",
                checked: formData.customer_registration,
                name: "customer_registration",
                onChange: handleFieldChange,
                className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Label,
                {
                  htmlFor: "customer_registration",
                  className: "font-medium cursor-pointer",
                  children: __("Enable Customer Registration", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                "Allow customers to create accounts on your website",
                "yatra"
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FormField,
            {
              id: "customer_account_page",
              label: __("Customer Account Page", "yatra"),
              description: __(
                "URL path segment for the account area (e.g. my-account → /my-account/dashboard). Must match your frontend routes.",
                "yatra"
              ),
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "customer_account_page",
                    value: formData.customer_account_page,
                    name: "customer_account_page",
                    onChange: handleFieldChange,
                    placeholder: "/my-account",
                    className: "flex-1"
                  }
                ),
                formData.customer_account_page && (() => {
                  var _a3;
                  const siteUrl = ((_a3 = window.yatraAdmin) == null ? void 0 : _a3.siteUrl) || "";
                  const accountUrl = buildYatraAccountViewUrl(
                    siteUrl,
                    formData.customer_account_page
                  );
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "a",
                    {
                      href: accountUrl,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors",
                      children: [
                        __("View Page", "yatra"),
                        " →"
                      ]
                    }
                  );
                })()
              ] })
            }
          ),
          ((_l = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _l.isPro) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                id: "enable_wishlist",
                checked: !!formData.enable_wishlist,
                name: "enable_wishlist",
                onChange: handleFieldChange,
                className: "w-4 h-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Label,
                {
                  htmlFor: "enable_wishlist",
                  className: "font-medium cursor-pointer",
                  children: __("Enable wishlist (saved trips)", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                "Shows the heart control on trip cards and single trips, and the Saved Trips area in the customer account. Requires Yatra Pro.",
                "yatra"
              ) })
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-sm text-amber-900 dark:text-amber-100", children: __(
            "Wishlist / saved trips are a Yatra Pro feature. Install Yatra Pro to enable them and turn them on in Customer settings.",
            "yatra"
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                id: "require_email_verification",
                checked: formData.require_email_verification,
                name: "require_email_verification",
                onChange: handleFieldChange,
                className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Label,
                {
                  htmlFor: "require_email_verification",
                  className: "font-medium cursor-pointer",
                  children: __("Require Email Verification", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                "Customers must verify their email before account activation",
                "yatra"
              ) })
            ] })
          ] })
        ] }) });
      case "review":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400", children: __(
            "These options apply to trip review forms on the frontend (who may review, moderation, minimum stars, and reminder scheduling).",
            "yatra"
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "enable_reviews",
                  checked: formData.enable_reviews,
                  name: "enable_reviews",
                  onChange: handleFieldChange,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "enable_reviews",
                    className: "font-medium cursor-pointer",
                    children: __("Enable Reviews", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                  "Allow customers to leave reviews and ratings",
                  "yatra"
                ) })
              ] })
            ] }),
            formData.enable_reviews && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    id: "require_booking",
                    checked: formData.require_booking,
                    name: "require_booking",
                    onChange: handleFieldChange,
                    className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Label,
                    {
                      htmlFor: "require_booking",
                      className: "font-medium cursor-pointer",
                      children: __("Require Booking to Review", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                    "Only customers who have booked can leave reviews",
                    "yatra"
                  ) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    id: "auto_approve_reviews",
                    checked: formData.auto_approve_reviews,
                    name: "auto_approve_reviews",
                    onChange: handleFieldChange,
                    className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Label,
                    {
                      htmlFor: "auto_approve_reviews",
                      className: "font-medium cursor-pointer",
                      children: __("Auto-Approve Reviews", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                    "Automatically publish reviews without moderation",
                    "yatra"
                  ) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    id: "review_moderation",
                    checked: formData.review_moderation,
                    name: "review_moderation",
                    onChange: handleFieldChange,
                    className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Label,
                    {
                      htmlFor: "review_moderation",
                      className: "font-medium cursor-pointer",
                      children: __("Enable Review Moderation", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                    "Manually approve reviews before they are published",
                    "yatra"
                  ) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormField,
                {
                  id: "min_rating",
                  label: __("Minimum Rating", "yatra"),
                  description: __(
                    "Lowest rating value allowed (1-5 stars)",
                    "yatra"
                  ),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      id: "min_rating",
                      value: formData.min_rating,
                      name: "min_rating",
                      onChange: handleFieldChange,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "1", children: [
                          "1 ",
                          __("Star", "yatra")
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "2", children: [
                          "2 ",
                          __("Stars", "yatra")
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "3", children: [
                          "3 ",
                          __("Stars", "yatra")
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "4", children: [
                          "4 ",
                          __("Stars", "yatra")
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "5", children: [
                          "5 ",
                          __("Stars", "yatra")
                        ] })
                      ]
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormField,
                {
                  id: "review_reminder_days",
                  label: __("Review Reminder Days", "yatra"),
                  description: __(
                    "Send review reminder email this many days after trip completion",
                    "yatra"
                  ),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "review_reminder_days",
                      type: "number",
                      value: formData.review_reminder_days,
                      name: "review_reminder_days",
                      onChange: handleFieldChange,
                      min: "0"
                    }
                  )
                }
              )
            ] })
          ] })
        ] });
      case "tax":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                id: "enable_tax",
                checked: formData.enable_tax,
                name: "enable_tax",
                onChange: handleFieldChange,
                className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Label,
                {
                  htmlFor: "enable_tax",
                  className: "font-medium cursor-pointer",
                  children: __("Enable Tax", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __("Add tax to booking prices", "yatra") })
            ] })
          ] }),
          formData.enable_tax && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              FormField,
              {
                id: "multiple_taxes",
                label: __("Taxes", "yatra"),
                description: __(
                  "Configure taxes to apply to bookings",
                  "yatra"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    MultipleTaxesEditor,
                    {
                      taxes: formData.multiple_taxes || [],
                      onChange: (taxes) => {
                        setFormData(
                          (prev) => prev ? { ...prev, multiple_taxes: taxes } : prev
                        );
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        value: newTaxName,
                        onChange: (e) => setNewTaxName(e.target.value),
                        placeholder: __(
                          "Tax name (e.g., VAT, GST)",
                          "yatra"
                        ),
                        className: "w-full"
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          type: "number",
                          value: newTaxRate,
                          onChange: (e) => setNewTaxRate(e.target.value),
                          min: "0",
                          max: "100",
                          step: "0.01",
                          placeholder: __("Rate", "yatra"),
                          className: "w-full"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: "%" })
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        type: "button",
                        onClick: () => {
                          if (newTaxName && newTaxRate && parseFloat(newTaxRate) >= 0 && parseFloat(newTaxRate) <= 100) {
                            setFormData((prev) => {
                              const currentTaxes = (prev == null ? void 0 : prev.multiple_taxes) || [];
                              const newTax = {
                                name: newTaxName,
                                rate: parseFloat(newTaxRate)
                              };
                              const updatedTaxes = [...currentTaxes, newTax];
                              return prev ? { ...prev, multiple_taxes: updatedTaxes } : prev;
                            });
                            setNewTaxName("");
                            setNewTaxRate("");
                          }
                        },
                        disabled: !newTaxName || !newTaxRate || parseFloat(newTaxRate) < 0 || parseFloat(newTaxRate) > 100,
                        className: "px-4 py-2 bg-green-600 hover:bg-green-700 text-white",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                          __("Add new Tax", "yatra")
                        ]
                      }
                    )
                  ] }) }),
                  (formData.multiple_taxes || []).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-medium text-blue-800 dark:text-blue-200", children: [
                    __("Total Tax Rate:", "yatra"),
                    " ",
                    (formData.multiple_taxes || []).reduce((sum, tax) => sum + tax.rate, 0).toFixed(2),
                    "%"
                  ] }) })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "tax_inclusive",
                  checked: formData.tax_inclusive,
                  name: "tax_inclusive",
                  onChange: handleFieldChange,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "tax_inclusive",
                    className: "font-medium cursor-pointer",
                    children: __("Tax Inclusive Pricing", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __("Tax is included in displayed prices", "yatra") })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormField,
              {
                id: "vat_number",
                label: __("VAT Number", "yatra"),
                description: __(
                  "Your company VAT or tax identification number",
                  "yatra"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "vat_number",
                    value: formData.vat_number,
                    name: "vat_number",
                    onChange: handleFieldChange,
                    placeholder: __("Enter VAT number", "yatra")
                  }
                )
              }
            )
          ] })
        ] }) });
      case "currency":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4", children: __("Currency Settings", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormField,
                {
                  id: "currency",
                  label: __("Default Currency", "yatra"),
                  description: __(
                    "Primary currency for all transactions",
                    "yatra"
                  ),
                  required: true,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SearchableSelect,
                    {
                      value: formData.currency,
                      onChange: (val) => setFormData(
                        (prev) => prev ? { ...prev, currency: val } : prev
                      ),
                      options: getCurrencyOptions(),
                      placeholder: __("Select currency...", "yatra"),
                      searchPlaceholder: __("Search currencies...", "yatra"),
                      showValueId: false
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormField,
                {
                  id: "currency_position",
                  label: __("Currency Position", "yatra"),
                  description: __(
                    "Where to display currency symbol relative to amount",
                    "yatra"
                  ),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      id: "currency_position",
                      value: formData.currency_position,
                      name: "currency_position",
                      onChange: handleFieldChange,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "left", children: "$100 (Left)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "right", children: "100$ (Right)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "left_space", children: "$ 100 (Left with Space)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "right_space", children: "100 $ (Right with Space)" })
                      ]
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormField,
                {
                  id: "thousand_separator",
                  label: __("Thousand Separator", "yatra"),
                  description: __(
                    "Character used to separate thousands (e.g., comma for 1,000)",
                    "yatra"
                  ),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "thousand_separator",
                      value: formData.thousand_separator,
                      name: "thousand_separator",
                      onChange: handleFieldChange,
                      maxLength: 1,
                      placeholder: ","
                    }
                  )
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormField,
                {
                  id: "currency_decimals",
                  label: __("Decimal Places", "yatra"),
                  description: __(
                    "Number of decimal places to show in prices",
                    "yatra"
                  ),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "currency_decimals",
                      type: "number",
                      value: formData.currency_decimals,
                      name: "currency_decimals",
                      onChange: handleFieldChange,
                      min: "0",
                      max: "4"
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormField,
                {
                  id: "decimal_separator",
                  label: __("Decimal Separator", "yatra"),
                  description: __(
                    "Character used to separate decimal part (e.g., period for 99.99)",
                    "yatra"
                  ),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "decimal_separator",
                      value: formData.decimal_separator,
                      name: "decimal_separator",
                      onChange: handleFieldChange,
                      maxLength: 1,
                      placeholder: "."
                    }
                  )
                }
              )
            ] })
          ] })
        ] });
      case "integration":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          window.yatraAdmin && window.yatraAdmin.showGoogleCalendarSettingsUI && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              SectionDivider,
              {
                title: __("Google Calendar Integration", "yatra")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              GoogleCalendarIntegrationSection,
              {
                formData,
                setFormData
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionDivider, { title: __("Mailchimp Integration", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-5 h-5 text-yellow-500" }),
                __("Mailchimp", "yatra"),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ProBadge, { isProActive: (_m = window.yatraAdmin) == null ? void 0 : _m.isPro })
              ] }),
              ((_p = (_o = (_n = window.yatraAdmin) == null ? void 0 : _n.mailchimp) == null ? void 0 : _o.connectionStatus) == null ? void 0 : _p.connected) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm text-green-600 dark:text-green-400", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4" }),
                __("Connected", "yatra")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "w-4 h-4" }),
                __("Not Connected", "yatra")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: __(
                "Automatically sync customers to Mailchimp lists when they book. Add tags based on trips booked and build targeted email campaigns.",
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ProFeature,
                {
                  title: __("Mailchimp", "yatra"),
                  description: __("automatically sync your customers", "yatra"),
                  moduleName: "Mailchimp",
                  pricingUrl: "https://wpyatra.com/pricing?module=mailchimp",
                  isProActive: (_q = window.yatraAdmin) == null ? void 0 : _q.isPro,
                  isModuleEnabled: (_r = window.yatraAdmin) == null ? void 0 : _r.showMailchimpSettingsUI,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      FormField,
                      {
                        id: "mailchimp_api_key",
                        label: __("API Key", "yatra"),
                        description: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          __("Get your API key from", "yatra"),
                          " ",
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "a",
                            {
                              href: "https://admin.mailchimp.com/account/api/",
                              target: "_blank",
                              rel: "noopener noreferrer",
                              className: "text-blue-600 hover:text-blue-500 dark:text-blue-400 underline",
                              children: __("Mailchimp Account Settings", "yatra")
                            }
                          )
                        ] }),
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Input,
                                {
                                  id: "mailchimp_api_key",
                                  type: showApiKey ? "text" : "password",
                                  value: formData.mailchimp_api_key || "",
                                  name: "mailchimp_api_key",
                                  onChange: handleFieldChange,
                                  placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1",
                                  className: "pr-10"
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "button",
                                {
                                  type: "button",
                                  onClick: () => setShowApiKey(!showApiKey),
                                  className: "absolute inset-y-0 right-0 pr-3 flex items-center",
                                  tabIndex: -1,
                                  children: showApiKey ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4 text-gray-400 hover:text-gray-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4 text-gray-400 hover:text-gray-600" })
                                }
                              )
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                type: "button",
                                variant: "outline",
                                size: "sm",
                                onClick: validateMailchimpApiKey,
                                disabled: !formData.mailchimp_api_key || validatingApiKey,
                                className: "whitespace-nowrap",
                                children: validatingApiKey ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-4 w-4 animate-spin mr-2" }),
                                  __("Validating...", "yatra")
                                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 mr-2" }),
                                  __("Validate", "yatra")
                                ] })
                              }
                            )
                          ] }),
                          formData.mailchimp_api_key && /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              className: `mt-2 text-sm ${((_u = (_t = (_s = window.yatraAdmin) == null ? void 0 : _s.mailchimp) == null ? void 0 : _t.connectionStatus) == null ? void 0 : _u.connected) ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`,
                              children: ((_x = (_w = (_v = window.yatraAdmin) == null ? void 0 : _v.mailchimp) == null ? void 0 : _w.connectionStatus) == null ? void 0 : _x.connected) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "h-4 w-4 inline mr-1" }),
                                __("Connected successfully!", "yatra")
                              ] }) : ((_A = (_z = (_y = window.yatraAdmin) == null ? void 0 : _y.mailchimp) == null ? void 0 : _z.connectionStatus) == null ? void 0 : _A.error) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "h-4 w-4 inline mr-1" }),
                                (_D = (_C = (_B = window.yatraAdmin) == null ? void 0 : _B.mailchimp) == null ? void 0 : _C.connectionStatus) == null ? void 0 : _D.error
                              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "h-4 w-4 inline mr-1" }),
                                __(
                                  "API key entered. Click 'Validate' to test connection.",
                                  "yatra"
                                )
                              ] })
                            }
                          )
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      FormField,
                      {
                        id: "mailchimp_list_id",
                        label: __("Audience/List", "yatra"),
                        description: __(
                          "Select the Mailchimp audience to sync subscribers to.",
                          "yatra"
                        ),
                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Select,
                          {
                            id: "mailchimp_list_id",
                            value: formData.mailchimp_list_id || "",
                            name: "mailchimp_list_id",
                            onChange: handleFieldChange,
                            disabled: !((_G = (_F = (_E = window.yatraAdmin) == null ? void 0 : _E.mailchimp) == null ? void 0 : _F.connectionStatus) == null ? void 0 : _G.connected),
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: !((_J = (_I = (_H = window.yatraAdmin) == null ? void 0 : _H.mailchimp) == null ? void 0 : _I.connectionStatus) == null ? void 0 : _J.connected) ? __("Please validate API key first", "yatra") : __("Select an audience", "yatra") }),
                              (_M = (_L = (_K = window.yatraAdmin) == null ? void 0 : _K.mailchimp) == null ? void 0 : _L.availableLists) == null ? void 0 : _M.map(
                                (list) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: list.id, children: list.name }, list.id)
                              )
                            ]
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "checkbox",
                          id: "mailchimp_sync_on_booking",
                          checked: formData.mailchimp_sync_on_booking ?? true,
                          name: "mailchimp_sync_on_booking",
                          onChange: handleFieldChange,
                          className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Label,
                          {
                            htmlFor: "mailchimp_sync_on_booking",
                            className: "font-medium cursor-pointer",
                            children: __("Sync on Booking", "yatra")
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                          "Automatically add customers to Mailchimp when they make a booking",
                          "yatra"
                        ) })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "checkbox",
                          id: "mailchimp_double_optin",
                          checked: formData.mailchimp_double_optin ?? false,
                          name: "mailchimp_double_optin",
                          onChange: handleFieldChange,
                          className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Label,
                          {
                            htmlFor: "mailchimp_double_optin",
                            className: "font-medium cursor-pointer",
                            children: __("Double Opt-in", "yatra")
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                          "Require email confirmation before adding to list (recommended for GDPR)",
                          "yatra"
                        ) })
                      ] })
                    ] }),
                    formData.mailchimp_api_key && formData.mailchimp_list_id && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 pt-4 border-t border-gray-200 dark:border-gray-700", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "w-4 h-4" }),
                        __("Field Mapping", "yatra")
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-4", children: __(
                        "Map Yatra customer fields to Mailchimp merge fields. This controls what data is synced when a customer is added to your list.",
                        "yatra"
                      ) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: ((_P = (_O = (_N = window.yatraAdmin) == null ? void 0 : _N.mailchimp) == null ? void 0 : _O.mergeFields) == null ? void 0 : _P.length) > 0 ? (_R = (_Q = window.yatraAdmin) == null ? void 0 : _Q.mailchimp) == null ? void 0 : _R.mergeFields.map(
                        (field) => {
                          var _a3, _b3;
                          const currentMapping = formData.mailchimp_field_mapping || {};
                          const yatraFields = ((_b3 = (_a3 = window.yatraAdmin) == null ? void 0 : _a3.mailchimp) == null ? void 0 : _b3.yatraFields) || {};
                          const yatraFieldOptions = yatraFields[field.type] || yatraFields["text"] || [];
                          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "div",
                            {
                              className: "grid grid-cols-2 gap-3 items-center",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: field.name }),
                                  field.required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-red-500", children: "*" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-400", children: [
                                    "(",
                                    field.tag,
                                    ")"
                                  ] })
                                ] }) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                  Select,
                                  {
                                    value: currentMapping[field.tag] || "",
                                    onChange: (e) => {
                                      const newMapping = {
                                        ...formData.mailchimp_field_mapping || {}
                                      };
                                      if (e.target.value) {
                                        newMapping[field.tag] = e.target.value;
                                      } else {
                                        delete newMapping[field.tag];
                                      }
                                      setFormData((prev) => ({
                                        ...prev,
                                        mailchimp_field_mapping: newMapping
                                      }));
                                    },
                                    children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __("Do not sync", "yatra") }),
                                      Object.entries(yatraFieldOptions).map(
                                        ([value, label]) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value, children: String(label) }, value)
                                      )
                                    ]
                                  }
                                )
                              ]
                            },
                            field.tag
                          );
                        }
                      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-4 text-sm text-gray-500 dark:text-gray-400", children: __(
                        "No merge fields available. Please select a list first.",
                        "yatra"
                      ) }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 pt-4 border-t border-gray-200 dark:border-gray-700", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "checkbox",
                              id: "mailchimp_add_tags",
                              checked: formData.mailchimp_add_tags ?? true,
                              onChange: (e) => setFormData((prev) => ({
                                ...prev,
                                mailchimp_add_tags: e.target.checked
                              })),
                              className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Label,
                              {
                                htmlFor: "mailchimp_add_tags",
                                className: "font-medium cursor-pointer",
                                children: __("Add Trip Tags", "yatra")
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                              "Automatically tag subscribers with the trip name they booked",
                              "yatra"
                            ) })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          FormField,
                          {
                            id: "mailchimp_default_tags",
                            label: __("Default Tags", "yatra"),
                            description: __(
                              'Comma-separated tags to add to all synced subscribers (e.g., "yatra, booking")',
                              "yatra"
                            ),
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                id: "mailchimp_default_tags",
                                value: formData.mailchimp_default_tags || "",
                                onChange: (e) => setFormData((prev) => ({
                                  ...prev,
                                  mailchimp_default_tags: e.target.value
                                })),
                                placeholder: "yatra, booking"
                              }
                            )
                          }
                        )
                      ] })
                    ] })
                  ] })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionDivider, { title: __("Facebook Pixel", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    className: "w-5 h-5 text-blue-600",
                    viewBox: "0 0 24 24",
                    fill: "currentColor",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" })
                  }
                ),
                __("Facebook Pixel", "yatra"),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ProBadge, { isProActive: (_S = window.yatraAdmin) == null ? void 0 : _S.isPro })
              ] }),
              ((_V = (_U = (_T = window.yatraAdmin) == null ? void 0 : _T.facebookPixel) == null ? void 0 : _U.connectionStatus) == null ? void 0 : _V.pixelConnected) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm text-green-600 dark:text-green-400", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4" }),
                __("Connected", "yatra")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "w-4 h-4" }),
                __("Not Connected", "yatra")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: __(
                "Track booking conversions with Facebook Pixel. Retarget visitors who viewed trips and optimize ad campaigns with accurate conversion data.",
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ProFeature,
                {
                  title: __("Facebook Pixel", "yatra"),
                  description: __(
                    "access advanced conversion tracking features",
                    "yatra"
                  ),
                  moduleName: "Facebook Pixel",
                  pricingUrl: "https://wpyatra.com/pricing?module=facebook-pixel",
                  isProActive: (_W = window.yatraAdmin) == null ? void 0 : _W.isPro,
                  isModuleEnabled: (_X = window.yatraAdmin) == null ? void 0 : _X.showFacebookPixelSettingsUI,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      FormField,
                      {
                        id: "facebook_pixel_id",
                        label: __("Pixel ID", "yatra"),
                        description: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __(
                            "Your Facebook Pixel ID (e.g., 123456789012345).",
                            "yatra"
                          ) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "text-sm", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium", children: __("How to get your Pixel ID:", "yatra") }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "mt-2 ml-4 list-decimal space-y-1 text-gray-600 dark:text-gray-400", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                "Go to Facebook Business Manager: business.facebook.com",
                                "yatra"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __("Select your Business Account", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                "Click 'All tools' and select 'Pixels'",
                                "yatra"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                "Click 'Add Pixel' if you don't have one",
                                "yatra"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                "Enter a Pixel name and enter your website URL",
                                "yatra"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __("Click 'Create Pixel'", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                "Your Pixel ID will be displayed (e.g., 123456789012345)",
                                "yatra"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                "Copy this Pixel ID and paste it in the field above",
                                "yatra"
                              ) })
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "a",
                            {
                              href: "https://business.facebook.com/events_manager",
                              target: "_blank",
                              rel: "noopener noreferrer",
                              className: "text-blue-600 hover:text-blue-500 dark:text-blue-400 underline text-sm",
                              children: __("Open Facebook Events Manager →", "yatra")
                            }
                          ) })
                        ] }),
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                id: "facebook_pixel_id",
                                value: formData.facebook_pixel_id || "",
                                name: "facebook_pixel_id",
                                onChange: handleFieldChange,
                                placeholder: "123456789012345"
                              }
                            ) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                type: "button",
                                onClick: validateFacebookPixel,
                                disabled: !formData.facebook_pixel_id || validatingPixel,
                                variant: "outline",
                                size: "sm",
                                className: "whitespace-nowrap",
                                children: validatingPixel ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
                                  __("Validating...", "yatra")
                                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 mr-2" }),
                                  __("Validate", "yatra")
                                ] })
                              }
                            )
                          ] }),
                          formData.facebook_pixel_id && /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              className: `mt-2 text-sm ${((__2 = (_Z = (_Y = window.yatraAdmin) == null ? void 0 : _Y.facebookPixel) == null ? void 0 : _Z.connectionStatus) == null ? void 0 : __2.pixelConnected) ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`,
                              children: ((_ba = (_aa = (_$ = window.yatraAdmin) == null ? void 0 : _$.facebookPixel) == null ? void 0 : _aa.connectionStatus) == null ? void 0 : _ba.pixelConnected) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "h-4 w-4 inline mr-1" }),
                                __("Pixel ID is valid!", "yatra")
                              ] }) : ((_ea = (_da = (_ca = window.yatraAdmin) == null ? void 0 : _ca.facebookPixel) == null ? void 0 : _da.connectionStatus) == null ? void 0 : _ea.pixelError) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "h-4 w-4 inline mr-1" }),
                                (_ha = (_ga = (_fa = window.yatraAdmin) == null ? void 0 : _fa.facebookPixel) == null ? void 0 : _ga.connectionStatus) == null ? void 0 : _ha.pixelError
                              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "h-4 w-4 inline mr-1" }),
                                __(
                                  "Click 'Validate' to test Pixel ID.",
                                  "yatra"
                                )
                              ] })
                            }
                          )
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "checkbox",
                            id: "fb_track_view_content",
                            checked: formData.fb_track_view_content ?? true,
                            name: "fb_track_view_content",
                            onChange: handleFieldChange,
                            className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Label,
                          {
                            htmlFor: "fb_track_view_content",
                            className: "text-sm cursor-pointer",
                            children: __("Track ViewContent", "yatra")
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "checkbox",
                            id: "fb_track_initiate_checkout",
                            checked: formData.fb_track_initiate_checkout ?? true,
                            name: "fb_track_initiate_checkout",
                            onChange: handleFieldChange,
                            className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Label,
                          {
                            htmlFor: "fb_track_initiate_checkout",
                            className: "text-sm cursor-pointer",
                            children: __("Track InitiateCheckout", "yatra")
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "checkbox",
                            id: "fb_track_purchase",
                            checked: formData.fb_track_purchase ?? true,
                            name: "fb_track_purchase",
                            onChange: handleFieldChange,
                            className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Label,
                          {
                            htmlFor: "fb_track_purchase",
                            className: "text-sm cursor-pointer",
                            children: __("Track Purchase", "yatra")
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "checkbox",
                            id: "fb_use_conversions_api",
                            checked: formData.fb_use_conversions_api ?? false,
                            name: "fb_use_conversions_api",
                            onChange: handleFieldChange,
                            className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Label,
                          {
                            htmlFor: "fb_use_conversions_api",
                            className: "text-sm cursor-pointer",
                            children: __("Use Conversions API", "yatra")
                          }
                        )
                      ] })
                    ] }),
                    formData.fb_use_conversions_api && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      FormField,
                      {
                        id: "facebook_access_token",
                        label: __("Access Token", "yatra"),
                        description: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __(
                            "Required for Conversions API. Enables server-side tracking for better accuracy.",
                            "yatra"
                          ) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "text-sm", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium", children: __("How to get Access Token:", "yatra") }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "mt-2 ml-4 list-decimal space-y-1 text-gray-600 dark:text-gray-400", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                "Go to Facebook Business Manager: business.facebook.com",
                                "yatra"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __("Select your Business Account", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                "Click 'All tools' and select 'Events Manager'",
                                "yatra"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                "Find your Pixel ID in the data sources list (it should match the Pixel ID you entered above)",
                                "yatra"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                "Click on your Pixel name to open its settings",
                                "yatra"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                "Click 'Settings' (gear icon ⚙️) in the top right",
                                "yatra"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                "Scroll down to 'Conversions API' section",
                                "yatra"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __("Click 'Generate access token'", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                "Choose permissions: 'ads_management' and 'business_management'",
                                "yatra"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __("Click 'Generate token'", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                "Copy the generated access token",
                                "yatra"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __("Paste it in the field above", "yatra") })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-blue-800 dark:text-blue-300", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: __("💡 Tip:", "yatra") }),
                              " ",
                              __(
                                "If you have multiple Pixels, look for the one that matches the Pixel ID you entered above. The Pixel ID is displayed next to each Pixel name in the list.",
                                "yatra"
                              )
                            ] }) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-yellow-800 dark:text-yellow-300", children: __(
                              "⚠️ Keep your access token secure and never share it publicly.",
                              "yatra"
                            ) }) })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "a",
                            {
                              href: "https://business.facebook.com/settings/conversions-api",
                              target: "_blank",
                              rel: "noopener noreferrer",
                              className: "text-blue-600 hover:text-blue-500 dark:text-blue-400 underline text-sm",
                              children: __("Open Conversions API Settings →", "yatra")
                            }
                          ) })
                        ] }),
                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 relative", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Input,
                                {
                                  id: "facebook_access_token",
                                  type: showFacebookToken ? "text" : "password",
                                  value: formData.facebook_access_token || "",
                                  name: "facebook_access_token",
                                  onChange: handleFieldChange,
                                  placeholder: "EAAC...",
                                  className: "pr-10"
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "button",
                                {
                                  type: "button",
                                  onClick: () => setShowFacebookToken(!showFacebookToken),
                                  className: "absolute inset-y-0 right-0 pr-3 flex items-center",
                                  tabIndex: -1,
                                  children: showFacebookToken ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4 text-gray-400 hover:text-gray-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4 text-gray-400 hover:text-gray-600" })
                                }
                              )
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                type: "button",
                                onClick: validateFacebookToken,
                                disabled: !formData.facebook_access_token || validatingToken,
                                variant: "outline",
                                size: "sm",
                                className: "whitespace-nowrap",
                                children: validatingToken ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
                                  __("Validating...", "yatra")
                                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 mr-2" }),
                                  __("Validate", "yatra")
                                ] })
                              }
                            )
                          ] }),
                          formData.facebook_access_token && /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              className: `text-sm ${((_ka = (_ja = (_ia = window.yatraAdmin) == null ? void 0 : _ia.facebookPixel) == null ? void 0 : _ja.connectionStatus) == null ? void 0 : _ka.tokenConnected) ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`,
                              children: ((_na = (_ma = (_la = window.yatraAdmin) == null ? void 0 : _la.facebookPixel) == null ? void 0 : _ma.connectionStatus) == null ? void 0 : _na.tokenConnected) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "h-4 w-4 inline mr-1" }),
                                __("Access token is valid!", "yatra")
                              ] }) : ((_qa = (_pa = (_oa = window.yatraAdmin) == null ? void 0 : _oa.facebookPixel) == null ? void 0 : _pa.connectionStatus) == null ? void 0 : _qa.tokenError) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "h-4 w-4 inline mr-1" }),
                                (_ta = (_sa = (_ra = window.yatraAdmin) == null ? void 0 : _ra.facebookPixel) == null ? void 0 : _sa.connectionStatus) == null ? void 0 : _ta.tokenError
                              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "h-4 w-4 inline mr-1" }),
                                __(
                                  "Click 'Validate' to test access token.",
                                  "yatra"
                                )
                              ] })
                            }
                          )
                        ] })
                      }
                    )
                  ] })
                }
              ),
              ((_va = (_ua = window.yatraAdmin) == null ? void 0 : _ua.facebookPixel) == null ? void 0 : _va.pixelId) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    className: "w-4 h-4 text-blue-600 dark:text-blue-400",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-800 dark:text-blue-300 font-medium", children: __("Facebook Pixel Monitoring:", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-blue-700 dark:text-blue-400 ml-1", children: [
                    __(
                      "View event statistics and activity in the ",
                      "yatra"
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "a",
                      {
                        href: `${((_wa = window.yatraAdmin) == null ? void 0 : _wa.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=reports`,
                        className: "underline hover:text-blue-600 dark:hover:text-blue-300 font-medium",
                        children: __("Reports page", "yatra")
                      }
                    ),
                    __(" → Facebook Pixel tab.", "yatra")
                  ] })
                ] })
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SectionDivider,
            {
              title: __("Google Analytics 4 Enhanced", "yatra")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden border-gray-200 dark:border-gray-700 shadow-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row flex-wrap items-start gap-3 justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40 pb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2.5 text-gray-900 dark:text-white", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 dark:bg-orange-500/15", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  BarChart3,
                  {
                    className: "w-5 h-5 text-orange-600 dark:text-orange-400",
                    "aria-hidden": true
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex flex-wrap items-center gap-2 leading-tight", children: [
                  __("Google Analytics 4 Enhanced", "yatra"),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ProBadge, { isProActive: (_xa = window.yatraAdmin) == null ? void 0 : _xa.isPro })
                ] })
              ] }),
              (() => {
                var _a3, _b3, _c2;
                const ga4HasId = Boolean((_a3 = formData.ga4_measurement_id) == null ? void 0 : _a3.trim());
                const ga4Connected = ga4HasId || Boolean(
                  (_c2 = (_b3 = window.yatraAdmin) == null ? void 0 : _b3.googleAnalytics) == null ? void 0 : _c2.connected
                );
                return ga4Connected ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-3.5 h-3.5 shrink-0" }),
                  __("Measurement ID set", "yatra")
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "w-3.5 h-3.5 shrink-0" }),
                  __("Not configured", "yatra")
                ] });
              })()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6 pt-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-relaxed text-gray-600 dark:text-gray-300", children: __(
                "Connect GA4 for ecommerce events (view item, add to cart, checkout, purchase). Optional Measurement Protocol sends verified server-side events for more reliable attribution.",
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ProFeature,
                {
                  title: __("Google Analytics 4 Enhanced", "yatra"),
                  description: __(
                    "access enhanced e-commerce tracking features",
                    "yatra"
                  ),
                  moduleName: "Google Analytics",
                  pricingUrl: "https://wpyatra.com/pricing?module=google-analytics",
                  isProActive: (_ya = window.yatraAdmin) == null ? void 0 : _ya.isPro,
                  isModuleEnabled: (_za = window.yatraAdmin) == null ? void 0 : _za.showGoogleAnalyticsSettingsUI,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-950/30 sm:p-5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: __("Connection", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400", children: __(
                          "Use your GA4 web data stream Measurement ID (format G-XXXXXXXXXX). Find it under Admin → Data streams → your stream.",
                          "yatra"
                        ) })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        FormField,
                        {
                          id: "ga4_measurement_id",
                          label: __("Measurement ID", "yatra"),
                          description: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __(
                              "Your GA4 web data stream Measurement ID (format G-XXXXXXXXXX). The Validate button checks the format only — confirm the stream is live in your GA4 Admin.",
                              "yatra"
                            ) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "text-sm", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400", children: __("How to get your Measurement ID:", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "mt-2 ml-4 list-decimal space-y-1 text-gray-600 dark:text-gray-400", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                  "Go to Google Analytics: analytics.google.com",
                                  "yatra"
                                ) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                  "Sign in and select the property you want to track this site with (or create one: Admin → Create → Property → choose your business details).",
                                  "yatra"
                                ) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                  "In the bottom-left corner click the gear icon (Admin).",
                                  "yatra"
                                ) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                  "In the Property column click Data Streams.",
                                  "yatra"
                                ) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                  "Click your existing Web stream — or click Add stream → Web, enter your site URL and a stream name, then Create stream.",
                                  "yatra"
                                ) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                  "On the stream details panel, copy the Measurement ID at the top right (format G-XXXXXXXXXX).",
                                  "yatra"
                                ) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                  "Paste it in the field above and click Validate.",
                                  "yatra"
                                ) })
                              ] })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "a",
                              {
                                href: "https://analytics.google.com/analytics/web/",
                                target: "_blank",
                                rel: "noopener noreferrer",
                                className: "text-blue-600 hover:text-blue-500 dark:text-blue-400 underline text-sm",
                                children: __("Open Google Analytics →", "yatra")
                              }
                            ) })
                          ] }),
                          actionButton: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Button,
                            {
                              type: "button",
                              variant: "outline",
                              size: "sm",
                              onClick: () => validateMeasurementId(),
                              disabled: !((_Aa = formData.ga4_measurement_id) == null ? void 0 : _Aa.trim()) || validatingMeasurementId,
                              className: "shrink-0",
                              children: validatingMeasurementId ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                                __("Validating...", "yatra")
                              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-2 h-4 w-4" }),
                                __("Validate", "yatra")
                              ] })
                            }
                          ),
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              id: "ga4_measurement_id",
                              value: formData.ga4_measurement_id || "",
                              name: "ga4_measurement_id",
                              onChange: handleFieldChange,
                              placeholder: "G-XXXXXXXXXX",
                              className: "font-mono text-sm",
                              spellCheck: false,
                              autoComplete: "off"
                            }
                          )
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-950/30 sm:p-5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: __("Events", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400", children: __(
                          "Choose which standard ecommerce events Yatra should emit to GA4 on the storefront and booking flow.",
                          "yatra"
                        ) })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-900/50", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "checkbox",
                              id: "ga4_track_view_item",
                              checked: formData.ga4_track_view_item ?? true,
                              name: "ga4_track_view_item",
                              onChange: handleFieldChange,
                              className: "mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Label,
                              {
                                htmlFor: "ga4_track_view_item",
                                className: "cursor-pointer text-sm font-medium text-gray-900 dark:text-white",
                                children: __("View item", "yatra")
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-gray-500 dark:text-gray-400", children: __(
                              "Trip detail pages (recommended for remarketing).",
                              "yatra"
                            ) })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-900/50", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "checkbox",
                              id: "ga4_track_add_to_cart",
                              checked: formData.ga4_track_add_to_cart ?? true,
                              name: "ga4_track_add_to_cart",
                              onChange: handleFieldChange,
                              className: "mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Label,
                              {
                                htmlFor: "ga4_track_add_to_cart",
                                className: "cursor-pointer text-sm font-medium text-gray-900 dark:text-white",
                                children: __("Add to cart", "yatra")
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-gray-500 dark:text-gray-400", children: __(
                              "When a trip is added to the booking session / checkout.",
                              "yatra"
                            ) })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-900/50", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "checkbox",
                              id: "ga4_track_begin_checkout",
                              checked: formData.ga4_track_begin_checkout ?? true,
                              name: "ga4_track_begin_checkout",
                              onChange: handleFieldChange,
                              className: "mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Label,
                              {
                                htmlFor: "ga4_track_begin_checkout",
                                className: "cursor-pointer text-sm font-medium text-gray-900 dark:text-white",
                                children: __("Begin checkout", "yatra")
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-gray-500 dark:text-gray-400", children: __(
                              "When a booking is created (checkout started).",
                              "yatra"
                            ) })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-900/50", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "checkbox",
                              id: "ga4_track_purchase",
                              checked: formData.ga4_track_purchase ?? true,
                              name: "ga4_track_purchase",
                              onChange: handleFieldChange,
                              className: "mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Label,
                              {
                                htmlFor: "ga4_track_purchase",
                                className: "cursor-pointer text-sm font-medium text-gray-900 dark:text-white",
                                children: __("Purchase", "yatra")
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-gray-500 dark:text-gray-400", children: __(
                              "When payment completes (and on confirmation page).",
                              "yatra"
                            ) })
                          ] })
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-950/30 sm:p-5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: __("Server-side (Measurement Protocol)", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400", children: __(
                          "Send duplicate events from your server with an API secret—useful when ad blockers affect the browser tag or for reconciliation.",
                          "yatra"
                        ) })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-900/50", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "checkbox",
                            id: "ga4_use_measurement_protocol",
                            checked: formData.ga4_use_measurement_protocol ?? false,
                            name: "ga4_use_measurement_protocol",
                            onChange: handleFieldChange,
                            className: "mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Label,
                            {
                              htmlFor: "ga4_use_measurement_protocol",
                              className: "cursor-pointer text-sm font-medium text-gray-900 dark:text-white",
                              children: __("Enable Measurement Protocol", "yatra")
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-gray-500 dark:text-gray-400", children: __(
                            "Requires an API secret from the same GA4 data stream.",
                            "yatra"
                          ) })
                        ] })
                      ] }),
                      formData.ga4_use_measurement_protocol && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 rounded-lg border border-amber-100 bg-amber-50/60 p-3 dark:border-amber-900/40 dark:bg-amber-950/20", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "checkbox",
                              id: "ga4_debug_mode",
                              checked: formData.ga4_debug_mode ?? false,
                              name: "ga4_debug_mode",
                              onChange: handleFieldChange,
                              className: "mt-0.5 h-4 w-4 shrink-0 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Label,
                              {
                                htmlFor: "ga4_debug_mode",
                                className: "cursor-pointer text-sm font-medium text-amber-950 dark:text-amber-100",
                                children: __(
                                  "Validation mode (debug endpoint)",
                                  "yatra"
                                )
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-amber-900/90 dark:text-amber-200/90", children: __(
                              "Send Measurement Protocol hits to Google’s validation URL for troubleshooting. Events won’t appear in standard reports.",
                              "yatra"
                            ) })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          FormField,
                          {
                            id: "ga4_api_secret",
                            label: __(
                              "Measurement Protocol API secret",
                              "yatra"
                            ),
                            description: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __(
                                "Treat this like a password — anyone with it can send fake events to your GA4 property. Restrict who can view Yatra settings.",
                                "yatra"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "text-sm", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400", children: __("How to get your API secret:", "yatra") }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "mt-2 ml-4 list-decimal space-y-1 text-gray-600 dark:text-gray-400", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                    "Go to Google Analytics: analytics.google.com",
                                    "yatra"
                                  ) }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                    "Sign in and select the same property you used for the Measurement ID above.",
                                    "yatra"
                                  ) }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                    "Click the gear icon (Admin) in the bottom-left corner.",
                                    "yatra"
                                  ) }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                    "In the Property column click Data Streams, then click your Web stream.",
                                    "yatra"
                                  ) }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                    "Scroll to Events → Measurement Protocol API secrets → Create.",
                                    "yatra"
                                  ) }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                    "Give the secret a nickname (e.g. “Yatra server”) and click Create.",
                                    "yatra"
                                  ) }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                                    "Copy the Secret value (not the nickname) and paste it in the field above.",
                                    "yatra"
                                  ) })
                                ] })
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "a",
                                {
                                  href: "https://analytics.google.com/analytics/web/",
                                  target: "_blank",
                                  rel: "noopener noreferrer",
                                  className: "text-blue-600 hover:text-blue-500 dark:text-blue-400 underline text-sm",
                                  children: __("Open Google Analytics →", "yatra")
                                }
                              ) })
                            ] }),
                            actionButton: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                type: "button",
                                variant: "outline",
                                size: "sm",
                                onClick: () => validateApiSecret(),
                                disabled: !formData.ga4_api_secret || !formData.ga4_measurement_id || validatingApiSecret,
                                className: "shrink-0",
                                children: validatingApiSecret ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                                  __("Validating...", "yatra")
                                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-2 h-4 w-4" }),
                                  __("Validate", "yatra")
                                ] })
                              }
                            ),
                            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Input,
                                {
                                  id: "ga4_api_secret",
                                  type: showGa4ApiSecret ? "text" : "password",
                                  value: formData.ga4_api_secret || "",
                                  name: "ga4_api_secret",
                                  onChange: handleFieldChange,
                                  placeholder: __(
                                    "Paste secret from GA4",
                                    "yatra"
                                  ),
                                  className: "pr-10 font-mono text-sm",
                                  spellCheck: false,
                                  autoComplete: "new-password"
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "button",
                                {
                                  type: "button",
                                  onClick: () => setShowGa4ApiSecret(!showGa4ApiSecret),
                                  className: "absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                                  tabIndex: -1,
                                  "aria-label": showGa4ApiSecret ? __("Hide secret", "yatra") : __("Show secret", "yatra"),
                                  children: showGa4ApiSecret ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" })
                                }
                              )
                            ] })
                          }
                        )
                      ] })
                    ] })
                  ] })
                }
              ),
              (Boolean((_Ba = formData.ga4_measurement_id) == null ? void 0 : _Ba.trim()) || Boolean(
                (_Da = (_Ca = window.yatraAdmin) == null ? void 0 : _Ca.googleAnalytics) == null ? void 0 : _Da.measurementId
              )) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 rounded-lg border border-blue-200 bg-blue-50/90 p-4 dark:border-blue-800 dark:bg-blue-950/30", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(BarChart3, { className: "mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 text-sm leading-relaxed", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-blue-900 dark:text-blue-100", children: __("Reports & event log", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-blue-800/90 dark:text-blue-200/90", children: [
                    __(
                      "Review connection status and recent Measurement Protocol activity under",
                      "yatra"
                    ),
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "a",
                      {
                        href: `${((_Ea = window.yatraAdmin) == null ? void 0 : _Ea.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=reports`,
                        className: "font-medium underline decoration-blue-600/40 underline-offset-2 hover:text-blue-950 dark:hover:text-white",
                        children: __("Reports", "yatra")
                      }
                    ),
                    " → ",
                    __("Google Analytics 4.", "yatra")
                  ] })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionDivider, { title: __("Maps", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              }
            ) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-blue-900 dark:text-blue-100 mb-1", children: __("OpenStreetMap Integration", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-blue-700 dark:text-blue-300", children: __(
                "Maps are powered by OpenStreetMap - a free, open-source mapping service. No API key required! Maps will automatically display trip starting locations with custom markers.",
                "yatra"
              ) })
            ] })
          ] }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionDivider, { title: __("reCAPTCHA Settings", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "recaptcha_enabled",
                  checked: formData.recaptcha_enabled,
                  name: "recaptcha_enabled",
                  onChange: handleFieldChange,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "recaptcha_enabled",
                    className: "font-medium cursor-pointer",
                    children: __("Enable reCAPTCHA", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __("Protect forms from spam and bots", "yatra") })
              ] })
            ] }),
            formData.recaptcha_enabled && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormField,
                {
                  id: "recaptcha_site_key",
                  label: __("Site Key", "yatra"),
                  description: __("Your reCAPTCHA site key", "yatra"),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "recaptcha_site_key",
                      value: formData.recaptcha_site_key,
                      name: "recaptcha_site_key",
                      onChange: handleFieldChange,
                      placeholder: __("Enter site key", "yatra")
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormField,
                {
                  id: "recaptcha_secret_key",
                  label: __("Secret Key", "yatra"),
                  description: __(
                    "Your reCAPTCHA secret key (keep this secure)",
                    "yatra"
                  ),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "recaptcha_secret_key",
                      type: "password",
                      value: formData.recaptcha_secret_key,
                      name: "recaptcha_secret_key",
                      onChange: handleFieldChange,
                      placeholder: __("Enter secret key", "yatra")
                    }
                  )
                }
              )
            ] })
          ] })
        ] });
      case "permalink": {
        const listingSite = (((_Fa = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _Fa.siteUrl) || "").replace(/\/$/, "");
        const listingHref = (segment) => buildYatraListingPublicUrl(segment, listingSite || void 0);
        const bookingConfirmationPreviewUrl = (bookingBase) => {
          const bb = bookingBase.replace(/^\/|\/$/g, "");
          const site = listingSite || "";
          if (isWordPressPlainPermalink()) {
            return site ? `${site}/?yatra_booking_confirmation=` : "/?yatra_booking_confirmation=";
          }
          return site ? `${site}/${bb}/confirmation/` : `/${bb}/confirmation/`;
        };
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4", children: __("Permalink Settings", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-6", children: __(
              "Configure URL slugs for your Yatra content types. These settings control how your trips, destinations, and activities appear in URLs.",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              FormField,
              {
                id: "trip_base",
                label: __("Trip Base", "yatra"),
                description: __(
                  'URL slug for trip single pages (e.g., "trip" will create URLs like /trip/everest-base-camp)',
                  "yatra"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "trip_base",
                      name: "trip_base",
                      value: formData.trip_base || "trip",
                      onChange: handleFieldChange,
                      placeholder: "trip",
                      className: "font-mono"
                    }
                  ),
                  formData.trip_base && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                      __("Listing URL:", "yatra"),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-gray-100 dark:bg-gray-800 px-1 rounded break-all", children: listingHref(formData.trip_base || "trip") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "a",
                      {
                        href: listingHref(formData.trip_base || "trip"),
                        target: "_blank",
                        rel: "noreferrer",
                        className: "inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline shrink-0",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" }),
                          " ",
                          __("View", "yatra")
                        ]
                      }
                    )
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              FormField,
              {
                id: "destination_base",
                label: __("Destination Base", "yatra"),
                description: __(
                  'URL slug for destination archive pages (e.g., "destination" will create URLs like /destination/nepal)',
                  "yatra"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "destination_base",
                      name: "destination_base",
                      value: formData.destination_base || "destination",
                      onChange: handleFieldChange,
                      placeholder: "destination",
                      className: "font-mono"
                    }
                  ),
                  formData.destination_base && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                      __("Listing URL:", "yatra"),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-gray-100 dark:bg-gray-800 px-1 rounded break-all", children: listingHref(
                        formData.destination_base || "destination"
                      ) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "a",
                      {
                        href: listingHref(
                          formData.destination_base || "destination"
                        ),
                        target: "_blank",
                        rel: "noreferrer",
                        className: "inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline shrink-0",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" }),
                          " ",
                          __("View", "yatra")
                        ]
                      }
                    )
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              FormField,
              {
                id: "activity_base",
                label: __("Activity Base", "yatra"),
                description: __(
                  'URL slug for activity archive pages (e.g., "activity" will create URLs like /activity/trekking)',
                  "yatra"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "activity_base",
                      name: "activity_base",
                      value: formData.activity_base || "activity",
                      onChange: handleFieldChange,
                      placeholder: "activity",
                      className: "font-mono"
                    }
                  ),
                  formData.activity_base && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                      __("Listing URL:", "yatra"),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-gray-100 dark:bg-gray-800 px-1 rounded break-all", children: listingHref(formData.activity_base || "activity") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "a",
                      {
                        href: listingHref(formData.activity_base || "activity"),
                        target: "_blank",
                        rel: "noreferrer",
                        className: "inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline shrink-0",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" }),
                          " ",
                          __("View", "yatra")
                        ]
                      }
                    )
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              FormField,
              {
                id: "trip_category_base",
                label: __("Trip Category Base", "yatra"),
                description: __(
                  'URL slug for trip category archive pages (e.g., "trip-category" will create URLs like /trip-category/adventure)',
                  "yatra"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "trip_category_base",
                      name: "trip_category_base",
                      value: formData.trip_category_base || "trip-category",
                      onChange: handleFieldChange,
                      placeholder: "trip-category",
                      className: "font-mono"
                    }
                  ),
                  formData.trip_category_base && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                      __("Listing URL:", "yatra"),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-gray-100 dark:bg-gray-800 px-1 rounded break-all", children: listingHref(
                        formData.trip_category_base || "trip-category"
                      ) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "a",
                      {
                        href: listingHref(
                          formData.trip_category_base || "trip-category"
                        ),
                        target: "_blank",
                        rel: "noreferrer",
                        className: "inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline shrink-0",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" }),
                          " ",
                          __("View", "yatra")
                        ]
                      }
                    )
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 pt-6 border-t border-gray-200 dark:border-gray-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4", children: __("Booking Page Settings", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-6", children: __(
              "Configure the booking page URL. By default, bookings use /book/{trip-slug}. You can customize the URL base or use a custom WordPress page.",
              "yatra"
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                FormField,
                {
                  id: "booking_base",
                  label: __("Default Booking URL Base", "yatra"),
                  description: __(
                    'URL slug for the booking page (e.g., "book" will create URLs like /book/trip-name)',
                    "yatra"
                  ),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "booking_base",
                        name: "booking_base",
                        value: formData.booking_base || "book",
                        onChange: handleFieldChange,
                        placeholder: "book",
                        className: "font-mono"
                      }
                    ),
                    formData.booking_base && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                          __("Booking hub URL:", "yatra"),
                          " ",
                          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-gray-100 dark:bg-gray-800 px-1 rounded break-all", children: listingHref(formData.booking_base || "book") })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "a",
                          {
                            href: listingHref(formData.booking_base || "book"),
                            target: "_blank",
                            rel: "noreferrer",
                            className: "inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline shrink-0",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" }),
                              " ",
                              __("View", "yatra")
                            ]
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                        __(
                          "Booking confirmation base (pageless, same slug as above):",
                          "yatra"
                        ),
                        " ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-gray-100 dark:bg-gray-800 px-1 rounded break-all", children: bookingConfirmationPreviewUrl(
                          formData.booking_base || "book"
                        ) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-400 dark:text-gray-500 ml-1", children: __(
                          "append booking reference after checkout",
                          "yatra"
                        ) })
                      ] }) })
                    ] })
                  ]
                }
              ),
              formData.use_booking_page && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                FormField,
                {
                  id: "booking_page_id",
                  label: __("Select Booking Page", "yatra"),
                  description: __(
                    "Choose a page that contains the [yatra_booking] shortcode. If the page doesn't have the shortcode, you'll be prompted to add it.",
                    "Choose a page that contains the [yatra_booking] shortcode. If the page doesn't have the shortcode, you'll be prompted to add it."
                  ),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "select",
                        {
                          id: "booking_page_id",
                          name: "booking_page_id",
                          value: formData.booking_page_id || 0,
                          onChange: (e) => handleBookingPageChange(parseInt(e.target.value)),
                          disabled: isCheckingShortcode,
                          className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-wait",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 0, children: __("-- Select a page --", "yatra") }),
                            pagesData == null ? void 0 : pagesData.map((page) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: page.id, children: page.title }, page.id))
                          ]
                        }
                      ),
                      isCheckingShortcode && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-8 top-1/2 -translate-y-1/2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 animate-spin text-blue-500" }) })
                    ] }),
                    formData.booking_page_id > 0 && pagesData && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: [
                      __("Booking URL:", "yatra"),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-gray-100 dark:bg-gray-800 px-1 rounded", children: ((_Ga = pagesData.find(
                        (p) => p.id === formData.booking_page_id
                      )) == null ? void 0 : _Ga.url) || "" })
                    ] })
                  ]
                }
              )
            ] })
          ] }),
          showShortcodeDialog && selectedPageForShortcode && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: __("Shortcode Required", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-300 mb-3", children: [
                __("The page", "yatra"),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                  '"',
                  selectedPageForShortcode.title,
                  '"'
                ] }),
                " ",
                __("doesn't have the", "doesn't have the"),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-gray-100 dark:bg-gray-700 px-1 rounded", children: "[yatra_booking]" }),
                " ",
                __("shortcode.", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: __(
                "Would you like to add it automatically, or edit the page manually to place it where you want?",
                "yatra"
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  onClick: handleConfirmInsertShortcode,
                  disabled: insertShortcodeMutation.isPending,
                  className: "w-full justify-center",
                  children: insertShortcodeMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" }),
                    __("Adding...", "yatra")
                  ] }) : __("Add Shortcode Automatically", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  onClick: () => {
                    var _a3;
                    const editUrl = (_a3 = pagesData == null ? void 0 : pagesData.find(
                      (p) => p.id === selectedPageForShortcode.id
                    )) == null ? void 0 : _a3.url;
                    if (editUrl) {
                      window.open(
                        `/wp-admin/post.php?post=${selectedPageForShortcode.id}&action=edit`,
                        "_blank"
                      );
                    }
                    setShowShortcodeDialog(false);
                    setSelectedPageForShortcode(null);
                  },
                  className: "w-full justify-center",
                  children: __("Edit Page Manually", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "ghost",
                  onClick: () => {
                    setShowShortcodeDialog(false);
                    setSelectedPageForShortcode(null);
                    handleFieldChange({
                      target: { name: "booking_page_id", value: 0 }
                    });
                  },
                  className: "w-full justify-center",
                  children: __("Skip for now", "yatra")
                }
              )
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 text-sm text-blue-800 dark:text-blue-200", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium mb-1", children: __("Important:", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3", children: __(
                "After changing permalink settings, you must flush rewrite rules for the changes to take effect.",
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  onClick: () => flushRewriteRulesMutation.mutate(),
                  disabled: flushRewriteRulesMutation.isPending,
                  variant: "outline",
                  size: "sm",
                  className: "flex items-center gap-2",
                  children: flushRewriteRulesMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
                    __("Flushing...", "yatra")
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "w-4 h-4" }),
                    __("Flush Rewrite Rules", "yatra")
                  ] })
                }
              )
            ] })
          ] }) })
        ] });
      }
      case "seo":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4", children: __("Trip Archive SEO Settings", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-4", children: __(
            "Configure SEO meta tags for the trip archive page (/trip/). These meta tags will be used for the main trip listing page.",
            "yatra"
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormField,
              {
                id: "seo_trip_meta_title",
                label: __("Trip Archive Meta Title", "yatra"),
                description: __(
                  "Meta title for the trip archive page. This will appear in search engine results for /trip/ page.",
                  "yatra"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "seo_trip_meta_title",
                    type: "text",
                    value: formData.seo_trip_meta_title,
                    onChange: (e) => setFormData(
                      (prev) => prev ? { ...prev, seo_trip_meta_title: e.target.value } : null
                    ),
                    placeholder: __(
                      "e.g., Browse All Trips - Find Your Perfect Adventure | Your Travel Agency",
                      "yatra"
                    ),
                    className: "w-full"
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormField,
              {
                id: "seo_trip_meta_description",
                label: __("Trip Archive Meta Description", "yatra"),
                description: __(
                  "Meta description for the trip archive page. Should be 150-160 characters for best SEO results.",
                  "yatra"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "textarea",
                  {
                    id: "seo_trip_meta_description",
                    value: formData.seo_trip_meta_description,
                    onChange: (e) => setFormData(
                      (prev) => prev ? {
                        ...prev,
                        seo_trip_meta_description: e.target.value
                      } : null
                    ),
                    placeholder: __(
                      "e.g., Explore our complete collection of amazing trips and adventures. Find and book your perfect journey with us.",
                      "yatra"
                    ),
                    rows: 3,
                    className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormField,
              {
                id: "seo_trip_meta_keywords",
                label: __("Trip Archive Meta Keywords", "yatra"),
                description: __(
                  "Comma-separated keywords for the trip archive page. Include relevant travel and booking keywords.",
                  "yatra"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "seo_trip_meta_keywords",
                    type: "text",
                    value: formData.seo_trip_meta_keywords,
                    onChange: (e) => setFormData(
                      (prev) => prev ? { ...prev, seo_trip_meta_keywords: e.target.value } : null
                    ),
                    placeholder: __(
                      "e.g., travel, trips, adventure, booking, tours, destinations, holidays",
                      "yatra"
                    ),
                    className: "w-full"
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormField,
              {
                id: "seo_trip_meta_image",
                label: __("Trip Archive SEO Image", "yatra"),
                description: __(
                  "Image for social media sharing and SEO. Recommended size: 1200x630 pixels. This image will appear when the trip archive page is shared on Facebook, Twitter, and other platforms.",
                  "yatra"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: formData.seo_trip_meta_image && formData.seo_trip_meta_image > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative group", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50", children: [
                  seoImageLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 h-24 flex items-center justify-center border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-6 h-6 animate-spin text-gray-400" }) }) : seoImageUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-24 h-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: seoImageUrl,
                        alt: "SEO Preview",
                        className: "w-full h-full object-cover"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" })
                  ] }) : seoImageError ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-24 h-24 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-6 h-6 text-red-400 mb-1" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-red-500 dark:text-red-400 text-center px-1", children: seoImageError })
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-24 h-24 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "w-6 h-6 text-gray-400 mb-1" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: "No image" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("SEO Image", "yatra") }),
                      !seoImageLoading && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => {
                            setFormData(
                              (prev) => prev ? { ...prev, seo_trip_meta_image: 0 } : null
                            );
                          },
                          className: "opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded",
                          title: __("Remove image", "yatra"),
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-3", children: __(
                      "Recommended size: 1200x630 pixels for optimal social media display.",
                      "yatra"
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        onClick: () => {
                          if (window.wp && window.wp.media) {
                            const mediaUploader = window.wp.media({
                              title: __("Select SEO Image", "yatra"),
                              button: {
                                text: __("Use this image", "yatra")
                              },
                              multiple: false,
                              library: { type: "image" }
                            });
                            mediaUploader.on("select", () => {
                              const attachment = mediaUploader.state().get("selection").first().toJSON();
                              setFormData(
                                (prev) => prev ? {
                                  ...prev,
                                  seo_trip_meta_image: attachment.id
                                } : null
                              );
                            });
                            prepareWordPressMediaFrameOpen();
                            mediaUploader.open();
                          }
                        },
                        variant: "outline",
                        size: "sm",
                        children: __("Change Image", "yatra")
                      }
                    )
                  ] })
                ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "w-8 h-8 text-gray-400" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-white mb-2", children: __("Add SEO Image", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto", children: __(
                    "Upload an image that will appear when your trip archive page is shared on social media. Recommended size: 1200x630 pixels.",
                    "yatra"
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      onClick: () => {
                        if (window.wp && window.wp.media) {
                          const mediaUploader = window.wp.media({
                            title: __("Select SEO Image", "yatra"),
                            button: { text: __("Use this image", "yatra") },
                            multiple: false,
                            library: { type: "image" }
                          });
                          mediaUploader.on("select", () => {
                            const attachment = mediaUploader.state().get("selection").first().toJSON();
                            setFormData(
                              (prev) => prev ? {
                                ...prev,
                                seo_trip_meta_image: attachment.id
                              } : null
                            );
                          });
                          prepareWordPressMediaFrameOpen();
                          mediaUploader.open();
                        }
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                        __("Select Image", "yatra")
                      ]
                    }
                  )
                ] }) })
              }
            )
          ] })
        ] }) });
      case "advanced":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400", children: __(
              "For PHP-level debug output, use WordPress wp-config.php (WP_DEBUG). The options below are implemented by the plugin.",
              "yatra"
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "enable_logging",
                  checked: formData.enable_logging,
                  name: "enable_logging",
                  onChange: handleFieldChange,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "enable_logging",
                    className: "font-medium cursor-pointer",
                    children: __("Enable Logging", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                  "Log system events and errors for troubleshooting",
                  "yatra"
                ) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "debug_mode",
                  checked: formData.debug_mode,
                  name: "debug_mode",
                  onChange: handleFieldChange,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "debug_mode",
                    className: "font-medium cursor-pointer",
                    children: __("Debug mode", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                  "Extra plugin-side diagnostics. When on, Yatra object cache is bypassed (same as when WP_DEBUG is true in wp-config).",
                  "yatra"
                ) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "cache_enabled",
                  checked: formData.cache_enabled,
                  name: "cache_enabled",
                  onChange: handleFieldChange,
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "cache_enabled",
                    className: "font-medium cursor-pointer",
                    children: __("Enable Cache", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                  "Stores frequently used data for faster loads. Stays off while WP_DEBUG or Debug mode (above) is on.",
                  "yatra"
                ) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-2", children: __("Legal pages (Booking UI)", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-4", children: __(
              "Select the pages that will be linked from the booking Terms and Privacy consent checkboxes.",
              "yatra"
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "terms_page_id", children: __("Terms & Conditions page", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "select",
                  {
                    id: "terms_page_id",
                    name: "terms_page_id",
                    value: formData.terms_page_id || 0,
                    onChange: handleFieldChange,
                    className: "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 0, children: __("— Select —", "yatra") }),
                      pagesData == null ? void 0 : pagesData.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p.id, children: p.title }, p.id))
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "privacy_policy_page_id", children: __("Privacy Policy page", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "select",
                  {
                    id: "privacy_policy_page_id",
                    name: "privacy_policy_page_id",
                    value: formData.privacy_policy_page_id || 0,
                    onChange: handleFieldChange,
                    className: "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 0, children: __("— Select —", "yatra") }),
                      pagesData == null ? void 0 : pagesData.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p.id, children: p.title }, p.id))
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-gray-500 dark:text-gray-400", children: __(
                  "If not set here, WordPress Settings → Privacy will be used when available.",
                  "yatra"
                ) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-6 mt-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(BarChart3, { className: "w-4 h-4" }),
              __("Help us improve Yatra", "yatra")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-4", children: [
              __(
                "Share non-sensitive technical details so we can make Yatra better. You can turn this off anytime. See what we collect on our site:",
                "yatra"
              ),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  className: "text-blue-600 hover:underline inline-flex items-center gap-0.5",
                  href: "https://wpyatra.com/what-we-collect/",
                  target: "_blank",
                  rel: "noopener noreferrer",
                  children: [
                    __("What we collect", "yatra"),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3", "aria-hidden": true })
                  ]
                }
              ),
              " · ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  className: "text-blue-600 hover:underline",
                  href: "https://mantrabrain.com/privacy-policy/",
                  target: "_blank",
                  rel: "noopener noreferrer",
                  children: __("Privacy policy", "yatra")
                }
              )
            ] }),
            usageLoading && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-500 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
              __("Loading…", "yatra")
            ] }),
            !usageLoading && !usageStatus && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-amber-600", children: __(
                "Could not load this section. You may need permission to manage Yatra.",
                "yatra"
              ) }),
              usageError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: usageError })
            ] }),
            !usageLoading && usageStatus && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  id: "yatra_usage_tracking_enabled",
                  checked: usageStatus.enabled,
                  disabled: usageBusy,
                  onChange: async (e) => {
                    setUsageBusy(true);
                    try {
                      const r = await postUsageTrackingSettings(
                        e.target.checked
                      );
                      setUsageStatus(
                        (prev) => prev ? { ...prev, enabled: r.enabled } : prev
                      );
                      showToast(
                        __("Preference saved.", "yatra"),
                        "success"
                      );
                    } catch (err) {
                      showToast(
                        (err == null ? void 0 : err.message) || __("Could not save your preference.", "yatra"),
                        "error"
                      );
                    } finally {
                      setUsageBusy(false);
                    }
                  },
                  className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-[200px]", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "yatra_usage_tracking_enabled",
                    className: "font-medium cursor-pointer",
                    children: __(
                      "Help us improve the product by sharing non-sensitive data",
                      "yatra"
                    )
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: [
                  __(
                    "Sent periodically while enabled. Learn more: ",
                    "yatra"
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "a",
                    {
                      className: "text-blue-600 hover:underline inline-flex items-center gap-0.5",
                      href: "https://wpyatra.com/what-we-collect/",
                      target: "_blank",
                      rel: "noopener noreferrer",
                      children: [
                        __("What we collect", "yatra"),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3", "aria-hidden": true })
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "default",
                  size: "sm",
                  disabled: usageBusy,
                  onClick: async () => {
                    setUsageBusy(true);
                    try {
                      await postUsageTrackingSend({
                        force: !usageStatus.enabled
                      });
                      const s = await fetchUsageTrackingStatus();
                      setUsageStatus(s);
                      showToast(
                        __("Sent successfully.", "yatra"),
                        "success"
                      );
                    } catch (err) {
                      showToast(
                        (err == null ? void 0 : err.message) || __("Send failed.", "yatra"),
                        "error"
                      );
                    } finally {
                      setUsageBusy(false);
                    }
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4 mr-1" }),
                    __("Send now", "yatra")
                  ]
                }
              )
            ] }) })
          ] })
        ] });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-gray-500 dark:text-gray-400", children: __("Settings section coming soon", "yatra") });
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "space-y-1 p-2", children: [...Array(12)].map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-md",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
            ]
          },
          `skeleton-nav-${index}`
        )) }) }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pb-4 space-y-4", children: [
            [...Array(6)].map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
            ] }, `skeleton-field-${index}`)),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4", children: [...Array(4)].map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
            ] }, `skeleton-grid-${index}`)) })
          ] })
        ] }) })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        title: __("Settings", "yatra"),
        description: __(
          "Configure your travel booking plugin settings",
          "yatra"
        ),
        actions: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: handleSave,
            disabled: isSaving || !formData,
            className: "flex items-center gap-2",
            children: isSaving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
              __("Saving...", "yatra")
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4" }),
              __("Save Settings", "yatra")
            ] })
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_manage_settings", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "space-y-1 p-2", children: settingsSections.map((section) => {
        const Icon = section.icon;
        const isViewing = viewingSection === section.id;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setViewingSection(section.id),
            className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isViewing ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-4 h-4" }),
              section.label
            ]
          },
          section.id
        );
      }) }) }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base flex items-center gap-2", children: (() => {
          const section = settingsSections.find(
            (s) => s.id === viewingSection
          );
          const Icon = (section == null ? void 0 : section.icon) || Settings$1;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-4 h-4" }),
            (section == null ? void 0 : section.label) || __("Settings", "yatra")
          ] });
        })() }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pb-4", children: renderSettingsContent() }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardFooter, { className: "flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700/50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: handleSave,
            disabled: isSaving || !formData,
            className: "flex items-center gap-2",
            children: isSaving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
              __("Saving...", "yatra")
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4" }),
              __("Save Settings", "yatra")
            ] })
          }
        ) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PremiumUpgradeDialog,
      {
        open: showPremiumDialog,
        onClose: () => setShowPremiumDialog(false),
        moduleName: selectedPremiumGateway,
        moduleDescription: `Unlock ${selectedPremiumGateway} payment gateway to accept payments from your customers. This premium gateway provides secure payment processing with advanced features.`,
        purchaseUrl: ((_b = window.yatraAdmin) == null ? void 0 : _b.pricingUrl) || "https://wpyatra.com/pricing"
      }
    )
  ] });
};
export {
  Settings as default
};
//# sourceMappingURL=Settings-WStf1Cfq.js.map
