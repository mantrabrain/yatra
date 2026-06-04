import { r as reactExports, u as useQuery, j as jsxRuntimeExports, N as Network, bX as Link, O as Inbox, ar as Clock, Q as AlertTriangle, A as Activity, aF as Info, Z as Zap, a_ as Globe, bz as ShieldCheck, T as TrendingUp, bY as Layers, C as Crown, V as ExternalLink, br as Settings2, t as useQueryClient, v as useMutation, aw as Plus, aN as Trash2, J as RefreshCw, bZ as Power, b_ as PowerOff, D as Loader2, aD as CheckCircle2, aE as HelpCircle, bh as Send, aV as Save, bu as EyeOff, aQ as Eye, aG as Copy, ax as X, x as ChevronDown, aO as Search, aA as Check } from "./react-vendor-zODANjVp.js";
import { a as apiClient, _ as __, u as useToast, s as sprintf } from "./index-zauBMzvd.js";
import { P as PageHeader, C as Card, d as CardContent, f as CardHeader, g as CardTitle, h as CardDescription, B as Button, e as Badge, k as ConfirmationDialog, S as Select, I as Input, w as Label } from "../../admin/dist/js/app.js";
import { M as ModulePageSkeleton, b as ModuleListSkeleton, c as ModuleTableSkeleton } from "./module-skeleton-7zwRYol6.js";
const channelManagerApi = {
  getMeta: () => apiClient.get("/channel-manager/meta"),
  listChannels: () => apiClient.get("/channel-manager/channels"),
  createChannel: (payload) => apiClient.post("/channel-manager/channels", payload),
  updateChannel: (id, payload) => apiClient.put(`/channel-manager/channels/${id}`, payload),
  deleteChannel: (id) => apiClient.delete(`/channel-manager/channels/${id}`),
  updateCredential: (id, field, value) => apiClient.put(`/channel-manager/channels/${id}/credential`, {
    field,
    value
  }),
  testConnection: (id) => apiClient.post(
    `/channel-manager/channels/${id}/test-connection`,
    {}
  ),
  syncChannel: (id) => apiClient.post(`/channel-manager/channels/${id}/sync`, {}),
  channelHealth: (id) => apiClient.get(`/channel-manager/channels/${id}/health`),
  testWebhook: (id) => apiClient.post(
    `/channel-manager/channels/${id}/test-webhook`,
    {}
  ),
  bulkMappings: (action, ids) => apiClient.post("/channel-manager/mappings/bulk", {
    action,
    ids
  }),
  listMappings: (channelId) => apiClient.get("/channel-manager/mappings", {
    params: channelId ? { channel_id: channelId } : {}
  }),
  createMapping: (payload) => apiClient.post("/channel-manager/mappings", payload),
  updateMapping: (id, payload) => apiClient.put(`/channel-manager/mappings/${id}`, payload),
  deleteMapping: (id) => apiClient.delete(`/channel-manager/mappings/${id}`),
  syncMapping: (id) => apiClient.post(`/channel-manager/mappings/${id}/sync`, {}),
  listBookings: (filters = {}) => apiClient.get("/channel-manager/bookings", { params: filters }),
  listLogs: (filters = {}) => apiClient.get("/channel-manager/logs", { params: filters }),
  /* --------------------- reconciliation report --------------------- */
  /** Cross-channel snapshot — flags inventory staleness, pending
   *  booking promotions, sync success/fail counts, and breaker states.
   *  Suitable both for the React reconciliation tab AND for external
   *  monitoring polling. */
  getReconciliation: () => apiClient.get("/channel-manager/reconciliation"),
  /** Per-channel + per-provider + global latency aggregation. avg /
   *  p50 / p95 / p99 of duration_ms across 24h and 7d windows. */
  getLatency: () => apiClient.get("/channel-manager/latency")
};
function getInitialTab() {
  if (typeof window === "undefined") return "channels";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab === "mappings" || tab === "bookings" || tab === "logs" || tab === "reconciliation" || tab === "latency")
    return tab;
  return "channels";
}
const ChannelManager = () => {
  const [activeTab, setActiveTab] = reactExports.useState(() => getInitialTab());
  const switchTab = (next) => {
    setActiveTab(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState({}, "", url.toString());
    }
  };
  const { data: meta, isLoading: metaLoading } = useQuery({
    queryKey: ["channel-manager-meta"],
    queryFn: () => channelManagerApi.getMeta()
  });
  if (metaLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ModulePageSkeleton, { variant: "tabs" });
  }
  if (!meta || !meta.is_eligible) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        PageHeader,
        {
          description: __(
            "Distribute your tours on global OTAs from one dashboard. Push inventory and pricing automatically, receive bookings back into a unified inbox.",
            "yatra"
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AboutCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(UpgradeCard, { meta })
    ] });
  }
  const ready = Boolean(meta.is_module_enabled);
  const tabs = [
    { key: "channels", label: __("Channels", "yatra"), icon: Network },
    { key: "mappings", label: __("Trip mappings", "yatra"), icon: Link },
    { key: "bookings", label: __("Bookings inbox", "yatra"), icon: Inbox },
    { key: "logs", label: __("Sync activity", "yatra"), icon: Clock },
    // Reconciliation answers "where do I have unfinished business?" —
    // stale mappings, pending booking promotions, breaker states.
    {
      key: "reconciliation",
      label: __("Reconciliation", "yatra"),
      icon: AlertTriangle
    },
    // Latency answers "are my OTAs slow today?" — p50/p95/p99 of
    // sync durations across 24h + 7d windows.
    { key: "latency", label: __("Latency", "yatra"), icon: Activity }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        description: __(
          "Distribute your tours on global OTAs from one dashboard. Push inventory and pricing automatically, receive bookings back into a unified inbox.",
          "yatra"
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AboutCard, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex flex-wrap gap-1 px-4", children: tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.key;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => switchTab(tab.key),
            className: `flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${active ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-4 h-4" }),
              tab.label
            ]
          },
          tab.key
        );
      }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: !ready ? /* @__PURE__ */ jsxRuntimeExports.jsx(ModulePrompt, {}) : activeTab === "channels" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChannelsSection, { meta }) : activeTab === "mappings" ? /* @__PURE__ */ jsxRuntimeExports.jsx(MappingsSection, {}) : activeTab === "bookings" ? /* @__PURE__ */ jsxRuntimeExports.jsx(BookingsSection, {}) : activeTab === "reconciliation" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ReconciliationSection, {}) : activeTab === "latency" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LatencySection, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(LogsSection, {}) })
    ] })
  ] });
};
const AboutCard = () => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-blue-200 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-5 w-5 text-blue-600 dark:text-blue-400" }),
      __("What is a Channel Manager?", "yatra")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "mt-2 leading-relaxed", children: [
      __(
        "OTAs (Online Travel Agencies) — Viator, GetYourGuide, Klook, TripAdvisor, Airbnb Experiences — drive 30–60% of bookings for most tour operators. Managing them by hand means updating inventory and prices in multiple dashboards, copy-pasting bookings between systems, and risking overbooking when seats sell on two channels at once.",
        "yatra"
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
      __(
        "This module connects directly to each OTA's API. Inventory + pricing are pushed automatically whenever a booking, departure, or availability change happens here. Bookings made on the OTA flow back into the same booking list as direct sales — same customer notifications, same revenue reporting, same automation rules.",
        "yatra"
      )
    ] })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        HowItWorksStep,
        {
          icon: Network,
          step: 1,
          title: __("Connect a channel", "yatra"),
          body: __(
            "Add an OTA, paste in your provider credentials, and set commission + price offset. Start in sandbox mode until your first test booking flows through.",
            "yatra"
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        HowItWorksStep,
        {
          icon: Link,
          step: 2,
          title: __("Map your trips", "yatra"),
          body: __(
            "For each trip you want to sell on that OTA, link it to its counterpart product on their side. One trip can map to many channels with different prices and inventory rules.",
            "yatra"
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        HowItWorksStep,
        {
          icon: Zap,
          step: 3,
          title: __("Sync runs automatically", "yatra"),
          body: __(
            "Inventory and pricing push within seconds of any change. Bookings arrive via webhook, are staged for safety, then promoted into the standard booking list — instantly visible everywhere else.",
            "yatra"
          )
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ValueCallout,
        {
          icon: Globe,
          title: __("Reach new customers", "yatra"),
          body: __(
            "OTAs market your trips to millions of travelers worldwide.",
            "yatra"
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ValueCallout,
        {
          icon: ShieldCheck,
          title: __("No overbooking", "yatra"),
          body: __(
            "Real-time inventory keeps stock in sync across every channel.",
            "yatra"
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ValueCallout,
        {
          icon: TrendingUp,
          title: __("Smart pricing", "yatra"),
          body: __(
            "Per-channel offsets cover commission while keeping margins.",
            "yatra"
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ValueCallout,
        {
          icon: Layers,
          title: __("Bring your own credentials", "yatra"),
          body: __(
            "Connections go direct to the OTA. No proxying, no markup.",
            "yatra"
          )
        }
      )
    ] })
  ] })
] });
const HowItWorksStep = ({ icon: Icon, step, title, body }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-blue-200/70 bg-white p-4 dark:border-blue-800/60 dark:bg-gray-900", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white", children: step }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 text-blue-600 dark:text-blue-400" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: title })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed text-gray-600 dark:text-gray-300", children: body })
] });
const ValueCallout = ({ icon: Icon, title, body }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 text-blue-500" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: "text-xs font-semibold text-gray-900 dark:text-white", children: title })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-gray-600 dark:text-gray-400", children: body })
] });
const UpgradeCard = ({ meta }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "max-w-3xl", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md bg-purple-100 p-2 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Channel Manager — Scale plan", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "mt-1", children: __(
        "Available on the Scale plan. Standalone channel managers charge $99–299/month for the same capability — it's included here at no extra cost.",
        "yatra"
      ) })
    ] })
  ] }) }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "a",
    {
      href: (meta == null ? void 0 : meta.upgrade_url) || "https://wpyatra.com/pricing?module=channel-manager",
      target: "_blank",
      rel: "noopener noreferrer",
      children: [
        __("Upgrade to Scale", "yatra"),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "ml-2 h-4 w-4" })
      ]
    }
  ) }) })
] });
const ModulePrompt = () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" }),
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-amber-900 dark:text-amber-100", children: __("Enable the Channel Manager module", "yatra") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-amber-800/90 dark:text-amber-200/90", children: __(
      "Your license tier qualifies. Turn on Channel Manager under Modules to start configuring it.",
      "yatra"
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        asChild: true,
        variant: "outline",
        className: "mt-3 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "admin.php?page=yatra&subpage=modules", children: __("Open Modules", "yatra") })
      }
    )
  ] })
] }) });
const ChannelsSection = ({ meta }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editing, setEditing] = reactExports.useState(null);
  const [pendingDeleteChannel, setPendingDeleteChannel] = reactExports.useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["channel-manager-channels"],
    queryFn: () => channelManagerApi.listChannels()
  });
  const deleteChannel = useMutation({
    mutationFn: (id) => channelManagerApi.deleteChannel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-channels"] });
      showToast(__("Channel deleted.", "yatra"), "success");
      setPendingDeleteChannel(null);
    },
    onError: (e) => {
      showToast(extractError(e), "error");
      setPendingDeleteChannel(null);
    }
  });
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ModuleListSkeleton, { rows: 4 });
  }
  if (editing !== null) {
    const channel = editing === "new" ? null : (data == null ? void 0 : data.data.find((c) => c.id === editing)) ?? null;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      ChannelEditForm,
      {
        meta,
        existing: channel,
        onClose: () => setEditing(null)
      }
    );
  }
  const channels = (data == null ? void 0 : data.data) ?? [];
  const supportedChannelNames = meta.channel_types.map((t) => t.name).join(", ");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Configured channels", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __(
          "Add one connection per OTA you want to distribute on. Credentials are stored libsodium-encrypted; nothing is proxied through any third-party service.",
          "yatra"
        ) }),
        meta.channel_types.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-gray-500 dark:text-gray-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-700 dark:text-gray-300", children: __("Supported OTAs:", "yatra") }),
          " ",
          supportedChannelNames
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setEditing("new"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
        __("Add channel", "yatra")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: channels.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyChannels, { onAdd: () => setEditing("new"), meta }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50 dark:bg-gray-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Channel", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Account", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Health", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Mode", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Status", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Last sync", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { align: "right", children: __("Actions", "yatra") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: channels.map((ch) => {
        const type = meta.channel_types.find(
          (t) => t.type === ch.channel_type
        );
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "tr",
          {
            className: "hover:bg-gray-50 dark:hover:bg-gray-800/50",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Network, { className: "h-4 w-4 text-purple-500" }),
                  (type == null ? void 0 : type.name) ?? ch.channel_type
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: ch.display_name || "—" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm text-gray-700 dark:text-gray-200", children: ch.account_label || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(HealthBadge, { health: ch.health }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  className: ch.is_test_mode ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                  children: ch.is_test_mode ? __("Sandbox", "yatra") : __("Live", "yatra")
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  className: ch.is_enabled ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                  children: ch.is_enabled ? __("Enabled", "yatra") : __("Disabled", "yatra")
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3 text-xs text-gray-500 dark:text-gray-400", children: [
                ch.last_sync_at ? new Date(ch.last_sync_at).toLocaleString() : "—",
                ch.last_sync_status === "failed" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 inline-flex items-center gap-1 text-red-600", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "h-3 w-3" }),
                  __("failed", "yatra")
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    onClick: () => setEditing(ch.id),
                    children: __("Edit", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    className: "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30",
                    onClick: () => setPendingDeleteChannel({
                      id: ch.id,
                      name: ch.display_name || ch.channel_type
                    }),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" })
                  }
                )
              ] }) })
            ]
          },
          ch.id
        );
      }) })
    ] }) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: pendingDeleteChannel !== null,
        onClose: () => {
          if (!deleteChannel.isPending) setPendingDeleteChannel(null);
        },
        onConfirm: () => {
          if (pendingDeleteChannel)
            deleteChannel.mutate(pendingDeleteChannel.id);
        },
        title: __("Delete channel?", "yatra"),
        description: pendingDeleteChannel ? __(
          "Delete the “{name}” channel? Credentials and trip mappings linked to it will be removed. This cannot be undone.",
          "yatra"
        ).replace("{name}", pendingDeleteChannel.name) : "",
        confirmText: __("Delete channel", "yatra"),
        cancelText: __("Cancel", "yatra"),
        variant: "danger",
        isLoading: deleteChannel.isPending
      }
    )
  ] });
};
const EmptyChannels = ({ onAdd, meta }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-10 text-center", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Network, { className: "h-7 w-7 text-blue-600 dark:text-blue-400" }) }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-base font-semibold text-gray-900 dark:text-white", children: __("No channels yet", "yatra") }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400", children: __(
    "Connect your first OTA to start distributing trips. You'll need API credentials from that OTA's partner portal — there's a help link inside the form.",
    "yatra"
  ) }),
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex justify-center gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: onAdd, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
      __("Add your first channel", "yatra")
    ] }),
    meta.docs_url && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: meta.docs_url, target: "_blank", rel: "noopener noreferrer", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(HelpCircle, { className: "mr-1.5 h-4 w-4" }),
      __("Read the setup guide", "yatra")
    ] }) })
  ] })
] });
const ChannelEditForm = ({ meta, existing, onClose }) => {
  var _a, _b;
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isCreate = existing === null;
  const [channelType, setChannelType] = reactExports.useState(
    (existing == null ? void 0 : existing.channel_type) ?? ((_a = meta.channel_types[0]) == null ? void 0 : _a.type) ?? ""
  );
  const [displayName, setDisplayName] = reactExports.useState((existing == null ? void 0 : existing.display_name) ?? "");
  const [accountLabel, setAccountLabel] = reactExports.useState(
    (existing == null ? void 0 : existing.account_label) ?? ""
  );
  const [isEnabled, setIsEnabled] = reactExports.useState((existing == null ? void 0 : existing.is_enabled) ?? false);
  const [isTestMode, setIsTestMode] = reactExports.useState((existing == null ? void 0 : existing.is_test_mode) ?? true);
  const [currency, setCurrency] = reactExports.useState((existing == null ? void 0 : existing.currency) ?? "USD");
  const [defaultOffset, setDefaultOffset] = reactExports.useState(
    (existing == null ? void 0 : existing.default_offset_percent) ?? 0
  );
  const [commission, setCommission] = reactExports.useState(
    (existing == null ? void 0 : existing.commission_percent) ?? 0
  );
  const [buffer, setBuffer] = reactExports.useState((existing == null ? void 0 : existing.inventory_buffer) ?? 0);
  const [allowedIps, setAllowedIps] = reactExports.useState(
    ((_b = existing == null ? void 0 : existing.settings) == null ? void 0 : _b.allowed_ips) ?? ""
  );
  const typeDef = reactExports.useMemo(
    () => meta.channel_types.find((t) => t.type === channelType) ?? null,
    [meta.channel_types, channelType]
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
          ...(existing == null ? void 0 : existing.settings) ?? {},
          allowed_ips: allowedIps
        }
      };
      return isCreate ? channelManagerApi.createChannel(payload) : channelManagerApi.updateChannel(existing.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-channels"] });
      showToast(
        isCreate ? __("Channel created. Add credentials next to enable sync.", "yatra") : __("Channel saved.", "yatra"),
        "success"
      );
      if (isCreate) onClose();
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const testConnection = useMutation({
    mutationFn: () => channelManagerApi.testConnection(existing.id),
    onSuccess: (res) => {
      if (res.ok) {
        showToast(
          __("Connection OK — credentials accepted by the OTA.", "yatra"),
          "success"
        );
      } else {
        showToast(res.error || __("Connection failed.", "yatra"), "error");
      }
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const syncChannel = useMutation({
    mutationFn: () => channelManagerApi.syncChannel(existing.id),
    onSuccess: (res) => showToast(res.message, "success"),
    onError: (e) => showToast(extractError(e), "error")
  });
  const testWebhook = useMutation({
    mutationFn: () => channelManagerApi.testWebhook(existing.id),
    onSuccess: (res) => {
      if (res.ok) {
        showToast(
          __(
            "Webhook self-test succeeded — your endpoint is reachable.",
            "yatra"
          ),
          "success"
        );
      } else {
        showToast(
          res.error || __(
            "Webhook self-test failed — see Sync activity for details.",
            "yatra"
          ),
          "error"
        );
      }
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: isCreate ? __("Add channel", "yatra") : __("Edit channel", "yatra") }),
        (typeDef == null ? void 0 : typeDef.description) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl", children: typeDef.description }),
        typeDef && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap gap-2", children: [
          typeDef.docs_url && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: typeDef.docs_url,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(HelpCircle, { className: "h-3 w-3" }),
                __("Integration docs", "yatra")
              ]
            }
          ),
          typeDef.signup_url && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: typeDef.signup_url,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" }),
                __("Apply to partner program", "yatra")
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
        !isCreate && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              onClick: () => testConnection.mutate(),
              disabled: testConnection.isPending,
              children: [
                testConnection.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "mr-1.5 h-4 w-4" }),
                __("Test connection", "yatra")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              onClick: () => syncChannel.mutate(),
              disabled: syncChannel.isPending || !isEnabled,
              title: !isEnabled ? __("Enable the channel before syncing.", "yatra") : void 0,
              children: [
                syncChannel.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-1.5 h-4 w-4" }),
                __("Sync now", "yatra")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              onClick: () => testWebhook.mutate(),
              disabled: testWebhook.isPending,
              title: __(
                "Sends a signed synthetic booking to your own webhook URL so you can confirm the round-trip works.",
                "yatra"
              ),
              children: [
                testWebhook.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "mr-1.5 h-4 w-4" }),
                __("Test webhook", "yatra")
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Back to list", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: () => save.mutate(),
            disabled: save.isPending || channelType === "",
            children: [
              save.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-1.5 h-4 w-4" }),
              isCreate ? __("Create channel", "yatra") : __("Save changes", "yatra")
            ]
          }
        )
      ] })
    ] }),
    isCreate && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-blue-200 bg-blue-50/60 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-start gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-4 w-4 mt-0.5 flex-shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __(
        "Channels are created in disabled + sandbox mode by default. You'll add credentials and test the connection on the next screen, then flip Enabled on once you've verified everything works.",
        "yatra"
      ) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Connection", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "Pick which OTA this connection is for and give it a friendly label.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-5 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("OTA channel", "yatra"),
            description: __(
              "Pick the OTA you're connecting. Once a channel is created, this is locked — to switch OTAs you'd add a new channel.",
              "yatra"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Select,
              {
                value: channelType,
                onChange: (e) => setChannelType(e.target.value),
                disabled: !isCreate,
                children: meta.channel_types.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: t.type, children: t.name }, t.type))
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("Display name", "yatra"),
            description: __(
              "How this channel appears in the admin UI. Leave blank to use the OTA's name.",
              "yatra"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: displayName,
                onChange: (e) => setDisplayName(e.target.value),
                placeholder: (typeDef == null ? void 0 : typeDef.name) ?? ""
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("Account label (internal)", "yatra"),
            description: __(
              "Optional note shown in logs and reports. Useful when you run multiple accounts on the same OTA (e.g. 'US production', 'EU staging').",
              "yatra"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: accountLabel,
                onChange: (e) => setAccountLabel(e.target.value),
                placeholder: __("e.g. US production account", "yatra")
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("Currency", "yatra"),
            description: __(
              "ISO 4217 code (e.g. USD, EUR, GBP). Must match the currency your products are priced in on the OTA — mismatches cause failed pricing pushes.",
              "yatra"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: currency,
                onChange: (e) => setCurrency(e.target.value.toUpperCase().slice(0, 3)),
                placeholder: "USD",
                maxLength: 3
              }
            )
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Pricing & inventory rules", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "How prices and seat counts on this channel differ from your base trip. These apply across every trip mapped to this channel — individual mappings can override on a per-trip basis.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-5 md:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FormField,
            {
              label: __("Default price offset (%)", "yatra"),
              description: __(
                "Adds (or subtracts) a percentage to your base trip price before pushing to this channel. Use a positive number to cover the OTA's commission so your net stays whole; negative to run a channel discount.",
                "yatra"
              ),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  step: "0.01",
                  value: defaultOffset,
                  onChange: (e) => setDefaultOffset(Number(e.target.value) || 0),
                  placeholder: "0"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FormField,
            {
              label: __("Commission (%) — informational", "yatra"),
              description: __(
                "What the OTA deducts from each sale. Not sent to the channel — used here only to estimate your net revenue in reports.",
                "yatra"
              ),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  step: "0.01",
                  value: commission,
                  onChange: (e) => setCommission(Number(e.target.value) || 0),
                  placeholder: "0"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FormField,
            {
              label: __("Inventory buffer (seats)", "yatra"),
              description: __(
                "Seats held back from this channel so direct-bookers and other OTAs always have stock. Example: a 20-seat departure with a buffer of 2 will only ever show 18 seats on this channel.",
                "yatra"
              ),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  min: 0,
                  value: buffer,
                  onChange: (e) => setBuffer(Number(e.target.value) || 0),
                  placeholder: "0"
                }
              )
            }
          )
        ] }),
        !isCreate && /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("Inbound webhook IP allowlist", "yatra"),
            description: __(
              "Optional defense-in-depth on top of the signature secret. Comma- or newline-separated CIDRs. Empty = no restriction (default). When set, inbound webhook deliveries from any source outside the list are dropped BEFORE signature verification.",
              "yatra"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                className: "w-full font-mono text-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 min-h-[80px]",
                value: allowedIps,
                onChange: (e) => setAllowedIps(e.target.value),
                placeholder: "203.0.113.0/24\n198.51.100.42"
              }
            )
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Channel state", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "Both flags must be considered together: a disabled channel won't sync at all, regardless of mode; sandbox mode lets you test live API calls against the OTA's staging environment without affecting real bookings.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ToggleRow,
          {
            label: __("Enabled", "yatra"),
            description: __(
              "When off, this channel won't push inventory or pricing, and incoming bookings won't be ingested. Logs still record any attempts so you can audit them.",
              "yatra"
            ),
            checked: isEnabled,
            onChange: setIsEnabled
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ToggleRow,
          {
            label: __("Sandbox / test mode", "yatra"),
            description: __(
              "Routes API calls to the OTA's sandbox environment. Always start in sandbox until a test booking has flowed through end-to-end. Switch off only after you've verified the connection in production.",
              "yatra"
            ),
            checked: isTestMode,
            onChange: setIsTestMode,
            tone: "amber"
          }
        )
      ] })
    ] }),
    !isCreate && typeDef && /* @__PURE__ */ jsxRuntimeExports.jsx(
      CredentialsCard,
      {
        channelId: existing.id,
        typeDef,
        status: existing.credentials ?? {}
      }
    ),
    !isCreate && /* @__PURE__ */ jsxRuntimeExports.jsx(
      WebhookCard,
      {
        channelId: existing.id,
        webhookUrlTemplate: meta.webhook_url
      }
    )
  ] });
};
const CredentialsCard = ({ channelId, typeDef, status }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [drafts, setDrafts] = reactExports.useState({});
  const [visible, setVisible] = reactExports.useState({});
  const save = useMutation({
    mutationFn: (vars) => channelManagerApi.updateCredential(channelId, vars.field, vars.value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-channels"] });
      showToast(__("Credential saved.", "yatra"), "success");
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-5 w-5 text-blue-500" }),
        __("API credentials", "yatra")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
        "Stored encrypted with libsodium AEAD (XChaCha20-Poly1305). After saving, the value is never sent back to the browser — you only see a masked last-4 hint to confirm something is set.",
        "yatra"
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-6", children: Object.entries(typeDef.credentials).map(([field, def]) => {
      const fieldStatus = status[field] ?? {
        configured: false,
        hint: ""
      };
      const draft = drafts[field] ?? "";
      const isVisible = !!visible[field];
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "flex items-center gap-2", children: [
            def.label,
            def.required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-red-600 dark:text-red-400", children: "*" })
          ] }),
          def.docs_url && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: def.docs_url,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400",
              children: [
                __("Where to find this", "yatra"),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
              ]
            }
          )
        ] }),
        def.description && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: def.description })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 min-w-[260px]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: isVisible ? "text" : "password",
                value: draft,
                placeholder: fieldStatus.configured ? fieldStatus.hint : __("Paste the credential value…", "yatra"),
                onChange: (e) => setDrafts((d) => ({ ...d, [field]: e.target.value }))
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setVisible((v) => ({ ...v, [field]: !v[field] })),
                className: "absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600",
                "aria-label": isVisible ? __("Hide value", "yatra") : __("Show value", "yatra"),
                children: isVisible ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => {
                save.mutate({ field, value: draft });
                setDrafts((d) => ({ ...d, [field]: "" }));
              },
              disabled: save.isPending || draft.trim() === "",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-1.5 h-4 w-4" }),
                __("Save", "yatra")
              ]
            }
          ),
          fieldStatus.configured && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              onClick: () => save.mutate({ field, value: "" }),
              disabled: save.isPending,
              className: "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30",
              children: __("Clear", "yatra")
            }
          )
        ] }),
        fieldStatus.configured ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-green-600 dark:text-green-400 flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "h-3 w-3" }),
          __("Configured", "yatra"),
          " — ",
          fieldStatus.hint
        ] }) : def.required ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "h-3 w-3" }),
          __("Required — sync will fail without this.", "yatra")
        ] }) : null
      ] }, field);
    }) })
  ] });
};
const WebhookCard = ({ channelId, webhookUrlTemplate }) => {
  const { showToast } = useToast();
  const url = webhookUrlTemplate.includes("{channel_id}") ? webhookUrlTemplate.replace("{channel_id}", String(channelId)) : `${webhookUrlTemplate.replace(/\/$/, "")}/${channelId}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast(__("Webhook URL copied.", "yatra"), "success");
    } catch {
      showToast(__("Couldn't copy — copy manually.", "yatra"), "error");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Inbox, { className: "h-5 w-5 text-blue-500" }),
        __("Inbound webhook URL", "yatra")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
        "Paste this URL into the OTA's partner portal under booking notifications. Whenever a booking is made on the OTA, they POST it here and it appears in the Bookings inbox seconds later. The endpoint verifies the request signature, so only the OTA can deliver to it.",
        "yatra"
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "flex-1 min-w-[280px] rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 break-all", children: url }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: copy, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "mr-1.5 h-4 w-4" }),
          __("Copy", "yatra")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-3.5 w-3.5 mt-0.5 flex-shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __(
          "If your site is behind a firewall or VPN, make sure this URL is reachable from the public internet — otherwise the OTA's webhook deliveries will time out and you'll only get bookings on the next hourly cron tick.",
          "yatra"
        ) })
      ] })
    ] })
  ] });
};
const MappingsSection = () => {
  var _a;
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [filterChannel, setFilterChannel] = reactExports.useState(0);
  const [showAdd, setShowAdd] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [selected, setSelected] = reactExports.useState(/* @__PURE__ */ new Set());
  const [pendingDelete, setPendingDelete] = reactExports.useState(null);
  const { data: channelsData } = useQuery({
    queryKey: ["channel-manager-channels"],
    queryFn: () => channelManagerApi.listChannels()
  });
  const { data: mappingsData, isLoading } = useQuery({
    queryKey: ["channel-manager-mappings", filterChannel],
    queryFn: () => channelManagerApi.listMappings(filterChannel || void 0)
  });
  const syncMapping = useMutation({
    mutationFn: (id) => channelManagerApi.syncMapping(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-mappings"] });
      if (res.ok) {
        showToast(__("Mapping synced.", "yatra"), "success");
      } else {
        showToast(res.error || __("Sync failed.", "yatra"), "error");
      }
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const deleteMapping = useMutation({
    mutationFn: (id) => channelManagerApi.deleteMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-mappings"] });
      showToast(__("Mapping deleted.", "yatra"), "success");
      setPendingDelete(null);
    },
    onError: (e) => {
      showToast(extractError(e), "error");
      setPendingDelete(null);
    }
  });
  const bulkAction = useMutation({
    mutationFn: (vars) => channelManagerApi.bulkMappings(vars.action, vars.ids),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-mappings"] });
      setSelected(/* @__PURE__ */ new Set());
      showToast(res.message, res.ok ? "success" : "error");
      setPendingDelete(null);
    },
    onError: (e) => {
      showToast(extractError(e), "error");
      setPendingDelete(null);
    }
  });
  const channels = (channelsData == null ? void 0 : channelsData.data) ?? [];
  const mappings = (mappingsData == null ? void 0 : mappingsData.data) ?? [];
  const channelById = new Map(
    channels.map((c) => [c.id, c])
  );
  const tripIdsForLookup = reactExports.useMemo(() => {
    const ids = /* @__PURE__ */ new Set();
    mappings.forEach((m) => {
      if (m.trip_id) ids.add(Number(m.trip_id));
    });
    return Array.from(ids).sort((a, b) => a - b);
  }, [mappings]);
  const { data: tripsLookup } = useQuery({
    queryKey: ["channel-manager-mapping-trip-titles", tripIdsForLookup],
    enabled: tripIdsForLookup.length > 0,
    staleTime: 5 * 6e4,
    queryFn: async () => {
      var _a2;
      const params = {
        per_page: Math.max(tripIdsForLookup.length, 25),
        include: tripIdsForLookup.join(",")
      };
      const res = await apiClient.get("/trips", { params });
      const items = ((_a2 = res == null ? void 0 : res.data) == null ? void 0 : _a2.data) || (res == null ? void 0 : res.data) || res || [];
      const map = /* @__PURE__ */ new Map();
      if (Array.isArray(items)) {
        items.forEach((t) => {
          var _a3;
          const id = Number((t == null ? void 0 : t.id) || 0);
          if (!id) return;
          map.set(id, {
            title: String((t == null ? void 0 : t.title) || (t == null ? void 0 : t.name) || `Trip #${id}`),
            edit_url: (t == null ? void 0 : t.edit_url) || (t == null ? void 0 : t.admin_edit_url) || (t == null ? void 0 : t.permalink) || `${((_a3 = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a3.adminUrl) || "admin.php"}?page=yatra&subpage=trips&action=edit&id=${id}`
          });
        });
      }
      return map;
    }
  });
  if (editing !== null) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      MappingEditForm,
      {
        channels,
        existing: editing,
        onClose: () => setEditing(null)
      }
    );
  }
  const visibleIds = mappings.map((m) => m.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const toggleAll = () => {
    if (allSelected) {
      setSelected(/* @__PURE__ */ new Set());
    } else {
      setSelected(new Set(visibleIds));
    }
  };
  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const runBulk = (action) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (action === "delete") {
      setPendingDelete({ kind: "bulk", ids });
      return;
    }
    bulkAction.mutate({ action, ids });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Trip mappings", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __(
          "A mapping links one of your trips to its counterpart product on a channel. One trip can be mapped to many channels (each can have its own price offset); one channel holds one mapping per trip.",
          "yatra"
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-start gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-3.5 w-3.5 mt-0.5 flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __(
            "Once mapped, every change to your trip's availability or price triggers a sync within seconds. Use the per-mapping offset to override the channel default when one trip needs different pricing logic.",
            "yatra"
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Select,
          {
            value: String(filterChannel),
            onChange: (e) => setFilterChannel(Number(e.target.value)),
            className: "w-56",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "0", children: __("All channels", "yatra") }),
              channels.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c.id, children: c.display_name || c.channel_type }, c.id))
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: () => setShowAdd(true),
            disabled: channels.length === 0,
            title: channels.length === 0 ? __("Add at least one channel first.", "yatra") : void 0,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
              __("Add mapping", "yatra")
            ]
          }
        )
      ] })
    ] }),
    showAdd && /* @__PURE__ */ jsxRuntimeExports.jsx(
      MappingAddForm,
      {
        channels,
        defaultChannelId: filterChannel || ((_a = channels[0]) == null ? void 0 : _a.id) || 0,
        onClose: () => setShowAdd(false)
      }
    ),
    selected.size > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-blue-900 dark:text-blue-200", children: __("{n} selected", "yatra").replace("{n}", String(selected.size)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            variant: "outline",
            onClick: () => runBulk("sync"),
            disabled: bulkAction.isPending,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-1.5 h-3.5 w-3.5" }),
              __("Sync selected", "yatra")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            variant: "outline",
            onClick: () => runBulk("enable"),
            disabled: bulkAction.isPending,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Power, { className: "mr-1.5 h-3.5 w-3.5" }),
              __("Enable", "yatra")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            variant: "outline",
            onClick: () => runBulk("disable"),
            disabled: bulkAction.isPending,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(PowerOff, { className: "mr-1.5 h-3.5 w-3.5" }),
              __("Pause", "yatra")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            variant: "outline",
            className: "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30",
            onClick: () => runBulk("delete"),
            disabled: bulkAction.isPending,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-1.5 h-3.5 w-3.5" }),
              __("Delete", "yatra")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            size: "sm",
            variant: "outline",
            onClick: () => setSelected(/* @__PURE__ */ new Set()),
            children: __("Clear", "yatra")
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ModuleTableSkeleton, { rows: 5, columns: 4 }) }) : mappings.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-10 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "h-7 w-7 text-blue-600 dark:text-blue-400" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-base font-semibold text-gray-900 dark:text-white", children: __("No mappings yet", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400", children: channels.length === 0 ? __(
        "Add a channel first, then come back here to map your trips to it.",
        "yatra"
      ) : __(
        "Map each trip you want to sell on a channel to its counterpart product on that channel's side.",
        "yatra"
      ) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50 dark:bg-gray-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 w-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            checked: allSelected,
            onChange: toggleAll,
            "aria-label": __("Select all", "yatra")
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Channel", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Trip", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("External product", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Offset", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Sync state", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Last sync", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { align: "right", children: __("Actions", "yatra") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: mappings.map((m) => {
        const ch = channelById.get(m.channel_id);
        const isSelected = selected.has(m.id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "tr",
          {
            className: `hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isSelected ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: isSelected,
                  onChange: () => toggleOne(m.id),
                  "aria-label": __("Select mapping", "yatra")
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: (ch == null ? void 0 : ch.display_name) || (ch == null ? void 0 : ch.channel_type) || `#${m.channel_id}` }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: (() => {
                const trip = tripsLookup == null ? void 0 : tripsLookup.get(m.trip_id);
                const title = (trip == null ? void 0 : trip.title) || `Trip #${m.trip_id}`;
                const url = trip == null ? void 0 : trip.edit_url;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 min-w-0", children: [
                  url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "a",
                    {
                      href: url,
                      className: "truncate font-medium text-blue-600 hover:underline dark:text-blue-400",
                      title,
                      children: title
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "truncate font-medium",
                      title,
                      children: title
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("code", { className: "flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400", children: [
                    "#",
                    m.trip_id
                  ] })
                ] });
              })() }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: m.external_url ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: m.external_url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "text-blue-600 hover:underline dark:text-blue-400",
                  children: [
                    m.external_product_id || "—",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "ml-1 inline h-3 w-3" })
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800", children: m.external_product_id || "—" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: m.price_offset_percent !== 0 ? `${m.price_offset_percent > 0 ? "+" : ""}${m.price_offset_percent}%` : "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  className: m.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                  children: m.is_active ? __("Active", "yatra") : __("Paused", "yatra")
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-gray-500 dark:text-gray-400", children: m.last_synced_at ? new Date(m.last_synced_at).toLocaleString() : "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    onClick: () => setEditing(m),
                    title: __("Edit this mapping", "yatra"),
                    children: __("Edit", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    onClick: () => syncMapping.mutate(m.id),
                    disabled: syncMapping.isPending,
                    title: __(
                      "Push inventory + pricing now",
                      "yatra"
                    ),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    className: "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30",
                    onClick: () => setPendingDelete({ kind: "one", id: m.id }),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" })
                  }
                )
              ] }) })
            ]
          },
          m.id
        );
      }) })
    ] }) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: pendingDelete !== null,
        onClose: () => {
          if (!deleteMapping.isPending && !bulkAction.isPending) {
            setPendingDelete(null);
          }
        },
        onConfirm: () => {
          if (!pendingDelete) return;
          if (pendingDelete.kind === "one") {
            deleteMapping.mutate(pendingDelete.id);
          } else {
            bulkAction.mutate({ action: "delete", ids: pendingDelete.ids });
          }
        },
        title: (pendingDelete == null ? void 0 : pendingDelete.kind) === "bulk" ? __("Delete selected mappings?", "yatra") : __("Delete mapping?", "yatra"),
        description: (pendingDelete == null ? void 0 : pendingDelete.kind) === "bulk" ? __(
          "Delete {n} mappings? They will stop syncing immediately. Existing bookings are unaffected.",
          "yatra"
        ).replace("{n}", String(pendingDelete.ids.length)) : __(
          "Delete this mapping? The trip will no longer sync to this channel. Existing bookings already in the inbox are not affected.",
          "yatra"
        ),
        confirmText: (pendingDelete == null ? void 0 : pendingDelete.kind) === "bulk" ? __("Delete mappings", "yatra") : __("Delete mapping", "yatra"),
        cancelText: __("Cancel", "yatra"),
        variant: "danger",
        isLoading: deleteMapping.isPending || bulkAction.isPending
      }
    )
  ] });
};
const TripPicker = ({ value, onChange, placeholder }) => {
  const [open, setOpen] = reactExports.useState(false);
  const [search, setSearch] = reactExports.useState("");
  const [debounced, setDebounced] = reactExports.useState("");
  const wrapperRef = reactExports.useRef(null);
  const searchInputRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);
  reactExports.useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);
  reactExports.useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);
  const { data: results = [], isFetching } = useQuery({
    queryKey: ["channel-manager-trip-picker", debounced],
    queryFn: async () => {
      var _a;
      const params = { per_page: 25 };
      if (debounced) params.search = debounced;
      const res = await apiClient.get("/trips", { params });
      const items = ((_a = res == null ? void 0 : res.data) == null ? void 0 : _a.data) || (res == null ? void 0 : res.data) || res || [];
      if (!Array.isArray(items)) return [];
      return items.map((t) => ({
        id: Number((t == null ? void 0 : t.id) || 0),
        title: String((t == null ? void 0 : t.title) || (t == null ? void 0 : t.name) || `Trip #${t == null ? void 0 : t.id}`)
      })).filter((t) => t.id > 0);
    },
    enabled: open,
    staleTime: 6e4
  });
  const { data: selectedTrip } = useQuery({
    queryKey: ["channel-manager-trip-picker:resolve", value],
    queryFn: async () => {
      var _a;
      if (!value) return null;
      try {
        const res = await apiClient.get(`/trips/${value}`);
        const t = ((_a = res == null ? void 0 : res.data) == null ? void 0 : _a.data) || (res == null ? void 0 : res.data) || res || null;
        if (!t || !t.id) return null;
        return {
          id: Number(t.id),
          title: String(t.title || t.name || `Trip #${t.id}`)
        };
      } catch {
        return null;
      }
    },
    enabled: value > 0,
    staleTime: 5 * 6e4
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: wrapperRef, className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => setOpen((o) => !o),
        className: "flex h-12 w-full items-center justify-between rounded-md border-2 border-gray-300 bg-white px-4 text-left text-base text-gray-900 transition-colors hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-500",
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex min-w-0 items-center gap-2", children: value > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate font-medium", children: (selectedTrip == null ? void 0 : selectedTrip.title) || `Trip #${value}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400", children: [
              "#",
              value
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500 dark:text-gray-400", children: placeholder || __("Search and select a trip…", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex flex-shrink-0 items-center gap-1", children: [
            value > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                role: "button",
                tabIndex: 0,
                onClick: (e) => {
                  e.stopPropagation();
                  onChange(0);
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(0);
                  }
                },
                className: "rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700",
                "aria-label": __("Clear selection", "yatra"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ChevronDown,
              {
                className: `h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`
              }
            )
          ] })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-gray-100 p-2 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            ref: searchInputRef,
            type: "text",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: __("Type to search trips by title…", "yatra"),
            className: "w-full rounded border border-gray-200 bg-white py-1.5 pl-8 pr-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-72 overflow-auto", children: isFetching ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center p-6 text-sm text-gray-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
        __("Searching…", "yatra")
      ] }) : results.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 text-center text-sm text-gray-500 dark:text-gray-400", children: debounced ? __("No trips match that search.", "yatra") : __("No trips found.", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { role: "listbox", className: "py-1", children: results.map((t) => {
        const isSelected = t.id === value;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { role: "option", "aria-selected": isSelected, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              onChange(t.id, t.title);
              setOpen(false);
              setSearch("");
            },
            className: `flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${isSelected ? "bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200" : ""}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: t.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-gray-700 dark:text-gray-400", children: [
                  "#",
                  t.id
                ] })
              ] }),
              isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" })
            ]
          }
        ) }, t.id);
      }) }) })
    ] })
  ] });
};
const MappingAddForm = ({ channels, defaultChannelId, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [channelId, setChannelId] = reactExports.useState(defaultChannelId);
  const [tripId, setTripId] = reactExports.useState(0);
  const [externalProductId, setExternalProductId] = reactExports.useState("");
  const [externalUrl, setExternalUrl] = reactExports.useState("");
  const [offset, setOffset] = reactExports.useState(0);
  const [syncInventory, setSyncInventory] = reactExports.useState(true);
  const [syncPricing, setSyncPricing] = reactExports.useState(true);
  const create = useMutation({
    mutationFn: () => channelManagerApi.createMapping({
      channel_id: channelId,
      trip_id: tripId,
      external_product_id: externalProductId,
      external_url: externalUrl,
      price_offset_percent: offset,
      is_active: true,
      sync_inventory: syncInventory,
      sync_pricing: syncPricing
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-mappings"] });
      showToast(__("Mapping created.", "yatra"), "success");
      onClose();
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("New trip mapping", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
        "Connect one of your trips to a product on the channel. You'll need the channel's product ID — check the channel's partner portal or the URL of the product page.",
        "yatra"
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-5 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("Channel", "yatra"),
            description: __("Which channel this mapping pushes to.", "yatra"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Select,
              {
                value: String(channelId),
                onChange: (e) => setChannelId(Number(e.target.value)),
                children: channels.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c.id, children: c.display_name || c.channel_type }, c.id))
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("Trip", "yatra"),
            description: __(
              "Pick the Yatra trip this mapping pushes to the channel. Start typing the trip title — the list filters as you type.",
              "yatra"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              TripPicker,
              {
                value: tripId,
                onChange: (id) => setTripId(id),
                placeholder: __("Search and select a trip…", "yatra")
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("Channel product ID", "yatra"),
            description: __(
              "The product's ID on the channel side. For Viator this is a product code (e.g. 12345P1); for GetYourGuide it's the offer/option ID. Copy it from the channel's partner portal.",
              "yatra"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: externalProductId,
                onChange: (e) => setExternalProductId(e.target.value),
                placeholder: __(
                  "e.g. 12345P1 (Viator) or 87654 (GetYourGuide)",
                  "yatra"
                )
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("Public listing URL (optional)", "yatra"),
            description: __(
              "Link to the channel's public listing for this product. Shown as a quick-jump link in the mappings table so you can verify changes after syncing.",
              "yatra"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: externalUrl,
                onChange: (e) => setExternalUrl(e.target.value),
                placeholder: "https://www.viator.com/..."
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("Per-mapping price offset (%)", "yatra"),
            description: __(
              "Overrides the channel's default offset for this trip only. Use 0 to inherit the channel default. Set positive to mark up, negative to discount.",
              "yatra"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                step: "0.01",
                value: offset,
                onChange: (e) => setOffset(Number(e.target.value) || 0),
                placeholder: "0"
              }
            )
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2 pt-2 border-t border-gray-200 dark:border-gray-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ToggleRow,
          {
            label: __("Sync inventory", "yatra"),
            description: __(
              "Push seat availability to this channel. Turn off if you're using the channel's own inventory system instead.",
              "yatra"
            ),
            checked: syncInventory,
            onChange: setSyncInventory
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ToggleRow,
          {
            label: __("Sync pricing", "yatra"),
            description: __(
              "Push prices to this channel. Turn off when prices are managed on the channel side (e.g. for promotions you control there).",
              "yatra"
            ),
            checked: syncPricing,
            onChange: setSyncPricing
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Cancel", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: () => create.mutate(),
            disabled: create.isPending || channelId <= 0 || tripId <= 0 || externalProductId.trim() === "",
            children: [
              create.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
              __("Create mapping", "yatra")
            ]
          }
        )
      ] })
    ] })
  ] });
};
const MappingEditForm = ({ channels, existing, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [externalProductId, setExternalProductId] = reactExports.useState(
    existing.external_product_id ?? ""
  );
  const [externalUrl, setExternalUrl] = reactExports.useState(existing.external_url ?? "");
  const [offset, setOffset] = reactExports.useState(
    existing.price_offset_percent ?? 0
  );
  const [isActive, setIsActive] = reactExports.useState(existing.is_active);
  const [syncInventory, setSyncInventory] = reactExports.useState(
    existing.sync_inventory
  );
  const [syncPricing, setSyncPricing] = reactExports.useState(
    existing.sync_pricing
  );
  const channel = channels.find((c) => c.id === existing.channel_id);
  const save = useMutation({
    mutationFn: () => channelManagerApi.updateMapping(existing.id, {
      external_product_id: externalProductId,
      external_url: externalUrl,
      price_offset_percent: offset,
      is_active: isActive,
      sync_inventory: syncInventory,
      sync_pricing: syncPricing
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-manager-mappings"] });
      showToast(__("Mapping saved.", "yatra"), "success");
      onClose();
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const sync = useMutation({
    mutationFn: () => channelManagerApi.syncMapping(existing.id),
    onSuccess: (res) => showToast(
      res.ok ? __("Synced.", "yatra") : res.error || __("Sync failed.", "yatra"),
      res.ok ? "success" : "error"
    ),
    onError: (e) => showToast(extractError(e), "error")
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: __("Edit mapping", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __(
          "Channel and trip are locked once a mapping exists. Delete + recreate if you need to re-point this mapping elsewhere.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            onClick: () => sync.mutate(),
            disabled: sync.isPending,
            children: [
              sync.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-1.5 h-4 w-4" }),
              __("Sync now", "yatra")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Back to list", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => save.mutate(), disabled: save.isPending, children: [
          save.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-1.5 h-4 w-4" }),
          __("Save changes", "yatra")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Mapping link", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "How this trip maps to the channel's product. Updating the external product ID re-points subsequent syncs but does not retroactively affect bookings already received.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-5 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("Channel", "yatra"),
            description: __(
              "Immutable. To move this trip to a different channel, delete this mapping and create a new one.",
              "yatra"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: (channel == null ? void 0 : channel.display_name) || (channel == null ? void 0 : channel.channel_type) || `#${existing.channel_id}`,
                disabled: true
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("Trip ID", "yatra"),
            description: __("Immutable. One trip per channel.", "yatra"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: `#${existing.trip_id}`, disabled: true })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("Channel product ID", "yatra"),
            description: __(
              "The product's ID on the channel side. Editing this re-points the mapping — all future syncs target the new product. Existing bookings already received are not modified.",
              "yatra"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: externalProductId,
                onChange: (e) => setExternalProductId(e.target.value)
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("Public listing URL (optional)", "yatra"),
            description: __(
              "Quick-jump link shown in the mappings table.",
              "yatra"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: externalUrl,
                onChange: (e) => setExternalUrl(e.target.value)
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: __("Per-mapping price offset (%)", "yatra"),
            description: __(
              "Overrides the channel's default offset for this trip only. 0 inherits the channel default.",
              "yatra"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                step: "0.01",
                value: offset,
                onChange: (e) => setOffset(Number(e.target.value) || 0)
              }
            )
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Sync controls", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "Pause or partially-sync this mapping without losing its configuration. Pausing keeps all settings; flipping it back resumes from where it left off.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ToggleRow,
          {
            label: __("Active", "yatra"),
            description: __(
              "When off, this mapping won't push inventory or pricing, and bookings received for it are still ingested (so cancellations of pre-existing bookings keep working).",
              "yatra"
            ),
            checked: isActive,
            onChange: setIsActive
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ToggleRow,
          {
            label: __("Sync inventory", "yatra"),
            description: __(
              "Push seat availability to this channel. Turn off when the channel manages its own inventory.",
              "yatra"
            ),
            checked: syncInventory,
            onChange: setSyncInventory
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ToggleRow,
          {
            label: __("Sync pricing", "yatra"),
            description: __(
              "Push prices to this channel. Turn off for channels that run their own promotions.",
              "yatra"
            ),
            checked: syncPricing,
            onChange: setSyncPricing
          }
        )
      ] })
    ] })
  ] });
};
const BookingsSection = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["channel-manager-bookings"],
    queryFn: () => channelManagerApi.listBookings({ per_page: 100 }),
    refetchInterval: 3e4
  });
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-6 w-6 animate-spin text-gray-400" }) });
  }
  const rows = (data == null ? void 0 : data.data) ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Inbox, { className: "h-5 w-5 text-blue-500" }),
        __("Bookings inbox", "yatra")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-3xl", children: __(
        "Every booking received from connected OTAs lands here. The flow is two-phase for safety: bookings are first staged (received), then promoted into the main booking list. Promoted bookings go through the same notifications, payments and reporting as direct sales.",
        "yatra"
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatusLegend,
          {
            color: "blue",
            label: __("received", "yatra"),
            description: __("staged — not yet a real booking", "yatra")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatusLegend,
          {
            color: "green",
            label: __("promoted", "yatra"),
            description: __("live booking, visible everywhere", "yatra")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatusLegend,
          {
            color: "red",
            label: __("failed", "yatra"),
            description: __(
              "promotion failed — check the error column",
              "yatra"
            )
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-10 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Inbox, { className: "h-7 w-7 text-blue-600 dark:text-blue-400" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-base font-semibold text-gray-900 dark:text-white", children: __("No channel bookings yet", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400", children: __(
        "When an OTA sends a booking webhook, it'll appear here within seconds. The list auto-refreshes every 30 seconds while this tab is open.",
        "yatra"
      ) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50 dark:bg-gray-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Channel ref", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Customer", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Departure", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Travelers", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Amount", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Status", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Booking ID", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Received", "yatra") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: rows.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "tr",
        {
          className: "hover:bg-gray-50 dark:hover:bg-gray-800/50",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs font-mono", children: b.external_booking_id }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-900 dark:text-white", children: b.customer_name || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: b.customer_email })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm text-gray-700 dark:text-gray-200", children: b.departure_date || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: b.travelers_total }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3 text-sm", children: [
              b.currency,
              " ",
              Number(b.total_amount).toFixed(2)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  className: b.processing_status === "promoted" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : b.processing_status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                  children: b.processing_status
                }
              ),
              b.error_message && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-red-600 dark:text-red-400 max-w-xs truncate", children: b.error_message })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs", children: b.yatra_booking_id ? `#${b.yatra_booking_id}` : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-gray-500 dark:text-gray-400", children: new Date(b.received_at).toLocaleString() })
          ]
        },
        b.id
      )) })
    ] }) }) }) })
  ] });
};
const ReconciliationSection = () => {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["cm-reconciliation"],
    queryFn: () => channelManagerApi.getReconciliation(),
    refetchOnWindowFocus: false
  });
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-6 w-6 animate-spin text-gray-400" }) });
  }
  const report = data == null ? void 0 : data.data;
  if (!report) return null;
  const t = report.totals;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Reconciliation report", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __(
          "Generated on demand from the sync log + mapping + booking tables. Refresh to recompute.",
          "yatra"
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: sprintf(
          /* translators: %s: timestamp */
          __("Generated at %s", "yatra"),
          report.generated_at
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          onClick: () => refetch(),
          disabled: isFetching,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              RefreshCw,
              {
                className: `h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`
              }
            ),
            __("Refresh", "yatra")
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          label: __("Channels enabled", "yatra"),
          value: `${t.channels.enabled} / ${t.channels.total}`,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Network, { className: "h-4 w-4 text-blue-500" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          label: __("Active mappings", "yatra"),
          value: t.mappings_active,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "h-4 w-4 text-indigo-500" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          label: __("Stale mappings", "yatra"),
          value: t.inventory_stale,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "h-4 w-4 text-amber-500" }),
          tone: t.inventory_stale > 0 ? "warn" : "ok"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          label: __("Open breakers", "yatra"),
          value: t.breakers_open,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(PowerOff, { className: "h-4 w-4 text-red-500" }),
          tone: t.breakers_open > 0 ? "bad" : "ok"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          label: __("Pending booking promotions", "yatra"),
          value: t.bookings_pending,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Inbox, { className: "h-4 w-4 text-purple-500" }),
          tone: t.bookings_pending > 0 ? "warn" : "ok"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          label: __("Failed booking promotions (7d)", "yatra"),
          value: t.bookings_failed_7d,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "h-4 w-4 text-red-500" }),
          tone: t.bookings_failed_7d > 0 ? "bad" : "ok"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          label: __("Syncs OK (24h)", "yatra"),
          value: t.syncs_24h.success,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "h-4 w-4 text-green-500" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          label: __("Syncs failed (24h)", "yatra"),
          value: t.syncs_24h.failed,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "h-4 w-4 text-amber-500" }),
          tone: t.syncs_24h.failed > 0 ? "warn" : "ok"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Per channel", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "Channels marked “Needs attention” have stale mappings, pending bookings, recent failures, or a tripped breaker.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300", children: __("Channel", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300", children: __("Mappings", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300", children: __("Bookings", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300", children: __("Syncs (24h)", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300", children: __("Breaker", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300", children: __("Latest failure", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300", children: __("Status", "yatra") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: report.channels.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "tr",
          {
            className: c.needs_attention ? "bg-amber-50/40 dark:bg-amber-900/10" : "",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: c.channel.display_name || `#${c.channel.id}` }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 font-mono", children: c.channel.type })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2 text-xs", children: [
                sprintf(__("%d active", "yatra"), c.mappings.active),
                c.mappings.stale > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-amber-600 dark:text-amber-400 mt-0.5", children: sprintf(__("%d stale", "yatra"), c.mappings.stale) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2 text-xs", children: [
                c.bookings.pending > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-amber-600 dark:text-amber-400", children: sprintf(
                  __("%d pending", "yatra"),
                  c.bookings.pending
                ) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-400", children: "—" }),
                c.bookings.failed_7d > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-red-600 dark:text-red-400", children: sprintf(
                  __("%d failed (7d)", "yatra"),
                  c.bookings.failed_7d
                ) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2 text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-green-700 dark:text-green-400", children: [
                  c.syncs.success_24h,
                  " OK"
                ] }),
                c.syncs.failed_24h > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  " / ",
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-red-700 dark:text-red-400", children: [
                    c.syncs.failed_24h,
                    " fail"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  className: c.breaker.state === "closed" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                  children: c.breaker.state
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-xs text-gray-600 dark:text-gray-300 max-w-sm", children: c.latest_failure ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-mono", children: [
                  c.latest_failure.operation,
                  c.latest_failure.http_status !== null ? ` (${c.latest_failure.http_status})` : ""
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-500 truncate", children: c.latest_failure.error_message }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-400 text-[10px] mt-0.5", children: c.latest_failure.occurred_at })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-400", children: "—" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: c.needs_attention ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "h-3 w-3 mr-1" }),
                __("Needs attention", "yatra")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "h-3 w-3 mr-1" }),
                __("Healthy", "yatra")
              ] }) })
            ]
          },
          c.channel.id
        )) })
      ] }) }) })
    ] })
  ] });
};
const KpiCard = ({ label, value, icon, tone = "ok" }) => {
  const ring = tone === "bad" ? "border-red-200 dark:border-red-800" : tone === "warn" ? "border-amber-200 dark:border-amber-800" : "border-gray-200 dark:border-gray-700";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-md border ${ring} bg-white dark:bg-gray-900 p-3`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400", children: [
      icon,
      label
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-2xl font-semibold text-gray-900 dark:text-white", children: value })
  ] });
};
const LatencySection = () => {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["cm-latency"],
    queryFn: () => channelManagerApi.getLatency(),
    refetchOnWindowFocus: false
  });
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-6 w-6 animate-spin text-gray-400" }) });
  }
  const report = data == null ? void 0 : data.data;
  if (!report) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Sync latency", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: [
          __(
            "Percentiles over the duration_ms column of the sync log. Nearest-rank percentiles capped at ",
            "yatra"
          ),
          report.sample_cap,
          " ",
          __("recent samples per channel per window.", "yatra")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          onClick: () => refetch(),
          disabled: isFetching,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              RefreshCw,
              {
                className: `h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`
              }
            ),
            __("Refresh", "yatra")
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      LatencyTable,
      {
        title: __("Global", "yatra"),
        rows: [
          {
            label: __("Last 24h", "yatra"),
            window: report.global.last_24h
          },
          {
            label: __("Last 7d", "yatra"),
            window: report.global.last_7d
          }
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      LatencyTable,
      {
        title: __("Per provider", "yatra"),
        rows: report.per_provider.flatMap((p) => [
          {
            label: `${p.provider} · ${__("24h", "yatra")}`,
            window: p.last_24h
          },
          { label: `${p.provider} · ${__("7d", "yatra")}`, window: p.last_7d }
        ])
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      LatencyTable,
      {
        title: __("Per channel", "yatra"),
        rows: report.per_channel.flatMap((c) => [
          {
            label: `${c.channel.display_name || `#${c.channel.id}`} · ${__("24h", "yatra")}`,
            window: c.last_24h
          },
          {
            label: `${c.channel.display_name || `#${c.channel.id}`} · ${__("7d", "yatra")}`,
            window: c.last_7d
          }
        ])
      }
    )
  ] });
};
const LatencyTable = ({ title, rows }) => {
  if (rows.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: title }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300", children: __("Scope", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300", children: __("Samples", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300", children: __("Avg", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300", children: "p50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300", children: "p95" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300", children: "p99" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300", children: __("OK / Fail", "yatra") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: rows.map((r, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-gray-900 dark:text-white", children: r.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: r.window.samples }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: fmtMs(r.window.avg_ms) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: fmtMs(r.window.p50_ms) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: fmtMs(r.window.p95_ms) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: fmtMs(r.window.p99_ms) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2 text-right text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-700 dark:text-green-400", children: r.window.success_count }),
          " / ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-700 dark:text-red-400", children: r.window.fail_count })
        ] })
      ] }, `${r.label}-${idx}`)) })
    ] }) }) })
  ] });
};
function fmtMs(v) {
  if (v === null || v === void 0) return "—";
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}s`;
  return `${v} ms`;
}
const LogsSection = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["channel-manager-logs"],
    queryFn: () => channelManagerApi.listLogs({ per_page: 200 }),
    refetchInterval: 15e3
  });
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-6 w-6 animate-spin text-gray-400" }) });
  }
  const rows = (data == null ? void 0 : data.data) ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5 w-5 text-blue-500" }),
        __("Sync activity", "yatra")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-3xl", children: __(
        "Every push (you → channel), pull (channel → you), and inbound webhook from the last 90 days. Filter by failed status when debugging a sync; the error column carries the exact response from the OTA's API.",
        "yatra"
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-start gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-3.5 w-3.5 mt-0.5 flex-shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __(
          "Auto-refreshes every 15 seconds while open. Rows older than 90 days are purged automatically by a daily cron.",
          "yatra"
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-gray-500 dark:text-gray-400", children: __(
      "No activity yet — enable a channel and create a mapping to start seeing events here.",
      "yatra"
    ) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50 dark:bg-gray-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("When", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Channel", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Operation", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Status", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Duration", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Th, { children: __("Summary / Error", "yatra") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "tr",
        {
          className: "hover:bg-gray-50 dark:hover:bg-gray-800/50",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap", children: new Date(row.created_at).toLocaleString() }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: row.channel_id ? `#${row.channel_id}` : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", children: [
              row.direction,
              "/",
              row.operation
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                className: row.status === "success" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                children: row.status
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-gray-500 dark:text-gray-400", children: row.duration_ms != null ? `${row.duration_ms}ms` : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3 text-xs text-gray-700 dark:text-gray-200 max-w-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate", children: row.error_message || row.summary || "—" }),
              row.http_status != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 text-[10px] text-gray-400", children: [
                "HTTP ",
                row.http_status
              ] })
            ] })
          ]
        },
        row.id
      )) })
    ] }) }) }) })
  ] });
};
const FormField = ({ label, description, children }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: label }),
  children,
  description && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs leading-relaxed text-gray-500 dark:text-gray-400 flex items-start gap-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: description })
  ] })
] });
const ToggleRow = ({ label, description, checked, onChange, tone = "default" }) => {
  const baseBg = tone === "amber" && checked ? "border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-950/30" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "label",
    {
      className: `flex items-start gap-3 cursor-pointer rounded-md border px-3 py-2.5 transition-colors ${baseBg}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            checked,
            onChange: (e) => onChange(e.target.checked),
            className: "mt-0.5"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-medium text-gray-900 dark:text-white", children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: description })
        ] })
      ]
    }
  );
};
const StatusLegend = ({ color, label, description }) => {
  const cls = color === "green" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : color === "red" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: cls, children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500 dark:text-gray-400", children: description })
  ] });
};
const Th = ({ children, align = "left" }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "th",
  {
    className: `px-4 py-3 text-${align} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`,
    children
  }
);
const HealthBadge = ({ health }) => {
  if (!health) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400 dark:text-gray-500", children: "—" });
  }
  const { status, breaker, recent } = health;
  const cls = status === "green" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : status === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  const breakerLabel = breaker.state === "open" ? __("circuit open", "yatra") : breaker.state === "half_open" ? __("recovering", "yatra") : "";
  const tooltip = [
    recent.total > 0 ? __("Last {total}: {ok} OK, {fail} failed.", "yatra").replace("{total}", String(recent.total)).replace("{ok}", String(recent.ok)).replace("{fail}", String(recent.fail)) : __("No recent activity.", "yatra"),
    breaker.state !== "closed" ? __("Circuit: {state}.", "yatra").replace("{state}", breaker.state) + (breaker.last_failure ? ` — ${breaker.last_failure}` : "") : ""
  ].filter(Boolean).join(" ");
  const label = status === "green" ? __("Healthy", "yatra") : status === "amber" ? __("Degraded", "yatra") : __("Failing", "yatra");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", title: tooltip, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: cls, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "mr-1 h-3 w-3" }),
      label
    ] }),
    breakerLabel && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-red-600 dark:text-red-400", children: breakerLabel })
  ] });
};
function extractError(e) {
  var _a;
  if (!e) return "Request failed.";
  const data = ((_a = e == null ? void 0 : e.response) == null ? void 0 : _a.data) ?? (e == null ? void 0 : e.data) ?? null;
  if (data && typeof data === "object" && typeof data.message === "string") {
    return data.message;
  }
  return (e == null ? void 0 : e.message) || "Request failed.";
}
export {
  ChannelManager as default
};
//# sourceMappingURL=ChannelManager-CSJ4tokj.js.map
