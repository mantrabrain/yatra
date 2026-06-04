import { t as useQueryClient, r as reactExports, u as useQuery, v as useMutation, j as jsxRuntimeExports, bh as Send, k as FileText, M as MessageCircle, U as Users, V as ExternalLink, br as Settings2, a5 as React, aF as Info, bS as KeyRound, g as CircleUser, bz as ShieldCheck, ar as Clock, D as Loader2, aV as Save, aD as CheckCircle2, b6 as XCircle, bu as EyeOff, aQ as Eye, w as Webhook, aA as Check, aG as Copy, z as ArrowLeft, Z as Zap, x as ChevronDown, bs as Code, aw as Plus, bB as Pencil, bG as History, aN as Trash2, R as RotateCcw } from "../../../dist/js/react-vendor-zODANjVp.js";
import { a as apiClient, u as useToast, _ as __, s as sprintf } from "../../../dist/js/index-zauBMzvd.js";
import { P as PageHeader, C as Card, d as CardContent, f as CardHeader, g as CardTitle, h as CardDescription, B as Button, w as Label, I as Input, t as CardFooter, S as Select, a5 as Table, a6 as TableHeader, a7 as TableRow, a8 as TableHead, a9 as TableBody, aa as TableCell, e as Badge, W as Pagination, k as ConfirmationDialog, M as Modal, A as Alert } from "./app.js";
import { M as ModulePageSkeleton, a as ModuleFormSkeleton } from "../../../dist/js/module-skeleton-7zwRYol6.js";
const whatsappApi = {
  getMeta: () => apiClient.get("/whatsapp/meta"),
  getSettings: () => apiClient.get("/whatsapp/settings"),
  updateSettings: (patch) => apiClient.put("/whatsapp/settings", { settings: patch }),
  updateCredential: (provider, field, value) => apiClient.put("/whatsapp/credentials", {
    provider,
    field,
    value
  }),
  listEvents: () => apiClient.get("/whatsapp/events"),
  listTemplates: () => apiClient.get("/whatsapp/templates"),
  getTemplate: (id) => apiClient.get(`/whatsapp/templates/${id}`),
  createTemplate: (payload) => apiClient.post("/whatsapp/templates", payload),
  updateTemplate: (id, payload) => apiClient.put(`/whatsapp/templates/${id}`, payload),
  deleteTemplate: (id) => apiClient.delete(`/whatsapp/templates/${id}`),
  /**
   * Re-seed the bundled defaults. Useful when the operator has missed
   * a system template (deleted accidentally pre-lockdown, or a
   * first-install race left them with none).
   */
  restoreDefaults: () => apiClient.post("/whatsapp/templates/restore-defaults", {}),
  testSendTemplate: (id, params) => apiClient.post(
    `/whatsapp/templates/${id}/test-send`,
    params
  ),
  /**
   * Paginated message log. Returns `total` so the UI can render correct
   * page counts without local slicing. `page` is 1-indexed.
   */
  listMessages: (params = {}) => apiClient.get("/whatsapp/messages", {
    params: {
      page: params.page ?? 1,
      per_page: params.per_page ?? 20,
      ...params.status ? { status: params.status } : {},
      ...params.phone ? { phone: params.phone } : {}
    }
  }),
  listOptIns: () => apiClient.get("/whatsapp/opt-ins"),
  /* ----------------------- template versions ----------------------- */
  /**
   * Append-only edit history for a template. Returned newest-first.
   * Operators restore from this list when a recent edit needs rollback.
   */
  listTemplateVersions: (id) => apiClient.get(`/whatsapp/templates/${id}/versions`),
  /**
   * Restore the template to a prior snapshot. Server snapshots the
   * CURRENT state first so the chain stays linear ("undo this restore"
   * is just another restore from the most-recent row).
   */
  restoreTemplateVersion: (id, versionId) => apiClient.post(
    `/whatsapp/templates/${id}/versions/${versionId}/restore`,
    {}
  )
};
function getInitialTab() {
  if (typeof window === "undefined") return "delivery";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab === "templates" || tab === "template") return "templates";
  if (tab === "widget") return "widget";
  if (tab === "logs" || tab === "log") return "logs";
  if (tab === "opt-ins" || tab === "optins") return "opt-ins";
  return "delivery";
}
const Whatsapp = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = reactExports.useState(
    () => getInitialTab()
  );
  const switchTab = (next) => {
    setActiveTab(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState({}, "", url.toString());
    }
  };
  const { data: meta, isLoading: metaLoading } = useQuery({
    queryKey: ["whatsapp-meta"],
    queryFn: () => whatsappApi.getMeta()
  });
  const { data: cfg } = useQuery({
    queryKey: ["whatsapp-settings"],
    queryFn: () => whatsappApi.getSettings(),
    enabled: Boolean((meta == null ? void 0 : meta.is_eligible) && (meta == null ? void 0 : meta.is_module_enabled))
  });
  const saveSettings = useMutation({
    mutationFn: (patch) => whatsappApi.updateSettings(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-meta"] });
      showToast(__("WhatsApp settings saved.", "yatra"), "success");
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const saveCredential = useMutation({
    mutationFn: (vars) => whatsappApi.updateCredential("cloud_api", vars.field, vars.value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-meta"] });
      showToast(__("Credential saved.", "yatra"), "success");
    },
    onError: (e) => showToast(extractError(e), "error")
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
            "Send booking + payment + reminder messages over WhatsApp.",
            "yatra"
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(UpgradeCard, { meta })
    ] });
  }
  const automationReady = Boolean(meta.is_module_enabled);
  const tabs = [
    { key: "delivery", label: __("Delivery", "yatra"), icon: Send },
    { key: "templates", label: __("Templates", "yatra"), icon: FileText },
    {
      key: "widget",
      label: __("Frontend widget", "yatra"),
      icon: MessageCircle
    },
    { key: "logs", label: __("Message logs", "yatra"), icon: MessageCircle },
    { key: "opt-ins", label: __("Opt-ins", "yatra"), icon: Users }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        description: __(
          "WhatsApp credentials, system + custom templates, and message logs — bring your own Cloud API account.",
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
        activeTab === "delivery" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: !automationReady ? /* @__PURE__ */ jsxRuntimeExports.jsx(WhatsappModulePrompt, {}) : !cfg ? /* @__PURE__ */ jsxRuntimeExports.jsx(ModuleFormSkeleton, { rows: 5 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          DeliverySection,
          {
            cfg,
            meta,
            onSaveCredential: (field, value) => saveCredential.mutate({ field, value }),
            onSaveSettings: (patch) => saveSettings.mutate(patch),
            saving: saveSettings.isPending || saveCredential.isPending
          }
        ) }),
        activeTab === "templates" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: !automationReady ? /* @__PURE__ */ jsxRuntimeExports.jsx(WhatsappModulePrompt, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(TemplatesTab, {}) }),
        activeTab === "widget" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: !automationReady ? /* @__PURE__ */ jsxRuntimeExports.jsx(WhatsappModulePrompt, {}) : !cfg ? /* @__PURE__ */ jsxRuntimeExports.jsx(ModuleFormSkeleton, { rows: 5 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          WidgetSection,
          {
            settings: cfg.settings,
            onSave: (patch) => saveSettings.mutate(patch),
            saving: saveSettings.isPending
          }
        ) }),
        activeTab === "logs" && (automationReady ? /* @__PURE__ */ jsxRuntimeExports.jsx(LogsList, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(WhatsappModulePrompt, {})),
        activeTab === "opt-ins" && (automationReady ? /* @__PURE__ */ jsxRuntimeExports.jsx(OptInsList, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(WhatsappModulePrompt, {}))
      ] })
    ] })
  ] });
};
const UpgradeCard = ({ meta }) => {
  const upgradeUrl = (meta == null ? void 0 : meta.upgrade_url) || "https://wpyatra.com/pricing?module=whatsapp";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "max-w-3xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("WhatsApp Notifications", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "mt-1", children: __(
          "Available on the Growth plan (or Scale). Send booking + payment + reminder messages — bring your own Meta Cloud API credentials.",
          "yatra"
        ) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: upgradeUrl, target: "_blank", rel: "noopener noreferrer", children: [
      __("Upgrade to Growth", "yatra"),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "ml-2 h-4 w-4" })
    ] }) }) })
  ] });
};
const WhatsappModulePrompt = () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-amber-900 dark:text-amber-100", children: __("Enable the WhatsApp Notifications module", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-amber-800/90 dark:text-amber-200/90", children: __(
        "Your license tier qualifies. Turn on WhatsApp Notifications under Modules to start configuring it.",
        "yatra"
      ) })
    ] })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    Button,
    {
      type: "button",
      variant: "outline",
      asChild: true,
      className: "border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "admin.php?page=yatra&subpage=modules", children: __("Open Modules", "yatra") })
    }
  )
] }) });
const DeliverySection = ({ cfg, meta, onSaveCredential, onSaveSettings, saving }) => {
  var _a, _b, _c, _d, _e;
  const settings = cfg.settings;
  const credStatus = ((_a = cfg.credentials) == null ? void 0 : _a.cloud_api) ?? {};
  const [tokenInput, setTokenInput] = reactExports.useState("");
  const [webhookInput, setWebhookInput] = reactExports.useState("");
  const [showToken, setShowToken] = reactExports.useState(false);
  const [showWebhook, setShowWebhook] = reactExports.useState(false);
  const [phoneNumberId, setPhoneNumberId] = reactExports.useState(settings.phone_number_id);
  const [businessAccountId, setBusinessAccountId] = reactExports.useState(
    settings.business_account_id
  );
  const [defaultCountryCode, setDefaultCountryCode] = reactExports.useState(
    settings.default_country_code
  );
  const [senderName, setSenderName] = reactExports.useState(settings.sender_display_name);
  const [adminPhone, setAdminPhone] = reactExports.useState(settings.admin_phone);
  const [optInRequired, setOptInRequired] = reactExports.useState(settings.opt_in_required);
  const [optInCopy, setOptInCopy] = reactExports.useState(settings.opt_in_copy);
  const [reminderBefore, setReminderBefore] = reactExports.useState(
    settings.reminder_hours_before
  );
  const [reviewAfter, setReviewAfter] = reactExports.useState(
    settings.review_hours_after
  );
  React.useEffect(() => {
    setPhoneNumberId(settings.phone_number_id);
    setBusinessAccountId(settings.business_account_id);
    setDefaultCountryCode(settings.default_country_code);
    setSenderName(settings.sender_display_name);
    setAdminPhone(settings.admin_phone);
    setOptInRequired(settings.opt_in_required);
    setOptInCopy(settings.opt_in_copy);
    setReminderBefore(settings.reminder_hours_before);
    setReviewAfter(settings.review_hours_after);
  }, [
    settings.phone_number_id,
    settings.business_account_id,
    settings.default_country_code,
    settings.sender_display_name,
    settings.admin_phone,
    settings.opt_in_required,
    settings.opt_in_copy,
    settings.reminder_hours_before,
    settings.review_hours_after
  ]);
  const dirty = phoneNumberId !== settings.phone_number_id || businessAccountId !== settings.business_account_id || defaultCountryCode !== settings.default_country_code || senderName !== settings.sender_display_name || adminPhone !== settings.admin_phone || optInRequired !== settings.opt_in_required || optInCopy !== settings.opt_in_copy || reminderBefore !== settings.reminder_hours_before || reviewAfter !== settings.review_hours_after;
  const saveAll = () => onSaveSettings({
    phone_number_id: phoneNumberId,
    business_account_id: businessAccountId,
    sender_display_name: senderName,
    default_country_code: defaultCountryCode,
    admin_phone: adminPhone,
    opt_in_required: optInRequired,
    opt_in_copy: optInCopy,
    reminder_hours_before: reminderBefore,
    review_hours_after: reviewAfter
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-blue-200 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-5 w-5 text-blue-600 dark:text-blue-400" }),
          __(
            "Before you start — getting WhatsApp Cloud API access",
            "yatra"
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "mt-2", children: __(
          "All values below come from Meta's WhatsApp Business Platform. Bring your own credentials — messages are billed directly by Meta, no markup from the plugin.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
            target: "_blank",
            rel: "noopener noreferrer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "mr-1.5 h-3.5 w-3.5" }),
              __("Cloud API: Get started", "yatra")
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: "https://business.facebook.com/wa/manage/home/",
            target: "_blank",
            rel: "noopener noreferrer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "mr-1.5 h-3.5 w-3.5" }),
              __("Open WhatsApp Manager", "yatra")
            ]
          }
        ) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-5 w-5 text-blue-500" }),
          __("WhatsApp Cloud API credentials", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "Encrypted credentials Meta requires for the plugin to send messages on your behalf. Stored with libsodium AEAD; the browser only ever sees a masked last-4 hint.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CredentialField,
          {
            label: __("Permanent access token", "yatra"),
            description: __(
              "Required for every API call to Meta. Find it under Meta for Developers → your app → WhatsApp → API Setup, or generate a permanent token under Business Settings → System Users.",
              "yatra"
            ),
            docsUrl: "https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#access-tokens",
            placeholder: ((_b = credStatus.access_token) == null ? void 0 : _b.configured) ? credStatus.access_token.hint : "EAAB...",
            configured: !!((_c = credStatus.access_token) == null ? void 0 : _c.configured),
            visible: showToken,
            value: tokenInput,
            onToggle: () => setShowToken((v) => !v),
            onChange: setTokenInput,
            onSave: () => {
              onSaveCredential("access_token", tokenInput);
              setTokenInput("");
            },
            onClear: () => onSaveCredential("access_token", ""),
            saving
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CredentialField,
          {
            label: __("Webhook verify secret (App Secret)", "yatra"),
            description: __(
              "Required only when receiving inbound replies. Find it under your app → Settings → Basic → App Secret.",
              "yatra"
            ),
            docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks",
            optional: true,
            placeholder: ((_d = credStatus.webhook_secret) == null ? void 0 : _d.configured) ? credStatus.webhook_secret.hint : __("Optional — only needed when receiving messages.", "yatra"),
            configured: !!((_e = credStatus.webhook_secret) == null ? void 0 : _e.configured),
            visible: showWebhook,
            value: webhookInput,
            onToggle: () => setShowWebhook((v) => !v),
            onChange: setWebhookInput,
            onSave: () => {
              onSaveCredential("webhook_secret", webhookInput);
              setWebhookInput("");
            },
            onClear: () => onSaveCredential("webhook_secret", ""),
            saving
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WebhookSetupCard, { meta }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Business identifiers", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "Numeric IDs from Meta + the admin phone that receives operator-recipient templates.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Phone number ID", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: phoneNumberId,
                placeholder: "123456789012345",
                onChange: (e) => setPhoneNumberId(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("WhatsApp Business Account ID", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: businessAccountId,
                placeholder: "987654321098765",
                onChange: (e) => setBusinessAccountId(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Sender display name", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: senderName,
                placeholder: __("Your tour brand", "yatra"),
                onChange: (e) => setSenderName(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Default country code", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: defaultCountryCode,
                placeholder: "+977",
                onChange: (e) => setDefaultCountryCode(e.target.value)
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-md border border-orange-200 bg-orange-50/40 p-3 dark:border-orange-700 dark:bg-orange-900/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleUser, { className: "h-4 w-4 text-orange-600 dark:text-orange-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "font-semibold text-orange-900 dark:text-orange-200", children: __("Admin phone (for operator notifications)", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-orange-900/80 dark:text-orange-200/80", children: __(
            'Destination for any template with recipient type "Admin" — for example a "New booking" alert sent to the operator. Leave blank to skip those sends. Must be in E.164 format.',
            "yatra"
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: adminPhone,
              placeholder: "+9779800000000",
              onChange: (e) => setAdminPhone(e.target.value)
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-5 w-5 text-green-500" }),
        __("Compliance & opt-in", "yatra")
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-3 cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: optInRequired,
              onChange: (e) => setOptInRequired(e.target.checked),
              className: "mt-1"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("Require opt-in before sending", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
              "Refuses sends to phone numbers that haven't explicitly opted in. Admin-recipient templates are exempt (the operator owns that number).",
              "yatra"
            ) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Opt-in checkbox copy", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              className: "w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800",
              rows: 3,
              value: optInCopy,
              onChange: (e) => setOptInCopy(e.target.value),
              placeholder: __(
                "Send me booking updates and trip reminders on WhatsApp. Reply STOP to opt out anytime.",
                "yatra"
              )
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5 w-5 text-blue-500" }),
          __("Reminder schedule", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "How far before / after a trip the time-based templates fire. Clamped 1–168 hours.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Departure reminder (hours before)", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: "number",
              min: 1,
              max: 168,
              value: reminderBefore,
              onChange: (e) => setReminderBefore(Number(e.target.value) || 0)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Review request (hours after)", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: "number",
              min: 1,
              max: 168,
              value: reviewAfter,
              onChange: (e) => setReviewAfter(Number(e.target.value) || 0)
            }
          )
        ] })
      ] }) })
    ] }),
    dirty && /* @__PURE__ */ jsxRuntimeExports.jsx(CardFooter, { className: "flex justify-end border-t border-gray-100 pt-4 dark:border-gray-700/50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveAll, disabled: saving, children: saving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }),
      __("Saving…", "yatra")
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-1.5 h-4 w-4" }),
      __("Save WhatsApp settings", "yatra")
    ] }) }) })
  ] });
};
const WebhookSetupCard = ({ meta }) => {
  const { showToast } = useToast();
  const webhook = meta.webhook;
  const [justCopied, setJustCopied] = reactExports.useState(null);
  const copy = async (text, label) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setJustCopied(label);
      window.setTimeout(() => setJustCopied(null), 2e3);
    } catch (_e) {
      showToast(__("Failed to copy to clipboard.", "yatra"), "error");
    }
  };
  const tokenMissing = !(webhook == null ? void 0 : webhook.verify_token);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Webhook, { className: "h-4 w-4 text-blue-600 dark:text-blue-400" }),
        __("Meta webhook setup", "yatra")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
        __(
          "Paste these values into your Meta app → WhatsApp → Configuration → Webhooks. Once verified, Meta will deliver message status callbacks (sent / delivered / read / failed) and inbound replies here.",
          "yatra"
        ),
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: "https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "text-blue-600 hover:underline dark:text-blue-400",
            children: [
              __("Setup guide", "yatra"),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "inline h-3 w-3" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Label,
          {
            htmlFor: "whatsapp-webhook-url",
            className: "text-xs text-gray-500 dark:text-gray-400",
            children: __("Callback URL", "yatra")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "whatsapp-webhook-url",
              readOnly: true,
              value: (webhook == null ? void 0 : webhook.url) || "",
              className: "font-mono text-sm",
              onFocus: (e) => e.currentTarget.select()
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: () => copy((webhook == null ? void 0 : webhook.url) || "", "url"),
              disabled: !(webhook == null ? void 0 : webhook.url),
              "aria-label": __("Copy callback URL", "yatra"),
              children: justCopied === "url" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-1.5 h-3.5 w-3.5" }),
                __("Copied", "yatra")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "mr-1.5 h-3.5 w-3.5" }),
                __("Copy", "yatra")
              ] })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Label,
          {
            htmlFor: "whatsapp-verify-token",
            className: "text-xs text-gray-500 dark:text-gray-400",
            children: __("Verify token", "yatra")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "whatsapp-verify-token",
              readOnly: true,
              value: (webhook == null ? void 0 : webhook.verify_token) || "",
              placeholder: tokenMissing ? __(
                "Will be generated when you save settings for the first time.",
                "yatra"
              ) : "",
              className: "font-mono text-sm",
              onFocus: (e) => e.currentTarget.select()
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: () => copy((webhook == null ? void 0 : webhook.verify_token) || "", "token"),
              disabled: tokenMissing,
              "aria-label": __("Copy verify token", "yatra"),
              children: justCopied === "token" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-1.5 h-3.5 w-3.5" }),
                __("Copied", "yatra")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "mr-1.5 h-3.5 w-3.5" }),
                __("Copy", "yatra")
              ] })
            }
          )
        ] }),
        tokenMissing && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-amber-600 dark:text-amber-400", children: __(
          "Save your settings once to generate a verify token, then come back to copy it.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm", children: (webhook == null ? void 0 : webhook.app_secret_configured) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2 text-green-700 dark:text-green-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "h-4 w-4" }),
        __(
          "App Secret is configured — webhook signatures will be verified.",
          "yatra"
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2 text-amber-700 dark:text-amber-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "h-4 w-4" }),
        __(
          "App Secret not set — inbound webhook events will be rejected for security. Paste your Meta App Secret above as “Webhook verify secret”.",
          "yatra"
        )
      ] }) })
    ] })
  ] });
};
const CredentialField = ({
  label,
  description,
  docsUrl,
  optional,
  placeholder,
  configured,
  visible,
  value,
  onToggle,
  onChange,
  onSave,
  onClear,
  saving
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "flex items-center gap-1.5", children: [
      label,
      optional && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-wide text-gray-400", children: __("optional", "yatra") })
    ] }),
    docsUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "a",
      {
        href: docsUrl,
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
  description && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: description })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          type: visible ? "text" : "password",
          value,
          placeholder,
          onChange: (e) => onChange(e.target.value)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: onToggle,
          className: "absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600",
          children: visible ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: onSave, disabled: saving || value.trim() === "", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-1.5 h-4 w-4" }),
      __("Save", "yatra")
    ] }),
    configured && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClear, disabled: saving, children: __("Clear", "yatra") })
  ] }),
  configured && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-green-600 dark:text-green-400", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "mr-1 inline h-3 w-3" }),
    __("Configured", "yatra")
  ] })
] });
const TemplatesTab = () => {
  const [editingId, setEditingId] = reactExports.useState(null);
  const { data: tplData, isLoading: tplLoading } = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: () => whatsappApi.listTemplates()
  });
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["whatsapp-events"],
    queryFn: () => whatsappApi.listEvents()
  });
  if (tplLoading || eventsLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-10 w-10 animate-spin text-gray-400" }) });
  }
  const templates = (tplData == null ? void 0 : tplData.data) ?? [];
  const events = (eventsData == null ? void 0 : eventsData.data) ?? [];
  if (editingId !== null) {
    const existing = editingId === "new" ? null : templates.find((t) => t.id === editingId) ?? null;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      TemplateEditForm,
      {
        existing,
        events,
        onClose: () => setEditingId(null)
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    TemplatesList,
    {
      templates,
      events,
      onEdit: (id) => setEditingId(id),
      onCreate: () => setEditingId("new")
    }
  );
};
const TemplatesList = ({ templates, events, onEdit, onCreate }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const eventName = (key) => {
    var _a;
    return ((_a = events.find((e) => e.key === key)) == null ? void 0 : _a.name) ?? key;
  };
  const [pendingDelete, setPendingDelete] = reactExports.useState(null);
  const [historyFor, setHistoryFor] = reactExports.useState(null);
  const deleteTpl = useMutation({
    mutationFn: (id) => whatsappApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      showToast(__("Template deleted.", "yatra"), "success");
      setPendingDelete(null);
    },
    onError: (e) => {
      showToast(extractError(e), "error");
      setPendingDelete(null);
    }
  });
  const restoreDefaults = useMutation({
    mutationFn: () => whatsappApi.restoreDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      showToast(__("Default templates restored.", "yatra"), "success");
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const noSystemTemplates = templates.every((t) => !t.is_system);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("WhatsApp templates", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __(
          "System templates ship with the plugin — you can toggle them on/off but not edit or delete them. Add custom templates for any event you want.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        noSystemTemplates && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            onClick: () => restoreDefaults.mutate(),
            disabled: restoreDefaults.isPending,
            children: [
              restoreDefaults.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
              __("Restore default templates", "yatra")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: onCreate, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
          __("Add custom template", "yatra")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50 dark:bg-gray-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase", children: __("Name", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase", children: __("Event", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase", children: __("Recipient", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase", children: __("Type", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase", children: __("Status", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase", children: __("Actions", "yatra") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: templates.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "td",
        {
          colSpan: 6,
          className: "p-8 text-center text-gray-500 dark:text-gray-400",
          children: __(
            "No templates yet — click Add custom template.",
            "yatra"
          )
        }
      ) }) : templates.map((tpl) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "tr",
        {
          className: "hover:bg-gray-50 dark:hover:bg-gray-800/50",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4 text-blue-500" }),
                tpl.name
              ] }),
              tpl.description && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1", children: tpl.description })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-3 h-3" }),
              eventName(tpl.event_key)
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                className: tpl.recipient_type === "admin" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                children: tpl.recipient_type === "admin" ? __("Admin", "yatra") : __("Customer", "yatra")
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                className: tpl.is_system ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                children: tpl.is_system ? __("System", "yatra") : __("Custom", "yatra")
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                className: tpl.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                children: tpl.is_active ? __("Active", "yatra") : __("Disabled", "yatra")
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => onEdit(tpl.id),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "mr-1.5 h-3.5 w-3.5" }),
                    __("Edit", "yatra")
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => setHistoryFor({
                    id: tpl.id,
                    name: tpl.name,
                    isSystem: tpl.is_system
                  }),
                  "aria-label": __("Version history", "yatra"),
                  title: __("Version history", "yatra"),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "h-3.5 w-3.5" })
                }
              ),
              !tpl.is_system && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  className: "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30",
                  onClick: () => setPendingDelete({ id: tpl.id, name: tpl.name }),
                  disabled: deleteTpl.isPending,
                  "aria-label": __("Delete template", "yatra"),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" })
                }
              )
            ] }) })
          ]
        },
        tpl.id
      )) })
    ] }) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: pendingDelete !== null,
        onClose: () => {
          if (!deleteTpl.isPending) setPendingDelete(null);
        },
        onConfirm: () => {
          if (pendingDelete) deleteTpl.mutate(pendingDelete.id);
        },
        title: __("Delete template?", "yatra"),
        description: pendingDelete ? __(
          "Delete the “{name}” template? This cannot be undone, and any events bound to it will stop sending until you create a replacement.",
          "yatra"
        ).replace("{name}", pendingDelete.name) : "",
        confirmText: __("Delete template", "yatra"),
        cancelText: __("Cancel", "yatra"),
        variant: "danger",
        isLoading: deleteTpl.isPending
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TemplateHistoryDialog,
      {
        template: historyFor,
        onClose: () => setHistoryFor(null)
      }
    )
  ] });
};
const TemplateHistoryDialog = ({ template, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [expandedId, setExpandedId] = reactExports.useState(null);
  const [pendingRestore, setPendingRestore] = reactExports.useState(null);
  const enabled = template !== null;
  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-template-versions", template == null ? void 0 : template.id],
    queryFn: () => whatsappApi.listTemplateVersions(template.id),
    enabled
  });
  const restore = useMutation({
    mutationFn: (versionId) => whatsappApi.restoreTemplateVersion(template.id, versionId),
    onSuccess: (r) => {
      showToast(r.message, "success");
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      void queryClient.invalidateQueries({
        queryKey: ["whatsapp-template-versions", template.id]
      });
      setPendingRestore(null);
    },
    onError: (e) => {
      showToast(extractError(e), "error");
      setPendingRestore(null);
    }
  });
  if (!template) return null;
  const versions = (data == null ? void 0 : data.data) ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Modal,
    {
      isOpen: true,
      onClose,
      title: sprintf(
        /* translators: %s: template name */
        __("Version history — %s", "yatra"),
        template.name
      ),
      size: "xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          template.isSystem && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { variant: "info", children: __(
            "Restoring a system template only resets its Active/Disabled toggle. Body, event binding, and recipient type are managed by the plugin and can't be reverted from history.",
            "yatra"
          ) }),
          isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-6 w-6 animate-spin text-gray-400" }) }) : versions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-10 h-10 text-gray-400 mx-auto" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-gray-600 dark:text-gray-400", children: __(
              "No prior versions yet. Make an edit and history starts building from the next save.",
              "yatra"
            ) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 max-h-[60vh] overflow-y-auto", children: versions.map((v) => {
            const isExpanded = expandedId === v.id;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "rounded-md border border-gray-200 dark:border-gray-700",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      className: "w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40",
                      onClick: () => setExpandedId(isExpanded ? null : v.id),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mt-0.5", children: [
                          "v",
                          v.version_number
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: v.change_summary || __("(no diff captured)", "yatra") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 mt-0.5", children: [
                            v.created_at,
                            v.created_by !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                              " · ",
                              sprintf(
                                /* translators: %d: WP user id of the editor */
                                __("by user #%d", "yatra"),
                                v.created_by
                              )
                            ] })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          ChevronDown,
                          {
                            className: `h-4 w-4 text-gray-400 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`
                          }
                        )
                      ]
                    }
                  ),
                  isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-gray-200 dark:border-gray-700 p-3 space-y-2 text-xs", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600 dark:text-gray-300", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-500", children: __("Name", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: v.snapshot.name || "—" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-500", children: __("Event", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono", children: v.snapshot.event_key || "—" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-500", children: __("Recipient", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: v.snapshot.recipient_type || "—" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-500", children: __("Active", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: v.snapshot.is_active ? __("Yes", "yatra") : __("No", "yatra") })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-500", children: __("Body", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "mt-1 whitespace-pre-wrap rounded bg-gray-50 dark:bg-gray-800/50 p-2 font-mono text-[11px] max-h-48 overflow-y-auto", children: v.snapshot.body || "—" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end pt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        size: "sm",
                        variant: "outline",
                        onClick: () => setPendingRestore(v),
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3.5 w-3.5 mr-1" }),
                          __("Restore this version", "yatra")
                        ]
                      }
                    ) })
                  ] })
                ]
              },
              v.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ConfirmationDialog,
          {
            isOpen: pendingRestore !== null,
            onClose: () => {
              if (!restore.isPending) setPendingRestore(null);
            },
            onConfirm: () => {
              if (pendingRestore) restore.mutate(pendingRestore.id);
            },
            title: __("Restore this version?", "yatra"),
            description: pendingRestore ? sprintf(
              __(
                "This rewrites the live template with v%d's contents. The current state is saved as a new version first so you can roll back this restore later.",
                "yatra"
              ),
              pendingRestore.version_number
            ) : "",
            confirmText: __("Restore version", "yatra"),
            cancelText: __("Cancel", "yatra"),
            isLoading: restore.isPending
          }
        )
      ]
    }
  );
};
const TemplateEditForm = ({ existing, events, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isCreate = existing === null;
  const isSystem = !!(existing == null ? void 0 : existing.is_system);
  const [name, setName] = reactExports.useState((existing == null ? void 0 : existing.name) ?? "");
  const [description, setDescription] = reactExports.useState((existing == null ? void 0 : existing.description) ?? "");
  const [eventKey, setEventKey] = reactExports.useState((existing == null ? void 0 : existing.event_key) ?? "");
  const [recipient, setRecipient] = reactExports.useState(
    (existing == null ? void 0 : existing.recipient_type) ?? "customer"
  );
  const [isActive, setIsActive] = reactExports.useState((existing == null ? void 0 : existing.is_active) ?? true);
  const [metaTemplateName, setMetaTemplateName] = reactExports.useState(
    (existing == null ? void 0 : existing.meta_template_name) ?? ""
  );
  const [languageCode, setLanguageCode] = reactExports.useState(
    (existing == null ? void 0 : existing.language_code) ?? "en_US"
  );
  const [body, setBody] = reactExports.useState((existing == null ? void 0 : existing.body) ?? "");
  const [copiedVar, setCopiedVar] = reactExports.useState(null);
  const [showEventDropdown, setShowEventDropdown] = reactExports.useState(false);
  const bodyRef = React.useRef(null);
  const selectedEvent = reactExports.useMemo(
    () => events.find((e) => e.key === eventKey) ?? null,
    [events, eventKey]
  );
  const variables = (selectedEvent == null ? void 0 : selectedEvent.variables) ?? [];
  const save = useMutation({
    mutationFn: () => {
      const payload = isSystem ? { is_active: isActive } : {
        name,
        description,
        event_key: eventKey,
        recipient_type: recipient,
        is_active: isActive,
        body,
        settings: {
          meta_template_name: metaTemplateName,
          language_code: languageCode
        }
      };
      return isCreate ? whatsappApi.createTemplate(payload) : whatsappApi.updateTemplate(existing.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      showToast(
        isCreate ? __("Template created.", "yatra") : __("Template saved.", "yatra"),
        "success"
      );
      onClose();
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const copyVariable = (placeholder) => {
    var _a;
    try {
      (_a = navigator.clipboard) == null ? void 0 : _a.writeText(placeholder);
      setCopiedVar(placeholder);
      setTimeout(() => setCopiedVar(null), 1500);
    } catch {
    }
  };
  const insertVariable = (placeholder) => {
    const el = bodyRef.current;
    if (!el) {
      setBody((prev) => prev + placeholder);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + placeholder + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      if (!bodyRef.current) return;
      const cursor = start + placeholder.length;
      bodyRef.current.focus();
      bodyRef.current.setSelectionRange(cursor, cursor);
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: onClose, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-1.5 h-4 w-4" }),
          __("Back to templates", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-5 w-5 text-blue-500" }),
            isCreate ? __("Add custom template", "yatra") : existing.name,
            isSystem && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", children: __("System", "yatra") })
          ] }),
          (existing == null ? void 0 : existing.description) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-sm text-gray-500 dark:text-gray-400", children: existing.description })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: () => save.mutate(),
          disabled: save.isPending || name.trim() === "",
          children: save.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }),
            __("Saving…", "yatra")
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-1.5 h-4 w-4" }),
            isCreate ? __("Create template", "yatra") : __("Save changes", "yatra")
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6 lg:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __("Template details", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm font-normal", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: isActive,
                onChange: (e) => setIsActive(e.target.checked)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                className: isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                children: isActive ? __("Active", "yatra") : __("Disabled", "yatra")
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          isSystem && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-700 dark:bg-blue-900/20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-blue-900 dark:text-blue-200", children: __(
              "This is a system template. You can toggle it on or off but every other field is locked — that way plugin updates can safely refresh the copy. Create a custom template if you need different content for this event.",
              "yatra"
            ) })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Template name", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: name,
                onChange: (e) => setName(e.target.value),
                readOnly: isSystem,
                className: isSystem ? "bg-gray-50 dark:bg-gray-900/40" : "",
                placeholder: __("e.g. Welcome to your trip", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Description", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: description ?? "",
                onChange: (e) => setDescription(e.target.value),
                readOnly: isSystem,
                className: isSystem ? "bg-gray-50 dark:bg-gray-900/40" : "",
                placeholder: __(
                  "Short description shown in the template list",
                  "yatra"
                )
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300", children: __("Trigger Event", "yatra") }),
            isSystem ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-4 h-4" }),
                  (selectedEvent == null ? void 0 : selectedEvent.name) ?? eventKey
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: __("System templates can't change events", "yatra") })
              ] }),
              (selectedEvent == null ? void 0 : selectedEvent.description) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-indigo-800 dark:text-indigo-300", children: selectedEvent.description }) })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setShowEventDropdown((v) => !v),
                  className: "w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-colors",
                  children: [
                    selectedEvent ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-4 h-4 text-blue-500" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-gray-900 dark:text-white", children: selectedEvent.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded", children: selectedEvent.key })
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-4 h-4 text-gray-400" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Pick an event…", "yatra") })
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
              showEventDropdown && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-1", children: events.map((event) => {
                const active = event.key === eventKey;
                return /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      setEventKey(event.key);
                      setShowEventDropdown(false);
                    },
                    className: `w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${active ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}`,
                    children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Zap,
                        {
                          className: `w-4 h-4 mt-0.5 flex-shrink-0 ${active ? "text-blue-500" : "text-gray-400"}`
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "span",
                            {
                              className: `text-sm font-medium ${active ? "text-blue-800 dark:text-blue-400" : "text-gray-900 dark:text-white"}`,
                              children: event.name
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded", children: event.key })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2", children: event.description })
                      ] }),
                      active && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4 text-blue-500 flex-shrink-0" })
                    ] })
                  },
                  event.key
                );
              }) }) })
            ] }),
            selectedEvent && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1 italic", children: selectedEvent.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Recipient", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "label",
                {
                  className: `flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${recipient === "customer" ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600"} ${isSystem ? "opacity-60 cursor-not-allowed" : ""}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "radio",
                        checked: recipient === "customer",
                        onChange: () => !isSystem && setRecipient("customer"),
                        disabled: isSystem
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleUser, { className: "h-4 w-4 text-blue-600" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: __("Customer", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: __("Sends to the booking customer", "yatra") })
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "label",
                {
                  className: `flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${recipient === "admin" ? "border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20" : "border-gray-300 dark:border-gray-600"} ${isSystem ? "opacity-60 cursor-not-allowed" : ""}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "radio",
                        checked: recipient === "admin",
                        onChange: () => !isSystem && setRecipient("admin"),
                        disabled: isSystem
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleUser, { className: "h-4 w-4 text-orange-600" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: __("Admin", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
                        "Sends to the admin phone in Delivery settings",
                        "yatra"
                      ) })
                    ] })
                  ]
                }
              )
            ] }),
            isSystem && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 italic", children: __(
              "System templates can't change recipient type.",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Meta template name", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: metaTemplateName,
                  onChange: (e) => setMetaTemplateName(e.target.value),
                  readOnly: isSystem,
                  className: isSystem ? "bg-gray-50 dark:bg-gray-900/40" : "",
                  placeholder: "yatra_booking_confirmed"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Language code", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: languageCode,
                  onChange: (e) => setLanguageCode(e.target.value),
                  readOnly: isSystem,
                  className: isSystem ? "bg-gray-50 dark:bg-gray-900/40" : "",
                  placeholder: "en_US"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300", children: __("Message body", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                ref: bodyRef,
                value: body,
                onChange: (e) => setBody(e.target.value),
                rows: 12,
                readOnly: isSystem,
                className: `w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm text-gray-900 dark:text-white ${isSystem ? "bg-gray-50 dark:bg-gray-900/40" : "bg-white dark:bg-gray-800"}`,
                placeholder: __(
                  "Use {{variable}} syntax — variables come from the trigger event.",
                  "yatra"
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: isSystem ? __(
              "System template body is locked. Create a custom template to author your own copy for this event.",
              "yatra"
            ) : __(
              "Click a variable on the right to copy, double-click to insert at the cursor.",
              "yatra"
            ) })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "w-5 h-5 text-blue-500" }),
            __("Available Variables", "yatra")
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: !selectedEvent ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __(
            "Pick a Trigger Event above to see the variables you can use here.",
            "yatra"
          ) }) : variables.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __("This event has no variables.", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
              "Click to copy, double-click to insert at cursor",
              "yatra"
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: variables.map((v) => {
              const placeholder = `{{${v.key}}}`;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => copyVariable(placeholder),
                  onDoubleClick: () => insertVariable(placeholder),
                  className: "w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs text-blue-600 dark:text-blue-400", children: placeholder }),
                      copiedVar === placeholder ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-3 h-3 text-green-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" })
                    ] }),
                    v.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: v.description })
                  ]
                },
                v.key
              );
            }) })
          ] }) })
        ] }),
        !isCreate && /* @__PURE__ */ jsxRuntimeExports.jsx(
          TemplateTestSendCard,
          {
            templateId: existing.id,
            recipient
          }
        )
      ] })
    ] })
  ] });
};
const TemplateTestSendCard = ({ templateId, recipient }) => {
  const { showToast } = useToast();
  const [phone, setPhone] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const [result, setResult] = reactExports.useState(
    null
  );
  const run = async () => {
    if (recipient === "customer" && phone.trim() === "") {
      showToast(__("Enter a destination phone number.", "yatra"), "error");
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await whatsappApi.testSendTemplate(templateId, {
        phone: phone.trim()
      });
      setResult({
        ok: res.ok,
        message: res.ok ? __("Sent — check your WhatsApp.", "yatra") + (res.provider_message_id ? ` (id: ${res.provider_message_id})` : "") : res.error || __("Send failed.", "yatra")
      });
    } catch (e) {
      setResult({ ok: false, message: extractError(e) });
    } finally {
      setSending(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-5 w-5 text-blue-500" }),
        __("Send test message", "yatra")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: recipient === "admin" ? __(
        "Admin-recipient templates send to the admin phone in Delivery settings.",
        "yatra"
      ) : __("Sends this template to the phone you enter below.", "yatra") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
      recipient === "customer" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Phone (E.164)", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: phone,
            placeholder: "+9779800000000",
            onChange: (e) => setPhone(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: run, disabled: sending, className: "w-full", children: [
        sending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "mr-1.5 h-4 w-4" }),
        __("Send test", "yatra")
      ] }),
      result && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `flex items-start gap-2 rounded-md p-3 text-sm ${result.ok ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200" : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"}`,
          children: [
            result.ok ? /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "mt-0.5 h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "mt-0.5 h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: result.message })
          ]
        }
      )
    ] })
  ] });
};
const WidgetSection = ({ settings, onSave, saving }) => {
  const w = settings.widget;
  const [enabled, setEnabled] = reactExports.useState(w.enabled);
  const [contactPhone, setContactPhone] = reactExports.useState(w.contact_phone);
  const [prefilled, setPrefilled] = reactExports.useState(w.prefilled_message);
  const [displayOn, setDisplayOn] = reactExports.useState(
    w.display_on
  );
  const [position, setPosition] = reactExports.useState(
    w.position
  );
  const [label, setLabel] = reactExports.useState(w.label);
  const [showOnSidebar, setShowOnSidebar] = reactExports.useState(w.show_on_trip_sidebar);
  React.useEffect(() => {
    setEnabled(w.enabled);
    setContactPhone(w.contact_phone);
    setPrefilled(w.prefilled_message);
    setDisplayOn(w.display_on);
    setPosition(w.position);
    setLabel(w.label);
    setShowOnSidebar(w.show_on_trip_sidebar);
  }, [
    w.enabled,
    w.contact_phone,
    w.prefilled_message,
    w.display_on,
    w.position,
    w.label,
    w.show_on_trip_sidebar
  ]);
  const dirty = enabled !== w.enabled || contactPhone !== w.contact_phone || prefilled !== w.prefilled_message || displayOn !== w.display_on || position !== w.position || label !== w.label || showOnSidebar !== w.show_on_trip_sidebar;
  const save = () => onSave({
    widget: {
      enabled,
      contact_phone: contactPhone,
      prefilled_message: prefilled,
      display_on: displayOn,
      position,
      label,
      show_on_trip_sidebar: showOnSidebar
    }
  });
  const previewUrl = reactExports.useMemo(() => {
    const digits = contactPhone.replace(/[^0-9]/g, "");
    const msg = prefilled.replace(/\{\{trip_name\}\}/g, "Demo Trip");
    return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}` : "";
  }, [contactPhone, prefilled]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-5 w-5 text-green-500" }),
        __("Public WhatsApp widget", "yatra")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
        'Adds a "Chat on WhatsApp" affordance to your public site. Free for the operator — uses wa.me deep linking, no per-tap charges. Independent of the Cloud API credentials you configured under Delivery.',
        "yatra"
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-3 cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            checked: enabled,
            onChange: (e) => setEnabled(e.target.checked),
            className: "mt-1"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("Enable widget", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
            "Off by default. When on, renders per the display rules below.",
            "yatra"
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Contact phone (E.164)", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: contactPhone,
            placeholder: "+9779800000000",
            onChange: (e) => setContactPhone(e.target.value)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
          "Visitors land on a chat with THIS number. Can be any WhatsApp-enabled phone — doesn't have to be the Cloud-API phone you use for outbound automation.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Pre-filled message", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            className: "w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800",
            rows: 3,
            value: prefilled,
            onChange: (e) => setPrefilled(e.target.value),
            placeholder: __(
              "Hi! I'd like to know more about {{trip_name}}.",
              "yatra"
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
          "Use {{trip_name}} to insert the current trip's name when the widget renders on a single-trip page. Replaced with the actual title at render time.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Show on", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "radio",
                  checked: displayOn === "trips_only",
                  onChange: () => setDisplayOn("trips_only")
                }
              ),
              __("Single trip pages only", "yatra")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "radio",
                  checked: displayOn === "all",
                  onChange: () => setDisplayOn("all")
                }
              ),
              __("Every frontend page", "yatra")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Position", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "radio",
                  checked: position === "bottom-right",
                  onChange: () => setPosition("bottom-right")
                }
              ),
              __("Bottom right", "yatra")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "radio",
                  checked: position === "bottom-left",
                  onChange: () => setPosition("bottom-left")
                }
              ),
              __("Bottom left", "yatra")
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Button label", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: label,
            placeholder: __("Chat on WhatsApp", "yatra"),
            onChange: (e) => setLabel(e.target.value)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __("Leave blank to show only the WhatsApp icon.", "yatra") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-3 cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            checked: showOnSidebar,
            onChange: (e) => setShowOnSidebar(e.target.checked),
            className: "mt-1"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __(
            "Also show a full-width CTA in the single-trip sidebar",
            "yatra"
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
            'Renders an "Ask about this trip on WhatsApp" button next to the booking form, separate from the floating button.',
            "yatra"
          ) })
        ] })
      ] }),
      previewUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1 text-xs font-medium text-gray-600 dark:text-gray-300", children: __("Preview URL the button will open", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "a",
          {
            href: previewUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "text-xs text-blue-600 break-all hover:underline dark:text-blue-400",
            children: previewUrl
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-700 dark:bg-blue-900/20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-blue-900 dark:text-blue-200", children: __(
          'Drop the button anywhere using the shortcode [yatra_whatsapp_button label="Chat with us"]. Supports label, message, and trip_name attributes.',
          "yatra"
        ) })
      ] }) })
    ] }),
    dirty && /* @__PURE__ */ jsxRuntimeExports.jsx(CardFooter, { className: "flex justify-end border-t border-gray-100 pt-4 dark:border-gray-700/50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: save, disabled: saving, children: saving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-1.5 h-4 w-4 animate-spin" }),
      __("Saving…", "yatra")
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-1.5 h-4 w-4" }),
      __("Save widget settings", "yatra")
    ] }) }) })
  ] }) });
};
const LogsList = () => {
  const [page, setPage] = reactExports.useState(1);
  const [statusFilter, setStatusFilter] = reactExports.useState("");
  const [phoneFilter, setPhoneFilter] = reactExports.useState("");
  const [phoneFilterApplied, setPhoneFilterApplied] = reactExports.useState("");
  const perPage = 20;
  React.useEffect(() => {
    const t = window.setTimeout(
      () => setPhoneFilterApplied(phoneFilter.trim()),
      350
    );
    return () => window.clearTimeout(t);
  }, [phoneFilter]);
  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, phoneFilterApplied]);
  const { data, isLoading } = useQuery({
    queryKey: [
      "whatsapp-messages",
      page,
      perPage,
      statusFilter,
      phoneFilterApplied
    ],
    queryFn: () => whatsappApi.listMessages({
      page,
      per_page: perPage,
      ...statusFilter ? { status: statusFilter } : {},
      ...phoneFilterApplied ? { phone: phoneFilterApplied } : {}
    }),
    refetchInterval: 15e3,
    placeholderData: (prev) => prev
    // smoother pagination — keep last page visible while loading
  });
  const rows = (data == null ? void 0 : data.data) ?? [];
  const totalItems = (data == null ? void 0 : data.total) ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-12 flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-6 w-6 animate-spin text-gray-400" }) }) });
  }
  const hasFilters = !!(statusFilter || phoneFilter);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5 text-blue-500" }),
        __("Message logs", "yatra")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __(
        "Every outbound send and inbound reply, filterable by status or phone. Updated every 15 seconds.",
        "yatra"
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          type: "text",
          value: phoneFilter,
          onChange: (e) => setPhoneFilter(e.target.value),
          placeholder: __("Search by phone…", "yatra"),
          "aria-label": __("Search by phone", "yatra"),
          className: "w-full"
        }
      ) }),
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
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "sent", children: __("Sent", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "delivered", children: __("Delivered", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "read", children: __("Read", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "failed", children: __("Failed", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "received", children: __("Received (inbound)", "yatra") })
          ]
        }
      ),
      hasFilters && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: () => {
            setStatusFilter("");
            setPhoneFilter("");
          },
          className: "w-full lg:w-auto",
          children: __("Reset", "yatra")
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-0", children: [
      rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-gray-500 dark:text-gray-400", children: totalItems === 0 && !statusFilter && !phoneFilterApplied ? __("No messages sent yet.", "yatra") : __("No messages match your filters.", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "bg-gray-50 dark:bg-gray-800/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-28", children: __("Direction", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-44", children: __("Phone", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: __("Body / Error", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-48", children: __("Template", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-28", children: __("Status", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-44 whitespace-nowrap", children: __("Sent", "yatra") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              className: row.direction === "inbound" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              children: row.direction
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-gray-900 dark:text-white whitespace-nowrap", children: row.phone }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-gray-700 dark:text-gray-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "max-w-md truncate",
              title: row.error_message || row.body || "",
              children: row.error_message || row.body || "—"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-gray-500 dark:text-gray-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "truncate block max-w-[12rem]",
              title: row.template_key || "",
              children: row.template_key || "—"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              className: row.status === "sent" || row.status === "delivered" || row.status === "read" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : row.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              children: row.status
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-gray-500 dark:text-gray-400 whitespace-nowrap", children: row.created_at ? new Date(row.created_at).toLocaleString() : "—" })
        ] }, row.id)) })
      ] }),
      rows.length > 0 && totalPages > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-gray-200 px-4 py-3 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Pagination,
        {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: perPage,
          onPageChange: setPage,
          itemName: __("messages", "yatra")
        }
      ) })
    ] }) })
  ] });
};
const OptInsList = () => {
  const [search, setSearch] = reactExports.useState("");
  const [filter, setFilter] = reactExports.useState("all");
  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-opt-ins"],
    queryFn: () => whatsappApi.listOptIns(),
    staleTime: 30 * 1e3
  });
  const rows = (data == null ? void 0 : data.data) ?? [];
  const filtered = reactExports.useMemo(() => {
    return rows.filter((r) => {
      if (filter === "in" && !r.opted_in) return false;
      if (filter === "out" && r.opted_in) return false;
      if (search.trim() !== "") {
        const needle = search.trim().toLowerCase();
        if (!r.phone.toLowerCase().includes(needle) && !r.source.toLowerCase().includes(needle))
          return false;
      }
      return true;
    });
  }, [rows, filter, search]);
  const inCount = reactExports.useMemo(() => rows.filter((r) => r.opted_in).length, [rows]);
  const outCount = rows.length - inCount;
  const exportCsv = () => {
    const escape = (v) => '"' + v.replace(/"/g, '""') + '"';
    const lines = [
      ["phone", "opted_in", "source", "updated_at"].map(escape).join(","),
      ...filtered.map(
        (r) => [r.phone, r.opted_in ? "yes" : "no", r.source, r.updated_at].map((v) => escape(String(v ?? ""))).join(",")
      )
    ];
    const csv = lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp-opt-ins-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-12 flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-6 w-6 animate-spin text-gray-400" }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-5 h-5 text-blue-500" }),
          __("Opt-in audit", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: __(
          "Every phone number that's opted into WhatsApp messaging, plus those that opted out via inbound STOP keyword. Export this list for GDPR / privacy requests.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: exportCsv,
          disabled: filtered.length === 0,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "mr-1.5 h-4 w-4" }),
            __("Export CSV", "yatra")
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          type: "text",
          value: search,
          onChange: (e) => setSearch(e.target.value),
          placeholder: __("Search by phone or source…", "yatra"),
          "aria-label": __("Search opt-ins", "yatra"),
          className: "w-full"
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: filter,
          onChange: (e) => setFilter(e.target.value),
          "aria-label": __("Filter opt-in status", "yatra"),
          className: "w-full lg:w-56 lg:flex-none",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "all", children: [
              __("All", "yatra"),
              " (",
              rows.length,
              ")"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "in", children: [
              __("Opted in", "yatra"),
              " (",
              inCount,
              ")"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "out", children: [
              __("Opted out", "yatra"),
              " (",
              outCount,
              ")"
            ] })
          ]
        }
      ),
      (search || filter !== "all") && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: () => {
            setSearch("");
            setFilter("all");
          },
          className: "w-full lg:w-auto",
          children: __("Reset", "yatra")
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-gray-500 dark:text-gray-400", children: rows.length === 0 ? __(
      "No opt-in records yet. Records appear here when customers tick the WhatsApp opt-in on a booking form, or reply STOP to opt out.",
      "yatra"
    ) : __("No records match your search.", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "bg-gray-50 dark:bg-gray-800/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-44", children: __("Phone", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-32", children: __("Status", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: __("Source", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-44 whitespace-nowrap", children: __("Updated", "yatra") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: filtered.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-gray-900 dark:text-white whitespace-nowrap", children: row.phone }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: row.opted_in ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "mr-1 h-3 w-3" }),
          __("Opted in", "yatra")
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "mr-1 h-3 w-3" }),
          __("Opted out", "yatra")
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-gray-500 dark:text-gray-400", children: row.source || "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-gray-500 dark:text-gray-400 whitespace-nowrap", children: row.updated_at })
      ] }, row.phone)) })
    ] }) }) })
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
  Whatsapp as default
};
//# sourceMappingURL=Whatsapp.js.map
