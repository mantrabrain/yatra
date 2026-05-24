import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Shield,
  ShieldCheck,
  KeyRound,
  History,
  Mail,
  UserPlus,
  Trash2,
  LogOut,
  Loader2,
  ExternalLink,
  Crown,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  AlertTriangle,
  Settings,
  Lock,
  Unlock,
} from "lucide-react";
import { __, sprintf, brandName } from "../lib/i18n";
import { PageHeader } from "../components/common/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Modal } from "../components/ui/modal";
import { Switch } from "../components/ui/switch";
import { Tooltip } from "../components/ui/tooltip";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { Pagination } from "../components/shared/Pagination";
import { Table as SharedTable } from "../components/shared/Table";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../components/ui/toast";
import { setUserCaps } from "../hooks/useCapabilities";
import {
  teamApi,
  type CapabilityDef,
  type TeamInvitation,
  type TeamMeta,
  type TeamRole,
  type TeamUser,
  type TeamUserWritePayload,
} from "../api/team-api";

/* -------------------------------------------------------------------------- */
/*  Yatra → Team & Access — Agency-tier admin surface                          */
/*                                                                             */
/*  Mirrors the Webhooks page architecture: same upgrade-card / module-       */
/*  disabled-card gates, same tab strip pattern, same SharedTable primitive   */
/*  for every list view. Strictly composed from existing Yatra UI components  */
/*  — no bespoke styling, no new design tokens.                                */
/* -------------------------------------------------------------------------- */

type TeamTab = "members" | "roles" | "invitations" | "audit" | "settings";

const extractError = (e: any): string => {
  return e?.response?.data?.message || e?.message || __("Something went wrong.", "yatra");
};

const getInitialTab = (): TeamTab => {
  if (typeof window === "undefined") return "members";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (
    tab === "roles"
    || tab === "invitations"
    || tab === "audit"
    || tab === "settings"
  ) return tab;
  return "members";
};

const Team: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TeamTab>(() => getInitialTab());

  const switchTab = (next: TeamTab) => {
    setActiveTab(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const { data: meta, isLoading: metaLoading } = useQuery({
    queryKey: ["team-meta"],
    queryFn: () => teamApi.getMeta(),
  });

  // Forward-looking "keep access on module disable" setting. We fetch
  // it via the same React Query key the Settings tab uses — sharing
  // the cache so flipping the toggle re-renders this banner live
  // (no page reload) without firing a second request. Initial paint
  // uses the server-injected snapshot to avoid a flicker.
  //
  // CRITICAL: this useQuery MUST stay above any early-return branches
  // below (meta loading / no-meta / not-agency / module-disabled).
  // React enforces a stable hook order across renders; if it lived
  // below an early return, switching from the loading state to the
  // ready state would introduce a "new" hook and trigger React error
  // #310.
  const { data: settingsData } = useQuery({
    queryKey: ["team-settings"],
    queryFn: () => teamApi.getSettings(),
    initialData: () => {
      const seed = window.yatraAdmin?.teamKeepAccessOnModuleDisable;
      // The option defaults to FALSE server-side (security-conservative:
      // disabling the module strips Yatra roles unless the operator
      // explicitly opts in). When the localized snapshot is undefined
      // (very first paint on a fresh install before the toggle has
      // ever been touched) mirror that default so the banner + tab
      // contents agree from the first render.
      return {
        data: { keep_access_on_module_disable: seed === true },
      } as { data: { keep_access_on_module_disable: boolean } };
    },
    // Don't fire the network request until the module is actually
    // enabled — the /team/settings endpoint requires Team & Access
    // to be active. Initial data still serves the banner during
    // loading + non-agency states.
    enabled: meta?.is_module_enabled === true,
  });
  // Strict equality on TRUE keeps this consistent with the SettingsTab
  // toggle below (also `=== true`) so the banner and the toggle never
  // disagree about which side of the default we're on.
  const keepAccessOnDisable =
    settingsData?.data?.keep_access_on_module_disable === true;

  if (metaLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton mirroring the loaded page: header copy + tab strip +  */}
        {/* table card. Keeps the layout stable during /team/meta load.    */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Card>
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex gap-6">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-5 w-24" />
            ))}
          </div>
          <CardContent className="space-y-3 pt-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!meta) return null;

  if (!meta.is_agency_active) {
    return (
      <div className="space-y-6">
        <PageHeader
          description={__(
            "Granular roles, scoped access, magic-link invitations, and a tamper-evident audit log.",
            "yatra",
          )}
        />
        <UpgradeCard meta={meta} />
      </div>
    );
  }

  if (!meta.is_module_enabled) {
    return (
      <div className="space-y-6">
        <PageHeader
          description={__(
            "Granular roles, scoped access, magic-link invitations, and a tamper-evident audit log.",
            "yatra",
          )}
        />
        <ModulePrompt />
      </div>
    );
  }

  const tabs: Array<{ key: TeamTab; label: string; icon: any }> = [
    { key: "members", label: __("Members", "yatra"), icon: Users },
    { key: "roles", label: __("Roles", "yatra"), icon: Shield },
    { key: "invitations", label: __("Invitations", "yatra"), icon: Mail },
    { key: "audit", label: __("Audit log", "yatra"), icon: History },
    { key: "settings", label: __("Settings", "yatra"), icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        description={__(
          "Granular roles + capability-based access for multi-staff agencies. Defense-in-depth — every action gated on the server, the UI mirrors via cap-aware controls.",
          "yatra",
        )}
      />

      {/* Persistent banner. Visible on EVERY Team tab so operators     */}
      {/* understand the disable-behavior trade-off no matter which     */}
      {/* surface they're working on. Two variants:                     */}
      {/*   - Toggle ON (permissive, opt-in): info "team keeps access"  */}
      {/*   - Toggle OFF (default, destructive on disable): warning     */}
      {/* The "Go to Settings" button is hidden when the active tab IS  */}
      {/* Settings (operator is already there).                          */}
      {keepAccessOnDisable ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40 p-4 flex flex-wrap items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {__("Your team will keep access if you ever turn off this module", "yatra")}
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200/90 mt-0.5">
              {__(
                "You've opted in to preserve team access when the module is disabled. Turning off Team & Access in Yatra → Modules will pause its advanced features (expiry, scopes, audit log) but your team members keep their roles and current access. You can change this in Settings.",
                "yatra",
              )}
            </p>
          </div>
          {activeTab !== "settings" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => switchTab("settings")}
              className="border-blue-300 text-blue-900 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-100 dark:hover:bg-blue-900"
            >
              {__("Open Settings", "yatra")}
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40 p-4 flex flex-wrap items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">
              {__("Heads up — turning off this module will revoke all team access", "yatra")}
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200/90 mt-0.5">
              {__(
                "This is the default. If you ever disable Team & Access in Yatra → Modules, every Yatra role on your site (Owner, Manager, Sales Agent, plus any custom roles you built) will be removed and your team members will lose all Yatra access. Re-enabling brings back the 8 built-in roles only — custom roles and member assignments don't come back. Switch the setting ON in Settings if you'd rather keep your team's access.",
                "yatra",
              )}
            </p>
          </div>
          {activeTab !== "settings" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => switchTab("settings")}
              className="border-red-300 text-red-900 hover:bg-red-100 dark:border-red-700 dark:text-red-100 dark:hover:bg-red-900"
            >
              {__("Open Settings", "yatra")}
            </Button>
          )}
        </div>
      )}

      <Card>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex flex-wrap gap-1 px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => switchTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                    active
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <CardContent className="p-6">
          {activeTab === "members" && <MembersTab />}
          {activeTab === "roles" && <RolesTab />}
          {activeTab === "invitations" && <InvitationsTab />}
          {activeTab === "audit" && <AuditLogTab />}
          {activeTab === "settings" && <SettingsTab />}
        </CardContent>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Upgrade / module-disabled cards                                           */
/* -------------------------------------------------------------------------- */

