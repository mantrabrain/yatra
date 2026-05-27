import { t as useQueryClient, r as reactExports, u as useQuery, v as useMutation, j as jsxRuntimeExports, bQ as KeyRound, S as Sparkles, bA as Pencil, m as BarChart3, V as ExternalLink, aF as Info, bO as Plug, aD as CheckCircle2, b6 as XCircle, bt as EyeOff, aQ as Eye, aV as Save, D as Loader2, aN as Trash2, b8 as Lock, M as MessageCircle, R as RotateCcw, Q as AlertTriangle, ba as ChevronUp, x as ChevronDown, C as Crown } from "./react-vendor-CqkbFEvK.js";
import { u as useToast, _ as __ } from "./index-DRAt5dnR.js";
import { P as PageHeader, C as Card, d as CardContent, f as CardHeader, g as CardTitle, h as CardDescription, B as Button, w as Label, I as Input, S as Select, c as aiApi } from "../../admin/dist/js/app.js";
import { M as ModulePageSkeleton, d as ModuleSectionSkeleton, e as ModuleStatGridSkeleton } from "./module-skeleton-DUioukJc.js";
const SECTIONS = [
  {
    id: "keys",
    label: "API Keys",
    icon: KeyRound,
    description: "Bring your own OpenAI or Anthropic key. Keys are stored encrypted and never leave your server."
  },
  {
    id: "voice",
    label: "Brand Voice",
    icon: Sparkles,
    description: "Tone, examples, vocabulary preferences — applied to every generation so AI output sounds like your business."
  },
  {
    id: "prompts",
    label: "Prompts",
    icon: Pencil,
    description: "Inspect or edit every system + user prompt the assistant uses. Overrides fall back to defaults per-field."
  },
  {
    id: "usage",
    label: "Usage",
    icon: BarChart3,
    description: "Token usage by month, per provider, per feature."
  }
];
const DEFAULT_BRAND_VOICE = {
  tone: "",
  examples: [],
  forbidden: [],
  required: [],
  language: "en-US",
  default_provider: "openai",
  default_model: ""
};
const PlanBadge = ({ tier }) => {
  if (tier === "agency") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-3 w-3" }),
      __("Scale plan", "yatra")
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3" }),
    __("Growth plan", "yatra")
  ] });
};
const UpgradeCard = ({ meta }) => {
  const upgradeUrl = (meta == null ? void 0 : meta.upgrade_url) || "https://wpyatra.com/pricing?module=ai-assistant";
  const licensePageUrl = (meta == null ? void 0 : meta.license_page_url) || "admin.php?page=yatra&subpage=license";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "max-w-3xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("AI Assistant", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PlanBadge, { tier: "growth" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "mt-1", children: __(
          "AI Assistant unlocks on the Growth plan (or Scale). Bring your own OpenAI or Anthropic key — costs are paid directly to your provider, no per-call markup from the plugin.",
          "yatra"
        ) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: __(
        "Inline AI affordances on trip descriptions, SEO meta, included/excluded items, FAQs, and more — write less, finish more.",
        "yatra"
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: upgradeUrl, target: "_blank", rel: "noopener noreferrer", children: [
          (meta == null ? void 0 : meta.is_pro_active) ? __("Upgrade plan", "yatra") : __("Get Yatra Pro Growth", "yatra"),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "ml-2 h-4 w-4" })
        ] }) }),
        (meta == null ? void 0 : meta.is_pro_active) && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: licensePageUrl, children: __("Manage License", "yatra") }) })
      ] })
    ] })
  ] });
};
const AiAssistant = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = reactExports.useState("keys");
  const { data: meta, isLoading: metaLoading } = useQuery({
    queryKey: ["ai-meta"],
    queryFn: () => aiApi.meta()
  });
  const { data: bvResp } = useQuery({
    queryKey: ["ai-brand-voice"],
    queryFn: () => aiApi.getBrandVoice(),
    enabled: Boolean(meta == null ? void 0 : meta.is_ai_eligible)
  });
  const [bv, setBv] = reactExports.useState(DEFAULT_BRAND_VOICE);
  reactExports.useEffect(() => {
    if (bvResp == null ? void 0 : bvResp.data) {
      setBv({ ...DEFAULT_BRAND_VOICE, ...bvResp.data });
    }
  }, [bvResp]);
  const saveBvMutation = useMutation({
    mutationFn: (data) => aiApi.saveBrandVoice(data),
    onSuccess: () => {
      showToast(__("Brand voice saved.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["ai-brand-voice"] });
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const [keyDrafts, setKeyDrafts] = reactExports.useState({});
  const [showKey, setShowKey] = reactExports.useState({});
  const setKeyMutation = useMutation({
    mutationFn: ({ provider, key }) => aiApi.setKey(provider, key),
    onSuccess: (_resp, vars) => {
      showToast(__("API key saved.", "yatra"), "success");
      setKeyDrafts((d) => ({ ...d, [vars.provider]: "" }));
      queryClient.invalidateQueries({ queryKey: ["ai-meta"] });
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const deleteKeyMutation = useMutation({
    mutationFn: (provider) => aiApi.deleteKey(provider),
    onSuccess: () => {
      showToast(__("API key cleared.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["ai-meta"] });
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const testKeyMutation = useMutation({
    mutationFn: (provider) => aiApi.testKey(provider),
    onSuccess: (resp) => {
      showToast(
        resp.message || __("Connection successful.", "yatra"),
        "success"
      );
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const tripChatMutation = useMutation({
    mutationFn: (enabled) => aiApi.setTripChatEnabled(enabled),
    onSuccess: (resp) => {
      showToast(resp.message, "success");
      queryClient.invalidateQueries({ queryKey: ["ai-meta"] });
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const [chatLimitsDraft, setChatLimitsDraft] = reactExports.useState({
    per_trip_day: "",
    per_ip_hour: "",
    per_session: "",
    per_session_booking: "",
    max_message_chars: "",
    history_turns: ""
  });
  reactExports.useEffect(() => {
    if (meta == null ? void 0 : meta.trip_chat_limits) {
      const l = meta.trip_chat_limits;
      setChatLimitsDraft({
        per_trip_day: String(l.per_trip_day),
        per_ip_hour: String(l.per_ip_hour),
        per_session: String(l.per_session),
        per_session_booking: String(l.per_session_booking),
        max_message_chars: String(l.max_message_chars),
        history_turns: String(l.history_turns)
      });
    }
  }, [meta == null ? void 0 : meta.trip_chat_limits]);
  const tripChatLimitsMutation = useMutation({
    mutationFn: (patch) => aiApi.setTripChatLimits(patch),
    onSuccess: (resp) => {
      showToast(resp.message, "success");
      queryClient.invalidateQueries({ queryKey: ["ai-meta"] });
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const { data: usageResp } = useQuery({
    queryKey: ["ai-usage"],
    queryFn: () => aiApi.getUsage(),
    enabled: Boolean(meta == null ? void 0 : meta.is_ai_eligible) && activeSection === "usage"
  });
  const { data: promptsResp, isLoading: promptsLoading } = useQuery({
    queryKey: ["ai-prompts"],
    queryFn: () => aiApi.listPrompts(),
    enabled: Boolean(meta == null ? void 0 : meta.is_ai_eligible) && activeSection === "prompts"
  });
  const [expandedPrompt, setExpandedPrompt] = reactExports.useState(null);
  const [promptDrafts, setPromptDrafts] = reactExports.useState({});
  reactExports.useEffect(() => {
    if (!(promptsResp == null ? void 0 : promptsResp.data)) return;
    const next = {};
    for (const row of promptsResp.data) {
      const effSystem = row.override.system && row.override.system !== "" ? row.override.system : row.default.system;
      const effUser = row.override.user && row.override.user !== "" ? row.override.user : row.default.user;
      const effMaxTokens = row.override.max_tokens != null ? String(row.override.max_tokens) : String(row.default.max_tokens);
      const effTemperature = row.override.temperature != null ? String(row.override.temperature) : String(row.default.temperature);
      next[row.task] = {
        system: effSystem,
        user: effUser,
        max_tokens: effMaxTokens,
        temperature: effTemperature
      };
    }
    setPromptDrafts(next);
  }, [promptsResp]);
  const savePromptMutation = useMutation({
    mutationFn: ({
      task,
      override
    }) => aiApi.savePromptOverride(task, override),
    onSuccess: () => {
      showToast(__("Prompt saved.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["ai-prompts"] });
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const resetPromptMutation = useMutation({
    mutationFn: (task) => aiApi.resetPrompt(task),
    onSuccess: () => {
      showToast(__("Prompt reset to default.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["ai-prompts"] });
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  const resetAllPromptsMutation = useMutation({
    mutationFn: () => aiApi.resetAllPrompts(),
    onSuccess: () => {
      showToast(__("All prompts reset to defaults.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["ai-prompts"] });
    },
    onError: (e) => showToast(extractError(e), "error")
  });
  if (metaLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ModulePageSkeleton, { variant: "tabs" });
  }
  if (!meta || !meta.is_ai_eligible) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        PageHeader,
        {
          description: __(
            "Inline AI generation for trip content, SEO, and more.",
            "yatra"
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(UpgradeCard, { meta })
    ] });
  }
  const moduleEnabled = meta.is_module_enabled;
  const updateBv = (key, value) => setBv((prev) => ({ ...prev, [key]: value }));
  const updateBvList = (key, raw) => {
    const list = raw.split(/\r?\n/).map((s) => s.trim()).filter((s) => s !== "");
    setBv((prev) => ({ ...prev, [key]: list }));
  };
  const submitBv = (e) => {
    e.preventDefault();
    saveBvMutation.mutate(bv);
  };
  const providerDocs = {
    openai: {
      whyDescription: __(
        "Authenticates every request the plugin sends to OpenAI on your behalf. OpenAI bills your account directly per request — the plugin adds no markup. Without a key, the AI sparkle affordances on Trip / SEO / Email editors stay disabled.",
        "yatra"
      ),
      whereToFind: __(
        "Sign in at platform.openai.com → API keys → Create new secret key. Copy the value (starts with sk-…) immediately — OpenAI shows it only once.",
        "yatra"
      ),
      docsUrl: "https://platform.openai.com/api-keys",
      pricingUrl: "https://openai.com/api/pricing/"
    },
    anthropic: {
      whyDescription: __(
        "Authenticates requests to Anthropic's Claude API. Anthropic bills your account directly per request — no plugin markup. Used for the same in-editor sparkle features OpenAI handles; pick whichever provider your team prefers.",
        "yatra"
      ),
      whereToFind: __(
        "Sign in at console.anthropic.com → Settings → API Keys → Create Key. Copy the value (starts with sk-ant-…) immediately — Anthropic shows it only once.",
        "yatra"
      ),
      docsUrl: "https://console.anthropic.com/settings/keys",
      pricingUrl: "https://www.anthropic.com/pricing#anthropic-api"
    }
  };
  const renderKeys = () => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("API Keys", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
        "Keys are encrypted at rest with libsodium and never sent to the browser. Generation requests are made from your server directly to your chosen provider — no third-party proxy is involved.",
        "yatra"
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-blue-200 bg-blue-50/40 p-3 text-sm dark:border-blue-700 dark:bg-blue-900/20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-blue-900 dark:text-blue-200", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: __("How AI Assistant billing works", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs", children: __(
            "You bring your own OpenAI or Anthropic key. Each AI generation (trip description, FAQ, email body, etc.) is a single API call your provider charges you for — usually fractions of a cent. The plugin never proxies traffic and adds no markup. You only need one key to start; you can save both and pick a default per task under the Defaults tab.",
            "yatra"
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] opacity-80", children: __(
            'Click "Where to find this" next to a provider for the exact steps in their dashboard.',
            "yatra"
          ) })
        ] })
      ] }) }),
      meta.providers.map((p) => {
        const status = meta.keys[p.id] ?? { configured: false, hint: "" };
        const draft = keyDrafts[p.id] ?? "";
        const visible = Boolean(showKey[p.id]);
        const docs = providerDocs[p.id];
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-md border border-gray-200 p-3 dark:border-gray-700",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plug, { className: "h-4 w-4 text-gray-500" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: p.label }),
                  status.configured ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "h-3 w-3" }),
                    __("Configured", "yatra")
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { className: "h-3 w-3" }),
                    __("Not configured", "yatra")
                  ] })
                ] }),
                status.configured && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500", children: status.hint })
              ] }),
              docs && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 space-y-2 rounded-md border border-gray-100 bg-gray-50/60 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: __("Why it's needed:", "yatra") }),
                    " ",
                    docs.whyDescription
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: __("Where to find it:", "yatra") }),
                    " ",
                    docs.whereToFind
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 pt-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "a",
                    {
                      href: docs.docsUrl,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-0.5 text-[11px] text-gray-700 hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800",
                      children: [
                        __("Open API keys page", "yatra"),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "a",
                    {
                      href: docs.pricingUrl,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-0.5 text-[11px] text-gray-700 hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800",
                      children: [
                        __("Pricing", "yatra"),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-[240px]", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `ai-key-${p.id}`, children: __("API key", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: `ai-key-${p.id}`,
                        type: visible ? "text" : "password",
                        value: draft,
                        placeholder: status.configured ? __("Enter a new key to replace…", "yatra") : __("sk-… or sk-ant-…", "yatra"),
                        autoComplete: "off",
                        onChange: (e) => setKeyDrafts((d) => ({
                          ...d,
                          [p.id]: e.target.value
                        }))
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setShowKey((s) => ({ ...s, [p.id]: !s[p.id] })),
                        className: "absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600",
                        "aria-label": visible ? __("Hide key", "yatra") : __("Show key", "yatra"),
                        children: visible ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" })
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    onClick: () => setKeyMutation.mutate({ provider: p.id, key: draft }),
                    disabled: draft.trim() === "" || setKeyMutation.isPending,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
                      __("Save", "yatra")
                    ]
                  }
                ),
                status.configured && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      onClick: () => testKeyMutation.mutate(p.id),
                      disabled: testKeyMutation.isPending,
                      children: [
                        testKeyMutation.isPending && testKeyMutation.variables === p.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null,
                        __("Test connection", "yatra")
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "ghost",
                      onClick: () => deleteKeyMutation.mutate(p.id),
                      disabled: deleteKeyMutation.isPending,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-2 h-4 w-4" }),
                        __("Clear", "yatra")
                      ]
                    }
                  )
                ] })
              ] })
            ]
          },
          p.id
        );
      }),
      !moduleEnabled && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/40 p-3 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "mt-0.5 h-4 w-4 shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          __(
            "AI Assistant module is not enabled yet. Once a key is saved, enable the module from the Modules page so sparkle affordances appear in the editors.",
            "yatra"
          ),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "a",
            {
              className: "font-medium underline",
              href: "admin.php?page=yatra&subpage=modules",
              children: __("Go to Modules →", "yatra")
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-gray-200 p-3 dark:border-gray-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-300" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("Public Chat Widget", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs text-gray-500 dark:text-gray-400", children: __(
                `Adds a "Chat with AI about this trip" button below the Send Enquiry button on every single-trip page. Visitors can ask trip-specific questions. Rate-limited per IP/session/trip/day so a hostile visitor can't burn your provider budget.`,
                "yatra"
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              role: "switch",
              "aria-checked": Boolean(meta.trip_chat_enabled),
              onClick: () => tripChatMutation.mutate(!meta.trip_chat_enabled),
              disabled: tripChatMutation.isPending || !moduleEnabled,
              className: `relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${meta.trip_chat_enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"} ${tripChatMutation.isPending || !moduleEnabled ? "opacity-50 cursor-not-allowed" : ""}`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: `inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${meta.trip_chat_enabled ? "translate-x-5" : "translate-x-0.5"} translate-y-0.5`
                }
              )
            }
          )
        ] }),
        !moduleEnabled && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-[11px] text-amber-600 dark:text-amber-300", children: __(
          "Enable the AI Assistant module first, then turn this on.",
          "yatra"
        ) }),
        meta.trip_chat_enabled && meta.trip_chat_limits_schema && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-3 border-t border-gray-200 pt-3 dark:border-gray-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-gray-700 dark:text-gray-200", children: __("Chat rate limits", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-[11px] text-gray-500 dark:text-gray-400", children: __(
              "Caps on the public chat widget to protect your AI provider budget. Higher numbers = more freedom for visitors and more potential cost. Each field is clamped to a safe range on save.",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              LimitField,
              {
                label: __("Per trip · per day", "yatra"),
                hint: __("Max chat messages per trip per day.", "yatra"),
                field: "per_trip_day",
                draft: chatLimitsDraft,
                setDraft: setChatLimitsDraft,
                schema: meta.trip_chat_limits_schema
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              LimitField,
              {
                label: __("Per IP · per hour", "yatra"),
                hint: __(
                  "Max messages from one visitor IP per hour.",
                  "yatra"
                ),
                field: "per_ip_hour",
                draft: chatLimitsDraft,
                setDraft: setChatLimitsDraft,
                schema: meta.trip_chat_limits_schema
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              LimitField,
              {
                label: __("Per session (info)", "yatra"),
                hint: __(
                  "Cap when visitor is just asking questions.",
                  "yatra"
                ),
                field: "per_session",
                draft: chatLimitsDraft,
                setDraft: setChatLimitsDraft,
                schema: meta.trip_chat_limits_schema
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              LimitField,
              {
                label: __("Per session (booking)", "yatra"),
                hint: __(
                  "Higher cap once visitor signals booking intent.",
                  "yatra"
                ),
                field: "per_session_booking",
                draft: chatLimitsDraft,
                setDraft: setChatLimitsDraft,
                schema: meta.trip_chat_limits_schema
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              LimitField,
              {
                label: __("Max message length", "yatra"),
                hint: __(
                  "Max characters in a single visitor message.",
                  "yatra"
                ),
                field: "max_message_chars",
                draft: chatLimitsDraft,
                setDraft: setChatLimitsDraft,
                schema: meta.trip_chat_limits_schema
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              LimitField,
              {
                label: __("History turns sent", "yatra"),
                hint: __(
                  "How many recent turns the AI sees for context.",
                  "yatra"
                ),
                field: "history_turns",
                draft: chatLimitsDraft,
                setDraft: setChatLimitsDraft,
                schema: meta.trip_chat_limits_schema
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => {
                  if (meta.trip_chat_limits) {
                    const l = meta.trip_chat_limits;
                    setChatLimitsDraft({
                      per_trip_day: String(l.per_trip_day),
                      per_ip_hour: String(l.per_ip_hour),
                      per_session: String(l.per_session),
                      per_session_booking: String(l.per_session_booking),
                      max_message_chars: String(l.max_message_chars),
                      history_turns: String(l.history_turns)
                    });
                  }
                },
                disabled: tripChatLimitsMutation.isPending,
                children: __("Revert", "yatra")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                onClick: () => {
                  const patch = {};
                  Object.keys(chatLimitsDraft).forEach((k) => {
                    const v = parseInt(chatLimitsDraft[k], 10);
                    if (Number.isFinite(v)) patch[k] = v;
                  });
                  tripChatLimitsMutation.mutate(patch);
                },
                disabled: tripChatLimitsMutation.isPending,
                children: tripChatLimitsMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                  __("Saving…", "yatra")
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
                  __("Save limits", "yatra")
                ] })
              }
            )
          ] })
        ] })
      ] })
    ] })
  ] });
  const renderVoice = () => {
    var _a;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Brand voice", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "Define your voice once — it flows into every generation across trips, SEO, and emails. The more specific, the more your AI output sounds like you.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 rounded-md border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-900 dark:border-blue-500/40 dark:bg-blue-900/20 dark:text-blue-200", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1 font-semibold", children: __("How brand voice is used", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "leading-relaxed", children: __(
            "Everything you fill in here is automatically prepended to every prompt the plugin sends to your AI provider. Trip descriptions, enquiry replies, email templates, the public chat widget, and the back-office wizards all start with these instructions — so your output sounds like one consistent brand, not a different voice per feature.",
            "yatra"
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submitBv, className: "space-y-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "bv-tone", children: __("Tone description", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1.5 text-xs text-gray-500 dark:text-gray-400", children: __(
              "The single most important field. 2-3 sentences describing how you'd describe your brand to a new copywriter. Plain English — not marketing jargon. AI reads this every generation and aims for this tone.",
              "yatra"
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                id: "bv-tone",
                rows: 3,
                className: "mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800",
                value: bv.tone,
                placeholder: __(
                  "e.g. Warm, adventurous, never corporate. Speak directly to the traveler. We're a small team, not a corporation.",
                  "yatra"
                ),
                onChange: (e) => updateBv("tone", e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "bv-examples", children: __("Style examples (one paragraph per line)", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1.5 text-xs text-gray-500 dark:text-gray-400", children: __(
              "Paste 3-5 paragraphs from your existing trip pages, emails, or marketing copy that sound right. AI uses these as few-shot examples — concrete writing samples beat abstract tone descriptions for getting the voice exactly right. One paragraph per line.",
              "yatra"
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                id: "bv-examples",
                rows: 6,
                className: "mt-1 w-full rounded-md border border-gray-300 bg-white p-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-800",
                value: bv.examples.join("\n"),
                placeholder: __(
                  "Paste 3-5 paragraphs from your existing trips/emails that sound like you. AI uses these as few-shot examples.",
                  "yatra"
                ),
                onChange: (e) => updateBvList("examples", e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "bv-forbidden", children: __("Forbidden words / phrases", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1.5 text-xs text-gray-500 dark:text-gray-400", children: __(
                'Words AI must never use. Common entries: "unforgettable", "once in a lifetime", "breathtaking", "world-class", or any competitor name. One per line — AI treats these as a hard blocklist.',
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  id: "bv-forbidden",
                  rows: 4,
                  className: "mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-xs dark:border-gray-600 dark:bg-gray-800",
                  value: bv.forbidden.join("\n"),
                  placeholder: __(
                    "One per line — words / phrases to avoid.",
                    "yatra"
                  ),
                  onChange: (e) => updateBvList("forbidden", e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "bv-required", children: __("Required mentions", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1.5 text-xs text-gray-500 dark:text-gray-400", children: __(
                'Things AI should weave in WHEN RELEVANT — never forced. Examples: "local guides", "small group sizes", "sustainable practices", "our 24/7 support". One per line. AI mentions these only when they fit the context naturally.',
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  id: "bv-required",
                  rows: 4,
                  className: "mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-xs dark:border-gray-600 dark:bg-gray-800",
                  value: bv.required.join("\n"),
                  placeholder: __(
                    "One per line — things to weave in when relevant.",
                    "yatra"
                  ),
                  onChange: (e) => updateBvList("required", e.target.value)
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "bv-lang", children: __("Default language", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1.5 text-xs text-gray-500 dark:text-gray-400", children: __(
                "BCP-47 code. AI writes in this language unless overridden by per-prompt context (e.g. enquiry replies match the customer's preferred language when known).",
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "bv-lang",
                  value: bv.language,
                  placeholder: "en-US",
                  onChange: (e) => updateBv("language", e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "bv-provider", children: __("Default provider", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1.5 text-xs text-gray-500 dark:text-gray-400", children: __(
                "Which AI service handles each generation by default. Per-feature usage runs through the provider whose API key is configured under API Keys above.",
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Select,
                {
                  id: "bv-provider",
                  value: bv.default_provider,
                  onChange: (e) => updateBv("default_provider", e.target.value),
                  children: meta.providers.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p.id, children: p.label }, p.id))
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "bv-model", children: __("Default model", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1.5 text-xs text-gray-500 dark:text-gray-400", children: __(
                "Specific model within the provider. Smaller / faster models (gpt-4o-mini, Claude Haiku) are cheaper and ~good enough for most generations. Larger models are slower + costlier but produce richer output for trip descriptions.",
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  id: "bv-model",
                  value: bv.default_model,
                  onChange: (e) => updateBv("default_model", e.target.value),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __("(Provider default)", "yatra") }),
                    (((_a = meta.providers.find((p) => p.id === bv.default_provider)) == null ? void 0 : _a.models) ?? []).map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: m.id, children: m.label }, m.id))
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3 pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: saveBvMutation.isPending, children: saveBvMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
            __("Saving…", "yatra")
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
            __("Save brand voice", "yatra")
          ] }) }) })
        ] })
      ] })
    ] });
  };
  const renderUsage = () => {
    const usage = usageResp == null ? void 0 : usageResp.data;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Usage", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "Rolling 13-month token totals, per provider, per task. Costs are paid directly to your AI provider — no markup is added.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: !usage ? /* @__PURE__ */ jsxRuntimeExports.jsx(ModuleStatGridSkeleton, { tiles: 3 }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 grid grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Stat,
            {
              label: __("Total calls", "yatra"),
              value: usage.totals.calls.toLocaleString()
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Stat,
            {
              label: __("Prompt tokens", "yatra"),
              value: usage.totals.prompt.toLocaleString()
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Stat,
            {
              label: __("Completion tokens", "yatra"),
              value: usage.totals.completion.toLocaleString()
            }
          )
        ] }),
        Object.keys(usage.months).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: __("No AI usage yet.", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: Object.entries(usage.months).map(([month, providers]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-md border border-gray-200 p-3 dark:border-gray-700",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 text-sm font-medium text-gray-900 dark:text-white", children: [
                month,
                month === usage.current_month && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", children: __("Current", "yatra") })
              ] }),
              Object.entries(providers).map(([prov, bucket]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "mb-1 grid grid-cols-4 gap-2 text-xs",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-700 dark:text-gray-200", children: prov }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      bucket.calls,
                      " ",
                      __("calls", "yatra")
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      bucket.prompt.toLocaleString(),
                      " ",
                      __("in", "yatra")
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      bucket.completion.toLocaleString(),
                      " ",
                      __("out", "yatra")
                    ] })
                  ]
                },
                prov
              ))
            ]
          },
          month
        )) })
      ] }) })
    ] });
  };
  const renderPrompts = () => {
    var _a;
    const rows = (promptsResp == null ? void 0 : promptsResp.data) ?? [];
    const grouped = {};
    for (const r of rows) {
      (grouped[_a = r.category] || (grouped[_a] = [])).push(r);
    }
    const groupOrder = Object.keys(grouped);
    const submitPrompt = (row) => {
      const draft = promptDrafts[row.task];
      if (!draft) return;
      const override = {};
      const sysTrim = draft.system.trim();
      override.system = sysTrim === "" || sysTrim === row.default.system.trim() ? "" : draft.system;
      const usrTrim = draft.user.trim();
      override.user = usrTrim === "" || usrTrim === row.default.user.trim() ? "" : draft.user;
      const mt = parseInt(draft.max_tokens, 10);
      override.max_tokens = Number.isFinite(mt) && mt !== row.default.max_tokens ? mt : null;
      const tp = parseFloat(draft.temperature);
      override.temperature = Number.isFinite(tp) && tp !== row.default.temperature ? tp : null;
      savePromptMutation.mutate({ task: row.task, override });
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Prompts", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
            "Every system + user prompt the assistant uses. Edit any field — blank fields fall back to the shipped default per-field. Brand voice is auto-prepended to system prompts, so don't repeat it here.",
            "yatra"
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => {
              if (window.confirm(
                __(
                  "Reset every prompt to its shipped default? This wipes all your overrides.",
                  "yatra"
                )
              )) {
                resetAllPromptsMutation.mutate();
              }
            },
            disabled: resetAllPromptsMutation.isPending,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "mr-2 h-4 w-4" }),
              __("Reset all", "yatra")
            ]
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: promptsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ModuleSectionSkeleton, { lines: 5 }) : rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: __("No prompts available.", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50/40 p-3 text-xs text-blue-800 dark:border-blue-500/40 dark:bg-blue-900/20 dark:text-blue-200", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "mt-0.5 h-4 w-4 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: __(
            "Use {{placeholders}} to inject runtime context (e.g. {{name}}, {{extra_context}}). Removing a placeholder means the assistant won't see that field — edit with care.",
            "yatra"
          ) })
        ] }),
        groupOrder.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400", children: cat }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: grouped[cat].map((row) => {
            var _a2;
            const isOpen = expandedPrompt === row.task;
            const draft = promptDrafts[row.task] ?? {
              system: row.default.system,
              user: row.default.user,
              max_tokens: String(row.default.max_tokens),
              temperature: String(row.default.temperature)
            };
            const saving = savePromptMutation.isPending && ((_a2 = savePromptMutation.variables) == null ? void 0 : _a2.task) === row.task;
            const resetting = resetPromptMutation.isPending && resetPromptMutation.variables === row.task;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "rounded-md border border-gray-200 dark:border-gray-700",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => setExpandedPrompt(isOpen ? null : row.task),
                      className: "flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/60",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: row.label }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-300", children: row.task }),
                            row.has_override && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", children: __("Customized", "yatra") })
                          ] }),
                          row.description && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400", children: row.description })
                        ] }),
                        isOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "mt-1 h-4 w-4 shrink-0 text-gray-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "mt-1 h-4 w-4 shrink-0 text-gray-400" })
                      ]
                    }
                  ),
                  isOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 border-t border-gray-200 p-3 dark:border-gray-700", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `pr-sys-${row.task}`, children: __("System prompt", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "textarea",
                        {
                          id: `pr-sys-${row.task}`,
                          rows: 5,
                          className: "mt-1 w-full rounded-md border border-gray-300 bg-white p-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-800",
                          value: draft.system,
                          onChange: (e) => setPromptDrafts((d) => ({
                            ...d,
                            [row.task]: {
                              ...draft,
                              system: e.target.value
                            }
                          }))
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `pr-usr-${row.task}`, children: __("User prompt", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "textarea",
                        {
                          id: `pr-usr-${row.task}`,
                          rows: 10,
                          className: "mt-1 w-full rounded-md border border-gray-300 bg-white p-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-800",
                          value: draft.user,
                          onChange: (e) => setPromptDrafts((d) => ({
                            ...d,
                            [row.task]: {
                              ...draft,
                              user: e.target.value
                            }
                          }))
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: `pr-mt-${row.task}`, children: [
                          __("Max tokens", "yatra"),
                          " ",
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-gray-400", children: [
                            "(",
                            __("default", "yatra"),
                            ":",
                            " ",
                            row.default.max_tokens,
                            ")"
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            id: `pr-mt-${row.task}`,
                            type: "number",
                            min: 16,
                            max: 8e3,
                            value: draft.max_tokens,
                            onChange: (e) => setPromptDrafts((d) => ({
                              ...d,
                              [row.task]: {
                                ...draft,
                                max_tokens: e.target.value
                              }
                            }))
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: `pr-tp-${row.task}`, children: [
                          __("Temperature", "yatra"),
                          " ",
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-gray-400", children: [
                            "(",
                            __("default", "yatra"),
                            ":",
                            " ",
                            row.default.temperature,
                            ")"
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            id: `pr-tp-${row.task}`,
                            type: "number",
                            min: 0,
                            max: 2,
                            step: 0.1,
                            value: draft.temperature,
                            onChange: (e) => setPromptDrafts((d) => ({
                              ...d,
                              [row.task]: {
                                ...draft,
                                temperature: e.target.value
                              }
                            }))
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "rounded-md border border-dashed border-gray-200 px-3 py-2 text-xs dark:border-gray-700", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400", children: __("Show shipped defaults", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400", children: __("Default system", "yatra") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "max-h-40 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-[11px] text-gray-700 dark:bg-gray-900 dark:text-gray-200", children: row.default.system })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400", children: __("Default user", "yatra") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "max-h-60 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-[11px] text-gray-700 dark:bg-gray-900 dark:text-gray-200", children: row.default.user })
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 pt-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "button",
                          onClick: () => submitPrompt(row),
                          disabled: saving,
                          children: saving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                            __("Saving…", "yatra")
                          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
                            __("Save", "yatra")
                          ] })
                        }
                      ),
                      row.has_override && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          type: "button",
                          variant: "ghost",
                          onClick: () => resetPromptMutation.mutate(row.task),
                          disabled: resetting,
                          children: [
                            resetting ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "mr-2 h-4 w-4" }),
                            __("Reset to default", "yatra")
                          ]
                        }
                      )
                    ] })
                  ] })
                ]
              },
              row.task
            );
          }) })
        ] }, cat))
      ] }) })
    ] });
  };
  const currentSection = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        description: __(
          "Inline AI generation grounded in your trip data. Bring your own key.",
          "yatra"
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-[240px_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "lg:sticky lg:top-4 lg:self-start", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex flex-col gap-1", children: SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = s.id === activeSection;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => setActiveSection(s.id),
              className: `flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${active ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 truncate", children: s.label })
              ]
            },
            s.id
          );
        }) }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 px-2 text-xs text-gray-500 dark:text-gray-400", children: currentSection.description })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        activeSection === "keys" && renderKeys(),
        activeSection === "voice" && renderVoice(),
        activeSection === "prompts" && renderPrompts(),
        activeSection === "usage" && renderUsage()
      ] })
    ] })
  ] });
};
const LimitField = ({ label, hint, field, draft, setDraft, schema }) => {
  const range = schema[field];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `chat-limit-${field}`, children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        id: `chat-limit-${field}`,
        type: "number",
        min: range == null ? void 0 : range.min,
        max: range == null ? void 0 : range.max,
        value: draft[field],
        onChange: (e) => setDraft((prev) => ({ ...prev, [field]: e.target.value }))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 text-[10px] text-gray-500 dark:text-gray-400", children: [
      hint,
      range && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-400", children: [
          "(",
          range.min,
          "–",
          range.max,
          ")"
        ] })
      ] })
    ] })
  ] });
};
const Stat = ({ label, value }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-gray-200 p-3 dark:border-gray-700", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400", children: label }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-lg font-semibold text-gray-900 dark:text-white", children: value })
] });
function extractError(e) {
  var _a;
  const data = ((_a = e == null ? void 0 : e.response) == null ? void 0 : _a.data) ?? (e == null ? void 0 : e.data) ?? null;
  if (data && typeof data === "object" && typeof data.message === "string") {
    return data.message;
  }
  return (e == null ? void 0 : e.message) || "AI request failed.";
}
export {
  AiAssistant as default
};
//# sourceMappingURL=AiAssistant-2YNozU84.js.map
