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
  ArrowLeft,
  X,
} from "lucide-react";
import { apiService } from "../lib/api-client";
import { __, sprintf } from "../lib/i18n";

interface GoogleCalendarSettings {
  connected: boolean;
  calendar_id: string;
  calendar_name: string;
  auto_sync: boolean;
  sync_bookings: boolean;
  sync_departures: boolean;
  send_invitations: boolean;
  reminder_days: number[];
  /** Pro 3.0.13+. Absent on an older Pro, which is how we detect support. */
  add_guests?: boolean;
  /** Pro 3.0.13+. Absent on an older Pro. */
  combine_bookings?: boolean;
  last_sync: string | null;
}

const GoogleCalendar: React.FC = () => {
  const [settings, setSettings] = useState<GoogleCalendarSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [newReminderDay, setNewReminderDay] = useState("");
  const [reminderError, setReminderError] = useState("");
  const [resyncing, setResyncing] = useState(false);
  const [resyncProgress, setResyncProgress] = useState<{
    processed: number;
    total: number;
    created: number;
    updated: number;
    deleted: number;
    failed: number;
  } | null>(null);
  const { showToast } = useToast();
  // This dashboard lives under Settings → Integration; the Back button returns
  // there (and deep-links the Integration section via ?section=integration).
  const adminUrl = (window as any).yatraAdmin?.adminUrl || "admin.php";
  const settingsIntegrationUrl = `${adminUrl}?page=yatra&subpage=settings&section=integration`;



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

  /**
   * Full resync: walks every booking, repairing whatever it finds — creating
   * missing events, re-pushing existing ones, recreating any deleted in Google
   * and removing events for cancelled bookings. Runs in batches so a large
   * calendar can't time out, looping until the server reports done.
   */
  const handleResync = async () => {
    const confirmed = window.confirm(
      __(
        "Resync every booking with Google Calendar? Existing events are updated in place, missing ones are recreated, and events for cancelled bookings are removed. This can take a while on a large calendar.",
      ),
    );
    if (!confirmed) {
      return;
    }

    setResyncing(true);
    const totals = {
      processed: 0,
      total: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      failed: 0,
    };
    setResyncProgress({ ...totals });

    try {
      let cursor: number | null = 0;
      // Hard stop: a server that never reports `done` must not spin forever.
      for (let guard = 0; guard < 2000 && cursor !== null; guard++) {
        const response: any = await apiService.resyncGoogleCalendar(cursor);
        const data = response?.data ?? response;

        if (!response?.success && !data?.success) {
          throw new Error(response?.message || __("Resync failed"));
        }

        totals.processed += Number(data.processed) || 0;
        totals.created += Number(data.created) || 0;
        totals.updated += Number(data.updated) || 0;
        totals.deleted += Number(data.deleted) || 0;
        totals.failed += Number(data.failed) || 0;
        if (data.total) {
          totals.total = Number(data.total) || 0;
        }
        setResyncProgress({ ...totals });

        // `Number(null)` is 0, so a missing cursor must be checked before
        // converting — otherwise the loop would restart from the beginning.
        const next =
          data.done || data.next_cursor == null
            ? null
            : Number(data.next_cursor);

        // The cursor is a booking id and must strictly advance. Refusing to go
        // backwards means a bad response ends the run instead of re-walking
        // the same bookings (and re-calling Google) until the guard trips.
        cursor = next !== null && next > cursor ? next : null;
      }

      showToast(
        sprintf(
          /* translators: %1$d created, %2$d updated, %3$d removed, %4$d failed. */
          __(
            "Resync complete — %1$d created, %2$d updated, %3$d removed, %4$d failed.",
          ),
          totals.created,
          totals.updated,
          totals.deleted,
          totals.failed,
        ),
        totals.failed > 0 ? "warning" : "success",
      );
      fetchSettings();
    } catch (error: any) {
      // The endpoint lives in Yatra Pro. A site that updated the free plugin
      // first has no route yet, and "404" tells the admin nothing useful.
      const status = error?.response?.status ?? error?.status;
      const code = error?.response?.data?.code ?? error?.code;
      const missingRoute = status === 404 || code === "rest_no_route";

      showToast(
        missingRoute
          ? __(
              "Resync needs a newer version of Yatra Pro. Please update Yatra Pro and try again.",
            )
          : error?.message || __("Resync failed"),
        "error",
      );
    } finally {
      setResyncing(false);
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

  /** Google rejects an event carrying more than 5 reminder overrides. */
  const MAX_REMINDERS = 5;

  const addReminderDay = () => {
    const days = Number(newReminderDay);
    if (!Number.isInteger(days) || days <= 0) {
      setReminderError(__("Enter a whole number of days, 1 or more."));
      return;
    }
    const current = settings?.reminder_days ?? [];
    if (current.includes(days)) {
      setReminderError(__("That reminder already exists."));
      return;
    }
    if (current.length >= MAX_REMINDERS) {
      setReminderError(
        __("Google allows at most 5 reminders on an event."),
      );
      return;
    }
    setReminderError("");
    const next = [...current, days].sort((a, b) => b - a);
    setNewReminderDay("");
    handleSettingChange("reminder_days", next);
  };

  const removeReminderDay = (days: number) => {
    setReminderError("");
    handleSettingChange(
      "reminder_days",
      (settings?.reminder_days ?? []).filter((d) => d !== days),
    );
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
      {/* Back to Settings → Integration */}
      <a
        href={settingsIntegrationUrl}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
      >
        <ArrowLeft className="w-4 h-4" />
        {__("Back to Settings → Integration")}
      </a>

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
                  disabled={syncing || resyncing}
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
                  onClick={handleResync}
                  disabled={resyncing || syncing}
                  className="flex-1"
                  title={__(
                    "Re-push every booking: updates existing events, recreates missing ones and removes events for cancelled bookings.",
                  )}
                >
                  {resyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {resyncProgress && resyncProgress.total > 0
                        ? sprintf(
                            /* translators: %1$d: bookings processed so far, %2$d: total bookings. */
                            __("Resyncing %1$d/%2$d…"),
                            resyncProgress.processed,
                            resyncProgress.total,
                          )
                        : __("Resyncing…")}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {__("Resync Everything")}
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
              {resyncProgress && !resyncing && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {sprintf(
                    /* translators: %1$d created, %2$d updated, %3$d removed, %4$d failed. */
                    __(
                      "Last resync: %1$d created, %2$d updated, %3$d removed, %4$d failed.",
                    ),
                    resyncProgress.created,
                    resyncProgress.updated,
                    resyncProgress.deleted,
                    resyncProgress.failed,
                  )}
                </p>
              )}
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

              {/* Whether the customer goes on the event at all. Distinct from
                  "Send Invitations", which only governs the invite email:
                  an attendee still receives Google's own reminders and
                  cancellation notices.

                  Rendered only when Yatra Pro actually supports it. On an older
                  Pro the key is missing from the settings payload, and showing a
                  switch that silently saves nothing is worse than not showing
                  it at all. */}
              {settings.add_guests !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <label className="font-medium text-gray-900 dark:text-white">
                    {__("Add customers as guests")}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {__(
                      "Puts the customer's email on the calendar event. Turn this off to keep their address off the event entirely, so Google sends them no reminders or cancellation emails.",
                    )}
                  </p>
                </div>
                <Switch
                  checked={settings.add_guests}
                  onCheckedChange={(checked: boolean) =>
                    handleSettingChange("add_guests", checked)
                  }
                />
              </div>
              )}

              {/* One event per departure instead of one per booking.
                  Same Pro-support check as above. */}
              {settings.combine_bookings !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <label className="font-medium text-gray-900 dark:text-white">
                    {__("One event per departure")}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {__(
                      "Puts every booking on the same departure into a single calendar event, with each booking's details listed in the description. Customers are never added as guests on a shared event, so they cannot see each other's addresses.",
                    )}
                  </p>
                </div>
                <Switch
                  checked={settings.combine_bookings}
                  onCheckedChange={(checked: boolean) =>
                    handleSettingChange("combine_bookings", checked)
                  }
                />
              </div>
              )}

              {/* Reminders on the event. The backend already stored these; there
                  was simply no way to change them. */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="font-medium text-gray-900 dark:text-white">
                  {__("Event reminders")}
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {__(
                    "Email reminders added to each calendar event, counted in days before departure. Google allows up to 5.",
                  )}
                </p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newReminderDay}
                    onChange={(e) => setNewReminderDay(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addReminderDay();
                      }
                    }}
                    placeholder={__("Days before")}
                    className="w-40 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addReminderDay}
                    disabled={
                      !newReminderDay ||
                      (settings.reminder_days?.length ?? 0) >= MAX_REMINDERS
                    }
                  >
                    {__("Add")}
                  </Button>
                </div>
                {reminderError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                    {reminderError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {(settings.reminder_days ?? []).length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {__("No reminders — Google will use your calendar's defaults.")}
                    </p>
                  ) : (
                    (settings.reminder_days ?? []).map((days) => (
                      <Badge
                        key={days}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        {days === 1
                          ? __("1 day before")
                          : `${days} ${__("days before")}`}
                        <button
                          type="button"
                          onClick={() => removeReminderDay(days)}
                          className="ml-1 hover:text-red-500"
                          aria-label={__("Remove reminder")}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
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
            href="https://docs.wpyatra.com/modules/google-calendar"
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
