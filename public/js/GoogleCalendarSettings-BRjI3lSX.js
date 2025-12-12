import { r as reactExports, j as jsxRuntimeExports, s as RefreshCw, i as Calendar, O as CheckCircle, a9 as XCircle, Z as ExternalLink } from "./react-vendor-C_nDbNrJ.js";
import { a as apiClient, _ as __ } from "./index-DXDUp5pC.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent, L as Label, I as Input, B as Button } from "./app.js";
const GoogleCalendarSettings = () => {
  const [settings, setSettings] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [connecting, setConnecting] = reactExports.useState(false);
  const [syncing, setSyncing] = reactExports.useState(false);
  const toast = (props) => {
    console.log(`Toast: ${props.title} - ${props.description}`);
  };
  reactExports.useEffect(() => {
    fetchSettings();
  }, []);
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/google-calendar/settings");
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch Google Calendar settings:", error);
      toast({
        title: __("Error", "Error"),
        description: __("Failed to load Google Calendar settings. Please try again.", "Failed to load Google Calendar settings. Please try again.")
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSettingChange = async (key, value) => {
    try {
      const response = await apiClient.post("/google-calendar/settings", {
        [key]: value
      });
      setSettings(response.data);
      toast({
        title: __("Success", "Success"),
        description: __("Setting updated successfully.", "Setting updated successfully.")
      });
    } catch (error) {
      console.error("Failed to update setting:", error);
      toast({
        title: __("Error", "Error"),
        description: __("Failed to update setting. Please try again.", "Failed to update setting. Please try again.")
      });
    }
  };
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await apiClient.post("/google-calendar/connect");
      if (response.data.auth_url) {
        window.open(response.data.auth_url, "_blank");
      }
    } catch (error) {
      console.error("Failed to initiate connection:", error);
      toast({
        title: __("Error", "Error"),
        description: __("Failed to connect to Google Calendar. Please check your credentials and try again.", "Failed to connect to Google Calendar. Please check your credentials and try again.")
      });
    } finally {
      setConnecting(false);
    }
  };
  const handleDisconnect = async () => {
    if (!confirm(__("Are you sure you want to disconnect from Google Calendar?", "Are you sure you want to disconnect from Google Calendar?"))) {
      return;
    }
    try {
      await apiClient.post("/google-calendar/disconnect");
      setSettings((prev) => prev ? { ...prev, connected: false, calendar_id: "", calendar_name: "" } : null);
      toast({
        title: __("Success", "Success"),
        description: __("Disconnected from Google Calendar.", "Disconnected from Google Calendar.")
      });
    } catch (error) {
      console.error("Failed to disconnect:", error);
      toast({
        title: __("Error", "Error"),
        description: __("Failed to disconnect from Google Calendar. Please try again.", "Failed to disconnect from Google Calendar. Please try again.")
      });
    }
  };
  const handleSync = async () => {
    setSyncing(true);
    try {
      await apiClient.post("/google-calendar/sync");
      toast({
        title: __("Success", "Success"),
        description: __("Sync initiated successfully.", "Sync initiated successfully.")
      });
      fetchSettings();
    } catch (error) {
      console.error("Failed to sync:", error);
      toast({
        title: __("Error", "Error"),
        description: __("Failed to sync with Google Calendar. Please try again.", "Failed to sync with Google Calendar. Please try again.")
      });
    } finally {
      setSyncing(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-5 h-5 animate-spin text-blue-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __("Loading settings...", "Loading settings...") })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-5 h-5 text-blue-500" }),
        __("Google Calendar Integration", "Google Calendar Integration")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: (settings == null ? void 0 : settings.connected) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm text-green-600 dark:text-green-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4" }),
        __("Connected", "Connected")
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "w-4 h-4" }),
        __("Not Connected", "Not Connected")
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: __("Connect your Google Calendar to automatically sync bookings and departures.", "Connect your Google Calendar to automatically sync bookings and departures.") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "client_id", children: __("Client ID", "Client ID") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "client_id",
              value: (settings == null ? void 0 : settings.client_id) || "",
              onChange: (e) => handleSettingChange("client_id", e.target.value),
              placeholder: __("Enter Google API Client ID", "Enter Google API Client ID"),
              className: "mt-1"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __("From Google Cloud Console", "From Google Cloud Console") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "client_secret", children: __("Client Secret", "Client Secret") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "client_secret",
              type: "password",
              value: (settings == null ? void 0 : settings.client_secret) || "",
              onChange: (e) => handleSettingChange("client_secret", e.target.value),
              placeholder: __("Enter Google API Client Secret", "Enter Google API Client Secret"),
              className: "mt-1"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "redirect_uri", children: __("Redirect URI", "Redirect URI") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "redirect_uri",
              value: (settings == null ? void 0 : settings.redirect_uri) || "",
              readOnly: true,
              className: "bg-gray-50 dark:bg-gray-900 font-mono text-sm"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => {
                if (settings == null ? void 0 : settings.redirect_uri) {
                  navigator.clipboard.writeText(settings.redirect_uri);
                  toast({
                    title: __("Copied", "Copied"),
                    description: __("Redirect URI copied to clipboard", "Redirect URI copied to clipboard")
                  });
                }
              },
              children: __("Copy", "Copy")
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __("Add this URL to your Google Cloud Console Authorized Redirect URIs", "Add this URL to your Google Cloud Console Authorized Redirect URIs") })
      ] }),
      (settings == null ? void 0 : settings.connected) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4 mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-800 rounded-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-sm mb-2", children: __("Connected Calendar", "Connected Calendar") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "calendar_id", children: __("Calendar ID", "Calendar ID") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "calendar_id",
                value: settings.calendar_id || "",
                onChange: (e) => handleSettingChange("calendar_id", e.target.value),
                placeholder: __("Enter Calendar ID", "Enter Calendar ID"),
                className: "mt-1"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "calendar_name", children: __("Calendar Name", "Calendar Name") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "calendar_name",
                value: settings.calendar_name || "",
                onChange: (e) => handleSettingChange("calendar_name", e.target.value),
                placeholder: __("Enter Calendar Name", "Enter Calendar Name"),
                className: "mt-1"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: settings.last_sync ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            __("Last sync:", "Last sync:"),
            " ",
            new Date(settings.last_sync).toLocaleString()
          ] }) : __("Never synced", "Never synced") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: handleSync,
              disabled: syncing,
              className: "flex items-center gap-2",
              children: [
                syncing ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4" }),
                __("Sync Now", "Sync Now")
              ]
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3 mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: "https://console.cloud.google.com/apis/credentials",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" }),
              __("Google Cloud Console", "Google Cloud Console")
            ]
          }
        ),
        (settings == null ? void 0 : settings.connected) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "destructive",
            onClick: handleDisconnect,
            className: "flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "w-4 h-4" }),
              __("Disconnect", "Disconnect")
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: handleConnect,
            disabled: connecting || !(settings == null ? void 0 : settings.client_id) || !(settings == null ? void 0 : settings.client_secret),
            className: "flex items-center gap-2",
            children: [
              connecting ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4" }),
              __("Connect to Google Calendar", "Connect to Google Calendar")
            ]
          }
        )
      ] })
    ] })
  ] }) });
};
export {
  GoogleCalendarSettings as default
};
//# sourceMappingURL=GoogleCalendarSettings-BRjI3lSX.js.map