const UpgradeCard: React.FC<{ meta: TeamMeta }> = ({ meta }) => (
  <Card className="max-w-3xl">
    <CardHeader>
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
          <Crown className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <CardTitle>{__("Team & Access", "yatra")}</CardTitle>
          <CardDescription className="mt-1">
            {__(
              "Available on the Agency plan. Add staff with role-appropriate access — front desk doesn't see refund history, guides see only their destinations, accountants get financial reports without booking edits.",
              "yatra",
            )}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[
          [
            __("8 shipped roles + custom builder", "yatra"),
            __("Owner, Manager, Sales Agent, Front Desk, Guide, Accountant, Marketing, Auditor.", "yatra"),
          ],
          [
            __("Per-user scope assignment", "yatra"),
            __("Restrict by destination, activity, or trip.", "yatra"),
          ],
          [
            __("Magic-link invitations", "yatra"),
            __("Invite by email — no manual user creation.", "yatra"),
          ],
          [
            __("180-day audit log", "yatra"),
            __("Every sensitive action recorded, exportable to CSV.", "yatra"),
          ],
        ].map(([title, sub]) => (
          <div key={title} className="rounded-md border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {sub}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <Button asChild>
          <a href={meta.upgrade_url} target="_blank" rel="noopener noreferrer">
            {__("Upgrade to Agency", "yatra")}
            <ExternalLink className="ml-1.5 h-4 w-4" />
          </a>
        </Button>
        {meta.docs_url && (
          <Button variant="outline" asChild>
            <a href={meta.docs_url} target="_blank" rel="noopener noreferrer">
              {__("Read the docs", "yatra")}
            </a>
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

const ModulePrompt: React.FC = () => (
  <Card className="max-w-3xl">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-500" />
        {__("Enable the Team & Access module", "yatra")}
      </CardTitle>
      <CardDescription>
        {sprintf(
          /* translators: %s: brand name (e.g. "Yatra" or an operator's white-labeled brand) */
          __(
            'Toggle "Team & Access" on under %s → Modules to start configuring roles and members.',
            "yatra",
          ),
          brandName(),
        )}
      </CardDescription>
    </CardHeader>
  </Card>
);

/* -------------------------------------------------------------------------- */
/*  Time-windowed access helpers                                              */
/*                                                                            */
/*  Operators set an "Access expires on" date on a member. Server stores a    */
/*  unix timestamp; UI uses `<input type="datetime-local"/>` which speaks     */
/*  `YYYY-MM-DDTHH:mm` in LOCAL time. These two helpers bridge formats and   */
/*  always round to the nearest minute (the picker doesn't show seconds).    */
/* -------------------------------------------------------------------------- */

/** Convert a unix-seconds value into the local-input string the picker wants. */
const unixToLocalInputValue = (unixSec: number): string => {
  if (!unixSec || unixSec <= 0) return "";
  const d = new Date(unixSec * 1000);
  // Build YYYY-MM-DDTHH:mm in LOCAL tz — Date constructor reads back the
  // same wall-clock time when the picker submits, which is what operators
  // intend ("expires at 5pm" means 5pm wherever they are).
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
};

/**
 * Members-table cell that renders the access-expiry state. Three states:
 *
 *   - permanent (expires_at === 0)
 *   - expiring soon (1–7 days remaining): amber badge
 *   - expired (timestamp in the past, but cron hasn't swept yet): red badge
 *   - long-future (> 7 days): muted relative text
 */
const AccessExpiryCell: React.FC<{ user: TeamUser }> = ({ user }) => {
  if (!user.expires_at || user.expires_at <= 0) {
    return <span className="text-xs text-gray-400">{__("Permanent", "yatra")}</span>;
  }
  const now = Math.floor(Date.now() / 1000);
  const secondsRemaining = user.expires_at - now;
  const daysRemaining = Math.ceil(secondsRemaining / 86400);
  const formatted = new Date(user.expires_at * 1000).toLocaleString();

  if (secondsRemaining <= 0) {
    return (
      <Tooltip content={formatted}>
        <Badge className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
          {__("Expired", "yatra")}
        </Badge>
      </Tooltip>
    );
  }
  if (daysRemaining <= 7) {
    return (
      <Tooltip content={formatted}>
        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          {sprintf(
            /* translators: %d: number of days */
            __("Expires in %d day(s)", "yatra"),
            daysRemaining,
          )}
        </Badge>
      </Tooltip>
    );
  }
  return (
    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
      {formatted}
    </span>
  );
};

/**
 * Live "current time" caption shown under the expiry datetime-local input.
 *
 * Operators reach for `<input type="datetime-local"/>` without a frame of
 * reference for "now" — the picker doesn't show it, the browser doesn't
 * show it, and timezones vary. We display the local clock + a relative
 * offset for the picked value (e.g. "in 3 days") so they can sanity-check
 * before saving.
 *
 * Ticks once per minute. We don't tick per-second because the picker's
 * resolution is one minute — sub-minute updates are visual noise.
 */
const ExpiryNowHint: React.FC<{ expiresLocal: string }> = ({ expiresLocal }) => {
  const [now, setNow] = useState(() => new Date());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const nowFormatted = now.toLocaleString();

  // Relative offset to the chosen expiry. Empty when nothing picked.
  let relative = "";
  if (expiresLocal) {
    const target = new Date(expiresLocal).getTime();
    const diffMs = target - now.getTime();
    const absMin = Math.abs(Math.round(diffMs / 60_000));
    if (diffMs < 0) {
      relative = __("(in the past)", "yatra");
    } else if (absMin < 60) {
      relative = sprintf(
        /* translators: %d: minutes from now */
        __("in %d min", "yatra"),
        absMin,
      );
    } else if (absMin < 60 * 24) {
      relative = sprintf(
        /* translators: %d: hours from now */
        __("in %d hour(s)", "yatra"),
        Math.round(absMin / 60),
      );
    } else {
      relative = sprintf(
        /* translators: %d: days from now */
        __("in %d day(s)", "yatra"),
        Math.round(absMin / (60 * 24)),
      );
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
      <span>
        {sprintf(
          /* translators: %s: formatted current local datetime */
          __("Current time: %s", "yatra"),
          nowFormatted,
        )}
      </span>
      {relative && (
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {sprintf(
            /* translators: %s: relative offset like "in 3 days" */
            __("Expires %s", "yatra"),
            relative,
          )}
        </span>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Members tab                                                                */
/* -------------------------------------------------------------------------- */

const MembersTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingRemove, setPendingRemove] = useState<TeamUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  /* ----- Bulk-ops selection state -----                                  */
  /* `selectedIds` holds the *checked* user ids. `pendingBulk` holds the   */
  /* confirmation-modal state — null when no modal is open.                */
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [pendingBulk, setPendingBulk] = useState<
    | null
    | {
        action: "change_role" | "remove" | "force_logout";
        roleSlug?: string;
      }
  >(null);

  const { data, isLoading } = useQuery({
    queryKey: ["team-users"],
    queryFn: () => teamApi.listUsers(),
  });
  const { data: rolesData } = useQuery({
    queryKey: ["team-roles"],
    queryFn: () => teamApi.listRoles(),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => teamApi.removeUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      showToast(__("Member removed.", "yatra"), "success");
      setPendingRemove(null);
    },
    onError: (e: any) => {
      showToast(extractError(e), "error");
      setPendingRemove(null);
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: (id: number) => teamApi.forceLogout(id),
    onSuccess: () => showToast(__("All sessions invalidated.", "yatra"), "success"),
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  /* Bulk-ops mutation. Refreshes the member list + clears selection on   */
  /* success. Reports per-id failure count via toast (the response       */
  /* includes per-id results — we surface aggregate here, individual     */
  /* failure rows are visible by re-checking the table).                  */
  const bulkMutation = useMutation({
    mutationFn: (payload: Parameters<typeof teamApi.bulkUsers>[0]) =>
      teamApi.bulkUsers(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      setSelectedIds(new Set());
      setPendingBulk(null);
      if (res.data.fail_count > 0) {
        showToast(
          sprintf(
            /* translators: 1: ok count, 2: fail count */
            __("Bulk done: %1$d succeeded, %2$d failed.", "yatra"),
            res.data.ok_count,
            res.data.fail_count,
          ),
          "warning",
        );
      } else {
        showToast(res.message || __("Bulk action complete.", "yatra"), "success");
      }
    },
    onError: (e: any) => {
      showToast(extractError(e), "error");
      setPendingBulk(null);
    },
  });

  const users = data?.data ?? [];
  /* Toggle row selection. Skips the current user — they can never be the */
  /* target of a destructive bulk op on themselves.                       */
  const currentUserId = window.yatraAdmin?.currentUser;
  const toggleOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    // Select every visible user except the operator themselves —
    // saves them a click and avoids implicit "include yourself" foot-gun.
    const next = new Set<number>();
    users.forEach((u) => {
      if (u.id !== currentUserId) next.add(u.id);
    });
    setSelectedIds(next);
  };
  const roleLabels = useMemo(() => {
    const map: Record<string, string> = {};
    (rolesData?.data ?? []).forEach((r) => {
      map[r.slug] = r.display_name;
    });
    return map;
  }, [rolesData]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {__("Team members", "yatra")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {sprintf(
              /* translators: %s: brand name */
              __(
                "Every WordPress user with a %s role. Add an existing WP user here, or send a magic-link invitation from the Invitations tab.",
                "yatra",
              ),
              brandName(),
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowAddModal(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            {__("Add existing WP user", "yatra")}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            {__("Create new user", "yatra")}
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3">
          <span className="text-sm text-blue-900 dark:text-blue-100 font-medium mr-auto">
            {sprintf(
              /* translators: %d: count of selected rows */
              __("%d member(s) selected", "yatra"),
              selectedIds.size,
            )}
          </span>
          <Select
            aria-label={__("Bulk: change role to", "yatra")}
            defaultValue=""
            onChange={(e) => {
              const role = e.target.value;
              if (!role) return;
              setPendingBulk({ action: "change_role", roleSlug: role });
              // Reset the picker after capturing — modal owns the value now.
              e.target.value = "";
            }}
          >
            <option value="">{__("Change role to…", "yatra")}</option>
            {(rolesData?.data ?? []).map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.display_name}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPendingBulk({ action: "force_logout" })}
            disabled={bulkMutation.isPending}
          >
            <LogOut className="mr-1.5 h-4 w-4" />
            {__("Force logout", "yatra")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setPendingBulk({ action: "remove" })}
            disabled={bulkMutation.isPending}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            {__("Remove", "yatra")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedIds(new Set())}
          >
            {__("Clear", "yatra")}
          </Button>
        </div>
      )}

      <Card className="overflow-visible">
        <CardContent className="p-0 overflow-visible">
          <SharedTable
            data={users}
            selectedItemIds={Array.from(selectedIds)}
            onSelectItem={(id, checked) => toggleOne(Number(id), checked)}
            onSelectAll={toggleAll}
            isAllSelected={
              users.length > 0 &&
              users
                .filter((u) => u.id !== currentUserId)
                .every((u) => selectedIds.has(u.id))
            }
            getItemId={(u: TeamUser) => u.id}
            columns={[
              {
                key: "display_name",
                label: __("Member", "yatra"),
                render: (u: TeamUser) => (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {(u.display_name || u.user_login).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setEditingId(u.id)}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer text-left"
                      >
                        {u.display_name || u.user_login}
                      </button>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-md">
                        {u.email}
                      </div>
                      {u.is_wp_admin && (
                        <Badge className="mt-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px]">
                          <Crown className="w-2.5 h-2.5 mr-1" />
                          {__("WP Admin", "yatra")}
                        </Badge>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: "primary_role",
                label: __("Role", "yatra"),
                render: (u: TeamUser) =>
                  u.primary_role ? (
                    <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {roleLabels[u.primary_role] || u.primary_role}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  ),
              },
              {
                key: "scope",
                label: __("Scope", "yatra"),
                render: (u: TeamUser) =>
                  u.has_scope ? (
                    <Tooltip
                      content={
                        <>
                          {u.scopes.destinations.length > 0 &&
                            `${u.scopes.destinations.length} dest.`}{" "}
                          {u.scopes.activities.length > 0 &&
                            `${u.scopes.activities.length} act.`}{" "}
                          {u.scopes.trips.length > 0 &&
                            `${u.scopes.trips.length} trips`}{" "}
                          {u.scopes.categories.length > 0 &&
                            `${u.scopes.categories.length} cat.`}
                        </>
                      }
                    >
                      <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        {__("Scoped", "yatra")}
                      </Badge>
                    </Tooltip>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {__("Unrestricted", "yatra")}
                    </span>
                  ),
              },
              {
                key: "last_login",
                label: __("Last login", "yatra"),
                render: (u: TeamUser) =>
                  u.last_login ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(u.last_login).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  ),
              },
              {
                key: "expires_at",
                label: __("Access expires", "yatra"),
                render: (u: TeamUser) => <AccessExpiryCell user={u} />,
              },
            ]}
            actions={[
              {
                key: "edit",
                label: __("Edit access", "yatra"),
                icon: <KeyRound className="w-4 h-4" />,
                onClick: (u: TeamUser) => setEditingId(u.id),
              },
              {
                key: "logout",
                label: __("Force logout", "yatra"),
                icon: <LogOut className="w-4 h-4" />,
                onClick: (u: TeamUser) => forceLogoutMutation.mutate(u.id),
              },
              {
                key: "remove",
                label: __("Remove from team", "yatra"),
                icon: <Trash2 className="w-4 h-4" />,
                onClick: (u: TeamUser) => setPendingRemove(u),
                variant: "destructive",
              },
            ]}
            isLoading={isLoading}
            emptyText={__("No team members yet", "yatra")}
            emptyDescription={__(
              "Invite a teammate from the Invitations tab to get started.",
              "yatra",
            )}
          />
        </CardContent>
      </Card>

      {editingId !== null && (
        <MemberEditDrawer
          userId={editingId}
          onClose={() => setEditingId(null)}
        />
      )}

      {showAddModal && (
        <AddMemberModal onClose={() => setShowAddModal(false)} />
      )}

      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} />
      )}

      <ConfirmationDialog
        isOpen={pendingRemove !== null}
        onClose={() => !removeMutation.isPending && setPendingRemove(null)}
        onConfirm={() => pendingRemove && removeMutation.mutate(pendingRemove.id)}
        title={sprintf(
          /* translators: %s: brand name */
          __("Remove member from %s?", "yatra"),
          brandName(),
        )}
        description={
          pendingRemove
            ? sprintf(
                /* translators: 1: brand name, 2: member display name, 3: brand name */
                __(
                  'This strips %1$s role + caps + scopes from "%2$s". Their WordPress user is preserved (they keep any non-%3$s access on this site).',
                  "yatra",
                ),
                brandName(),
                pendingRemove.display_name,
                brandName(),
              )
            : ""
        }
        confirmText={__("Remove access", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={removeMutation.isPending}
      />

      {/* Bulk confirmation dialog. Copy varies by action; the operator   */}
      {/* always sees the affected count + a destructive-style warning   */}
      {/* when the action removes access or invalidates sessions.        */}
      <ConfirmationDialog
        isOpen={pendingBulk !== null}
        onClose={() => !bulkMutation.isPending && setPendingBulk(null)}
        onConfirm={() => {
          if (!pendingBulk) return;
          const ids = Array.from(selectedIds);
          if (pendingBulk.action === "change_role") {
            bulkMutation.mutate({
              action: "change_role",
              user_ids: ids,
              role_slug: pendingBulk.roleSlug,
            });
          } else if (pendingBulk.action === "remove") {
            bulkMutation.mutate({ action: "remove", user_ids: ids });
          } else if (pendingBulk.action === "force_logout") {
            bulkMutation.mutate({ action: "force_logout", user_ids: ids });
          }
        }}
        title={(() => {
          if (!pendingBulk) return "";
          if (pendingBulk.action === "change_role") {
            return sprintf(
              /* translators: %d: count */
              __("Change role on %d member(s)?", "yatra"),
              selectedIds.size,
            );
          }
          if (pendingBulk.action === "remove") {
            return sprintf(
              /* translators: %d: count */
              __("Remove %d member(s) from the team?", "yatra"),
              selectedIds.size,
            );
          }
          return sprintf(
            /* translators: %d: count */
            __("Force logout on %d member(s)?", "yatra"),
            selectedIds.size,
          );
        })()}
        description={(() => {
          if (!pendingBulk) return "";
          if (pendingBulk.action === "change_role") {
            const roleLabel =
              (rolesData?.data ?? []).find(
                (r) => r.slug === pendingBulk.roleSlug,
              )?.display_name ?? pendingBulk.roleSlug;
            return sprintf(
              /* translators: 1: role label, 2: count */
              __(
                'Sets the role to "%1$s" on %2$d member(s). Existing per-user grants and scopes are preserved. The last team administrator cannot be demoted — failures are reported per-id.',
                "yatra",
              ),
              roleLabel ?? "",
              selectedIds.size,
            );
          }
          if (pendingBulk.action === "remove") {
            return __(
              "Strips role + caps + scopes from each selected member. Their WordPress user accounts stay. Last-team-admin is protected — that row will report as failed.",
              "yatra",
            );
          }
          return __(
            "Invalidates every active session for the selected members. They will be logged out everywhere and need to re-authenticate.",
            "yatra",
          );
        })()}
        confirmText={
          pendingBulk?.action === "change_role"
            ? __("Apply role", "yatra")
            : pendingBulk?.action === "remove"
              ? __("Remove access", "yatra")
              : __("Force logout", "yatra")
        }
        cancelText={__("Cancel", "yatra")}
        variant={pendingBulk?.action === "remove" ? "danger" : "default"}
        isLoading={bulkMutation.isPending}
      />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Add Member modal — attaches a Yatra role to an existing WP user.           */
/*                                                                             */
/*  This is intentionally NOT the same as "Invite by email" (Invitations tab) */
/*  — invitations create a brand-new WP user account. This flow is for users  */
/*  who already exist on the WP site but don't yet have Yatra access.          */
/* -------------------------------------------------------------------------- */

const AddMemberModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchQ, setSearchQ] = useState("");
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [roleSlug, setRoleSlug] = useState("yatra_sales_agent");

  // Debounced search — only refetch when the user pauses typing.
  const [debouncedQ, setDebouncedQ] = useState("");
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchQ), 250);
    return () => window.clearTimeout(t);
  }, [searchQ]);

  const { data: candidatesData, isLoading: candidatesLoading } = useQuery({
    queryKey: ["team-users-available", debouncedQ],
    queryFn: () => teamApi.listAvailableUsers(debouncedQ, 50),
  });
  const { data: rolesData } = useQuery({
    queryKey: ["team-roles"],
    queryFn: () => teamApi.listRoles(),
  });

  const candidates = candidatesData?.data ?? [];

  const addMutation = useMutation({
    mutationFn: () => teamApi.updateUser(pickedId!, { role_slug: roleSlug }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      queryClient.invalidateQueries({ queryKey: ["team-users-available"] });
      showToast(__("Member added to the team.", "yatra"), "success");
      onClose();
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-500" />
          {__("Add existing WordPress user", "yatra")}
        </div>
      }
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {__("Cancel", "yatra")}
          </Button>
          <Button
            disabled={pickedId === null || addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            {addMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                {__("Adding…", "yatra")}
              </>
            ) : (
              __("Add to team", "yatra")
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Alert variant="info" title={__("Looking for someone new?", "yatra")}>
          {sprintf(
            /* translators: %s: brand name */
            __(
              "This picker shows WordPress users who don't yet have a %s role. For people who aren't on the site at all, send them an email invitation from the Invitations tab — that creates the WP user for them.",
              "yatra",
            ),
            brandName(),
          )}
        </Alert>

        <div>
          <Label htmlFor="add-member-search">
            {__("Find a user", "yatra")}
          </Label>
          <Input
            id="add-member-search"
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value);
              setPickedId(null);
            }}
            placeholder={__("Search by name, email, or login…", "yatra")}
            className="mt-1"
          />
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-md max-h-72 overflow-y-auto">
          {candidatesLoading ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
                  <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-2/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-8 px-4 text-sm text-gray-500 dark:text-gray-400">
              {debouncedQ === ""
                ? sprintf(
                    /* translators: %s: brand name */
                    __(
                      "No available users — every WP user on this site is already a %s team member. Use the Invitations tab to add new people.",
                      "yatra",
                    ),
                    brandName(),
                  )
                : __("No matching users.", "yatra")}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {candidates.map((u) => (
                <label
                  key={u.id}
                  htmlFor={`pick-${u.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                    pickedId === u.id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <input
                    id={`pick-${u.id}`}
                    type="radio"
                    name="add-member-pick"
                    checked={pickedId === u.id}
                    onChange={() => setPickedId(u.id)}
                    className="h-4 w-4 flex-shrink-0"
                  />
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {(u.display_name || u.login).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {u.display_name || u.login}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {u.email}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="add-member-role">
            {sprintf(
              /* translators: %s: brand name */
              __("%s role", "yatra"),
              brandName(),
            )}
          </Label>
          <Select
            id="add-member-role"
            value={roleSlug}
            onChange={(e) => setRoleSlug(e.target.value)}
            className="mt-1"
          >
            {(rolesData?.data ?? []).map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.display_name} ({r.capability_count}{" "}
                {__("caps", "yatra")})
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {__(
              "Per-user scopes + capability overrides can be set after the member is added (3-dot menu → Edit access).",
              "yatra",
            )}
          </p>
        </div>
      </div>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/*  Create User modal — provisions a brand-new WP user + Yatra role in one go */
/*                                                                            */
/*  Sister flow to AddMemberModal (which attaches a role to an existing WP    */
/*  user) and InvitationsTab (which sends a magic-link email). This one is    */
/*  for operators who want to create the account directly — e.g. internal    */
/*  staff, contractors with no inbox we need to involve, batch onboarding.    */
/*                                                                            */
/*  Password handling: operator chooses between "I'll set it now" (8+ chars)  */
/*  and "Send reset-password email" (recommended — operator never types/      */
/*  shares the password). The latter triggers `wp_mail` reset flow.          */
/* -------------------------------------------------------------------------- */

const CreateUserModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: rolesData } = useQuery({
    queryKey: ["team-roles"],
    queryFn: () => teamApi.listRoles(),
  });

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [roleSlug, setRoleSlug] = useState("");
  type PwMode = "reset_email" | "manual";
  const [pwMode, setPwMode] = useState<PwMode>("reset_email");
  const [password, setPassword] = useState("");

  // Email validation — RFC-flavored, good enough for UI. Server is the
  // source of truth (wp's `is_email`).
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordOk = pwMode === "reset_email" || password.length >= 8;
  const canSubmit = emailValid && roleSlug !== "" && passwordOk;

  const createMutation = useMutation({
    mutationFn: () =>
      teamApi.createUser({
        email,
        role_slug: roleSlug,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        username: username || undefined,
        password: pwMode === "manual" ? password : undefined,
        send_reset_email: pwMode === "reset_email",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      showToast(__("User created and added to the team.", "yatra"), "success");
      onClose();
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-500" />
          {__("Create new user", "yatra")}
        </div>
      }
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {__("Cancel", "yatra")}
          </Button>
          <Button
            disabled={!canSubmit || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                {__("Creating…", "yatra")}
              </>
            ) : (
              __("Create user", "yatra")
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Alert variant="info" title={__("Creates a new WordPress user", "yatra")}>
          {sprintf(
            /* translators: %s: brand name */
            __(
              "This provisions a brand-new WP account and attaches the chosen %s role in one step. For people who already have a WP user, use \"Add existing WP user\" instead. To send a magic-link invite via email (account is created on accept), use the Invitations tab.",
              "yatra",
            ),
            brandName(),
          )}
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cu-first">{__("First name", "yatra")}</Label>
            <Input
              id="cu-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="cu-last">{__("Last name", "yatra")}</Label>
            <Input
              id="cu-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="cu-email">{__("Email", "yatra")}</Label>
          <Input
            id="cu-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="mt-1"
            required
          />
          {email !== "" && !emailValid && (
            <p className="text-xs text-red-600 mt-1">
              {__("Enter a valid email address.", "yatra")}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="cu-username">{__("Username (optional)", "yatra")}</Label>
          <Input
            id="cu-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={__("Auto-generated from email", "yatra")}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {__(
              "WP requires unique, lowercase, no spaces. If left blank, derived from the email local-part.",
              "yatra",
            )}
          </p>
        </div>

        <div>
          <Label htmlFor="cu-role">
            {sprintf(
              /* translators: %s: brand name */
              __("%s role", "yatra"),
              brandName(),
            )}
          </Label>
          <Select
            id="cu-role"
            value={roleSlug}
            onChange={(e) => setRoleSlug(e.target.value)}
            className="mt-1"
          >
            <option value="">{__("Select a role…", "yatra")}</option>
            {(rolesData?.data ?? []).map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.display_name} ({r.capability_count} {__("caps", "yatra")})
              </option>
            ))}
          </Select>
        </div>

        <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3">
          <Label className="text-sm font-medium">{__("Password", "yatra")}</Label>
          <div className="mt-2 space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="cu-pw-mode"
                checked={pwMode === "reset_email"}
                onChange={() => setPwMode("reset_email")}
                className="mt-0.5"
              />
              <div className="text-sm">
                <div className="font-medium text-gray-900 dark:text-white">
                  {__("Send reset-password email (recommended)", "yatra")}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {__(
                    "User receives a standard WP password-reset link. You never see or type their password — strongest security posture.",
                    "yatra",
                  )}
                </div>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="cu-pw-mode"
                checked={pwMode === "manual"}
                onChange={() => setPwMode("manual")}
                className="mt-0.5"
              />
              <div className="text-sm flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {__("Set a password now", "yatra")}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {__(
                    "You'll need to share this password with the user out-of-band (DM, in person). 8 character minimum.",
                    "yatra",
                  )}
                </div>
                {pwMode === "manual" && (
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={__("At least 8 characters", "yatra")}
                    className="w-full"
                  />
                )}
              </div>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/*  Member edit drawer — role + scopes + per-user caps + sessions             */
/* -------------------------------------------------------------------------- */

const MemberEditDrawer: React.FC<{
  userId: number;
  onClose: () => void;
}> = ({ userId, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["team-user", userId],
    queryFn: () => teamApi.getUser(userId),
  });
  const { data: rolesData } = useQuery({
    queryKey: ["team-roles"],
    queryFn: () => teamApi.listRoles(),
  });
  const { data: capsData } = useQuery({
    queryKey: ["team-capabilities"],
    queryFn: () => teamApi.listCapabilities(),
  });

  const user = data?.data;
  const [roleSlug, setRoleSlug] = useState<string>("");
  const [extraGrants, setExtraGrants] = useState<string[]>([]);
  const [extraRevokes, setExtraRevokes] = useState<string[]>([]);
  // Time-windowed access. Stored as `YYYY-MM-DDTHH:mm` for <input type="datetime-local"/>.
  // Empty string means "permanent" — the mutation omits the field when empty
  // OR sends 0 when the user explicitly clicks "Clear expiry".
  const [expiresLocal, setExpiresLocal] = useState<string>("");
  // True when the user touched the expiry field this session — only then
  // do we send `expires_at` to the server. Lets us distinguish "operator
  // didn't touch this" from "operator explicitly cleared it".
  const [expiryDirty, setExpiryDirty] = useState(false);

  React.useEffect(() => {
    if (user) {
      setRoleSlug(user.primary_role || "");
      setExtraGrants(user.caps_grant);
      setExtraRevokes(user.caps_revoke);
      setExpiresLocal(unixToLocalInputValue(user.expires_at));
      setExpiryDirty(false);
    }
  }, [user]);

  const isSelfEdit = user?.id === window.yatraAdmin?.currentUser;

  const updateMutation = useMutation({
    mutationFn: () => {
      const payload: TeamUserWritePayload = {
        role_slug: roleSlug,
        caps_grant: extraGrants,
        caps_revoke: extraRevokes,
      };
      if (expiryDirty) {
        // Send 0 when cleared (= permanent), otherwise unix seconds.
        payload.expires_at = expiresLocal
          ? Math.floor(new Date(expiresLocal).getTime() / 1000)
          : 0;
      }
      return teamApi.updateUser(userId, payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      queryClient.invalidateQueries({ queryKey: ["team-user", userId] });
      // If the operator edited their OWN account, refresh the
      // current-user cap cache so the UI updates without reload.
      if (res.data?.id === (window.yatraAdmin?.userCaps ? userId : -1)) {
        setUserCaps(res.data.effective_caps);
      }
      showToast(__("Member updated.", "yatra"), "success");
      onClose();
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-500" />
          {user ? user.display_name : __("Loading…", "yatra")}
        </div>
      }
      size="lg"
      hideFooter={false}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {user?.is_wp_admin ? __("Close", "yatra") : __("Cancel", "yatra")}
          </Button>
          {/* Hide Save when the target is a WP admin — nothing to     */}
          {/* persist (role / caps / scopes / expiry are all no-ops    */}
          {/* against the admin fallback and the server would 409).    */}
          {!user?.is_wp_admin && (
          <Button
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                {__("Saving…", "yatra")}
              </>
            ) : (
              __("Save changes", "yatra")
            )}
          </Button>
          )}
        </div>
      }
    >
      {isLoading || !user ? (
        <div className="space-y-4">
          {/* Skeleton mirroring the loaded drawer layout: role select,    */}
          {/* expiry box, cap matrix groups. Same heights as the real form */}
          {/* so the modal doesn't jump on data arrival.                   */}
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {user.is_wp_admin ? (
            // Admin-lock UI. WP administrators always pass every yatra_*
            // cap via the server-side admin fallback, so role / grant /
            // revoke / scope / expiry assignments against them would be
            // misleading no-ops. We show a read-only summary instead of
            // editable form controls, and the server rejects any write
            // attempts with `yatra_team_admin_locked` (409) as a defense-
            // in-depth check.
            <Alert variant="info" title={__("WordPress administrator", "yatra")}>
              <p className="text-sm">
                {sprintf(
                  /* translators: %s: brand name */
                  __(
                    "This user is a WP administrator and always passes every %s capability check via the admin fallback. Role assignment, capability grants, revokes, scope restrictions, and access expiry cannot be enforced on them.",
                    "yatra",
                  ),
                  brandName(),
                )}
              </p>
              <p className="text-sm mt-2">
                {__(
                  "To scope this user's Yatra access, first remove their WordPress administrator role from the standard wp-admin Users screen, then return here to assign a Yatra role.",
                  "yatra",
                )}
              </p>
              {/* Read-only summary of what they DO have — useful for      */}
              {/* audit / "why does this person see X" conversations.       */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                    {__("Effective capabilities", "yatra")}
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {sprintf(
                      /* translators: %d: count of caps */
                      __("%d (all yatra_*)", "yatra"),
                      user.effective_caps.length,
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                    {__("Yatra role on record", "yatra")}
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {user.primary_role
                      ? roleSlug || user.primary_role
                      : __("None (admin fallback only)", "yatra")}
                  </div>
                </div>
              </div>
            </Alert>
          ) : (
            <>
          <div>
            <Label>
              {sprintf(
                /* translators: %s: brand name */
                __("%s role", "yatra"),
                brandName(),
              )}
            </Label>
            <Select
              value={roleSlug}
              onChange={(e) => setRoleSlug(e.target.value)}
              className="mt-1"
              aria-label={__("Role", "yatra")}
            >
              <option value="">
                {sprintf(
                  /* translators: %s: brand name */
                  __("No %s role", "yatra"),
                  brandName(),
                )}
              </option>
              {(rolesData?.data ?? []).map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.display_name} ({r.capability_count}{" "}
                  {__("caps", "yatra")})
                </option>
              ))}
            </Select>
          </div>

          {/* Time-windowed access. Hidden when:                              */
          /*   - operator is editing themselves (server blocks self-expiry)   */
          /*   - target is a WP admin (admin fallback makes expiry a no-op)   */}
          {!isSelfEdit && !user.is_wp_admin && (
            <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label htmlFor="member-expires-at" className="text-sm font-medium">
                    {__("Access expires on (optional)", "yatra")}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__(
                      "Time-windowed access: caps are revoked automatically once this passes. Useful for contractors, seasonal staff, or temporary vendor access. Leave blank for permanent access.",
                      "yatra",
                    )}
                  </p>
                </div>
                {expiresLocal && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setExpiresLocal("");
                      setExpiryDirty(true);
                    }}
                  >
                    {__("Clear expiry", "yatra")}
                  </Button>
                )}
              </div>
              <Input
                id="member-expires-at"
                type="datetime-local"
                value={expiresLocal}
                min={unixToLocalInputValue(Math.floor(Date.now() / 1000) + 60)}
                onChange={(e) => {
                  setExpiresLocal(e.target.value);
                  setExpiryDirty(true);
                }}
                className="w-full"
              />
              <ExpiryNowHint expiresLocal={expiresLocal} />
              {user.is_expired && (
                <Alert variant="warning" title={__("Access has already expired", "yatra")}>
                  {__(
                    "This member is past their expiry and currently has no access. The next hourly sweep will fully strip their role + grants. Set a new date above to extend access — or clear the expiry to make it permanent.",
                    "yatra",
                  )}
                </Alert>
              )}
            </div>
          )}

          {capsData && (
            <CapabilityOverridesEditor
              registry={capsData.capabilities}
              effective={user.effective_caps}
              grants={extraGrants}
              revokes={extraRevokes}
              onChangeGrants={setExtraGrants}
              onChangeRevokes={setExtraRevokes}
            />
          )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

const CapabilityOverridesEditor: React.FC<{
  registry: Record<string, CapabilityDef>;
  effective: string[];
  grants: string[];
  revokes: string[];
  onChangeGrants: (next: string[]) => void;
  onChangeRevokes: (next: string[]) => void;
}> = ({ registry, effective, grants, revokes, onChangeGrants, onChangeRevokes }) => {
  const byCategory = useMemo(() => {
    const map: Record<string, Array<[string, CapabilityDef]>> = {};
    Object.entries(registry).forEach(([cap, def]) => {
      if (!map[def.category]) map[def.category] = [];
      map[def.category].push([cap, def]);
    });
    return map;
  }, [registry]);

  const sensColor = (s: string): string => {
    if (s === "critical") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    if (s === "high") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    if (s === "medium") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  return (
    <div>
      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
        {__("Per-user capability overrides", "yatra")}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {__(
          "Override the role's defaults for THIS user. Grants extend access; revokes deny even when the role allows.",
          "yatra",
        )}
      </p>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1 border border-gray-200 dark:border-gray-700 rounded-md p-2">
        {Object.entries(byCategory).map(([cat, rows]) => (
          <div key={cat}>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-1 py-1">
              {cat}
            </div>
            {rows.map(([cap, def]) => {
              const isEffective = effective.includes(cap);
              const isGranted = grants.includes(cap);
              const isRevoked = revokes.includes(cap);
              return (
                <div
                  key={cap}
                  className="flex items-center justify-between gap-3 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {def.label}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sensColor(def.sensitivity)}`}>
                        {def.sensitivity}
                      </span>
                    </div>
                    <code className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                      {cap}
                    </code>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isEffective && !isGranted && !isRevoked && (
                      <Badge className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-[10px]">
                        {__("via role", "yatra")}
                      </Badge>
                    )}
                    <Tooltip content={__("Grant this cap on top of the role", "yatra")}>
                      <button
                        type="button"
                        onClick={() => {
                          if (isGranted) {
                            onChangeGrants(grants.filter((c) => c !== cap));
                          } else {
                            onChangeGrants([...grants, cap]);
                            onChangeRevokes(revokes.filter((c) => c !== cap));
                          }
                        }}
                        className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                          isGranted
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                        }`}
                      >
                        {__("Grant", "yatra")}
                      </button>
                    </Tooltip>
                    <Tooltip content={__("Deny this cap even if the role allows", "yatra")}>
                      <button
                        type="button"
                        onClick={() => {
                          if (isRevoked) {
                            onChangeRevokes(revokes.filter((c) => c !== cap));
                          } else {
                            onChangeRevokes([...revokes, cap]);
                            onChangeGrants(grants.filter((c) => c !== cap));
                          }
                        }}
                        className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                          isRevoked
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                        }`}
                      >
                        {__("Revoke", "yatra")}
                      </button>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Roles tab                                                                  */
/* -------------------------------------------------------------------------- */

const RolesTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editingRoleSlug, setEditingRoleSlug] = useState<string | null>(null);
  // "new" sentinel = create-flow with empty bundle.
  // "clone:<slug>" sentinel = create-flow seeded with that role's caps.
  const [createSeed, setCreateSeed] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TeamRole | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["team-roles"],
    queryFn: () => teamApi.listRoles(),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => teamApi.deleteRole(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-roles"] });
      showToast(__("Role deleted.", "yatra"), "success");
      setPendingDelete(null);
    },
    onError: (e: any) => {
      showToast(extractError(e), "error");
      setPendingDelete(null);
    },
  });

  const roles = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {__("Roles", "yatra")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {__(
              "Eight shipped system roles cover most agencies. Click any role to see + edit its capabilities. Clone or create your own with the buttons here.",
              "yatra",
            )}
          </p>
        </div>
        <Button onClick={() => setCreateSeed("new")}>
          <Shield className="mr-1.5 h-4 w-4" />
          {__("Create custom role", "yatra")}
        </Button>
      </div>

      <Card className="overflow-visible">
        <CardContent className="p-0 overflow-visible">
          <SharedTable
            data={roles}
            columns={[
              {
                key: "display_name",
                label: __("Role", "yatra"),
                render: (r: TeamRole) => (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setEditingRoleSlug(r.slug)}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer text-left"
                      >
                        {r.display_name}
                      </button>
                      <div>
                        <code className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {r.slug}
                        </code>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: "is_system",
                label: __("Type", "yatra"),
                render: (r: TeamRole) =>
                  r.is_system ? (
                    <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {__("System", "yatra")}
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {__("Custom", "yatra")}
                    </Badge>
                  ),
              },
              {
                key: "capability_count",
                label: __("Capabilities", "yatra"),
                render: (r: TeamRole) => (
                  <Badge
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => setEditingRoleSlug(r.slug)}
                  >
                    {r.capability_count} {__("caps", "yatra")}
                  </Badge>
                ),
              },
              {
                key: "member_count",
                label: __("Members", "yatra"),
                render: (r: TeamRole) => (
                  <Badge variant="outline">
                    {r.member_count}
                  </Badge>
                ),
              },
            ]}
            actions={[
              {
                key: "edit",
                label: __("View capabilities", "yatra"),
                icon: <KeyRound className="w-4 h-4" />,
                onClick: (r: TeamRole) => setEditingRoleSlug(r.slug),
              },
              {
                key: "clone",
                label: __("Clone to custom role", "yatra"),
                icon: <Copy className="w-4 h-4" />,
                onClick: (r: TeamRole) => setCreateSeed(`clone:${r.slug}`),
              },
              {
                key: "delete",
                label: __("Delete role", "yatra"),
                icon: <Trash2 className="w-4 h-4" />,
                onClick: (r: TeamRole) => setPendingDelete(r),
                condition: (r: TeamRole) => !r.is_system,
                variant: "destructive",
              },
            ]}
            isLoading={isLoading}
            emptyText={__("No roles found", "yatra")}
            emptyDescription={__(
              "System roles should have populated automatically. Try toggling the module off and on.",
              "yatra",
            )}
          />
        </CardContent>
      </Card>

      {editingRoleSlug !== null && (
        <RoleEditDrawer
          slug={editingRoleSlug}
          onClose={() => setEditingRoleSlug(null)}
          onClone={(slug) => {
            setEditingRoleSlug(null);
            setCreateSeed(`clone:${slug}`);
          }}
        />
      )}

      {createSeed !== null && (
        <RoleCreateDrawer
          seedSlug={createSeed.startsWith("clone:") ? createSeed.slice(6) : null}
          onClose={() => setCreateSeed(null)}
        />
      )}

      <ConfirmationDialog
        isOpen={pendingDelete !== null}
        onClose={() => !deleteMutation.isPending && setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.slug)}
        title={__("Delete custom role?", "yatra")}
        description={
          pendingDelete
            ? __(
                'Members assigned to "{name}" will lose this role. Their WordPress user account is preserved.',
                "yatra",
              ).replace("{name}", pendingDelete.display_name)
            : ""
        }
        confirmText={__("Delete role", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Role edit drawer — shows every capability the role has, grouped by        */
/*  category with sensitivity badges. System roles render read-only with a    */
/*  "Clone to edit" button; custom roles get an editable matrix + save.       */
/* -------------------------------------------------------------------------- */

const RoleEditDrawer: React.FC<{
  slug: string;
  onClose: () => void;
  onClone: (slug: string) => void;
}> = ({ slug, onClose, onClone }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["team-role", slug],
    queryFn: () => teamApi.getRole(slug),
  });
  const { data: capsData } = useQuery({
    queryKey: ["team-capabilities"],
    queryFn: () => teamApi.listCapabilities(),
  });

  const role = data?.data;
  const [displayName, setDisplayName] = useState("");
  const [selectedCaps, setSelectedCaps] = useState<string[]>([]);

  React.useEffect(() => {
    if (role) {
      setDisplayName(role.display_name);
      setSelectedCaps(role.capabilities);
    }
  }, [role]);

  const updateMutation = useMutation({
    mutationFn: () =>
      teamApi.updateRole(slug, {
        display_name: displayName,
        capabilities: selectedCaps,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-roles"] });
      queryClient.invalidateQueries({ queryKey: ["team-role", slug] });
      showToast(__("Role updated.", "yatra"), "success");
      onClose();
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const isSystem = role?.is_system ?? false;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          {role ? role.display_name : __("Loading…", "yatra")}
          {isSystem && (
            <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ml-2">
              {__("System role", "yatra")}
            </Badge>
          )}
        </div>
      }
      size="lg"
      hideFooter={false}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {__("Close", "yatra")}
          </Button>
          {isSystem ? (
            <Button onClick={() => onClone(slug)}>
              <Copy className="mr-1.5 h-4 w-4" />
              {__("Clone to edit", "yatra")}
            </Button>
          ) : (
            <Button
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  {__("Saving…", "yatra")}
                </>
              ) : (
                __("Save changes", "yatra")
              )}
            </Button>
          )}
        </div>
      }
    >
      {isLoading || !role ? (
        <div className="space-y-4">
          {/* Skeleton mirrors the loaded role-edit form: name input + */}
          {/* category-grouped cap matrix. Same shape so the dialog    */}
          {/* doesn't reflow when data arrives.                        */}
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                <Skeleton className="h-4 w-28" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {isSystem && (
            <Alert variant="info" title={__("System role", "yatra")}>
              {sprintf(
                /* translators: 1: brand name, 2: brand name */
                __(
                  "System roles ship with %1$s and can't be edited directly — clone to a custom role to change capabilities. This protects your team if %2$s ships new capabilities in future releases (clones won't auto-update; system roles will).",
                  "yatra",
                ),
                brandName(),
                brandName(),
              )}
            </Alert>
          )}

          <div>
            <Label htmlFor="role-display-name">
              {__("Role name", "yatra")}
            </Label>
            <Input
              id="role-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isSystem}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <code className="font-mono">{role.slug}</code>{" "}
              · {role.member_count}{" "}
              {role.member_count === 1
                ? __("member", "yatra")
                : __("members", "yatra")}
            </p>
          </div>

          {capsData && (
            <CapabilityMatrix
              registry={capsData.capabilities}
              selected={selectedCaps}
              onChange={setSelectedCaps}
              disabled={isSystem}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/*  Role create drawer — same UX as edit but starts from an empty bundle      */
/*  (or seeded from a system role when the operator clicked "Clone").         */
/* -------------------------------------------------------------------------- */

const RoleCreateDrawer: React.FC<{
  seedSlug: string | null;
  onClose: () => void;
}> = ({ seedSlug, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: seedData } = useQuery({
    queryKey: ["team-role", seedSlug],
    queryFn: () => teamApi.getRole(seedSlug!),
    enabled: seedSlug !== null,
  });
  const { data: capsData } = useQuery({
    queryKey: ["team-capabilities"],
    queryFn: () => teamApi.listCapabilities(),
  });
  // Server-curated role templates — fetched once. Empty when there
  // are no templates configured (e.g. an operator-side filter wiped
  // the list).
  const { data: templatesData } = useQuery({
    queryKey: ["team-role-templates"],
    queryFn: () => teamApi.listRoleTemplates(),
    enabled: seedSlug === null, // only show templates for fresh creation
  });

  const [displayName, setDisplayName] = useState("");
  const [selectedCaps, setSelectedCaps] = useState<string[]>([]);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  React.useEffect(() => {
    if (seedData?.data) {
      setDisplayName(`${seedData.data.display_name} (copy)`);
      setSelectedCaps(seedData.data.capabilities);
    }
  }, [seedData]);

  /**
   * Apply a template. Sets the cap list to the template's caps + always
   * appends the umbrella `yatra_access_admin` so the role can see the
   * Yatra menu (otherwise the role is functionally useless on day 1).
   * Name stays as whatever the operator typed — they likely picked the
   * template AFTER typing.
   */
  const applyTemplate = (templateId: string) => {
    const tpl = (templatesData?.data ?? []).find((t) => t.id === templateId);
    if (!tpl) return;
    const caps = Array.from(new Set([...tpl.capabilities, "yatra_access_admin"]));
    setSelectedCaps(caps);
    setAppliedTemplateId(templateId);
    if (displayName.trim() === "") {
      setDisplayName(tpl.label);
    }
  };

  const createMutation = useMutation({
    mutationFn: () =>
      teamApi.createRole({
        display_name: displayName,
        capabilities: selectedCaps,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-roles"] });
      showToast(__("Custom role created.", "yatra"), "success");
      onClose();
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const canSave = displayName.trim() !== "" && !createMutation.isPending;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          {seedSlug
            ? __("Clone role", "yatra")
            : __("Create custom role", "yatra")}
        </div>
      }
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {__("Cancel", "yatra")}
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                {__("Creating…", "yatra")}
              </>
            ) : (
              __("Create role", "yatra")
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="new-role-name">{__("Role name", "yatra")}</Label>
          <Input
            id="new-role-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={__("e.g. Senior Sales Agent", "yatra")}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {__(
              "Slug auto-generated from the name (yatra_* prefix added).",
              "yatra",
            )}
          </p>
        </div>

        {/* Template picker — only when creating fresh (clone path skips it). */}
        {seedSlug === null && (templatesData?.data?.length ?? 0) > 0 && (
          <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label className="text-sm font-medium">
                  {__("Start from a template (optional)", "yatra")}
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {__(
                    "Pre-curated cap bundles for common archetypes. Picking one prefills the matrix below — fully editable before save.",
                    "yatra",
                  )}
                </p>
              </div>
              {appliedTemplateId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCaps([]);
                    setAppliedTemplateId(null);
                  }}
                >
                  {__("Clear", "yatra")}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(templatesData?.data ?? []).map((tpl) => {
                const active = appliedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl.id)}
                    className={`text-left rounded-md border p-3 transition-colors ${
                      active
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:bg-blue-900/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {tpl.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        {tpl.capabilities.length} {__("caps", "yatra")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {tpl.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {capsData && (
          <CapabilityMatrix
            registry={capsData.capabilities}
            selected={selectedCaps}
            onChange={setSelectedCaps}
            disabled={false}
          />
        )}
      </div>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/*  Capability matrix — categorized checklist of every Yatra cap.             */
/*  Reused by RoleEditDrawer + RoleCreateDrawer. Read-only when `disabled`.   */
/* -------------------------------------------------------------------------- */

const CapabilityMatrix: React.FC<{
  registry: Record<string, CapabilityDef>;
  selected: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
}> = ({ registry, selected, onChange, disabled }) => {
  const byCategory = useMemo(() => {
    const map: Record<string, Array<[string, CapabilityDef]>> = {};
    Object.entries(registry).forEach(([cap, def]) => {
      if (!map[def.category]) map[def.category] = [];
      map[def.category].push([cap, def]);
    });
    return map;
  }, [registry]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const sensColor = (s: string): string => {
    if (s === "critical")
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    if (s === "high")
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    if (s === "medium")
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  const toggleCap = (cap: string) => {
    if (disabled) return;
    if (selectedSet.has(cap)) {
      onChange(selected.filter((c) => c !== cap));
    } else {
      onChange([...selected, cap]);
    }
  };

  const toggleCategory = (caps: Array<[string, CapabilityDef]>) => {
    if (disabled) return;
    const ids = caps.map(([c]) => c);
    const allSelected = ids.every((id) => selectedSet.has(id));
    if (allSelected) {
      onChange(selected.filter((c) => !ids.includes(c)));
    } else {
      const next = new Set(selected);
      ids.forEach((c) => next.add(c));
      onChange(Array.from(next));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {__("Capabilities", "yatra")}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {disabled
              ? __(
                  "Read-only — system roles can't be edited. Use Clone to make an editable copy.",
                  "yatra",
                )
              : __(
                  "Each capability gates a specific action. Sensitivity drives audit-log defaults.",
                  "yatra",
                )}
          </p>
        </div>
        <Badge variant="outline">
          {selected.length} / {Object.keys(registry).length}
        </Badge>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1 border border-gray-200 dark:border-gray-700 rounded-md p-2">
        {Object.entries(byCategory).map(([category, rows]) => {
          const ids = rows.map(([c]) => c);
          const checked = ids.filter((c) => selectedSet.has(c)).length;
          const allChecked = checked === ids.length;
          return (
            <div key={category}>
              <div className="flex items-center justify-between gap-2 px-1 py-1 sticky top-0 bg-white dark:bg-gray-900 z-10">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {category}{" "}
                  <span className="font-normal text-gray-400">
                    ({checked}/{ids.length})
                  </span>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => toggleCategory(rows)}
                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {allChecked
                      ? __("Clear all", "yatra")
                      : __("Select all", "yatra")}
                  </button>
                )}
              </div>
              {rows.map(([cap, def]) => {
                const isChecked = selectedSet.has(cap);
                return (
                  <label
                    key={cap}
                    htmlFor={`cap-${cap}`}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded transition-colors ${
                      disabled
                        ? "cursor-default"
                        : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    } ${
                      isChecked
                        ? "bg-blue-50/40 dark:bg-blue-900/10"
                        : ""
                    }`}
                  >
                    <input
                      id={`cap-${cap}`}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCap(cap)}
                      disabled={disabled}
                      className="h-4 w-4 rounded border-gray-300 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {def.label}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sensColor(def.sensitivity)}`}
                        >
                          {def.sensitivity}
                        </span>
                      </div>
                      <code className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                        {cap}
                      </code>
                    </div>
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Invitations tab                                                            */
/* -------------------------------------------------------------------------- */

const InvitationsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [revealAcceptUrl, setRevealAcceptUrl] = useState<string | null>(null);
  // Revoke flow uses a confirmation dialog so the operator can opt
  // in to also purging the record. A simple one-click revoke would
  // leave a stale `revoked` row in the table forever.
  const [pendingRevoke, setPendingRevoke] = useState<TeamInvitation | null>(null);
  const [revokeAlsoDelete, setRevokeAlsoDelete] = useState(true);
  // Standalone delete for non-pending rows (revoked / accepted / expired).
  // Confirms before purging so cleanup is intentional.
  const [pendingDelete, setPendingDelete] = useState<TeamInvitation | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["team-invitations"],
    queryFn: () => teamApi.listInvitations(),
  });

  const revokeMutation = useMutation({
    mutationFn: (vars: { id: string; purge: boolean }) =>
      teamApi.revokeInvitation(vars.id, { purge: vars.purge }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      // Mirror the audit log entry into the audit-tab cache too so
      // a freshly-open Audit tab reflects the new event.
      queryClient.invalidateQueries({ queryKey: ["team-audit"] });
      showToast(res.message, "success");
      setPendingRevoke(null);
      setPendingDelete(null);
    },
    onError: (e: any) => {
      showToast(extractError(e), "error");
      setPendingRevoke(null);
      setPendingDelete(null);
    },
  });

  const rows = useMemo(() => {
    const map = data?.data ?? {};
    return Object.values(map);
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {__("Invitations", "yatra")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {__(
              "Magic-link invitations expire after 72 hours by default. Tokens are stored hashed; the link is only shown once.",
              "yatra",
            )}
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="mr-1.5 h-4 w-4" />
          {__("Invite member", "yatra")}
        </Button>
      </div>

      <Card className="overflow-visible">
        <CardContent className="p-0 overflow-visible">
          <SharedTable
            data={rows}
            columns={[
              {
                key: "email",
                label: __("Email", "yatra"),
                render: (i: TeamInvitation) => (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {i.email}
                    </span>
                  </div>
                ),
              },
              {
                key: "role_slug",
                label: __("Role", "yatra"),
                render: (i: TeamInvitation) => (
                  <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    {i.role_slug}
                  </Badge>
                ),
              },
              {
                key: "status",
                label: __("Status", "yatra"),
                render: (i: TeamInvitation) => {
                  const cls: Record<string, string> = {
                    pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                    accepted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                    revoked: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                    expired: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                  };
                  return (
                    <Badge className={cls[i.status]}>
                      {i.status}
                    </Badge>
                  );
                },
              },
              {
                key: "expires_at",
                label: __("Expires", "yatra"),
                render: (i: TeamInvitation) => (
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(i.expires_at * 1000).toLocaleString()}
                  </span>
                ),
              },
            ]}
            actions={[
              // Revoke — only meaningful for a still-pending invitation.
              // Opens a confirmation that lets the operator opt-in to
              // ALSO deleting the row (default checked — most operators
              // don't want orphaned `revoked` rows piling up).
              {
                key: "revoke",
                label: __("Revoke", "yatra"),
                icon: <XCircle className="w-4 h-4" />,
                onClick: (i: TeamInvitation) => {
                  setRevokeAlsoDelete(true);
                  setPendingRevoke(i);
                },
                condition: (i: TeamInvitation) => i.status === "pending",
                variant: "destructive",
              },
              // Delete — for any non-pending row (revoked, accepted,
              // expired). Pure storage hygiene. Without this, the
              // table grew without bound as old invitations accumulated.
              {
                key: "delete",
                label: __("Delete record", "yatra"),
                icon: <Trash2 className="w-4 h-4" />,
                onClick: (i: TeamInvitation) => setPendingDelete(i),
                condition: (i: TeamInvitation) => i.status !== "pending",
                variant: "destructive",
              },
            ]}
            isLoading={isLoading}
            emptyText={__("No invitations yet", "yatra")}
            emptyDescription={__(
              "Send an invitation to add a teammate.",
              "yatra",
            )}
            onCreateClick={() => setShowInviteModal(true)}
          />
        </CardContent>
      </Card>

      {showInviteModal && (
        <InvitationModal
          onClose={() => setShowInviteModal(false)}
          onSent={(acceptUrl) => {
            setShowInviteModal(false);
            setRevealAcceptUrl(acceptUrl);
          }}
        />
      )}

      <AcceptUrlRevealDialog
        url={revealAcceptUrl}
        onClose={() => setRevealAcceptUrl(null)}
      />

      {/* Revoke confirmation. Opt-in checkbox to also purge the row */}
      {/* (default ON — most operators don't want orphaned `revoked` */}
      {/* rows piling up over time).                                  */}
      {pendingRevoke && (
        <Modal
          isOpen
          onClose={() => {
            if (!revokeMutation.isPending) setPendingRevoke(null);
          }}
          title={__("Revoke invitation?", "yatra")}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {sprintf(
                /* translators: %s: invited email address */
                __("The magic-link sent to %s will stop working immediately. Anyone who already clicked the link before now has already accepted (you can confirm in the audit log).", "yatra"),
                pendingRevoke.email,
              )}
            </p>
            <label className="flex items-start gap-2 cursor-pointer p-3 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40">
              <input
                type="checkbox"
                checked={revokeAlsoDelete}
                onChange={(e) => setRevokeAlsoDelete(e.target.checked)}
                disabled={revokeMutation.isPending}
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="block font-medium text-gray-900 dark:text-white">
                  {__("Also delete the invitation record", "yatra")}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {__("Removes the row from this list. The audit log keeps a permanent trail of who was invited, by whom, and when — that's preserved separately.", "yatra")}
                </span>
              </span>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setPendingRevoke(null)}
                disabled={revokeMutation.isPending}
              >
                {__("Cancel", "yatra")}
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  revokeMutation.mutate({
                    id: pendingRevoke.id,
                    purge: revokeAlsoDelete,
                  })
                }
                disabled={revokeMutation.isPending}
              >
                {revokeMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                )}
                {revokeAlsoDelete
                  ? __("Revoke and delete", "yatra")
                  : __("Revoke", "yatra")}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Standalone delete — for already-terminal rows.            */}
      <ConfirmationDialog
        isOpen={pendingDelete !== null}
        onClose={() => {
          if (!revokeMutation.isPending) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete) {
            revokeMutation.mutate({ id: pendingDelete.id, purge: true });
          }
        }}
        title={__("Delete invitation record?", "yatra")}
        description={
          pendingDelete
            ? sprintf(
                /* translators: 1: invited email address, 2: current status */
                __("Permanently remove the %1$s invitation (status: %2$s) from this list. The audit log entry stays, so you can still see who was invited and when — only the live record is removed.", "yatra"),
                pendingDelete.email,
                pendingDelete.status,
              )
            : ""
        }
        confirmText={__("Delete record", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={revokeMutation.isPending}
      />
    </div>
  );
};

const InvitationModal: React.FC<{
  onClose: () => void;
  onSent: (acceptUrl: string) => void;
}> = ({ onClose, onSent }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: rolesData } = useQuery({
    queryKey: ["team-roles"],
    queryFn: () => teamApi.listRoles(),
  });

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("yatra_sales_agent");
  const [expiresIn, setExpiresIn] = useState(259200);

  const sendMutation = useMutation({
    mutationFn: () =>
      teamApi.sendInvitation({ email, role, expires_in: expiresIn }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      showToast(__("Invitation sent.", "yatra"), "success");
      onSent(res.data.accept_url);
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-500" />
          {__("Invite a team member", "yatra")}
        </div>
      }
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {__("Cancel", "yatra")}
          </Button>
          <Button
            disabled={email.trim() === "" || sendMutation.isPending}
            onClick={() => sendMutation.mutate()}
          >
            {sendMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                {__("Sending…", "yatra")}
              </>
            ) : (
              __("Send invitation", "yatra")
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="invite-email">{__("Email address", "yatra")}</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="invite-role">{__("Role", "yatra")}</Label>
          <Select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1"
          >
            {(rolesData?.data ?? []).map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.display_name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="invite-expiry">{__("Link expires in", "yatra")}</Label>
          <Select
            id="invite-expiry"
            value={String(expiresIn)}
            onChange={(e) => setExpiresIn(Number(e.target.value))}
            className="mt-1"
          >
            <option value="86400">{__("24 hours", "yatra")}</option>
            <option value="259200">{__("72 hours (recommended)", "yatra")}</option>
            <option value="604800">{__("7 days", "yatra")}</option>
          </Select>
        </div>

        <Alert variant="info" title={__("How it works", "yatra")}>
          {__(
            "The invitee receives an email with a magic link. Clicking it attaches the chosen role to an existing WP user with that email, or creates a new WP user + sends them a password-reset link.",
            "yatra",
          )}
        </Alert>
      </div>
    </Modal>
  );
};

const AcceptUrlRevealDialog: React.FC<{
  url: string | null;
  onClose: () => void;
}> = ({ url, onClose }) => {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (_e) {
      /* no-op */
    }
  };
  if (!url) return null;
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-500" />
          {__("Invitation link", "yatra")}
        </div>
      }
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{__("Done", "yatra")}</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          {__(
            "The invitation email is on its way. If you'd like to share the link manually (e.g. via Slack), copy it below — it's only shown once.",
            "yatra",
          )}
        </p>
        <div className="flex gap-2">
          <Input
            value={url}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
            className="font-mono text-xs"
            aria-label={__("Accept URL", "yatra")}
          />
          <Button variant="outline" onClick={doCopy}>
            {copied ? (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                {__("Copied", "yatra")}
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-4 w-4" />
                {__("Copy", "yatra")}
              </>
            )}
          </Button>
        </div>
        <Alert variant="warning" title={__("Treat this link like a password", "yatra")}>
          {__(
            "Anyone with this URL can claim the invited role until it expires.",
            "yatra",
          )}
        </Alert>
      </div>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/*  Audit log tab                                                              */
/* -------------------------------------------------------------------------- */

const AuditLogTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  // Selection + confirm-modal state for bulk delete + clear-all.
  // selectedIds is reset on filter / page change so an operator
  // can't accidentally carry a stale selection across views.
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const perPage = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["team-audit-log", page, actionFilter, entityFilter, resultFilter],
    queryFn: () =>
      teamApi.listAuditLog({
        page,
        per_page: perPage,
        ...(actionFilter ? { action: actionFilter } : {}),
        ...(entityFilter ? { entity_type: entityFilter } : {}),
        ...(resultFilter
          ? { result: resultFilter as "allowed" | "denied" }
          : {}),
      }),
    placeholderData: (prev) => prev,
  });
  const { data: facets } = useQuery({
    queryKey: ["team-audit-facets"],
    queryFn: () => teamApi.auditFacets(),
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasFilters = !!(actionFilter || entityFilter || resultFilter);

  const invalidateAudit = () => {
    queryClient.invalidateQueries({ queryKey: ["team-audit-log"] });
    queryClient.invalidateQueries({ queryKey: ["team-audit-facets"] });
    setSelectedIds(new Set());
  };

  const clearMutation = useMutation({
    mutationFn: () => teamApi.clearAuditLog(),
    onSuccess: (res) => {
      invalidateAudit();
      setConfirmClear(false);
      showToast(res.message, "success");
    },
    onError: (e: any) => {
      setConfirmClear(false);
      showToast(extractError(e), "error");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => teamApi.bulkDeleteAuditLog(ids),
    onSuccess: (res) => {
      invalidateAudit();
      setConfirmBulk(false);
      showToast(res.message, "success");
    },
    onError: (e: any) => {
      setConfirmBulk(false);
      showToast(extractError(e), "error");
    },
  });

  // Reset selection whenever the filter / page changes so it never
  // points at rows the operator can't see.
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [page, actionFilter, entityFilter, resultFilter]);

  const toggleOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(rows.map((r: any) => r.id as number)));
  };
  const isAllSelected =
    rows.length > 0 && rows.every((r: any) => selectedIds.has(r.id));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {__("Audit log", "yatra")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {__(
              "Append-only event stream. High + critical sensitivity actions and every denied attempt are logged. Default retention 180 days.",
              "yatra",
            )}
          </p>
        </div>
        {/* Clear-all is always available (independent of selection) so   */}
        {/* operators can wipe the whole log without scrolling pages.     */}
        {/* The destructive action confirms via dialog + writes a final  */}
        {/* audit entry recording who triggered the clear.               */}
        {total > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmClear(true)}
            disabled={clearMutation.isPending}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            {__("Clear all", "yatra")}
          </Button>
        )}
      </div>

      {/* Bulk-action bar — only shown when at least one row is checked. */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3">
          <span className="text-sm text-blue-900 dark:text-blue-100 font-medium mr-auto">
            {sprintf(
              /* translators: %d: count of selected audit-log entries */
              __("%d entries selected", "yatra"),
              selectedIds.size,
            )}
          </span>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmBulk(true)}
            disabled={bulkDeleteMutation.isPending}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            {__("Delete selected", "yatra")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedIds(new Set())}
          >
            {__("Clear selection", "yatra")}
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <Select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              aria-label={__("Filter by action", "yatra")}
              className="w-full lg:w-56"
            >
              <option value="">{__("All actions", "yatra")}</option>
              {(facets?.actions ?? []).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
            <Select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              aria-label={__("Filter by entity", "yatra")}
              className="w-full lg:w-48"
            >
              <option value="">{__("All entities", "yatra")}</option>
              {(facets?.entity_types ?? []).map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Select>
            <Select
              value={resultFilter}
              onChange={(e) => {
                setResultFilter(e.target.value);
                setPage(1);
              }}
              aria-label={__("Filter by result", "yatra")}
              className="w-full lg:w-40"
            >
              <option value="">{__("Any result", "yatra")}</option>
              <option value="allowed">{__("Allowed", "yatra")}</option>
              <option value="denied">{__("Denied", "yatra")}</option>
            </Select>
            {hasFilters && (
              <Button
                variant="outline"
                onClick={() => {
                  setActionFilter("");
                  setEntityFilter("");
                  setResultFilter("");
                  setPage(1);
                }}
              >
                {__("Reset", "yatra")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-visible">
          <SharedTable
            data={rows}
            selectedItemIds={Array.from(selectedIds)}
            onSelectItem={(id, checked) => toggleOne(Number(id), checked)}
            onSelectAll={toggleAll}
            isAllSelected={isAllSelected}
            getItemId={(r: any) => r.id}
            columns={[
              {
                key: "occurred_at",
                label: __("When", "yatra"),
                render: (r: any) => (
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(r.occurred_at).toLocaleString()}
                  </span>
                ),
              },
              {
                key: "actor",
                label: __("Who", "yatra"),
                render: (r: any) =>
                  r.actor_user_id ? (
                    <div className="min-w-0">
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                        {r.actor_display_name || `#${r.actor_user_id}`}
                      </div>
                      {r.actor_ip && (
                        <div className="text-[10px] text-gray-400 font-mono">
                          {r.actor_ip}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {__("system", "yatra")}
                    </Badge>
                  ),
              },
              {
                key: "action",
                label: __("Action", "yatra"),
                render: (r: any) => (
                  <code className="text-xs font-mono text-indigo-700 dark:text-indigo-300">
                    {r.action}
                  </code>
                ),
              },
              {
                key: "entity",
                label: __("Entity", "yatra"),
                render: (r: any) =>
                  r.entity_type ? (
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {r.entity_type}
                      {r.entity_id ? ` #${r.entity_id}` : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  ),
              },
              {
                key: "result",
                label: __("Result", "yatra"),
                render: (r: any) =>
                  r.result === "denied" ? (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      <XCircle className="mr-1 h-3 w-3" />
                      {__("Denied", "yatra")}
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {__("Allowed", "yatra")}
                    </Badge>
                  ),
              },
            ]}
            actions={[]}
            isLoading={isLoading}
            emptyText={__("No audit events yet", "yatra")}
            emptyDescription={__(
              "High and critical sensitivity actions will appear here as they happen.",
              "yatra",
            )}
          />
          {rows.length > 0 && totalPages > 1 && (
            <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={perPage}
                onPageChange={setPage}
                itemName={__("events", "yatra")}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear-all confirmation. Destructive variant + explicit warning  */}
      {/* that the operator's own clear-action will be the only entry     */}
      {/* surviving in the new log.                                       */}
      <ConfirmationDialog
        isOpen={confirmClear}
        onClose={() => !clearMutation.isPending && setConfirmClear(false)}
        onConfirm={() => clearMutation.mutate()}
        title={__("Clear the entire audit log?", "yatra")}
        description={sprintf(
          /* translators: %d: count of audit-log entries about to be wiped */
          __(
            "This permanently deletes all %d audit-log entries. The clear action itself will be recorded as a new entry — so the operator who wiped history is documented. There is no undo.",
            "yatra",
          ),
          total,
        )}
        confirmText={__("Yes, clear all", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={clearMutation.isPending}
      />

      {/* Bulk-delete confirmation. Shows the selected-row count + that  */}
      {/* deletion is permanent and audit-logged.                         */}
      <ConfirmationDialog
        isOpen={confirmBulk}
        onClose={() => !bulkDeleteMutation.isPending && setConfirmBulk(false)}
        onConfirm={() =>
          bulkDeleteMutation.mutate(Array.from(selectedIds))
        }
        title={sprintf(
          /* translators: %d: count of selected audit-log entries */
          __("Delete %d audit-log entries?", "yatra"),
          selectedIds.size,
        )}
        description={__(
          "Permanent. The deletion itself is recorded as a new audit entry so the operator who removed history is documented.",
          "yatra",
        )}
        confirmText={__("Delete entries", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={bulkDeleteMutation.isPending}
      />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  SettingsTab                                                                */
/*                                                                            */
/*  Module-level settings for Team & Access. Currently a single forward-      */
/*  looking toggle: what happens to existing team access if the operator      */
/*  ever turns the module off?                                                */
/*                                                                            */
/*  When the module is ON (which is the only time this tab is reachable),    */
/*  every assigned role just works. The toggle is purely about post-disable  */
/*  behavior — set it now, and it kicks in if/when the module is disabled.   */
/* -------------------------------------------------------------------------- */

const SettingsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["team-settings"],
    queryFn: () => teamApi.getSettings(),
  });

  const keepAccess = data?.data?.keep_access_on_module_disable === true;
  // IP allowlist for staff (yatra_* role) logins. Empty = no
  // restriction. The textarea is bound to a local draft so the operator
  // can edit without firing a save on every keystroke; we save on blur
  // OR explicit click.
  const serverAllowlist = data?.data?.login_ip_allowlist ?? "";
  const [allowlistDraft, setAllowlistDraft] = React.useState(serverAllowlist);
  React.useEffect(() => {
    setAllowlistDraft(serverAllowlist);
  }, [serverAllowlist]);
  const allowlistDirty = allowlistDraft.trim() !== serverAllowlist.trim();

  const updateMutation = useMutation({
    mutationFn: (next: boolean) =>
      teamApi.updateSettings({ keep_access_on_module_disable: next }),
    onSuccess: (res) => {
      // Keep the server-injected snapshot in sync so any other code
      // reading window.yatraAdmin.teamKeepAccessOnModuleDisable gets
      // the fresh value without a page reload.
      if (typeof window !== "undefined" && window.yatraAdmin) {
        window.yatraAdmin.teamKeepAccessOnModuleDisable =
          res.data.keep_access_on_module_disable === true;
      }
      queryClient.invalidateQueries({ queryKey: ["team-settings"] });
      // Audit log entry written by the server — invalidate so the
      // Audit log tab reflects the toggle on next visit.
      queryClient.invalidateQueries({ queryKey: ["team-audit"] });
      showToast(res.message, "success");
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const saveAllowlist = useMutation({
    mutationFn: (next: string) =>
      teamApi.updateSettings({ login_ip_allowlist: next }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["team-settings"] });
      queryClient.invalidateQueries({ queryKey: ["team-audit"] });
      showToast(res.message, "success");
      // Re-sync the draft to whatever the server normalized to (so
      // invalid CIDRs the operator typed are visibly dropped).
      setAllowlistDraft(res.data.login_ip_allowlist ?? "");
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {__("Team & Access settings", "yatra")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {__(
            "One setting: decide what happens to your team's access if you ever turn off this module. Every change here is recorded in the Audit log.",
            "yatra",
          )}
        </p>
      </div>

      {/* Top notice — explains the current state + the trade-off in    */}
      {/* plain English BEFORE the operator touches the toggle. The     */}
      {/* default is OFF (security-conservative: revoke on disable).    */}
      {/* When the operator flips it ON they've opted in to preserving */}
      {/* team access when the module is later disabled.                 */}
      {keepAccess ? (
        <Alert
          variant="info"
          title={__("You've opted in to keep team access on disable", "yatra")}
        >
          {__(
            "This toggle is ON. If you ever turn off the Team & Access module, your team members keep their access and their Yatra roles stay on your site. This is a permissive choice — only leave it ON if you specifically want roles to survive a module-off period (for example, a brief maintenance window).",
            "yatra",
          )}
        </Alert>
      ) : (
        <Alert
          variant="info"
          title={__("On the default — team access is revoked when the module is off", "yatra")}
        >
          {__(
            "This toggle is OFF, which is the default. If you ever turn off the Team & Access module, every Yatra role on your site (Owner, Manager, Sales Agent, and any custom roles you built) will be removed, and your team members will lose all Yatra access. Re-enabling the module brings back the 8 built-in roles, but your custom roles and the original assignments do NOT come back. Flip this toggle ON if you'd rather keep your team's access when the module is off.",
            "yatra",
          )}
        </Alert>
      )}

      <Card>
        <CardContent className="p-5 space-y-5">
          {/* Single forward-looking toggle. Switch on the right, plain-     */}
          {/* language label + dynamic helper text on the left.              */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {keepAccess ? (
                <Lock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Unlock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <Label className="text-base font-medium text-gray-900 dark:text-white block">
                  {__("Keep team access running when this module is turned off", "yatra")}
                  <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                    {__("(off by default)", "yatra")}
                  </span>
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {keepAccess
                    ? __(
                        "ON. If you turn this module off later, your team members keep their roles and current access. Nothing on your site changes until you decide to switch back.",
                        "yatra",
                      )
                    : __(
                        "OFF (default). If you turn this module off later, every Yatra role on your site will be removed and your team members will lose their Yatra access. You (the site owner) always keep your own admin access.",
                        "yatra",
                      )}
                </p>
                {updateMutation.isPending && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {__("Saving…", "yatra")}
                  </p>
                )}
              </div>
            </div>
            <Switch
              checked={keepAccess}
              disabled={updateMutation.isPending}
              onCheckedChange={(next) => updateMutation.mutate(next)}
            />
          </div>

          {/* Plain-language "what happens" matrix — covers both module      */}
          {/* states so the operator can see how the setting plays out      */}
          {/* across the lifecycle.                                          */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md border border-green-200 bg-green-50/40 dark:border-green-900 dark:bg-green-950/20 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Lock className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {__("While this module stays ON", "yatra")}
                </span>
              </div>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4">
                <li>{__("You (site owner) see everything.", "yatra")}</li>
                <li>
                  {__("Team members see only what their role allows.", "yatra")}
                </li>
                <li>
                  {__("Customers and other users see nothing in the admin.", "yatra")}
                </li>
                <li className="text-gray-400 italic">
                  {__("This setting doesn't apply yet — it kicks in only if you turn the module off.", "yatra")}
                </li>
              </ul>
            </div>
            <div
              className={`rounded-md border p-3 ${
                keepAccess
                  ? "border-green-200 bg-green-50/40 dark:border-green-900 dark:bg-green-950/20"
                  : "border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {keepAccess ? (
                  <Lock className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {__("If you ever turn this module OFF", "yatra")}
                </span>
              </div>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4">
                <li>{__("You (site owner) still see everything.", "yatra")}</li>
                {keepAccess ? (
                  <>
                    <li className="text-green-700 dark:text-green-300 font-medium">
                      {__("Team members keep their access — based on their assigned role.", "yatra")}
                    </li>
                    <li>
                      {__("Advanced features (expiry, per-user grants, scopes, audit log) pause until you turn the module back on.", "yatra")}
                    </li>
                  </>
                ) : (
                  <>
                    <li className="text-red-700 dark:text-red-300 font-medium">
                      {__("All Yatra roles are deleted (Owner, Manager, custom roles you built — everything except the Yatra Customer role).", "yatra")}
                    </li>
                    <li className="text-red-700 dark:text-red-300 font-medium">
                      {__("Team members lose all their Yatra access.", "yatra")}
                    </li>
                    <li>
                      {__("Re-enabling the module brings back the 8 built-in roles. Custom roles and the original member assignments don't come back automatically.", "yatra")}
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <Alert variant="info" title={__("Quick recap", "yatra")}>
            {__(
              "Leave the toggle OFF (default) for the security-conservative behavior — every Yatra role is removed if the module is later disabled, so no stale role-based access lingers. Flip it ON only if you specifically need team access to survive a module-off period (e.g. a brief maintenance toggle). Your audit log and member data are preserved either way.",
              "yatra",
            )}
          </Alert>
        </CardContent>
      </Card>

      {/* Login IP allowlist — security feature for compliance        */}
      {/* operators (SOX, ISO 27001 A.9.4.2, PCI DSS 8.1.5). Empty is */}
      {/* the safe default; operators opt in deliberately. The        */}
      {/* WordPress admin (manage_options) is always exempt, so a     */}
      {/* misconfigured list can never lock the site owner out.       */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-blue-500" />
            {__("Restrict staff logins by source IP", "yatra")}
          </CardTitle>
          <CardDescription>
            {__(
              "Optional. Only users who hold a Yatra role are affected — WordPress administrators are always exempt and can never lock themselves out. Drop a comma- or newline-separated list of CIDRs (e.g. 203.0.113.0/24, 198.51.100.5). Empty = no restriction.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full font-mono text-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 min-h-[120px]"
            value={allowlistDraft}
            onChange={(e) => setAllowlistDraft(e.target.value)}
            placeholder={"203.0.113.0/24\n2001:db8::/32\n198.51.100.5"}
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {serverAllowlist.trim() === ""
                ? __("Currently no restriction — every authenticated staff member can sign in from anywhere.", "yatra")
                : sprintf(
                    /* translators: %d: number of CIDR entries currently active */
                    __("%d source IP rule(s) active.", "yatra"),
                    serverAllowlist.split(",").filter((s) => s.trim() !== "").length,
                  )}
            </p>
            <div className="flex items-center gap-2">
              {allowlistDirty && (
                <Button
                  variant="outline"
                  onClick={() => setAllowlistDraft(serverAllowlist)}
                  disabled={saveAllowlist.isPending}
                >
                  {__("Reset", "yatra")}
                </Button>
              )}
              <Button
                onClick={() => saveAllowlist.mutate(allowlistDraft)}
                disabled={!allowlistDirty || saveAllowlist.isPending}
              >
                {saveAllowlist.isPending && (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                )}
                {__("Save allowlist", "yatra")}
              </Button>
            </div>
          </div>
          <Alert
            variant={serverAllowlist.trim() === "" ? "info" : "warning"}
            title={
              serverAllowlist.trim() === ""
                ? __("Failsafe — admins are always exempt", "yatra")
                : __("Live restriction is in effect", "yatra")
            }
          >
            {serverAllowlist.trim() === ""
              ? __(
                  "If you do enable a restriction here and ever lock yourself out, drop the constant `YATRA_DISABLE_LOGIN_IP_ALLOWLIST = true` into wp-config.php to bypass the gate entirely — no database access required.",
                  "yatra",
                )
              : __(
                  "Logins from outside the allowlist are blocked at the password step. WordPress administrators are exempt — you can never lock yourself out as the site owner. Every block is recorded in the Audit log as `team.login_blocked_by_ip`.",
                  "yatra",
                )}
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default Team;
