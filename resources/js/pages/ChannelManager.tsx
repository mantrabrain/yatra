import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Network,
  Loader2,
  Settings2,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Info,
  Crown,
  Link as LinkIcon,
  Inbox,
  Clock,
  Globe,
  Layers,
  Zap,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Copy,
  Send,
  Activity,
  Power,
  PowerOff,
  Search,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import { apiClient } from "../lib/api-client";
import { __, sprintf } from "../lib/i18n";
import { PageHeader } from "../components/common/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  ModulePageSkeleton,
  ModuleListSkeleton,
  ModuleTableSkeleton,
} from "../components/ui/module-skeleton";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { useToast } from "../components/ui/toast";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import {
  channelManagerApi,
  type ChannelHealth,
  type ChannelManagerMeta,
  type ChannelRow,
  type ChannelTypeDef,
  type MappingRow,
} from "../api/channel-manager-api";

/**
 * Channel Manager admin hub.
 *
 * White-label-safe: no product-name strings in user-facing copy
 * (the `"yatra"` second argument to __() is the i18n textdomain,
 * not visible text — it's how WP gettext keys translations).
 *
 * Layout mirrors the Whatsapp module: PageHeader + intro "About"
 * card + tab-strip Card with section content per tab.
 *
 * Tabs:
 *   - Channels: list + add/edit/delete channel instances + credentials
 *   - Mappings: trip × channel × external_id rows
 *   - Bookings: inbound staged channel bookings
 *   - Logs:     audit of every push/pull/webhook event
 */

type CmTab =
  | "channels"
  | "mappings"
  | "bookings"
  | "logs"
  | "reconciliation"
  | "latency";

function getInitialTab(): CmTab {
  if (typeof window === "undefined") return "channels";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (
    tab === "mappings" ||
    tab === "bookings" ||
    tab === "logs" ||
    tab === "reconciliation" ||
    tab === "latency"
  )
    return tab;
  return "channels";
}

const ChannelManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CmTab>(() => getInitialTab());

  const switchTab = (next: CmTab) => {
    setActiveTab(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const { data: meta, isLoading: metaLoading } = useQuery<ChannelManagerMeta>({
    queryKey: ["channel-manager-meta"],
    queryFn: () => channelManagerApi.getMeta(),
  });

  if (metaLoading) {
    return <ModulePageSkeleton variant="tabs" />;
  }

  if (!meta || !meta.is_eligible) {
    return (
      <div className="space-y-6">
        <PageHeader
          description={__(
            "Distribute your tours on global OTAs from one dashboard. Push inventory and pricing automatically, receive bookings back into a unified inbox.",
            "yatra",
          )}
        />
        <AboutCard />
        <UpgradeCard meta={meta} />
      </div>
    );
  }

  const ready = Boolean(meta.is_module_enabled);

  const tabs: Array<{ key: CmTab; label: string; icon: any }> = [
    { key: "channels", label: __("Channels", "yatra"), icon: Network },
    { key: "mappings", label: __("Trip mappings", "yatra"), icon: LinkIcon },
    { key: "bookings", label: __("Bookings inbox", "yatra"), icon: Inbox },
    { key: "logs", label: __("Sync activity", "yatra"), icon: Clock },
    // Reconciliation answers "where do I have unfinished business?" —
    // stale mappings, pending booking promotions, breaker states.
    {
      key: "reconciliation",
      label: __("Reconciliation", "yatra"),
      icon: AlertTriangle,
    },
    // Latency answers "are my OTAs slow today?" — p50/p95/p99 of
    // sync durations across 24h + 7d windows.
    { key: "latency", label: __("Latency", "yatra"), icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        description={__(
          "Distribute your tours on global OTAs from one dashboard. Push inventory and pricing automatically, receive bookings back into a unified inbox.",
          "yatra",
        )}
      />

      <AboutCard />

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
          {!ready ? (
            <ModulePrompt />
          ) : activeTab === "channels" ? (
            <ChannelsSection meta={meta} />
          ) : activeTab === "mappings" ? (
            <MappingsSection />
          ) : activeTab === "bookings" ? (
            <BookingsSection />
          ) : activeTab === "reconciliation" ? (
            <ReconciliationSection />
          ) : activeTab === "latency" ? (
            <LatencySection />
          ) : (
            <LogsSection />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  About / How it works — always visible, brand-neutral                      */
/* -------------------------------------------------------------------------- */

const AboutCard: React.FC = () => (
  <Card className="border-blue-200 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        {__("What is a Channel Manager?", "yatra")}
      </CardTitle>
      <CardDescription className="mt-2 leading-relaxed">
        {__(
          "OTAs (Online Travel Agencies) — Viator, GetYourGuide, Klook, TripAdvisor, Airbnb Experiences — drive 30–60% of bookings for most tour operators. Managing them by hand means updating inventory and prices in multiple dashboards, copy-pasting bookings between systems, and risking overbooking when seats sell on two channels at once.",
          "yatra",
        )}
        <br />
        <br />
        {__(
          "This module connects directly to each OTA's API. Inventory + pricing are pushed automatically whenever a booking, departure, or availability change happens here. Bookings made on the OTA flow back into the same booking list as direct sales — same customer notifications, same revenue reporting, same automation rules.",
          "yatra",
        )}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4 md:grid-cols-3">
        <HowItWorksStep
          icon={Network}
          step={1}
          title={__("Connect a channel", "yatra")}
          body={__(
            "Add an OTA, paste in your provider credentials, and set commission + price offset. Start in sandbox mode until your first test booking flows through.",
            "yatra",
          )}
        />
        <HowItWorksStep
          icon={LinkIcon}
          step={2}
          title={__("Map your trips", "yatra")}
          body={__(
            "For each trip you want to sell on that OTA, link it to its counterpart product on their side. One trip can map to many channels with different prices and inventory rules.",
            "yatra",
          )}
        />
        <HowItWorksStep
          icon={Zap}
          step={3}
          title={__("Sync runs automatically", "yatra")}
          body={__(
            "Inventory and pricing push within seconds of any change. Bookings arrive via webhook, are staged for safety, then promoted into the standard booking list — instantly visible everywhere else.",
            "yatra",
          )}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ValueCallout
          icon={Globe}
          title={__("Reach new customers", "yatra")}
          body={__(
            "OTAs market your trips to millions of travelers worldwide.",
            "yatra",
          )}
        />
        <ValueCallout
          icon={ShieldCheck}
          title={__("No overbooking", "yatra")}
          body={__(
            "Real-time inventory keeps stock in sync across every channel.",
            "yatra",
          )}
        />
        <ValueCallout
          icon={TrendingUp}
          title={__("Smart pricing", "yatra")}
          body={__(
            "Per-channel offsets cover commission while keeping margins.",
            "yatra",
          )}
        />
        <ValueCallout
          icon={Layers}
          title={__("Bring your own credentials", "yatra")}
          body={__(
            "Connections go direct to the OTA. No proxying, no markup.",
            "yatra",
          )}
        />
      </div>
    </CardContent>
  </Card>
);

const HowItWorksStep: React.FC<{
  icon: any;
  step: number;
  title: string;
  body: string;
}> = ({ icon: Icon, step, title, body }) => (
  <div className="rounded-lg border border-blue-200/70 bg-white p-4 dark:border-blue-800/60 dark:bg-gray-900">
    <div className="flex items-center gap-2 mb-2">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
        {step}
      </span>
      <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </h4>
    </div>
    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
      {body}
    </p>
  </div>
);

const ValueCallout: React.FC<{
  icon: any;
  title: string;
  body: string;
}> = ({ icon: Icon, title, body }) => (
  <div className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-blue-500" />
      <h5 className="text-xs font-semibold text-gray-900 dark:text-white">
        {title}
      </h5>
    </div>
    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{body}</p>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Upgrade / module prompts                                                  */
/* -------------------------------------------------------------------------- */

const UpgradeCard: React.FC<{ meta?: ChannelManagerMeta }> = ({ meta }) => (
  <Card className="max-w-3xl">
    <CardHeader>
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-purple-100 p-2 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
          <Crown className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <CardTitle>{__("Channel Manager — Agency plan", "yatra")}</CardTitle>
          <CardDescription className="mt-1">
            {__(
              "Available on the Agency plan. Standalone channel managers charge $99–299/month for the same capability — it's included here at no extra cost.",
              "yatra",
            )}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <Button asChild>
        <a
          href={
            meta?.upgrade_url ||
            "https://wpyatra.com/pricing?module=channel-manager"
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          {__("Upgrade to Agency", "yatra")}
          <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </Button>
    </CardContent>
  </Card>
);

const ModulePrompt: React.FC = () => (
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
    <div className="flex gap-3">
      <Settings2 className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
      <div>
        <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100">
          {__("Enable the Channel Manager module", "yatra")}
        </h3>
        <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/90">
          {__(
            "Your license tier qualifies. Turn on Channel Manager under Modules to start configuring it.",
            "yatra",
          )}
        </p>
        <Button
          asChild
          variant="outline"
          className="mt-3 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
        >
          <a href="admin.php?page=yatra&subpage=modules">
            {__("Open Modules", "yatra")}
          </a>
        </Button>
      </div>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Channels tab                                                              */
/* -------------------------------------------------------------------------- */

const ChannelsSection: React.FC<{ meta: ChannelManagerMeta }> = ({ meta }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<number | "new" | null>(null);
  // Confirmation dialog for delete — replaces native window.confirm()
  // so the destructive prompt matches the rest of the admin UI.
  const [pendingDeleteChannel, setPendingDeleteChannel] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["channel-manager-channels"],
    queryFn: () => channelManagerApi.listChannels(),
  });

  const deleteChannel = useMutation({
    mutationFn: (id: number) => channelManagerApi.deleteChannel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-channels"] });
      showToast(__("Channel deleted.", "yatra"), "success");
      setPendingDeleteChannel(null);
    },
    onError: (e: any) => {
      showToast(extractError(e), "error");
      setPendingDeleteChannel(null);
    },
  });

  if (isLoading) {
    return <ModuleListSkeleton rows={4} />;
  }

  if (editing !== null) {
    const channel =
      editing === "new"
        ? null
        : (data?.data.find((c) => c.id === editing) ?? null);
    return (
      <ChannelEditForm
        meta={meta}
        existing={channel}
        onClose={() => setEditing(null)}
      />
    );
  }

  const channels = data?.data ?? [];
  const supportedChannelNames = meta.channel_types
    .map((t) => t.name)
    .join(", ");

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="max-w-2xl">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {__("Configured channels", "yatra")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {__(
              "Add one connection per OTA you want to distribute on. Credentials are stored libsodium-encrypted; nothing is proxied through any third-party service.",
              "yatra",
            )}
          </p>
          {meta.channel_types.length > 0 && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {__("Supported OTAs:", "yatra")}
              </span>{" "}
              {supportedChannelNames}
            </p>
          )}
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="mr-1.5 h-4 w-4" />
          {__("Add channel", "yatra")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {channels.length === 0 ? (
            <EmptyChannels onAdd={() => setEditing("new")} meta={meta} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <Th>{__("Channel", "yatra")}</Th>
                    <Th>{__("Account", "yatra")}</Th>
                    <Th>{__("Health", "yatra")}</Th>
                    <Th>{__("Mode", "yatra")}</Th>
                    <Th>{__("Status", "yatra")}</Th>
                    <Th>{__("Last sync", "yatra")}</Th>
                    <Th align="right">{__("Actions", "yatra")}</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {channels.map((ch) => {
                    const type = meta.channel_types.find(
                      (t) => t.type === ch.channel_type,
                    );
                    return (
                      <tr
                        key={ch.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                            <Network className="h-4 w-4 text-purple-500" />
                            {type?.name ?? ch.channel_type}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {ch.display_name || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                          {ch.account_label || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <HealthBadge health={ch.health} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              ch.is_test_mode
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }
                          >
                            {ch.is_test_mode
                              ? __("Sandbox", "yatra")
                              : __("Live", "yatra")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              ch.is_enabled
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                            }
                          >
                            {ch.is_enabled
                              ? __("Enabled", "yatra")
                              : __("Disabled", "yatra")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {ch.last_sync_at
                            ? new Date(ch.last_sync_at).toLocaleString()
                            : "—"}
                          {ch.last_sync_status === "failed" && (
                            <span className="ml-2 inline-flex items-center gap-1 text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              {__("failed", "yatra")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditing(ch.id)}
                            >
                              {__("Edit", "yatra")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                              onClick={() =>
                                setPendingDeleteChannel({
                                  id: ch.id,
                                  name: ch.display_name || ch.channel_type,
                                })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmationDialog
        isOpen={pendingDeleteChannel !== null}
        onClose={() => {
          if (!deleteChannel.isPending) setPendingDeleteChannel(null);
        }}
        onConfirm={() => {
          if (pendingDeleteChannel)
            deleteChannel.mutate(pendingDeleteChannel.id);
        }}
        title={__("Delete channel?", "yatra")}
        description={
          pendingDeleteChannel
            ? __(
                "Delete the “{name}” channel? Credentials and trip mappings linked to it will be removed. This cannot be undone.",
                "yatra",
              ).replace("{name}", pendingDeleteChannel.name)
            : ""
        }
        confirmText={__("Delete channel", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={deleteChannel.isPending}
      />
    </div>
  );
};

const EmptyChannels: React.FC<{
  onAdd: () => void;
  meta: ChannelManagerMeta;
}> = ({ onAdd, meta }) => (
  <div className="p-10 text-center">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
      <Network className="h-7 w-7 text-blue-600 dark:text-blue-400" />
    </div>
    <h4 className="text-base font-semibold text-gray-900 dark:text-white">
      {__("No channels yet", "yatra")}
    </h4>
    <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
      {__(
        "Connect your first OTA to start distributing trips. You'll need API credentials from that OTA's partner portal — there's a help link inside the form.",
        "yatra",
      )}
    </p>
    <div className="mt-4 flex justify-center gap-2">
      <Button onClick={onAdd}>
        <Plus className="mr-1.5 h-4 w-4" />
        {__("Add your first channel", "yatra")}
      </Button>
      {meta.docs_url && (
        <Button variant="outline" asChild>
          <a href={meta.docs_url} target="_blank" rel="noopener noreferrer">
            <HelpCircle className="mr-1.5 h-4 w-4" />
            {__("Read the setup guide", "yatra")}
          </a>
        </Button>
      )}
    </div>
  </div>
);

const ChannelEditForm: React.FC<{
  meta: ChannelManagerMeta;
  existing: ChannelRow | null;
  onClose: () => void;
}> = ({ meta, existing, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isCreate = existing === null;

  const [channelType, setChannelType] = useState<string>(
    existing?.channel_type ?? meta.channel_types[0]?.type ?? "",
  );
  const [displayName, setDisplayName] = useState(existing?.display_name ?? "");
  const [accountLabel, setAccountLabel] = useState(
    existing?.account_label ?? "",
  );
  const [isEnabled, setIsEnabled] = useState(existing?.is_enabled ?? false);
  const [isTestMode, setIsTestMode] = useState(existing?.is_test_mode ?? true);
  const [currency, setCurrency] = useState(existing?.currency ?? "USD");
  const [defaultOffset, setDefaultOffset] = useState<number>(
    existing?.default_offset_percent ?? 0,
  );
  const [commission, setCommission] = useState<number>(
    existing?.commission_percent ?? 0,
  );
  const [buffer, setBuffer] = useState<number>(existing?.inventory_buffer ?? 0);
  // Per-channel IP allowlist for the inbound webhook receiver. Stored
  // in the channel's `settings` JSON under `allowed_ips`. Empty = no
  // restriction (default). Comma- and/or newline-separated CIDR list.
  const [allowedIps, setAllowedIps] = useState<string>(
    ((existing?.settings as Record<string, unknown> | undefined)
      ?.allowed_ips as string) ?? "",
  );

  const typeDef = useMemo(
    () => meta.channel_types.find((t) => t.type === channelType) ?? null,
    [meta.channel_types, channelType],
  );

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        channel_type: channelType,
        display_name: displayName,
        account_label: accountLabel,
        is_enabled: isEnabled,
        is_test_mode: isTestMode,
        currency,
        default_offset_percent: defaultOffset,
        commission_percent: commission,
        inventory_buffer: buffer,
        // Merge into existing settings so unrelated keys (per-provider
        // overrides, custom fields a future feature might add) are
        // preserved on update.
        settings: {
          ...((existing?.settings as Record<string, unknown> | undefined) ??
            {}),
          allowed_ips: allowedIps,
        },
      };
      return isCreate
        ? channelManagerApi.createChannel(payload)
        : channelManagerApi.updateChannel(existing!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-channels"] });
      showToast(
        isCreate
          ? __("Channel created. Add credentials next to enable sync.", "yatra")
          : __("Channel saved.", "yatra"),
        "success",
      );
      if (isCreate) onClose();
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const testConnection = useMutation({
    mutationFn: () => channelManagerApi.testConnection(existing!.id),
    onSuccess: (res) => {
      if (res.ok) {
        showToast(
          __("Connection OK — credentials accepted by the OTA.", "yatra"),
          "success",
        );
      } else {
        showToast(res.error || __("Connection failed.", "yatra"), "error");
      }
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const syncChannel = useMutation({
    mutationFn: () => channelManagerApi.syncChannel(existing!.id),
    onSuccess: (res) => showToast(res.message, "success"),
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const testWebhook = useMutation({
    mutationFn: () => channelManagerApi.testWebhook(existing!.id),
    onSuccess: (res) => {
      if (res.ok) {
        showToast(
          __(
            "Webhook self-test succeeded — your endpoint is reachable.",
            "yatra",
          ),
          "success",
        );
      } else {
        showToast(
          res.error ||
            __(
              "Webhook self-test failed — see Sync activity for details.",
              "yatra",
            ),
          "error",
        );
      }
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isCreate
              ? __("Add channel", "yatra")
              : __("Edit channel", "yatra")}
          </h2>
          {typeDef?.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              {typeDef.description}
            </p>
          )}
          {typeDef && (
            <div className="mt-2 flex flex-wrap gap-2">
              {typeDef.docs_url && (
                <a
                  href={typeDef.docs_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  <HelpCircle className="h-3 w-3" />
                  {__("Integration docs", "yatra")}
                </a>
              )}
              {typeDef.signup_url && (
                <a
                  href={typeDef.signup_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  <ExternalLink className="h-3 w-3" />
                  {__("Apply to partner program", "yatra")}
                </a>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {!isCreate && (
            <>
              <Button
                variant="outline"
                onClick={() => testConnection.mutate()}
                disabled={testConnection.isPending}
              >
                {testConnection.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                )}
                {__("Test connection", "yatra")}
              </Button>
              <Button
                variant="outline"
                onClick={() => syncChannel.mutate()}
                disabled={syncChannel.isPending || !isEnabled}
                title={
                  !isEnabled
                    ? __("Enable the channel before syncing.", "yatra")
                    : undefined
                }
              >
                {syncChannel.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                )}
                {__("Sync now", "yatra")}
              </Button>
              <Button
                variant="outline"
                onClick={() => testWebhook.mutate()}
                disabled={testWebhook.isPending}
                title={__(
                  "Sends a signed synthetic booking to your own webhook URL so you can confirm the round-trip works.",
                  "yatra",
                )}
              >
                {testWebhook.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-4 w-4" />
                )}
                {__("Test webhook", "yatra")}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={onClose}>
            {__("Back to list", "yatra")}
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || channelType === ""}
          >
            {save.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            {isCreate
              ? __("Create channel", "yatra")
              : __("Save changes", "yatra")}
          </Button>
        </div>
      </div>

      {isCreate && (
        <div className="rounded-md border border-blue-200 bg-blue-50/60 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
          <p className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              {__(
                "Channels are created in disabled + sandbox mode by default. You'll add credentials and test the connection on the next screen, then flip Enabled on once you've verified everything works.",
                "yatra",
              )}
            </span>
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{__("Connection", "yatra")}</CardTitle>
          <CardDescription>
            {__(
              "Pick which OTA this connection is for and give it a friendly label.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label={__("OTA channel", "yatra")}
              description={__(
                "Pick the OTA you're connecting. Once a channel is created, this is locked — to switch OTAs you'd add a new channel.",
                "yatra",
              )}
            >
              <Select
                value={channelType}
                onChange={(e) => setChannelType(e.target.value)}
                disabled={!isCreate}
              >
                {meta.channel_types.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label={__("Display name", "yatra")}
              description={__(
                "How this channel appears in the admin UI. Leave blank to use the OTA's name.",
                "yatra",
              )}
            >
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={typeDef?.name ?? ""}
              />
            </FormField>

            <FormField
              label={__("Account label (internal)", "yatra")}
              description={__(
                "Optional note shown in logs and reports. Useful when you run multiple accounts on the same OTA (e.g. 'US production', 'EU staging').",
                "yatra",
              )}
            >
              <Input
                value={accountLabel}
                onChange={(e) => setAccountLabel(e.target.value)}
                placeholder={__("e.g. US production account", "yatra")}
              />
            </FormField>

            <FormField
              label={__("Currency", "yatra")}
              description={__(
                "ISO 4217 code (e.g. USD, EUR, GBP). Must match the currency your products are priced in on the OTA — mismatches cause failed pricing pushes.",
                "yatra",
              )}
            >
              <Input
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value.toUpperCase().slice(0, 3))
                }
                placeholder="USD"
                maxLength={3}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{__("Pricing & inventory rules", "yatra")}</CardTitle>
          <CardDescription>
            {__(
              "How prices and seat counts on this channel differ from your base trip. These apply across every trip mapped to this channel — individual mappings can override on a per-trip basis.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-3">
            <FormField
              label={__("Default price offset (%)", "yatra")}
              description={__(
                "Adds (or subtracts) a percentage to your base trip price before pushing to this channel. Use a positive number to cover the OTA's commission so your net stays whole; negative to run a channel discount.",
                "yatra",
              )}
            >
              <Input
                type="number"
                step="0.01"
                value={defaultOffset}
                onChange={(e) => setDefaultOffset(Number(e.target.value) || 0)}
                placeholder="0"
              />
            </FormField>

            <FormField
              label={__("Commission (%) — informational", "yatra")}
              description={__(
                "What the OTA deducts from each sale. Not sent to the channel — used here only to estimate your net revenue in reports.",
                "yatra",
              )}
            >
              <Input
                type="number"
                step="0.01"
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value) || 0)}
                placeholder="0"
              />
            </FormField>

            <FormField
              label={__("Inventory buffer (seats)", "yatra")}
              description={__(
                "Seats held back from this channel so direct-bookers and other OTAs always have stock. Example: a 20-seat departure with a buffer of 2 will only ever show 18 seats on this channel.",
                "yatra",
              )}
            >
              <Input
                type="number"
                min={0}
                value={buffer}
                onChange={(e) => setBuffer(Number(e.target.value) || 0)}
                placeholder="0"
              />
            </FormField>
          </div>

          {!isCreate && (
            <FormField
              label={__("Inbound webhook IP allowlist", "yatra")}
              description={__(
                "Optional defense-in-depth on top of the signature secret. Comma- or newline-separated CIDRs. Empty = no restriction (default). When set, inbound webhook deliveries from any source outside the list are dropped BEFORE signature verification.",
                "yatra",
              )}
            >
              <textarea
                className="w-full font-mono text-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 min-h-[80px]"
                value={allowedIps}
                onChange={(e) => setAllowedIps(e.target.value)}
                placeholder={"203.0.113.0/24\n198.51.100.42"}
              />
            </FormField>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{__("Channel state", "yatra")}</CardTitle>
          <CardDescription>
            {__(
              "Both flags must be considered together: a disabled channel won't sync at all, regardless of mode; sandbox mode lets you test live API calls against the OTA's staging environment without affecting real bookings.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label={__("Enabled", "yatra")}
            description={__(
              "When off, this channel won't push inventory or pricing, and incoming bookings won't be ingested. Logs still record any attempts so you can audit them.",
              "yatra",
            )}
            checked={isEnabled}
            onChange={setIsEnabled}
          />
          <ToggleRow
            label={__("Sandbox / test mode", "yatra")}
            description={__(
              "Routes API calls to the OTA's sandbox environment. Always start in sandbox until a test booking has flowed through end-to-end. Switch off only after you've verified the connection in production.",
              "yatra",
            )}
            checked={isTestMode}
            onChange={setIsTestMode}
            tone="amber"
          />
        </CardContent>
      </Card>

      {!isCreate && typeDef && (
        <CredentialsCard
          channelId={existing!.id}
          typeDef={typeDef}
          status={existing!.credentials ?? {}}
        />
      )}

      {!isCreate && (
        <WebhookCard
          channelId={existing!.id}
          webhookUrlTemplate={meta.webhook_url}
        />
      )}
    </div>
  );
};

const CredentialsCard: React.FC<{
  channelId: number;
  typeDef: ChannelTypeDef;
  status: Record<string, { configured: boolean; hint: string }>;
}> = ({ channelId, typeDef, status }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  const save = useMutation({
    mutationFn: (vars: { field: string; value: string }) =>
      channelManagerApi.updateCredential(channelId, vars.field, vars.value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-channels"] });
      showToast(__("Credential saved.", "yatra"), "success");
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-500" />
          {__("API credentials", "yatra")}
        </CardTitle>
        <CardDescription>
          {__(
            "Stored encrypted with libsodium AEAD (XChaCha20-Poly1305). After saving, the value is never sent back to the browser — you only see a masked last-4 hint to confirm something is set.",
            "yatra",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(typeDef.credentials).map(([field, def]) => {
          const fieldStatus = status[field] ?? {
            configured: false,
            hint: "",
          };
          const draft = drafts[field] ?? "";
          const isVisible = !!visible[field];
          return (
            <div key={field} className="space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <Label className="flex items-center gap-2">
                  {def.label}
                  {def.required && (
                    <span className="text-xs text-red-600 dark:text-red-400">
                      *
                    </span>
                  )}
                </Label>
                {def.docs_url && (
                  <a
                    href={def.docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {__("Where to find this", "yatra")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {def.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                  <span>{def.description}</span>
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[260px]">
                  <Input
                    type={isVisible ? "text" : "password"}
                    value={draft}
                    placeholder={
                      fieldStatus.configured
                        ? fieldStatus.hint
                        : __("Paste the credential value…", "yatra")
                    }
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [field]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVisible((v) => ({ ...v, [field]: !v[field] }))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={
                      isVisible
                        ? __("Hide value", "yatra")
                        : __("Show value", "yatra")
                    }
                  >
                    {isVisible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  onClick={() => {
                    save.mutate({ field, value: draft });
                    setDrafts((d) => ({ ...d, [field]: "" }));
                  }}
                  disabled={save.isPending || draft.trim() === ""}
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  {__("Save", "yatra")}
                </Button>
                {fieldStatus.configured && (
                  <Button
                    variant="outline"
                    onClick={() => save.mutate({ field, value: "" })}
                    disabled={save.isPending}
                    className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                  >
                    {__("Clear", "yatra")}
                  </Button>
                )}
              </div>
              {fieldStatus.configured ? (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {__("Configured", "yatra")} — {fieldStatus.hint}
                </p>
              ) : def.required ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {__("Required — sync will fail without this.", "yatra")}
                </p>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

const WebhookCard: React.FC<{
  channelId: number;
  webhookUrlTemplate: string;
}> = ({ channelId, webhookUrlTemplate }) => {
  const { showToast } = useToast();
  // Replace `{channel_id}` placeholder if present, otherwise append id.
  const url = webhookUrlTemplate.includes("{channel_id}")
    ? webhookUrlTemplate.replace("{channel_id}", String(channelId))
    : `${webhookUrlTemplate.replace(/\/$/, "")}/${channelId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast(__("Webhook URL copied.", "yatra"), "success");
    } catch {
      showToast(__("Couldn't copy — copy manually.", "yatra"), "error");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-blue-500" />
          {__("Inbound webhook URL", "yatra")}
        </CardTitle>
        <CardDescription>
          {__(
            "Paste this URL into the OTA's partner portal under booking notifications. Whenever a booking is made on the OTA, they POST it here and it appears in the Bookings inbox seconds later. The endpoint verifies the request signature, so only the OTA can deliver to it.",
            "yatra",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap">
          <code className="flex-1 min-w-[280px] rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 break-all">
            {url}
          </code>
          <Button variant="outline" onClick={copy}>
            <Copy className="mr-1.5 h-4 w-4" />
            {__("Copy", "yatra")}
          </Button>
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>
            {__(
              "If your site is behind a firewall or VPN, make sure this URL is reachable from the public internet — otherwise the OTA's webhook deliveries will time out and you'll only get bookings on the next hourly cron tick.",
              "yatra",
            )}
          </span>
        </p>
      </CardContent>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/*  Mappings tab                                                              */
/* -------------------------------------------------------------------------- */

const MappingsSection: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [filterChannel, setFilterChannel] = useState<number>(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<MappingRow | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  // Unified pending-delete state. `kind` differentiates a single-row
  // delete from a bulk delete so one <ConfirmationDialog> can serve both.
  const [pendingDelete, setPendingDelete] = useState<
    { kind: "one"; id: number } | { kind: "bulk"; ids: number[] } | null
  >(null);

  const { data: channelsData } = useQuery({
    queryKey: ["channel-manager-channels"],
    queryFn: () => channelManagerApi.listChannels(),
  });
  const { data: mappingsData, isLoading } = useQuery({
    queryKey: ["channel-manager-mappings", filterChannel],
    queryFn: () => channelManagerApi.listMappings(filterChannel || undefined),
  });

  const syncMapping = useMutation({
    mutationFn: (id: number) => channelManagerApi.syncMapping(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-mappings"] });
      if (res.ok) {
        showToast(__("Mapping synced.", "yatra"), "success");
      } else {
        showToast(res.error || __("Sync failed.", "yatra"), "error");
      }
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const deleteMapping = useMutation({
    mutationFn: (id: number) => channelManagerApi.deleteMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-mappings"] });
      showToast(__("Mapping deleted.", "yatra"), "success");
      setPendingDelete(null);
    },
    onError: (e: any) => {
      showToast(extractError(e), "error");
      setPendingDelete(null);
    },
  });

  const bulkAction = useMutation({
    mutationFn: (vars: {
      action: "sync" | "enable" | "disable" | "delete";
      ids: number[];
    }) => channelManagerApi.bulkMappings(vars.action, vars.ids),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-mappings"] });
      setSelected(new Set());
      showToast(res.message, res.ok ? "success" : "error");
      setPendingDelete(null);
    },
    onError: (e: any) => {
      showToast(extractError(e), "error");
      setPendingDelete(null);
    },
  });

  const channels = channelsData?.data ?? [];
  const mappings = mappingsData?.data ?? [];
  const channelById = new Map<number, ChannelRow>(
    channels.map((c) => [c.id, c]),
  );

  // Resolve every mapping's trip_id → title + admin-edit URL so the
  // listing renders a friendly trip name (with a clickable link)
  // instead of the bare numeric id. One batched /trips fetch keyed on
  // the comma-joined id list keeps the network traffic to a single
  // request even when the operator has dozens of mappings, and React
  // Query's 5-minute staleTime means subsequent visits read straight
  // from cache.
  const tripIdsForLookup = useMemo(() => {
    const ids = new Set<number>();
    mappings.forEach((m: MappingRow) => {
      if (m.trip_id) ids.add(Number(m.trip_id));
    });
    return Array.from(ids).sort((a, b) => a - b);
  }, [mappings]);

  const { data: tripsLookup } = useQuery<
    Map<number, { title: string; edit_url: string }>
  >({
    queryKey: ["channel-manager-mapping-trip-titles", tripIdsForLookup],
    enabled: tripIdsForLookup.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      // /trips supports a comma-separated `include` (or `ids`) filter on
      // most Yatra builds; if the active build doesn't, the response
      // simply returns the first page and unmatched ids fall back to
      // "Trip #N" in the row renderer — safe degradation.
      const params: Record<string, any> = {
        per_page: Math.max(tripIdsForLookup.length, 25),
        include: tripIdsForLookup.join(","),
      };
      const res: any = await apiClient.get("/trips", { params });
      const items: any[] = res?.data?.data || res?.data || res || [];
      const map = new Map<number, { title: string; edit_url: string }>();
      if (Array.isArray(items)) {
        items.forEach((t: any) => {
          const id = Number(t?.id || 0);
          if (!id) return;
          map.set(id, {
            title: String(t?.title || t?.name || `Trip #${id}`),
            edit_url:
              t?.edit_url ||
              t?.admin_edit_url ||
              t?.permalink ||
              `${(window as any)?.yatraAdmin?.adminUrl || "admin.php"}?page=yatra&subpage=trips&action=edit&id=${id}`,
          });
        });
      }
      return map;
    },
  });

  // If we're showing the edit form, render that instead of the list.
  if (editing !== null) {
    return (
      <MappingEditForm
        channels={channels}
        existing={editing}
        onClose={() => setEditing(null)}
      />
    );
  }

  const visibleIds = mappings.map((m) => m.id);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleIds));
    }
  };
  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const runBulk = (action: "sync" | "enable" | "disable" | "delete") => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (action === "delete") {
      // Defer to the confirmation dialog — its onConfirm handler
      // dispatches the actual bulkAction mutation.
      setPendingDelete({ kind: "bulk", ids });
      return;
    }
    bulkAction.mutate({ action, ids });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="max-w-2xl">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {__("Trip mappings", "yatra")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {__(
              "A mapping links one of your trips to its counterpart product on a channel. One trip can be mapped to many channels (each can have its own price offset); one channel holds one mapping per trip.",
              "yatra",
            )}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>
              {__(
                "Once mapped, every change to your trip's availability or price triggers a sync within seconds. Use the per-mapping offset to override the channel default when one trip needs different pricing logic.",
                "yatra",
              )}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* The shared Select renders w-full by default so its
              flex item stretches to fill the row and pushes the
              Add button onto a second line. Constraining it to a
              fixed pixel width keeps the filter dropdown and the
              Add button on the same row when there is space —
              and flex-wrap (not nowrap) lets the Button drop
              below cleanly on truly narrow viewports instead of
              overflowing the parent. */}
          <Select
            value={String(filterChannel)}
            onChange={(e) => setFilterChannel(Number(e.target.value))}
            className="w-56"
          >
            <option value="0">{__("All channels", "yatra")}</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name || c.channel_type}
              </option>
            ))}
          </Select>
          <Button
            onClick={() => setShowAdd(true)}
            disabled={channels.length === 0}
            title={
              channels.length === 0
                ? __("Add at least one channel first.", "yatra")
                : undefined
            }
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {__("Add mapping", "yatra")}
          </Button>
        </div>
      </div>

      {showAdd && (
        <MappingAddForm
          channels={channels}
          defaultChannelId={filterChannel || channels[0]?.id || 0}
          onClose={() => setShowAdd(false)}
        />
      )}

      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30 flex-wrap">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
            {__("{n} selected", "yatra").replace("{n}", String(selected.size))}
          </span>
          <div className="ml-auto flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => runBulk("sync")}
              disabled={bulkAction.isPending}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              {__("Sync selected", "yatra")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runBulk("enable")}
              disabled={bulkAction.isPending}
            >
              <Power className="mr-1.5 h-3.5 w-3.5" />
              {__("Enable", "yatra")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runBulk("disable")}
              disabled={bulkAction.isPending}
            >
              <PowerOff className="mr-1.5 h-3.5 w-3.5" />
              {__("Pause", "yatra")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
              onClick={() => runBulk("delete")}
              disabled={bulkAction.isPending}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {__("Delete", "yatra")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(new Set())}
            >
              {__("Clear", "yatra")}
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <ModuleTableSkeleton rows={5} columns={4} />
            </div>
          ) : mappings.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <LinkIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                {__("No mappings yet", "yatra")}
              </h4>
              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
                {channels.length === 0
                  ? __(
                      "Add a channel first, then come back here to map your trips to it.",
                      "yatra",
                    )
                  : __(
                      "Map each trip you want to sell on a channel to its counterpart product on that channel's side.",
                      "yatra",
                    )}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        aria-label={__("Select all", "yatra")}
                      />
                    </th>
                    <Th>{__("Channel", "yatra")}</Th>
                    <Th>{__("Trip", "yatra")}</Th>
                    <Th>{__("External product", "yatra")}</Th>
                    <Th>{__("Offset", "yatra")}</Th>
                    <Th>{__("Sync state", "yatra")}</Th>
                    <Th>{__("Last sync", "yatra")}</Th>
                    <Th align="right">{__("Actions", "yatra")}</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {mappings.map((m) => {
                    const ch = channelById.get(m.channel_id);
                    const isSelected = selected.has(m.id);
                    return (
                      <tr
                        key={m.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                          isSelected ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(m.id)}
                            aria-label={__("Select mapping", "yatra")}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {ch?.display_name ||
                            ch?.channel_type ||
                            `#${m.channel_id}`}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {(() => {
                            const trip = tripsLookup?.get(m.trip_id);
                            const title = trip?.title || `Trip #${m.trip_id}`;
                            const url = trip?.edit_url;
                            return (
                              <div className="flex items-center gap-1.5 min-w-0">
                                {url ? (
                                  <a
                                    href={url}
                                    className="truncate font-medium text-blue-600 hover:underline dark:text-blue-400"
                                    title={title}
                                  >
                                    {title}
                                  </a>
                                ) : (
                                  <span
                                    className="truncate font-medium"
                                    title={title}
                                  >
                                    {title}
                                  </span>
                                )}
                                <code className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                  #{m.trip_id}
                                </code>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {m.external_url ? (
                            <a
                              href={m.external_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {m.external_product_id || "—"}
                              <ExternalLink className="ml-1 inline h-3 w-3" />
                            </a>
                          ) : (
                            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">
                              {m.external_product_id || "—"}
                            </code>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {m.price_offset_percent !== 0
                            ? `${m.price_offset_percent > 0 ? "+" : ""}${m.price_offset_percent}%`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              m.is_active
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                            }
                          >
                            {m.is_active
                              ? __("Active", "yatra")
                              : __("Paused", "yatra")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {m.last_synced_at
                            ? new Date(m.last_synced_at).toLocaleString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditing(m)}
                              title={__("Edit this mapping", "yatra")}
                            >
                              {__("Edit", "yatra")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => syncMapping.mutate(m.id)}
                              disabled={syncMapping.isPending}
                              title={__(
                                "Push inventory + pricing now",
                                "yatra",
                              )}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                              onClick={() =>
                                setPendingDelete({ kind: "one", id: m.id })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmationDialog
        isOpen={pendingDelete !== null}
        onClose={() => {
          if (!deleteMapping.isPending && !bulkAction.isPending) {
            setPendingDelete(null);
          }
        }}
        onConfirm={() => {
          if (!pendingDelete) return;
          if (pendingDelete.kind === "one") {
            deleteMapping.mutate(pendingDelete.id);
          } else {
            bulkAction.mutate({ action: "delete", ids: pendingDelete.ids });
          }
        }}
        title={
          pendingDelete?.kind === "bulk"
            ? __("Delete selected mappings?", "yatra")
            : __("Delete mapping?", "yatra")
        }
        description={
          pendingDelete?.kind === "bulk"
            ? __(
                "Delete {n} mappings? They will stop syncing immediately. Existing bookings are unaffected.",
                "yatra",
              ).replace("{n}", String(pendingDelete.ids.length))
            : __(
                "Delete this mapping? The trip will no longer sync to this channel. Existing bookings already in the inbox are not affected.",
                "yatra",
              )
        }
        confirmText={
          pendingDelete?.kind === "bulk"
            ? __("Delete mappings", "yatra")
            : __("Delete mapping", "yatra")
        }
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={deleteMapping.isPending || bulkAction.isPending}
      />
    </div>
  );
};

/**
 * Searchable single-trip picker for the New Mapping form.
 *
 * Replaces a numeric "Trip ID" input (which required operators to
 * find the database id from the trip-edit URL bar) with a typeahead
 * that hits /trips?search=… and lets them pick by title. Same shape
 * as the multi-trip picker in ApplicableTripSelector but trimmed to
 * the single-select case the mapping form needs.
 *
 * Keeps the trip id as the underlying value (the only thing the
 * mapping API cares about) so the surrounding form code is
 * unchanged: setTrip(id) is the only output.
 */
type TripOption = { id: number; title: string };

const TripPicker: React.FC<{
  value: number;
  onChange: (id: number, label?: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Debounce search so we don't spam /trips on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Close the dropdown when the operator clicks outside the picker.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Auto-focus the search field when the dropdown opens so the
  // operator can start typing immediately.
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  // Result list: search hits /trips?search=. When no search term yet,
  // surface the first page so the operator always has something to
  // pick on first open instead of an empty box.
  const { data: results = [], isFetching } = useQuery<TripOption[]>({
    queryKey: ["channel-manager-trip-picker", debounced],
    queryFn: async () => {
      const params: Record<string, any> = { per_page: 25 };
      if (debounced) params.search = debounced;
      const res: any = await apiClient.get("/trips", { params });
      const items = res?.data?.data || res?.data || res || [];
      if (!Array.isArray(items)) return [];
      return items
        .map((t: any) => ({
          id: Number(t?.id || 0),
          title: String(t?.title || t?.name || `Trip #${t?.id}`),
        }))
        .filter((t: TripOption) => t.id > 0);
    },
    enabled: open,
    staleTime: 60_000,
  });

  // When `value` is set (editing an existing draft or after a pick),
  // look up the matching label so the closed button shows the title
  // rather than just "#42". One-shot lookup; cached by id.
  const { data: selectedTrip } = useQuery<TripOption | null>({
    queryKey: ["channel-manager-trip-picker:resolve", value],
    queryFn: async () => {
      if (!value) return null;
      try {
        const res: any = await apiClient.get(`/trips/${value}`);
        const t = res?.data?.data || res?.data || res || null;
        if (!t || !t.id) return null;
        return {
          id: Number(t.id),
          title: String(t.title || t.name || `Trip #${t.id}`),
        };
      } catch {
        return null;
      }
    },
    enabled: value > 0,
    staleTime: 5 * 60_000,
  });

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 w-full items-center justify-between rounded-md border-2 border-gray-300 bg-white px-4 text-left text-base text-gray-900 transition-colors hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-500"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          {value > 0 ? (
            <>
              <span className="truncate font-medium">
                {selectedTrip?.title || `Trip #${value}`}
              </span>
              <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                #{value}
              </span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              {placeholder || __("Search and select a trip…", "yatra")}
            </span>
          )}
        </span>
        <span className="flex flex-shrink-0 items-center gap-1">
          {value > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(0);
                }
              }}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
              aria-label={__("Clear selection", "yatra")}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-100 p-2 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={__("Type to search trips by title…", "yatra")}
                className="w-full rounded border border-gray-200 bg-white py-1.5 pl-8 pr-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-auto">
            {isFetching ? (
              <div className="flex items-center justify-center p-6 text-sm text-gray-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {__("Searching…", "yatra")}
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {debounced
                  ? __("No trips match that search.", "yatra")
                  : __("No trips found.", "yatra")}
              </div>
            ) : (
              <ul role="listbox" className="py-1">
                {results.map((t) => {
                  const isSelected = t.id === value;
                  return (
                    <li key={t.id} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(t.id, t.title);
                          setOpen(false);
                          setSearch("");
                        }}
                        className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          isSelected
                            ? "bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                            : ""
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate">{t.title}</span>
                          <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                            #{t.id}
                          </span>
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MappingAddForm: React.FC<{
  channels: ChannelRow[];
  defaultChannelId: number;
  onClose: () => void;
}> = ({ channels, defaultChannelId, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [channelId, setChannelId] = useState<number>(defaultChannelId);
  const [tripId, setTripId] = useState<number>(0);
  const [externalProductId, setExternalProductId] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [offset, setOffset] = useState<number>(0);
  const [syncInventory, setSyncInventory] = useState(true);
  const [syncPricing, setSyncPricing] = useState(true);

  const create = useMutation({
    mutationFn: () =>
      channelManagerApi.createMapping({
        channel_id: channelId,
        trip_id: tripId,
        external_product_id: externalProductId,
        external_url: externalUrl,
        price_offset_percent: offset,
        is_active: true,
        sync_inventory: syncInventory,
        sync_pricing: syncPricing,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-mappings"] });
      showToast(__("Mapping created.", "yatra"), "success");
      onClose();
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{__("New trip mapping", "yatra")}</CardTitle>
        <CardDescription>
          {__(
            "Connect one of your trips to a product on the channel. You'll need the channel's product ID — check the channel's partner portal or the URL of the product page.",
            "yatra",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label={__("Channel", "yatra")}
            description={__("Which channel this mapping pushes to.", "yatra")}
          >
            <Select
              value={String(channelId)}
              onChange={(e) => setChannelId(Number(e.target.value))}
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name || c.channel_type}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label={__("Trip", "yatra")}
            description={__(
              "Pick the Yatra trip this mapping pushes to the channel. Start typing the trip title — the list filters as you type.",
              "yatra",
            )}
          >
            <TripPicker
              value={tripId}
              onChange={(id) => setTripId(id)}
              placeholder={__("Search and select a trip…", "yatra")}
            />
          </FormField>

          <FormField
            label={__("Channel product ID", "yatra")}
            description={__(
              "The product's ID on the channel side. For Viator this is a product code (e.g. 12345P1); for GetYourGuide it's the offer/option ID. Copy it from the channel's partner portal.",
              "yatra",
            )}
          >
            <Input
              value={externalProductId}
              onChange={(e) => setExternalProductId(e.target.value)}
              placeholder={__(
                "e.g. 12345P1 (Viator) or 87654 (GetYourGuide)",
                "yatra",
              )}
            />
          </FormField>

          <FormField
            label={__("Public listing URL (optional)", "yatra")}
            description={__(
              "Link to the channel's public listing for this product. Shown as a quick-jump link in the mappings table so you can verify changes after syncing.",
              "yatra",
            )}
          >
            <Input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://www.viator.com/..."
            />
          </FormField>

          <FormField
            label={__("Per-mapping price offset (%)", "yatra")}
            description={__(
              "Overrides the channel's default offset for this trip only. Use 0 to inherit the channel default. Set positive to mark up, negative to discount.",
              "yatra",
            )}
          >
            <Input
              type="number"
              step="0.01"
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value) || 0)}
              placeholder="0"
            />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <ToggleRow
            label={__("Sync inventory", "yatra")}
            description={__(
              "Push seat availability to this channel. Turn off if you're using the channel's own inventory system instead.",
              "yatra",
            )}
            checked={syncInventory}
            onChange={setSyncInventory}
          />
          <ToggleRow
            label={__("Sync pricing", "yatra")}
            description={__(
              "Push prices to this channel. Turn off when prices are managed on the channel side (e.g. for promotions you control there).",
              "yatra",
            )}
            checked={syncPricing}
            onChange={setSyncPricing}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {__("Cancel", "yatra")}
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={
              create.isPending ||
              channelId <= 0 ||
              tripId <= 0 ||
              externalProductId.trim() === ""
            }
          >
            {create.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-1.5 h-4 w-4" />
            )}
            {__("Create mapping", "yatra")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Full-edit form for an existing mapping. Backs the row-level
 * "Edit" button — previously the operator could only delete +
 * recreate, which is destructive and loses sync history.
 *
 * Editable fields mirror what the server's update endpoint
 * accepts: external_product_id, external_url, price_offset_percent,
 * is_active, sync_inventory, sync_pricing. Channel and trip IDs are
 * intentionally immutable — re-pointing a mapping to a different
 * trip is a different mapping; delete + create instead.
 */
const MappingEditForm: React.FC<{
  channels: ChannelRow[];
  existing: MappingRow;
  onClose: () => void;
}> = ({ channels, existing, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [externalProductId, setExternalProductId] = useState(
    existing.external_product_id ?? "",
  );
  const [externalUrl, setExternalUrl] = useState(existing.external_url ?? "");
  const [offset, setOffset] = useState<number>(
    existing.price_offset_percent ?? 0,
  );
  const [isActive, setIsActive] = useState<boolean>(existing.is_active);
  const [syncInventory, setSyncInventory] = useState<boolean>(
    existing.sync_inventory,
  );
  const [syncPricing, setSyncPricing] = useState<boolean>(
    existing.sync_pricing,
  );

  const channel = channels.find((c) => c.id === existing.channel_id);

  const save = useMutation({
    mutationFn: () =>
      channelManagerApi.updateMapping(existing.id, {
        external_product_id: externalProductId,
        external_url: externalUrl,
        price_offset_percent: offset,
        is_active: isActive,
        sync_inventory: syncInventory,
        sync_pricing: syncPricing,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-mappings"] });
      showToast(__("Mapping saved.", "yatra"), "success");
      onClose();
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const sync = useMutation({
    mutationFn: () => channelManagerApi.syncMapping(existing.id),
    onSuccess: (res) =>
      showToast(
        res.ok
          ? __("Synced.", "yatra")
          : res.error || __("Sync failed.", "yatra"),
        res.ok ? "success" : "error",
      ),
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {__("Edit mapping", "yatra")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {__(
              "Channel and trip are locked once a mapping exists. Delete + recreate if you need to re-point this mapping elsewhere.",
              "yatra",
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
          >
            {sync.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-4 w-4" />
            )}
            {__("Sync now", "yatra")}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {__("Back to list", "yatra")}
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            {__("Save changes", "yatra")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{__("Mapping link", "yatra")}</CardTitle>
          <CardDescription>
            {__(
              "How this trip maps to the channel's product. Updating the external product ID re-points subsequent syncs but does not retroactively affect bookings already received.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label={__("Channel", "yatra")}
              description={__(
                "Immutable. To move this trip to a different channel, delete this mapping and create a new one.",
                "yatra",
              )}
            >
              <Input
                value={
                  channel?.display_name ||
                  channel?.channel_type ||
                  `#${existing.channel_id}`
                }
                disabled
              />
            </FormField>

            <FormField
              label={__("Trip ID", "yatra")}
              description={__("Immutable. One trip per channel.", "yatra")}
            >
              <Input value={`#${existing.trip_id}`} disabled />
            </FormField>

            <FormField
              label={__("Channel product ID", "yatra")}
              description={__(
                "The product's ID on the channel side. Editing this re-points the mapping — all future syncs target the new product. Existing bookings already received are not modified.",
                "yatra",
              )}
            >
              <Input
                value={externalProductId}
                onChange={(e) => setExternalProductId(e.target.value)}
              />
            </FormField>

            <FormField
              label={__("Public listing URL (optional)", "yatra")}
              description={__(
                "Quick-jump link shown in the mappings table.",
                "yatra",
              )}
            >
              <Input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
            </FormField>

            <FormField
              label={__("Per-mapping price offset (%)", "yatra")}
              description={__(
                "Overrides the channel's default offset for this trip only. 0 inherits the channel default.",
                "yatra",
              )}
            >
              <Input
                type="number"
                step="0.01"
                value={offset}
                onChange={(e) => setOffset(Number(e.target.value) || 0)}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{__("Sync controls", "yatra")}</CardTitle>
          <CardDescription>
            {__(
              "Pause or partially-sync this mapping without losing its configuration. Pausing keeps all settings; flipping it back resumes from where it left off.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label={__("Active", "yatra")}
            description={__(
              "When off, this mapping won't push inventory or pricing, and bookings received for it are still ingested (so cancellations of pre-existing bookings keep working).",
              "yatra",
            )}
            checked={isActive}
            onChange={setIsActive}
          />
          <ToggleRow
            label={__("Sync inventory", "yatra")}
            description={__(
              "Push seat availability to this channel. Turn off when the channel manages its own inventory.",
              "yatra",
            )}
            checked={syncInventory}
            onChange={setSyncInventory}
          />
          <ToggleRow
            label={__("Sync pricing", "yatra")}
            description={__(
              "Push prices to this channel. Turn off for channels that run their own promotions.",
              "yatra",
            )}
            checked={syncPricing}
            onChange={setSyncPricing}
          />
        </CardContent>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Bookings tab                                                              */
/* -------------------------------------------------------------------------- */

const BookingsSection: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["channel-manager-bookings"],
    queryFn: () => channelManagerApi.listBookings({ per_page: 100 }),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }
  const rows = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Inbox className="h-5 w-5 text-blue-500" />
          {__("Bookings inbox", "yatra")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-3xl">
          {__(
            "Every booking received from connected OTAs lands here. The flow is two-phase for safety: bookings are first staged (received), then promoted into the main booking list. Promoted bookings go through the same notifications, payments and reporting as direct sales.",
            "yatra",
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <StatusLegend
            color="blue"
            label={__("received", "yatra")}
            description={__("staged — not yet a real booking", "yatra")}
          />
          <StatusLegend
            color="green"
            label={__("promoted", "yatra")}
            description={__("live booking, visible everywhere", "yatra")}
          />
          <StatusLegend
            color="red"
            label={__("failed", "yatra")}
            description={__(
              "promotion failed — check the error column",
              "yatra",
            )}
          />
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Inbox className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                {__("No channel bookings yet", "yatra")}
              </h4>
              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
                {__(
                  "When an OTA sends a booking webhook, it'll appear here within seconds. The list auto-refreshes every 30 seconds while this tab is open.",
                  "yatra",
                )}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <Th>{__("Channel ref", "yatra")}</Th>
                    <Th>{__("Customer", "yatra")}</Th>
                    <Th>{__("Departure", "yatra")}</Th>
                    <Th>{__("Travelers", "yatra")}</Th>
                    <Th>{__("Amount", "yatra")}</Th>
                    <Th>{__("Status", "yatra")}</Th>
                    <Th>{__("Booking ID", "yatra")}</Th>
                    <Th>{__("Received", "yatra")}</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rows.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 text-xs font-mono">
                        {b.external_booking_id}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-gray-900 dark:text-white">
                          {b.customer_name || "—"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {b.customer_email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                        {b.departure_date || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">{b.travelers_total}</td>
                      <td className="px-4 py-3 text-sm">
                        {b.currency} {Number(b.total_amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            b.processing_status === "promoted"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : b.processing_status === "failed"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }
                        >
                          {b.processing_status}
                        </Badge>
                        {b.error_message && (
                          <div className="mt-1 text-xs text-red-600 dark:text-red-400 max-w-xs truncate">
                            {b.error_message}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {b.yatra_booking_id ? `#${b.yatra_booking_id}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(b.received_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Reconciliation tab                                                        */
/*                                                                            */
/*  Cross-channel "where do I have unfinished business?" view. Pre-aggregated */
/*  on the server so this is one HTTP call, not channel-by-channel polling.   */
/*  Drives the "needs_attention" badges on each channel card.                 */
/* -------------------------------------------------------------------------- */

const ReconciliationSection: React.FC = () => {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["cm-reconciliation"],
    queryFn: () => channelManagerApi.getReconciliation(),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }
  const report = data?.data;
  if (!report) return null;
  const t = report.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {__("Reconciliation report", "yatra")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {__(
              "Generated on demand from the sync log + mapping + booking tables. Refresh to recompute.",
              "yatra",
            )}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {sprintf(
              /* translators: %s: timestamp */
              __("Generated at %s", "yatra"),
              report.generated_at,
            )}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`}
          />
          {__("Refresh", "yatra")}
        </Button>
      </div>

      {/* Global totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label={__("Channels enabled", "yatra")}
          value={`${t.channels.enabled} / ${t.channels.total}`}
          icon={<Network className="h-4 w-4 text-blue-500" />}
        />
        <KpiCard
          label={__("Active mappings", "yatra")}
          value={t.mappings_active}
          icon={<LinkIcon className="h-4 w-4 text-indigo-500" />}
        />
        <KpiCard
          label={__("Stale mappings", "yatra")}
          value={t.inventory_stale}
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          tone={t.inventory_stale > 0 ? "warn" : "ok"}
        />
        <KpiCard
          label={__("Open breakers", "yatra")}
          value={t.breakers_open}
          icon={<PowerOff className="h-4 w-4 text-red-500" />}
          tone={t.breakers_open > 0 ? "bad" : "ok"}
        />
        <KpiCard
          label={__("Pending booking promotions", "yatra")}
          value={t.bookings_pending}
          icon={<Inbox className="h-4 w-4 text-purple-500" />}
          tone={t.bookings_pending > 0 ? "warn" : "ok"}
        />
        <KpiCard
          label={__("Failed booking promotions (7d)", "yatra")}
          value={t.bookings_failed_7d}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          tone={t.bookings_failed_7d > 0 ? "bad" : "ok"}
        />
        <KpiCard
          label={__("Syncs OK (24h)", "yatra")}
          value={t.syncs_24h.success}
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
        />
        <KpiCard
          label={__("Syncs failed (24h)", "yatra")}
          value={t.syncs_24h.failed}
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          tone={t.syncs_24h.failed > 0 ? "warn" : "ok"}
        />
      </div>

      {/* Per-channel breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {__("Per channel", "yatra")}
          </CardTitle>
          <CardDescription>
            {__(
              "Channels marked “Needs attention” have stale mappings, pending bookings, recent failures, or a tripped breaker.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    {__("Channel", "yatra")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    {__("Mappings", "yatra")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    {__("Bookings", "yatra")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    {__("Syncs (24h)", "yatra")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    {__("Breaker", "yatra")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    {__("Latest failure", "yatra")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    {__("Status", "yatra")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {report.channels.map((c) => (
                  <tr
                    key={c.channel.id}
                    className={
                      c.needs_attention
                        ? "bg-amber-50/40 dark:bg-amber-900/10"
                        : ""
                    }
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {c.channel.display_name || `#${c.channel.id}`}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {c.channel.type}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {sprintf(__("%d active", "yatra"), c.mappings.active)}
                      {c.mappings.stale > 0 && (
                        <div className="text-amber-600 dark:text-amber-400 mt-0.5">
                          {sprintf(__("%d stale", "yatra"), c.mappings.stale)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {c.bookings.pending > 0 ? (
                        <div className="text-amber-600 dark:text-amber-400">
                          {sprintf(
                            __("%d pending", "yatra"),
                            c.bookings.pending,
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                      {c.bookings.failed_7d > 0 && (
                        <div className="text-red-600 dark:text-red-400">
                          {sprintf(
                            __("%d failed (7d)", "yatra"),
                            c.bookings.failed_7d,
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className="text-green-700 dark:text-green-400">
                        {c.syncs.success_24h} OK
                      </span>
                      {c.syncs.failed_24h > 0 && (
                        <>
                          {" / "}
                          <span className="text-red-700 dark:text-red-400">
                            {c.syncs.failed_24h} fail
                          </span>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <Badge
                        className={
                          c.breaker.state === "closed"
                            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        }
                      >
                        {c.breaker.state}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300 max-w-sm">
                      {c.latest_failure ? (
                        <>
                          <div className="font-mono">
                            {c.latest_failure.operation}
                            {c.latest_failure.http_status !== null
                              ? ` (${c.latest_failure.http_status})`
                              : ""}
                          </div>
                          <div className="text-gray-500 truncate">
                            {c.latest_failure.error_message}
                          </div>
                          <div className="text-gray-400 text-[10px] mt-0.5">
                            {c.latest_failure.occurred_at}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {c.needs_attention ? (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {__("Needs attention", "yatra")}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {__("Healthy", "yatra")}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const KpiCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "ok" | "warn" | "bad";
}> = ({ label, value, icon, tone = "ok" }) => {
  const ring =
    tone === "bad"
      ? "border-red-200 dark:border-red-800"
      : tone === "warn"
        ? "border-amber-200 dark:border-amber-800"
        : "border-gray-200 dark:border-gray-700";
  return (
    <div className={`rounded-md border ${ring} bg-white dark:bg-gray-900 p-3`}>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
        {value}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Latency tab — avg / p50 / p95 / p99 across windows                        */
/* -------------------------------------------------------------------------- */

const LatencySection: React.FC = () => {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["cm-latency"],
    queryFn: () => channelManagerApi.getLatency(),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }
  const report = data?.data;
  if (!report) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {__("Sync latency", "yatra")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {__(
              "Percentiles over the duration_ms column of the sync log. Nearest-rank percentiles capped at ",
              "yatra",
            )}
            {report.sample_cap}{" "}
            {__("recent samples per channel per window.", "yatra")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`}
          />
          {__("Refresh", "yatra")}
        </Button>
      </div>

      <LatencyTable
        title={__("Global", "yatra")}
        rows={[
          {
            label: __("Last 24h", "yatra"),
            window: report.global.last_24h,
          },
          {
            label: __("Last 7d", "yatra"),
            window: report.global.last_7d,
          },
        ]}
      />

      <LatencyTable
        title={__("Per provider", "yatra")}
        rows={report.per_provider.flatMap((p) => [
          {
            label: `${p.provider} · ${__("24h", "yatra")}`,
            window: p.last_24h,
          },
          { label: `${p.provider} · ${__("7d", "yatra")}`, window: p.last_7d },
        ])}
      />

      <LatencyTable
        title={__("Per channel", "yatra")}
        rows={report.per_channel.flatMap((c) => [
          {
            label: `${c.channel.display_name || `#${c.channel.id}`} · ${__("24h", "yatra")}`,
            window: c.last_24h,
          },
          {
            label: `${c.channel.display_name || `#${c.channel.id}`} · ${__("7d", "yatra")}`,
            window: c.last_7d,
          },
        ])}
      />
    </div>
  );
};

const LatencyTable: React.FC<{
  title: string;
  rows: Array<{
    label: string;
    window: {
      samples: number;
      avg_ms: number | null;
      p50_ms: number | null;
      p95_ms: number | null;
      p99_ms: number | null;
      success_count: number;
      fail_count: number;
    };
  }>;
}> = ({ title, rows }) => {
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                  {__("Scope", "yatra")}
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                  {__("Samples", "yatra")}
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                  {__("Avg", "yatra")}
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                  p50
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                  p95
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                  p99
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                  {__("OK / Fail", "yatra")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rows.map((r, idx) => (
                <tr key={`${r.label}-${idx}`}>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">
                    {r.label}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.window.samples}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtMs(r.window.avg_ms)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtMs(r.window.p50_ms)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtMs(r.window.p95_ms)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtMs(r.window.p99_ms)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    <span className="text-green-700 dark:text-green-400">
                      {r.window.success_count}
                    </span>
                    {" / "}
                    <span className="text-red-700 dark:text-red-400">
                      {r.window.fail_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

function fmtMs(v: number | null): string {
  if (v === null || v === undefined) return "—";
  if (v >= 1000) return `${(v / 1000).toFixed(2)}s`;
  return `${v} ms`;
}

/* -------------------------------------------------------------------------- */
/*  Logs tab                                                                  */
/* -------------------------------------------------------------------------- */

const LogsSection: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["channel-manager-logs"],
    queryFn: () => channelManagerApi.listLogs({ per_page: 200 }),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }
  const rows = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          {__("Sync activity", "yatra")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-3xl">
          {__(
            "Every push (you → channel), pull (channel → you), and inbound webhook from the last 90 days. Filter by failed status when debugging a sync; the error column carries the exact response from the OTA's API.",
            "yatra",
          )}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-start gap-1.5">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>
            {__(
              "Auto-refreshes every 15 seconds while open. Rows older than 90 days are purged automatically by a daily cron.",
              "yatra",
            )}
          </span>
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {__(
                "No activity yet — enable a channel and create a mapping to start seeing events here.",
                "yatra",
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <Th>{__("When", "yatra")}</Th>
                    <Th>{__("Channel", "yatra")}</Th>
                    <Th>{__("Operation", "yatra")}</Th>
                    <Th>{__("Status", "yatra")}</Th>
                    <Th>{__("Duration", "yatra")}</Th>
                    <Th>{__("Summary / Error", "yatra")}</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {row.channel_id ? `#${row.channel_id}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {row.direction}/{row.operation}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            row.status === "success"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {row.duration_ms != null ? `${row.duration_ms}ms` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-200 max-w-md">
                        <div className="truncate">
                          {row.error_message || row.summary || "—"}
                        </div>
                        {row.http_status != null && (
                          <div className="mt-0.5 text-[10px] text-gray-400">
                            HTTP {row.http_status}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Reusable form pieces                                                      */
/* -------------------------------------------------------------------------- */

const FormField: React.FC<{
  label: string;
  description?: string;
  children: React.ReactNode;
}> = ({ label, description, children }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    {children}
    {description && (
      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
        <span>{description}</span>
      </p>
    )}
  </div>
);

const ToggleRow: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  tone?: "default" | "amber";
}> = ({ label, description, checked, onChange, tone = "default" }) => {
  const baseBg =
    tone === "amber" && checked
      ? "border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-950/30"
      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900";
  return (
    <label
      className={`flex items-start gap-3 cursor-pointer rounded-md border px-3 py-2.5 transition-colors ${baseBg}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <span className="flex-1">
        <span className="block text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </span>
        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </span>
      </span>
    </label>
  );
};

const StatusLegend: React.FC<{
  color: "blue" | "green" | "red";
  label: string;
  description: string;
}> = ({ color, label, description }) => {
  const cls =
    color === "green"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : color === "red"
        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge className={cls}>{label}</Badge>
      <span className="text-gray-500 dark:text-gray-400">{description}</span>
    </span>
  );
};

const Th: React.FC<{
  children: React.ReactNode;
  align?: "left" | "right";
}> = ({ children, align = "left" }) => (
  <th
    className={`px-4 py-3 text-${align} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}
  >
    {children}
  </th>
);

/**
 * Per-channel health pill. Status comes from the server combining
 * the last-10 log outcomes with the circuit-breaker state. Tooltip
 * surfaces the raw counts + breaker reason so the operator can
 * diagnose without digging into the Logs tab.
 */
const HealthBadge: React.FC<{ health?: ChannelHealth }> = ({ health }) => {
  if (!health) {
    return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
  }
  const { status, breaker, recent } = health;
  const cls =
    status === "green"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : status === "amber"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

  const breakerLabel =
    breaker.state === "open"
      ? __("circuit open", "yatra")
      : breaker.state === "half_open"
        ? __("recovering", "yatra")
        : "";

  const tooltip = [
    recent.total > 0
      ? __("Last {total}: {ok} OK, {fail} failed.", "yatra")
          .replace("{total}", String(recent.total))
          .replace("{ok}", String(recent.ok))
          .replace("{fail}", String(recent.fail))
      : __("No recent activity.", "yatra"),
    breaker.state !== "closed"
      ? __("Circuit: {state}.", "yatra").replace("{state}", breaker.state) +
        (breaker.last_failure ? ` — ${breaker.last_failure}` : "")
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const label =
    status === "green"
      ? __("Healthy", "yatra")
      : status === "amber"
        ? __("Degraded", "yatra")
        : __("Failing", "yatra");

  return (
    <span className="inline-flex items-center gap-1.5" title={tooltip}>
      <Badge className={cls}>
        <Activity className="mr-1 h-3 w-3" />
        {label}
      </Badge>
      {breakerLabel && (
        <span className="text-[10px] text-red-600 dark:text-red-400">
          {breakerLabel}
        </span>
      )}
    </span>
  );
};

function extractError(e: any): string {
  if (!e) return "Request failed.";
  const data = e?.response?.data ?? e?.data ?? null;
  if (
    data &&
    typeof data === "object" &&
    typeof (data as any).message === "string"
  ) {
    return (data as any).message;
  }
  return e?.message || "Request failed.";
}

export default ChannelManager;
