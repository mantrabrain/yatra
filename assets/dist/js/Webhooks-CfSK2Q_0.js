import { r as reactExports, u as useQuery, j as jsxRuntimeExports, D as Loader2, w as Webhook, ar as Clock, Q as AlertTriangle, C as Crown, aD as CheckCircle2, V as ExternalLink, t as useQueryClient, v as useMutation, aw as Plus, bA as Pencil, bh as Send, J as RefreshCw, by as ShieldCheck, aN as Trash2, b6 as XCircle, Z as Zap, bi as Filter, a5 as React, aQ as Eye, R as RotateCcw, x as ChevronDown, aA as Check, aG as Copy } from "./react-vendor-CqkbFEvK.js";
import { a as apiClient, _ as __, u as useToast, s as sprintf } from "./index-fqW8jODk.js";
import { P as PageHeader, C as Card, d as CardContent, f as CardHeader, g as CardTitle, h as CardDescription, B as Button, U as Table, e as Badge, k as ConfirmationDialog, S as Select, W as Pagination, V as Tooltip, w as Label, I as Input, X as Switch, M as Modal, A as Alert } from "../../admin/dist/js/app.js";
const webhooksApi = {
  getMeta: () => apiClient.get("/webhooks/meta"),
  listEvents: () => apiClient.get("/webhooks/events"),
  /** Returns the latest REAL payload for this event — either explicitly
   *  captured via {@link startListen} or pulled from a prior delivery.
   *  `payload` is null if no sample exists yet (UI prompts to Listen). */
  getEventSample: (key) => apiClient.get(`/webhooks/events/${encodeURIComponent(key)}/sample`),
  /** Real-time capture flow (Pabbly/Zapier-style "listen for sample"):
   *  arm a capture, the next firing of the event records its real
   *  payload, the UI polls until it shows up. Zero guesswork. */
  startListen: (key) => apiClient.post(`/webhooks/events/${encodeURIComponent(key)}/listen`, {}),
  getListenStatus: (key) => apiClient.get(`/webhooks/events/${encodeURIComponent(key)}/listen`),
  /** Cancel an active capture. Pass forget=true to also discard the
   *  previously-captured sample (gives a clean slate). */
  stopListen: (key, forget = false) => apiClient.delete(
    `/webhooks/events/${encodeURIComponent(key)}/listen${forget ? "?forget=1" : ""}`
  ),
  listEndpoints: () => apiClient.get("/webhooks/endpoints"),
  getEndpoint: (id) => apiClient.get(`/webhooks/endpoints/${id}`),
  /** Returns the plaintext signing secret ONCE — show in a copy dialog
   *  unless the operator provided a custom_secret (in which case they
   *  already know it; the server still echoes it back for confirmation). */
  createEndpoint: (payload) => apiClient.post("/webhooks/endpoints", payload),
  updateEndpoint: (id, payload) => apiClient.put(`/webhooks/endpoints/${id}`, payload),
  deleteEndpoint: (id) => apiClient.delete(`/webhooks/endpoints/${id}`),
  /** Generates a fresh secret — shown ONCE. Invalidates the previous one. */
  regenerateSecret: (id) => apiClient.post(`/webhooks/endpoints/${id}/regenerate-secret`, {}),
  /** Queues a synthetic `webhook.ping` event — operator inspects the result
   *  in the Deliveries tab afterwards. */
  pingEndpoint: (id) => apiClient.post(`/webhooks/endpoints/${id}/ping`, {}),
  listDeliveries: (params = {}) => apiClient.get("/webhooks/deliveries", { params }),
  /** Returns the FULL payload — the "listen mode" view. */
  getDelivery: (id) => apiClient.get(`/webhooks/deliveries/${id}`),
  /** Re-queues a delivery for a fresh attempt. Attempt counter preserved. */
  replayDelivery: (id) => apiClient.post(`/webhooks/deliveries/${id}/replay`, {}),
  /**
   * Bulk replay. Accepts either explicit ids[] (cap 200) or a filter
   * descriptor (cap 500). Rows whose endpoint is inactive or deleted
   * are skipped and counted separately so the UI can show a partial-
   * success summary.
   */
  bulkReplayDeliveries: (input) => apiClient.post("/webhooks/deliveries/bulk-replay", input),
  /**
   * Aggregated buried-deliveries snapshot. Pairs with bulkReplay above
   * — operators triage from this summary, then bulk-replay either by
   * explicit ids picked from `recent[]` or by filter (e.g. "every
   * permanent_failure for endpoint 7 from the last 24h").
   */
  getDeadLetterSummary: () => apiClient.get("/webhooks/deliveries/dead-letter"),
  /* ----------------------------- mTLS ------------------------------ */
  /** Per-endpoint client-cert state. Returns `configured: false` when
   *  nothing's been uploaded. Never returns the key/cert PEM — only
   *  fingerprint + expiry hint. */
  getMtlsHint: (id) => apiClient.get(`/webhooks/endpoints/${id}/mtls`),
  /** Upload a PEM cert + private key (+ optional passphrase). The
   *  server validates the pair matches with openssl_x509_check_private_key
   *  before persisting, so a mismatched-pair mistake is caught at save
   *  time rather than at delivery time. */
  setMtls: (id, payload) => apiClient.post(`/webhooks/endpoints/${id}/mtls`, payload),
  clearMtls: (id) => apiClient.delete(`/webhooks/endpoints/${id}/mtls`)
};
function objectToRows(obj) {
  return Object.entries(obj || {}).map(([k, v]) => ({ key: k, value: v }));
}
function rowsToObject(rows) {
  const out = {};
  for (const r of rows) {
    const k = r.key.trim();
    const v = r.value;
    if (k === "") continue;
    out[k] = v;
  }
  return out;
}
const KeyValueEditor = ({ rows, onChange, keyPlaceholder, valuePlaceholder, idPrefix }) => {
  const setRow = (idx, patch) => {
    const next = rows.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const removeRow = (idx) => {
    onChange(rows.filter((_, i) => i !== idx));
  };
  const addRow = () => onChange([...rows, { key: "", value: "" }]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __("None configured.", "yatra") }) : rows.map((row, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          id: `${idPrefix}-key-${idx}`,
          "aria-label": keyPlaceholder,
          value: row.key,
          onChange: (e) => setRow(idx, { key: e.target.value }),
          placeholder: keyPlaceholder,
          className: "font-mono text-sm flex-1"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          id: `${idPrefix}-value-${idx}`,
          "aria-label": valuePlaceholder,
          value: row.value,
          onChange: (e) => setRow(idx, { value: e.target.value }),
          placeholder: valuePlaceholder,
          className: "font-mono text-sm flex-[2]"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          size: "sm",
          onClick: () => removeRow(idx),
          "aria-label": __("Remove row", "yatra"),
          className: "flex-shrink-0",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" })
        }
      )
    ] }, idx)),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: addRow, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-3.5 w-3.5" }),
      __("Add row", "yatra")
    ] })
  ] });
};
function getInitialTab() {
  if (typeof window === "undefined") return "endpoints";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab === "deliveries" || tab === "logs") return "deliveries";
  if (tab === "buried" || tab === "dead-letter" || tab === "dlq") return "buried";
  return "endpoints";
}
const Webhooks = () => {
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
    queryKey: ["webhooks-meta"],
    queryFn: () => webhooksApi.getMeta()
  });
  if (metaLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-10 w-10 animate-spin text-gray-400" }) });
  }
  if (!meta) return null;
  if (!meta.is_agency_active) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        PageHeader,
        {
          description: __(
            "Push every Yatra event to your CRM, accounting tool, Zapier, Make, Slack, or any HTTPS endpoint.",
            "yatra"
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(UpgradeCard, { meta })
    ] });
  }
  if (!meta.is_module_enabled) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        PageHeader,
        {
          description: __(
            "Push every Yatra event to your CRM, accounting tool, Zapier, Make, Slack, or any HTTPS endpoint.",
            "yatra"
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ModulePrompt, {})
    ] });
  }
  const tabs = [
    { key: "endpoints", label: __("Endpoints", "yatra"), icon: Webhook },
    { key: "deliveries", label: __("Deliveries", "yatra"), icon: Clock },
    // "Buried" surfaces every delivery that exhausted retries +
    // landed in permanent_failure. Bulk-replay lives here so operators
    // triage from the summary instead of paging through deliveries.
    { key: "buried", label: __("Buried", "yatra"), icon: AlertTriangle }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        description: __(
          "HMAC-signed outbound events. HTTPS endpoints only, encrypted secrets, automatic retry with exponential backoff, full delivery log with payload inspection + replay.",
          "yatra"
        )
      }
    ),
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
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
        activeTab === "endpoints" && /* @__PURE__ */ jsxRuntimeExports.jsx(EndpointsTab, {}),
        activeTab === "deliveries" && /* @__PURE__ */ jsxRuntimeExports.jsx(DeliveriesTab, {}),
        activeTab === "buried" && /* @__PURE__ */ jsxRuntimeExports.jsx(BuriedTab, {})
      ] })
    ] })
  ] });
};
const UpgradeCard = ({ meta }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "max-w-3xl", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Webhooks", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "mt-1", children: __(
        "Available on the Agency plan. The integration backbone for agencies wiring Yatra into a custom tech stack — sync bookings to CRMs, post revenue events to accounting tools, trigger Zapier workflows, ping Slack on VIP bookings.",
        "yatra"
      ) })
    ] })
  ] }) }),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [
      [
        __("Encrypted per-endpoint secrets", "yatra"),
        __("Libsodium-backed at-rest encryption.", "yatra")
      ],
      [
        __("HMAC-SHA256 signed payloads", "yatra"),
        __("Stripe-style signature header.", "yatra")
      ],
      [
        __("Automatic retry with backoff", "yatra"),
        __("5 attempts with jittered exponential delay.", "yatra")
      ],
      [
        __("Full delivery log + replay", "yatra"),
        __("Every payload preserved for 90 days.", "yatra")
      ]
    ].map(([title, sub]) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-gray-200 dark:border-gray-700 p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: sub })
      ] })
    ] }) }, title)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: meta.upgrade_url, target: "_blank", rel: "noopener noreferrer", children: [
        __("Upgrade to Agency", "yatra"),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "ml-1.5 h-4 w-4" })
      ] }) }),
      meta.docs_url && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: meta.docs_url, target: "_blank", rel: "noopener noreferrer", children: __("Read the docs", "yatra") }) })
    ] })
  ] })
] });
const ModulePrompt = () => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "max-w-3xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Webhook, { className: "h-5 w-5 text-blue-500" }),
    __("Enable the Webhooks module", "yatra")
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
    'Toggle "Webhooks" on under Yatra → Modules to start configuring endpoints.',
    "yatra"
  ) })
] }) });
const EndpointsTab = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editing, setEditing] = reactExports.useState(null);
  const [pendingDelete, setPendingDelete] = reactExports.useState(null);
  const [revealSecret, setRevealSecret] = reactExports.useState(null);
  const [pingInspectId, setPingInspectId] = reactExports.useState(null);
  const [mtlsEndpoint, setMtlsEndpoint] = reactExports.useState(null);
  const { data: endpointsData, isLoading } = useQuery({
    queryKey: ["webhooks-endpoints"],
    queryFn: () => webhooksApi.listEndpoints()
  });
  const { data: eventsData } = useQuery({
    queryKey: ["webhooks-events"],
    queryFn: () => webhooksApi.listEvents()
  });
  const deleteEndpoint = useMutation({
    mutationFn: (id) => webhooksApi.deleteEndpoint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-endpoints"] });
      showToast(__("Endpoint deleted.", "yatra"), "success");
      setPendingDelete(null);
    },
    onError: (e) => {
      showToast(extractError(e), "error");
      setPendingDelete(null);
    }
  });
  const pingEndpoint = useMutation({
    mutationFn: (id) => webhooksApi.pingEndpoint(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-deliveries"] });
      setPingInspectId(res.row_id);
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const regenerateSecret = useMutation({
    mutationFn: (id) => webhooksApi.regenerateSecret(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-endpoints"] });
      const endpoint = endpointsData == null ? void 0 : endpointsData.data.find((e) => e.id === id);
      setRevealSecret({
        secret: res.secret,
        endpointName: (endpoint == null ? void 0 : endpoint.name) || __("this endpoint", "yatra")
      });
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  if (editing !== null) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      EndpointEditForm,
      {
        existing: editing === "new" ? null : editing,
        events: (eventsData == null ? void 0 : eventsData.data) ?? [],
        onClose: () => setEditing(null),
        onCreated: (secret, name) => {
          setEditing(null);
          setRevealSecret({ secret, endpointName: name });
        }
      }
    );
  }
  const endpoints = (endpointsData == null ? void 0 : endpointsData.data) ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("HTTP endpoints", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __(
          "Each endpoint receives a signed POST when one of its subscribed events fires. The signing secret is shown once on create — store it in your receiver's config.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setEditing("new"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
        __("Add endpoint", "yatra")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-visible", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0 overflow-visible", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Table,
      {
        data: endpoints,
        columns: [
          {
            key: "name",
            label: __("Endpoint", "yatra"),
            render: (ep) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Webhook, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setEditing(ep),
                    className: "font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer text-left",
                    children: ep.name
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-md",
                    title: ep.url,
                    children: ep.url
                  }
                ),
                ep.consecutive_failures >= 5 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "h-3 w-3" }),
                  ep.consecutive_failures,
                  " ",
                  __("consecutive failures", "yatra")
                ] })
              ] })
            ] })
          },
          {
            key: "status",
            label: __("Status", "yatra"),
            render: (ep) => ep.is_active ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "mr-1 h-3 w-3" }),
              __("Active", "yatra")
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "mr-1 h-3 w-3" }),
              __("Inactive", "yatra")
            ] })
          },
          {
            key: "event",
            label: __("Event", "yatra"),
            render: (ep) => /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              ep.event ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-3 w-3" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono", children: ep.event })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: "—" }),
              ep.selected_fields && ep.selected_fields.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { className: "h-3 w-3" }),
                ep.selected_fields.length,
                " ",
                __("fields", "yatra")
              ] }),
              !ep.log_deliveries && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400", children: __("Logging off", "yatra") })
            ] })
          },
          {
            key: "health",
            label: __("Health", "yatra"),
            render: (ep) => /* @__PURE__ */ jsxRuntimeExports.jsx(HealthCell, { health: ep.health })
          },
          {
            key: "last_delivered_at",
            label: __("Last delivery", "yatra"),
            render: (ep) => ep.last_delivered_at ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: new Date(ep.last_delivered_at).toLocaleString() }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5", children: ep.last_status || "—" })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: "—" })
          }
        ],
        actions: [
          {
            key: "edit",
            label: __("Edit", "yatra"),
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "w-4 h-4" }),
            onClick: (ep) => setEditing(ep)
          },
          {
            key: "ping",
            label: __("Send test ping", "yatra"),
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-4 h-4" }),
            onClick: (ep) => pingEndpoint.mutate(ep.id),
            condition: (ep) => ep.is_active
          },
          {
            key: "regenerate",
            label: __("Regenerate signing secret", "yatra"),
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4" }),
            onClick: (ep) => regenerateSecret.mutate(ep.id)
          },
          {
            key: "mtls",
            label: __("Client certificate (mTLS)", "yatra"),
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "w-4 h-4" }),
            onClick: (ep) => setMtlsEndpoint(ep)
          },
          {
            key: "delete",
            label: __("Delete endpoint", "yatra"),
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }),
            onClick: (ep) => setPendingDelete(ep),
            variant: "destructive"
          }
        ],
        isLoading,
        emptyText: __("No endpoints configured yet", "yatra"),
        emptyDescription: __(
          "Add your first endpoint to start receiving events. Common targets: Zapier catch hooks, Make scenarios, internal CRM ingest URLs, Slack webhook URLs.",
          "yatra"
        ),
        onCreateClick: () => setEditing("new")
      }
    ) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: pendingDelete !== null,
        onClose: () => {
          if (!deleteEndpoint.isPending) setPendingDelete(null);
        },
        onConfirm: () => {
          if (pendingDelete) deleteEndpoint.mutate(pendingDelete.id);
        },
        title: __("Delete endpoint?", "yatra"),
        description: pendingDelete ? __(
          'Delete "{name}"? Its delivery log will also be removed. This cannot be undone.',
          "yatra"
        ).replace("{name}", pendingDelete.name) : "",
        confirmText: __("Delete endpoint", "yatra"),
        cancelText: __("Cancel", "yatra"),
        variant: "danger",
        isLoading: deleteEndpoint.isPending
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SecretRevealDialog,
      {
        secret: (revealSecret == null ? void 0 : revealSecret.secret) ?? null,
        endpointName: (revealSecret == null ? void 0 : revealSecret.endpointName) ?? "",
        onClose: () => setRevealSecret(null)
      }
    ),
    pingInspectId !== null && /* @__PURE__ */ jsxRuntimeExports.jsx(
      DeliveryInspectDialog,
      {
        id: pingInspectId,
        onClose: () => setPingInspectId(null)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      MtlsDialog,
      {
        endpoint: mtlsEndpoint,
        onClose: () => setMtlsEndpoint(null)
      }
    )
  ] });
};
const ENVELOPE_KEYS = ["id", "type", "api_version", "occurred_at"];
function applyFieldFilter(payload, selected) {
  if (payload === null) return null;
  if (selected.length === 0 || selected.includes("*")) return payload;
  const paths = Array.from(
    new Set(
      selected.map((p) => p.trim()).filter((p) => p !== "").map((p) => p.startsWith("data.") ? p.slice(5) : p).filter((p) => p !== "")
    )
  );
  const out = {};
  for (const k of ENVELOPE_KEYS) {
    if (k in payload) out[k] = payload[k];
  }
  const data = payload.data;
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    out.data = data;
    return out;
  }
  const filteredData = {};
  for (const path of paths) {
    extractInto(data, path.split("."), 0, filteredData);
  }
  out.data = filteredData;
  return out;
}
function extractInto(tree, parts, depth, out) {
  if (depth >= parts.length) return;
  const key = parts[depth];
  if (!(key in tree)) return;
  const isLeaf = depth === parts.length - 1;
  if (isLeaf) {
    out[key] = tree[key];
    return;
  }
  const child = tree[key];
  if (typeof child !== "object" || child === null || Array.isArray(child)) {
    return;
  }
  let nested = out[key];
  if (typeof nested !== "object" || nested === null || Array.isArray(nested)) {
    nested = {};
    out[key] = nested;
  }
  extractInto(child, parts, depth + 1, nested);
}
const HealthCell = ({ health }) => {
  if (!health || health.total === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: __("No data", "yatra") });
  }
  const rate = health.success_rate ?? 0;
  const cls = rate >= 95 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : rate >= 80 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "span",
      {
        className: `inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cls}`,
        title: `${health.delivered} delivered / ${health.failed} failed (last ${health.total})`,
        children: [
          rate,
          "%"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap", children: [
      health.delivered,
      "/",
      health.total
    ] })
  ] });
};
const FieldSelectorCard = ({
  eventKey,
  eventName,
  paths,
  isLoading,
  sendAll,
  onChangeSendAll,
  selectedFields,
  onToggle,
  onSelectAll,
  onClear,
  samplePayload,
  sampleSource,
  sampleCapturedAt
}) => {
  var _a, _b, _c, _d;
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showRawPayload, setShowRawPayload] = reactExports.useState(false);
  const [payloadView, setPayloadView] = reactExports.useState("output");
  const listenQuery = useQuery({
    queryKey: ["webhooks-listen", eventKey],
    queryFn: () => webhooksApi.getListenStatus(eventKey),
    enabled: eventKey !== "",
    refetchInterval: (q) => {
      var _a2;
      return ((_a2 = q.state.data) == null ? void 0 : _a2.armed) ? 3e3 : false;
    }
  });
  const armed = ((_a = listenQuery.data) == null ? void 0 : _a.armed) ?? false;
  const expiresAt = ((_b = listenQuery.data) == null ? void 0 : _b.expires_at) ?? null;
  const armMutation = useMutation({
    mutationFn: () => webhooksApi.startListen(eventKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-listen", eventKey] });
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const disarmMutation = useMutation({
    mutationFn: (forget) => webhooksApi.stopListen(eventKey, forget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-listen", eventKey] });
      queryClient.invalidateQueries({ queryKey: ["webhooks-event-sample", eventKey] });
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  React.useEffect(() => {
    var _a2;
    if ((_a2 = listenQuery.data) == null ? void 0 : _a2.captured) {
      queryClient.invalidateQueries({ queryKey: ["webhooks-event-sample", eventKey] });
    }
  }, [(_d = (_c = listenQuery.data) == null ? void 0 : _c.captured) == null ? void 0 : _d.captured_at, eventKey, queryClient]);
  const formatSample = (val) => {
    if (val === null || val === void 0) return "null";
    if (typeof val === "string") return val === "" ? '""' : val;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (Array.isArray(val) || typeof val === "object") return JSON.stringify(val);
    return String(val);
  };
  const [now, setNow] = reactExports.useState(() => Math.floor(Date.now() / 1e3));
  React.useEffect(() => {
    if (!armed) return;
    const t = window.setInterval(() => setNow(Math.floor(Date.now() / 1e3)), 1e3);
    return () => window.clearInterval(t);
  }, [armed]);
  const remaining = armed && expiresAt ? Math.max(0, expiresAt - now) : 0;
  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");
  const sourceLabel = {
    captured: __("Captured live", "yatra"),
    delivery_log: __("From last delivery", "yatra")
  };
  const hasSample = paths.length > 0 && samplePayload !== null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { className: "h-4 w-4 text-blue-500" }),
          __("Payload fields to send", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block", children: __(
            "Pick which fields from this event's data block should be forwarded. The envelope (id, type, api_version, occurred_at) is always sent so receivers can route the event.",
            "yatra"
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400", children: __(
            "Fields ship in the JSON body of the POST under their original keys — nested structure is preserved (e.g. customer.email arrives as data.customer.email, not flattened).",
            "yatra"
          ) })
        ] })
      ] }),
      hasSample && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: "outline",
          size: "sm",
          onClick: () => setShowRawPayload(!showRawPayload),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "mr-1.5 h-3.5 w-3.5" }),
            showRawPayload ? __("Hide payload preview", "yatra") : __("Preview payload", "yatra")
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Alert,
        {
          variant: armed ? "info" : hasSample ? "success" : "warning",
          title: armed ? `${__("Listening for", "yatra")} ${eventName}…` : hasSample ? sampleSource ? sourceLabel[sampleSource] : __("Sample ready", "yatra") : __("No sample captured yet", "yatra"),
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 flex-1 space-y-1", children: armed ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __(
                "Trigger this event in Yatra (create a booking, submit an enquiry, etc.). The real payload will appear here automatically.",
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-xs", children: [
                __("Expires in", "yatra"),
                " ",
                mm,
                ":",
                ss
              ] })
            ] }) : hasSample ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __(
                "Pick from the real fields below — these are the exact paths your receiver will see.",
                "yatra"
              ) }),
              sampleCapturedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs opacity-80", children: [
                __("Captured", "yatra"),
                " ",
                new Date(sampleCapturedAt * 1e3).toLocaleString()
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __(
              `Click "Listen for sample" then perform the action that triggers this event in Yatra. We'll show you the real payload — no guesswork.`,
              "yatra"
            ) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 flex-shrink-0", children: [
              armed ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: () => disarmMutation.mutate(false),
                  disabled: disarmMutation.isPending,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "mr-1.5 h-3.5 w-3.5" }),
                    __("Stop listening", "yatra")
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  size: "sm",
                  onClick: () => armMutation.mutate(),
                  disabled: armMutation.isPending,
                  children: [
                    armMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "mr-1.5 h-3.5 w-3.5" }),
                    hasSample ? __("Re-capture sample", "yatra") : __("Listen for sample", "yatra")
                  ]
                }
              ),
              hasSample && !armed && /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { content: __("Discard the captured sample", "yatra"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: () => disarmMutation.mutate(true),
                  disabled: disarmMutation.isPending,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-1.5 h-3.5 w-3.5" }),
                    __("Clear", "yatra")
                  ]
                }
              ) })
            ] })
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "label",
        {
          htmlFor: `webhook-send-all-${eventKey}`,
          className: `flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${sendAll ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                id: `webhook-send-all-${eventKey}`,
                type: "radio",
                name: "webhook-field-mode",
                checked: sendAll,
                onChange: () => onChangeSendAll(true),
                className: "h-4 w-4 mt-0.5 flex-shrink-0"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("Send the full payload", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                "POSTs the entire envelope + data block — every field under its original key. Recommended when your receiver picks what it needs.",
                "yatra"
              ) })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "label",
        {
          htmlFor: `webhook-select-${eventKey}`,
          className: `flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${!sendAll ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"} ${!hasSample ? "opacity-50 pointer-events-none" : ""}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                id: `webhook-select-${eventKey}`,
                type: "radio",
                name: "webhook-field-mode",
                checked: !sendAll,
                onChange: () => onChangeSendAll(false),
                disabled: !hasSample,
                className: "h-4 w-4 mt-0.5 flex-shrink-0"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: [
                __("Send only selected fields", "yatra"),
                !hasSample && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-xs font-normal text-gray-500 dark:text-gray-400", children: [
                  "(",
                  __("capture a sample first", "yatra"),
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                "Only the dot-paths you tick will ship in data{…}. Nested structure is preserved (picking customer.email keeps it nested, not flattened). Useful to strip PII or fields a downstream system bills you for.",
                "yatra"
              ) })
            ] })
          ]
        }
      ),
      !sendAll && hasSample && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-gray-500 dark:text-gray-400", children: __(
          "Each row is a dot-path inside data{}. The value shown is from the real captured sample — your receiver will get that same key, at that same nesting.",
          "yatra"
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
            selectedFields.length,
            " / ",
            paths.length,
            " ",
            __("fields selected", "yatra")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: onSelectAll,
                disabled: paths.length === 0,
                children: __("Select all", "yatra")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: onClear,
                disabled: selectedFields.length === 0,
                children: __("Clear", "yatra")
              }
            )
          ] })
        ] }),
        isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-6 w-6 animate-spin text-gray-400" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1", children: paths.map((row) => {
          const checked = selectedFields.includes(row.path);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "label",
            {
              htmlFor: `field-${row.path}`,
              className: `flex items-start gap-2 p-2.5 rounded-md border cursor-pointer transition-colors ${checked ? "border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    id: `field-${row.path}`,
                    type: "checkbox",
                    checked,
                    onChange: () => onToggle(row.path),
                    className: "h-4 w-4 mt-0.5 rounded border-gray-300 flex-shrink-0"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs font-mono text-gray-900 dark:text-white break-all", children: row.path }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate", children: formatSample(row.sample) })
                ] })
              ]
            },
            row.path
          );
        }) })
      ] }),
      showRawPayload && samplePayload && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setPayloadView("output"),
                className: `px-3 py-1.5 text-xs font-medium transition-colors ${payloadView === "output" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`,
                children: __("Output (what your receiver gets)", "yatra")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setPayloadView("raw"),
                className: `px-3 py-1.5 text-xs font-medium border-l border-gray-200 dark:border-gray-700 transition-colors ${payloadView === "raw" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`,
                children: __("Input (full event data)", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CopyButton,
            {
              text: JSON.stringify(
                payloadView === "output" ? applyFieldFilter(samplePayload, sendAll ? [] : selectedFields) : samplePayload,
                null,
                2
              )
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-xs font-mono bg-gray-900 text-gray-100 dark:bg-black rounded-md p-3 max-h-80 overflow-auto whitespace-pre-wrap", children: JSON.stringify(
          payloadView === "output" ? applyFieldFilter(samplePayload, sendAll ? [] : selectedFields) : samplePayload,
          null,
          2
        ) }),
        payloadView === "output" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 p-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-blue-800 dark:text-blue-300", children: sendAll || selectedFields.length === 0 ? __(
          "Send full payload mode — every field above ships in the POST body, exactly as shown.",
          "yatra"
        ) : __(
          "These are the exact JSON bytes that will be POSTed to your receiver. Keys stay nested under their original paths.",
          "yatra"
        ) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-gray-500 dark:text-gray-400", children: sampleSource === "captured" ? __("Captured live from a real event firing.", "yatra") : __(
          "Pulled from the most recent successful delivery for this event.",
          "yatra"
        ) })
      ] })
    ] })
  ] });
};
const EndpointEditForm = ({ existing, events, onClose, onCreated }) => {
  var _a, _b, _c, _d, _e;
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isCreate = existing === null;
  const [name, setName] = reactExports.useState((existing == null ? void 0 : existing.name) ?? "");
  const [url, setUrl] = reactExports.useState((existing == null ? void 0 : existing.url) ?? "");
  const [description, setDescription] = reactExports.useState((existing == null ? void 0 : existing.description) ?? "");
  const [eventKey, setEventKey] = reactExports.useState((existing == null ? void 0 : existing.event) ?? "");
  const [showEventDropdown, setShowEventDropdown] = reactExports.useState(false);
  const [httpMethod, setHttpMethod] = reactExports.useState(
    (existing == null ? void 0 : existing.http_method) ?? "POST"
  );
  const [isActive, setIsActive] = reactExports.useState((existing == null ? void 0 : existing.is_active) ?? true);
  const [logDeliveries, setLogDeliveries] = reactExports.useState(
    (existing == null ? void 0 : existing.log_deliveries) ?? true
  );
  const [selectedFields, setSelectedFields] = reactExports.useState(
    (existing == null ? void 0 : existing.selected_fields) ?? []
  );
  const [sendAllData, setSendAllData] = reactExports.useState(
    (((_a = existing == null ? void 0 : existing.selected_fields) == null ? void 0 : _a.length) ?? 0) === 0
  );
  const [headerRows, setHeaderRows] = reactExports.useState(
    () => objectToRows((existing == null ? void 0 : existing.headers) ?? {})
  );
  const [extraRows, setExtraRows] = reactExports.useState(
    () => objectToRows((existing == null ? void 0 : existing.additional_payload_fields) ?? {})
  );
  const [useCustomSecret, setUseCustomSecret] = reactExports.useState(false);
  const [customSecret, setCustomSecret] = reactExports.useState("");
  const buildPayload = () => {
    const payload = {
      name,
      url,
      description,
      event: eventKey,
      http_method: httpMethod,
      headers: rowsToObject(headerRows),
      additional_payload_fields: rowsToObject(extraRows),
      // Empty list = "send everything"; the server keeps null in DB.
      selected_fields: sendAllData ? [] : selectedFields,
      is_active: isActive,
      log_deliveries: logDeliveries
    };
    if (useCustomSecret && customSecret.trim() !== "") {
      payload.custom_secret = customSecret.trim();
    }
    return payload;
  };
  const createMutation = useMutation({
    mutationFn: () => webhooksApi.createEndpoint(buildPayload()),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-endpoints"] });
      onCreated(res.secret, res.data.name);
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const updateMutation = useMutation({
    mutationFn: () => webhooksApi.updateEndpoint(existing.id, buildPayload()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-endpoints"] });
      showToast(__("Endpoint updated.", "yatra"), "success");
      onClose();
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const selectedEvent = reactExports.useMemo(
    () => events.find((e) => e.key === eventKey) ?? null,
    [events, eventKey]
  );
  const sampleQuery = useQuery({
    queryKey: ["webhooks-event-sample", eventKey],
    queryFn: () => webhooksApi.getEventSample(eventKey),
    enabled: eventKey !== "",
    staleTime: 3e4
  });
  const samplePaths = ((_b = sampleQuery.data) == null ? void 0 : _b.paths) ?? [];
  const samplePayload = ((_c = sampleQuery.data) == null ? void 0 : _c.payload) ?? null;
  const sampleSource = ((_d = sampleQuery.data) == null ? void 0 : _d.source) ?? null;
  const sampleCapturedAt = ((_e = sampleQuery.data) == null ? void 0 : _e.captured_at) ?? null;
  const toggleField = (path) => {
    setSelectedFields(
      (prev) => prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };
  const selectAllFields = () => setSelectedFields(samplePaths.map((p) => p.path));
  const clearAllFields = () => setSelectedFields([]);
  const customSecretValid = !useCustomSecret || customSecret.trim().length >= 24;
  const fieldSelectionValid = sendAllData || selectedFields.length > 0;
  const canSave = name.trim() !== "" && url.trim() !== "" && eventKey !== "" && customSecretValid && fieldSelectionValid && !createMutation.isPending && !updateMutation.isPending;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: isCreate ? __("Add endpoint", "yatra") : __("Edit endpoint", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Cancel", "yatra") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Destination", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "HTTPS-only. We sign every request with HMAC-SHA256 — your receiver verifies the X-Yatra-Signature header against your stored secret.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "webhook-name", children: __("Name", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "webhook-name",
              value: name,
              onChange: (e) => setName(e.target.value),
              placeholder: __("Zapier — booking sync", "yatra"),
              className: "mt-1"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "webhook-url", children: __("URL", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "webhook-url",
              type: "url",
              value: url,
              onChange: (e) => setUrl(e.target.value),
              placeholder: "https://hooks.zapier.com/hooks/catch/12345/abcdef/",
              className: "mt-1 font-mono text-sm"
            }
          ),
          url.trim().startsWith("http://") ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "h-3.5 w-3.5 mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __(
              "Insecure URL — http:// is only accepted in WP_DEBUG mode for local development. Production receivers must use https://.",
              "yatra"
            ) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __("Must use HTTPS in production.", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "webhook-description", children: [
            __("Description", "yatra"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-normal text-gray-500", children: [
              "(",
              __("optional", "yatra"),
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "webhook-description",
              value: description,
              onChange: (e) => setDescription(e.target.value),
              placeholder: __("Internal CRM ingest — sales team", "yatra"),
              className: "mt-1"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "webhook-method", children: __("HTTP method", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              id: "webhook-method",
              value: httpMethod,
              onChange: (e) => setHttpMethod(e.target.value),
              className: "mt-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "POST", children: [
                  "POST ",
                  __("(default — recommended)", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "PUT", children: "PUT" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "PATCH", children: "PATCH" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "DELETE", children: "DELETE" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "GET", children: "GET" })
              ]
            }
          ),
          httpMethod === "GET" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "h-3.5 w-3.5 mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __(
              "GET deliveries send the payload as a ?payload=<json> query parameter (URL-encoded). The HMAC signature is then computed over an empty body — receivers should reconstruct the signed string as `timestamp + '.' + ''`. Only use GET when the receiver explicitly requires it.",
              "yatra"
            ) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
            "POST is the universal webhook convention. PUT / PATCH / DELETE are for receivers that explicitly require them (upsert, partial update, object-removal mirrors).",
            "yatra"
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-700 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "webhook-is-active", className: "font-normal cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-medium text-gray-900 dark:text-white", children: __("Active", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __("Start delivering events as soon as this is saved.", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Switch,
            {
              checked: isActive,
              onCheckedChange: setIsActive,
              className: "flex-shrink-0"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-700 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "webhook-log-deliveries", className: "font-normal cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-medium text-gray-900 dark:text-white", children: __("Log delivery payloads", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: logDeliveries ? __(
              "Stores the full POST body + receiver response on every attempt (90-day retention). Recommended for debugging.",
              "yatra"
            ) : __(
              "Only metadata (status, duration, attempts) is stored. Saves disk on high-volume endpoints, but the inspector won't show payload or response bodies.",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Switch,
            {
              checked: logDeliveries,
              onCheckedChange: setLogDeliveries,
              className: "flex-shrink-0"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Trigger event", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "Pick the single event that triggers this endpoint. The field selector below will then show you the exact payload shape so you can choose which data to forward.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => setShowEventDropdown(!showEventDropdown),
              className: "w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-colors",
              children: [
                selectedEvent ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-4 h-4 text-blue-500 flex-shrink-0" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-gray-900 dark:text-white truncate", children: selectedEvent.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded font-mono", children: selectedEvent.key })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-4 h-4 text-gray-400" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Choose an event…", "yatra") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ChevronDown,
                  {
                    className: `w-4 h-4 text-gray-400 transition-transform ${showEventDropdown ? "rotate-180" : ""}`
                  }
                )
              ]
            }
          ),
          showEventDropdown && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 px-2", children: __(
              "Select the Yatra event that should fire this webhook",
              "yatra"
            ) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-1", children: events.map((event) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  setEventKey(event.key);
                  setShowEventDropdown(false);
                  if (event.key !== eventKey) {
                    setSelectedFields([]);
                    setSendAllData(true);
                  }
                },
                className: `w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${eventKey === event.key ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Zap,
                    {
                      className: `w-4 h-4 mt-0.5 flex-shrink-0 ${eventKey === event.key ? "text-blue-500" : "text-gray-400"}`
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: `text-sm font-medium ${eventKey === event.key ? "text-blue-800 dark:text-blue-400" : "text-gray-900 dark:text-white"}`,
                          children: event.name
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded", children: event.key })
                    ] }),
                    event.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2", children: event.description })
                  ] }),
                  eventKey === event.key && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4 text-blue-500 flex-shrink-0" })
                ] })
              },
              event.key
            )) })
          ] }),
          showEventDropdown && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "fixed inset-0 z-40",
              onClick: () => setShowEventDropdown(false)
            }
          )
        ] }),
        (selectedEvent == null ? void 0 : selectedEvent.description) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-indigo-800 dark:text-indigo-300", children: selectedEvent.description }) })
      ] })
    ] }),
    eventKey !== "" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      FieldSelectorCard,
      {
        eventKey,
        eventName: (selectedEvent == null ? void 0 : selectedEvent.name) ?? eventKey,
        paths: samplePaths,
        isLoading: sampleQuery.isLoading,
        sendAll: sendAllData,
        onChangeSendAll: (next) => {
          setSendAllData(next);
          if (next) setSelectedFields([]);
        },
        selectedFields,
        onToggle: toggleField,
        onSelectAll: selectAllFields,
        onClear: clearAllFields,
        samplePayload,
        sampleSource,
        sampleCapturedAt
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Custom HTTP headers", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "Sent alongside Yatra's signed headers on every request. Useful for receivers that require Bearer / Basic auth on TOP of the HMAC signature, or for tagging requests for routing. Reserved headers (X-Yatra-*, Content-Length, Host, Cookie) are blocked.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        KeyValueEditor,
        {
          rows: headerRows,
          onChange: setHeaderRows,
          keyPlaceholder: __("Header name (e.g. Authorization)", "yatra"),
          valuePlaceholder: __("Header value (e.g. Bearer xyz)", "yatra"),
          idPrefix: "webhook-header"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Additional payload fields", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          `Static fields merged into every payload's "data" block. Use this to tag events with operator-specific metadata (tenant_id, environment, region, source_app) without writing a server-side filter. Operator fields never overwrite Yatra's canonical entity fields.`,
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        KeyValueEditor,
        {
          rows: extraRows,
          onChange: setExtraRows,
          keyPlaceholder: __("Field key (e.g. tenant_id)", "yatra"),
          valuePlaceholder: __("Static value (e.g. acme-prod)", "yatra"),
          idPrefix: "webhook-extra"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4 text-green-500" }),
          __("Signing secret", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: isCreate ? __(
          "By default Yatra generates a strong random 32-byte signing secret. If your receiver already has a secret configured (e.g. you're migrating from another system), paste it below — minimum 24 characters.",
          "yatra"
        ) : __(
          "Leave unchecked to keep the existing secret. Check to rotate to a new one — receivers using the old secret will start failing signature verification until you update them.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-700 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "webhook-use-custom-secret", className: "font-normal cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-medium text-gray-900 dark:text-white", children: isCreate ? __("Use my own signing secret", "yatra") : __("Rotate to a new signing secret", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: isCreate ? __("Provide a 24+ character secret instead of letting Yatra auto-generate one.", "yatra") : __("Replaces the current secret. Receivers using the old one will start failing signature verification.", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Switch,
            {
              checked: useCustomSecret,
              onCheckedChange: (next) => {
                setUseCustomSecret(next);
                if (!next) setCustomSecret("");
              },
              className: "flex-shrink-0"
            }
          )
        ] }),
        useCustomSecret && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "webhook-custom-secret",
              type: "password",
              value: customSecret,
              onChange: (e) => setCustomSecret(e.target.value),
              placeholder: __("Paste your signing secret (min 24 chars)", "yatra"),
              className: "font-mono text-sm",
              "aria-describedby": "webhook-custom-secret-help"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { id: "webhook-custom-secret-help", className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: customSecret.length > 0 && customSecret.length < 24 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-amber-600 dark:text-amber-400", children: [
            __("Too short — need at least 24 characters.", "yatra"),
            " ",
            "(",
            customSecret.length,
            "/24)"
          ] }) : __("Stored encrypted at rest. Treat it like a password.", "yatra") })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Cancel", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          disabled: !canSave,
          onClick: () => isCreate ? createMutation.mutate() : updateMutation.mutate(),
          children: createMutation.isPending || updateMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }),
            __("Saving…", "yatra")
          ] }) : isCreate ? __("Create endpoint", "yatra") : __("Save changes", "yatra")
        }
      )
    ] })
  ] });
};
const SecretRevealDialog = ({ secret, endpointName, onClose }) => {
  const [copied, setCopied] = reactExports.useState(false);
  const [snippetLang, setSnippetLang] = reactExports.useState("php");
  const doCopy = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2e3);
    } catch (_e) {
    }
  };
  if (!secret) return null;
  const snippets = {
    php: `// PHP receiver verification
$signature = $_SERVER['HTTP_X_YATRA_SIGNATURE'] ?? '';
$body = file_get_contents('php://input');
$parts = [];
foreach (explode(',', $signature) as $kv) {
    [$k, $v] = array_pad(explode('=', $kv, 2), 2, '');
    $parts[$k] = $v;
}
$ts = (int) ($parts['t'] ?? 0);
$sig = $parts['v1'] ?? '';
// Reject replays > 5 min old
if (abs(time() - $ts) > 300) { http_response_code(400); exit; }
$expected = hash_hmac('sha256', $ts . '.' . $body, '${secret}');
if (!hash_equals($expected, $sig)) { http_response_code(401); exit; }
// Signature valid — process json_decode($body, true)`,
    node: `// Node.js (Express) receiver verification
import crypto from 'crypto';
app.post('/webhook', express.raw({ type: '*/*' }), (req, res) => {
  const sig = req.header('x-yatra-signature') || '';
  const parts = Object.fromEntries(
    sig.split(',').map(kv => kv.split('=', 2))
  );
  const ts = parseInt(parts.t || '0', 10);
  // Reject replays > 5 min old
  if (Math.abs(Date.now() / 1000 - ts) > 300) return res.status(400).end();
  const expected = crypto
    .createHmac('sha256', '${secret}')
    .update(\`\${ts}.\${req.body}\`)
    .digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1 || ''))) {
    return res.status(401).end();
  }
  const event = JSON.parse(req.body);
  // …handle event
});`,
    python: `# Python (Flask) receiver verification
import hmac, hashlib, time
from flask import request, abort

@app.route('/webhook', methods=['POST'])
def webhook():
    sig = request.headers.get('X-Yatra-Signature', '')
    parts = dict(kv.split('=', 1) for kv in sig.split(',') if '=' in kv)
    ts = int(parts.get('t', '0'))
    if abs(time.time() - ts) > 300:
        abort(400)  # replay protection
    expected = hmac.new(
        b'${secret}',
        f"{ts}.{request.data.decode()}".encode(),
        hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected, parts.get('v1', '')):
        abort(401)
    event = request.get_json()
    # …handle event`
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      isOpen: true,
      onClose,
      title: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "w-5 h-5 text-green-500" }),
        __("Signing secret", "yatra")
      ] }),
      size: "lg",
      hideFooter: false,
      footer: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onClose, children: __("I've saved it", "yatra") }) }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-700 dark:text-gray-200", children: [
          __(
            "Below is the signing secret for ",
            "yatra"
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: endpointName }),
          ".",
          " ",
          __(
            "It will not be shown again — copy it now and store it in your receiver's configuration. If you lose it, you'll need to regenerate (which invalidates the old one).",
            "yatra"
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: secret,
              readOnly: true,
              onFocus: (e) => e.currentTarget.select(),
              className: "font-mono text-sm",
              "aria-label": __("Signing secret value", "yatra")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: doCopy, variant: "outline", children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-1.5 h-4 w-4" }),
            __("Copied", "yatra")
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "mr-1.5 h-4 w-4" }),
            __("Copy", "yatra")
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1 gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: __("Verify the signature on your receiver", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
              ["php", "node", "python"].map((lang) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setSnippetLang(lang),
                  className: `px-2 py-1 rounded text-xs font-medium transition-colors ${snippetLang === lang ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`,
                  children: lang.toUpperCase()
                },
                lang
              )),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CopyButton, { text: snippets[snippetLang] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-gray-900 text-gray-100 dark:bg-black rounded-md p-3 text-[11px] font-mono overflow-auto max-h-64 whitespace-pre-wrap", children: snippets[snippetLang] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 text-xs text-amber-700 dark:text-amber-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "h-4 w-4 flex-shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: __(
            "Treat this secret like a password. Anyone with it can forge requests that appear to come from Yatra.",
            "yatra"
          ) })
        ] }) })
      ] })
    }
  );
};
const DeliveriesTab = () => {
  const [page, setPage] = reactExports.useState(1);
  const [statusFilter, setStatusFilter] = reactExports.useState("");
  const [endpointFilter, setEndpointFilter] = reactExports.useState(0);
  const [eventFilter, setEventFilter] = reactExports.useState("");
  const [inspectId, setInspectId] = reactExports.useState(null);
  const perPage = 25;
  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, endpointFilter, eventFilter]);
  const { data, isLoading } = useQuery({
    queryKey: ["webhooks-deliveries", page, perPage, statusFilter, endpointFilter, eventFilter],
    queryFn: () => webhooksApi.listDeliveries({
      page,
      per_page: perPage,
      ...statusFilter ? { status: statusFilter } : {},
      ...endpointFilter ? { endpoint_id: endpointFilter } : {},
      ...eventFilter ? { event_key: eventFilter } : {}
    }),
    refetchInterval: 1e4,
    placeholderData: (prev) => prev
  });
  const { data: endpointsData } = useQuery({
    queryKey: ["webhooks-endpoints"],
    queryFn: () => webhooksApi.listEndpoints()
  });
  const { data: eventsData } = useQuery({
    queryKey: ["webhooks-events"],
    queryFn: () => webhooksApi.listEvents()
  });
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const replayMutation = useMutation({
    mutationFn: (id) => webhooksApi.replayDelivery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-deliveries"] });
      showToast(__("Delivery re-queued.", "yatra"), "success");
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const rows = (data == null ? void 0 : data.data) ?? [];
  const total = (data == null ? void 0 : data.total) ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasFilters = !!(statusFilter || endpointFilter || eventFilter);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5 text-blue-500" }),
        __("Delivery log", "yatra")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __(
        "Every outbound POST attempt with status, response, and the full payload that was sent. Click any row to inspect the JSON your receiver got.",
        "yatra"
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: String(endpointFilter),
          onChange: (e) => setEndpointFilter(Number(e.target.value)),
          "aria-label": __("Filter by endpoint", "yatra"),
          className: "w-full lg:w-64 lg:flex-none",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "0", children: __("All endpoints", "yatra") }),
            ((endpointsData == null ? void 0 : endpointsData.data) ?? []).map((ep) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: ep.id, children: ep.name }, ep.id))
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: eventFilter,
          onChange: (e) => setEventFilter(e.target.value),
          "aria-label": __("Filter by event", "yatra"),
          className: "w-full lg:w-56 lg:flex-none",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __("All events", "yatra") }),
            ((eventsData == null ? void 0 : eventsData.data) ?? []).map((ev) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: ev.key, children: [
              ev.name,
              " (",
              ev.key,
              ")"
            ] }, ev.key))
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: statusFilter,
          onChange: (e) => setStatusFilter(e.target.value),
          "aria-label": __("Filter by status", "yatra"),
          className: "w-full lg:w-48 lg:flex-none",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __("All statuses", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "queued", children: __("Queued", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "delivering", children: __("Delivering", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "delivered", children: __("Delivered", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "failed", children: __("Failed (retrying)", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "permanent_failure", children: __("Permanent failure", "yatra") })
          ]
        }
      ),
      hasFilters && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          onClick: () => {
            setStatusFilter("");
            setEndpointFilter(0);
            setEventFilter("");
          },
          className: "w-full lg:w-auto",
          children: __("Reset", "yatra")
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-visible", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-0 overflow-visible", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Table,
        {
          data: rows,
          columns: [
            {
              key: "event_key",
              label: __("Event", "yatra"),
              render: (d) => {
                const ep = endpointsData == null ? void 0 : endpointsData.data.find(
                  (e) => e.id === d.endpoint_id
                );
                return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setInspectId(d.id),
                      className: "font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer text-left",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: d.event_key })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-md",
                      title: (ep == null ? void 0 : ep.url) || "",
                      children: [
                        "→ ",
                        (ep == null ? void 0 : ep.name) ?? `#${d.endpoint_id}`
                      ]
                    }
                  )
                ] });
              }
            },
            {
              key: "status",
              label: __("Status", "yatra"),
              render: (d) => /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: d.status, httpStatus: d.http_status })
            },
            {
              key: "attempts",
              label: __("Attempts", "yatra"),
              render: (d) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-600 dark:text-gray-300", children: d.attempts })
            },
            {
              key: "duration_ms",
              label: __("Duration", "yatra"),
              render: (d) => d.duration_ms !== null ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap", children: [
                d.duration_ms,
                " ms"
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: "—" })
            },
            {
              key: "created_at",
              label: __("Created", "yatra"),
              render: (d) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap", children: d.created_at ? new Date(d.created_at).toLocaleString() : "—" })
            }
          ],
          actions: [
            {
              key: "inspect",
              label: __("Inspect payload + response", "yatra"),
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4" }),
              onClick: (d) => setInspectId(d.id)
            },
            {
              key: "replay",
              label: __("Replay delivery", "yatra"),
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "w-4 h-4" }),
              onClick: (d) => replayMutation.mutate(d.id),
              condition: (d) => d.status === "failed" || d.status === "permanent_failure"
            }
          ],
          isLoading,
          emptyText: total === 0 && !hasFilters ? __("No deliveries yet", "yatra") : __("No matches", "yatra"),
          emptyDescription: total === 0 && !hasFilters ? __(
            "Deliveries appear here once an event fires. Use the Ping button on an endpoint to fire a test event.",
            "yatra"
          ) : __(
            "Try adjusting your filters to see more results.",
            "yatra"
          )
        }
      ),
      rows.length > 0 && totalPages > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-gray-200 px-4 py-3 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Pagination,
        {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: perPage,
          onPageChange: setPage,
          itemName: __("deliveries", "yatra")
        }
      ) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DeliveryInspectDialog, { id: inspectId, onClose: () => setInspectId(null) })
  ] });
};
const MtlsDialog = ({ endpoint, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [cert, setCert] = reactExports.useState("");
  const [keyPem, setKeyPem] = reactExports.useState("");
  const [passphrase, setPassphrase] = reactExports.useState("");
  const [mode, setMode] = reactExports.useState("view");
  const enabled = endpoint !== null;
  const { data, isLoading } = useQuery({
    queryKey: ["webhook-mtls", endpoint == null ? void 0 : endpoint.id],
    queryFn: () => webhooksApi.getMtlsHint(endpoint.id),
    enabled
  });
  const hint = data == null ? void 0 : data.data;
  React.useEffect(() => {
    if (endpoint) {
      setCert("");
      setKeyPem("");
      setPassphrase("");
      setMode((hint == null ? void 0 : hint.configured) ? "view" : "edit");
    }
  }, [endpoint == null ? void 0 : endpoint.id, hint == null ? void 0 : hint.configured]);
  const save = useMutation({
    mutationFn: () => webhooksApi.setMtls(endpoint.id, { cert, key: keyPem, passphrase }),
    onSuccess: (r) => {
      showToast(r.message, "success");
      setCert("");
      setKeyPem("");
      setPassphrase("");
      setMode("view");
      void queryClient.invalidateQueries({ queryKey: ["webhook-mtls", endpoint.id] });
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const clear = useMutation({
    mutationFn: () => webhooksApi.clearMtls(endpoint.id),
    onSuccess: (r) => {
      showToast(r.message, "success");
      void queryClient.invalidateQueries({ queryKey: ["webhook-mtls", endpoint.id] });
      onClose();
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  if (!endpoint) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      isOpen: true,
      onClose,
      title: __("Client certificate (mTLS)", "yatra"),
      size: "xl",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { variant: "info", children: __(
          "Optional. Some receivers require Yatra to authenticate at the TLS handshake with a client certificate, in addition to the HMAC signature on the body. Paste your PEM-encoded cert and private key below. The pair is encrypted at rest and used only at delivery time.",
          "yatra"
        ) }),
        isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-6 w-6 animate-spin text-gray-400" }) }) : mode === "view" && (hint == null ? void 0 : hint.configured) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-gray-200 dark:border-gray-700 p-4 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "h-4 w-4 text-green-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: __("Client certificate configured", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500 w-24 flex-shrink-0", children: __("Fingerprint", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono break-all text-gray-700 dark:text-gray-300", children: hint.fingerprint || __("(unavailable)", "yatra") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500 w-24 flex-shrink-0", children: __("Expires", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700 dark:text-gray-300", children: hint.expires_at ? new Date(hint.expires_at).toLocaleString() : __("(unknown)", "yatra") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setMode("edit"), children: __("Replace certificate", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "destructive",
                onClick: () => clear.mutate(),
                disabled: clear.isPending,
                children: [
                  clear.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-4 w-4 mr-1 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 mr-1" }),
                  __("Remove certificate", "yatra")
                ]
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "mtls-cert", children: __("Certificate (PEM)", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                id: "mtls-cert",
                className: "mt-1 w-full font-mono text-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 min-h-[140px]",
                value: cert,
                onChange: (e) => setCert(e.target.value),
                placeholder: "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "mtls-key", children: __("Private key (PEM)", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                id: "mtls-key",
                className: "mt-1 w-full font-mono text-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 min-h-[140px]",
                value: keyPem,
                onChange: (e) => setKeyPem(e.target.value),
                placeholder: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "mtls-pass", children: __("Key passphrase (optional)", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "mtls-pass",
                type: "password",
                value: passphrase,
                onChange: (e) => setPassphrase(e.target.value),
                placeholder: __("Leave blank if the key is unencrypted", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
            (hint == null ? void 0 : hint.configured) && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setMode("view"), children: __("Cancel", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: () => save.mutate(),
                disabled: !cert || !keyPem || save.isPending,
                children: [
                  save.isPending && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-4 w-4 mr-1 animate-spin" }),
                  __("Save certificate", "yatra")
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500", children: __(
            "The certificate and key are validated together before storage — if they don't match, the save is rejected. Stored encrypted with libsodium / OpenSSL AES-256-GCM.",
            "yatra"
          ) })
        ] })
      ] })
    }
  );
};
const BuriedTab = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedIds, setSelectedIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [inspectId, setInspectId] = reactExports.useState(null);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["webhook-dead-letter"],
    queryFn: () => webhooksApi.getDeadLetterSummary(),
    refetchOnWindowFocus: false
  });
  const { data: endpoints } = useQuery({
    queryKey: ["webhook-endpoints"],
    queryFn: () => webhooksApi.listEndpoints()
  });
  const endpointNameById = reactExports.useMemo(() => {
    var _a;
    const map = /* @__PURE__ */ new Map();
    (_a = endpoints == null ? void 0 : endpoints.data) == null ? void 0 : _a.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [endpoints]);
  const bulkReplay = useMutation({
    mutationFn: (input) => webhooksApi.bulkReplayDeliveries(input),
    onSuccess: (r) => {
      showToast(r.message, "success");
      setSelectedIds(/* @__PURE__ */ new Set());
      void queryClient.invalidateQueries({ queryKey: ["webhook-dead-letter"] });
      void queryClient.invalidateQueries({ queryKey: ["webhook-deliveries"] });
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-8 w-8 animate-spin text-gray-400" }) });
  }
  const summary = data == null ? void 0 : data.data;
  const total = (summary == null ? void 0 : summary.total) ?? 0;
  if (total === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "w-12 h-12 text-green-500 mx-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-4 text-base font-semibold text-gray-900 dark:text-white", children: __("Nothing buried", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto", children: __(
        "Every delivery either succeeded or is still mid-retry. Permanent failures will show up here so you can replay or investigate.",
        "yatra"
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "mt-4", onClick: () => refetch(), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}` }),
        __("Refresh", "yatra")
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-red-900 dark:text-red-100", children: sprintf(
          /* translators: %d: number of buried deliveries */
          __("%d delivery(ies) reached permanent failure", "yatra"),
          total
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-800 dark:text-red-200/90 mt-0.5", children: __(
          "These exhausted automatic retries. Group by endpoint or error pattern below and bulk-replay once the downstream issue is fixed.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => refetch(), disabled: isFetching, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}` }),
        __("Refresh", "yatra")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("By endpoint", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("Top receivers accumulating failures.", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-2", children: [
          summary.by_endpoint.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500", children: __("None.", "yatra") }),
          summary.by_endpoint.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center justify-between gap-2 rounded border border-gray-200 dark:border-gray-700 px-3 py-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white truncate", children: endpointNameById.get(row.endpoint_id) ?? `Endpoint #${row.endpoint_id}` }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500", children: sprintf(__("%d buried", "yatra"), row.count) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    size: "sm",
                    variant: "outline",
                    onClick: () => bulkReplay.mutate({
                      filter: {
                        endpoint_id: row.endpoint_id,
                        status: "permanent_failure"
                      }
                    }),
                    disabled: bulkReplay.isPending,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3.5 w-3.5 mr-1" }),
                      __("Replay all", "yatra")
                    ]
                  }
                )
              ]
            },
            row.endpoint_id
          ))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("By event", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("Event types failing most.", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-2", children: [
          summary.by_event.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500", children: __("None.", "yatra") }),
          summary.by_event.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "flex items-center justify-between gap-2 rounded border border-gray-200 dark:border-gray-700 px-3 py-2",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-mono text-gray-900 dark:text-white truncate", children: row.event_key || __("(unknown)", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500", children: sprintf(__("%d buried", "yatra"), row.count) })
              ] })
            },
            row.event_key
          ))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("By error", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("Grouped by error-message prefix.", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-2", children: [
          summary.by_error.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500", children: __("None.", "yatra") }),
          summary.by_error.map((row, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "rounded border border-gray-200 dark:border-gray-700 px-3 py-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-700 dark:text-gray-300 break-words", children: row.fingerprint }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 mt-0.5", children: sprintf(__("%d buried", "yatra"), row.count) })
              ]
            },
            `${row.fingerprint}-${idx}`
          ))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Recent buried", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: sprintf(
            /* translators: %d: number of recent rows shown */
            __("Last %d deliveries in permanent failure.", "yatra"),
            summary.recent.length
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          selectedIds.size > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-500", children: sprintf(
            /* translators: %d: number selected */
            __("%d selected", "yatra"),
            selectedIds.size
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => bulkReplay.mutate({ ids: Array.from(selectedIds) }),
              disabled: selectedIds.size === 0 || bulkReplay.isPending,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-4 w-4 mr-1" }),
                __("Replay selected", "yatra")
              ]
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left w-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: selectedIds.size > 0 && selectedIds.size === summary.recent.length,
              onChange: (e) => {
                if (e.target.checked) {
                  setSelectedIds(new Set(summary.recent.map((r) => r.id)));
                } else {
                  setSelectedIds(/* @__PURE__ */ new Set());
                }
              }
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300", children: __("Event", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300", children: __("Endpoint", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300", children: __("Attempts", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300", children: __("Error", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300", children: __("When", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 w-32 text-right font-medium text-gray-700 dark:text-gray-300", children: __("Actions", "yatra") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: summary.recent.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-800/40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: selectedIds.has(row.id),
              onChange: (e) => {
                const next = new Set(selectedIds);
                if (e.target.checked) next.add(row.id);
                else next.delete(row.id);
                setSelectedIds(next);
              }
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 font-mono text-xs text-gray-900 dark:text-white", children: row.event_key }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-gray-700 dark:text-gray-300", children: endpointNameById.get(row.endpoint_id) ?? `#${row.endpoint_id}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-gray-700 dark:text-gray-300", children: row.attempts }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-xs text-gray-600 dark:text-gray-400 max-w-md truncate", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { content: row.error_message ?? "", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: row.error_message ?? __("—", "yatra") }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-xs text-gray-500 whitespace-nowrap", children: row.created_at }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "sm",
                variant: "outline",
                onClick: () => setInspectId(row.id),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3.5 w-3.5" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "sm",
                variant: "outline",
                onClick: () => bulkReplay.mutate({ ids: [row.id] }),
                disabled: bulkReplay.isPending,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3.5 w-3.5" })
              }
            )
          ] }) })
        ] }, row.id)) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DeliveryInspectDialog, { id: inspectId, onClose: () => setInspectId(null) })
  ] });
};
const StatusBadge = ({
  status,
  httpStatus
}) => {
  const cfg = {
    queued: {
      cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      label: __("Queued", "yatra")
    },
    delivering: {
      cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
      label: __("Delivering", "yatra")
    },
    delivered: {
      cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      label: __("Delivered", "yatra")
    },
    failed: {
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      label: __("Failed", "yatra")
    },
    permanent_failure: {
      cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      label: __("Failed (final)", "yatra")
    }
  };
  const x = cfg[status] ?? {
    cls: "bg-gray-100 text-gray-700",
    label: status
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: x.cls, children: [
    x.label,
    httpStatus !== null ? ` (${httpStatus})` : ""
  ] });
};
const DeliveryInspectDialog = ({ id, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["webhooks-delivery", id],
    queryFn: () => webhooksApi.getDelivery(id),
    enabled: id !== null,
    // Auto-refetch while the row hasn't reached a terminal status.
    // Ensures the inspector reflects "queued → delivering → delivered"
    // live, which matters most right after a Ping click.
    refetchInterval: (q) => {
      var _a, _b;
      const status = (_b = (_a = q.state.data) == null ? void 0 : _a.data) == null ? void 0 : _b.status;
      const terminal = status === "delivered" || status === "permanent_failure";
      return terminal ? false : 2e3;
    }
  });
  const replay = useMutation({
    mutationFn: (deliveryId) => webhooksApi.replayDelivery(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["webhooks-delivery", id] });
      showToast(__("Delivery re-queued.", "yatra"), "success");
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  if (id === null) return null;
  const delivery = data == null ? void 0 : data.data;
  const payloadJson = delivery ? JSON.stringify(delivery.payload, null, 2) : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      isOpen: true,
      onClose,
      title: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-5 h-5 text-blue-500" }),
        __("Delivery inspector", "yatra")
      ] }),
      size: "xl",
      hideFooter: false,
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Close", "yatra") }),
        delivery && (delivery.status === "failed" || delivery.status === "permanent_failure") && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: () => replay.mutate(delivery.id),
            disabled: replay.isPending,
            children: replay.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }),
              __("Replaying…", "yatra")
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "mr-1.5 h-4 w-4" }),
              __("Replay delivery", "yatra")
            ] })
          }
        )
      ] }),
      children: isLoading || !delivery ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-8 w-8 animate-spin text-gray-400" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: __("Event", "yatra"), value: delivery.event_key, mono: true }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: __("Delivery ID", "yatra"), value: delivery.delivery_id, mono: true }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Field,
            {
              label: __("Status", "yatra"),
              raw: /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: delivery.status, httpStatus: delivery.http_status })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: __("Attempts", "yatra"), value: String(delivery.attempts) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Field,
            {
              label: __("Created", "yatra"),
              value: new Date(delivery.created_at).toLocaleString()
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Field,
            {
              label: __("Delivered", "yatra"),
              value: delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleString() : "—"
            }
          ),
          delivery.duration_ms !== null && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Field,
            {
              label: __("Duration", "yatra"),
              value: `${delivery.duration_ms} ms`
            }
          ),
          delivery.next_attempt_at && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Field,
            {
              label: __("Next attempt", "yatra"),
              value: new Date(delivery.next_attempt_at).toLocaleString()
            }
          )
        ] }),
        delivery.error_message && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-3 text-sm text-red-700 dark:text-red-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "block mb-1", children: __("Error", "yatra") }),
          delivery.error_message
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: __("Payload sent", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CopyButton, { text: payloadJson })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-gray-900 text-gray-100 dark:bg-black rounded-md p-4 text-xs font-mono overflow-auto max-h-96", children: payloadJson })
        ] }),
        delivery.response_body && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold mb-1 block", children: __("Response body", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 text-xs font-mono overflow-auto max-h-48", children: delivery.response_body })
        ] }),
        delivery.response_headers && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold mb-1 block", children: __("Response headers", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 text-xs font-mono overflow-auto max-h-32", children: delivery.response_headers })
        ] })
      ] })
    }
  );
};
const Field = ({ label, value, mono, raw }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: label }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: `text-sm text-gray-900 dark:text-white ${mono ? "font-mono" : ""}`,
      children: raw ?? value ?? "—"
    }
  )
] });
const CopyButton = ({ text }) => {
  const [copied, setCopied] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Button,
    {
      size: "sm",
      variant: "outline",
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch (_e) {
        }
      },
      children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-1 h-3 w-3" }),
        __("Copied", "yatra")
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "mr-1 h-3 w-3" }),
        __("Copy", "yatra")
      ] })
    }
  );
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
  Webhooks as default
};
//# sourceMappingURL=Webhooks-CfSK2Q_0.js.map
