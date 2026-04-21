import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { useToast } from "../components/ui/toast";
import {
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  ExternalLink,
} from "lucide-react";
import { apiService } from "../lib/api-client";

interface GoogleCalendarSettings {
  connected: boolean;
  calendar_id: string;
  calendar_name: string;
  auto_sync: boolean;
  sync_bookings: boolean;
  sync_departures: boolean;
  send_invitations: boolean;
  reminder_days: number[];
  last_sync: string | null;
}

const GoogleCalendar: React.FC = () => {
  const [settings, setSettings] = useState<GoogleCalendarSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { showToast } = useToast();

  const __ = (text: string) => text;

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiService.getGoogleCalendarSettings();
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const data = await apiService.connectGoogleCalendar();

      if (data.success && data.data.auth_url) {
        // Redirect to Google OAuth
        window.location.href = data.data.auth_url;
      } else {
        showToast(data.message || __("Failed to connect"), "error");
      }
    } catch (error) {
      showToast(__("Failed to connect to Google Calendar"), "error");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(__("Are you sure you want to disconnect Google Calendar?"))) {
      return;
    }

    try {
      await apiService.disconnectGoogleCalendar();
      showToast(__("Disconnected successfully"), "success");
      fetchSettings();
    } catch (error) {
      showToast(__("Failed to disconnect"), "error");
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const data = await apiService.syncAllGoogleCalendar();

      if (data.success) {
        showToast(__("Sync completed successfully"), "success");
        fetchSettings();
      } else {
        showToast(data.message || __("Sync failed"), "error");
      }
    } catch (error) {
      showToast(__("Failed to sync bookings"), "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleSettingChange = async (
    key: keyof GoogleCalendarSettings,
    value: any,
  ) => {
    try {
      await apiService.updateGoogleCalendarSettings({ [key]: value });
      setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
      showToast(__("Settings updated"), "success");
    } catch (error) {
      showToast(__("Failed to update settings"), "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            {__("Google Calendar Integration")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {__(
              "Automatically sync your bookings and departures to Google Calendar",
            )}
          </p>
        </div>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{__("Connection Status")}</span>
            {settings?.connected ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle className="w-4 h-4 mr-1" />
                {__("Connected")}
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                <XCircle className="w-4 h-4 mr-1" />
                {__("Not Connected")}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {settings?.connected
              ? __("Your Google Calendar is connected and ready to sync")
              : __("Connect your Google account to start syncing bookings")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.connected ? (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {settings.calendar_name || __("Primary Calendar")}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {__("Calendar ID")}: {settings.calendar_id}
                    </p>
                    {settings.last_sync && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {__("Last synced")}:{" "}
                        {new Date(settings.last_sync).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSyncAll}
                  disabled={syncing}
                  className="flex-1"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {__("Syncing...")}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {__("Sync All Bookings")}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                  {__("Disconnect")}
                </Button>
              </div>
            </>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full"
              size="lg"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  {__("Connecting...")}
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5 mr-2" />
                  {__("Connect Google Calendar")}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Sync Settings */}
      {settings?.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {__("Sync Settings")}
            </CardTitle>
            <CardDescription>
              {__("Configure what gets synced to your Google Calendar")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="font-medium text-gray-900 dark:text-white">
                    {__("Auto Sync")}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {__("Automatically sync new bookings and changes")}
                  </p>
                </div>
                <Switch
                  checked={settings.auto_sync}
                  onCheckedChange={(checked: boolean) =>
                    handleSettingChange("auto_sync", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="font-medium text-gray-900 dark:text-white">
                    {__("Sync Bookings")}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {__("Create calendar events for new bookings")}
                  </p>
                </div>
                <Switch
                  checked={settings.sync_bookings}
                  onCheckedChange={(checked: boolean) =>
                    handleSettingChange("sync_bookings", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="font-medium text-gray-900 dark:text-white">
                    {__("Sync Departures")}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {__("Create calendar events for departures")}
                  </p>
                </div>
                <Switch
                  checked={settings.sync_departures}
                  onCheckedChange={(checked: boolean) =>
                    handleSettingChange("sync_departures", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="font-medium text-gray-900 dark:text-white">
                    {__("Send Invitations")}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {__("Send calendar invitations to customers")}
                  </p>
                </div>
                <Switch
                  checked={settings.send_invitations}
                  onCheckedChange={(checked: boolean) =>
                    handleSettingChange("send_invitations", checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>{__("Documentation")}</CardTitle>
          <CardDescription>
            {__("Learn more about Google Calendar integration")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="https://docs.yatra.com/modules/google-calendar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {__("View Documentation")}
            <ExternalLink className="w-4 h-4" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCalendar;
