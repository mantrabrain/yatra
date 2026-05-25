import { r as reactExports, u as useQuery, j as jsxRuntimeExports, U as Users, au as Shield, d as Mail, bF as History, l as Settings, b8 as Lock, Q as AlertTriangle, C as Crown, aD as CheckCircle2, V as ExternalLink, t as useQueryClient, v as useMutation, bP as UserPlus, bz as LogOut, aN as Trash2, bQ as KeyRound, aG as Copy, b6 as XCircle, D as Loader2, a5 as React, bR as Unlock, aA as Check, by as ShieldCheck } from "./react-vendor-CqkbFEvK.js";
import { a as apiClient, _ as __, s as sprintf, c as brandName, u as useToast } from "./index-DRAt5dnR.js";
import { Q as Skeleton, C as Card, d as CardContent, P as PageHeader, B as Button, f as CardHeader, g as CardTitle, h as CardDescription, S as Select, U as Table, e as Badge, V as Tooltip, k as ConfirmationDialog, M as Modal, W as Pagination, A as Alert, w as Label, X as Switch, Y as setUserCaps, I as Input } from "../../admin/dist/js/app.js";
const teamApi = {
  getMeta: () => apiClient.get("/team/meta"),
  listCapabilities: () => apiClient.get("/team/capabilities"),
  listRoles: () => apiClient.get("/team/roles"),
  createRole: (payload) => apiClient.post("/team/roles", payload),
  getRole: (slug) => apiClient.get(`/team/roles/${encodeURIComponent(slug)}`),
  updateRole: (slug, payload) => apiClient.put(
    `/team/roles/${encodeURIComponent(slug)}`,
    payload
  ),
  deleteRole: (slug, reassignTo = null) => apiClient.delete(
    `/team/roles/${encodeURIComponent(slug)}`,
    reassignTo ? { data: { reassign_to: reassignTo } } : void 0
  ),
  listUsers: () => apiClient.get("/team/users"),
  /** WP users not yet on the Yatra team — for the "Add existing user"
   *  picker. `q` is an optional type-ahead query (search by login /
   *  email / display name). */
  listAvailableUsers: (q = "", limit = 50) => apiClient.get("/team/users/available", {
    params: q ? { q, limit } : { limit }
  }),
  /** Create a brand-new WP user + assign a Yatra role in one shot.
   *  Sister flow to invitations — invitations send an email that
   *  creates the user on accept; this one provisions immediately. */
  createUser: (payload) => apiClient.post("/team/users/create", payload),
  getUser: (id) => apiClient.get(`/team/users/${id}`),
  updateUser: (id, payload) => apiClient.put(`/team/users/${id}`, payload),
  forceLogout: (id) => apiClient.post(`/team/users/${id}/force-logout`, {}),
  removeUser: (id) => apiClient.delete(`/team/users/${id}`),
  /**
   * Bulk operations on members.
   *
   * Response shape includes per-id success/failure so the UI can
   * highlight rows that didn't complete (e.g. last-admin guard
   * blocking a remove). `ok_count` is the convenience aggregate.
   */
  /** Curated role-creation templates served read-only from the server. */
  listRoleTemplates: () => apiClient.get("/team/role-templates"),
  /**
   * Module-level settings. Currently surfaces a single forward-looking
   * toggle: what should happen to non-admin team members' Yatra access
   * if the operator ever turns the Team & Access module off?
   *
   * Returns an object (not a flat boolean) so future settings can be
   * added without rev-bumping the response shape.
   */
  getSettings: () => apiClient.get("/team/settings"),
  /** Partial update — every key is optional. Backend persists only
   *  the keys present and writes an audit row when the diff is
   *  meaningful (e.g. login_ip_allowlist normalizes to a different
   *  list of CIDRs). */
  updateSettings: (payload) => apiClient.put("/team/settings", payload),
  bulkUsers: (payload) => apiClient.post("/team/users/bulk", payload),
  listInvitations: () => apiClient.get("/team/invitations"),
  sendInvitation: (payload) => apiClient.post("/team/invitations", payload),
  /**
   * Revoke or delete an invitation.
   *
   *   purge=false (default): the invitation must be `pending`. Marks
   *     it `revoked` (the magic-link token is invalidated) and keeps
   *     the row so the operator can still see it in the list.
   *   purge=true: deletes the row entirely. If the invitation was
   *     still pending, it's revoked first so the token can never be
   *     redeemed after the record is gone.
   */
  revokeInvitation: (id, opts = {}) => apiClient.delete(
    `/team/invitations/${encodeURIComponent(id)}${opts.purge ? "?purge=1" : ""}`
  ),
  acceptInvitation: (token) => apiClient.post("/team/invitations/accept", { token }),
  listAuditLog: (filters = {}) => apiClient.get("/team/audit-log", { params: filters }),
  auditFacets: () => apiClient.get("/team/audit-log/facets"),
  /**
   * Wipe every audit-log entry. Server requires `confirm: true` in the
   * body as a safety belt against accidental DELETEs. The wipe itself
   * is recorded as a new audit entry so the operator who cleared
   * history is documented.
   */
  clearAuditLog: () => apiClient.delete("/team/audit-log", {
    data: { confirm: true }
  }),
  /**
   * Delete a specific set of audit-log rows by id. Server caps at 500
   * ids per request. The deletion is recorded as a new audit entry.
   */
  bulkDeleteAuditLog: (ids) => apiClient.post("/team/audit-log/bulk-delete", { ids })
};
const extractError = (e) => {
  var _a, _b;
  return ((_b = (_a = e == null ? void 0 : e.response) == null ? void 0 : _a.data) == null ? void 0 : _b.message) || (e == null ? void 0 : e.message) || __("Something went wrong.", "yatra");
};
const getInitialTab = () => {
  if (typeof window === "undefined") return "members";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab === "roles" || tab === "invitations" || tab === "audit" || tab === "settings")
    return tab;
  return "members";
};
const Team = () => {
  var _a;
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
    queryKey: ["team-meta"],
    queryFn: () => teamApi.getMeta()
  });
  const { data: settingsData } = useQuery({
    queryKey: ["team-settings"],
    queryFn: () => teamApi.getSettings(),
    initialData: () => {
      var _a2;
      const seed = (_a2 = window.yatraAdmin) == null ? void 0 : _a2.teamKeepAccessOnModuleDisable;
      return {
        data: { keep_access_on_module_disable: seed === true }
      };
    },
    // Don't fire the network request until the module is actually
    // enabled — the /team/settings endpoint requires Team & Access
    // to be active. Initial data still serves the banner during
    // loading + non-agency states.
    enabled: (meta == null ? void 0 : meta.is_module_enabled) === true
  });
  const keepAccessOnDisable = ((_a = settingsData == null ? void 0 : settingsData.data) == null ? void 0 : _a.keep_access_on_module_disable) === true;
  if (metaLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-1/3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-2/3" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex gap-6", children: [0, 1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-24" }, i)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3 pt-4", children: [0, 1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }, i)) })
      ] })
    ] });
  }
  if (!meta) return null;
  if (!meta.is_agency_active) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        PageHeader,
        {
          description: __(
            "Granular roles, scoped access, magic-link invitations, and a tamper-evident audit log.",
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
            "Granular roles, scoped access, magic-link invitations, and a tamper-evident audit log.",
            "yatra"
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ModulePrompt, {})
    ] });
  }
  const tabs = [
    { key: "members", label: __("Members", "yatra"), icon: Users },
    { key: "roles", label: __("Roles", "yatra"), icon: Shield },
    { key: "invitations", label: __("Invitations", "yatra"), icon: Mail },
    { key: "audit", label: __("Audit log", "yatra"), icon: History },
    { key: "settings", label: __("Settings", "yatra"), icon: Settings }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        description: __(
          "Granular roles + capability-based access for multi-staff agencies. Defense-in-depth — every action gated on the server, the UI mirrors via cap-aware controls.",
          "yatra"
        )
      }
    ),
    keepAccessOnDisable ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40 p-4 flex flex-wrap items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-blue-900 dark:text-blue-100", children: __(
          "Your team will keep access if you ever turn off this module",
          "yatra"
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-blue-800 dark:text-blue-200/90 mt-0.5", children: __(
          "You've opted in to preserve team access when the module is disabled. Turning off Team & Access in Yatra → Modules will pause its advanced features (expiry, scopes, audit log) but your team members keep their roles and current access. You can change this in Settings.",
          "yatra"
        ) })
      ] }),
      activeTab !== "settings" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: () => switchTab("settings"),
          className: "border-blue-300 text-blue-900 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-100 dark:hover:bg-blue-900",
          children: __("Open Settings", "yatra")
        }
      )
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40 p-4 flex flex-wrap items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-red-900 dark:text-red-100", children: __(
          "Heads up — turning off this module will revoke all team access",
          "yatra"
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-800 dark:text-red-200/90 mt-0.5", children: __(
          "This is the default. If you ever disable Team & Access in Yatra → Modules, every Yatra role on your site (Owner, Manager, Sales Agent, plus any custom roles you built) will be removed and your team members will lose all Yatra access. Re-enabling brings back the 8 built-in roles only — custom roles and member assignments don't come back. Switch the setting ON in Settings if you'd rather keep your team's access.",
          "yatra"
        ) })
      ] }),
      activeTab !== "settings" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: () => switchTab("settings"),
          className: "border-red-300 text-red-900 hover:bg-red-100 dark:border-red-700 dark:text-red-100 dark:hover:bg-red-900",
          children: __("Open Settings", "yatra")
        }
      )
    ] }),
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
        activeTab === "members" && /* @__PURE__ */ jsxRuntimeExports.jsx(MembersTab, {}),
        activeTab === "roles" && /* @__PURE__ */ jsxRuntimeExports.jsx(RolesTab, {}),
        activeTab === "invitations" && /* @__PURE__ */ jsxRuntimeExports.jsx(InvitationsTab, {}),
        activeTab === "audit" && /* @__PURE__ */ jsxRuntimeExports.jsx(AuditLogTab, {}),
        activeTab === "settings" && /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsTab, {})
      ] })
    ] })
  ] });
};
const UpgradeCard = ({ meta }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "max-w-3xl", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Team & Access", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "mt-1", children: __(
        "Available on the Agency plan. Add staff with role-appropriate access — front desk doesn't see refund history, guides see only their destinations, accountants get financial reports without booking edits.",
        "yatra"
      ) })
    ] })
  ] }) }),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [
      [
        __("8 shipped roles + custom builder", "yatra"),
        __(
          "Owner, Manager, Sales Agent, Front Desk, Guide, Accountant, Marketing, Auditor.",
          "yatra"
        )
      ],
      [
        __("Per-user scope assignment", "yatra"),
        __("Restrict by destination, activity, or trip.", "yatra")
      ],
      [
        __("Magic-link invitations", "yatra"),
        __("Invite by email — no manual user creation.", "yatra")
      ],
      [
        __("180-day audit log", "yatra"),
        __("Every sensitive action recorded, exportable to CSV.", "yatra")
      ]
    ].map(([title, sub]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "rounded-md border border-gray-200 dark:border-gray-700 p-3",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: sub })
          ] })
        ] })
      },
      title
    )) }),
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
    /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-5 w-5 text-blue-500" }),
    __("Enable the Team & Access module", "yatra")
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: sprintf(
    /* translators: %s: brand name (e.g. "Yatra" or an operator's white-labeled brand) */
    __(
      'Toggle "Team & Access" on under %s → Modules to start configuring roles and members.',
      "yatra"
    ),
    brandName()
  ) })
] }) });
const unixToLocalInputValue = (unixSec) => {
  if (!unixSec || unixSec <= 0) return "";
  const d = new Date(unixSec * 1e3);
  const pad = (n) => n.toString().padStart(2, "0");
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
};
const AccessExpiryCell = ({ user }) => {
  if (!user.expires_at || user.expires_at <= 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: __("Permanent", "yatra") });
  }
  const now = Math.floor(Date.now() / 1e3);
  const secondsRemaining = user.expires_at - now;
  const daysRemaining = Math.ceil(secondsRemaining / 86400);
  const formatted = new Date(user.expires_at * 1e3).toLocaleString();
  if (secondsRemaining <= 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { content: formatted, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800", children: __("Expired", "yatra") }) });
  }
  if (daysRemaining <= 7) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { content: formatted, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800", children: sprintf(
      /* translators: %d: number of days */
      __("Expires in %d day(s)", "yatra"),
      daysRemaining
    ) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap", children: formatted });
};
const ExpiryNowHint = ({
  expiresLocal
}) => {
  const [now, setNow] = reactExports.useState(() => /* @__PURE__ */ new Date());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 6e4);
    return () => window.clearInterval(id);
  }, []);
  const nowFormatted = now.toLocaleString();
  let relative = "";
  if (expiresLocal) {
    const target = new Date(expiresLocal).getTime();
    const diffMs = target - now.getTime();
    const absMin = Math.abs(Math.round(diffMs / 6e4));
    if (diffMs < 0) {
      relative = __("(in the past)", "yatra");
    } else if (absMin < 60) {
      relative = sprintf(
        /* translators: %d: minutes from now */
        __("in %d min", "yatra"),
        absMin
      );
    } else if (absMin < 60 * 24) {
      relative = sprintf(
        /* translators: %d: hours from now */
        __("in %d hour(s)", "yatra"),
        Math.round(absMin / 60)
      );
    } else {
      relative = sprintf(
        /* translators: %d: days from now */
        __("in %d day(s)", "yatra"),
        Math.round(absMin / (60 * 24))
      );
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: sprintf(
      /* translators: %s: formatted current local datetime */
      __("Current time: %s", "yatra"),
      nowFormatted
    ) }),
    relative && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-blue-600 dark:text-blue-400", children: sprintf(
      /* translators: %s: relative offset like "in 3 days" */
      __("Expires %s", "yatra"),
      relative
    ) })
  ] });
};
const MembersTab = () => {
  var _a;
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editingId, setEditingId] = reactExports.useState(null);
  const [pendingRemove, setPendingRemove] = reactExports.useState(null);
  const [showAddModal, setShowAddModal] = reactExports.useState(false);
  const [showCreateModal, setShowCreateModal] = reactExports.useState(false);
  const [selectedIds, setSelectedIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [pendingBulk, setPendingBulk] = reactExports.useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["team-users"],
    queryFn: () => teamApi.listUsers()
  });
  const { data: rolesData } = useQuery({
    queryKey: ["team-roles"],
    queryFn: () => teamApi.listRoles()
  });
  const removeMutation = useMutation({
    mutationFn: (id) => teamApi.removeUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      showToast(__("Member removed.", "yatra"), "success");
      setPendingRemove(null);
    },
    onError: (e) => {
      showToast(extractError(e), "error");
      setPendingRemove(null);
    }
  });
  const forceLogoutMutation = useMutation({
    mutationFn: (id) => teamApi.forceLogout(id),
    onSuccess: () => showToast(__("All sessions invalidated.", "yatra"), "success"),
    onError: (e) => showToast(extractError(e), "error")
  });
  const bulkMutation = useMutation({
    mutationFn: (payload) => teamApi.bulkUsers(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      setSelectedIds(/* @__PURE__ */ new Set());
      setPendingBulk(null);
      if (res.data.fail_count > 0) {
        showToast(
          sprintf(
            /* translators: 1: ok count, 2: fail count */
            __("Bulk done: %1$d succeeded, %2$d failed.", "yatra"),
            res.data.ok_count,
            res.data.fail_count
          ),
          "warning"
        );
      } else {
        showToast(
          res.message || __("Bulk action complete.", "yatra"),
          "success"
        );
      }
    },
    onError: (e) => {
      showToast(extractError(e), "error");
      setPendingBulk(null);
    }
  });
  const users = (data == null ? void 0 : data.data) ?? [];
  const currentUserId = (_a = window.yatraAdmin) == null ? void 0 : _a.currentUser;
  const toggleOne = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const toggleAll = (checked) => {
    if (!checked) {
      setSelectedIds(/* @__PURE__ */ new Set());
      return;
    }
    const next = /* @__PURE__ */ new Set();
    users.forEach((u) => {
      if (u.id !== currentUserId) next.add(u.id);
    });
    setSelectedIds(next);
  };
  const roleLabels = reactExports.useMemo(() => {
    const map = {};
    ((rolesData == null ? void 0 : rolesData.data) ?? []).forEach((r) => {
      map[r.slug] = r.display_name;
    });
    return map;
  }, [rolesData]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Team members", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: sprintf(
          /* translators: %s: brand name */
          __(
            "Every WordPress user with a %s role. Add an existing WP user here, or send a magic-link invitation from the Invitations tab.",
            "yatra"
          ),
          brandName()
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => setShowAddModal(true), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "mr-1.5 h-4 w-4" }),
          __("Add existing WP user", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowCreateModal(true), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "mr-1.5 h-4 w-4" }),
          __("Create new user", "yatra")
        ] })
      ] })
    ] }),
    selectedIds.size > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-blue-900 dark:text-blue-100 font-medium mr-auto", children: sprintf(
        /* translators: %d: count of selected rows */
        __("%d member(s) selected", "yatra"),
        selectedIds.size
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          "aria-label": __("Bulk: change role to", "yatra"),
          defaultValue: "",
          onChange: (e) => {
            const role = e.target.value;
            if (!role) return;
            setPendingBulk({ action: "change_role", roleSlug: role });
            e.target.value = "";
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __("Change role to…", "yatra") }),
            ((rolesData == null ? void 0 : rolesData.data) ?? []).map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r.slug, children: r.display_name }, r.slug))
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: () => setPendingBulk({ action: "force_logout" }),
          disabled: bulkMutation.isPending,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "mr-1.5 h-4 w-4" }),
            __("Force logout", "yatra")
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: "destructive",
          onClick: () => setPendingBulk({ action: "remove" }),
          disabled: bulkMutation.isPending,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-1.5 h-4 w-4" }),
            __("Remove", "yatra")
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: () => setSelectedIds(/* @__PURE__ */ new Set()),
          children: __("Clear", "yatra")
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-visible", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0 overflow-visible", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Table,
      {
        data: users,
        selectedItemIds: Array.from(selectedIds),
        onSelectItem: (id, checked) => toggleOne(Number(id), checked),
        onSelectAll: toggleAll,
        isAllSelected: users.length > 0 && users.filter((u) => u.id !== currentUserId).every((u) => selectedIds.has(u.id)),
        getItemId: (u) => u.id,
        columns: [
          {
            key: "display_name",
            label: __("Member", "yatra"),
            render: (u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-blue-600 dark:text-blue-400", children: (u.display_name || u.user_login).charAt(0).toUpperCase() }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setEditingId(u.id),
                    className: "font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer text-left",
                    children: u.display_name || u.user_login
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-md", children: u.email }),
                u.is_wp_admin && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "mt-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px]", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "w-2.5 h-2.5 mr-1" }),
                  __("WP Admin", "yatra")
                ] })
              ] })
            ] })
          },
          {
            key: "primary_role",
            label: __("Role", "yatra"),
            render: (u) => u.primary_role ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800", children: roleLabels[u.primary_role] || u.primary_role }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: "—" })
          },
          {
            key: "scope",
            label: __("Scope", "yatra"),
            render: (u) => u.has_scope ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Tooltip,
              {
                content: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  u.scopes.destinations.length > 0 && `${u.scopes.destinations.length} dest.`,
                  " ",
                  u.scopes.activities.length > 0 && `${u.scopes.activities.length} act.`,
                  " ",
                  u.scopes.trips.length > 0 && `${u.scopes.trips.length} trips`,
                  " ",
                  u.scopes.categories.length > 0 && `${u.scopes.categories.length} cat.`
                ] }),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", children: __("Scoped", "yatra") })
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: __("Unrestricted", "yatra") })
          },
          {
            key: "last_login",
            label: __("Last login", "yatra"),
            render: (u) => u.last_login ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap", children: new Date(u.last_login).toLocaleString() }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: "—" })
          },
          {
            key: "expires_at",
            label: __("Access expires", "yatra"),
            render: (u) => /* @__PURE__ */ jsxRuntimeExports.jsx(AccessExpiryCell, { user: u })
          }
        ],
        actions: [
          {
            key: "edit",
            label: __("Edit access", "yatra"),
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "w-4 h-4" }),
            onClick: (u) => setEditingId(u.id)
          },
          {
            key: "logout",
            label: __("Force logout", "yatra"),
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "w-4 h-4" }),
            onClick: (u) => forceLogoutMutation.mutate(u.id)
          },
          {
            key: "remove",
            label: __("Remove from team", "yatra"),
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }),
            onClick: (u) => setPendingRemove(u),
            variant: "destructive"
          }
        ],
        isLoading,
        emptyText: __("No team members yet", "yatra"),
        emptyDescription: __(
          "Invite a teammate from the Invitations tab to get started.",
          "yatra"
        )
      }
    ) }) }),
    editingId !== null && /* @__PURE__ */ jsxRuntimeExports.jsx(
      MemberEditDrawer,
      {
        userId: editingId,
        onClose: () => setEditingId(null)
      }
    ),
    showAddModal && /* @__PURE__ */ jsxRuntimeExports.jsx(AddMemberModal, { onClose: () => setShowAddModal(false) }),
    showCreateModal && /* @__PURE__ */ jsxRuntimeExports.jsx(CreateUserModal, { onClose: () => setShowCreateModal(false) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: pendingRemove !== null,
        onClose: () => !removeMutation.isPending && setPendingRemove(null),
        onConfirm: () => pendingRemove && removeMutation.mutate(pendingRemove.id),
        title: sprintf(
          /* translators: %s: brand name */
          __("Remove member from %s?", "yatra"),
          brandName()
        ),
        description: pendingRemove ? sprintf(
          /* translators: 1: brand name, 2: member display name, 3: brand name */
          __(
            'This strips %1$s role + caps + scopes from "%2$s". Their WordPress user is preserved (they keep any non-%3$s access on this site).',
            "yatra"
          ),
          brandName(),
          pendingRemove.display_name,
          brandName()
        ) : "",
        confirmText: __("Remove access", "yatra"),
        cancelText: __("Cancel", "yatra"),
        variant: "danger",
        isLoading: removeMutation.isPending
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: pendingBulk !== null,
        onClose: () => !bulkMutation.isPending && setPendingBulk(null),
        onConfirm: () => {
          if (!pendingBulk) return;
          const ids = Array.from(selectedIds);
          if (pendingBulk.action === "change_role") {
            bulkMutation.mutate({
              action: "change_role",
              user_ids: ids,
              role_slug: pendingBulk.roleSlug
            });
          } else if (pendingBulk.action === "remove") {
            bulkMutation.mutate({ action: "remove", user_ids: ids });
          } else if (pendingBulk.action === "force_logout") {
            bulkMutation.mutate({ action: "force_logout", user_ids: ids });
          }
        },
        title: (() => {
          if (!pendingBulk) return "";
          if (pendingBulk.action === "change_role") {
            return sprintf(
              /* translators: %d: count */
              __("Change role on %d member(s)?", "yatra"),
              selectedIds.size
            );
          }
          if (pendingBulk.action === "remove") {
            return sprintf(
              /* translators: %d: count */
              __("Remove %d member(s) from the team?", "yatra"),
              selectedIds.size
            );
          }
          return sprintf(
            /* translators: %d: count */
            __("Force logout on %d member(s)?", "yatra"),
            selectedIds.size
          );
        })(),
        description: (() => {
          var _a2;
          if (!pendingBulk) return "";
          if (pendingBulk.action === "change_role") {
            const roleLabel = ((_a2 = ((rolesData == null ? void 0 : rolesData.data) ?? []).find(
              (r) => r.slug === pendingBulk.roleSlug
            )) == null ? void 0 : _a2.display_name) ?? pendingBulk.roleSlug;
            return sprintf(
              /* translators: 1: role label, 2: count */
              __(
                'Sets the role to "%1$s" on %2$d member(s). Existing per-user grants and scopes are preserved. The last team administrator cannot be demoted — failures are reported per-id.',
                "yatra"
              ),
              roleLabel ?? "",
              selectedIds.size
            );
          }
          if (pendingBulk.action === "remove") {
            return __(
              "Strips role + caps + scopes from each selected member. Their WordPress user accounts stay. Last-team-admin is protected — that row will report as failed.",
              "yatra"
            );
          }
          return __(
            "Invalidates every active session for the selected members. They will be logged out everywhere and need to re-authenticate.",
            "yatra"
          );
        })(),
        confirmText: (pendingBulk == null ? void 0 : pendingBulk.action) === "change_role" ? __("Apply role", "yatra") : (pendingBulk == null ? void 0 : pendingBulk.action) === "remove" ? __("Remove access", "yatra") : __("Force logout", "yatra"),
        cancelText: __("Cancel", "yatra"),
        variant: (pendingBulk == null ? void 0 : pendingBulk.action) === "remove" ? "danger" : "info",
        isLoading: bulkMutation.isPending
      }
    )
  ] });
};
const AddMemberModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchQ, setSearchQ] = reactExports.useState("");
  const [pickedId, setPickedId] = reactExports.useState(null);
  const [roleSlug, setRoleSlug] = reactExports.useState("yatra_sales_agent");
  const [debouncedQ, setDebouncedQ] = reactExports.useState("");
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchQ), 250);
    return () => window.clearTimeout(t);
  }, [searchQ]);
  const { data: candidatesData, isLoading: candidatesLoading } = useQuery({
    queryKey: ["team-users-available", debouncedQ],
    queryFn: () => teamApi.listAvailableUsers(debouncedQ, 50)
  });
  const { data: rolesData } = useQuery({
    queryKey: ["team-roles"],
    queryFn: () => teamApi.listRoles()
  });
  const candidates = (candidatesData == null ? void 0 : candidatesData.data) ?? [];
  const addMutation = useMutation({
    mutationFn: () => teamApi.updateUser(pickedId, { role_slug: roleSlug }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      queryClient.invalidateQueries({ queryKey: ["team-users-available"] });
      showToast(__("Member added to the team.", "yatra"), "success");
      onClose();
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      isOpen: true,
      onClose,
      title: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "w-5 h-5 text-blue-500" }),
        __("Add existing WordPress user", "yatra")
      ] }),
      size: "md",
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Cancel", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            disabled: pickedId === null || addMutation.isPending,
            onClick: () => addMutation.mutate(),
            children: addMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }),
              __("Adding…", "yatra")
            ] }) : __("Add to team", "yatra")
          }
        )
      ] }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { variant: "info", title: __("Looking for someone new?", "yatra"), children: sprintf(
          /* translators: %s: brand name */
          __(
            "This picker shows WordPress users who don't yet have a %s role. For people who aren't on the site at all, send them an email invitation from the Invitations tab — that creates the WP user for them.",
            "yatra"
          ),
          brandName()
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "add-member-search", children: __("Find a user", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "add-member-search",
              value: searchQ,
              onChange: (e) => {
                setSearchQ(e.target.value);
                setPickedId(null);
              },
              placeholder: __("Search by name, email, or login…", "yatra"),
              className: "mt-1"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-gray-200 dark:border-gray-700 rounded-md max-h-72 overflow-y-auto", children: candidatesLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-gray-100 dark:divide-gray-800", children: [0, 1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-3 py-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-4 rounded-full flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-9 h-9 rounded-full flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3.5 w-2/5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-3/5" })
          ] })
        ] }, i)) }) : candidates.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 px-4 text-sm text-gray-500 dark:text-gray-400", children: debouncedQ === "" ? sprintf(
          /* translators: %s: brand name */
          __(
            "No available users — every WP user on this site is already a %s team member. Use the Invitations tab to add new people.",
            "yatra"
          ),
          brandName()
        ) : __("No matching users.", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-gray-100 dark:divide-gray-800", children: candidates.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "label",
          {
            htmlFor: `pick-${u.id}`,
            className: `flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${pickedId === u.id ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: `pick-${u.id}`,
                  type: "radio",
                  name: "add-member-pick",
                  checked: pickedId === u.id,
                  onChange: () => setPickedId(u.id),
                  className: "h-4 w-4 flex-shrink-0"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-blue-600 dark:text-blue-400", children: (u.display_name || u.login).charAt(0).toUpperCase() }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white truncate", children: u.display_name || u.login }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 truncate", children: u.email })
              ] })
            ]
          },
          u.id
        )) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "add-member-role", children: sprintf(
            /* translators: %s: brand name */
            __("%s role", "yatra"),
            brandName()
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Select,
            {
              id: "add-member-role",
              value: roleSlug,
              onChange: (e) => setRoleSlug(e.target.value),
              className: "mt-1",
              children: ((rolesData == null ? void 0 : rolesData.data) ?? []).map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: r.slug, children: [
                r.display_name,
                " (",
                r.capability_count,
                " ",
                __("caps", "yatra"),
                ")"
              ] }, r.slug))
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: __(
            "Per-user scopes + capability overrides can be set after the member is added (3-dot menu → Edit access).",
            "yatra"
          ) })
        ] })
      ] })
    }
  );
};
const CreateUserModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: rolesData } = useQuery({
    queryKey: ["team-roles"],
    queryFn: () => teamApi.listRoles()
  });
  const [email, setEmail] = reactExports.useState("");
  const [firstName, setFirstName] = reactExports.useState("");
  const [lastName, setLastName] = reactExports.useState("");
  const [username, setUsername] = reactExports.useState("");
  const [roleSlug, setRoleSlug] = reactExports.useState("");
  const [pwMode, setPwMode] = reactExports.useState("reset_email");
  const [password, setPassword] = reactExports.useState("");
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordOk = pwMode === "reset_email" || password.length >= 8;
  const canSubmit = emailValid && roleSlug !== "" && passwordOk;
  const createMutation = useMutation({
    mutationFn: () => teamApi.createUser({
      email,
      role_slug: roleSlug,
      first_name: firstName || void 0,
      last_name: lastName || void 0,
      username: username || void 0,
      password: pwMode === "manual" ? password : void 0,
      send_reset_email: pwMode === "reset_email"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      showToast(__("User created and added to the team.", "yatra"), "success");
      onClose();
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      isOpen: true,
      onClose,
      title: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "w-5 h-5 text-blue-500" }),
        __("Create new user", "yatra")
      ] }),
      size: "lg",
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Cancel", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            disabled: !canSubmit || createMutation.isPending,
            onClick: () => createMutation.mutate(),
            children: createMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }),
              __("Creating…", "yatra")
            ] }) : __("Create user", "yatra")
          }
        )
      ] }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Alert,
          {
            variant: "info",
            title: __("Creates a new WordPress user", "yatra"),
            children: sprintf(
              /* translators: %s: brand name */
              __(
                'This provisions a brand-new WP account and attaches the chosen %s role in one step. For people who already have a WP user, use "Add existing WP user" instead. To send a magic-link invite via email (account is created on accept), use the Invitations tab.',
                "yatra"
              ),
              brandName()
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cu-first", children: __("First name", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "cu-first",
                value: firstName,
                onChange: (e) => setFirstName(e.target.value),
                className: "mt-1"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cu-last", children: __("Last name", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "cu-last",
                value: lastName,
                onChange: (e) => setLastName(e.target.value),
                className: "mt-1"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cu-email", children: __("Email", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "cu-email",
              type: "email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              placeholder: "user@example.com",
              className: "mt-1",
              required: true
            }
          ),
          email !== "" && !emailValid && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-red-600 mt-1", children: __("Enter a valid email address.", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cu-username", children: __("Username (optional)", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "cu-username",
              value: username,
              onChange: (e) => setUsername(e.target.value),
              placeholder: __("Auto-generated from email", "yatra"),
              className: "mt-1"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: __(
            "WP requires unique, lowercase, no spaces. If left blank, derived from the email local-part.",
            "yatra"
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cu-role", children: sprintf(
            /* translators: %s: brand name */
            __("%s role", "yatra"),
            brandName()
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              id: "cu-role",
              value: roleSlug,
              onChange: (e) => setRoleSlug(e.target.value),
              className: "mt-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __("Select a role…", "yatra") }),
                ((rolesData == null ? void 0 : rolesData.data) ?? []).map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: r.slug, children: [
                  r.display_name,
                  " (",
                  r.capability_count,
                  " ",
                  __("caps", "yatra"),
                  ")"
                ] }, r.slug))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-gray-200 dark:border-gray-700 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium", children: __("Password", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "radio",
                  name: "cu-pw-mode",
                  checked: pwMode === "reset_email",
                  onChange: () => setPwMode("reset_email"),
                  className: "mt-0.5"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: __("Send reset-password email (recommended)", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
                  "User receives a standard WP password-reset link. You never see or type their password — strongest security posture.",
                  "yatra"
                ) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "radio",
                  name: "cu-pw-mode",
                  checked: pwMode === "manual",
                  onChange: () => setPwMode("manual"),
                  className: "mt-0.5"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: __("Set a password now", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mb-2", children: __(
                  "You'll need to share this password with the user out-of-band (DM, in person). 8 character minimum.",
                  "yatra"
                ) }),
                pwMode === "manual" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "password",
                    value: password,
                    onChange: (e) => setPassword(e.target.value),
                    placeholder: __("At least 8 characters", "yatra"),
                    className: "w-full"
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ] })
    }
  );
};
const MemberEditDrawer = ({ userId, onClose }) => {
  var _a;
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["team-user", userId],
    queryFn: () => teamApi.getUser(userId)
  });
  const { data: rolesData } = useQuery({
    queryKey: ["team-roles"],
    queryFn: () => teamApi.listRoles()
  });
  const { data: capsData } = useQuery({
    queryKey: ["team-capabilities"],
    queryFn: () => teamApi.listCapabilities()
  });
  const user = data == null ? void 0 : data.data;
  const [roleSlug, setRoleSlug] = reactExports.useState("");
  const [extraGrants, setExtraGrants] = reactExports.useState([]);
  const [extraRevokes, setExtraRevokes] = reactExports.useState([]);
  const [expiresLocal, setExpiresLocal] = reactExports.useState("");
  const [expiryDirty, setExpiryDirty] = reactExports.useState(false);
  React.useEffect(() => {
    if (user) {
      setRoleSlug(user.primary_role || "");
      setExtraGrants(user.caps_grant);
      setExtraRevokes(user.caps_revoke);
      setExpiresLocal(unixToLocalInputValue(user.expires_at));
      setExpiryDirty(false);
    }
  }, [user]);
  const isSelfEdit = (user == null ? void 0 : user.id) === ((_a = window.yatraAdmin) == null ? void 0 : _a.currentUser);
  const updateMutation = useMutation({
    mutationFn: () => {
      const payload = {
        role_slug: roleSlug,
        caps_grant: extraGrants,
        caps_revoke: extraRevokes
      };
      if (expiryDirty) {
        payload.expires_at = expiresLocal ? Math.floor(new Date(expiresLocal).getTime() / 1e3) : 0;
      }
      return teamApi.updateUser(userId, payload);
    },
    onSuccess: (res) => {
      var _a2, _b;
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      queryClient.invalidateQueries({ queryKey: ["team-user", userId] });
      if (((_a2 = res.data) == null ? void 0 : _a2.id) === (((_b = window.yatraAdmin) == null ? void 0 : _b.userCaps) ? userId : -1)) {
        setUserCaps(res.data.effective_caps);
      }
      showToast(__("Member updated.", "yatra"), "success");
      onClose();
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      isOpen: true,
      onClose,
      title: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "w-5 h-5 text-blue-500" }),
        user ? user.display_name : __("Loading…", "yatra")
      ] }),
      size: "lg",
      hideFooter: false,
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: (user == null ? void 0 : user.is_wp_admin) ? __("Close", "yatra") : __("Cancel", "yatra") }),
        !(user == null ? void 0 : user.is_wp_admin) && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            disabled: updateMutation.isPending,
            onClick: () => updateMutation.mutate(),
            children: updateMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }),
              __("Saving…", "yatra")
            ] }) : __("Save changes", "yatra")
          }
        )
      ] }),
      children: isLoading || !user ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-48" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: [0, 1, 2].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-32" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-full" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-full" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-full" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-full" })
              ] })
            ]
          },
          i
        )) })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: user.is_wp_admin ? (
        // Admin-lock UI. WP administrators always pass every yatra_*
        // cap via the server-side admin fallback, so role / grant /
        // revoke / scope / expiry assignments against them would be
        // misleading no-ops. We show a read-only summary instead of
        // editable form controls, and the server rejects any write
        // attempts with `yatra_team_admin_locked` (409) as a defense-
        // in-depth check.
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Alert,
          {
            variant: "info",
            title: __("WordPress administrator", "yatra"),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: sprintf(
                /* translators: %s: brand name */
                __(
                  "This user is a WP administrator and always passes every %s capability check via the admin fallback. Role assignment, capability grants, revokes, scope restrictions, and access expiry cannot be enforced on them.",
                  "yatra"
                ),
                brandName()
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm mt-2", children: __(
                "To scope this user's Yatra access, first remove their WordPress administrator role from the standard wp-admin Users screen, then return here to assign a Yatra role.",
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-0.5", children: __("Effective capabilities", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-900 dark:text-white font-medium", children: sprintf(
                    /* translators: %d: count of caps */
                    __("%d (all yatra_*)", "yatra"),
                    user.effective_caps.length
                  ) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-0.5", children: __("Yatra role on record", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-900 dark:text-white font-medium", children: user.primary_role ? roleSlug || user.primary_role : __("None (admin fallback only)", "yatra") })
                ] })
              ] })
            ]
          }
        )
      ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: sprintf(
            /* translators: %s: brand name */
            __("%s role", "yatra"),
            brandName()
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              value: roleSlug,
              onChange: (e) => setRoleSlug(e.target.value),
              className: "mt-1",
              "aria-label": __("Role", "yatra"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: sprintf(
                  /* translators: %s: brand name */
                  __("No %s role", "yatra"),
                  brandName()
                ) }),
                ((rolesData == null ? void 0 : rolesData.data) ?? []).map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: r.slug, children: [
                  r.display_name,
                  " (",
                  r.capability_count,
                  " ",
                  __("caps", "yatra"),
                  ")"
                ] }, r.slug))
              ]
            }
          )
        ] }),
        !isSelfEdit && !user.is_wp_admin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Label,
                {
                  htmlFor: "member-expires-at",
                  className: "text-sm font-medium",
                  children: __("Access expires on (optional)", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                "Time-windowed access: caps are revoked automatically once this passes. Useful for contractors, seasonal staff, or temporary vendor access. Leave blank for permanent access.",
                "yatra"
              ) })
            ] }),
            expiresLocal && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => {
                  setExpiresLocal("");
                  setExpiryDirty(true);
                },
                children: __("Clear expiry", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "member-expires-at",
              type: "datetime-local",
              value: expiresLocal,
              min: unixToLocalInputValue(
                Math.floor(Date.now() / 1e3) + 60
              ),
              onChange: (e) => {
                setExpiresLocal(e.target.value);
                setExpiryDirty(true);
              },
              className: "w-full"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExpiryNowHint, { expiresLocal }),
          user.is_expired && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Alert,
            {
              variant: "warning",
              title: __("Access has already expired", "yatra"),
              children: __(
                "This member is past their expiry and currently has no access. The next hourly sweep will fully strip their role + grants. Set a new date above to extend access — or clear the expiry to make it permanent.",
                "yatra"
              )
            }
          )
        ] }),
        capsData && /* @__PURE__ */ jsxRuntimeExports.jsx(
          CapabilityOverridesEditor,
          {
            registry: capsData.capabilities,
            effective: user.effective_caps,
            grants: extraGrants,
            revokes: extraRevokes,
            onChangeGrants: setExtraGrants,
            onChangeRevokes: setExtraRevokes
          }
        )
      ] }) })
    }
  );
};
const CapabilityOverridesEditor = ({
  registry,
  effective,
  grants,
  revokes,
  onChangeGrants,
  onChangeRevokes
}) => {
  const byCategory = reactExports.useMemo(() => {
    const map = {};
    Object.entries(registry).forEach(([cap, def]) => {
      if (!map[def.category]) map[def.category] = [];
      map[def.category].push([cap, def]);
    });
    return map;
  }, [registry]);
  const sensColor = (s) => {
    if (s === "critical")
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    if (s === "high")
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    if (s === "medium")
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white mb-1", children: __("Per-user capability overrides", "yatra") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-3", children: __(
      "Override the role's defaults for THIS user. Grants extend access; revokes deny even when the role allows.",
      "yatra"
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 max-h-80 overflow-y-auto pr-1 border border-gray-200 dark:border-gray-700 rounded-md p-2", children: Object.entries(byCategory).map(([cat, rows]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-1 py-1", children: cat }),
      rows.map(([cap, def]) => {
        const isEffective = effective.includes(cap);
        const isGranted = grants.includes(cap);
        const isRevoked = revokes.includes(cap);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center justify-between gap-3 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-900 dark:text-white", children: def.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: `text-[10px] font-medium px-1.5 py-0.5 rounded ${sensColor(def.sensitivity)}`,
                      children: def.sensitivity
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-[11px] text-gray-400 dark:text-gray-500 font-mono", children: cap })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 flex-shrink-0", children: [
                isEffective && !isGranted && !isRevoked && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-[10px]", children: __("via role", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Tooltip,
                  {
                    content: __("Grant this cap on top of the role", "yatra"),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          if (isGranted) {
                            onChangeGrants(grants.filter((c) => c !== cap));
                          } else {
                            onChangeGrants([...grants, cap]);
                            onChangeRevokes(revokes.filter((c) => c !== cap));
                          }
                        },
                        className: `text-[10px] px-2 py-1 rounded border transition-colors ${isGranted ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"}`,
                        children: __("Grant", "yatra")
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Tooltip,
                  {
                    content: __(
                      "Deny this cap even if the role allows",
                      "yatra"
                    ),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          if (isRevoked) {
                            onChangeRevokes(revokes.filter((c) => c !== cap));
                          } else {
                            onChangeRevokes([...revokes, cap]);
                            onChangeGrants(grants.filter((c) => c !== cap));
                          }
                        },
                        className: `text-[10px] px-2 py-1 rounded border transition-colors ${isRevoked ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"}`,
                        children: __("Revoke", "yatra")
                      }
                    )
                  }
                )
              ] })
            ]
          },
          cap
        );
      })
    ] }, cat)) })
  ] });
};
const RolesTab = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editingRoleSlug, setEditingRoleSlug] = reactExports.useState(null);
  const [createSeed, setCreateSeed] = reactExports.useState(null);
  const [pendingDelete, setPendingDelete] = reactExports.useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["team-roles"],
    queryFn: () => teamApi.listRoles()
  });
  const deleteMutation = useMutation({
    mutationFn: (slug) => teamApi.deleteRole(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-roles"] });
      showToast(__("Role deleted.", "yatra"), "success");
      setPendingDelete(null);
    },
    onError: (e) => {
      showToast(extractError(e), "error");
      setPendingDelete(null);
    }
  });
  const roles = (data == null ? void 0 : data.data) ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Roles", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __(
          "Eight shipped system roles cover most agencies. Click any role to see + edit its capabilities. Clone or create your own with the buttons here.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setCreateSeed("new"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "mr-1.5 h-4 w-4" }),
        __("Create custom role", "yatra")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-visible", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0 overflow-visible", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Table,
      {
        data: roles,
        columns: [
          {
            key: "display_name",
            label: __("Role", "yatra"),
            render: (r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "w-5 h-5 text-indigo-600 dark:text-indigo-400" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setEditingRoleSlug(r.slug),
                    className: "font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer text-left",
                    children: r.display_name
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs text-gray-500 dark:text-gray-400 font-mono", children: r.slug }) })
              ] })
            ] })
          },
          {
            key: "is_system",
            label: __("Type", "yatra"),
            render: (r) => r.is_system ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", children: __("System", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300", children: __("Custom", "yatra") })
          },
          {
            key: "capability_count",
            label: __("Capabilities", "yatra"),
            render: (r) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Badge,
              {
                variant: "outline",
                className: "cursor-pointer",
                onClick: () => setEditingRoleSlug(r.slug),
                children: [
                  r.capability_count,
                  " ",
                  __("caps", "yatra")
                ]
              }
            )
          },
          {
            key: "member_count",
            label: __("Members", "yatra"),
            render: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: r.member_count })
          }
        ],
        actions: [
          {
            key: "edit",
            label: __("View capabilities", "yatra"),
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "w-4 h-4" }),
            onClick: (r) => setEditingRoleSlug(r.slug)
          },
          {
            key: "clone",
            label: __("Clone to custom role", "yatra"),
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4" }),
            onClick: (r) => setCreateSeed(`clone:${r.slug}`)
          },
          {
            key: "delete",
            label: __("Delete role", "yatra"),
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }),
            onClick: (r) => setPendingDelete(r),
            condition: (r) => !r.is_system,
            variant: "destructive"
          }
        ],
        isLoading,
        emptyText: __("No roles found", "yatra"),
        emptyDescription: __(
          "System roles should have populated automatically. Try toggling the module off and on.",
          "yatra"
        )
      }
    ) }) }),
    editingRoleSlug !== null && /* @__PURE__ */ jsxRuntimeExports.jsx(
      RoleEditDrawer,
      {
        slug: editingRoleSlug,
        onClose: () => setEditingRoleSlug(null),
        onClone: (slug) => {
          setEditingRoleSlug(null);
          setCreateSeed(`clone:${slug}`);
        }
      }
    ),
    createSeed !== null && /* @__PURE__ */ jsxRuntimeExports.jsx(
      RoleCreateDrawer,
      {
        seedSlug: createSeed.startsWith("clone:") ? createSeed.slice(6) : null,
        onClose: () => setCreateSeed(null)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: pendingDelete !== null,
        onClose: () => !deleteMutation.isPending && setPendingDelete(null),
        onConfirm: () => pendingDelete && deleteMutation.mutate(pendingDelete.slug),
        title: __("Delete custom role?", "yatra"),
        description: pendingDelete ? __(
          'Members assigned to "{name}" will lose this role. Their WordPress user account is preserved.',
          "yatra"
        ).replace("{name}", pendingDelete.display_name) : "",
        confirmText: __("Delete role", "yatra"),
        cancelText: __("Cancel", "yatra"),
        variant: "danger",
        isLoading: deleteMutation.isPending
      }
    )
  ] });
};
const RoleEditDrawer = ({ slug, onClose, onClone }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["team-role", slug],
    queryFn: () => teamApi.getRole(slug)
  });
  const { data: capsData } = useQuery({
    queryKey: ["team-capabilities"],
    queryFn: () => teamApi.listCapabilities()
  });
  const role = data == null ? void 0 : data.data;
  const [displayName, setDisplayName] = reactExports.useState("");
  const [selectedCaps, setSelectedCaps] = reactExports.useState([]);
  React.useEffect(() => {
    if (role) {
      setDisplayName(role.display_name);
      setSelectedCaps(role.capabilities);
    }
  }, [role]);
  const updateMutation = useMutation({
    mutationFn: () => teamApi.updateRole(slug, {
      display_name: displayName,
      capabilities: selectedCaps
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-roles"] });
      queryClient.invalidateQueries({ queryKey: ["team-role", slug] });
      showToast(__("Role updated.", "yatra"), "success");
      onClose();
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const isSystem = (role == null ? void 0 : role.is_system) ?? false;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      isOpen: true,
      onClose,
      title: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "w-5 h-5 text-indigo-500" }),
        role ? role.display_name : __("Loading…", "yatra"),
        isSystem && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ml-2", children: __("System role", "yatra") })
      ] }),
      size: "lg",
      hideFooter: false,
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Close", "yatra") }),
        isSystem ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => onClone(slug), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "mr-1.5 h-4 w-4" }),
          __("Clone to edit", "yatra")
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            disabled: updateMutation.isPending,
            onClick: () => updateMutation.mutate(),
            children: updateMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }),
              __("Saving…", "yatra")
            ] }) : __("Save changes", "yatra")
          }
        )
      ] }),
      children: isLoading || !role ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: [0, 1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-28" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-full" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-full" })
              ] })
            ]
          },
          i
        )) })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        isSystem && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { variant: "info", title: __("System role", "yatra"), children: sprintf(
          /* translators: 1: brand name, 2: brand name */
          __(
            "System roles ship with %1$s and can't be edited directly — clone to a custom role to change capabilities. This protects your team if %2$s ships new capabilities in future releases (clones won't auto-update; system roles will).",
            "yatra"
          ),
          brandName(),
          brandName()
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "role-display-name", children: __("Role name", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "role-display-name",
              value: displayName,
              onChange: (e) => setDisplayName(e.target.value),
              disabled: isSystem,
              className: "mt-1"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono", children: role.slug }),
            " ·",
            " ",
            role.member_count,
            " ",
            role.member_count === 1 ? __("member", "yatra") : __("members", "yatra")
          ] })
        ] }),
        capsData && /* @__PURE__ */ jsxRuntimeExports.jsx(
          CapabilityMatrix,
          {
            registry: capsData.capabilities,
            selected: selectedCaps,
            onChange: setSelectedCaps,
            disabled: isSystem
          }
        )
      ] })
    }
  );
};
const RoleCreateDrawer = ({ seedSlug, onClose }) => {
  var _a;
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: seedData } = useQuery({
    queryKey: ["team-role", seedSlug],
    queryFn: () => teamApi.getRole(seedSlug),
    enabled: seedSlug !== null
  });
  const { data: capsData } = useQuery({
    queryKey: ["team-capabilities"],
    queryFn: () => teamApi.listCapabilities()
  });
  const { data: templatesData } = useQuery({
    queryKey: ["team-role-templates"],
    queryFn: () => teamApi.listRoleTemplates(),
    enabled: seedSlug === null
    // only show templates for fresh creation
  });
  const [displayName, setDisplayName] = reactExports.useState("");
  const [selectedCaps, setSelectedCaps] = reactExports.useState([]);
  const [appliedTemplateId, setAppliedTemplateId] = reactExports.useState(
    null
  );
  React.useEffect(() => {
    if (seedData == null ? void 0 : seedData.data) {
      setDisplayName(`${seedData.data.display_name} (copy)`);
      setSelectedCaps(seedData.data.capabilities);
    }
  }, [seedData]);
  const applyTemplate = (templateId) => {
    const tpl = ((templatesData == null ? void 0 : templatesData.data) ?? []).find((t) => t.id === templateId);
    if (!tpl) return;
    const caps = Array.from(
      /* @__PURE__ */ new Set([...tpl.capabilities, "yatra_access_admin"])
    );
    setSelectedCaps(caps);
    setAppliedTemplateId(templateId);
    if (displayName.trim() === "") {
      setDisplayName(tpl.label);
    }
  };
  const createMutation = useMutation({
    mutationFn: () => teamApi.createRole({
      display_name: displayName,
      capabilities: selectedCaps
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-roles"] });
      showToast(__("Custom role created.", "yatra"), "success");
      onClose();
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const canSave = displayName.trim() !== "" && !createMutation.isPending;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      isOpen: true,
      onClose,
      title: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "w-5 h-5 text-indigo-500" }),
        seedSlug ? __("Clone role", "yatra") : __("Create custom role", "yatra")
      ] }),
      size: "lg",
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Cancel", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: !canSave, onClick: () => createMutation.mutate(), children: createMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }),
          __("Creating…", "yatra")
        ] }) : __("Create role", "yatra") })
      ] }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "new-role-name", children: __("Role name", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "new-role-name",
              value: displayName,
              onChange: (e) => setDisplayName(e.target.value),
              placeholder: __("e.g. Senior Sales Agent", "yatra"),
              className: "mt-1"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: __(
            "Slug auto-generated from the name (yatra_* prefix added).",
            "yatra"
          ) })
        ] }),
        seedSlug === null && (((_a = templatesData == null ? void 0 : templatesData.data) == null ? void 0 : _a.length) ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium", children: __("Start from a template (optional)", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                "Pre-curated cap bundles for common archetypes. Picking one prefills the matrix below — fully editable before save.",
                "yatra"
              ) })
            ] }),
            appliedTemplateId && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => {
                  setSelectedCaps([]);
                  setAppliedTemplateId(null);
                },
                children: __("Clear", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: ((templatesData == null ? void 0 : templatesData.data) ?? []).map((tpl) => {
            const active = appliedTemplateId === tpl.id;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => applyTemplate(tpl.id),
                className: `text-left rounded-md border p-3 transition-colors ${active ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400" : "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:bg-blue-900/10"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-gray-900 dark:text-white", children: tpl.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] uppercase tracking-wide text-gray-400", children: [
                      tpl.capabilities.length,
                      " ",
                      __("caps", "yatra")
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: tpl.description })
                ]
              },
              tpl.id
            );
          }) })
        ] }),
        capsData && /* @__PURE__ */ jsxRuntimeExports.jsx(
          CapabilityMatrix,
          {
            registry: capsData.capabilities,
            selected: selectedCaps,
            onChange: setSelectedCaps,
            disabled: false
          }
        )
      ] })
    }
  );
};
const CapabilityMatrix = ({ registry, selected, onChange, disabled }) => {
  const byCategory = reactExports.useMemo(() => {
    const map = {};
    Object.entries(registry).forEach(([cap, def]) => {
      if (!map[def.category]) map[def.category] = [];
      map[def.category].push([cap, def]);
    });
    return map;
  }, [registry]);
  const selectedSet = reactExports.useMemo(() => new Set(selected), [selected]);
  const sensColor = (s) => {
    if (s === "critical")
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    if (s === "high")
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    if (s === "medium")
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };
  const toggleCap = (cap) => {
    if (disabled) return;
    if (selectedSet.has(cap)) {
      onChange(selected.filter((c) => c !== cap));
    } else {
      onChange([...selected, cap]);
    }
  };
  const toggleCategory = (caps) => {
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 mb-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("Capabilities", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: disabled ? __(
          "Read-only — system roles can't be edited. Use Clone to make an editable copy.",
          "yatra"
        ) : __(
          "Each capability gates a specific action. Sensitivity drives audit-log defaults.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
        selected.length,
        " / ",
        Object.keys(registry).length
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 max-h-96 overflow-y-auto pr-1 border border-gray-200 dark:border-gray-700 rounded-md p-2", children: Object.entries(byCategory).map(([category, rows]) => {
      const ids = rows.map(([c]) => c);
      const checked = ids.filter((c) => selectedSet.has(c)).length;
      const allChecked = checked === ids.length;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 px-1 py-1 sticky top-0 bg-white dark:bg-gray-900 z-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400", children: [
            category,
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-normal text-gray-400", children: [
              "(",
              checked,
              "/",
              ids.length,
              ")"
            ] })
          ] }),
          !disabled && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => toggleCategory(rows),
              className: "text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline",
              children: allChecked ? __("Clear all", "yatra") : __("Select all", "yatra")
            }
          )
        ] }),
        rows.map(([cap, def]) => {
          const isChecked = selectedSet.has(cap);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "label",
            {
              htmlFor: `cap-${cap}`,
              className: `flex items-center gap-3 px-2 py-1.5 rounded transition-colors ${disabled ? "cursor-default" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"} ${isChecked ? "bg-blue-50/40 dark:bg-blue-900/10" : ""}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    id: `cap-${cap}`,
                    type: "checkbox",
                    checked: isChecked,
                    onChange: () => toggleCap(cap),
                    disabled,
                    className: "h-4 w-4 rounded border-gray-300 flex-shrink-0"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-900 dark:text-white", children: def.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: `text-[10px] font-medium px-1.5 py-0.5 rounded ${sensColor(def.sensitivity)}`,
                        children: def.sensitivity
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-[11px] text-gray-400 dark:text-gray-500 font-mono", children: cap })
                ] })
              ]
            },
            cap
          );
        })
      ] }, category);
    }) })
  ] });
};
const InvitationsTab = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showInviteModal, setShowInviteModal] = reactExports.useState(false);
  const [revealAcceptUrl, setRevealAcceptUrl] = reactExports.useState(null);
  const [pendingRevoke, setPendingRevoke] = reactExports.useState(
    null
  );
  const [revokeAlsoDelete, setRevokeAlsoDelete] = reactExports.useState(true);
  const [pendingDelete, setPendingDelete] = reactExports.useState(
    null
  );
  const { data, isLoading } = useQuery({
    queryKey: ["team-invitations"],
    queryFn: () => teamApi.listInvitations()
  });
  const revokeMutation = useMutation({
    mutationFn: (vars) => teamApi.revokeInvitation(vars.id, { purge: vars.purge }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["team-audit"] });
      showToast(res.message, "success");
      setPendingRevoke(null);
      setPendingDelete(null);
    },
    onError: (e) => {
      showToast(extractError(e), "error");
      setPendingRevoke(null);
      setPendingDelete(null);
    }
  });
  const rows = reactExports.useMemo(() => {
    const map = (data == null ? void 0 : data.data) ?? {};
    return Object.values(map);
  }, [data]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Invitations", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __(
          "Magic-link invitations expire after 72 hours by default. Tokens are stored hashed; the link is only shown once.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowInviteModal(true), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "mr-1.5 h-4 w-4" }),
        __("Invite member", "yatra")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-visible", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0 overflow-visible", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Table,
      {
        data: rows,
        columns: [
          {
            key: "email",
            label: __("Email", "yatra"),
            render: (i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-4 h-4 text-gray-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-900 dark:text-white", children: i.email })
            ] })
          },
          {
            key: "role_slug",
            label: __("Role", "yatra"),
            render: (i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300", children: i.role_slug })
          },
          {
            key: "status",
            label: __("Status", "yatra"),
            render: (i) => {
              const cls = {
                pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                accepted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                revoked: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                expired: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              };
              return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: cls[i.status], children: i.status });
            }
          },
          {
            key: "expires_at",
            label: __("Expires", "yatra"),
            render: (i) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap", children: new Date(i.expires_at * 1e3).toLocaleString() })
          }
        ],
        actions: [
          // Revoke — only meaningful for a still-pending invitation.
          // Opens a confirmation that lets the operator opt-in to
          // ALSO deleting the row (default checked — most operators
          // don't want orphaned `revoked` rows piling up).
          {
            key: "revoke",
            label: __("Revoke", "yatra"),
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "w-4 h-4" }),
            onClick: (i) => {
              setRevokeAlsoDelete(true);
              setPendingRevoke(i);
            },
            condition: (i) => i.status === "pending",
            variant: "destructive"
          },
          // Delete — for any non-pending row (revoked, accepted,
          // expired). Pure storage hygiene. Without this, the
          // table grew without bound as old invitations accumulated.
          {
            key: "delete",
            label: __("Delete record", "yatra"),
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }),
            onClick: (i) => setPendingDelete(i),
            condition: (i) => i.status !== "pending",
            variant: "destructive"
          }
        ],
        isLoading,
        emptyText: __("No invitations yet", "yatra"),
        emptyDescription: __(
          "Send an invitation to add a teammate.",
          "yatra"
        ),
        onCreateClick: () => setShowInviteModal(true)
      }
    ) }) }),
    showInviteModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      InvitationModal,
      {
        onClose: () => setShowInviteModal(false),
        onSent: (acceptUrl) => {
          setShowInviteModal(false);
          setRevealAcceptUrl(acceptUrl);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AcceptUrlRevealDialog,
      {
        url: revealAcceptUrl,
        onClose: () => setRevealAcceptUrl(null)
      }
    ),
    pendingRevoke && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: true,
        onClose: () => {
          if (!revokeMutation.isPending) setPendingRevoke(null);
        },
        title: __("Revoke invitation?", "yatra"),
        size: "md",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300", children: sprintf(
            /* translators: %s: invited email address */
            __(
              "The magic-link sent to %s will stop working immediately. Anyone who already clicked the link before now has already accepted (you can confirm in the audit log).",
              "yatra"
            ),
            pendingRevoke.email
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-2 cursor-pointer p-3 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: revokeAlsoDelete,
                onChange: (e) => setRevokeAlsoDelete(e.target.checked),
                disabled: revokeMutation.isPending,
                className: "mt-0.5"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block font-medium text-gray-900 dark:text-white", children: __("Also delete the invitation record", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                "Removes the row from this list. The audit log keeps a permanent trail of who was invited, by whom, and when — that's preserved separately.",
                "yatra"
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                onClick: () => setPendingRevoke(null),
                disabled: revokeMutation.isPending,
                children: __("Cancel", "yatra")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "destructive",
                onClick: () => revokeMutation.mutate({
                  id: pendingRevoke.id,
                  purge: revokeAlsoDelete
                }),
                disabled: revokeMutation.isPending,
                children: [
                  revokeMutation.isPending && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-4 w-4 mr-1 animate-spin" }),
                  revokeAlsoDelete ? __("Revoke and delete", "yatra") : __("Revoke", "yatra")
                ]
              }
            )
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: pendingDelete !== null,
        onClose: () => {
          if (!revokeMutation.isPending) setPendingDelete(null);
        },
        onConfirm: () => {
          if (pendingDelete) {
            revokeMutation.mutate({ id: pendingDelete.id, purge: true });
          }
        },
        title: __("Delete invitation record?", "yatra"),
        description: pendingDelete ? sprintf(
          /* translators: 1: invited email address, 2: current status */
          __(
            "Permanently remove the %1$s invitation (status: %2$s) from this list. The audit log entry stays, so you can still see who was invited and when — only the live record is removed.",
            "yatra"
          ),
          pendingDelete.email,
          pendingDelete.status
        ) : "",
        confirmText: __("Delete record", "yatra"),
        cancelText: __("Cancel", "yatra"),
        variant: "danger",
        isLoading: revokeMutation.isPending
      }
    )
  ] });
};
const InvitationModal = ({ onClose, onSent }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: rolesData } = useQuery({
    queryKey: ["team-roles"],
    queryFn: () => teamApi.listRoles()
  });
  const [email, setEmail] = reactExports.useState("");
  const [role, setRole] = reactExports.useState("yatra_sales_agent");
  const [expiresIn, setExpiresIn] = reactExports.useState(259200);
  const sendMutation = useMutation({
    mutationFn: () => teamApi.sendInvitation({ email, role, expires_in: expiresIn }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      showToast(__("Invitation sent.", "yatra"), "success");
      onSent(res.data.accept_url);
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      isOpen: true,
      onClose,
      title: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "w-5 h-5 text-blue-500" }),
        __("Invite a team member", "yatra")
      ] }),
      size: "md",
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Cancel", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            disabled: email.trim() === "" || sendMutation.isPending,
            onClick: () => sendMutation.mutate(),
            children: sendMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }),
              __("Sending…", "yatra")
            ] }) : __("Send invitation", "yatra")
          }
        )
      ] }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "invite-email", children: __("Email address", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "invite-email",
              type: "email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              placeholder: "teammate@example.com",
              className: "mt-1"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "invite-role", children: __("Role", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Select,
            {
              id: "invite-role",
              value: role,
              onChange: (e) => setRole(e.target.value),
              className: "mt-1",
              children: ((rolesData == null ? void 0 : rolesData.data) ?? []).map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r.slug, children: r.display_name }, r.slug))
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "invite-expiry", children: __("Link expires in", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              id: "invite-expiry",
              value: String(expiresIn),
              onChange: (e) => setExpiresIn(Number(e.target.value)),
              className: "mt-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "86400", children: __("24 hours", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "259200", children: __("72 hours (recommended)", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "604800", children: __("7 days", "yatra") })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { variant: "info", title: __("How it works", "yatra"), children: __(
          "The invitee receives an email with a magic link. Clicking it attaches the chosen role to an existing WP user with that email, or creates a new WP user + sends them a password-reset link.",
          "yatra"
        ) })
      ] })
    }
  );
};
const AcceptUrlRevealDialog = ({ url, onClose }) => {
  const [copied, setCopied] = reactExports.useState(false);
  const doCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2e3);
    } catch (_e) {
    }
  };
  if (!url) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      isOpen: true,
      onClose,
      title: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "w-5 h-5 text-green-500" }),
        __("Invitation link", "yatra")
      ] }),
      size: "md",
      footer: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onClose, children: __("Done", "yatra") }) }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 dark:text-gray-200", children: __(
          "The invitation email is on its way. If you'd like to share the link manually (e.g. via Slack), copy it below — it's only shown once.",
          "yatra"
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: url,
              readOnly: true,
              onFocus: (e) => e.currentTarget.select(),
              className: "font-mono text-xs",
              "aria-label": __("Accept URL", "yatra")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: doCopy, children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-1.5 h-4 w-4" }),
            __("Copied", "yatra")
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "mr-1.5 h-4 w-4" }),
            __("Copy", "yatra")
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Alert,
          {
            variant: "warning",
            title: __("Treat this link like a password", "yatra"),
            children: __(
              "Anyone with this URL can claim the invited role until it expires.",
              "yatra"
            )
          }
        )
      ] })
    }
  );
};
const AuditLogTab = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = reactExports.useState(1);
  const [actionFilter, setActionFilter] = reactExports.useState("");
  const [entityFilter, setEntityFilter] = reactExports.useState("");
  const [resultFilter, setResultFilter] = reactExports.useState("");
  const [selectedIds, setSelectedIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [confirmClear, setConfirmClear] = reactExports.useState(false);
  const [confirmBulk, setConfirmBulk] = reactExports.useState(false);
  const perPage = 50;
  const { data, isLoading } = useQuery({
    queryKey: [
      "team-audit-log",
      page,
      actionFilter,
      entityFilter,
      resultFilter
    ],
    queryFn: () => teamApi.listAuditLog({
      page,
      per_page: perPage,
      ...actionFilter ? { action: actionFilter } : {},
      ...entityFilter ? { entity_type: entityFilter } : {},
      ...resultFilter ? { result: resultFilter } : {}
    }),
    placeholderData: (prev) => prev
  });
  const { data: facets } = useQuery({
    queryKey: ["team-audit-facets"],
    queryFn: () => teamApi.auditFacets()
  });
  const rows = (data == null ? void 0 : data.data) ?? [];
  const total = (data == null ? void 0 : data.total) ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasFilters = !!(actionFilter || entityFilter || resultFilter);
  const invalidateAudit = () => {
    queryClient.invalidateQueries({ queryKey: ["team-audit-log"] });
    queryClient.invalidateQueries({ queryKey: ["team-audit-facets"] });
    setSelectedIds(/* @__PURE__ */ new Set());
  };
  const clearMutation = useMutation({
    mutationFn: () => teamApi.clearAuditLog(),
    onSuccess: (res) => {
      invalidateAudit();
      setConfirmClear(false);
      showToast(res.message, "success");
    },
    onError: (e) => {
      setConfirmClear(false);
      showToast(extractError(e), "error");
    }
  });
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => teamApi.bulkDeleteAuditLog(ids),
    onSuccess: (res) => {
      invalidateAudit();
      setConfirmBulk(false);
      showToast(res.message, "success");
    },
    onError: (e) => {
      setConfirmBulk(false);
      showToast(extractError(e), "error");
    }
  });
  React.useEffect(() => {
    setSelectedIds(/* @__PURE__ */ new Set());
  }, [page, actionFilter, entityFilter, resultFilter]);
  const toggleOne = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const toggleAll = (checked) => {
    if (!checked) {
      setSelectedIds(/* @__PURE__ */ new Set());
      return;
    }
    setSelectedIds(new Set(rows.map((r) => r.id)));
  };
  const isAllSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Audit log", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __(
          "Append-only event stream. High + critical sensitivity actions and every denied attempt are logged. Default retention 180 days.",
          "yatra"
        ) })
      ] }),
      total > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: () => setConfirmClear(true),
          disabled: clearMutation.isPending,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-1.5 h-4 w-4" }),
            __("Clear all", "yatra")
          ]
        }
      )
    ] }),
    selectedIds.size > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-blue-900 dark:text-blue-100 font-medium mr-auto", children: sprintf(
        /* translators: %d: count of selected audit-log entries */
        __("%d entries selected", "yatra"),
        selectedIds.size
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: "destructive",
          onClick: () => setConfirmBulk(true),
          disabled: bulkDeleteMutation.isPending,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-1.5 h-4 w-4" }),
            __("Delete selected", "yatra")
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: () => setSelectedIds(/* @__PURE__ */ new Set()),
          children: __("Clear selection", "yatra")
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: actionFilter,
          onChange: (e) => {
            setActionFilter(e.target.value);
            setPage(1);
          },
          "aria-label": __("Filter by action", "yatra"),
          className: "w-full lg:w-56",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __("All actions", "yatra") }),
            ((facets == null ? void 0 : facets.actions) ?? []).map((a) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: a, children: a }, a))
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: entityFilter,
          onChange: (e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          },
          "aria-label": __("Filter by entity", "yatra"),
          className: "w-full lg:w-48",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __("All entities", "yatra") }),
            ((facets == null ? void 0 : facets.entity_types) ?? []).map((e) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: e, children: e }, e))
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: resultFilter,
          onChange: (e) => {
            setResultFilter(e.target.value);
            setPage(1);
          },
          "aria-label": __("Filter by result", "yatra"),
          className: "w-full lg:w-40",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __("Any result", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "allowed", children: __("Allowed", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "denied", children: __("Denied", "yatra") })
          ]
        }
      ),
      hasFilters && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          onClick: () => {
            setActionFilter("");
            setEntityFilter("");
            setResultFilter("");
            setPage(1);
          },
          children: __("Reset", "yatra")
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-0 overflow-visible", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Table,
        {
          data: rows,
          selectedItemIds: Array.from(selectedIds),
          onSelectItem: (id, checked) => toggleOne(Number(id), checked),
          onSelectAll: toggleAll,
          isAllSelected,
          getItemId: (r) => r.id,
          columns: [
            {
              key: "occurred_at",
              label: __("When", "yatra"),
              render: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap", children: new Date(r.occurred_at).toLocaleString() })
            },
            {
              key: "actor",
              label: __("Who", "yatra"),
              render: (r) => r.actor_user_id ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white truncate", children: r.actor_display_name || `#${r.actor_user_id}` }),
                r.actor_ip && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-gray-400 font-mono", children: r.actor_ip })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300", children: __("system", "yatra") })
            },
            {
              key: "action",
              label: __("Action", "yatra"),
              render: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs font-mono text-indigo-700 dark:text-indigo-300", children: r.action })
            },
            {
              key: "entity",
              label: __("Entity", "yatra"),
              render: (r) => r.entity_type ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-700 dark:text-gray-300", children: [
                r.entity_type,
                r.entity_id ? ` #${r.entity_id}` : ""
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: "—" })
            },
            {
              key: "result",
              label: __("Result", "yatra"),
              render: (r) => r.result === "denied" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "mr-1 h-3 w-3" }),
                __("Denied", "yatra")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "mr-1 h-3 w-3" }),
                __("Allowed", "yatra")
              ] })
            }
          ],
          actions: [],
          isLoading,
          emptyText: __("No audit events yet", "yatra"),
          emptyDescription: __(
            "High and critical sensitivity actions will appear here as they happen.",
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
          itemName: __("events", "yatra")
        }
      ) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: confirmClear,
        onClose: () => !clearMutation.isPending && setConfirmClear(false),
        onConfirm: () => clearMutation.mutate(),
        title: __("Clear the entire audit log?", "yatra"),
        description: sprintf(
          /* translators: %d: count of audit-log entries about to be wiped */
          __(
            "This permanently deletes all %d audit-log entries. The clear action itself will be recorded as a new entry — so the operator who wiped history is documented. There is no undo.",
            "yatra"
          ),
          total
        ),
        confirmText: __("Yes, clear all", "yatra"),
        cancelText: __("Cancel", "yatra"),
        variant: "danger",
        isLoading: clearMutation.isPending
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: confirmBulk,
        onClose: () => !bulkDeleteMutation.isPending && setConfirmBulk(false),
        onConfirm: () => bulkDeleteMutation.mutate(Array.from(selectedIds)),
        title: sprintf(
          /* translators: %d: count of selected audit-log entries */
          __("Delete %d audit-log entries?", "yatra"),
          selectedIds.size
        ),
        description: __(
          "Permanent. The deletion itself is recorded as a new audit entry so the operator who removed history is documented.",
          "yatra"
        ),
        confirmText: __("Delete entries", "yatra"),
        cancelText: __("Cancel", "yatra"),
        variant: "danger",
        isLoading: bulkDeleteMutation.isPending
      }
    )
  ] });
};
const SettingsTab = () => {
  var _a, _b;
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["team-settings"],
    queryFn: () => teamApi.getSettings()
  });
  const keepAccess = ((_a = data == null ? void 0 : data.data) == null ? void 0 : _a.keep_access_on_module_disable) === true;
  const serverAllowlist = ((_b = data == null ? void 0 : data.data) == null ? void 0 : _b.login_ip_allowlist) ?? "";
  const [allowlistDraft, setAllowlistDraft] = React.useState(serverAllowlist);
  React.useEffect(() => {
    setAllowlistDraft(serverAllowlist);
  }, [serverAllowlist]);
  const allowlistDirty = allowlistDraft.trim() !== serverAllowlist.trim();
  const updateMutation = useMutation({
    mutationFn: (next) => teamApi.updateSettings({ keep_access_on_module_disable: next }),
    onSuccess: (res) => {
      if (typeof window !== "undefined" && window.yatraAdmin) {
        window.yatraAdmin.teamKeepAccessOnModuleDisable = res.data.keep_access_on_module_disable === true;
      }
      queryClient.invalidateQueries({ queryKey: ["team-settings"] });
      queryClient.invalidateQueries({ queryKey: ["team-audit"] });
      showToast(res.message, "success");
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const saveAllowlist = useMutation({
    mutationFn: (next) => teamApi.updateSettings({ login_ip_allowlist: next }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["team-settings"] });
      queryClient.invalidateQueries({ queryKey: ["team-audit"] });
      showToast(res.message, "success");
      setAllowlistDraft(res.data.login_ip_allowlist ?? "");
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-48" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-20 w-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-32 w-full" })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Team & Access settings", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __(
        "One setting: decide what happens to your team's access if you ever turn off this module. Every change here is recorded in the Audit log.",
        "yatra"
      ) })
    ] }),
    keepAccess ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      Alert,
      {
        variant: "info",
        title: __("You've opted in to keep team access on disable", "yatra"),
        children: __(
          "This toggle is ON. If you ever turn off the Team & Access module, your team members keep their access and their Yatra roles stay on your site. This is a permissive choice — only leave it ON if you specifically want roles to survive a module-off period (for example, a brief maintenance window).",
          "yatra"
        )
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      Alert,
      {
        variant: "info",
        title: __(
          "On the default — team access is revoked when the module is off",
          "yatra"
        ),
        children: __(
          "This toggle is OFF, which is the default. If you ever turn off the Team & Access module, every Yatra role on your site (Owner, Manager, Sales Agent, and any custom roles you built) will be removed, and your team members will lose all Yatra access. Re-enabling the module brings back the 8 built-in roles, but your custom roles and the original assignments do NOT come back. Flip this toggle ON if you'd rather keep your team's access when the module is off.",
          "yatra"
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5 space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 min-w-0", children: [
          keepAccess ? /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Unlock, { className: "w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-base font-medium text-gray-900 dark:text-white block", children: [
              __(
                "Keep team access running when this module is turned off",
                "yatra"
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-xs font-normal text-gray-500 dark:text-gray-400", children: __("(off by default)", "yatra") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: keepAccess ? __(
              "ON. If you turn this module off later, your team members keep their roles and current access. Nothing on your site changes until you decide to switch back.",
              "yatra"
            ) : __(
              "OFF (default). If you turn this module off later, every Yatra role on your site will be removed and your team members will lose their Yatra access. You (the site owner) always keep your own admin access.",
              "yatra"
            ) }),
            updateMutation.isPending && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400 mt-1 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-3 w-3 animate-spin" }),
              __("Saving…", "yatra")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: keepAccess,
            disabled: updateMutation.isPending,
            onCheckedChange: (next) => updateMutation.mutate(next)
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-green-200 bg-green-50/40 dark:border-green-900 dark:bg-green-950/20 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-4 h-4 text-green-600" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: __("While this module stays ON", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __("You (site owner) see everything.", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __("Team members see only what their role allows.", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
              "Customers and other users see nothing in the admin.",
              "yatra"
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-gray-400 italic", children: __(
              "This setting doesn't apply yet — it kicks in only if you turn the module off.",
              "yatra"
            ) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `rounded-md border p-3 ${keepAccess ? "border-green-200 bg-green-50/40 dark:border-green-900 dark:bg-green-950/20" : "border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/20"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1.5", children: [
                keepAccess ? /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-4 h-4 text-green-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "w-4 h-4 text-red-600" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: __("If you ever turn this module OFF", "yatra") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __("You (site owner) still see everything.", "yatra") }),
                keepAccess ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-green-700 dark:text-green-300 font-medium", children: __(
                    "Team members keep their access — based on their assigned role.",
                    "yatra"
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                    "Advanced features (expiry, per-user grants, scopes, audit log) pause until you turn the module back on.",
                    "yatra"
                  ) })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-red-700 dark:text-red-300 font-medium", children: __(
                    "All Yatra roles are deleted (Owner, Manager, custom roles you built — everything except the Yatra Customer role).",
                    "yatra"
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-red-700 dark:text-red-300 font-medium", children: __("Team members lose all their Yatra access.", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __(
                    "Re-enabling the module brings back the 8 built-in roles. Custom roles and the original member assignments don't come back automatically.",
                    "yatra"
                  ) })
                ] })
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { variant: "info", title: __("Quick recap", "yatra"), children: __(
        "Leave the toggle OFF (default) for the security-conservative behavior — every Yatra role is removed if the module is later disabled, so no stale role-based access lingers. Flip it ON only if you specifically need team access to survive a module-off period (e.g. a brief maintenance toggle). Your audit log and member data are preserved either way.",
        "yatra"
      ) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "w-4 h-4 text-blue-500" }),
          __("Restrict staff logins by source IP", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "Optional. Only users who hold a Yatra role are affected — WordPress administrators are always exempt and can never lock themselves out. Drop a comma- or newline-separated list of CIDRs (e.g. 203.0.113.0/24, 198.51.100.5). Empty = no restriction.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            className: "w-full font-mono text-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 min-h-[120px]",
            value: allowlistDraft,
            onChange: (e) => setAllowlistDraft(e.target.value),
            placeholder: "203.0.113.0/24\n2001:db8::/32\n198.51.100.5"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: serverAllowlist.trim() === "" ? __(
            "Currently no restriction — every authenticated staff member can sign in from anywhere.",
            "yatra"
          ) : sprintf(
            /* translators: %d: number of CIDR entries currently active */
            __("%d source IP rule(s) active.", "yatra"),
            serverAllowlist.split(",").filter((s) => s.trim() !== "").length
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            allowlistDirty && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                onClick: () => setAllowlistDraft(serverAllowlist),
                disabled: saveAllowlist.isPending,
                children: __("Reset", "yatra")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: () => saveAllowlist.mutate(allowlistDraft),
                disabled: !allowlistDirty || saveAllowlist.isPending,
                children: [
                  saveAllowlist.isPending && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-4 w-4 mr-1 animate-spin" }),
                  __("Save allowlist", "yatra")
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Alert,
          {
            variant: serverAllowlist.trim() === "" ? "info" : "warning",
            title: serverAllowlist.trim() === "" ? __("Failsafe — admins are always exempt", "yatra") : __("Live restriction is in effect", "yatra"),
            children: serverAllowlist.trim() === "" ? __(
              "If you do enable a restriction here and ever lock yourself out, drop the constant `YATRA_DISABLE_LOGIN_IP_ALLOWLIST = true` into wp-config.php to bypass the gate entirely — no database access required.",
              "yatra"
            ) : __(
              "Logins from outside the allowlist are blocked at the password step. WordPress administrators are exempt — you can never lock yourself out as the site owner. Every block is recorded in the Audit log as `team.login_blocked_by_ip`.",
              "yatra"
            )
          }
        )
      ] })
    ] })
  ] });
};
export {
  Team as default
};
//# sourceMappingURL=Team-COJ6Sjod.js.map
