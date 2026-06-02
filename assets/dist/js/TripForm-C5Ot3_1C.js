import { r as reactExports, j as jsxRuntimeExports, D as Loader2, S as Sparkles, aB as Wand2, bB as Pencil, bg as Scissors, bC as Maximize2, bf as Heart, ax as X, aA as Check, Q as AlertTriangle, az as AlertCircle, aQ as Eye, aE as HelpCircle, J as RefreshCw, ar as Clock, aD as CheckCircle2, u as useQuery, e as Tag, aw as Plus, ba as ChevronUp, x as ChevronDown, p as Calendar, V as ExternalLink, a5 as React, bD as CheckSquare, I as User, q as MapPin, n as Star, t as useQueryClient, k as FileText, as as DollarSign, bE as BookOpen, aS as Image, b4 as Download, aO as Search, l as Settings, v as useMutation, aG as Copy, bF as Lightbulb, b0 as Database, bG as History, aV as Save, bh as Send, aC as ChevronLeft, y as ChevronRight, bH as Box, m as BarChart3, aN as Trash2, b9 as GripVertical, aR as Upload, U as Users, bI as Home, bJ as Car } from "./react-vendor-zODANjVp.js";
import { i as isAiEligible, a as isAiModuleEnabled, b as isAiReady, c as aiApi, M as Modal, B as Button, p as parseItineraryText, C as Card, d as CardContent, e as Badge, I as Input, T as TimePicker, S as Select, f as CardHeader, g as CardTitle, h as CardDescription, u as usePermissions, j as getErrorContext, A as Alert, H as HelpText, k as ConfirmationDialog, l as buildYatraSinglePublicUrls, m as isWordPressPlainPermalink, D as DatePicker, n as IconPicker, L as LocationPicker, R as RichTextEditor, o as prepareWordPressMediaFrameOpen, q as fetchSettings } from "../../admin/dist/js/app.js";
import { _ as __$1, a as apiClient, b as apiService, u as useToast, w as wpService, g as getCurrencySymbol, s as sprintf } from "./index-CG-QHfTA.js";
import { d as detectClarification, B as BuildItineraryModal } from "./BuildItineraryModal-gSCSj4w_.js";
import { P as ProBadge, M as MultiSelect, a as ProFeature } from "./ProFeature-DIvM5TT9.js";
const IMPROVE_OPTIONS = [
  { task: "improve-tighten", label: "Tighten", icon: Scissors },
  { task: "improve-lengthen", label: "Lengthen", icon: Maximize2 },
  { task: "improve-tone-warmer", label: "Warmer tone", icon: Heart },
  { task: "improve-tone-formal", label: "More formal", icon: Pencil },
  { task: "improve-tone-shorter", label: "Make shorter", icon: Scissors }
];
const AiFieldAffordance = ({
  task,
  value,
  onAccept,
  buildContext,
  label,
  allowImprove = true,
  disabled = false,
  className = ""
}) => {
  const [open, setOpen] = reactExports.useState(false);
  const [showImprove, setShowImprove] = reactExports.useState(false);
  const [isRunning, setIsRunning] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [preview, setPreview] = reactExports.useState(null);
  const wrapperRef = reactExports.useRef(null);
  const gateBlocks = disabled || !isAiEligible() || !isAiModuleEnabled();
  const ready = isAiReady();
  reactExports.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setShowImprove(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const runGenerate = reactExports.useCallback(async () => {
    setOpen(false);
    setShowImprove(false);
    setError(null);
    setIsRunning(true);
    try {
      const ctx = buildContext();
      const res = await aiApi.generate(task, ctx);
      setPreview({ text: res.text, source: "generate", task });
    } catch (e) {
      setError(extractError$1(e));
    } finally {
      setIsRunning(false);
    }
  }, [task, buildContext]);
  const runImprove = reactExports.useCallback(
    async (improveTask) => {
      setOpen(false);
      setShowImprove(false);
      setError(null);
      setIsRunning(true);
      try {
        const res = await aiApi.improve(improveTask, value);
        setPreview({ text: res.text, source: "improve", task: improveTask });
      } catch (e) {
        setError(extractError$1(e));
      } finally {
        setIsRunning(false);
      }
    },
    [value]
  );
  const accept = () => {
    if (!preview) return;
    onAccept(preview.text);
    setPreview(null);
  };
  const reject = () => setPreview(null);
  const tryAgain = () => {
    if (!preview) return;
    if (preview.source === "improve") {
      runImprove(preview.task);
    } else {
      runGenerate();
    }
  };
  const hasValue = value.trim() !== "";
  if (gateBlocks) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: wrapperRef, className: `relative inline-block ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: () => {
          if (!ready) {
            setError(
              __$1(
                "Add an API key in Yatra → AI Assistant before using this.",
                "yatra"
              )
            );
            return;
          }
          setOpen((v) => !v);
          setShowImprove(false);
          setError(null);
        },
        disabled: isRunning,
        title: __$1("AI Assistant", "yatra"),
        className: `inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 ${isRunning ? "animate-pulse" : ""}`,
        "aria-label": __$1("AI Assistant", "yatra"),
        children: isRunning ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4" })
      }
    ),
    open && !preview && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "absolute right-0 z-30 mt-1 w-56 rounded-md border border-gray-200 bg-white p-1 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-800",
        role: "menu",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: runGenerate,
              className: "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-blue-900/30",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Wand2, { className: "h-4 w-4 text-blue-500" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-1", children: [
                  hasValue ? __$1("Regenerate", "yatra") : __$1("Generate", "yatra"),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-400", children: [
                    "— ",
                    label
                  ] })
                ] })
              ]
            }
          ),
          allowImprove && hasValue && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setShowImprove((v) => !v),
                className: "mt-0.5 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-blue-900/30",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4 text-blue-500" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1", children: __$1("Improve this", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-400", children: showImprove ? "▴" : "▾" })
                ]
              }
            ),
            showImprove && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-2 mt-0.5 border-l border-gray-100 pl-2 dark:border-gray-700", children: IMPROVE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => runImprove(opt.task),
                  className: "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-blue-900/30",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3.5 w-3.5 text-blue-400" }),
                    __$1(opt.label, "yatra")
                  ]
                },
                opt.task
              );
            }) })
          ] })
        ]
      }
    ),
    preview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 z-30 mt-1 w-[420px] max-w-[90vw] rounded-md border border-blue-200 bg-white p-3 text-sm shadow-xl dark:border-blue-500/40 dark:bg-gray-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5" }),
        preview.source === "improve" ? __$1("AI improved your text", "yatra") : __$1("AI generated this draft", "yatra")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-72 overflow-y-auto whitespace-pre-wrap rounded border border-gray-100 bg-gray-50 p-2 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200", children: preview.text || /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-400", children: __$1("(empty response)", "yatra") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: tryAgain,
            className: "rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
            children: __$1("Try again", "yatra")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: reject,
            className: "inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }),
              __$1("Discard", "yatra")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: accept,
            disabled: !preview.text,
            className: "inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }),
              __$1("Accept", "yatra")
            ]
          }
        )
      ] })
    ] }),
    error && !preview && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "absolute right-0 z-30 mt-1 w-72 rounded-md border border-red-200 bg-white p-2 text-xs text-red-700 shadow-lg dark:border-red-500/40 dark:bg-gray-800 dark:text-red-300",
        role: "alert",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "mt-0.5 h-3.5 w-3.5 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: error }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setError(null),
              className: "text-red-400 hover:text-red-600",
              "aria-label": __$1("Dismiss", "yatra"),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" })
            }
          )
        ] })
      }
    )
  ] });
};
function extractError$1(e) {
  var _a;
  if (!e) return "AI request failed.";
  const data = ((_a = e == null ? void 0 : e.response) == null ? void 0 : _a.data) ?? (e == null ? void 0 : e.data) ?? null;
  if (data && typeof data === "object") {
    if (typeof data.message === "string") return data.message;
    if (Array.isArray(data.errors)) {
      return data.errors.map((x) => (x == null ? void 0 : x.message) ?? String(x)).join("; ");
    }
  }
  if (typeof (e == null ? void 0 : e.message) === "string") return e.message;
  return String(e);
}
function plainTextToHtml(text) {
  if (!text) return "";
  const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const paragraphs = text.replace(/\r\n?/g, "\n").split(/\n{2,}/).map((p) => p.trim()).filter((p) => p !== "");
  return paragraphs.map((p) => `<p>${escape(p).replace(/\n/g, "<br>")}</p>`).join("");
}
function decodeAmenityList(text) {
  return text.split(/\r?\n/).map(
    (line) => line.replace(/^[\s\-\*••]+/, "").trim()
  ).filter((line) => line !== "" && !/^Day\s+\d+/i.test(line)).map((title) => ({ title, description: "" }));
}
function decodeItinerary(text) {
  const parsed = parseItineraryText(text);
  return parsed.map((p) => ({
    day: p.day,
    day_title: p.day_title,
    entries: [
      {
        id: `ai-day-${p.day}-${Date.now()}`,
        day: p.day,
        day_title: p.day_title,
        item_type_id: "",
        item_id: "",
        item_type: "Activity",
        title: p.day_title || `Day ${p.day}`,
        description: p.description,
        start_time: "",
        end_time: "",
        time_type: "flexible",
        cost_per_person: false,
        included_items: [],
        excluded_items: [],
        images: [],
        status: "active"
      }
    ]
  }));
}
const ALL_TASKS = [
  {
    key: "short_description",
    label: __$1("Short description", "yatra"),
    task: "trip-short-description",
    decode: (t) => t.trim(),
    preview: (v) => String(v ?? "")
  },
  {
    key: "description",
    label: __$1("Trip description", "yatra"),
    task: "trip-description",
    // RichTextEditor expects HTML — wrap LLM's plain-text paragraphs in <p>.
    decode: (t) => plainTextToHtml(t),
    preview: (v) => typeof v === "string" ? v.replace(/<\/p>\s*<p>/gi, "\n\n").replace(/<[^>]+>/g, "").trim() : ""
  },
  {
    key: "highlights",
    label: __$1("Highlights", "yatra"),
    task: "trip-highlights",
    // TripForm's `highlights` field is a string[] — each line of the
    // LLM output becomes one bullet, stripping any accidental leading
    // bullets / dashes the model may have added despite the prompt.
    decode: (t) => t.split(/\r?\n/).map((l) => l.replace(/^[\s\-\*•·●]+/, "").trim()).filter((l) => l !== ""),
    preview: (v) => Array.isArray(v) ? v.map((s) => `• ${s}`).join("\n") : ""
  },
  {
    key: "included_items",
    label: __$1("What's included", "yatra"),
    task: "trip-included-items",
    decode: (t) => decodeAmenityList(t),
    preview: (v) => Array.isArray(v) ? v.map((i) => `• ${i.title}`).join("\n") : ""
  },
  {
    key: "excluded_items",
    label: __$1("What's excluded", "yatra"),
    task: "trip-excluded-items",
    decode: (t) => decodeAmenityList(t),
    preview: (v) => Array.isArray(v) ? v.map((i) => `• ${i.title}`).join("\n") : ""
  },
  {
    key: "cancellation_policy",
    label: __$1("Cancellation policy", "yatra"),
    task: "trip-cancellation-policy",
    decode: (t) => t.trim(),
    preview: (v) => String(v ?? "")
  },
  {
    key: "itinerary_days",
    label: __$1("Day-by-day itinerary", "yatra"),
    task: "trip-itinerary",
    decode: (t) => decodeItinerary(t),
    preview: (v) => Array.isArray(v) ? v.map(
      (d) => {
        var _a;
        return `Day ${d.day}: ${d.day_title || ""}
${((_a = d.entries[0]) == null ? void 0 : _a.description) ?? ""}`;
      }
    ).join("\n\n") : ""
  },
  {
    key: "meta_title",
    label: __$1("SEO meta title", "yatra"),
    task: "seo-meta-title",
    decode: (t) => t.trim().slice(0, 60),
    preview: (v) => String(v ?? "")
  },
  {
    key: "meta_description",
    label: __$1("SEO meta description", "yatra"),
    task: "seo-meta-description",
    decode: (t) => t.trim().slice(0, 160),
    preview: (v) => String(v ?? "")
  }
];
const AutoFillTripModal = ({
  open,
  onClose,
  buildContext,
  onFieldsAccepted,
  itineraryOnly = false
}) => {
  const initialRows = reactExports.useMemo(
    () => ALL_TASKS.map((spec) => ({
      spec,
      selected: itineraryOnly ? spec.key === "itinerary_days" : true,
      status: "idle",
      accepted: false
    })),
    [itineraryOnly]
  );
  const [rows, setRows] = reactExports.useState(initialRows);
  const [phase, setPhase] = reactExports.useState("setup");
  const [extraContext, setExtraContext] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (open) {
      setRows(initialRows);
      setPhase("setup");
      setExtraContext("");
    }
  }, [open, initialRows]);
  if (!open) return null;
  if (!isAiReady()) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: open, onClose, size: "md", hideHeader: true, hideFooter: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "h-5 w-5 text-amber-500 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: __$1("AI Assistant not configured", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-300", children: __$1(
          "Add an OpenAI or Anthropic key under Yatra → AI Assistant first.",
          "yatra"
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "admin.php?page=yatra&subpage=ai-assistant", children: __$1("Open AI settings", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __$1("Cancel", "yatra") })
        ] })
      ] })
    ] }) }) });
  }
  const selectedCount = rows.filter((r) => r.selected).length;
  const generatedCount = rows.filter((r) => r.status === "done").length;
  const failedCount = rows.filter((r) => r.status === "failed").length;
  const needsContextCount = rows.filter(
    (r) => r.status === "needs_context"
  ).length;
  const allDone = rows.filter((r) => r.selected).every(
    (r) => r.status === "done" || r.status === "failed" || r.status === "needs_context"
  );
  const toggle = (key) => setRows(
    (prev) => prev.map(
      (r) => r.spec.key === key ? { ...r, selected: !r.selected } : r
    )
  );
  const toggleAccept = (key) => setRows(
    (prev) => prev.map(
      (r) => r.spec.key === key && r.status === "done" ? { ...r, accepted: !r.accepted } : r
    )
  );
  const runOneTask = async (taskKey, extraSuffix = "") => {
    setRows(
      (prev) => prev.map(
        (row) => row.spec.key === taskKey ? {
          ...row,
          status: "running",
          error: void 0,
          clarificationMessage: void 0,
          clarificationQuestions: void 0
        } : row
      )
    );
    const spec = ALL_TASKS.find((t) => t.key === taskKey);
    if (!spec) return;
    const combinedContext = [extraContext.trim(), extraSuffix.trim()].filter((s) => s !== "").join("\n\n");
    const ctx = {
      ...buildContext(),
      extra_context: combinedContext
    };
    try {
      const res = await aiApi.generate(spec.task, ctx);
      const clarification = detectClarification(res.text, {
        expectDayHeads: spec.task === "trip-itinerary"
      });
      if (clarification.isClarification) {
        setRows(
          (prev) => prev.map(
            (row) => row.spec.key === taskKey ? {
              ...row,
              status: "needs_context",
              clarificationMessage: clarification.message,
              clarificationQuestions: clarification.questions,
              retryContext: ""
            } : row
          )
        );
        return;
      }
      const decoded = spec.decode(res.text, ctx);
      const preview = spec.preview(decoded);
      setRows(
        (prev) => prev.map(
          (row) => row.spec.key === taskKey ? {
            ...row,
            status: "done",
            decoded,
            preview,
            accepted: true
          } : row
        )
      );
    } catch (e) {
      const msg = extractError(e);
      setRows(
        (prev) => prev.map(
          (row) => row.spec.key === taskKey ? {
            ...row,
            status: "failed",
            error: msg
          } : row
        )
      );
    }
  };
  const runGenerations = async () => {
    setPhase("running");
    const selected = rows.filter((r) => r.selected).map((r) => r.spec.key);
    await Promise.all(selected.map((k) => runOneTask(k)));
    setPhase("preview");
  };
  const retryWithContext = (taskKey) => {
    var _a;
    const row = rows.find((r) => r.spec.key === taskKey);
    const suffix = ((_a = row == null ? void 0 : row.retryContext) == null ? void 0 : _a.trim()) ?? "";
    if (suffix === "") return;
    void runOneTask(taskKey, suffix);
  };
  const updateRetryContext = (taskKey, value) => setRows(
    (prev) => prev.map(
      (row) => row.spec.key === taskKey ? { ...row, retryContext: value } : row
    )
  );
  const applyAccepted = () => {
    const updates = {};
    for (const r of rows) {
      if (r.status === "done" && r.accepted && r.decoded !== void 0) {
        updates[r.spec.key] = r.decoded;
      }
    }
    onFieldsAccepted(updates);
    onClose();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      isOpen: open,
      onClose,
      size: "xl",
      hideHeader: true,
      hideFooter: true,
      bodyScrollClassName: "overflow-visible",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-[80vh] max-h-[800px] min-w-[640px] max-w-[920px] flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-5 w-5 text-blue-600" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: itineraryOnly ? __$1("Generate itinerary", "yatra") : __$1("Auto-fill trip with AI", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "rounded text-gray-400 hover:text-gray-600",
              "aria-label": __$1("Close", "yatra"),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-6 py-4", children: [
          phase === "setup" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: itineraryOnly ? __$1(
              "AI will generate a day-by-day itinerary grounded in this trip's facts. Existing itinerary will be replaced when you accept the result.",
              "yatra"
            ) : __$1(
              "Pick the sections to generate. AI runs them in parallel, then you review each result before anything touches the form.",
              "yatra"
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-blue-200 bg-blue-50/40 p-3 dark:border-blue-500/40 dark:bg-blue-900/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "label",
                {
                  htmlFor: "autofill-context",
                  className: "mb-1 flex items-center gap-1.5 text-xs font-medium text-blue-900 dark:text-blue-200",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5" }),
                    __$1("Tell AI about this trip", "yatra"),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 rounded bg-blue-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-800 dark:bg-blue-900/60 dark:text-blue-200", children: __$1("Recommended", "yatra") })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  id: "autofill-context",
                  rows: 4,
                  className: "w-full rounded-md border border-blue-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-500/40 dark:bg-gray-800",
                  placeholder: __$1(
                    "e.g. 7-day cultural trek to Dhaka, moderate difficulty. Includes food tours, rickshaw rides, old town walking tour. Best for ages 18-65. Mid-range hotels.",
                    "yatra"
                  ),
                  value: extraContext,
                  onChange: (e) => setExtraContext(e.target.value)
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-blue-700 dark:text-blue-300", children: __$1(
                "The more facts you share, the better the output. Existing fields on the form (title, destinations, duration) are also passed automatically.",
                "yatra"
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-gray-200 dark:border-gray-700", children: rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "label",
              {
                className: "flex items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0 dark:border-gray-700",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: r.selected,
                      onChange: () => toggle(r.spec.key)
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-900 dark:text-white", children: r.spec.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto text-xs text-gray-400", children: r.spec.task })
                ]
              },
              r.spec.key
            )) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
              __$1("Tokens count against your provider plan.", "yatra"),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  className: "text-blue-600 underline dark:text-blue-300",
                  href: "admin.php?page=yatra&subpage=ai-assistant",
                  target: "_blank",
                  rel: "noopener noreferrer",
                  children: __$1("See usage", "yatra")
                }
              )
            ] })
          ] }),
          phase !== "setup" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: rows.filter((r) => r.selected).map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            TaskRowView,
            {
              row: r,
              onToggleAccept: () => toggleAccept(r.spec.key),
              onRetryContextChange: (v) => updateRetryContext(r.spec.key, v),
              onRetry: () => retryWithContext(r.spec.key)
            },
            r.spec.key
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-t border-gray-200 px-6 py-3 dark:border-gray-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
            phase === "setup" && (selectedCount === 0 ? __$1("Pick at least one section.", "yatra") : `${selectedCount} ${__$1("sections selected.", "yatra")}`),
            phase === "running" && `${__$1("Generating…", "yatra")} ${generatedCount}/${selectedCount}`,
            phase === "preview" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              `${generatedCount} ${__$1("ready", "yatra")}`,
              needsContextCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-amber-600 dark:text-amber-300", children: `${needsContextCount} ${__$1("need more info", "yatra")}` }),
              failedCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-red-500", children: `${failedCount} ${__$1("failed", "yatra")}` })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __$1("Cancel", "yatra") }),
            phase === "setup" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: runGenerations, disabled: selectedCount === 0, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
              __$1("Generate", "yatra")
            ] }),
            phase === "preview" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: applyAccepted,
                disabled: !rows.some((r) => r.accepted && r.status === "done"),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-2 h-4 w-4" }),
                  __$1("Apply accepted", "yatra")
                ]
              }
            ),
            phase === "running" && !allDone && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { disabled: true, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
              __$1("Working…", "yatra")
            ] })
          ] })
        ] })
      ] })
    }
  );
};
const TaskRowView = ({ row, onToggleAccept, onRetryContextChange, onRetry }) => {
  const [expanded, setExpanded] = reactExports.useState(false);
  const retryDisabled = (row.retryContext ?? "").trim() === "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-gray-200 p-3 dark:border-gray-700", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: row.status }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-sm text-gray-900 dark:text-white", children: row.spec.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto flex items-center gap-2", children: row.status === "done" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setExpanded((v) => !v),
            className: "inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3 w-3" }),
              expanded ? __$1("Hide", "yatra") : __$1("Preview", "yatra")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-1 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: row.accepted,
              onChange: onToggleAccept
            }
          ),
          __$1("Apply", "yatra")
        ] })
      ] }) })
    ] }),
    expanded && row.status === "done" && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200", children: row.preview || /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-400", children: __$1("(empty)", "yatra") }) }),
    row.status === "needs_context" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-2 rounded-md border border-amber-200 bg-amber-50/60 p-3 text-xs dark:border-amber-500/40 dark:bg-amber-900/20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 text-amber-900 dark:text-amber-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(HelpCircle, { className: "mt-0.5 h-3.5 w-3.5 shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: __$1(
            "AI needs a few more details to write something useful.",
            "yatra"
          ) }),
          row.clarificationMessage && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-amber-800/90 dark:text-amber-200/90", children: row.clarificationMessage }),
          row.clarificationQuestions && row.clarificationQuestions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1.5 list-disc space-y-0.5 pl-4 text-amber-900 dark:text-amber-200", children: row.clarificationQuestions.map((q, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: q }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          rows: 3,
          placeholder: __$1(
            "Type the answers here — e.g. duration, activities, difficulty, best season…",
            "yatra"
          ),
          value: row.retryContext ?? "",
          onChange: (e) => onRetryContextChange(e.target.value),
          className: "w-full rounded-md border border-amber-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-amber-500/40 dark:bg-gray-800"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          size: "sm",
          onClick: onRetry,
          disabled: retryDisabled,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-2 h-3.5 w-3.5" }),
            __$1("Try again with this", "yatra")
          ]
        }
      ) })
    ] }),
    row.status === "failed" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-start gap-2 rounded bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "mt-0.5 h-3.5 w-3.5 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: row.error })
    ] })
  ] });
};
const StatusBadge = ({ status }) => {
  if (status === "idle") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4 text-gray-400" });
  }
  if (status === "running") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-4 w-4 animate-spin text-blue-500" });
  }
  if (status === "done") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "h-4 w-4 text-green-500" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "h-4 w-4 text-red-500" });
};
function extractError(e) {
  var _a;
  if (!e) return "Generation failed.";
  const data = ((_a = e == null ? void 0 : e.response) == null ? void 0 : _a.data) ?? (e == null ? void 0 : e.data) ?? null;
  if (data && typeof data === "object" && typeof data.message === "string") {
    return data.message;
  }
  return (e == null ? void 0 : e.message) || "Generation failed.";
}
const MEAL_PLAN_SELECT_OPTIONS = [
  { value: "", label: __$1("Select meal plan", "yatra") },
  { value: "breakfast", label: __$1("Breakfast Only", "yatra") },
  {
    value: "half_board",
    label: __$1("Half Board (Breakfast + Dinner)", "yatra")
  },
  { value: "full_board", label: __$1("Full Board (All Meals)", "yatra") },
  { value: "all_inclusive", label: __$1("All Inclusive", "yatra") },
  { value: "none", label: __$1("No Meals Included", "yatra") }
];
function parseAttributeFieldOptions(field_options) {
  if (Array.isArray(field_options)) {
    return field_options.filter((o) => o && typeof o === "object").map((o) => ({
      label: String((o == null ? void 0 : o.label) ?? ""),
      value: String((o == null ? void 0 : o.value) ?? "")
    })).filter((o) => o.label !== "" || o.value !== "");
  }
  if (typeof field_options === "string" && field_options.trim()) {
    try {
      const p = JSON.parse(field_options);
      if (Array.isArray(p)) {
        return p.filter((o) => o && typeof o === "object").map((o) => ({
          label: String((o == null ? void 0 : o.label) ?? ""),
          value: String((o == null ? void 0 : o.value) ?? "")
        })).filter((o) => o.label !== "" || o.value !== "");
      }
    } catch {
      return [];
    }
  }
  return [];
}
function normalizeAttributeStoredValue(fieldType, raw) {
  if (fieldType === "checkbox") {
    if (Array.isArray(raw)) {
      return raw.map((v) => String(v));
    }
    if (typeof raw === "string") {
      const t = raw.trim();
      if (t.startsWith("[")) {
        try {
          const p = JSON.parse(t);
          if (Array.isArray(p)) {
            return p.map((v) => String(v));
          }
        } catch {
        }
      }
      return t ? [t] : [];
    }
    if (typeof raw === "boolean") {
      return raw ? ["1"] : [];
    }
    return [];
  }
  if (raw === null || raw === void 0) {
    return "";
  }
  return typeof raw === "string" ? raw : String(raw);
}
const TripAttributesSection = ({
  formData,
  handleFieldChange,
  tripId,
  isEditMode = false,
  tripAttributesData = {},
  // Add this prop
  tripAttributesReady = true
}) => {
  const [selectedAttributes, setSelectedAttributes] = reactExports.useState([]);
  const [attributeValues, setAttributeValues] = reactExports.useState(
    {}
  );
  const [showAttributeDropdown, setShowAttributeDropdown] = reactExports.useState(false);
  const isInitializing = reactExports.useRef(true);
  const { data: attributesData, isLoading: isLoadingAttributes } = useQuery({
    queryKey: ["attributes"],
    queryFn: async () => {
      const response = await apiClient.get("/attributes?status=publish");
      const rawData = (response == null ? void 0 : response.data) ?? [];
      const list = Array.isArray(rawData) ? rawData : Array.isArray(rawData == null ? void 0 : rawData.data) ? rawData.data : [];
      return list.map((item) => ({
        ...item,
        id: Number(item == null ? void 0 : item.id) || 0
      }));
    }
  });
  reactExports.useEffect(() => {
    if (!isInitializing.current) return;
    if (isEditMode && tripId && !tripAttributesReady) {
      return;
    }
    if (isEditMode && tripAttributesData && Object.keys(tripAttributesData).length > 0) {
      const attributeIds = Object.keys(tripAttributesData).map(
        (id) => Number(id)
      );
      setSelectedAttributes(attributeIds);
      setAttributeValues(tripAttributesData);
      isInitializing.current = false;
    } else if (formData.attributes && Object.keys(formData.attributes).length > 0 && isInitializing.current) {
      const attributeIds = Object.keys(formData.attributes).map(
        (id) => Number(id)
      );
      setSelectedAttributes(attributeIds);
      setAttributeValues(formData.attributes);
      isInitializing.current = false;
    } else {
      isInitializing.current = false;
    }
  }, [
    tripAttributesData,
    formData.attributes,
    isEditMode,
    tripId,
    tripAttributesReady
  ]);
  const handleAddAttribute = (attributeId) => {
    if (!selectedAttributes.includes(attributeId)) {
      const newSelectedAttributes = [...selectedAttributes, attributeId];
      setSelectedAttributes(newSelectedAttributes);
      if (!attributeValues[attributeId]) {
        const newAttributeValues = { ...attributeValues, [attributeId]: "" };
        setAttributeValues(newAttributeValues);
        handleFieldChange("attributes", newAttributeValues);
      }
      setShowAttributeDropdown(false);
    }
  };
  const handleRemoveAttribute = (attributeId) => {
    const newSelectedAttributes = selectedAttributes.filter(
      (id) => id !== attributeId
    );
    const newAttributeValues = { ...attributeValues };
    delete newAttributeValues[attributeId];
    setSelectedAttributes(newSelectedAttributes);
    setAttributeValues(newAttributeValues);
    handleFieldChange("attributes", newAttributeValues);
  };
  const handleAttributeValueChange = (attributeId, value) => {
    const newAttributeValues = { ...attributeValues, [attributeId]: value };
    setAttributeValues(newAttributeValues);
    handleFieldChange("attributes", newAttributeValues);
  };
  const renderAttributeInput = (attribute) => {
    const raw = attributeValues[attribute.id];
    const value = normalizeAttributeStoredValue(attribute.field_type, raw);
    switch (attribute.field_type) {
      case "text_field":
      case "email":
      case "url":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: attribute.field_type === "email" ? "email" : attribute.field_type === "url" ? "url" : "text",
            value,
            onChange: (e) => handleAttributeValueChange(attribute.id, e.target.value),
            placeholder: attribute.placeholder || __$1("Enter value", "yatra"),
            className: "mt-2"
          }
        );
      case "number":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            value,
            onChange: (e) => handleAttributeValueChange(attribute.id, e.target.value),
            placeholder: attribute.placeholder || __$1("Enter number", "yatra"),
            className: "mt-2"
          }
        );
      case "textarea":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value,
            onChange: (e) => handleAttributeValueChange(attribute.id, e.target.value),
            placeholder: attribute.placeholder || __$1("Enter text", "yatra"),
            rows: 3,
            className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none mt-2"
          }
        );
      case "select": {
        const options = parseAttributeFieldOptions(attribute.field_options);
        const strVal = typeof value === "string" ? value : "";
        if (options.length === 0) {
          return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-amber-600 dark:text-amber-500", children: __$1(
            "This attribute has no options configured. Edit the attribute to add choices.",
            "yatra"
          ) });
        }
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Select,
          {
            value: strVal,
            onChange: (e) => handleAttributeValueChange(attribute.id, e.target.value),
            className: "mt-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __$1("Select an option", "yatra") }),
              options.map((option, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label || option.value }, `${option.value}-${index}`))
            ]
          }
        );
      }
      case "radio": {
        const options = parseAttributeFieldOptions(attribute.field_options);
        const strVal = typeof value === "string" ? value : "";
        if (options.length === 0) {
          return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-amber-600 dark:text-amber-500", children: __$1(
            "This attribute has no options configured. Edit the attribute to add choices.",
            "yatra"
          ) });
        }
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "mt-2 space-y-2",
            role: "radiogroup",
            "aria-label": attribute.name,
            children: options.map((option, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "label",
              {
                className: "flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "radio",
                      name: `yatra-attr-${attribute.id}`,
                      value: option.value,
                      checked: String(strVal) === String(option.value),
                      onChange: () => handleAttributeValueChange(attribute.id, option.value),
                      className: "border-gray-300 text-blue-600 focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: option.label || option.value })
                ]
              },
              `${option.value}-${index}`
            ))
          }
        );
      }
      case "checkbox": {
        const options = parseAttributeFieldOptions(attribute.field_options);
        const selected = Array.isArray(value) ? value.map(String) : [];
        if (options.length === 0) {
          return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-amber-600 dark:text-amber-500", children: __$1(
            "This attribute has no options configured. Edit the attribute to add choices.",
            "yatra"
          ) });
        }
        const toggle = (optValue, checked) => {
          const next = checked ? [...selected.filter((v) => v !== optValue), optValue] : selected.filter((v) => v !== optValue);
          handleAttributeValueChange(attribute.id, next);
        };
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 space-y-2", children: options.map((option, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "label",
          {
            className: "flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: selected.includes(String(option.value)),
                  onChange: (e) => toggle(String(option.value), e.target.checked),
                  className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: option.label || option.value })
            ]
          },
          `${option.value}-${index}`
        )) });
      }
      case "file":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "text",
            value: typeof value === "string" ? value : "",
            onChange: (e) => handleAttributeValueChange(attribute.id, e.target.value),
            placeholder: attribute.placeholder || __$1("File URL or attachment path", "yatra"),
            className: "mt-2"
          }
        );
      case "date":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "date",
            value,
            onChange: (e) => handleAttributeValueChange(attribute.id, e.target.value),
            className: "mt-2"
          }
        );
      case "time":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          TimePicker,
          {
            value: Array.isArray(value) ? value[0] ?? "" : value,
            onChange: (newValue) => handleAttributeValueChange(attribute.id, newValue),
            placeholder: "Select time",
            className: "mt-2 w-full"
          }
        );
      case "color":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "color",
            value,
            onChange: (e) => handleAttributeValueChange(attribute.id, e.target.value),
            className: "mt-2 h-10 w-20"
          }
        );
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "text",
            value,
            onChange: (e) => handleAttributeValueChange(attribute.id, e.target.value),
            placeholder: attribute.placeholder || __$1("Enter value", "yatra"),
            className: "mt-2"
          }
        );
    }
  };
  const availableAttributes = (attributesData == null ? void 0 : attributesData.filter(
    (attr) => attr.status === "publish" && !selectedAttributes.includes(attr.id)
  )) || [];
  if (isEditMode && tripId && !tripAttributesReady) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", "aria-busy": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        },
        i
      )) })
    ] });
  }
  if (isLoadingAttributes) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        },
        i
      )) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: !attributesData || attributesData.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "w-12 h-12 text-gray-400 mx-auto" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: __$1("No Attributes Found", "yatra") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-4", children: __$1(
      "Attributes allow you to add custom fields to your trips that are not included in the main plugin features. You can create any type of custom attribute you need.",
      "yatra"
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "a",
      {
        href: "/wp-admin/admin.php?page=yatra&subpage=trips&tab=attributes&action=create",
        target: "_blank",
        rel: "noopener noreferrer",
        className: "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
          __$1("Create Your First Attribute", "yatra")
        ]
      }
    )
  ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          onClick: () => setShowAttributeDropdown(!showAttributeDropdown),
          className: "w-full justify-between h-auto py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors",
          variant: "outline",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __$1("Add Attribute", "yatra") })
            ] }),
            showAttributeDropdown ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "w-4 h-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-4 h-4" })
          ]
        }
      ),
      showAttributeDropdown && availableAttributes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-60 overflow-y-auto", children: availableAttributes.map((attribute) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => handleAddAttribute(attribute.id),
          className: "w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: attribute.name }),
              attribute.description && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: attribute.description })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs", children: attribute.field_type.replace("_", " ") }),
              attribute.required && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "error", className: "text-xs", children: __$1("Required", "yatra") })
            ] })
          ] })
        },
        attribute.id
      )) }) }),
      showAttributeDropdown && availableAttributes.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: __$1("No attributes available to add", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: "/wp-admin/admin.php?page=yatra&subpage=trips&tab=attributes&action=create",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
              __$1("Create New Attribute", "yatra")
            ]
          }
        )
      ] })
    ] }) }),
    selectedAttributes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: selectedAttributes.map((attributeId) => {
      const attribute = attributesData == null ? void 0 : attributesData.find(
        (attr) => attr.id === attributeId
      );
      if (!attribute) {
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Card,
          {
            className: "border-orange-200 bg-orange-50 dark:bg-orange-900/20",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-medium text-orange-900 dark:text-orange-100", children: [
                  "Attribute ID ",
                  attributeId,
                  " (Not Found)"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-orange-700 dark:text-orange-300", children: [
                  "Value:",
                  " ",
                  JSON.stringify(attributeValues[attributeId])
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  onClick: () => handleRemoveAttribute(attributeId),
                  className: "text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                }
              )
            ] }) })
          },
          attributeId
        );
      }
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "w-4 h-4 text-blue-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-gray-900 dark:text-white", children: attribute.name })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "ghost",
              size: "sm",
              onClick: () => handleRemoveAttribute(attribute.id),
              className: "text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
            }
          )
        ] }),
        attribute.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-3", children: attribute.description }),
        renderAttributeInput(attribute)
      ] }) }, attribute.id);
    }) })
  ] }) });
};
const SectionHeader = ({
  icon: Icon,
  title,
  description
}) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-5 h-5 text-gray-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __$1(title, title) })
    ] }),
    description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __$1(description, description) })
  ] });
};
const ItinerarySection = ({
  formData,
  isEditMode,
  tripId
}) => {
  const itineraryLink = reactExports.useMemo(() => {
    var _a;
    if (!isEditMode || !tripId) return null;
    return `${((_a = window.yatraAdmin) == null ? void 0 : _a.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&trip_id=${tripId}`;
  }, [isEditMode, tripId]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionHeader,
      {
        icon: Calendar,
        title: "Itinerary Builder",
        description: "Create detailed day-by-day itineraries with our professional itinerary builder"
      }
    ),
    itineraryLink ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-2 border-dashed border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-8 w-8 text-blue-600 dark:text-blue-400" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-2", children: __$1("Professional Itinerary Builder", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400 max-w-2xl mx-auto", children: __$1(
          "Create detailed day-by-day itineraries with activities, meals, accommodation, transportation, and more. Build professional trip schedules that help travelers understand the complete experience.",
          "yatra"
        ) })
      ] }),
      formData.itinerary_days && formData.itinerary_days.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 max-w-md mx-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-blue-600 dark:text-blue-400", children: formData.itinerary_days.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-600 dark:text-gray-400", children: formData.itinerary_days.length === 1 ? __$1("Day", "yatra") : __$1("Days", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-green-600 dark:text-green-400", children: formData.itinerary_days.reduce(
            (sum, day) => {
              var _a;
              return sum + (((_a = day.entries) == null ? void 0 : _a.length) || 0);
            },
            0
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-600 dark:text-gray-400", children: __$1("Activities", "yatra") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          onClick: () => window.open(
            itineraryLink,
            "_blank",
            "noopener,noreferrer"
          ),
          className: "bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all",
          size: "lg",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-5 w-5 mr-2" }),
            __$1("Launch Itinerary Builder", "yatra")
          ]
        }
      ) })
    ] }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "h-12 w-12 text-amber-600 dark:text-amber-400 mx-auto mb-3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: __$1("Save Trip First", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400", children: __$1(
        "Please save this trip first to access the itinerary builder. The builder will automatically load this trip for you.",
        "yatra"
      ) })
    ] }) })
  ] }) });
};
const Textarea = ({ value, onChange, placeholder, rows = 3, className = "" }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "textarea",
  {
    value,
    onChange,
    placeholder,
    rows,
    className: `w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${className}`
  }
);
const IncludedSection = ({
  formData,
  handleFieldChange
}) => {
  const [newIncludedItem, setNewIncludedItem] = React.useState(
    {
      title: "",
      description: ""
    }
  );
  const [newExcludedItem, setNewExcludedItem] = React.useState(
    {
      title: "",
      description: ""
    }
  );
  const included_items = formData.included_items || [];
  const excluded_items = formData.excluded_items || [];
  const addIncludedItem = () => {
    if (newIncludedItem.title.trim()) {
      const updatedItems = [...included_items, { ...newIncludedItem }];
      handleFieldChange("included_items", updatedItems);
      setNewIncludedItem({ title: "", description: "" });
    }
  };
  const addExcludedItem = () => {
    if (newExcludedItem.title.trim()) {
      const updatedItems = [...excluded_items, { ...newExcludedItem }];
      handleFieldChange("excluded_items", updatedItems);
      setNewExcludedItem({ title: "", description: "" });
    }
  };
  const removeIncludedItem = (index) => {
    const updatedItems = included_items.filter(
      (_, i) => i !== index
    );
    handleFieldChange("included_items", updatedItems);
  };
  const removeExcludedItem = (index) => {
    const updatedItems = excluded_items.filter(
      (_, i) => i !== index
    );
    handleFieldChange("excluded_items", updatedItems);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionHeader,
      {
        icon: CheckSquare,
        title: "What's Included & Excluded",
        description: "Specify what is included and excluded in your trip pricing"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-green-700 dark:text-green-400", children: __$1("What's Included", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Badge,
            {
              variant: "success",
              className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
              children: [
                included_items.length,
                " ",
                __$1("items", "yatra")
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-800 shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                placeholder: __$1(
                  "Item title (e.g., Airport Transfer)",
                  "yatra"
                ),
                value: newIncludedItem.title,
                onChange: (e) => setNewIncludedItem({
                  ...newIncludedItem,
                  title: e.target.value
                }),
                className: "border-green-300 dark:border-green-700 focus:ring-green-500 focus:border-green-500"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                placeholder: __$1("Detailed description (optional)", "yatra"),
                value: newIncludedItem.description,
                onChange: (e) => setNewIncludedItem({
                  ...newIncludedItem,
                  description: e.target.value
                }),
                rows: 3,
                className: "border-green-300 dark:border-green-700 focus:ring-green-500 focus:border-green-500 resize-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: addIncludedItem,
              disabled: !newIncludedItem.title.trim(),
              size: "sm",
              className: "w-full bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 transition-all duration-200 shadow-sm hover:shadow-md",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                __$1("Add Included Item", "yatra")
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: included_items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8 text-gray-500 dark:text-gray-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CheckSquare, { className: "w-12 h-12 mx-auto mb-2 opacity-50" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __$1("No included items added yet", "yatra") })
        ] }) : included_items.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "group flex items-start justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-all duration-200",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 pr-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full flex-shrink-0" }),
                  item.title
                ] }),
                item.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg", children: item.description })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  onClick: () => removeIncludedItem(index),
                  className: "text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all duration-200 p-2",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                }
              )
            ]
          },
          index
        )) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-red-700 dark:text-red-400", children: __$1("What's Excluded", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Badge,
            {
              variant: "error",
              className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
              children: [
                excluded_items.length,
                " ",
                __$1("items", "yatra")
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 rounded-xl border border-red-200 dark:border-red-800 shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                placeholder: __$1(
                  "Item title (e.g., International Flights)",
                  "yatra"
                ),
                value: newExcludedItem.title,
                onChange: (e) => setNewExcludedItem({
                  ...newExcludedItem,
                  title: e.target.value
                }),
                className: "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                placeholder: __$1("Detailed description (optional)", "yatra"),
                value: newExcludedItem.description,
                onChange: (e) => setNewExcludedItem({
                  ...newExcludedItem,
                  description: e.target.value
                }),
                rows: 3,
                className: "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500 resize-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: addExcludedItem,
              disabled: !newExcludedItem.title.trim(),
              size: "sm",
              className: "w-full bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 transition-all duration-200 shadow-sm hover:shadow-md",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                __$1("Add Excluded Item", "yatra")
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: excluded_items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8 text-gray-500 dark:text-gray-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-12 h-12 mx-auto mb-2 opacity-50" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __$1("No excluded items added yet", "yatra") })
        ] }) : excluded_items.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "group flex items-start justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 shadow-sm hover:shadow-md transition-all duration-200",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 pr-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 bg-red-500 rounded-full flex-shrink-0" }),
                  item.title
                ] }),
                item.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg", children: item.description })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  onClick: () => removeExcludedItem(index),
                  className: "text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all duration-200 p-2",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                }
              )
            ]
          },
          index
        )) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start space-x-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-blue-800 dark:text-blue-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium mb-1", children: __$1("Tips for Included/Excluded Items:", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __$1(
            "Be specific about what's included (meals, transport, guides, etc.)",
            "yatra"
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __$1(
            "Clearly mention what's NOT included to avoid confusion",
            "yatra"
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __$1("Include items that affect pricing decisions", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __$1("Keep descriptions concise but informative", "yatra") })
        ] })
      ] })
    ] }) }) })
  ] });
};
const __ = (text) => {
  var _a, _b;
  return ((_b = (_a = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a.translations) == null ? void 0 : _b[text]) || text;
};
const TestimonialsSelector = ({
  tripId,
  selectedReviewIds,
  onChange
}) => {
  const [reviews, setReviews] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (tripId) {
      fetchReviews();
    } else {
      setReviews([]);
    }
  }, [tripId]);
  const fetchReviews = async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getReviews({
        trip_id: tripId,
        status: "approved",
        per_page: 100
      });
      setReviews(data.data || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError(__("Failed to load reviews. Please try again."));
    } finally {
      setLoading(false);
    }
  };
  const toggleReview = (reviewId) => {
    const newSelection = selectedReviewIds.includes(reviewId) ? selectedReviewIds.filter((id) => id !== reviewId) : [...selectedReviewIds, reviewId];
    onChange(newSelection);
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(void 0, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  const renderStars = (rating) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-0.5", children: [1, 2, 3, 4, 5].map((star) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      Star,
      {
        className: `w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`
      },
      star
    )) });
  };
  if (!tripId) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Testimonials") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("Select reviews to display as testimonials") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Save the trip first to select testimonials from reviews") }) }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Testimonials") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
        "Select approved reviews to display as testimonials on the trip page"
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-6 h-6 animate-spin text-blue-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-sm text-gray-600 dark:text-gray-400", children: __("Loading reviews...") })
    ] }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          size: "sm",
          onClick: fetchReviews,
          className: "mt-2",
          children: __("Retry")
        }
      )
    ] }) : reviews.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-2", children: __("No approved reviews yet") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-500", children: __(
        "Reviews will appear here once customers submit and they are approved"
      ) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: selectedReviewIds.length > 0 ? __(`${selectedReviewIds.length} review(s) selected`) : __("Select reviews to feature as testimonials") }),
        selectedReviewIds.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "ghost",
            size: "sm",
            onClick: () => onChange([]),
            className: "text-xs",
            children: __("Clear all")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 max-h-96 overflow-y-auto", children: reviews.map((review) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `p-4 border rounded-lg cursor-pointer transition-all ${selectedReviewIds.includes(review.id) ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`,
          onClick: () => toggleReview(review.id),
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: selectedReviewIds.includes(review.id),
                onChange: () => toggleReview(review.id),
                className: "mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2 mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: review.author_name }),
                    review.author_location && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-3 h-3" }),
                      review.author_location
                    ] })
                  ] }),
                  renderStars(review.rating)
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3 h-3" }),
                  formatDate(review.created_at)
                ] })
              ] }),
              review.title && /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-sm text-gray-900 dark:text-white mb-1", children: review.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 line-clamp-2", children: review.content }),
              selectedReviewIds.includes(review.id) && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "info", className: "mt-2", children: __("Selected as testimonial") })
            ] })
          ] })
        },
        review.id
      )) })
    ] }) })
  ] });
};
const sanitizeTextForSEO = (text, maxLength = 160) => {
  if (!text) return "";
  const plainText = text.replace(/<[^>]*>/g, "");
  const decodedText = plainText.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
  const cleanText = decodedText.replace(/\s+/g, " ").trim();
  if (cleanText.length > maxLength) {
    return cleanText.substring(0, maxLength) + "...";
  }
  return cleanText;
};
const extractArrayPayload = (payload) => {
  var _a;
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray((_a = payload == null ? void 0 : payload.data) == null ? void 0 : _a.data)) return payload.data.data;
  return [];
};
const normalizeAmenityItems = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) {
    return items.map((item) => {
      if (typeof item === "string") {
        return { title: item, description: "" };
      }
      if (item && typeof item === "object") {
        const obj = item;
        return {
          title: (obj.title ?? "").toString(),
          description: (obj.description ?? "").toString()
        };
      }
      return { title: String(item), description: "" };
    }).filter((item) => item.title.trim().length > 0);
  }
  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items);
      if (Array.isArray(parsed)) {
        return normalizeAmenityItems(parsed);
      }
    } catch {
      return [{ title: items, description: "" }];
    }
  }
  return [];
};
function buildTripAiContext(formData) {
  const amenityTitles = (items) => Array.isArray(items) ? items.map((it) => typeof it === "string" ? it : (it == null ? void 0 : it.title) || (it == null ? void 0 : it.label)).filter((s) => typeof s === "string" && s.trim() !== "") : [];
  return {
    name: (formData == null ? void 0 : formData.title) ?? "",
    short_description: (formData == null ? void 0 : formData.short_description) ?? "",
    description: stripHtml((formData == null ? void 0 : formData.description) ?? ""),
    destinations: namesFromIds(formData == null ? void 0 : formData.destinations),
    categories: namesFromIds(formData == null ? void 0 : formData.categories),
    activities: namesFromIds(formData == null ? void 0 : formData.activities),
    difficulty_level: (formData == null ? void 0 : formData.difficulty_level) ?? "",
    duration_days: (formData == null ? void 0 : formData.duration_days) ?? "",
    duration_nights: (formData == null ? void 0 : formData.duration_nights) ?? "",
    best_season: (formData == null ? void 0 : formData.best_season) ?? "",
    price: (formData == null ? void 0 : formData.price) ?? "",
    deposit_percentage: (formData == null ? void 0 : formData.deposit_percentage) ?? "",
    booking_deadline_hours: (formData == null ? void 0 : formData.booking_deadline_hours) ?? "",
    age_min: (formData == null ? void 0 : formData.age_min) ?? "",
    age_max: (formData == null ? void 0 : formData.age_max) ?? "",
    accommodation_type: (formData == null ? void 0 : formData.accommodation_type) ?? "",
    transportation_included: (formData == null ? void 0 : formData.transportation_included) ?? "",
    included_items: amenityTitles(formData == null ? void 0 : formData.included_items),
    excluded_items: amenityTitles(formData == null ? void 0 : formData.excluded_items)
  };
}
function stripHtml(value) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function namesFromIds(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      return item.name || item.label || item.title || "";
    }
    return "";
  }).filter((s) => typeof s === "string" && s.trim() !== "");
}
const TripForm = () => {
  var _a, _b, _c, _d, _e, _f;
  const queryClient = useQueryClient();
  const { can, isPro } = usePermissions();
  const { showToast } = useToast();
  const [aiModalOpen, setAiModalOpen] = reactExports.useState(false);
  const [aiModalMode, setAiModalMode] = reactExports.useState("all");
  const [itineraryBuildOpen, setItineraryBuildOpen] = reactExports.useState(false);
  const [featuredImagePreview, setFeaturedImagePreview] = reactExports.useState("");
  const [isResolvingFeaturedImage, setIsResolvingFeaturedImage] = reactExports.useState(false);
  const featuredImageCache = reactExports.useRef({});
  const mediaBaseUrl = reactExports.useMemo(() => {
    var _a2;
    const apiUrl = (_a2 = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a2.apiUrl;
    return apiUrl ? apiUrl.replace(/\/yatra\/v1\/?$/, "") : "";
  }, []);
  const getInitialSection = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sectionFromUrl = urlParams.get("section");
    const validSections = [
      "basic",
      "location",
      "duration",
      "pricing",
      "booking",
      "attributes",
      "itinerary",
      "included",
      "media",
      "downloads",
      "categorization",
      "faqs",
      "seo",
      "advanced"
    ];
    if (sectionFromUrl && validSections.includes(sectionFromUrl)) {
      return sectionFromUrl;
    }
    return "basic";
  };
  const [currentSection, setCurrentSection] = reactExports.useState(getInitialSection);
  const [visitedSections, setVisitedSections] = reactExports.useState(
    () => /* @__PURE__ */ new Set([getInitialSection()])
  );
  const [showCategorySelector, setShowCategorySelector] = reactExports.useState(false);
  const [showLandmarkDialog, setShowLandmarkDialog] = reactExports.useState(false);
  const [landmarkInput, setLandmarkInput] = reactExports.useState("");
  const [tripDetailsTab, setTripDetailsTab] = reactExports.useState("itinerary");
  reactExports.useEffect(() => {
    setVisitedSections((prev) => /* @__PURE__ */ new Set([...prev, currentSection]));
    const url = new URL(window.location.href);
    url.searchParams.set("section", currentSection);
    window.history.replaceState({}, "", url.toString());
  }, [currentSection]);
  const [showHighlightModal, setShowHighlightModal] = reactExports.useState(false);
  const [modalInput, setModalInput] = reactExports.useState({
    text: "",
    question: "",
    answer: ""
  });
  const [showRevisionsDialog, setShowRevisionsDialog] = reactExports.useState(false);
  const [selectedRevisionId, setSelectedRevisionId] = reactExports.useState(
    null
  );
  const [showRevisionConfirm, setShowRevisionConfirm] = reactExports.useState(false);
  const [simpleMode, setSimpleMode] = reactExports.useState(false);
  const [showSlugPreview, setShowSlugPreview] = reactExports.useState(true);
  const [dummyDataIndex, setDummyDataIndex] = reactExports.useState(0);
  const dummyRevisions = [
    {
      id: 1,
      version: 3,
      created_by_name: "Admin User",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: 2,
      version: 2,
      created_by_name: "Admin User",
      created_at: new Date(Date.now() - 864e5).toISOString()
    },
    {
      id: 3,
      version: 1,
      created_by_name: "Admin User",
      created_at: new Date(Date.now() - 1728e5).toISOString()
    }
  ];
  const dummyTripsData = [
    {
      // Trip 1: Beach Adventure
      title: "7-Day Bali Beach Adventure",
      slug: "7-day-bali-beach-adventure",
      description: "Escape to paradise with our 7-day Bali beach adventure. Experience pristine beaches, explore ancient temples, enjoy world-class spa treatments, and immerse yourself in the rich Balinese culture. This carefully curated journey combines relaxation with adventure, offering the perfect balance for travelers seeking both tranquility and excitement.",
      short_description: "Escape to paradise with our 7-day Bali beach adventure featuring pristine beaches, ancient temples, and cultural immersion.",
      highlights: [
        "Pristine white sand beaches",
        "Ancient temple visits",
        "Traditional spa treatments",
        "Cultural dance performances",
        "Sunset dinners by the ocean"
      ],
      trip_details: "This comprehensive 7-day journey takes you through the best of Bali. Start your adventure in Seminyak with its trendy beach clubs and world-class restaurants. Visit the iconic Tanah Lot Temple perched on a rock formation in the sea. Explore the cultural heart of Ubud, known for its rice terraces, monkey forest, and art galleries. Enjoy traditional Balinese spa treatments and witness captivating cultural performances. End your trip with a relaxing stay at a beachfront resort where you can unwind and reflect on your incredible journey.",
      what_makes_special: "This trip offers exclusive access to private beach areas, personalized cultural experiences, and a perfect blend of relaxation and adventure. Our local guides share insider knowledge and hidden gems that most tourists never discover.",
      trip_story: "Imagine waking up to the gentle sound of waves lapping against the shore. As the sun rises over the horizon, you step onto your private balcony to witness a breathtaking sunrise. Your day begins with a traditional Balinese breakfast before heading out to explore ancient temples that have stood for centuries. In the afternoon, you find yourself surrounded by emerald-green rice terraces, learning about traditional farming methods from local farmers. As evening approaches, you're treated to a mesmerizing cultural dance performance followed by a candlelit dinner on the beach. This is more than a vacation—it's a journey into the heart and soul of Bali.",
      video_url: "https://www.youtube.com/watch?v=example1",
      virtual_tour_url: "",
      testimonial_review_ids: [],
      // Will be populated from actual reviews
      destinations: [],
      // Will be populated based on available destinations
      starting_location: "Ngurah Rai International Airport (DPS)",
      ending_location: "Seminyak Beach Resort",
      countries: ["Indonesia"],
      regions: ["Bali"],
      starting_latitude: "-8.3405",
      starting_longitude: "115.0920",
      ending_latitude: "-8.5069",
      ending_longitude: "115.2625",
      landmarks: [
        "Tanah Lot Temple",
        "Ubud Monkey Forest",
        "Tegallalang Rice Terrace",
        "Seminyak Beach"
      ],
      trip_type: "multi_day",
      duration_days: "7",
      duration_nights: "6",
      available_from: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      // 30 days from now
      available_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      // 1 year from now
      booking_window_days: "30",
      seasonal_availability: "Year-round",
      best_season: "April to October",
      peak_season: "July to August",
      off_season: "November to March",
      activity_types: [],
      // Will be populated based on available activities
      difficulty_level: "",
      trip_category: [],
      tags: ["family-friendly", "beach", "relaxation", "cultural", "spa"],
      featured_priority: "featured",
      accommodation_type: "Resort",
      meal_plan: "breakfast",
      accommodation_details: "4-star beachfront resort with private balconies, infinity pool, and spa facilities",
      transportation_included: true,
      pickup_location: "Ngurah Rai International Airport",
      dropoff_location: "Seminyak Beach Resort",
      transportation_details: "Private air-conditioned vehicle with professional driver",
      pricing_type: "traveler_based",
      original_price: "",
      discounted_price: "",
      price_types: [
        { category_id: 1, original_price: "1250", discounted_price: "" },
        { category_id: 2, original_price: "625", discounted_price: "" },
        { category_id: 3, original_price: "0", discounted_price: "" }
      ],
      deposit_amount: "300",
      deposit_percentage: "",
      payment_terms: "50% deposit required at booking, remaining 50% due 30 days before departure",
      max_travelers: "12",
      min_travelers: "2",
      booking_deadline_hours: "24",
      cancellation_policy: "Free cancellation up to 30 days before departure. 50% refund for cancellations 15-30 days before. No refund for cancellations less than 15 days before.",
      age_min: "8",
      age_max: "",
      physical_requirements: "Moderate fitness level required. Some walking involved but no strenuous activities.",
      visa_requirements: "Visa on arrival available for most nationalities. Valid passport required with at least 6 months validity.",
      vaccination_requirements: "No mandatory vaccinations. Recommended: Hepatitis A, Typhoid, and routine vaccinations.",
      disable_booking: false,
      has_default_time_slots: false,
      default_time_slots: [],
      departure_time: "",
      included_items: [
        {
          title: "Accommodation",
          description: "6 nights at 4-star beachfront resort"
        },
        { title: "Breakfast", description: "Daily breakfast included" },
        {
          title: "Airport transfers",
          description: "Private transfers to and from airport"
        },
        {
          title: "Temple visits",
          description: "Entrance fees to all temples included"
        },
        {
          title: "Cultural performances",
          description: "Traditional dance show tickets"
        },
        {
          title: "Professional guide",
          description: "English-speaking local guide"
        }
      ],
      excluded_items: [
        {
          title: "International flights",
          description: "Flights to and from Bali not included"
        },
        {
          title: "Lunch and dinner",
          description: "Meals other than breakfast"
        },
        {
          title: "Travel insurance",
          description: "Travel insurance recommended but not included"
        },
        {
          title: "Personal expenses",
          description: "Souvenirs, tips, and personal items"
        }
      ],
      itinerary_days: [],
      gallery_images: [],
      featured_image: null,
      downloadable_items: [],
      faqs: [
        {
          question: "What is the best time to visit Bali?",
          answer: "The best time to visit Bali is during the dry season from April to October, when you can expect sunny days and minimal rainfall."
        },
        {
          question: "Do I need a visa?",
          answer: "Most nationalities can get a visa on arrival at the airport. A valid passport with at least 6 months validity is required."
        },
        {
          question: "What should I pack?",
          answer: "Pack light, breathable clothing, swimwear, sunscreen, insect repellent, and comfortable walking shoes. Modest clothing is required for temple visits."
        }
      ],
      frontend_tabs: [
        {
          id: "overview",
          label: "Overview",
          enabled: true,
          order: 1,
          content_type: "general",
          icon: { type: "icon", value: "book-open" }
        },
        {
          id: "itinerary",
          label: "Itinerary",
          enabled: true,
          order: 2,
          content_type: "itinerary",
          icon: { type: "icon", value: "calendar" }
        },
        {
          id: "included",
          label: "Included",
          enabled: true,
          order: 3,
          content_type: "included_excluded",
          icon: { type: "icon", value: "check" }
        },
        {
          id: "location",
          label: "Location",
          enabled: true,
          order: 4,
          content_type: "gallery",
          icon: { type: "icon", value: "map-pin" }
        },
        {
          id: "important_info",
          label: "Important Info",
          enabled: true,
          order: 5,
          content_type: "general",
          icon: { type: "icon", value: "file-text" }
        },
        {
          id: "downloads",
          label: "Downloads",
          enabled: true,
          order: 6,
          content_type: "downloads",
          icon: { type: "icon", value: "download" }
        },
        {
          id: "faq",
          label: "FAQ",
          enabled: true,
          order: 7,
          content_type: "faqs",
          icon: { type: "icon", value: "help-circle" }
        },
        {
          id: "trip_story",
          label: "Story",
          enabled: true,
          order: 8,
          content_type: "custom",
          custom_content: "",
          icon: { type: "icon", value: "book" }
        },
        {
          id: "what_makes_special",
          label: "Special",
          enabled: true,
          order: 9,
          content_type: "custom",
          custom_content: "",
          icon: { type: "icon", value: "star" }
        },
        {
          id: "testimonials",
          label: "Testimonials",
          enabled: true,
          order: 10,
          content_type: "reviews",
          icon: { type: "icon", value: "message-circle" }
        }
      ],
      availability_dates: [],
      status: "draft",
      scheduled_publish_date: "",
      scheduled_unpublish_date: "",
      version: 1,
      seasonal_auto_enable: false,
      seasonal_enable_date: "",
      seasonal_disable_date: "",
      meta_title: "7-Day Bali Beach Adventure | Luxury Beach Resort Experience",
      meta_description: "Experience the best of Bali with our 7-day beach adventure. Pristine beaches, ancient temples, cultural immersion, and world-class spa treatments await.",
      meta_keywords: "Bali, beach vacation, cultural tour, spa retreat, Indonesia travel",
      attributes: {}
    },
    {
      // Trip 2: Mountain Trekking Adventure
      title: "Everest Base Camp Trek - 14 Days",
      slug: "everest-base-camp-trek-14-days",
      description: "Embark on the adventure of a lifetime with our 14-day Everest Base Camp trek. This challenging yet rewarding journey takes you through the heart of the Himalayas, passing through traditional Sherpa villages, ancient monasteries, and breathtaking mountain landscapes. Experience the rich culture of the Khumbu region while pushing your limits to reach the base of the world's highest mountain.",
      short_description: "Embark on the adventure of a lifetime with our 14-day Everest Base Camp trek through the heart of the Himalayas.",
      highlights: [
        "Trek to Everest Base Camp (5,364m)",
        "Visit ancient Buddhist monasteries",
        "Experience Sherpa culture",
        "Breathtaking mountain views",
        "Professional mountain guides"
      ],
      trip_details: "This 14-day trekking adventure begins in Kathmandu, where you'll prepare for your journey and meet your experienced guides. Fly to Lukla, the gateway to the Khumbu region, and begin your trek through the stunning Himalayan landscape. Pass through traditional Sherpa villages like Namche Bazaar, Tengboche, and Dingboche, each offering unique cultural experiences and acclimatization opportunities. Visit ancient monasteries, learn about Sherpa traditions, and witness the daily life of mountain communities. The journey culminates at Everest Base Camp, where you'll stand in the shadow of the world's highest peak. Along the way, you'll be treated to spectacular views of peaks like Ama Dablam, Lhotse, and of course, Mount Everest itself.",
      what_makes_special: "Our trek includes experienced mountain guides, proper acclimatization schedules, high-altitude porters, and comprehensive safety equipment. We prioritize responsible tourism, supporting local communities and ensuring minimal environmental impact.",
      trip_story: "The crisp mountain air fills your lungs as you take your first steps on the trail. With each passing day, the mountains grow larger, the air thinner, and the sense of accomplishment greater. You wake before dawn to witness the sun painting the peaks in shades of gold and pink. You share meals with Sherpa families, learning about their way of life and the challenges they face in this harsh yet beautiful environment. As you approach Base Camp, the anticipation builds. When you finally arrive, standing at 5,364 meters with Everest towering above, you realize this is more than a trek—it's a transformation. The journey changes you, teaching resilience, appreciation for nature, and respect for the mountains and the people who call them home.",
      video_url: "https://www.youtube.com/watch?v=example2",
      virtual_tour_url: "",
      testimonial_review_ids: [],
      // Will be populated from actual reviews
      destinations: [],
      // Will be populated
      starting_location: "Kathmandu International Airport",
      ending_location: "Lukla Airport",
      countries: ["Nepal"],
      regions: ["Khumbu Region"],
      starting_latitude: "27.9881",
      starting_longitude: "86.9250",
      ending_latitude: "27.6837",
      ending_longitude: "86.7330",
      landmarks: [
        "Mount Everest",
        "Namche Bazaar",
        "Tengboche Monastery",
        "Kala Patthar"
      ],
      trip_type: "multi_day",
      duration_days: "14",
      duration_nights: "13",
      available_from: new Date(Date.now() + 60 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      available_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      booking_window_days: "60",
      seasonal_availability: "March to May, September to November",
      best_season: "October to November",
      peak_season: "October to November",
      off_season: "December to February, June to August",
      activity_types: [],
      difficulty_level: "",
      trip_category: [],
      tags: ["trekking", "mountains", "adventure", "challenging", "everest"],
      featured_priority: "featured",
      accommodation_type: "Teahouse",
      meal_plan: "full_board",
      accommodation_details: "Traditional teahouses along the route with basic amenities. Rooms are shared, and facilities become more basic as altitude increases.",
      transportation_included: true,
      pickup_location: "Kathmandu International Airport",
      dropoff_location: "Lukla Airport",
      transportation_details: "Domestic flights Kathmandu-Lukla-Kathmandu included. Airport transfers included.",
      pricing_type: "regular",
      original_price: "1899",
      discounted_price: "1699",
      deposit_amount: "500",
      deposit_percentage: "",
      payment_terms: "50% deposit required at booking, remaining 50% due 60 days before departure",
      max_travelers: "12",
      min_travelers: "2",
      booking_deadline_hours: "24",
      cancellation_policy: "Free cancellation up to 60 days before departure. 50% refund for cancellations 30-60 days before. No refund for cancellations less than 30 days before.",
      age_min: "18",
      age_max: "65",
      physical_requirements: "Excellent physical fitness required. Previous trekking experience recommended. Must be able to walk 6-8 hours daily at high altitude.",
      visa_requirements: "Tourist visa required for Nepal. Can be obtained on arrival at airport or in advance. Valid passport required.",
      vaccination_requirements: "Recommended: Hepatitis A, Typhoid, Japanese Encephalitis, and routine vaccinations. Consult with travel health clinic.",
      disable_booking: false,
      has_default_time_slots: false,
      default_time_slots: [],
      departure_time: "",
      included_items: [
        {
          title: "Accommodation",
          description: "13 nights in teahouses along the route"
        },
        {
          title: "All meals",
          description: "Breakfast, lunch, and dinner included"
        },
        {
          title: "Professional guides",
          description: "Experienced mountain guides and porters"
        },
        {
          title: "Permits",
          description: "TIMS and Sagarmatha National Park permits"
        },
        {
          title: "Domestic flights",
          description: "Kathmandu-Lukla-Kathmandu flights"
        },
        {
          title: "Equipment",
          description: "Sleeping bag and down jacket rental"
        }
      ],
      excluded_items: [
        {
          title: "International flights",
          description: "Flights to and from Kathmandu"
        },
        {
          title: "Travel insurance",
          description: "Comprehensive travel and medical insurance required"
        },
        {
          title: "Personal equipment",
          description: "Trekking boots, clothing, and personal items"
        },
        {
          title: "Tips",
          description: "Tips for guides and porters (recommended)"
        },
        {
          title: "Personal expenses",
          description: "Drinks, snacks, and souvenirs"
        }
      ],
      itinerary_days: [],
      gallery_images: [],
      featured_image: null,
      downloadable_items: [],
      faqs: [
        {
          question: "How difficult is the trek?",
          answer: "This is a challenging trek requiring excellent physical fitness. You'll be walking 6-8 hours daily at high altitude. Previous trekking experience is recommended."
        },
        {
          question: "What is the altitude at Base Camp?",
          answer: "Everest Base Camp is located at 5,364 meters (17,598 feet) above sea level."
        },
        {
          question: "What happens if I get altitude sickness?",
          answer: "Our guides are trained to recognize and treat altitude sickness. We have proper acclimatization schedules and emergency descent plans in place."
        }
      ],
      frontend_tabs: [
        {
          id: "overview",
          label: "Overview",
          enabled: true,
          order: 1,
          content_type: "general",
          icon: { type: "icon", value: "book-open" }
        },
        {
          id: "itinerary",
          label: "Itinerary",
          enabled: true,
          order: 2,
          content_type: "itinerary",
          icon: { type: "icon", value: "calendar" }
        },
        {
          id: "included",
          label: "Included",
          enabled: true,
          order: 3,
          content_type: "included_excluded",
          icon: { type: "icon", value: "check" }
        },
        {
          id: "location",
          label: "Location",
          enabled: true,
          order: 4,
          content_type: "gallery",
          icon: { type: "icon", value: "map-pin" }
        },
        {
          id: "important_info",
          label: "Important Info",
          enabled: true,
          order: 5,
          content_type: "general",
          icon: { type: "icon", value: "info" }
        },
        {
          id: "downloads",
          label: "Downloads",
          enabled: true,
          order: 6,
          content_type: "downloads",
          icon: { type: "icon", value: "download" }
        },
        {
          id: "faq",
          label: "FAQ",
          enabled: true,
          order: 7,
          content_type: "faqs",
          icon: { type: "icon", value: "help-circle" }
        },
        {
          id: "trip_story",
          label: "Story",
          enabled: true,
          order: 8,
          content_type: "custom",
          custom_content: "",
          icon: { type: "icon", value: "book" }
        },
        {
          id: "what_makes_special",
          label: "Special",
          enabled: true,
          order: 9,
          content_type: "custom",
          custom_content: "",
          icon: { type: "icon", value: "star" }
        },
        {
          id: "testimonials",
          label: "Testimonials",
          enabled: true,
          order: 10,
          content_type: "reviews",
          icon: { type: "icon", value: "message-circle" }
        }
      ],
      availability_dates: [],
      status: "draft",
      scheduled_publish_date: "",
      scheduled_unpublish_date: "",
      version: 1,
      seasonal_auto_enable: false,
      seasonal_enable_date: "",
      seasonal_disable_date: "",
      meta_title: "Everest Base Camp Trek - 14 Days | Ultimate Himalayan Adventure",
      meta_description: "Embark on the adventure of a lifetime with our 14-day Everest Base Camp trek. Experience Sherpa culture, ancient monasteries, and breathtaking mountain views.",
      meta_keywords: "Everest Base Camp, trekking, Nepal, Himalayas, adventure travel, mountain trek",
      attributes: {},
      price_types: []
    },
    {
      // Trip 3: European City Tour
      title: "European Grand Tour - 10 Days",
      slug: "european-grand-tour-10-days",
      description: "Discover the best of Europe with our 10-day grand tour covering Paris, Rome, and Barcelona. Experience world-famous landmarks, indulge in exquisite cuisine, explore rich history and art, and immerse yourself in diverse European cultures. This carefully crafted journey takes you through three of Europe's most iconic cities, each offering unique experiences and unforgettable memories.",
      short_description: "Discover the best of Europe with our 10-day grand tour covering Paris, Rome, and Barcelona.",
      highlights: [
        "Eiffel Tower and Louvre Museum",
        "Colosseum and Vatican City",
        "Sagrada Familia and Park Güell",
        "World-class cuisine",
        "Professional local guides"
      ],
      trip_details: "Begin your European adventure in the City of Light—Paris. Explore iconic landmarks like the Eiffel Tower, Louvre Museum, and Notre-Dame Cathedral. Stroll along the Champs-Élysées, enjoy a Seine River cruise, and indulge in French pastries at charming cafés. Next, travel to Rome, the Eternal City, where ancient history comes alive. Visit the Colosseum, Roman Forum, and Vatican City with its stunning Sistine Chapel. Enjoy authentic Italian cuisine and gelato while exploring cobblestone streets. Conclude your journey in Barcelona, Spain's vibrant cultural capital. Admire Gaudí's architectural masterpieces including the Sagrada Familia and Park Güell. Experience the lively atmosphere of Las Ramblas, enjoy tapas and sangria, and relax on beautiful Mediterranean beaches.",
      what_makes_special: "This tour includes skip-the-line tickets to major attractions, private guided tours in each city, and carefully selected accommodations in prime locations. Our small group size ensures personalized attention and authentic local experiences.",
      trip_story: "Your European adventure begins as you step off the plane in Paris, greeted by the elegant architecture and romantic atmosphere that has inspired artists for centuries. Each day brings new discoveries—from the artistic treasures of the Louvre to the bohemian charm of Montmartre. In Rome, you walk in the footsteps of emperors and gladiators, feeling the weight of history in every ancient stone. The Vatican's art and architecture leave you in awe, while a simple plate of pasta in a local trattoria reminds you that the best experiences are often the simplest. Barcelona welcomes you with its unique blend of Gothic and Modernist architecture, vibrant street life, and Mediterranean warmth. As you watch the sunset from Park Güell, you realize that this journey has not just shown you three cities—it has shown you three different ways of living, three different approaches to art and culture, and three different reasons to fall in love with Europe.",
      video_url: "https://www.youtube.com/watch?v=example3",
      virtual_tour_url: "",
      testimonial_review_ids: [],
      // Will be populated from actual reviews
      destinations: [],
      starting_location: "Charles de Gaulle Airport (CDG)",
      ending_location: "El Prat Airport (BCN)",
      countries: ["France", "Italy", "Spain"],
      regions: ["Île-de-France", "Lazio", "Catalonia"],
      starting_latitude: "48.8566",
      starting_longitude: "2.3522",
      ending_latitude: "41.3792",
      ending_longitude: "2.1281",
      landmarks: [
        "Eiffel Tower",
        "Colosseum",
        "Sagrada Familia",
        "Louvre Museum",
        "Vatican City"
      ],
      trip_type: "multi_day",
      duration_days: "10",
      duration_nights: "9",
      available_from: new Date(Date.now() + 45 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      available_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      booking_window_days: "45",
      seasonal_availability: "Year-round",
      best_season: "April to June, September to October",
      peak_season: "June to August",
      off_season: "November to March",
      activity_types: [],
      difficulty_level: "",
      trip_category: [],
      tags: ["cultural", "city-tour", "history", "art", "food"],
      featured_priority: "featured",
      accommodation_type: "Hotel",
      meal_plan: "breakfast",
      accommodation_details: "4-star hotels in city centers with easy access to major attractions",
      transportation_included: true,
      pickup_location: "Charles de Gaulle Airport",
      dropoff_location: "El Prat Airport",
      transportation_details: "High-speed train between cities, private transfers, and metro passes included",
      pricing_type: "regular",
      original_price: "2499",
      discounted_price: "",
      price_types: [],
      deposit_amount: "600",
      deposit_percentage: "",
      payment_terms: "40% deposit required at booking, remaining 60% due 45 days before departure",
      max_travelers: "20",
      min_travelers: "4",
      booking_deadline_hours: "24",
      cancellation_policy: "Free cancellation up to 45 days before departure. 75% refund for cancellations 30-45 days before. 50% refund for cancellations 15-30 days before. No refund for cancellations less than 15 days before.",
      age_min: "",
      age_max: "",
      physical_requirements: "Moderate walking required. Some sites involve stairs and uneven surfaces. Suitable for most fitness levels.",
      visa_requirements: "Schengen visa required for most non-EU nationals. Apply well in advance as processing can take several weeks.",
      vaccination_requirements: "No mandatory vaccinations. Routine vaccinations recommended.",
      disable_booking: false,
      has_default_time_slots: false,
      default_time_slots: [],
      departure_time: "",
      included_items: [
        {
          title: "Accommodation",
          description: "9 nights in 4-star city center hotels"
        },
        { title: "Breakfast", description: "Daily breakfast included" },
        {
          title: "Transportation",
          description: "High-speed trains, airport transfers, and city metro passes"
        },
        {
          title: "Guided tours",
          description: "Professional local guides in each city"
        },
        {
          title: "Skip-the-line tickets",
          description: "Priority access to major attractions"
        },
        {
          title: "Welcome dinner",
          description: "Traditional welcome dinner in Paris"
        }
      ],
      excluded_items: [
        {
          title: "International flights",
          description: "Flights to Paris and from Barcelona"
        },
        {
          title: "Lunch and dinner",
          description: "Meals other than breakfast and welcome dinner"
        },
        {
          title: "Travel insurance",
          description: "Travel insurance recommended"
        },
        {
          title: "Personal expenses",
          description: "Souvenirs, tips, and personal items"
        }
      ],
      itinerary_days: [],
      gallery_images: [],
      featured_image: null,
      downloadable_items: [],
      faqs: [
        {
          question: "Do I need a visa?",
          answer: "Most non-EU nationals need a Schengen visa. Apply at the embassy of your first entry country (France) well in advance."
        },
        {
          question: "What languages are spoken?",
          answer: "English-speaking guides provided. Local languages are French, Italian, and Spanish, but English is widely spoken in tourist areas."
        },
        {
          question: "Is this suitable for families?",
          answer: "Yes, this tour is family-friendly. However, some museums and sites may have age restrictions for children."
        }
      ],
      frontend_tabs: [
        {
          id: "overview",
          label: "Overview",
          enabled: true,
          order: 1,
          content_type: "general",
          icon: { type: "icon", value: "book-open" }
        },
        {
          id: "itinerary",
          label: "Itinerary",
          enabled: true,
          order: 2,
          content_type: "itinerary",
          icon: { type: "icon", value: "calendar" }
        },
        {
          id: "included",
          label: "Included",
          enabled: true,
          order: 3,
          content_type: "included_excluded",
          icon: { type: "icon", value: "check" }
        },
        {
          id: "location",
          label: "Location",
          enabled: true,
          order: 4,
          content_type: "gallery",
          icon: { type: "icon", value: "map-pin" }
        },
        {
          id: "important_info",
          label: "Important Info",
          enabled: true,
          order: 5,
          content_type: "general",
          icon: { type: "icon", value: "info" }
        },
        {
          id: "downloads",
          label: "Downloads",
          enabled: true,
          order: 6,
          content_type: "downloads",
          icon: { type: "icon", value: "download" }
        },
        {
          id: "faq",
          label: "FAQ",
          enabled: true,
          order: 7,
          content_type: "faqs",
          icon: { type: "icon", value: "help-circle" }
        },
        {
          id: "trip_story",
          label: "Story",
          enabled: true,
          order: 8,
          content_type: "custom",
          custom_content: "",
          icon: { type: "icon", value: "book" }
        },
        {
          id: "what_makes_special",
          label: "Special",
          enabled: true,
          order: 9,
          content_type: "custom",
          custom_content: "",
          icon: { type: "icon", value: "star" }
        },
        {
          id: "testimonials",
          label: "Testimonials",
          enabled: true,
          order: 10,
          content_type: "reviews",
          icon: { type: "icon", value: "message-circle" }
        }
      ],
      availability_dates: [],
      status: "draft",
      scheduled_publish_date: "",
      scheduled_unpublish_date: "",
      version: 1,
      seasonal_auto_enable: false,
      seasonal_enable_date: "",
      seasonal_disable_date: "",
      meta_title: "European Grand Tour - 10 Days | Paris, Rome & Barcelona",
      meta_description: "Discover the best of Europe with our 10-day grand tour covering Paris, Rome, and Barcelona. Experience iconic landmarks, world-class cuisine, and rich history.",
      meta_keywords: "Europe tour, Paris, Rome, Barcelona, European travel, cultural tour",
      attributes: {}
    }
  ];
  const [formData, setFormData] = reactExports.useState({
    title: "",
    slug: "",
    description: "",
    highlights: [],
    trip_details: "",
    short_description: "",
    what_makes_special: "",
    trip_story: "",
    video_url: "",
    virtual_tour_url: "",
    testimonial_review_ids: [],
    destinations: [],
    // Array of destination IDs
    starting_location: "",
    ending_location: "",
    countries: [],
    regions: [],
    starting_latitude: "",
    starting_longitude: "",
    ending_latitude: "",
    ending_longitude: "",
    landmarks: [],
    trip_type: "multi_day",
    duration_days: "",
    duration_nights: "",
    available_from: "",
    available_to: "",
    booking_window_days: "",
    seasonal_availability: "",
    best_season: "",
    peak_season: "",
    off_season: "",
    activity_types: [],
    // Array of activity IDs
    difficulty_level: "",
    trip_category: [],
    tags: [],
    featured_priority: "none",
    accommodation_type: "",
    meal_plan: "",
    accommodation_details: "",
    transportation_included: false,
    pickup_location: "",
    dropoff_location: "",
    transportation_details: "",
    pricing_type: "regular",
    original_price: "",
    discounted_price: "",
    price_types: [],
    deposit_amount: "",
    deposit_percentage: "",
    payment_terms: "",
    max_travelers: "10",
    min_travelers: "2",
    booking_deadline_hours: "24",
    cancellation_policy: "Flexible",
    age_min: "18",
    age_max: "65",
    physical_requirements: "Moderate",
    visa_requirements: "Schengen visa",
    vaccination_requirements: "COVID-19 vaccination",
    disable_booking: false,
    has_default_time_slots: false,
    default_time_slots: [],
    departure_time: "09:00",
    included_items: [],
    excluded_items: [],
    attributes: {},
    // attribute_id -> value mapping
    itinerary_days: [],
    gallery_images: [],
    featured_image: null,
    downloadable_items: [],
    faqs: [],
    frontend_tabs: [
      {
        id: "overview",
        label: "Overview",
        enabled: true,
        order: 1,
        content_type: "general",
        icon: { type: "icon", value: "book-open" }
      },
      {
        id: "itinerary",
        label: "Itinerary",
        enabled: true,
        order: 2,
        content_type: "itinerary",
        icon: { type: "icon", value: "calendar" }
      },
      {
        id: "included",
        label: "Included",
        enabled: true,
        order: 3,
        content_type: "included_excluded",
        icon: { type: "icon", value: "check" }
      },
      {
        id: "location",
        label: "Location",
        enabled: true,
        order: 4,
        content_type: "gallery",
        icon: { type: "icon", value: "map-pin" }
      },
      {
        id: "important_info",
        label: "Important Info",
        enabled: true,
        order: 5,
        content_type: "general",
        icon: { type: "icon", value: "info" }
      },
      {
        id: "downloads",
        label: "Downloads",
        enabled: true,
        order: 6,
        content_type: "downloads",
        icon: { type: "icon", value: "download" }
      },
      {
        id: "faq",
        label: "FAQ",
        enabled: true,
        order: 7,
        content_type: "faqs",
        icon: { type: "icon", value: "help-circle" }
      },
      {
        id: "trip_story",
        label: "Story",
        enabled: true,
        order: 8,
        content_type: "custom",
        custom_content: "",
        icon: { type: "icon", value: "book" }
      },
      {
        id: "what_makes_special",
        label: "Special",
        enabled: true,
        order: 9,
        content_type: "custom",
        custom_content: "",
        icon: { type: "icon", value: "star" }
      },
      {
        id: "testimonials",
        label: "Testimonials",
        enabled: true,
        order: 10,
        content_type: "reviews",
        icon: { type: "icon", value: "message-circle" }
      }
    ],
    availability_dates: [],
    status: "draft",
    scheduled_publish_date: "",
    scheduled_unpublish_date: "",
    version: 1,
    seasonal_auto_enable: false,
    seasonal_enable_date: "",
    seasonal_disable_date: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: ""
  });
  const [errors, setErrors] = reactExports.useState({});
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const [copiedErrorDetails, setCopiedErrorDetails] = reactExports.useState(false);
  const copyErrorDetailsToClipboard = (text) => {
    var _a2;
    if (!text) return;
    const fallbackCopy = () => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch (e) {
      }
      document.body.removeChild(textarea);
      setCopiedErrorDetails(true);
      setTimeout(() => setCopiedErrorDetails(false), 1500);
    };
    try {
      if ((_a2 = navigator == null ? void 0 : navigator.clipboard) == null ? void 0 : _a2.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          setCopiedErrorDetails(true);
          setTimeout(() => setCopiedErrorDetails(false), 1500);
        }).catch(() => fallbackCopy());
      } else {
        fallbackCopy();
      }
    } catch {
      fallbackCopy();
    }
  };
  const action = reactExports.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") || "create";
  }, []);
  const tripId = reactExports.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") ? parseInt(params.get("id") || "0") : null;
  }, []);
  const isEditMode = action === "edit" && tripId !== null;
  const { data: travelerCategoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["traveler-categories"],
    queryFn: async () => {
      var _a2;
      try {
        const response = await apiClient.get("/traveler-categories", {
          params: {
            per_page: 100,
            status: "publish"
            // Only get published categories
          }
        });
        const categories = ((_a2 = response == null ? void 0 : response.data) == null ? void 0 : _a2.data) || (response == null ? void 0 : response.data) || response || [];
        return Array.isArray(categories) ? categories : [];
      } catch (error) {
        showToast(
          (error == null ? void 0 : error.message) || __$1("Failed to load traveler categories", "yatra"),
          "error"
        );
        return [];
      }
    },
    enabled: can("yatra_view_trips") && (currentSection === "pricing" || visitedSections.has("pricing")),
    staleTime: 5 * 60 * 1e3
    // Cache for 5 minutes
  });
  const activeCategories = reactExports.useMemo(() => {
    const categories = travelerCategoriesData || [];
    return categories.filter(
      (cat) => cat.status === "active" || cat.status === "publish"
    );
  }, [travelerCategoriesData]);
  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        const response = await fetchSettings();
        return response;
      } catch (error) {
        return { currency: "USD" };
      }
    },
    enabled: can("yatra_view_trips")
  });
  const cur = settingsData == null ? void 0 : settingsData.currency;
  const defCur = settingsData == null ? void 0 : settingsData.default_currency;
  const globalCurrency = typeof cur === "string" && cur.length > 0 ? cur : typeof defCur === "string" && defCur.length > 0 ? defCur : "USD";
  const { data: activitiesData } = useQuery({
    queryKey: ["activities-published"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/activities", {
          params: {
            per_page: 100,
            status: "publish"
            // Only get published activities
          }
        });
        return response.data || [];
      } catch (error) {
        showToast(
          (error == null ? void 0 : error.message) || __$1("Failed to load activities", "yatra"),
          "error"
        );
        return [];
      }
    },
    enabled: can("yatra_view_trips") && (currentSection === "categorization" || visitedSections.has("categorization")),
    staleTime: 5 * 60 * 1e3
    // Cache for 5 minutes
  });
  const { data: tripCategoriesResponse } = useQuery({
    queryKey: ["trip-categories", "published"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/trip-categories", {
          params: {
            per_page: 100,
            status: "publish",
            hierarchical: true,
            orderby: "name",
            order: "ASC"
          }
        });
        return response;
      } catch (error) {
        showToast(
          (error == null ? void 0 : error.message) || __$1("Failed to load trip categories", "yatra"),
          "error"
        );
        return [];
      }
    },
    enabled: can("yatra_view_trips"),
    staleTime: 5 * 60 * 1e3
    // Cache for 5 minutes
  });
  const {
    data: difficultyLevelsResponse,
    isLoading: isLoadingDifficultyLevels
  } = useQuery({
    queryKey: ["difficulty-levels", "published"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/difficulty-levels", {
          params: {
            per_page: 100,
            status: "publish",
            orderby: "sorting",
            order: "ASC"
          }
        });
        return response.data || [];
      } catch (error) {
        showToast(
          (error == null ? void 0 : error.message) || __$1("Failed to load difficulty levels", "yatra"),
          "error"
        );
        return [];
      }
    },
    enabled: can("yatra_view_trips") && (currentSection === "categorization" || visitedSections.has("categorization")),
    staleTime: 5 * 60 * 1e3
    // Cache for 5 minutes
  });
  const tripCategories = reactExports.useMemo(() => {
    const payload = extractArrayPayload(tripCategoriesResponse);
    return payload.filter((category) => {
      if (!category) return false;
      if (typeof category !== "object") return false;
      if ("status" in category && category.status && category.status !== "publish") {
        return false;
      }
      return true;
    });
  }, [tripCategoriesResponse]);
  const difficultyLevels = reactExports.useMemo(() => {
    const payload = extractArrayPayload(difficultyLevelsResponse);
    return payload.filter((level) => {
      if (!level) return false;
      if (typeof level !== "object") return false;
      if ("status" in level && level.status && level.status !== "publish") {
        return false;
      }
      return true;
    });
  }, [difficultyLevelsResponse]);
  const { data: destinationsData } = useQuery({
    queryKey: ["destinations-published"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/destinations", {
          params: {
            per_page: 100,
            status: "publish"
            // Only get published destinations
          }
        });
        return response.data || [];
      } catch (error) {
        showToast(
          (error == null ? void 0 : error.message) || __$1("Failed to load destinations", "yatra"),
          "error"
        );
        return [];
      }
    },
    enabled: can("yatra_view_trips") && (isEditMode || currentSection === "location" || visitedSections.has("location")),
    staleTime: 5 * 60 * 1e3
    // Cache for 5 minutes
  });
  const {
    data: tripData,
    isLoading: isLoadingTrip,
    error: tripError
  } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      if (!tripId) return null;
      try {
        const response = await apiClient.get(`/trips/${tripId}`);
        const tripData2 = (response == null ? void 0 : response.data) || response;
        return tripData2;
      } catch (error) {
        console.error("Error loading trip:", error);
        showToast(
          (error == null ? void 0 : error.message) || __$1("Failed to load trip data", "yatra"),
          "error"
        );
        throw error;
      }
    },
    enabled: !!tripId && isEditMode,
    staleTime: 0
    // Always fetch fresh data to ensure downloadable items persist after save
  });
  const tripErrorContext = reactExports.useMemo(
    () => getErrorContext(tripError),
    [tripError]
  );
  const tripAttributesQueryEnabled = Boolean(tripId && isEditMode);
  const { data: tripAttributesData, isPending: isTripAttributesPending } = useQuery({
    queryKey: ["trip-attributes", tripId],
    queryFn: async () => {
      var _a2;
      if (!tripId) return {};
      try {
        const response = await apiClient.get(`/trips/${tripId}/attributes`);
        let payload = response == null ? void 0 : response.data;
        if (!payload || !Array.isArray(payload)) {
          payload = response;
        }
        if (!payload || !Array.isArray(payload)) {
          payload = (_a2 = response == null ? void 0 : response.data) == null ? void 0 : _a2.data;
        }
        const attributes = Array.isArray(payload) ? payload : Array.isArray(payload == null ? void 0 : payload.data) ? payload.data : [];
        const attributesMap = {};
        attributes.forEach((attr) => {
          const attributeId = Number(attr.attribute_id || attr.id);
          if (attributeId) {
            let value = "";
            if (attr.relationship_metadata) {
              try {
                const metadata = typeof attr.relationship_metadata === "string" ? JSON.parse(attr.relationship_metadata) : attr.relationship_metadata;
                value = metadata.value || "";
              } catch (e) {
                console.warn(
                  "Failed to parse relationship_metadata:",
                  attr.relationship_metadata,
                  e
                );
                value = "";
              }
            } else {
              value = attr.value || "";
            }
            attributesMap[attributeId] = value;
          }
        });
        return attributesMap;
      } catch (error) {
        console.error("Failed to fetch trip attributes:", error);
        return {};
      }
    },
    enabled: tripAttributesQueryEnabled,
    staleTime: 5 * 60 * 1e3
    // Cache for 5 minutes
  });
  const tripAttributesReady = !tripAttributesQueryEnabled || !isTripAttributesPending;
  const normalizeHighlights = (highlights) => {
    if (!highlights) return [];
    if (Array.isArray(highlights)) {
      return highlights.map((h) => {
        if (typeof h === "string") return h;
        if (h && typeof h === "object") {
          return h.highlight_text || h.text || h.title || String(h);
        }
        return String(h);
      }).filter((h) => h.trim().length > 0);
    }
    if (typeof highlights === "string") {
      try {
        const parsed = JSON.parse(highlights);
        return normalizeHighlights(parsed);
      } catch {
        return [highlights];
      }
    }
    return [];
  };
  const normalizeDownloadableItems = (items) => {
    if (!items || !Array.isArray(items)) return [];
    return items.filter((row) => row && typeof row === "object").map((row, idx) => {
      const rawVisibility = row.visibility ?? "booked_only";
      const mappedVisibility = rawVisibility === "paid_only" ? "booked_only" : rawVisibility;
      const safeVisibility = [
        "public",
        "logged_in",
        "booked_only"
      ].includes(mappedVisibility) ? mappedVisibility : "booked_only";
      const title = (row.title ?? row.download_title ?? row.downlaod_title ?? "").toString();
      const description = (row.description ?? row.download_description ?? row.downlaod_description ?? "").toString();
      const attachmentIdRaw = row.attachment_id ?? row.download_file ?? row.downlaod_file;
      const attachmentUrl = (row.attachment_url ?? row.content_url ?? "").toString();
      const attachmentTitle = (row.attachment_title ?? "").toString();
      const enabledRaw = row.enabled ?? row.is_downloadable ?? row.download_enabled ?? row.downlaod_enabled;
      return {
        id: row.id != null ? Number(row.id) : null,
        title,
        description,
        attachment_id: attachmentIdRaw != null ? Number(attachmentIdRaw) : null,
        attachment_url: attachmentUrl,
        attachment_title: attachmentTitle,
        visibility: safeVisibility,
        enabled: enabledRaw != null ? Boolean(enabledRaw) : true,
        sort_order: row.sort_order != null ? Number(row.sort_order) : idx + 1
      };
    });
  };
  const extractIds = (items) => {
    if (!items || !Array.isArray(items)) return [];
    return items.map((item) => {
      if (typeof item === "number") return item;
      if (typeof item === "string") return parseInt(item) || 0;
      if (item && typeof item === "object") {
        return item.id || item.destination_id || item.activity_id || item.category_id || 0;
      }
      return 0;
    }).filter((id) => !isNaN(id) && id > 0);
  };
  const normalizeItineraryDays = (days) => {
    if (!days) return [];
    if (Array.isArray(days)) return days;
    if (typeof days === "string") {
      try {
        const parsed = JSON.parse(days);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };
  const normalizeAvailabilityDates = (dates) => {
    if (!dates) return [];
    if (Array.isArray(dates)) return dates;
    if (typeof dates === "string") {
      try {
        const parsed = JSON.parse(dates);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };
  const normalizeGalleryImages = (images) => {
    if (!images) return [];
    if (Array.isArray(images)) {
      return images.map((img) => {
        if (typeof img === "string") {
          return { id: 0, url: img };
        }
        if (img && typeof img === "object") {
          return {
            id: img.id || img.image_id || 0,
            url: img.url || img.image_url || img.src || "",
            thumbnail_url: img.thumbnail_url || img.thumb_url || "",
            alt_text: img.alt_text || img.alt || "",
            caption: img.caption || img.title || ""
          };
        }
        return { id: 0, url: "" };
      }).filter((item) => item.url);
    }
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        return normalizeGalleryImages(parsed);
      } catch {
        return [{ id: 0, url: images }];
      }
    }
    return [];
  };
  const normalizeFaqs = (faqs) => {
    if (!faqs || !Array.isArray(faqs)) return [];
    return faqs.map((faq) => {
      if (faq && typeof faq === "object") {
        return {
          question: faq.question || "",
          answer: faq.answer || ""
        };
      }
      return { question: "", answer: "" };
    }).filter((faq) => faq.question && faq.answer);
  };
  reactExports.useEffect(() => {
    var _a2, _b2, _c2, _d2, _e2, _f2, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
    if (!tripData || !isEditMode) {
      return;
    }
    const currentItineraryDays = formData.itinerary_days || [];
    const currentGalleryImages = formData.gallery_images || [];
    const shouldPreserveItinerary = currentItineraryDays.length > 0;
    const shouldPreserveGallery = currentGalleryImages.length > 0;
    setFormData({
      title: tripData.title || "",
      slug: tripData.slug || "",
      description: tripData.description || "",
      highlights: normalizeHighlights(tripData.highlights),
      trip_details: tripData.trip_details || "",
      short_description: tripData.short_description || "",
      what_makes_special: tripData.what_makes_special || "",
      trip_story: tripData.trip_story || "",
      video_url: tripData.video_url || "",
      virtual_tour_url: tripData.virtual_tour_url || "",
      testimonial_review_ids: Array.isArray(tripData.testimonial_review_ids) ? tripData.testimonial_review_ids : [],
      destinations: extractIds(tripData.destinations || []),
      starting_location: tripData.starting_location || "",
      ending_location: tripData.ending_location || "",
      countries: Array.isArray(tripData.countries) ? tripData.countries : [],
      regions: Array.isArray(tripData.regions) ? tripData.regions : [],
      starting_latitude: ((_a2 = tripData.starting_latitude) == null ? void 0 : _a2.toString()) || "",
      starting_longitude: ((_b2 = tripData.starting_longitude) == null ? void 0 : _b2.toString()) || "",
      ending_latitude: ((_c2 = tripData.ending_latitude) == null ? void 0 : _c2.toString()) || "",
      ending_longitude: ((_d2 = tripData.ending_longitude) == null ? void 0 : _d2.toString()) || "",
      landmarks: Array.isArray(tripData.landmarks) ? tripData.landmarks : [],
      trip_type: tripData.trip_type || (tripData.duration_days && parseInt(((_e2 = tripData.duration_days) == null ? void 0 : _e2.toString()) || "0") === 1 ? "single_day" : "multi_day"),
      duration_days: ((_f2 = tripData.duration_days) == null ? void 0 : _f2.toString()) || "",
      duration_nights: ((_g = tripData.duration_nights) == null ? void 0 : _g.toString()) || "",
      available_from: tripData.available_from || "",
      available_to: tripData.available_to || "",
      booking_window_days: ((_h = tripData.booking_window_days) == null ? void 0 : _h.toString()) || "",
      seasonal_availability: tripData.seasonal_availability || "",
      best_season: tripData.best_season || "",
      peak_season: tripData.peak_season || "",
      off_season: tripData.off_season || "",
      activity_types: extractIds(tripData.activity_types || []),
      difficulty_level: ((_i = tripData.difficulty_level) == null ? void 0 : _i.toString()) || "",
      trip_category: extractIds(tripData.trip_category || []),
      tags: Array.isArray(tripData.tags) ? tripData.tags : [],
      featured_priority: tripData.featured_priority || "none",
      accommodation_type: tripData.accommodation_type || "",
      meal_plan: tripData.meal_plan || "",
      accommodation_details: tripData.accommodation_details || "",
      transportation_included: tripData.transportation_included || false,
      pickup_location: tripData.pickup_location || "",
      dropoff_location: tripData.dropoff_location || "",
      transportation_details: tripData.transportation_details || "",
      pricing_type: tripData.pricing_type || (tripData.price_types && Array.isArray(tripData.price_types) && tripData.price_types.length > 0 ? "traveler_based" : "regular"),
      original_price: ((_j = tripData.original_price) == null ? void 0 : _j.toString()) || "",
      discounted_price: ((_k = tripData.discounted_price) == null ? void 0 : _k.toString()) || "",
      price_types: Array.isArray(tripData.price_types) ? tripData.price_types.map((pt) => {
        var _a3, _b3;
        return {
          category_id: Number(pt.category_id) || 0,
          original_price: ((_a3 = pt.original_price) == null ? void 0 : _a3.toString()) || "",
          discounted_price: ((_b3 = pt.discounted_price) == null ? void 0 : _b3.toString()) || "",
          is_default: Boolean(pt.is_default)
        };
      }) : [],
      deposit_amount: ((_l = tripData.deposit_amount) == null ? void 0 : _l.toString()) || "",
      deposit_percentage: ((_m = tripData.deposit_percentage) == null ? void 0 : _m.toString()) || "",
      payment_terms: tripData.payment_terms || "",
      max_travelers: ((_n = tripData.max_travelers) == null ? void 0 : _n.toString()) || "",
      min_travelers: ((_o = tripData.min_travelers) == null ? void 0 : _o.toString()) || "",
      booking_deadline_hours: tripData.booking_deadline_hours || "",
      cancellation_policy: tripData.cancellation_policy || "",
      age_min: ((_p = tripData.age_min) == null ? void 0 : _p.toString()) || "",
      age_max: ((_q = tripData.age_max) == null ? void 0 : _q.toString()) || "",
      physical_requirements: tripData.physical_requirements || "",
      visa_requirements: tripData.visa_requirements || "",
      vaccination_requirements: tripData.vaccination_requirements || "",
      disable_booking: Boolean((_r = tripData.custom_fields) == null ? void 0 : _r.disable_booking),
      // tinyint(1) columns can serialize from PHP/wpdb as the string "0"/"1".
      // JS treats "0" as truthy, so a plain `value || false` would leave the
      // checkbox stuck on after the user un-checked + saved. Coerce explicitly.
      has_default_time_slots: tripData.has_default_time_slots === true || tripData.has_default_time_slots === 1 || tripData.has_default_time_slots === "1",
      default_time_slots: Array.isArray(tripData.default_time_slots) ? tripData.default_time_slots : tripData.default_time_slots ? JSON.parse(tripData.default_time_slots) : [],
      departure_time: tripData.departure_time || "09:00",
      included_items: normalizeAmenityItems(tripData.included_items),
      excluded_items: normalizeAmenityItems(tripData.excluded_items),
      // Preserve current itinerary data if it exists, otherwise use database data
      itinerary_days: shouldPreserveItinerary ? currentItineraryDays : normalizeItineraryDays(tripData.itinerary_days),
      // Preserve current gallery data if it exists, otherwise use database data
      gallery_images: shouldPreserveGallery ? currentGalleryImages : normalizeGalleryImages(tripData.gallery_images),
      featured_image: tripData.featured_image ? Number(tripData.featured_image) : null,
      downloadable_items: normalizeDownloadableItems(
        tripData.downloadable_items
      ),
      faqs: normalizeFaqs(tripData.faqs),
      frontend_tabs: Array.isArray(tripData.frontend_tabs) ? tripData.frontend_tabs : [
        // Core sections (always present) - in logical order
        {
          id: "overview",
          label: "Overview",
          enabled: true,
          order: 1,
          content_type: "overview",
          icon: { type: "icon", value: "book" }
        },
        {
          id: "itinerary",
          label: "Itinerary",
          enabled: true,
          order: 2,
          content_type: "itinerary",
          icon: { type: "icon", value: "calendar" }
        },
        {
          id: "included",
          label: "Included",
          enabled: true,
          order: 3,
          content_type: "included_excluded",
          icon: { type: "icon", value: "check" }
        },
        {
          id: "location",
          label: "Location",
          enabled: true,
          order: 4,
          content_type: "location",
          icon: { type: "icon", value: "map-pin" }
        },
        {
          id: "important_info",
          label: "Important Info",
          enabled: true,
          order: 5,
          content_type: "important_info",
          icon: { type: "icon", value: "info" }
        },
        // Conditional sections (enabled by default, shown conditionally on frontend)
        {
          id: "downloads",
          label: "Downloads",
          enabled: true,
          order: 6,
          content_type: "downloads",
          icon: { type: "icon", value: "download" }
        },
        {
          id: "faq",
          label: "FAQ",
          enabled: true,
          order: 7,
          content_type: "faq",
          icon: { type: "icon", value: "help-circle" }
        },
        {
          id: "trip_story",
          label: "Story",
          enabled: true,
          order: 8,
          content_type: "trip_story",
          custom_content: "",
          icon: { type: "icon", value: "book" }
        },
        {
          id: "what_makes_special",
          label: "Special",
          enabled: true,
          order: 9,
          content_type: "what_makes_special",
          custom_content: "",
          icon: { type: "icon", value: "star" }
        },
        {
          id: "testimonials",
          label: "Testimonials",
          enabled: true,
          order: 10,
          content_type: "testimonials",
          icon: { type: "icon", value: "message-circle" }
        }
      ],
      availability_dates: normalizeAvailabilityDates(
        tripData.availability_dates
      ),
      status: tripData.status || "draft",
      scheduled_publish_date: tripData.scheduled_publish_date || "",
      scheduled_unpublish_date: tripData.scheduled_unpublish_date || "",
      version: tripData.version || 1,
      seasonal_auto_enable: tripData.seasonal_auto_enable || false,
      seasonal_enable_date: tripData.seasonal_enable_date || "",
      seasonal_disable_date: tripData.seasonal_disable_date || "",
      meta_title: tripData.meta_title || "",
      meta_description: tripData.meta_description || "",
      meta_keywords: tripData.meta_keywords || "",
      attributes: tripAttributesData || {}
    });
    if (tripData.featured_image_url && tripData.featured_image) {
      const numericId = Number(tripData.featured_image) || 0;
      setFeaturedImagePreview(tripData.featured_image_url);
      if (numericId > 0) {
        featuredImageCache.current[numericId] = tripData.featured_image_url;
      }
    } else if (!tripData.featured_image) {
      setFeaturedImagePreview("");
    }
  }, [tripData, tripAttributesData, destinationsData, isEditMode, tripId]);
  reactExports.useEffect(() => {
    let isMounted = true;
    const resolveFeaturedImage = async () => {
      const attachmentId = formData.featured_image;
      if (!attachmentId) {
        setFeaturedImagePreview("");
        return;
      }
      const cachedUrl = featuredImageCache.current[attachmentId];
      if (cachedUrl) {
        setFeaturedImagePreview(cachedUrl);
        return;
      }
      if (!mediaBaseUrl) {
        setFeaturedImagePreview("");
        return;
      }
      setIsResolvingFeaturedImage(true);
      try {
        const data = await wpService.getMedia(attachmentId);
        const url = (data == null ? void 0 : data.source_url) || "";
        if (url && isMounted) {
          featuredImageCache.current[attachmentId] = url;
          setFeaturedImagePreview(url);
        } else if (isMounted) {
          setFeaturedImagePreview("");
        }
      } catch (error) {
        console.error("Failed to resolve featured image URL:", error);
        if (isMounted) {
          setFeaturedImagePreview("");
        }
      } finally {
        if (isMounted) {
          setIsResolvingFeaturedImage(false);
        }
      }
    };
    resolveFeaturedImage();
    return () => {
      isMounted = false;
    };
  }, [formData.featured_image, mediaBaseUrl]);
  const getSectionErrors = (sectionId) => {
    const errorMap = {
      basic: [
        "title",
        "slug",
        "description",
        "featured_image",
        "trip_type",
        "duration_days",
        "duration_nights"
      ],
      location: ["destinations", "starting_location", "ending_location"],
      duration: ["available_from", "available_to", "booking_window_days"],
      pricing: ["original_price", "discounted_price", "price_types"],
      booking: ["min_travelers", "max_travelers", "age_min", "age_max"],
      attributes: ["attributes"],
      itinerary: ["itinerary_days"],
      included: ["included_items", "excluded_items"],
      media: ["gallery_images", "video_url", "virtual_tour_url"],
      // Removed featured_image - it's in basic section
      downloads: ["downloadable_items"],
      categorization: ["trip_category", "activity_types"],
      faqs: ["faqs"],
      seo: ["meta_title", "meta_description"],
      advanced: []
    };
    const sectionFields = errorMap[sectionId] || [];
    const fieldErrors = sectionFields.filter((field) => errors[field]);
    if (sectionId === "pricing") {
      const priceTypeErrors = Object.keys(errors).filter(
        (key) => key.startsWith("price_type_")
      );
      return [...fieldErrors, ...priceTypeErrors];
    }
    return fieldErrors;
  };
  const essentialsSections = [
    // 1. Trip Basics - What you're offering
    {
      id: "basic",
      label: __$1("Trip Basics", "yatra"),
      icon: FileText,
      required: true,
      completed: !!(((_a = formData.title) == null ? void 0 : _a.trim()) && ((_b = formData.slug) == null ? void 0 : _b.trim())),
      hasErrors: getSectionErrors("basic").length > 0
    },
    // 2. Location & Route - Where it happens
    {
      id: "location",
      label: __$1("Location & Route", "yatra"),
      icon: MapPin,
      required: false,
      completed: !!(formData.destinations.length > 0),
      hasErrors: getSectionErrors("location").length > 0
    },
    // 3. Pricing - How much it costs
    {
      id: "pricing",
      label: __$1("Pricing", "yatra"),
      icon: DollarSign,
      required: true,
      completed: formData.pricing_type === "regular" ? !!(formData.original_price && parseFloat(formData.original_price) > 0) : formData.price_types.some(
        (pt) => pt.original_price && parseFloat(pt.original_price) > 0
      ),
      hasErrors: getSectionErrors("pricing").length > 0
    },
    // 4. Availability & Booking - When available + booking rules (merged duration + booking)
    {
      id: "duration",
      label: __$1("Availability & Booking", "yatra"),
      icon: Calendar,
      required: false,
      completed: !!(formData.available_from || formData.available_to || formData.min_travelers && formData.max_travelers),
      hasErrors: getSectionErrors("duration").length > 0 || getSectionErrors("booking").length > 0
    }
  ];
  const detailsSections = [
    // 5. Trip Details - Description + Itinerary + Included/Excluded (merged 3 sections)
    {
      id: "itinerary",
      label: __$1("Trip Details", "yatra"),
      icon: BookOpen,
      required: false,
      completed: formData.itinerary_days.length > 0 || formData.included_items.length > 0 || formData.excluded_items.length > 0,
      hasErrors: getSectionErrors("itinerary").length > 0 || getSectionErrors("included").length > 0
    }
  ];
  const optimizationSections = [
    // 6. Media & Gallery - Photos, videos, testimonials
    {
      id: "media",
      label: __$1("Media & Gallery", "yatra"),
      icon: Image,
      required: false,
      completed: formData.gallery_images.length > 0 || !!formData.video_url,
      hasErrors: getSectionErrors("media").length > 0
    },
    ...[
      {
        id: "downloads",
        label: __$1("Downloads", "yatra"),
        icon: Download,
        required: false,
        completed: (formData.downloadable_items || []).length > 0,
        hasErrors: getSectionErrors("downloads").length > 0
      }
    ],
    // 7. Categories & Attributes - Classification + Custom Attributes (merged 2 sections)
    {
      id: "categorization",
      label: __$1("Categories & Attributes", "yatra"),
      icon: Tag,
      required: false,
      completed: !!(formData.trip_category || formData.activity_types.length > 0 || formData.tags.length > 0 || formData.attributes && Object.keys(formData.attributes).length > 0),
      hasErrors: getSectionErrors("categorization").length > 0 || getSectionErrors("attributes").length > 0
    },
    // 8. SEO & Marketing - SEO + FAQs (merged, fixed duplicate)
    {
      id: "seo",
      label: __$1("SEO & Marketing", "yatra"),
      icon: Search,
      required: false,
      completed: !!(formData.meta_title || formData.meta_description || formData.faqs.length > 0),
      hasErrors: getSectionErrors("seo").length > 0 || getSectionErrors("faqs").length > 0
    }
  ];
  const advancedSections = [
    // 9. Advanced Settings - Publishing, scheduling, technical
    {
      id: "advanced",
      label: __$1("Advanced Settings", "yatra"),
      icon: Settings,
      required: false,
      completed: false,
      hasErrors: false
    }
  ];
  const allSections = [
    ...essentialsSections,
    ...detailsSections,
    ...optimizationSections,
    ...advancedSections
  ];
  const currentStepIndex = allSections.findIndex(
    (s) => s.id === currentSection
  );
  const goToNextSection = () => {
    if (currentStepIndex < allSections.length - 1) {
      setCurrentSection(allSections[currentStepIndex + 1].id);
    }
  };
  const goToPreviousSection = () => {
    if (currentStepIndex > 0) {
      setCurrentSection(allSections[currentStepIndex - 1].id);
    }
  };
  reactExports.useEffect(() => {
    if (formData.duration_days && formData.trip_type === "multi_day" && (!formData.duration_nights || formData.duration_nights === "")) {
      const days = parseInt(formData.duration_days);
      if (days > 0 && !isNaN(days)) {
        setFormData((prev) => ({
          ...prev,
          duration_nights: String(Math.max(0, days - 1))
        }));
      }
    }
  }, [formData.duration_days, formData.trip_type]);
  reactExports.useEffect(() => {
    if (formData.duration_nights && formData.trip_type === "multi_day" && (!formData.duration_days || formData.duration_days === "")) {
      const nights = parseInt(formData.duration_nights);
      if (nights > 0 && !isNaN(nights)) {
        setFormData((prev) => ({ ...prev, duration_days: String(nights + 1) }));
      }
    }
  }, [formData.duration_nights, formData.trip_type]);
  const generateSlug = (title) => {
    return title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
  };
  const handleTitleChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value)
    }));
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: "" }));
    }
  };
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (field === "featured_image") {
      if (value === null || value === "" || value === void 0) {
        setFeaturedImagePreview("");
      } else {
        const numericValue = typeof value === "number" ? value : Number(value);
        if (!numericValue) {
          setFeaturedImagePreview("");
        } else if (featuredImageCache.current[numericValue]) {
          setFeaturedImagePreview(featuredImageCache.current[numericValue]);
        }
      }
    }
  };
  const handleHighlightAdd = () => {
    setShowHighlightModal(true);
    setModalInput({ text: "", question: "", answer: "" });
  };
  const handleHighlightSave = () => {
    if (modalInput.text && modalInput.text.trim()) {
      setFormData((prev) => ({
        ...prev,
        highlights: [...prev.highlights, modalInput.text.trim()]
      }));
      setShowHighlightModal(false);
      setModalInput({ text: "", question: "", answer: "" });
    }
  };
  const handleHighlightRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }));
  };
  const handleFAQAdd = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }]
    }));
  };
  const handleFAQRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };
  const handleFAQChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.map(
        (faq, i) => i === index ? { ...faq, [field]: value } : faq
      )
    }));
  };
  const handleGalleryAdd = () => {
    if (window.wp && window.wp.media) {
      const mediaUploader = window.wp.media({
        title: __$1("Select Gallery Images", "yatra"),
        button: { text: __$1("Add to Gallery", "yatra") },
        multiple: true,
        // Allow multiple image selection
        library: { type: "image" }
      });
      mediaUploader.on("select", () => {
        const selection = mediaUploader.state().get("selection");
        const newImages = [];
        selection.each((attachment) => {
          var _a2, _b2, _c2, _d2;
          const image = attachment.toJSON();
          if (image.url) {
            newImages.push({
              id: image.id || 0,
              url: image.url,
              thumbnail_url: ((_b2 = (_a2 = image.sizes) == null ? void 0 : _a2.thumbnail) == null ? void 0 : _b2.url) || ((_d2 = (_c2 = image.sizes) == null ? void 0 : _c2.medium) == null ? void 0 : _d2.url) || image.url,
              alt_text: image.alt || "",
              caption: image.caption || ""
            });
          }
        });
        if (newImages.length > 0) {
          setFormData((prev) => ({
            ...prev,
            gallery_images: [...prev.gallery_images, ...newImages]
          }));
        }
      });
      prepareWordPressMediaFrameOpen();
      mediaUploader.open();
    } else {
      showToast(
        __$1(
          "Media library not available. Please ensure you are logged in as admin.",
          "yatra"
        ),
        "error"
      );
    }
  };
  const handleGalleryRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index)
    }));
  };
  const handleGalleryReorder = (fromIndex, toIndex) => {
    setFormData((prev) => {
      const newImages = [...prev.gallery_images];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return { ...prev, gallery_images: newImages };
    });
  };
  const handleDownloadableItemAdd = () => {
    setFormData((prev) => {
      var _a2;
      const nextOrder = (((_a2 = prev.downloadable_items) == null ? void 0 : _a2.length) || 0) + 1;
      return {
        ...prev,
        downloadable_items: [
          ...prev.downloadable_items || [],
          {
            id: null,
            title: "",
            description: "",
            attachment_id: null,
            attachment_url: "",
            attachment_title: "",
            visibility: "booked_only",
            enabled: true,
            sort_order: nextOrder
          }
        ]
      };
    });
  };
  const handleDownloadableItemRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      downloadable_items: (prev.downloadable_items || []).filter(
        (_, i) => i !== index
      )
    }));
  };
  const handleDownloadableItemMove = (fromIndex, toIndex) => {
    setFormData((prev) => {
      const items = [...prev.downloadable_items || []];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      const normalized = items.map((item, idx) => ({
        ...item,
        sort_order: idx + 1
      }));
      return { ...prev, downloadable_items: normalized };
    });
  };
  const handleDownloadableItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      downloadable_items: (prev.downloadable_items || []).map(
        (item, i) => i === index ? { ...item, [field]: value } : item
      )
    }));
  };
  const handleDownloadableItemSelectFile = (index) => {
    if (window.wp && window.wp.media) {
      const mediaUploader = window.wp.media({
        title: __$1("Select File", "yatra"),
        button: { text: __$1("Use this file", "yatra") },
        multiple: false
      });
      mediaUploader.on("select", () => {
        const selection = mediaUploader.state().get("selection");
        const attachment = selection.first();
        if (!attachment) return;
        const file = attachment.toJSON();
        handleDownloadableItemChange(index, "attachment_id", file.id || null);
        handleDownloadableItemChange(index, "attachment_url", file.url || "");
        handleDownloadableItemChange(
          index,
          "attachment_title",
          file.title || file.filename || ""
        );
      });
      prepareWordPressMediaFrameOpen();
      mediaUploader.open();
    } else {
      showToast(
        __$1(
          "Media library not available. Please ensure you are logged in as admin.",
          "yatra"
        ),
        "error"
      );
    }
  };
  const handlePriceTypeAdd = (categoryId) => {
    if (formData.price_types.some(
      (pt) => Number(pt.category_id) === Number(categoryId)
    )) {
      showToast(
        __$1("This category already has pricing set", "yatra"),
        "warning"
      );
      return;
    }
    setFormData((prev) => ({
      ...prev,
      price_types: [
        ...prev.price_types,
        {
          category_id: categoryId,
          original_price: "",
          discounted_price: "",
          is_default: false
        }
      ]
    }));
  };
  const handlePriceTypeRemove = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      price_types: prev.price_types.filter(
        (pt) => Number(pt.category_id) !== Number(categoryId)
      )
    }));
  };
  const handlePriceTypeChange = (categoryId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      price_types: prev.price_types.map(
        (pt) => Number(pt.category_id) === Number(categoryId) ? { ...pt, [field]: value } : pt
      )
    }));
  };
  const handlePriceTypeDefaultChange = (categoryId, isDefault) => {
    setFormData((prev) => ({
      ...prev,
      price_types: prev.price_types.map((pt) => {
        if (Number(pt.category_id) === Number(categoryId)) {
          return { ...pt, is_default: isDefault };
        }
        return isDefault ? { ...pt, is_default: false } : pt;
      })
    }));
  };
  const handleTabToggle = (tabId) => {
    setFormData((prev) => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.map(
        (tab) => tab.id === tabId ? { ...tab, enabled: !tab.enabled } : tab
      )
    }));
  };
  const handleFillDummyData = () => {
    const nextIndex = (dummyDataIndex + 1) % dummyTripsData.length;
    setDummyDataIndex(nextIndex);
    const dummyData = dummyTripsData[nextIndex];
    setFormData({
      ...dummyData,
      // Ensure arrays are properly set
      destinations: dummyData.destinations || [],
      activity_types: dummyData.activity_types || [],
      price_types: dummyData.price_types || [],
      included_items: dummyData.included_items || [],
      excluded_items: dummyData.excluded_items || [],
      highlights: dummyData.highlights || [],
      faqs: dummyData.faqs || [],
      gallery_images: dummyData.gallery_images || [],
      itinerary_days: dummyData.itinerary_days || [],
      tags: dummyData.tags || [],
      testimonial_review_ids: dummyData.testimonial_review_ids || [],
      countries: dummyData.countries || [],
      regions: dummyData.regions || [],
      landmarks: dummyData.landmarks || [],
      availability_dates: dummyData.availability_dates || [],
      frontend_tabs: dummyData.frontend_tabs || [],
      has_default_time_slots: dummyData.has_default_time_slots || false,
      default_time_slots: dummyData.default_time_slots || [],
      departure_time: dummyData.departure_time || "09:00",
      downloadable_items: dummyData.downloadable_items || []
    });
    showToast(
      __$1("Dummy data filled", "yatra") + ` (${nextIndex + 1}/${dummyTripsData.length})`,
      "success"
    );
  };
  const handleTabLabelChange = (tabId, label) => {
    setFormData((prev) => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.map(
        (tab) => tab.id === tabId ? { ...tab, label } : tab
      )
    }));
  };
  const handleTabMove = (tabId, direction) => {
    setFormData((prev) => {
      const tabs = [...prev.frontend_tabs];
      const index = tabs.findIndex((t) => t.id === tabId);
      if (index === -1) return prev;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= tabs.length) return prev;
      [tabs[index], tabs[newIndex]] = [tabs[newIndex], tabs[index]];
      tabs.forEach((tab, i) => {
        tab.order = i + 1;
      });
      return { ...prev, frontend_tabs: tabs };
    });
  };
  const handleTabRemove = (tabId) => {
    setFormData((prev) => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.filter((tab) => tab.id !== tabId).map((tab, i) => ({ ...tab, order: i + 1 }))
    }));
  };
  const handleTabAdd = () => {
    const newTabId = `custom_${Date.now()}`;
    const maxOrder = Math.max(...formData.frontend_tabs.map((t) => t.order), 0);
    setFormData((prev) => ({
      ...prev,
      frontend_tabs: [
        ...prev.frontend_tabs,
        {
          id: newTabId,
          label: __$1("New Tab", "yatra"),
          enabled: true,
          order: maxOrder + 1,
          content_type: "custom",
          custom_content: ""
        }
      ]
    }));
  };
  const handleTabContentTypeChange = (tabId, contentType) => {
    setFormData((prev) => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.map(
        (tab) => tab.id === tabId ? { ...tab, content_type: contentType } : tab
      )
    }));
  };
  const handleTabCustomContentChange = (tabId, content) => {
    setFormData((prev) => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.map(
        (tab) => tab.id === tabId ? { ...tab, custom_content: content } : tab
      )
    }));
  };
  const handleTabIconChange = (tabId, icon) => {
    setFormData((prev) => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.map(
        (tab) => tab.id === tabId ? { ...tab, icon } : tab
      )
    }));
  };
  const [draggedTab, setDraggedTab] = reactExports.useState(null);
  const [dragOverTab, setDragOverTab] = reactExports.useState(null);
  const handleDragStart = (e, tabId) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDragEnter = (tabId) => {
    setDragOverTab(tabId);
  };
  const handleDragLeave = () => {
    setDragOverTab(null);
  };
  const handleDrop = (e, targetTabId) => {
    e.preventDefault();
    setDragOverTab(null);
    if (!draggedTab || draggedTab === targetTabId) {
      setDraggedTab(null);
      return;
    }
    setFormData((prev) => {
      const tabs = [...prev.frontend_tabs];
      const draggedIndex = tabs.findIndex((t) => t.id === draggedTab);
      const targetIndex = tabs.findIndex((t) => t.id === targetTabId);
      if (draggedIndex === -1 || targetIndex === -1) {
        return prev;
      }
      const [draggedTabObj] = tabs.splice(draggedIndex, 1);
      tabs.splice(targetIndex, 0, draggedTabObj);
      tabs.forEach((tab, i) => {
        tab.order = i + 1;
      });
      return { ...prev, frontend_tabs: tabs };
    });
    setDraggedTab(null);
  };
  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverTab(null);
  };
  const buildEssentialFieldErrors = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = __$1("Title is required", "yatra");
    }
    if (!formData.slug.trim()) {
      newErrors.slug = __$1("Slug is required", "yatra");
    } else if (!/^[\p{L}\p{N}-]+$/u.test(formData.slug)) {
      newErrors.slug = __$1(
        "Slug can only contain letters, numbers, and hyphens",
        "yatra"
      );
    }
    return newErrors;
  };
  const validateForm = () => {
    const newErrors = buildEssentialFieldErrors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        title: data.title.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        short_description: data.short_description.trim(),
        highlights: data.highlights,
        trip_details: data.trip_details.trim(),
        what_makes_special: data.what_makes_special.trim(),
        trip_story: data.trip_story.trim(),
        video_url: data.video_url.trim(),
        virtual_tour_url: data.virtual_tour_url.trim(),
        testimonial_review_ids: Array.isArray(data.testimonial_review_ids) ? data.testimonial_review_ids.filter(
          (id) => id !== null && id !== void 0 && id > 0
        ) : [],
        destinations: data.destinations || [],
        // Array of destination IDs
        starting_location: data.starting_location.trim(),
        ending_location: data.ending_location.trim(),
        countries: data.countries || [],
        regions: data.regions || [],
        starting_latitude: data.starting_latitude ? parseFloat(data.starting_latitude) : null,
        starting_longitude: data.starting_longitude ? parseFloat(data.starting_longitude) : null,
        ending_latitude: data.ending_latitude ? parseFloat(data.ending_latitude) : null,
        ending_longitude: data.ending_longitude ? parseFloat(data.ending_longitude) : null,
        landmarks: data.landmarks || [],
        trip_type: data.trip_type,
        duration_days: data.duration_days ? parseInt(data.duration_days) : null,
        duration_nights: data.duration_nights ? parseInt(data.duration_nights) : null,
        available_from: data.available_from || null,
        available_to: data.available_to || null,
        booking_window_days: data.booking_window_days ? parseInt(data.booking_window_days) : null,
        seasonal_availability: data.seasonal_availability || "",
        best_season: data.best_season.trim(),
        peak_season: data.peak_season.trim(),
        off_season: data.off_season.trim(),
        activity_types: data.activity_types || [],
        // Array of activity IDs
        difficulty_level: parseInt(data.difficulty_level) || null,
        trip_category: (() => {
          const rawCategories = data.trip_category || [];
          if (tripCategories.length === 0) {
            return rawCategories;
          }
          const validCategories = rawCategories.filter((_catId) => {
            return true;
          });
          return validCategories;
        })(),
        tags: data.tags || [],
        accommodation_type: data.accommodation_type || "",
        meal_plan: data.meal_plan || "",
        accommodation_details: data.accommodation_details.trim(),
        transportation_included: data.transportation_included || false,
        pickup_location: data.pickup_location.trim(),
        dropoff_location: data.dropoff_location.trim(),
        transportation_details: data.transportation_details.trim(),
        pricing_type: data.pricing_type,
        original_price: data.pricing_type === "regular" ? data.original_price ? parseFloat(data.original_price) : null : null,
        discounted_price: data.pricing_type === "regular" ? data.discounted_price ? parseFloat(data.discounted_price) : null : null,
        price_types: data.pricing_type === "traveler_based" ? data.price_types.map((pt) => ({
          category_id: pt.category_id,
          is_default: Boolean(pt.is_default),
          original_price: pt.original_price ? parseFloat(pt.original_price) : 0,
          discounted_price: pt.discounted_price ? parseFloat(pt.discounted_price) : null
        })) : [],
        deposit_amount: data.deposit_amount ? parseFloat(data.deposit_amount) : null,
        deposit_percentage: data.deposit_percentage ? parseFloat(data.deposit_percentage) : null,
        payment_terms: data.payment_terms.trim(),
        max_travelers: data.max_travelers ? parseInt(data.max_travelers) : null,
        min_travelers: data.min_travelers ? parseInt(data.min_travelers) : null,
        booking_deadline_hours: data.booking_deadline_hours || null,
        cancellation_policy: data.cancellation_policy || "",
        custom_fields: { disable_booking: data.disable_booking },
        age_min: data.age_min ? parseInt(data.age_min) : null,
        age_max: data.age_max ? parseInt(data.age_max) : null,
        physical_requirements: data.physical_requirements.trim(),
        visa_requirements: data.visa_requirements.trim(),
        vaccination_requirements: data.vaccination_requirements.trim(),
        has_default_time_slots: data.has_default_time_slots || false,
        default_time_slots: JSON.stringify(data.default_time_slots || []),
        departure_time: data.departure_time || "09:00",
        included_items: (data.included_items || []).map((item) => {
          var _a2, _b2;
          return {
            title: ((_a2 = item.title) == null ? void 0 : _a2.trim()) || "",
            description: ((_b2 = item.description) == null ? void 0 : _b2.trim()) || ""
          };
        }).filter((item) => item.title),
        excluded_items: (data.excluded_items || []).map((item) => {
          var _a2, _b2;
          return {
            title: ((_a2 = item.title) == null ? void 0 : _a2.trim()) || "",
            description: ((_b2 = item.description) == null ? void 0 : _b2.trim()) || ""
          };
        }).filter((item) => item.title),
        itinerary_days: data.itinerary_days || [],
        gallery_images: data.gallery_images || [],
        featured_image: data.featured_image ?? null,
        faqs: data.faqs || [],
        frontend_tabs: data.frontend_tabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          enabled: tab.enabled,
          order: tab.order,
          content_type: tab.content_type,
          custom_content: tab.custom_content || null,
          icon: tab.icon || null
        })),
        availability_dates: data.availability_dates.map((avail) => ({
          id: avail.id,
          departure_date: avail.departure_date || null,
          arrival_date: avail.arrival_date || null,
          seats_remaining: avail.seats_remaining || null,
          original_price: avail.original_price ? parseFloat(avail.original_price) : null,
          discounted_price: avail.discounted_price ? parseFloat(avail.discounted_price) : null,
          discount_percentage: avail.discount_percentage ? parseFloat(avail.discount_percentage) : null,
          status: avail.status || "available",
          from_location: avail.from_location || null,
          to_location: avail.to_location || null,
          from_latitude: avail.from_latitude || null,
          from_longitude: avail.from_longitude || null,
          to_latitude: avail.to_latitude || null,
          to_longitude: avail.to_longitude || null
        })),
        status: data.status === "publish" ? "publish" : "draft",
        scheduled_publish_date: data.scheduled_publish_date || null,
        scheduled_unpublish_date: data.scheduled_unpublish_date || null,
        version: data.version || 1,
        seasonal_auto_enable: data.seasonal_auto_enable || false,
        seasonal_enable_date: data.seasonal_enable_date || null,
        seasonal_disable_date: data.seasonal_disable_date || null,
        meta_title: data.meta_title || "",
        meta_description: data.meta_description || "",
        meta_keywords: data.meta_keywords || "",
        attributes: data.attributes || {},
        featured_priority: data.featured_priority
      };
      {
        payload.downloadable_items = (data.downloadable_items || []).map((item, idx) => ({
          id: item.id ?? null,
          title: (item.title || "").trim(),
          description: item.description || "",
          attachment_id: item.attachment_id ?? null,
          visibility: item.visibility || "booked_only",
          enabled: item.enabled !== false,
          sort_order: item.sort_order != null ? item.sort_order : idx + 1,
          attachment_url: item.attachment_url || "",
          attachment_title: item.attachment_title || "",
          // Prefixed keys (requested)
          download_title: (item.title || "").trim(),
          download_description: item.description || "",
          download_visibility: item.visibility || "booked_only",
          download_enabled: item.enabled !== false,
          download_file: item.attachment_id ?? null
        })).filter((item) => item.title);
      }
      if (isEditMode && tripId) {
        const response = await apiClient.put(`/trips/${tripId}`, payload);
        return response.data || response;
      } else {
        const response = await apiClient.post("/trips", payload);
        return response.data || response;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      queryClient.refetchQueries({ queryKey: ["trip", tripId] });
      setIsSubmitting(false);
      let successMessage;
      if (isEditMode) {
        successMessage = variables.status === "publish" ? __$1("Trip updated and published successfully", "yatra") : __$1("Trip updated successfully", "yatra");
      } else {
        successMessage = variables.status === "publish" ? __$1("Trip created and published successfully", "yatra") : __$1("Trip saved as draft successfully", "yatra");
      }
      showToast(successMessage, "success");
      if (!isEditMode && (data == null ? void 0 : data.id)) {
        setTimeout(() => {
          var _a2;
          window.location.href = `${((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=trips&action=edit&id=${data.id}`;
        }, 1e3);
      }
    },
    onError: (error) => {
      var _a2, _b2;
      const errorMessage = ((_b2 = (_a2 = error == null ? void 0 : error.response) == null ? void 0 : _a2.data) == null ? void 0 : _b2.message) || (error == null ? void 0 : error.message) || __$1("An error occurred while saving", "yatra");
      showToast(errorMessage, "error");
      setErrors({ submit: errorMessage });
      setIsSubmitting(false);
    }
  });
  const validateDraft = () => {
    const newErrors = buildEssentialFieldErrors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSaveDraft = async () => {
    if (!validateDraft()) {
      showToast(
        __$1("Please add a trip title and URL before saving.", "yatra"),
        "error"
      );
      return;
    }
    setIsSubmitting(true);
    saveMutation.mutate({ ...formData, status: "draft" });
  };
  const handlePublish = async () => {
    if (!validateForm()) {
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        showToast(
          __$1("Trip title and slug are required before publishing.", "yatra"),
          "error"
        );
        const errorElement = document.querySelector(
          `[name="${firstError}"], #${firstError}`
        );
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }
    setIsSubmitting(true);
    saveMutation.mutate({ ...formData, status: "publish" });
  };
  reactExports.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey)
        return;
      const target = e.target;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      const isTextarea = tag === "textarea";
      const isButton = tag === "button";
      const isLink = tag === "a";
      const isContentEditable = target.getAttribute("contenteditable") === "true";
      if (isTextarea || isButton || isLink || isContentEditable) return;
      const inputType = target.type;
      if (["submit", "button", "file"].includes(inputType)) return;
      e.preventDefault();
      if (!isSubmitting) {
        handlePublish();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, handlePublish]);
  const revisions = dummyRevisions;
  const handlePreview = async () => {
    var _a2;
    const slug = (formData.slug || "").trim();
    if (!slug) {
      showToast(
        __$1(
          "Trip slug is missing. Please add a slug before previewing.",
          "yatra"
        ),
        "error"
      );
      return;
    }
    const siteUrl = ((_a2 = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || "";
    const { plainUrl, prettyUrl } = buildYatraSinglePublicUrls({
      entity: "trip",
      slug,
      siteUrl,
      bases: settingsData
    });
    if (isWordPressPlainPermalink()) {
      window.open(plainUrl, "_blank", "noopener,noreferrer");
      return;
    }
    let apiPermalink = (tripData == null ? void 0 : tripData.permalink) || (tripData == null ? void 0 : tripData.url);
    if (!apiPermalink && tripId) {
      try {
        const detail = await apiClient.get(`/trips/${tripId}`);
        apiPermalink = (detail == null ? void 0 : detail.permalink) || (detail == null ? void 0 : detail.url) || apiPermalink;
      } catch (error) {
      }
    }
    if (apiPermalink) {
      window.open(apiPermalink, "_blank", "noopener,noreferrer");
      return;
    }
    window.open(prettyUrl, "_blank", "noopener,noreferrer");
  };
  const handleRevisionClick = (revisionId) => {
    setSelectedRevisionId(revisionId);
    setShowRevisionConfirm(true);
  };
  const handleRevisionConfirm = () => {
    if (selectedRevisionId) {
      showToast(__$1("Revision feature is coming soon", "yatra"), "info");
    }
    setShowRevisionConfirm(false);
    setShowRevisionsDialog(false);
    setSelectedRevisionId(null);
  };
  if (isEditMode && isLoadingTrip) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-h-0 flex flex-col bg-white dark:bg-gray-900 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-4 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-36 bg-blue-200 dark:bg-blue-800 rounded animate-pulse" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col items-center gap-1 max-w-md mx-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2.5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 pb-8 space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3 px-1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-0.5", children: [...Array(8)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center gap-2 px-3 py-2.5 rounded-md",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-shrink-0" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 flex-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
                ]
              },
              `essentials-${i}`
            )) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3.5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3 px-1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-0.5", children: [...Array(9)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center gap-2 px-3 py-2.5 rounded-md",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-shrink-0" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 flex-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
                ]
              },
              `marketing-${i}`
            )) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-3 py-2.5 rounded-md", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3.5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3.5 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3.5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3.5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-48 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4", children: [...Array(4)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
            ] }, `grid-${i}`)) })
          ] }) })
        ] }) })
      ] })
    ] });
  }
  if (isEditMode && tripError) {
    const requestInfo = tripErrorContext.requestInfo || (tripError == null ? void 0 : tripError.config) || {};
    const method = ((_d = (_c = requestInfo.method || "GET").toUpperCase) == null ? void 0 : _d.call(_c)) || "GET";
    const url = requestInfo.url || ((_e = tripError == null ? void 0 : tripError.config) == null ? void 0 : _e.url) || "";
    const payload = requestInfo.payload || ((_f = tripError == null ? void 0 : tripError.config) == null ? void 0 : _f.data) || "";
    const composedErrorText = `Method: ${method}
URL: ${url}
Payload: ${payload || "N/A"}

${tripErrorContext.details || ""}`;
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full max-w-5xl px-6 py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex flex-col items-center text-center gap-4 rounded-2xl border border-dashed border-[#fddfe1] bg-gradient-to-br from-[#fff7f8] via-white to-[#fff9f5] p-10 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-2xl bg-white border border-[#ffdede] flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "svg",
        {
          className: "w-10 h-10 text-red-500",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          strokeWidth: "1.8",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              d: "M12 9v4m0 4h.01M10.29 3.86L2.82 17a2 2 0 001.71 3h14.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold text-gray-900", children: __$1("Error Loading Trips", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600", children: __$1(
          "We couldn’t connect to the trips service. Please refresh or try again shortly.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 justify-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: () => queryClient.invalidateQueries({ queryKey: ["trip", tripId] }),
            children: __$1("Try again", "yatra")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outline",
            onClick: () => {
              if (typeof window !== "undefined") {
                window.open(
                  "https://wordpress.org/support/plugin/yatra",
                  "_blank"
                );
              }
            },
            children: __$1("Visit support center", "yatra")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full mt-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full text-left rounded-2xl border border-gray-200 bg-white shadow-sm space-y-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-5 py-3 border-b border-gray-200", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-800", children: __$1("Technical details", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              size: "sm",
              variant: "ghost",
              className: "flex items-center gap-2 text-gray-600 hover:text-gray-900",
              onClick: () => copyErrorDetailsToClipboard(composedErrorText),
              children: copiedErrorDetails ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4" }),
                __$1("Copied", "yatra")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4" }),
                __$1("Copy details", "yatra")
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-3 border-b border-gray-200 space-y-2 text-sm text-left text-gray-800", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: __$1("Method:", "yatra") }),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: method })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "break-all", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: __$1("URL:", "yatra") }),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: url || __$1("N/A", "yatra") })
          ] }),
          payload && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium block mb-1", children: __$1("Payload:", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "max-h-40 overflow-auto px-3 py-2 rounded bg-gray-50 text-xs font-mono text-gray-900 whitespace-pre-wrap border border-gray-200", children: payload })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "max-h-56 overflow-auto px-5 py-3 text-xs leading-relaxed font-mono text-gray-900 whitespace-pre-wrap bg-white", children: tripErrorContext.details || JSON.stringify(
          {
            message: tripError instanceof Error ? tripError.message : __$1("Failed to load trip data", "yatra"),
            method,
            url,
            payload
          },
          null,
          2
        ) })
      ] }) })
    ] }) }) });
  }
  const renderSectionContent = () => {
    var _a2;
    switch (currentSection) {
      case "basic":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __$1("Basic Information", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: "ml-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
                children: __$1("Start Here", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-3 rounded-r-md mb-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-blue-900 dark:text-blue-100 font-medium mb-1", children: __$1("💡 Getting Started", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-blue-800 dark:text-blue-200", children: __$1(
              "Only the Trip Title and Trip URL are required to create a draft. Everything else is optional for now, but filling it in is highly recommended for better discovery and conversions.",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "label",
                  {
                    htmlFor: "title",
                    className: "block text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5",
                    children: [
                      __$1("Trip Title", "yatra"),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Badge,
                        {
                          variant: "outline",
                          className: "ml-1 text-[10px] px-1.5 py-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
                          children: __$1("Required", "yatra")
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          className: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto",
                          title: __$1(
                            "A catchy title that describes your trip. Recommended: 50-60 characters for best SEO results.",
                            "yatra"
                          ),
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(HelpCircle, { className: "w-3.5 h-3.5" })
                        }
                      )
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "span",
                  {
                    className: `text-xs font-medium ${formData.title.length > 60 ? "text-red-600 dark:text-red-400" : formData.title.length >= 50 ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`,
                    children: [
                      formData.title.length,
                      "/60"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                HelpText,
                {
                  text: __$1(
                    '💡 Tip: Include your destination and trip length. Example: "Bali Beach Retreat - 7 Days" or "Paris City Tour - Half Day"',
                    "yatra"
                  ),
                  className: "mb-2"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "title",
                  type: "text",
                  value: formData.title,
                  onChange: (e) => handleTitleChange(e.target.value),
                  placeholder: __$1("e.g., Bali Beach Retreat - 7 Days", "yatra"),
                  maxLength: 100,
                  className: `${errors.title ? "border-red-500" : formData.title && formData.title.length <= 60 ? "border-green-500" : ""} transition-colors`,
                  required: true
                }
              ),
              errors.title ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                errors.title
              ] }) : formData.title && formData.title.length > 60 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-3.5 h-3.5" }),
                __$1(
                  "Title is longer than recommended for SEO (60 characters)",
                  "yatra"
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "label",
                  {
                    htmlFor: "slug",
                    className: "block text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5",
                    children: [
                      __$1("Trip URL", "yatra"),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Badge,
                        {
                          variant: "outline",
                          className: "ml-1 text-[10px] px-1.5 py-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
                          children: __$1("Required", "yatra")
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          className: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto",
                          title: __$1(
                            "The web address for your trip page. Auto-generated from your title, but you can customize it.",
                            "yatra"
                          ),
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(HelpCircle, { className: "w-3.5 h-3.5" })
                        }
                      )
                    ]
                  }
                ),
                showSlugPreview && formData.slug && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setShowSlugPreview(false),
                    className: "text-xs text-blue-600 dark:text-blue-400 hover:underline",
                    children: __$1("Hide", "yatra")
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                HelpText,
                {
                  text: __$1(
                    "💡 This is automatically created from your title. You usually don't need to change it unless you want a custom web address.",
                    "yatra"
                  ),
                  className: "mb-2"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "slug",
                  type: "text",
                  value: formData.slug,
                  onChange: (e) => handleFieldChange("slug", e.target.value),
                  placeholder: __$1("bali-beach-retreat-7-days", "yatra"),
                  className: `font-mono text-sm ${errors.slug ? "border-red-500" : ""}`,
                  required: true
                }
              ),
              errors.slug && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                errors.slug
              ] }),
              showSlugPreview && formData.slug && !errors.slug && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-gray-600 dark:text-gray-400 border border-blue-200 dark:border-blue-800 flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-500 dark:text-gray-400", children: [
                    __$1("Preview URL:", "yatra"),
                    " "
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-blue-600 dark:text-blue-400", children: [
                    ((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || "yoursite.com",
                    "/",
                    (settingsData == null ? void 0 : settingsData.trip_base) || "trip",
                    "/",
                    formData.slug
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      var _a3;
                      const tripBase = (settingsData == null ? void 0 : settingsData.trip_base) || "trip";
                      const url = `${((_a3 = window.yatraAdmin) == null ? void 0 : _a3.siteUrl) || "yoursite.com"}/${tripBase}/${formData.slug}`;
                      navigator.clipboard.writeText(url);
                      showToast(
                        __$1("URL copied to clipboard", "yatra"),
                        "success"
                      );
                    },
                    className: "ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1",
                    title: __$1("Copy URL", "yatra"),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-3.5 h-3.5" })
                  }
                )
              ] }),
              !showSlugPreview && formData.slug && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowSlugPreview(true),
                  className: "mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline",
                  children: __$1("Show URL Preview", "yatra")
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5", children: [
                  __$1("Short Description", "yatra"),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Badge,
                    {
                      variant: "outline",
                      className: "ml-1 text-[10px] px-1.5 py-0 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                      children: __$1("Recommended", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      className: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                      title: __$1(
                        "A brief summary that appears in listings. Recommended: 100-150 characters for best results.",
                        "yatra"
                      ),
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(HelpCircle, { className: "w-3.5 h-3.5" })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "span",
                    {
                      className: `text-xs font-medium ${formData.short_description.length > 200 ? "text-red-600 dark:text-red-400" : formData.short_description.length >= 100 && formData.short_description.length <= 150 ? "text-green-600 dark:text-green-400" : formData.short_description.length > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-gray-500 dark:text-gray-400"}`,
                      children: [
                        formData.short_description.length,
                        "/200"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    AiFieldAffordance,
                    {
                      task: "trip-short-description",
                      label: __$1("Short Description", "yatra"),
                      value: formData.short_description,
                      onAccept: (v) => handleFieldChange("short_description", v),
                      buildContext: () => buildTripAiContext(formData)
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                HelpText,
                {
                  text: __$1(
                    '💡 Write 2-3 sentences that grab attention! This appears in trip listings. Example: "Escape to paradise with our 7-day Bali beach retreat. Experience stunning sunsets, world-class diving, and authentic local culture."',
                    "yatra"
                  ),
                  className: "mb-2"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                RichTextEditor,
                {
                  value: formData.short_description,
                  onChange: (value) => handleFieldChange("short_description", value),
                  placeholder: __$1(
                    "Escape to paradise with our 7-day Bali beach retreat...",
                    "yatra"
                  ),
                  minHeight: 120
                }
              ),
              formData.short_description.length > 0 && formData.short_description.length < 100 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-3.5 h-3.5" }),
                __$1(
                  "Consider adding more details (recommended: 100-150 characters)",
                  "yatra"
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5", children: [
                  __$1("Trip Description", "yatra"),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Badge,
                    {
                      variant: "outline",
                      className: "ml-1 text-[10px] px-1.5 py-0 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                      children: __$1("Recommended", "yatra")
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  AiFieldAffordance,
                  {
                    task: "trip-description",
                    label: __$1("Description", "yatra"),
                    value: formData.description,
                    onAccept: (v) => handleFieldChange("description", v),
                    buildContext: () => buildTripAiContext(formData)
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                HelpText,
                {
                  text: __$1(
                    "💡 Tell travelers what makes your trip special! Describe the experience, highlights, and what they'll see. Write 2-4 paragraphs. Be enthusiastic and detailed!",
                    "💡 Tell travelers what makes your trip special! Describe the experience, highlights, and what they'll see. Write 2-4 paragraphs. Be enthusiastic and detailed!"
                  ),
                  className: "mb-2"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                RichTextEditor,
                {
                  value: formData.description,
                  onChange: (value) => handleFieldChange("description", value),
                  placeholder: __$1(
                    "Escape to paradise with our 7-day Bali beach retreat... Or describe your single day trip experience...",
                    "yatra"
                  ),
                  minHeight: 260
                }
              ),
              errors.description && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                errors.description
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5", children: [
                __$1("Featured Image", "yatra"),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Badge,
                  {
                    variant: "outline",
                    className: "ml-1 text-[10px] px-1.5 py-0 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                    children: __$1("Recommended", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    className: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto",
                    title: __$1(
                      "The main image that represents your trip. This appears in listings and as the hero image on the trip page.",
                      "yatra"
                    ),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(HelpCircle, { className: "w-3.5 h-3.5" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                HelpText,
                {
                  text: __$1(
                    "💡 Choose your best photo! This is the first thing travelers see. Use a high-quality image (1200x800px recommended) that shows what makes your trip special.",
                    "yatra"
                  ),
                  className: "mb-2"
                }
              ),
              formData.featured_image ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: `aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 ${errors.featured_image ? "border-red-500 dark:border-red-600" : "border-gray-200 dark:border-gray-700"}`,
                    children: featuredImagePreview ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: featuredImagePreview,
                        alt: __$1("Featured Image", "yatra"),
                        className: "w-full h-full object-cover"
                      }
                    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center w-full h-full text-sm text-gray-500 dark:text-gray-400", children: isResolvingFeaturedImage ? __$1("Loading image...", "yatra") : __$1("Preview unavailable", "yatra") })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleFieldChange("featured_image", null),
                    className: "absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity",
                    title: __$1("Remove image", "yatra"),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                  }
                )
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    if (window.wp && window.wp.media) {
                      const mediaUploader = window.wp.media({
                        title: __$1("Select Featured Image", "yatra"),
                        button: { text: __$1("Use this image", "yatra") },
                        multiple: false
                      });
                      mediaUploader.on("select", () => {
                        const attachment = mediaUploader.state().get("selection").first().toJSON();
                        handleFieldChange("featured_image", attachment.id);
                      });
                      prepareWordPressMediaFrameOpen();
                      mediaUploader.open();
                    }
                  },
                  className: `w-full aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${errors.featured_image ? "border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Upload,
                      {
                        className: `w-10 h-10 mb-2 ${errors.featured_image ? "text-red-400" : "text-gray-400"}`
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: `text-sm font-medium ${errors.featured_image ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}`,
                        children: __$1("Upload Featured Image", "yatra")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: `text-xs mt-1 ${errors.featured_image ? "text-red-500 dark:text-red-500" : "text-gray-500 dark:text-gray-500"}`,
                        children: __$1("Recommended: 1200x800px", "yatra")
                      }
                    )
                  ]
                }
              ),
              errors.featured_image && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                errors.featured_image
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "mt-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __$1("Trip Highlights", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __$1(
                    "Add key highlights that make your trip special. These will be displayed prominently on your trip page.",
                    "yatra"
                  ) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  AiFieldAffordance,
                  {
                    task: "trip-highlights",
                    label: __$1("Highlights", "yatra"),
                    value: (formData.highlights ?? []).join("\n"),
                    onAccept: (raw) => {
                      const list = raw.split(/\r?\n/).map((l) => l.replace(/^[\s\-\*•·●]+/, "").trim()).filter((l) => l !== "");
                      handleFieldChange("highlights", list);
                    },
                    buildContext: () => buildTripAiContext(formData)
                  }
                )
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
                formData.highlights.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: formData.highlights.map((highlight, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm text-gray-900 dark:text-white", children: highlight }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "button",
                          variant: "ghost",
                          size: "sm",
                          onClick: () => handleHighlightRemove(index),
                          className: "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                        }
                      )
                    ]
                  },
                  index
                )) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-3", children: __$1("No highlights added yet", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-500 mb-4", children: __$1(
                    'Add key selling points like "Private guide", "All meals included", or "Skip-the-line tickets"',
                    "yatra"
                  ) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: handleHighlightAdd,
                    className: "w-full",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                      __$1("Add Highlight", "yatra")
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4", children: __$1("Trip Type & Duration", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-3", children: __$1("Trip Type", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `grid grid-cols-1 md:grid-cols-2 gap-4 ${errors.trip_type ? "mb-2" : ""}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "label",
                        {
                          className: `relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${formData.trip_type === "single_day" ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600" : errors.trip_type ? "border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"}`,
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "input",
                              {
                                type: "radio",
                                name: "trip_type",
                                value: "single_day",
                                checked: formData.trip_type === "single_day",
                                onChange: (e) => {
                                  handleFieldChange("trip_type", e.target.value);
                                  if (e.target.value === "single_day") {
                                    setFormData((prev) => ({
                                      ...prev,
                                      duration_days: "1",
                                      duration_nights: "0"
                                    }));
                                  }
                                },
                                className: "sr-only"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "span",
                                {
                                  className: `block text-sm font-semibold ${formData.trip_type === "single_day" ? "text-blue-900 dark:text-blue-300" : "text-gray-900 dark:text-white"}`,
                                  children: __$1("Single Day Trip", "yatra")
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "span",
                                {
                                  className: `mt-1 flex items-center text-sm ${formData.trip_type === "single_day" ? "text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`,
                                  children: __$1(
                                    "Trip completed within one day (no overnight stay)",
                                    "yatra"
                                  )
                                }
                              )
                            ] }) }),
                            formData.trip_type === "single_day" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 right-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 rounded-full bg-blue-600" }) })
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "label",
                        {
                          className: `relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${formData.trip_type === "multi_day" ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600" : errors.trip_type ? "border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"}`,
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "input",
                              {
                                type: "radio",
                                name: "trip_type",
                                value: "multi_day",
                                checked: formData.trip_type === "multi_day",
                                onChange: (e) => handleFieldChange("trip_type", e.target.value),
                                className: "sr-only"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "span",
                                {
                                  className: `block text-sm font-semibold ${formData.trip_type === "multi_day" ? "text-blue-900 dark:text-blue-300" : "text-gray-900 dark:text-white"}`,
                                  children: __$1("Multi-Day Trip", "yatra")
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "span",
                                {
                                  className: `mt-1 flex items-center text-sm ${formData.trip_type === "multi_day" ? "text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`,
                                  children: __$1(
                                    "Trip spans multiple days with overnight stays",
                                    "yatra"
                                  )
                                }
                              )
                            ] }) }),
                            formData.trip_type === "multi_day" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 right-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 rounded-full bg-blue-600" }) })
                          ]
                        }
                      )
                    ]
                  }
                ),
                errors.trip_type && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                  errors.trip_type
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      htmlFor: "duration_days",
                      className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                      children: __$1("Duration (Days)", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "duration_days",
                      type: "number",
                      min: "1",
                      value: formData.duration_days,
                      onChange: (e) => {
                        const days = e.target.value;
                        handleFieldChange("duration_days", days);
                        if (formData.trip_type === "single_day") {
                          setFormData((prev) => ({
                            ...prev,
                            duration_nights: "0"
                          }));
                        } else if (days && parseInt(days) > 1) {
                          const nights = Math.max(
                            0,
                            parseInt(days) - 1
                          ).toString();
                          setFormData((prev) => ({
                            ...prev,
                            duration_nights: nights
                          }));
                        }
                      },
                      placeholder: formData.trip_type === "single_day" ? "1" : __$1("e.g., 7", "yatra"),
                      className: errors.duration_days ? "border-red-500" : "",
                      disabled: formData.trip_type === "single_day"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-xs text-gray-500 dark:text-gray-400", children: formData.trip_type === "single_day" ? __$1("Single day trips are always 1 day", "yatra") : __$1(
                    "Enter the number of days for your trip",
                    "yatra"
                  ) }),
                  errors.duration_days && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                    errors.duration_days
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      htmlFor: "duration_nights",
                      className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                      children: __$1("Duration (Nights)", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "duration_nights",
                      type: "number",
                      min: "0",
                      value: formData.duration_nights,
                      onChange: (e) => handleFieldChange("duration_nights", e.target.value),
                      placeholder: formData.trip_type === "single_day" ? "0" : __$1("e.g., 6", "yatra"),
                      className: errors.duration_nights ? "border-red-500" : "",
                      disabled: formData.trip_type === "single_day"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-xs text-gray-500 dark:text-gray-400", children: formData.trip_type === "single_day" ? __$1(
                    "Single day trips have 0 nights (no overnight stay)",
                    "yatra"
                  ) : __$1(
                    "Enter the number of nights (typically days - 1)",
                    "yatra"
                  ) }),
                  errors.duration_nights && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                    errors.duration_nights
                  ] })
                ] })
              ] })
            ] }) })
          ] })
        ] });
      case "location":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-5 h-5 text-gray-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __$1("Location & Geography", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: "text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800",
                children: __$1("Recommended", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-400 p-3 rounded-r-md", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-amber-900 dark:text-amber-100 mb-1", children: __$1(
              "Specify where your trip takes place, including destinations, coordinates, and key landmarks.",
              "yatra"
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-800 dark:text-amber-200", children: __$1(
              "Optional but highly recommended to help travelers understand the experience.",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-4", children: [
            __$1(
              "Optimize how your trip appears in search engines and social shares",
              "yatra"
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400 mt-1", children: __$1(
              "Optional, but completing these fields improves SEO and click-through rates.",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Destinations", "yatra") }),
              destinationsData && destinationsData.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                MultiSelect,
                {
                  value: formData.destinations.map((id) => id.toString()),
                  onChange: (values) => handleFieldChange(
                    "destinations",
                    values.map((v) => Number(v))
                  ),
                  options: destinationsData.map((destination) => ({
                    value: destination.id.toString(),
                    label: destination.name || sprintf(
                      // translators: %s: numeric destination ID, used as a fallback when the destination has no name.
                      __$1("Destination #%s", "yatra"),
                      String(destination.id)
                    )
                  })),
                  placeholder: __$1("Select destinations...", "yatra"),
                  searchPlaceholder: __$1("Search destinations...", "yatra"),
                  error: !!errors.destinations
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: __$1(
                  "No destinations available. Please create destinations first.",
                  "yatra"
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500", children: __$1("To create destinations:", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "text-xs text-gray-400 dark:text-gray-500 text-left list-decimal list-inside space-y-1 max-w-md mx-auto", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __$1(
                      "Go to Yatra → Destinations in your WordPress admin",
                      "yatra"
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __$1('Click "Add New Destination"', "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __$1("Enter destination name and details", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: __$1('Set status to "Published"', "yatra") })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "a",
                    {
                      href: "/wp-admin/admin.php?page=yatra&subpage=trips&tab=destinations&action=create",
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "svg",
                          {
                            className: "w-3 h-3 mr-1",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "path",
                              {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                strokeWidth: 2,
                                d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              }
                            )
                          }
                        ),
                        __$1("Create Destinations", "yatra")
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                HelpText,
                {
                  text: __$1(
                    "Select all destinations included in this trip",
                    "yatra"
                  ),
                  className: "mt-2"
                }
              ),
              errors.destinations && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                errors.destinations
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-3 h-3 text-white" }) }),
                  __$1("Trip Locations", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto", children: __$1(
                  "Set precise starting and ending points with location names and GPS coordinates. Use manual entry or visual map selection for maximum accuracy.",
                  "yatra"
                ) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-5 h-5 text-white" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-base font-semibold text-blue-900 dark:text-blue-100", children: __$1("Starting Point", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-blue-700 dark:text-blue-300", children: __$1("Where the journey begins", "yatra") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      formData.starting_location && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: "w-2 h-2 bg-green-500 rounded-full animate-pulse",
                          title: __$1("Location set", "yatra")
                        }
                      ),
                      formData.starting_latitude && formData.starting_longitude && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: "w-2 h-2 bg-blue-500 rounded-full animate-pulse",
                          title: __$1("Coordinates set", "yatra")
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-blue-600 dark:text-blue-400", children: "1" }) }),
                        __$1("Starting Location", "yatra")
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: formData.starting_location ? "✓" : __$1("Required", "yatra") }),
                        formData.starting_latitude && formData.starting_longitude && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-xs text-green-600", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full" }),
                          __$1("Coords Set", "yatra")
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      LocationPicker,
                      {
                        value: {
                          name: formData.starting_location,
                          latitude: formData.starting_latitude,
                          longitude: formData.starting_longitude
                        },
                        onChange: (locationData) => {
                          handleFieldChange(
                            "starting_location",
                            locationData.name
                          );
                          handleFieldChange(
                            "starting_latitude",
                            locationData.latitude
                          );
                          handleFieldChange(
                            "starting_longitude",
                            locationData.longitude
                          );
                        },
                        label: "",
                        placeholder: __$1(
                          "Search for starting location...",
                          "yatra"
                        ),
                        helpText: "",
                        required: false,
                        defaultMapCenter: formData.starting_latitude && formData.starting_longitude ? [
                          parseFloat(formData.starting_latitude),
                          parseFloat(formData.starting_longitude)
                        ] : [20, 0],
                        defaultZoom: formData.starting_latitude && formData.starting_longitude ? 13 : 2,
                        mapHeight: "300px",
                        showMapButton: false,
                        searchLimit: 8,
                        __: __$1,
                        className: "",
                        mapClassName: "rounded-lg"
                      }
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-blue-600 dark:text-blue-400", children: "2" }) }),
                        __$1("GPS Coordinates", "yatra"),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
                          "(",
                          __$1("Manual override", "yatra"),
                          ")"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (position) => {
                                  handleFieldChange(
                                    "starting_latitude",
                                    position.coords.latitude.toString()
                                  );
                                  handleFieldChange(
                                    "starting_longitude",
                                    position.coords.longitude.toString()
                                  );
                                },
                                (error) => {
                                  let message = __$1(
                                    "Unable to get your location",
                                    "yatra"
                                  );
                                  let showHttpsNotice = false;
                                  switch (error.code) {
                                    case 1:
                                      if (error.message.includes(
                                        "secure origins"
                                      )) {
                                        message = __$1(
                                          "Location access requires HTTPS. This feature will work on your live HTTPS site.",
                                          "yatra"
                                        );
                                        showHttpsNotice = true;
                                      } else {
                                        message = __$1(
                                          "Location access denied. Please allow location access in your browser.",
                                          "yatra"
                                        );
                                      }
                                      break;
                                    case 2:
                                      message = __$1(
                                        "Location information is unavailable. Please try again.",
                                        "yatra"
                                      );
                                      break;
                                    case 3:
                                      message = __$1(
                                        "Location request timed out. Please try again.",
                                        "yatra"
                                      );
                                      break;
                                  }
                                  if (showHttpsNotice) {
                                    alert(
                                      message + "\n\n" + __$1(
                                        "For local development, you can:\n1. Use a browser extension that allows geolocation on HTTP\n2. Set up a local HTTPS certificate\n3. Test on your live HTTPS site",
                                        "yatra"
                                      )
                                    );
                                  } else {
                                    alert(message);
                                  }
                                }
                              );
                            } else {
                              alert(
                                __$1(
                                  "Geolocation is not supported by your browser",
                                  "yatra"
                                )
                              );
                            }
                          },
                          className: "text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-3 h-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "path",
                              {
                                fillRule: "evenodd",
                                d: "M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z",
                                clipRule: "evenodd"
                              }
                            ) }) }),
                            __$1("Use Current Location", "yatra")
                          ]
                        }
                      ) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 bg-blue-400 rounded-full" }),
                          __$1("Latitude", "yatra")
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            type: "text",
                            value: formData.starting_latitude,
                            onChange: (e) => handleFieldChange(
                              "starting_latitude",
                              e.target.value
                            ),
                            className: "w-full text-sm"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 bg-blue-400 rounded-full" }),
                          __$1("Longitude", "yatra")
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            type: "text",
                            value: formData.starting_longitude,
                            onChange: (e) => handleFieldChange(
                              "starting_longitude",
                              e.target.value
                            ),
                            placeholder: __$1("e.g., 115.0920", "yatra"),
                            className: "w-full text-sm"
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __$1(
                      "Manual coordinate entry. These will be auto-filled when you select a location from the map above.",
                      "yatra"
                    ) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "w-5 h-5 text-white" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-base font-semibold text-green-900 dark:text-green-100", children: __$1("Ending Point", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-green-700 dark:text-green-300", children: __$1("Where the journey concludes", "yatra") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: formData.ending_location && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "w-2 h-2 bg-green-500 rounded-full animate-pulse",
                        title: __$1("Location set", "yatra")
                      }
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-green-600 dark:text-green-400", children: "1" }) }),
                        __$1("Ending Location", "yatra")
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: formData.ending_location ? "✓" : __$1("Required", "yatra") }),
                        formData.ending_latitude && formData.ending_longitude && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-xs text-green-600", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full" }),
                          __$1("Coords Set", "yatra")
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      LocationPicker,
                      {
                        value: {
                          name: formData.ending_location,
                          latitude: formData.ending_latitude,
                          longitude: formData.ending_longitude
                        },
                        onChange: (locationData) => {
                          handleFieldChange(
                            "ending_location",
                            locationData.name
                          );
                          handleFieldChange(
                            "ending_latitude",
                            locationData.latitude
                          );
                          handleFieldChange(
                            "ending_longitude",
                            locationData.longitude
                          );
                        },
                        label: "",
                        placeholder: __$1(
                          "Search for ending location...",
                          "yatra"
                        ),
                        helpText: "",
                        required: false,
                        defaultMapCenter: formData.ending_latitude && formData.ending_longitude ? [
                          parseFloat(formData.ending_latitude),
                          parseFloat(formData.ending_longitude)
                        ] : formData.starting_latitude && formData.starting_longitude ? [
                          parseFloat(formData.starting_latitude),
                          parseFloat(formData.starting_longitude)
                        ] : [20, 0],
                        defaultZoom: formData.ending_latitude && formData.ending_longitude ? 13 : formData.starting_latitude && formData.starting_longitude ? 13 : 2,
                        mapHeight: "300px",
                        showMapButton: false,
                        searchLimit: 8,
                        __: __$1,
                        className: "",
                        mapClassName: "rounded-lg"
                      }
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-green-600 dark:text-green-400", children: "2" }) }),
                      __$1("GPS Coordinates", "yatra"),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
                        "(",
                        __$1("Optional", "yatra"),
                        ")"
                      ] })
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 bg-green-400 rounded-full" }),
                          __$1("Latitude", "yatra")
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            type: "text",
                            value: formData.ending_latitude || "",
                            onChange: (e) => handleFieldChange(
                              "ending_latitude",
                              e.target.value
                            ),
                            placeholder: __$1("e.g., -8.5069", "yatra"),
                            className: "w-full text-sm"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 bg-green-400 rounded-full" }),
                          __$1("Longitude", "yatra")
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            type: "text",
                            value: formData.ending_longitude || "",
                            onChange: (e) => handleFieldChange(
                              "ending_longitude",
                              e.target.value
                            ),
                            placeholder: __$1("e.g., 115.2625", "yatra"),
                            className: "w-full text-sm"
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __$1(
                      "Optional: Manual coordinate entry. Auto-filled when you select a location from the map above.",
                      "yatra"
                    ) })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Key Landmarks / Points of Interest", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                HelpText,
                {
                  text: __$1(
                    "Add notable landmarks or points of interest visited during this trip",
                    "yatra"
                  ),
                  className: "mb-2"
                }
              ),
              formData.landmarks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 mb-2", children: formData.landmarks.map((landmark, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-4 h-4 text-gray-400 flex-shrink-0" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm text-gray-900 dark:text-white", children: landmark }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        variant: "ghost",
                        size: "sm",
                        onClick: () => {
                          const newLandmarks = [...formData.landmarks];
                          newLandmarks.splice(index, 1);
                          handleFieldChange("landmarks", newLandmarks);
                        },
                        className: "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                      }
                    )
                  ]
                },
                index
              )) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __$1("No landmarks added yet", "yatra") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => {
                    setShowLandmarkDialog(true);
                    setLandmarkInput("");
                  },
                  className: "w-full",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                    __$1("Add Landmark", "yatra")
                  ]
                }
              )
            ] })
          ] })
        ] });
      case "duration":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-5 h-5 text-gray-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __$1("Availability & Booking", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: "text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800",
                children: __$1("Recommended", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-4", children: [
            __$1("When is it available & who can book it?", "yatra"),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400 mt-1", children: __$1(
              "Set your trip's availability period, capacity limits, and booking requirements. This helps automate bookings and prevent overbooking.",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4 text-blue-500" }),
                __$1("Availability Period", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "label",
                      {
                        htmlFor: "available_from",
                        className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                        children: __$1("Available From", "yatra")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      DatePicker,
                      {
                        value: formData.available_from,
                        onChange: (val) => handleFieldChange("available_from", val),
                        placeholder: __$1("Select date", "yatra")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      HelpText,
                      {
                        text: __$1(
                          "Earliest date this trip becomes available for booking",
                          "yatra"
                        ),
                        className: "mt-2"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "label",
                      {
                        htmlFor: "available_to",
                        className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                        children: __$1("Available To", "yatra")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      DatePicker,
                      {
                        value: formData.available_to,
                        onChange: (val) => handleFieldChange("available_to", val),
                        placeholder: __$1("Select date", "yatra")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      HelpText,
                      {
                        text: __$1(
                          "Latest date this trip is available for booking",
                          "yatra"
                        ),
                        className: "mt-2"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      htmlFor: "booking_window_days",
                      className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                      children: __$1("Booking Window (Days in Advance)", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "booking_window_days",
                      type: "number",
                      min: "0",
                      value: formData.booking_window_days,
                      onChange: (e) => handleFieldChange("booking_window_days", e.target.value),
                      placeholder: __$1("e.g., 30", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "Minimum days in advance customers can book this trip",
                        "yatra"
                      ),
                      className: "mt-2"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      htmlFor: "seasonal_availability",
                      className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                      children: __$1("Seasonal Availability Notes", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "seasonal_availability",
                      type: "text",
                      value: formData.seasonal_availability,
                      onChange: (e) => handleFieldChange(
                        "seasonal_availability",
                        e.target.value
                      ),
                      placeholder: __$1(
                        "e.g., Available year-round except monsoon season",
                        "yatra"
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "General notes about when this trip is typically available",
                        "yatra"
                      ),
                      className: "mt-2"
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-4 h-4 text-blue-500" }),
                __$1("Capacity & Travelers", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "label",
                      {
                        htmlFor: "min_travelers",
                        className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                        children: __$1("Minimum Travelers", "yatra")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "min_travelers",
                        type: "number",
                        min: "1",
                        value: formData.min_travelers,
                        onChange: (e) => handleFieldChange("min_travelers", e.target.value),
                        className: errors.min_travelers ? "border-red-500" : ""
                      }
                    ),
                    errors.min_travelers && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                      errors.min_travelers
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "label",
                      {
                        htmlFor: "max_travelers",
                        className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                        children: __$1("Maximum Travelers", "yatra")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "max_travelers",
                        type: "number",
                        min: "1",
                        value: formData.max_travelers,
                        onChange: (e) => handleFieldChange("max_travelers", e.target.value),
                        className: errors.max_travelers ? "border-red-500" : ""
                      }
                    ),
                    errors.max_travelers && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                      errors.max_travelers
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-4 mt-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 mb-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __$1("Fallback Settings", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        title: __$1(
                          "These settings are used when the trip has no availability dates or recurring rules set. They provide default values for flexible booking.",
                          "yatra"
                        ),
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(HelpCircle, { className: "w-4 h-4 text-gray-400 cursor-help" })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-amber-800 dark:text-amber-200", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium mb-1", children: __$1("When are these settings used?", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-amber-700 dark:text-amber-300", children: __$1(
                        "These settings apply ONLY when your trip has ZERO availability dates AND ZERO recurring rules. They provide defaults for flexible booking scenarios.",
                        "yatra"
                      ) })
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    formData.trip_type === "single_day" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("h5", { className: "text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4" }),
                        __$1("Day Tour Time Settings", "yatra")
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "checkbox",
                            id: "has_default_time_slots",
                            checked: formData.has_default_time_slots,
                            onChange: (e) => handleFieldChange(
                              "has_default_time_slots",
                              e.target.checked
                            ),
                            className: "mt-0.5 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "label",
                            {
                              htmlFor: "has_default_time_slots",
                              className: "text-sm font-medium text-gray-900 dark:text-white cursor-pointer",
                              children: __$1("Enable Multiple Time Slots", "yatra")
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: __$1(
                            "Allow customers to select from multiple departure times (e.g., Morning, Afternoon, Evening tours)",
                            "yatra"
                          ) })
                        ] })
                      ] }) }),
                      formData.has_default_time_slots && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-900 dark:text-white", children: __$1("Time Slots Configuration", "yatra") }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 mt-1", children: __$1(
                              "Add multiple departure times for customers to choose from.",
                              "yatra"
                            ) })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Button,
                            {
                              type: "button",
                              variant: "outline",
                              size: "sm",
                              onClick: () => {
                                const newSlot = {
                                  id: `slot-${Date.now()}`,
                                  time: "09:00",
                                  label: ""
                                };
                                handleFieldChange("default_time_slots", [
                                  ...formData.default_time_slots,
                                  newSlot
                                ]);
                              },
                              className: "flex items-center gap-1",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                                __$1("Add Time Slot", "yatra")
                              ]
                            }
                          )
                        ] }),
                        formData.default_time_slots.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-8 h-8 mx-auto text-gray-400 mb-2" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: __$1("No time slots added yet", "yatra") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Button,
                            {
                              type: "button",
                              variant: "outline",
                              size: "sm",
                              onClick: () => {
                                const newSlot = {
                                  id: `slot-${Date.now()}`,
                                  time: "09:00",
                                  label: __$1("Morning Tour", "yatra")
                                };
                                handleFieldChange("default_time_slots", [
                                  newSlot
                                ]);
                              },
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-1" }),
                                __$1("Add First Time Slot", "yatra")
                              ]
                            }
                          )
                        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: formData.default_time_slots.map(
                          (slot, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "div",
                            {
                              className: "flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0 mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-blue-600 dark:text-blue-400", children: index + 1 }) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 grid grid-cols-1 md:grid-cols-2 gap-3", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1", children: __$1("Time", "yatra") }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                                      Input,
                                      {
                                        type: "time",
                                        value: slot.time,
                                        onChange: (e) => {
                                          const updated = [
                                            ...formData.default_time_slots
                                          ];
                                          updated[index] = {
                                            ...slot,
                                            time: e.target.value
                                          };
                                          handleFieldChange(
                                            "default_time_slots",
                                            updated
                                          );
                                        },
                                        className: "w-full"
                                      }
                                    )
                                  ] }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1", children: __$1("Label", "yatra") }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                                      Input,
                                      {
                                        type: "text",
                                        value: slot.label,
                                        onChange: (e) => {
                                          const updated = [
                                            ...formData.default_time_slots
                                          ];
                                          updated[index] = {
                                            ...slot,
                                            label: e.target.value
                                          };
                                          handleFieldChange(
                                            "default_time_slots",
                                            updated
                                          );
                                        },
                                        placeholder: __$1(
                                          "e.g., Morning Tour, Afternoon Tour",
                                          "yatra"
                                        ),
                                        className: "w-full"
                                      }
                                    )
                                  ] })
                                ] }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Button,
                                  {
                                    type: "button",
                                    variant: "ghost",
                                    size: "sm",
                                    onClick: () => {
                                      const updated = formData.default_time_slots.filter(
                                        (_, i) => i !== index
                                      );
                                      handleFieldChange(
                                        "default_time_slots",
                                        updated
                                      );
                                    },
                                    className: "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0 mt-1",
                                    title: __$1(
                                      "Remove time slot",
                                      "yatra"
                                    ),
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                                  }
                                )
                              ]
                            },
                            slot.id
                          )
                        ) })
                      ] }),
                      !formData.has_default_time_slots && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "label",
                          {
                            htmlFor: "departure_time_single",
                            className: "block text-sm font-medium text-gray-900 dark:text-white mb-2",
                            children: __$1("Default Departure Time", "yatra")
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            id: "departure_time_single",
                            type: "time",
                            value: formData.departure_time,
                            onChange: (e) => handleFieldChange(
                              "departure_time",
                              e.target.value
                            ),
                            className: "max-w-xs"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-gray-500 dark:text-gray-400", children: __$1(
                          "Single departure time for all bookings when multiple time slots are not enabled.",
                          "yatra"
                        ) })
                      ] })
                    ] }),
                    formData.trip_type === "multi_day" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("h5", { className: "text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4" }),
                        __$1("Multi-Day Trip Departure Settings", "yatra")
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "label",
                          {
                            htmlFor: "departure_time_multiday",
                            className: "block text-sm font-medium text-gray-900 dark:text-white mb-2",
                            children: __$1("Default Departure Time", "yatra")
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            id: "departure_time_multiday",
                            type: "time",
                            value: formData.departure_time,
                            onChange: (e) => handleFieldChange(
                              "departure_time",
                              e.target.value
                            ),
                            className: "max-w-xs"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-gray-500 dark:text-gray-400", children: __$1(
                          "Default departure time for trips without specific availability dates.",
                          "yatra"
                        ) })
                      ] })
                    ] }),
                    !formData.trip_type && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __$1(
                      "Please select a trip type (Day Tour or Multi-Day) to configure fallback settings.",
                      "yatra"
                    ) }) })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4 text-blue-500" }),
                __$1("Booking Policies", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-white mb-3", children: __$1("Age Restrictions", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "label",
                        {
                          htmlFor: "age_min",
                          className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                          children: __$1("Minimum Age", "yatra")
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          id: "age_min",
                          type: "number",
                          min: "0",
                          value: formData.age_min,
                          onChange: (e) => handleFieldChange("age_min", e.target.value),
                          placeholder: __$1("e.g., 18", "yatra"),
                          className: errors.age_min ? "border-red-500" : ""
                        }
                      ),
                      errors.age_min && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                        errors.age_min
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "label",
                        {
                          htmlFor: "age_max",
                          className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                          children: __$1("Maximum Age", "yatra")
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          id: "age_max",
                          type: "number",
                          min: "0",
                          value: formData.age_max,
                          onChange: (e) => handleFieldChange("age_max", e.target.value),
                          placeholder: __$1("e.g., 65", "yatra"),
                          className: errors.age_max ? "border-red-500" : ""
                        }
                      ),
                      errors.age_max && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                        errors.age_max
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-white mb-3", children: __$1("Trip Requirements", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "label",
                        {
                          htmlFor: "physical_requirements",
                          className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                          children: __$1("Physical Requirements", "yatra")
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "textarea",
                        {
                          id: "physical_requirements",
                          value: formData.physical_requirements,
                          onChange: (e) => handleFieldChange(
                            "physical_requirements",
                            e.target.value
                          ),
                          placeholder: __$1(
                            "e.g., Moderate fitness level required. Some walking involved but no strenuous activities.",
                            "yatra"
                          ),
                          rows: 3,
                          className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "label",
                        {
                          htmlFor: "visa_requirements",
                          className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                          children: __$1("Visa Requirements", "yatra")
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "textarea",
                        {
                          id: "visa_requirements",
                          value: formData.visa_requirements,
                          onChange: (e) => handleFieldChange(
                            "visa_requirements",
                            e.target.value
                          ),
                          placeholder: __$1(
                            "e.g., Tourist visa required. Can be obtained on arrival or in advance.",
                            "yatra"
                          ),
                          rows: 3,
                          className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "label",
                        {
                          htmlFor: "vaccination_requirements",
                          className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                          children: __$1("Vaccination Requirements", "yatra")
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "textarea",
                        {
                          id: "vaccination_requirements",
                          value: formData.vaccination_requirements,
                          onChange: (e) => handleFieldChange(
                            "vaccination_requirements",
                            e.target.value
                          ),
                          placeholder: __$1(
                            "e.g., No mandatory vaccinations. Recommended: Hepatitis A, Typhoid, and routine vaccinations.",
                            "yatra"
                          ),
                          rows: 3,
                          className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                        }
                      )
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __$1("Cancellation Policy", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      AiFieldAffordance,
                      {
                        task: "trip-cancellation-policy",
                        label: __$1("Cancellation Policy", "yatra"),
                        value: formData.cancellation_policy,
                        onAccept: (v) => handleFieldChange("cancellation_policy", v),
                        buildContext: () => buildTripAiContext(formData)
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "textarea",
                    {
                      id: "cancellation_policy",
                      value: formData.cancellation_policy,
                      onChange: (e) => handleFieldChange("cancellation_policy", e.target.value),
                      placeholder: __$1(
                        "e.g., Free cancellation up to 30 days before departure. 50% refund for cancellations 15-30 days before. No refund for cancellations less than 15 days before.",
                        "yatra"
                      ),
                      rows: 4,
                      className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4 text-blue-500" }),
                __$1("Booking Availability", "yatra"),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ProBadge, { isProActive: isPro })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ProFeature,
                {
                  description: __$1(
                    "disable the booking calendar and make trips enquiry-only",
                    "yatra"
                  ),
                  moduleName: __$1("Enquiry Only Mode", "yatra"),
                  pricingUrl: "https://wpyatra.com/pricing",
                  isProActive: isPro,
                  isModuleEnabled: isPro,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center h-5 mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        id: "disable_booking",
                        type: "checkbox",
                        checked: formData.disable_booking,
                        onChange: (e) => handleFieldChange("disable_booking", e.target.checked),
                        className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "label",
                        {
                          htmlFor: "disable_booking",
                          className: "block text-sm font-medium text-gray-900 dark:text-white cursor-pointer",
                          children: __$1("Disable Booking Calendar", "yatra")
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: __$1(
                        "When enabled, the booking form and date picker will be hidden. Visitors can only send an enquiry for this trip.",
                        "yatra"
                      ) })
                    ] })
                  ] })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Home, { className: "w-4 h-4 text-blue-500" }),
                __$1("Accommodation", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "label",
                      {
                        htmlFor: "accommodation_type",
                        className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                        children: __$1("Accommodation Type", "yatra")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "accommodation_type",
                        type: "text",
                        value: formData.accommodation_type,
                        onChange: (e) => handleFieldChange(
                          "accommodation_type",
                          e.target.value
                        ),
                        placeholder: __$1(
                          "e.g., Hotel, Resort, Teahouse, Camping",
                          "yatra"
                        )
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "label",
                      {
                        htmlFor: "meal_plan",
                        className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                        children: __$1("Meal Plan", "yatra")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Select,
                      {
                        id: "meal_plan",
                        value: formData.meal_plan,
                        onChange: (e) => handleFieldChange("meal_plan", e.target.value),
                        children: MEAL_PLAN_SELECT_OPTIONS.map(({ value, label }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "option",
                          {
                            value,
                            children: label
                          },
                          value || "meal-plan-empty"
                        ))
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-xs text-gray-500 dark:text-gray-400", children: __$1(
                      "Tells travelers which meals are included with lodging (e.g. breakfast only vs full board).",
                      "yatra"
                    ) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      htmlFor: "accommodation_details",
                      className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                      children: __$1("Accommodation Details", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "textarea",
                    {
                      id: "accommodation_details",
                      value: formData.accommodation_details,
                      onChange: (e) => handleFieldChange(
                        "accommodation_details",
                        e.target.value
                      ),
                      placeholder: __$1(
                        "e.g., 4-star beachfront resort with private balconies, infinity pool, and spa facilities",
                        "yatra"
                      ),
                      rows: 3,
                      className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "w-4 h-4 text-blue-500" }),
                __$1("Transportation", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "checkbox",
                      id: "transportation_included",
                      checked: formData.transportation_included,
                      onChange: (e) => handleFieldChange(
                        "transportation_included",
                        e.target.checked
                      ),
                      className: "w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      htmlFor: "transportation_included",
                      className: "text-sm font-medium text-gray-900 dark:text-white",
                      children: __$1("Transportation Included", "yatra")
                    }
                  )
                ] }),
                formData.transportation_included && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "label",
                        {
                          htmlFor: "pickup_location",
                          className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                          children: __$1("Pickup Location", "yatra")
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          id: "pickup_location",
                          type: "text",
                          value: formData.pickup_location,
                          onChange: (e) => handleFieldChange(
                            "pickup_location",
                            e.target.value
                          ),
                          placeholder: __$1(
                            "e.g., Airport, Hotel, City Center",
                            "yatra"
                          )
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "label",
                        {
                          htmlFor: "dropoff_location",
                          className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                          children: __$1("Dropoff Location", "yatra")
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          id: "dropoff_location",
                          type: "text",
                          value: formData.dropoff_location,
                          onChange: (e) => handleFieldChange(
                            "dropoff_location",
                            e.target.value
                          ),
                          placeholder: __$1(
                            "e.g., Airport, Hotel, City Center",
                            "yatra"
                          )
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "label",
                      {
                        htmlFor: "transportation_details",
                        className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                        children: __$1("Transportation Details", "yatra")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "textarea",
                      {
                        id: "transportation_details",
                        value: formData.transportation_details,
                        onChange: (e) => handleFieldChange(
                          "transportation_details",
                          e.target.value
                        ),
                        placeholder: __$1(
                          "e.g., Private air-conditioned vehicle with professional driver",
                          "yatra"
                        ),
                        rows: 3,
                        className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                      }
                    )
                  ] })
                ] })
              ] })
            ] })
          ] })
        ] });
      case "categorization":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "w-5 h-5 text-gray-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __$1("Categories & Attributes", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: "text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800",
                children: __$1("Recommended", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-4", children: [
            __$1("How should travelers find this trip?", "yatra"),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400 mt-1", children: __$1(
              "Organize your trip with categories, activities, and custom attributes to help travelers discover it through search and filters.",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "w-4 h-4 text-blue-500" }),
                __$1("Categories & Classification", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Trip Categories", "yatra") }),
                  tripCategories && tripCategories.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    MultiSelect,
                    {
                      value: formData.trip_category,
                      onChange: (values) => handleFieldChange(
                        "trip_category",
                        values.map((v) => Number(v))
                      ),
                      options: (() => {
                        const flattenCategories = (cats, prefix = "") => {
                          const result = [];
                          cats.forEach((cat) => {
                            result.push({
                              value: cat.id,
                              label: prefix + cat.name
                            });
                            if (cat.subcategories && cat.subcategories.length > 0) {
                              result.push(
                                ...flattenCategories(
                                  cat.subcategories,
                                  prefix + "— "
                                )
                              );
                            }
                          });
                          return result;
                        };
                        return flattenCategories(tripCategories);
                      })(),
                      placeholder: __$1("Select categories...", "yatra"),
                      searchPlaceholder: __$1("Search categories...", "yatra")
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: [
                    __$1("No categories available. ", "yatra"),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "a",
                      {
                        href: "/wp-admin/admin.php?page=yatra&subpage=trips&tab=categories",
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-blue-600 hover:text-blue-700 underline",
                        children: __$1("Create categories here", "yatra")
                      }
                    )
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "Select one or more categories for this trip",
                        "yatra"
                      ),
                      className: "mt-2"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      htmlFor: "difficulty_level",
                      className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                      children: __$1("Difficulty Level", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      id: "difficulty_level",
                      value: formData.difficulty_level,
                      onChange: (e) => handleFieldChange("difficulty_level", e.target.value),
                      disabled: isLoadingDifficultyLevels,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __$1("Select difficulty", "yatra") }),
                        isLoadingDifficultyLevels && /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", disabled: true, children: __$1("Loading difficulty levels...", "yatra") }),
                        !isLoadingDifficultyLevels && difficultyLevels.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", disabled: true, children: __$1(
                          "No difficulty levels available - Click below to create",
                          "yatra"
                        ) }),
                        !isLoadingDifficultyLevels && difficultyLevels.map((level) => {
                          var _a3;
                          return /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "option",
                            {
                              value: ((_a3 = level.id) == null ? void 0 : _a3.toString()) || "",
                              children: level.name
                            },
                            `difficulty-${level.id}`
                          );
                        })
                      ]
                    }
                  ),
                  !isLoadingDifficultyLevels && difficultyLevels.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-amber-700 dark:text-amber-300", children: [
                    __$1("No difficulty levels available. ", "yatra"),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "a",
                      {
                        href: "/wp-admin/admin.php?page=yatra&subpage=trips&tab=difficulty-levels",
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-amber-800 hover:text-amber-900 underline font-medium",
                        children: __$1("Create difficulty levels here", "yatra")
                      }
                    )
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "Physical difficulty level required for this trip",
                        "yatra"
                      ),
                      className: "mt-2"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Activity Types", "yatra") }),
                  activitiesData && activitiesData.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    MultiSelect,
                    {
                      value: formData.activity_types,
                      onChange: (values) => handleFieldChange(
                        "activity_types",
                        values.map((v) => Number(v))
                      ),
                      options: activitiesData.map((activity) => ({
                        value: activity.id,
                        label: activity.name
                      })),
                      placeholder: __$1("Select activities...", "yatra"),
                      searchPlaceholder: __$1("Search activities...", "yatra")
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: [
                    __$1("No activities available. ", "yatra"),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "a",
                      {
                        href: "/wp-admin/admin.php?page=yatra&subpage=trips&tab=activities",
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-blue-600 hover:text-blue-700 underline",
                        children: __$1("Create activities here", "yatra")
                      }
                    )
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "Select all activities included in this trip",
                        "yatra"
                      ),
                      className: "mt-2"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      htmlFor: "featured_priority",
                      className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                      children: __$1("Featured Priority", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      id: "featured_priority",
                      value: formData.featured_priority,
                      onChange: (e) => handleFieldChange(
                        "featured_priority",
                        e.target.value
                      ),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "none", children: __$1("None", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "featured", children: __$1("Featured", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "new", children: __$1("New", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "limited", children: __$1("Limited Time", "yatra") })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "Special designation for frontend display and promotion",
                        "yatra"
                      ),
                      className: "mt-2"
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "w-4 h-4 text-blue-500" }),
                __$1("Custom Attributes", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-4", children: __$1(
                "Add custom attributes for advanced filtering and search capabilities.",
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TripAttributesSection,
                {
                  formData,
                  handleFieldChange,
                  tripId: tripId || void 0,
                  isEditMode,
                  tripAttributesData,
                  tripAttributesReady
                }
              )
            ] })
          ] })
        ] });
      case "media":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "w-5 h-5 text-gray-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __$1("Media & Content", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: "text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800",
                children: __$1("Recommended", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-6", children: [
            __$1(
              "Add visual content, videos, stories, and testimonials to showcase your trip",
              "yatra"
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400 mt-1", children: __$1(
              "Optional, but adding rich media greatly increases engagement and conversions.",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __$1("Photo Gallery", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __$1(
                  "Upload images to showcase your trip. These will be displayed on the trip page.",
                  "yatra"
                ) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4 mb-4", children: [
                  formData.gallery_images.map((image, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: image.thumbnail_url || image.url,
                        alt: image.alt_text || `Gallery ${index + 1}`,
                        className: "w-full h-full object-cover"
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [
                      index > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleGalleryReorder(index, index - 1),
                          className: "bg-black/60 text-white rounded p-1 hover:bg-black/80",
                          title: __$1("Move left", "yatra"),
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "w-4 h-4" })
                        }
                      ),
                      index < formData.gallery_images.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleGalleryReorder(index, index + 1),
                          className: "bg-black/60 text-white rounded p-1 hover:bg-black/80",
                          title: __$1("Move right", "yatra"),
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4" })
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-2 left-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded", children: index + 1 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleGalleryRemove(index),
                        className: "absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                      }
                    )
                  ] }, index)),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: handleGalleryAdd,
                      className: `aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${errors.gallery_images ? "border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Upload,
                          {
                            className: `w-8 h-8 mb-2 ${errors.gallery_images ? "text-red-400" : "text-gray-400"}`
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "span",
                          {
                            className: `text-sm ${errors.gallery_images ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}`,
                            children: __$1("Add Image", "yatra")
                          }
                        )
                      ]
                    }
                  )
                ] }),
                errors.gallery_images && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                  errors.gallery_images
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __$1("Video & Virtual Tour", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __$1(
                  "Add video content to showcase your trip visually",
                  "yatra"
                ) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: [
                    __$1("Video URL", "yatra"),
                    " (YouTube/Vimeo)"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "Paste the full URL from YouTube or Vimeo. The video will be embedded on your trip page.",
                        "yatra"
                      ),
                      className: "mb-2"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "url",
                      value: formData.video_url,
                      onChange: (e) => handleFieldChange("video_url", e.target.value),
                      placeholder: "https://www.youtube.com/watch?v=...",
                      className: `font-mono text-xs ${errors.video_url ? "border-red-500" : ""}`
                    }
                  ),
                  errors.video_url && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                    errors.video_url
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("360° Virtual Tour URL", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "Add a link to an interactive 360° virtual tour if available",
                        "yatra"
                      ),
                      className: "mb-2"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "url",
                      value: formData.virtual_tour_url,
                      onChange: (e) => handleFieldChange("virtual_tour_url", e.target.value),
                      placeholder: "https://...",
                      className: `font-mono text-xs ${errors.virtual_tour_url ? "border-red-500" : ""}`
                    }
                  ),
                  errors.virtual_tour_url && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                    errors.virtual_tour_url
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __$1("Trip Story & Special Features", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __$1(
                  "Tell an engaging story and highlight what makes this trip unique",
                  "yatra"
                ) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("What Makes This Trip Special", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "Highlight the unique selling points and what sets this trip apart from others",
                        "yatra"
                      ),
                      className: "mb-2"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "textarea",
                    {
                      value: formData.what_makes_special,
                      onChange: (e) => handleFieldChange("what_makes_special", e.target.value),
                      placeholder: __$1(
                        "Describe what makes this trip unique and special...",
                        "yatra"
                      ),
                      rows: 5,
                      className: "flex w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-normal text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:ring-offset-gray-900 dark:placeholder:text-gray-500 dark:focus-visible:ring-blue-400 resize-none transition-colors"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Trip Story / Narrative", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "Tell an engaging story about this trip. Use storytelling to connect with potential travelers emotionally",
                        "yatra"
                      ),
                      className: "mb-2"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "textarea",
                    {
                      value: formData.trip_story,
                      onChange: (e) => handleFieldChange("trip_story", e.target.value),
                      placeholder: __$1(
                        "Write an engaging narrative about this trip...",
                        "yatra"
                      ),
                      rows: 8,
                      className: "flex w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-normal text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:ring-offset-gray-900 dark:placeholder:text-gray-500 dark:focus-visible:ring-blue-400 resize-none transition-colors"
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TestimonialsSelector,
              {
                tripId,
                selectedReviewIds: formData.testimonial_review_ids,
                onChange: (reviewIds) => handleFieldChange("testimonial_review_ids", reviewIds)
              }
            )
          ] })
        ] });
      case "downloads":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-5 h-5 text-gray-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __$1("Downloads", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-6", children: __$1(
            "Attach files to this trip and control who can access them.",
            "yatra"
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __$1("Downloads", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __$1(
                "Attach files to this trip and control who can access them.",
                "yatra"
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              (formData.downloadable_items || []).length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: (formData.downloadable_items || []).map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Title", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            value: item.title,
                            onChange: (e) => handleDownloadableItemChange(
                              index,
                              "title",
                              e.target.value
                            ),
                            placeholder: __$1(
                              "E.g. Packing list, itinerary PDF, waiver form...",
                              "yatra"
                            )
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 pt-7", children: [
                        index > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            type: "button",
                            variant: "ghost",
                            size: "sm",
                            onClick: () => handleDownloadableItemMove(index, index - 1),
                            title: __$1("Move up", "yatra"),
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "w-4 h-4" })
                          }
                        ),
                        index < (formData.downloadable_items || []).length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            type: "button",
                            variant: "ghost",
                            size: "sm",
                            onClick: () => handleDownloadableItemMove(index, index + 1),
                            title: __$1("Move down", "yatra"),
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-4 h-4" })
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            type: "button",
                            variant: "ghost",
                            size: "sm",
                            onClick: () => handleDownloadableItemRemove(index),
                            className: "text-red-600 hover:text-red-700",
                            title: __$1("Remove", "yatra"),
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: [
                        __$1("Description", "yatra"),
                        " (",
                        __$1("Optional", "yatra"),
                        ")"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "textarea",
                        {
                          value: item.description,
                          onChange: (e) => handleDownloadableItemChange(
                            index,
                            "description",
                            e.target.value
                          ),
                          rows: 3,
                          className: "flex w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-normal text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:ring-offset-gray-900 dark:placeholder:text-gray-500 dark:focus-visible:ring-blue-400 resize-none transition-colors"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Visibility", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Select,
                          {
                            value: item.visibility,
                            onChange: (e) => handleDownloadableItemChange(
                              index,
                              "visibility",
                              e.target.value
                            ),
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "public", children: __$1("Public", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "logged_in", children: __$1("Private (My Account only)", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "booked_only", children: __$1(
                                "Private (Booking confirmation only)",
                                "yatra"
                              ) })
                            ]
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("File", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                          item.attachment_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "a",
                            {
                              href: item.attachment_url,
                              target: "_blank",
                              rel: "noreferrer",
                              className: "flex-shrink-0",
                              title: __$1("View file", "yatra"),
                              children: /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(
                                item.attachment_url
                              ) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "img",
                                {
                                  src: item.attachment_url,
                                  alt: item.attachment_title || __$1("Selected file", "yatra"),
                                  className: "w-9 h-9 rounded border border-gray-200 dark:border-gray-700 object-cover bg-white dark:bg-gray-900"
                                }
                              ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4 text-gray-500 dark:text-gray-400" }) })
                            }
                          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900 flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4 text-gray-400 dark:text-gray-600" }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Button,
                              {
                                type: "button",
                                variant: "outline",
                                onClick: () => handleDownloadableItemSelectFile(index),
                                className: "flex items-center gap-2 flex-shrink-0",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "w-4 h-4" }),
                                  item.attachment_id ? __$1("Change File", "yatra") : __$1("Select File", "yatra")
                                ]
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-600 dark:text-gray-400 truncate min-w-0", children: item.attachment_title || (item.attachment_id ? `#${item.attachment_id}` : __$1("No file selected", "yatra")) }),
                            item.attachment_url && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              "a",
                              {
                                href: item.attachment_url,
                                target: "_blank",
                                rel: "noreferrer",
                                className: "text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 flex-shrink-0",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-3 h-3" }),
                                  __$1("View", "yatra")
                                ]
                              }
                            )
                          ] }) })
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 pt-0.5", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "checkbox",
                            checked: item.enabled,
                            onChange: (e) => handleDownloadableItemChange(
                              index,
                              "enabled",
                              e.target.checked
                            ),
                            className: "h-4 w-4"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: __$1("Enabled", "yatra") })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 leading-relaxed", children: __$1(
                        "Controls whether this file appears and is available for download on the trip page. When disabled, the file is completely hidden from users.",
                        "yatra"
                      ) }) })
                    ] })
                  ]
                },
                index
              )) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-3", children: __$1("No downloads added yet", "yatra") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: handleDownloadableItemAdd,
                  className: "w-full",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                    __$1("Add Download", "yatra")
                  ]
                }
              )
            ] })
          ] })
        ] });
      case "pricing":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-5 h-5 text-gray-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __$1("Pricing & Payment", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: "text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800",
                children: __$1("Recommended", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-4", children: [
            __$1("How much does it cost?", "yatra"),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400 mt-1", children: __$1(
              "Set pricing for different traveler types and payment options. Optional for drafts, but adding pricing now makes publishing easier.",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-3", children: __$1("Pricing Type", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "label",
                  {
                    className: `relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${formData.pricing_type === "regular" ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "radio",
                          name: "pricing_type",
                          value: "regular",
                          checked: formData.pricing_type === "regular",
                          onChange: (e) => handleFieldChange("pricing_type", e.target.value),
                          className: "sr-only"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "span",
                          {
                            className: `block text-sm font-semibold ${formData.pricing_type === "regular" ? "text-blue-900 dark:text-blue-300" : "text-gray-900 dark:text-white"}`,
                            children: __$1("Regular Pricing", "yatra")
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "span",
                          {
                            className: `mt-1 flex items-center text-sm ${formData.pricing_type === "regular" ? "text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`,
                            children: __$1("Set a single price for all travelers", "yatra")
                          }
                        )
                      ] }) }),
                      formData.pricing_type === "regular" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 right-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 rounded-full bg-blue-600" }) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "label",
                  {
                    className: `relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${formData.pricing_type === "traveler_based" ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "radio",
                          name: "pricing_type",
                          value: "traveler_based",
                          checked: formData.pricing_type === "traveler_based",
                          onChange: (e) => handleFieldChange("pricing_type", e.target.value),
                          className: "sr-only"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "span",
                          {
                            className: `block text-sm font-semibold ${formData.pricing_type === "traveler_based" ? "text-blue-900 dark:text-blue-300" : "text-gray-900 dark:text-white"}`,
                            children: __$1("Traveler-Based Pricing", "yatra")
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "span",
                          {
                            className: `mt-1 flex items-center text-sm ${formData.pricing_type === "traveler_based" ? "text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`,
                            children: __$1(
                              "Set different prices for each traveler category",
                              "yatra"
                            )
                          }
                        )
                      ] }) }),
                      formData.pricing_type === "traveler_based" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 right-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 rounded-full bg-blue-600" }) })
                    ]
                  }
                )
              ] })
            ] }),
            formData.pricing_type === "regular" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Original Price", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: getCurrencySymbol(globalCurrency) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "number",
                      step: "0.01",
                      min: "0",
                      value: formData.original_price,
                      onChange: (e) => handleFieldChange("original_price", e.target.value),
                      placeholder: "0.00",
                      className: `pl-7 ${errors.original_price ? "border-red-500" : ""}`
                    }
                  )
                ] }),
                errors.original_price && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.original_price })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: [
                  __$1("Discounted Price", "yatra"),
                  " (",
                  __$1("Optional", "yatra"),
                  ")"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: getCurrencySymbol(globalCurrency) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "number",
                      step: "0.01",
                      min: "0",
                      value: formData.discounted_price,
                      onChange: (e) => handleFieldChange(
                        "discounted_price",
                        e.target.value
                      ),
                      placeholder: "0.00",
                      className: `pl-7 ${errors.discounted_price ? "border-red-500" : ""}`
                    }
                  )
                ] }),
                errors.discounted_price && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.discounted_price })
              ] })
            ] }) }),
            formData.pricing_type === "traveler_based" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400", children: __$1("Traveler Category Pricing", "yatra") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-3", children: __$1(
                "Add pricing for traveler categories. Categories are managed in Traveler Categories page.",
                "yatra"
              ) }),
              isLoadingCategories ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-6 h-6 animate-spin text-gray-400" }) }) : activeCategories.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border border-gray-200 dark:border-gray-700 rounded-lg text-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-3", children: __$1("No active traveler categories found.", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: () => window.location.href = "?page=yatra&subpage=traveler-categories&action=create",
                    className: "flex items-center gap-2 mx-auto",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                      __$1("Create Category", "yatra")
                    ]
                  }
                )
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      onClick: () => setShowCategorySelector(!showCategorySelector),
                      className: "flex items-center gap-2",
                      disabled: activeCategories.filter(
                        (cat) => !formData.price_types.some(
                          (pt) => Number(pt.category_id) === Number(cat.id)
                        )
                      ).length === 0,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                        __$1("Add Pricing", "yatra")
                      ]
                    }
                  ),
                  showCategorySelector && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "fixed inset-0 z-10",
                        onClick: () => setShowCategorySelector(false)
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-full left-0 mt-2 w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-gray-700 dark:text-gray-300 px-3 py-2 mb-1", children: __$1(
                        "Select a category to add pricing",
                        "yatra"
                      ) }),
                      activeCategories.filter(
                        (cat) => !formData.price_types.some(
                          (pt) => Number(pt.category_id) === Number(cat.id)
                        )
                      ).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center", children: __$1(
                        "All categories have pricing added",
                        "yatra"
                      ) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: activeCategories.filter(
                        (cat) => !formData.price_types.some(
                          (pt) => Number(pt.category_id) === Number(cat.id)
                        )
                      ).map((category) => {
                        const ageRange = category.age_min !== void 0 || category.age_max !== void 0 ? category.age_min !== void 0 && category.age_max !== void 0 ? `${category.age_min}-${category.age_max} ${__$1("years", "yatra")}` : category.age_min !== void 0 ? `${category.age_min}+ ${__$1("years", "yatra")}` : category.age_max !== void 0 ? `${__$1("Under", "yatra")} ${category.age_max} ${__$1("years", "yatra")}` : "" : null;
                        const pricingMode = category.pricing_mode || "per_person";
                        const hasMin = category.min_pax !== null && category.min_pax !== void 0;
                        const hasMax = category.max_pax !== null && category.max_pax !== void 0;
                        let pricingLabel = "";
                        if (pricingMode === "per_group") {
                          if (hasMin && hasMax) {
                            pricingLabel = `${__$1("Per group", "yatra")} (${category.min_pax}-${category.max_pax})`;
                          } else if (hasMin) {
                            pricingLabel = `${__$1("Per group", "yatra")} (${__$1("From", "yatra")} ${category.min_pax})`;
                          } else if (hasMax) {
                            pricingLabel = `${__$1("Per group", "yatra")} (${__$1("Up to", "yatra")} ${category.max_pax})`;
                          } else {
                            pricingLabel = __$1(
                              "Per group",
                              "yatra"
                            );
                          }
                        } else {
                          pricingLabel = __$1(
                            "Per person",
                            "yatra"
                          );
                        }
                        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              handlePriceTypeAdd(category.id);
                              setShowCategorySelector(false);
                            },
                            className: "w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium text-sm text-gray-900 dark:text-white", children: [
                                category.label,
                                ageRange && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-xs font-normal text-gray-500 dark:text-gray-400", children: [
                                  "(",
                                  ageRange,
                                  ")"
                                ] })
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: [
                                category.description,
                                pricingLabel && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-1 text-[11px] font-medium text-gray-600 dark:text-gray-300", children: [
                                  "• ",
                                  pricingLabel
                                ] })
                              ] })
                            ]
                          },
                          category.id
                        );
                      }) })
                    ] }) })
                  ] })
                ] }),
                formData.price_types.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: formData.price_types.map((priceType, index) => {
                  const category = activeCategories.find(
                    (cat) => Number(cat.id) === Number(priceType.category_id)
                  );
                  if (!category) {
                    return null;
                  }
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "p-4 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-3", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 mb-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: [
                              category.label,
                              (category.age_min !== void 0 || category.age_max !== void 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-xs font-normal text-gray-500 dark:text-gray-400", children: [
                                "(",
                                category.age_min !== void 0 && category.age_max !== void 0 ? `${category.age_min}-${category.age_max} ${__$1("years", "yatra")}` : category.age_min !== void 0 ? `${category.age_min}+ ${__$1("years", "yatra")}` : category.age_max !== void 0 ? `${__$1("Under", "yatra")} ${category.age_max} ${__$1("years", "yatra")}` : "",
                                ")"
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300", children: (() => {
                                const pricingMode = category.pricing_mode || "per_person";
                                const hasMin = category.min_pax !== null && category.min_pax !== void 0;
                                const hasMax = category.max_pax !== null && category.max_pax !== void 0;
                                if (pricingMode === "per_group") {
                                  if (hasMin && hasMax) {
                                    return `${__$1("Per group", "yatra")} (${category.min_pax}-${category.max_pax})`;
                                  }
                                  if (hasMin) {
                                    return `${__$1("Per group", "yatra")} (${__$1("From", "yatra")} ${category.min_pax})`;
                                  }
                                  if (hasMax) {
                                    return `${__$1("Per group", "yatra")} (${__$1("Up to", "yatra")} ${category.max_pax})`;
                                  }
                                  return __$1("Per group", "yatra");
                                }
                                return __$1("Per person", "yatra");
                              })() })
                            ] }) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: category.description })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () => handlePriceTypeRemove(category.id),
                              className: "p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors",
                              title: __$1("Remove Pricing", "yatra"),
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: __$1("Original Price", "yatra") }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: getCurrencySymbol(globalCurrency) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Input,
                                {
                                  type: "number",
                                  step: "0.01",
                                  min: "0",
                                  value: priceType.original_price,
                                  onChange: (e) => handlePriceTypeChange(
                                    category.id,
                                    "original_price",
                                    e.target.value
                                  ),
                                  placeholder: "0.00",
                                  className: `pl-7 ${errors[`price_type_${index}_original`] ? "border-red-500" : ""}`
                                }
                              )
                            ] }),
                            errors[`price_type_${index}_original`] && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-600 dark:text-red-400", children: errors[`price_type_${index}_original`] })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                              __$1("Discounted Price", "yatra"),
                              " (",
                              __$1("Optional", "yatra"),
                              ")"
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: getCurrencySymbol(globalCurrency) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Input,
                                {
                                  type: "number",
                                  step: "0.01",
                                  min: "0",
                                  value: priceType.discounted_price,
                                  onChange: (e) => handlePriceTypeChange(
                                    category.id,
                                    "discounted_price",
                                    e.target.value
                                  ),
                                  placeholder: "0.00",
                                  className: `pl-7 ${errors[`price_type_${index}_discounted`] ? "border-red-500" : ""}`
                                }
                              )
                            ] }),
                            errors[`price_type_${index}_discounted`] && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-600 dark:text-red-400", children: errors[`price_type_${index}_discounted`] })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center justify-between", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "inline-flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "input",
                              {
                                type: "checkbox",
                                checked: Boolean(priceType.is_default),
                                onChange: (e) => handlePriceTypeDefaultChange(
                                  category.id,
                                  e.target.checked
                                ),
                                className: "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                              }
                            ),
                            __$1(
                              "Default price (used on page load)",
                              "yatra"
                            )
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-gray-500 dark:text-gray-400", children: __$1("Traveler-based pricing only", "yatra") })
                        ] })
                      ]
                    },
                    priceType.category_id
                  );
                }) }),
                formData.price_types.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __$1(
                    "No pricing added yet. Select a category above to add pricing.",
                    "yatra"
                  ) })
                ] })
              ] }),
              errors.price_types && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                errors.price_types
              ] })
            ] }),
            (() => {
              var _a3, _b2;
              const flexiblePaymentsEnabled = Boolean(
                (_a3 = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a3.flexiblePaymentsEnabled
              );
              const isLocked = !flexiblePaymentsEnabled;
              const siteUrl = ((_b2 = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _b2.siteUrl) || "/wp-admin/admin.php?page=yatra";
              const modulesPageUrl = `${siteUrl}/wp-admin/admin.php?page=yatra&subpage=modules`;
              const pricingUrl = "https://mantrabrain.com/yatra-pricing/";
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center", children: [
                  __$1("Deposit & Payment Terms", "yatra"),
                  isLocked && /* @__PURE__ */ jsxRuntimeExports.jsx(ProBadge, { isProActive: isPro })
                ] }),
                isLocked && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-md text-xs text-purple-900 dark:text-purple-100 flex items-start gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "svg",
                    {
                      className: "w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24",
                      "aria-hidden": "true",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeWidth: 2,
                          d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: isPro ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    __$1(
                      "Per-trip deposits need the Flexible Payments module.",
                      "yatra"
                    ),
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "a",
                      {
                        href: modulesPageUrl,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "underline font-medium",
                        children: __$1("Activate module", "yatra")
                      }
                    )
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    __$1(
                      "Per-trip deposit amount, percentage and custom payment terms are a Yatra Pro feature.",
                      "yatra"
                    ),
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "a",
                      {
                        href: pricingUrl,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "underline font-medium",
                        children: __$1("Upgrade to Pro", "yatra")
                      }
                    )
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "fieldset",
                  {
                    disabled: isLocked,
                    className: isLocked ? "opacity-60 cursor-not-allowed select-none" : "",
                    "aria-label": isLocked ? __$1(
                      "Deposit & Payment Terms (Pro feature, disabled)",
                      "yatra"
                    ) : void 0,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "label",
                            {
                              htmlFor: "deposit_amount",
                              className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                              children: __$1("Deposit Amount", "yatra")
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500", children: getCurrencySymbol(globalCurrency) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                id: "deposit_amount",
                                type: "number",
                                step: "0.01",
                                min: "0",
                                value: formData.deposit_amount,
                                onChange: (e) => handleFieldChange(
                                  "deposit_amount",
                                  e.target.value
                                ),
                                placeholder: "0.00",
                                className: "pl-7"
                              }
                            )
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "label",
                            {
                              htmlFor: "deposit_percentage",
                              className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                              children: __$1("Deposit Percentage", "yatra")
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                id: "deposit_percentage",
                                type: "number",
                                step: "0.01",
                                min: "0",
                                max: "100",
                                value: formData.deposit_percentage,
                                onChange: (e) => handleFieldChange(
                                  "deposit_percentage",
                                  e.target.value
                                ),
                                placeholder: "0",
                                className: "pr-7"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500", children: "%" })
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "label",
                          {
                            htmlFor: "payment_terms",
                            className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                            children: __$1("Payment Terms", "yatra")
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "textarea",
                          {
                            id: "payment_terms",
                            value: formData.payment_terms,
                            onChange: (e) => handleFieldChange("payment_terms", e.target.value),
                            placeholder: __$1(
                              "e.g., 50% deposit required at booking, balance due 30 days before departure",
                              "yatra"
                            ),
                            rows: 2,
                            className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                          }
                        )
                      ] })
                    ]
                  }
                )
              ] });
            })()
          ] })
        ] });
      case "attributes":
        setCurrentSection("categorization");
        return null;
      case "itinerary":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "w-5 h-5 text-gray-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __$1("Trip Details", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: "text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800",
                children: __$1("Recommended", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-4", children: [
            __$1("What will travelers experience?", "yatra"),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400 mt-1", children: __$1(
              "Build your day-by-day itinerary and list what's included/excluded to set clear expectations.",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "flex gap-6", "aria-label": "Trip Details Tabs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setTripDetailsTab("itinerary"),
                className: `pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${tripDetailsTab === "itinerary" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4" }),
                  __$1("Itinerary", "yatra")
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setTripDetailsTab("included"),
                className: `pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${tripDetailsTab === "included" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CheckSquare, { className: "w-4 h-4" }),
                  __$1("Included/Excluded", "yatra")
                ] })
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6", children: [
            tripDetailsTab === "itinerary" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              isAiEligible() && isAiModuleEnabled() && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50/40 px-3 py-2 dark:border-blue-500/40 dark:bg-blue-900/20", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-blue-900 dark:text-blue-200", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-1 inline h-3.5 w-3.5" }),
                  isEditMode ? __$1(
                    "Let AI draft a day-by-day plan with real activity blocks — you can edit each day after.",
                    "yatra"
                  ) : __$1(
                    "Save the trip first to enable AI itinerary generation — the agent needs a trip ID to attach days to.",
                    "yatra"
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    size: "sm",
                    variant: "outline",
                    className: "border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-500/60 dark:text-blue-200",
                    disabled: !isEditMode || !tripId,
                    onClick: () => {
                      if (isEditMode && tripId) {
                        setItineraryBuildOpen(true);
                      }
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-1 h-3.5 w-3.5" }),
                      __$1("Build with AI", "yatra")
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ItinerarySection,
                {
                  formData,
                  isEditMode,
                  tripId
                }
              )
            ] }),
            tripDetailsTab === "included" && /* @__PURE__ */ jsxRuntimeExports.jsx(
              IncludedSection,
              {
                formData,
                errors,
                handleFieldChange
              }
            )
          ] })
        ] });
      case "included":
        setCurrentSection("itinerary");
        setTripDetailsTab("included");
        return null;
      case "faqs":
        setCurrentSection("seo");
        return null;
      case "seo":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "w-5 h-5 text-gray-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __$1("SEO & Marketing", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: "text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800",
                children: __$1("Recommended", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-4", children: [
            __$1("How will people find & trust this trip?", "yatra"),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400 mt-1", children: __$1(
              "Optimize for search engines and answer common questions to build trust and improve discoverability.",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "w-4 h-4 text-blue-500" }),
                __$1("Search Engine Optimization", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "label",
                      {
                        htmlFor: "meta_title",
                        className: "block text-xs font-normal text-gray-500 dark:text-gray-400",
                        children: __$1("Meta Title", "yatra")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      AiFieldAffordance,
                      {
                        task: "seo-meta-title",
                        label: __$1("Meta Title", "yatra"),
                        value: formData.meta_title,
                        onAccept: (v) => handleFieldChange("meta_title", v.slice(0, 60)),
                        buildContext: () => buildTripAiContext(formData)
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "meta_title",
                      type: "text",
                      value: formData.meta_title,
                      onChange: (e) => handleFieldChange("meta_title", e.target.value),
                      placeholder: formData.title || __$1("Trip Title", "yatra"),
                      maxLength: 60
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "Best for search engines: 50-60 characters. Include main keywords.",
                        "yatra"
                      ),
                      className: "mt-1"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "label",
                      {
                        htmlFor: "meta_description",
                        className: "block text-xs font-normal text-gray-500 dark:text-gray-400",
                        children: __$1("Meta Description", "yatra")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      AiFieldAffordance,
                      {
                        task: "seo-meta-description",
                        label: __$1("Meta Description", "yatra"),
                        value: formData.meta_description,
                        onAccept: (v) => handleFieldChange("meta_description", v.slice(0, 160)),
                        buildContext: () => buildTripAiContext(formData)
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "textarea",
                    {
                      id: "meta_description",
                      value: formData.meta_description,
                      onChange: (e) => handleFieldChange("meta_description", e.target.value),
                      rows: 3,
                      maxLength: 160,
                      className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none",
                      placeholder: __$1(
                        "Compelling description that includes key travel terms...",
                        "yatra"
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "160 characters max. Include location, duration, and key features.",
                        "yatra"
                      ),
                      className: "mt-1"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      htmlFor: "meta_keywords",
                      className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5",
                      children: __$1("Meta Keywords", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "meta_keywords",
                      type: "text",
                      value: formData.meta_keywords,
                      onChange: (e) => handleFieldChange("meta_keywords", e.target.value),
                      placeholder: __$1(
                        "adventure, travel, tour, guide, experience",
                        "yatra"
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "Comma-separated keywords. Include location, activities, and travel terms.",
                        "yatra"
                      ),
                      className: "mt-1"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __$1("SEO Preview", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __$1(
                    "Preview how your trip appears in search results",
                    "yatra"
                  ) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 dark:bg-gray-800 p-4 rounded-lg", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mb-2", children: __$1("Google Search Result Preview", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-blue-800 dark:text-blue-400 text-sm font-medium", children: sanitizeTextForSEO(
                      formData.meta_title || formData.title || "Trip Title",
                      60
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-green-700 dark:text-green-400 text-sm", children: formData.meta_description ? sanitizeTextForSEO(formData.meta_description, 150) : formData.description ? sanitizeTextForSEO(formData.description, 150) : "Trip description..." }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-gray-600 dark:text-gray-400 text-xs", children: [
                      window.location.hostname,
                      "/trip/",
                      formData.slug || "trip-slug"
                    ] })
                  ] })
                ] }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(HelpCircle, { className: "w-4 h-4 text-blue-500" }),
                  __$1("Frequently Asked Questions", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  AiFieldAffordance,
                  {
                    task: "trip-faq",
                    label: __$1("FAQ", "yatra"),
                    value: (formData.faqs ?? []).map((f) => `Q: ${f.question}
A: ${f.answer}`).join("\n\n"),
                    onAccept: (raw) => {
                      const parsed = [];
                      const blocks = raw.replace(/\r\n?/g, "\n").split(/\n{2,}/);
                      for (const block of blocks) {
                        const q = block.match(/^\s*Q[:\.\-]\s*(.+)/im);
                        const a = block.match(/A[:\.\-]\s*([\s\S]+)/im);
                        if (q) {
                          parsed.push({
                            question: q[1].trim(),
                            answer: a ? a[1].trim() : ""
                          });
                        }
                      }
                      if (parsed.length > 0) {
                        handleFieldChange("faqs", parsed);
                      }
                    },
                    buildContext: () => buildTripAiContext(formData)
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-4", children: __$1(
                "Answer common questions to build trust and reduce support inquiries. FAQs also help with SEO.",
                "yatra"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                formData.faqs.map((faq, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-sm font-medium text-gray-900 dark:text-white", children: [
                          __$1("FAQ", "yatra"),
                          " ",
                          index + 1
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => handleFAQRemove(index),
                            className: "text-red-600 hover:text-red-700",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Question", "yatra") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              type: "text",
                              value: faq.question,
                              onChange: (e) => handleFAQChange(index, "question", e.target.value),
                              placeholder: __$1("Enter question...", "yatra")
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Answer", "yatra") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "textarea",
                            {
                              value: faq.answer,
                              onChange: (e) => handleFAQChange(index, "answer", e.target.value),
                              placeholder: __$1("Enter answer...", "yatra"),
                              rows: 3,
                              className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                            }
                          )
                        ] })
                      ] })
                    ]
                  },
                  index
                )),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: handleFAQAdd,
                    className: "w-full",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                      __$1("Add FAQ", "yatra")
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] });
      case "advanced":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "w-5 h-5 text-gray-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __$1("Lifecycle Management", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: "text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800",
                children: __$1("Power Users", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-4", children: [
            __$1("When should this trip be published or archived?", "yatra"),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400 mt-1", children: __$1(
              "Schedule automatic publishing and unpublishing for seasonal trips. Optional but useful for managing trip lifecycles.",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __$1("Version Control", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __$1("Track changes and version history", "yatra") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Version", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: formData.version,
                  onChange: (e) => handleFieldChange(
                    "version",
                    parseInt(e.target.value) || 1
                  ),
                  min: "1",
                  readOnly: true,
                  className: "bg-gray-50 dark:bg-gray-800"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                HelpText,
                {
                  text: __$1(
                    "Version number is automatically incremented when changes are saved",
                    "yatra"
                  ),
                  className: "mt-2"
                }
              )
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __$1("Scheduled Publishing", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __$1(
                "Automatically publish or unpublish your trip on specific dates",
                "yatra"
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Schedule Publish Date", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DatePicker,
                  {
                    value: formData.scheduled_publish_date,
                    onChange: (val) => handleFieldChange("scheduled_publish_date", val),
                    placeholder: __$1("Select date", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __$1(
                      "Trip will be automatically published on this date and time",
                      "yatra"
                    ),
                    className: "mt-2"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Schedule Unpublish Date", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DatePicker,
                  {
                    value: formData.scheduled_unpublish_date,
                    onChange: (val) => handleFieldChange("scheduled_unpublish_date", val),
                    placeholder: __$1("Select date", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __$1(
                      "Trip will be automatically unpublished (archived) on this date and time",
                      "yatra"
                    ),
                    className: "mt-2"
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __$1("Seasonal Auto-Enable/Disable", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __$1(
                "Automatically enable or disable trip availability based on seasonal dates",
                "yatra"
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    id: "seasonal_auto_enable",
                    checked: formData.seasonal_auto_enable,
                    onChange: (e) => handleFieldChange(
                      "seasonal_auto_enable",
                      e.target.checked
                    ),
                    className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "label",
                  {
                    htmlFor: "seasonal_auto_enable",
                    className: "text-sm font-medium text-gray-700 dark:text-gray-300",
                    children: __$1("Enable seasonal auto-management", "yatra")
                  }
                )
              ] }),
              formData.seasonal_auto_enable && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Auto-Enable Date", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    DatePicker,
                    {
                      value: formData.seasonal_enable_date,
                      onChange: (val) => handleFieldChange("seasonal_enable_date", val),
                      placeholder: __$1("Select date", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "Trip will become available for booking on this date",
                        "yatra"
                      ),
                      className: "mt-2"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Auto-Disable Date", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    DatePicker,
                    {
                      value: formData.seasonal_disable_date,
                      onChange: (val) => handleFieldChange("seasonal_disable_date", val),
                      placeholder: __$1("Select date", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        "Trip will become unavailable for booking on this date",
                        "yatra"
                      ),
                      className: "mt-2"
                    }
                  )
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __$1("Frontend Tabs Management", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __$1(
                "Manage which tabs appear on the trip single page and in what order. Enable or disable tabs, customize labels, and reorder them.",
                "yatra"
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [...formData.frontend_tabs].sort((a, b) => a.order - b.order).map((tab, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  draggable: true,
                  onDragStart: (e) => handleDragStart(e, tab.id),
                  onDragOver: handleDragOver,
                  onDragEnter: () => handleDragEnter(tab.id),
                  onDragLeave: handleDragLeave,
                  onDrop: (e) => handleDrop(e, tab.id),
                  onDragEnd: handleDragEnd,
                  className: `p-4 rounded-lg border cursor-move relative ${tab.enabled ? "bg-gray-50 dark:bg-gray-850 border-gray-200 dark:border-gray-700 shadow-sm" : "bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-60 shadow-sm"} ${draggedTab === tab.id ? "opacity-50 scale-95 shadow-lg" : ""} ${dragOverTab === tab.id && draggedTab !== tab.id ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : ""}`,
                  children: [
                    tab.content_type === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        variant: "ghost",
                        size: "sm",
                        onClick: () => handleTabRemove(tab.id),
                        className: "absolute top-2 right-2 h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20",
                        title: __$1("Delete tab", "yatra"),
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-5 h-5" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(GripVertical, { className: "w-6 h-6 text-gray-400 cursor-grab active:cursor-grabbing" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              type: "text",
                              value: tab.label,
                              onChange: (e) => handleTabLabelChange(tab.id, e.target.value),
                              className: "text-sm font-medium flex-1",
                              disabled: !tab.enabled,
                              placeholder: __$1("Tab Label", "yatra")
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs", children: tab.content_type })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2", children: tab.enabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                          IconPicker,
                          {
                            value: tab.icon || null,
                            onChange: (value) => handleTabIconChange(tab.id, value),
                            label: __$1("Tab Icon", "yatra"),
                            helpText: __$1(
                              "Select an icon or upload an image for this tab",
                              "yatra"
                            ),
                            size: "sm"
                          }
                        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "opacity-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                          IconPicker,
                          {
                            value: tab.icon || null,
                            onChange: () => {
                            },
                            label: __$1("Tab Icon", "yatra"),
                            helpText: __$1(
                              "Enable this tab to select an icon",
                              "yatra"
                            ),
                            size: "sm"
                          }
                        ) }) }),
                        tab.content_type === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: __$1("Custom Content", "yatra") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "textarea",
                            {
                              value: tab.custom_content || "",
                              onChange: (e) => handleTabCustomContentChange(
                                tab.id,
                                e.target.value
                              ),
                              rows: 3,
                              disabled: !tab.enabled,
                              placeholder: __$1(
                                "Enter custom content for this tab...",
                                "yatra"
                              ),
                              className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                            }
                          )
                        ] }),
                        tab.content_type !== "custom" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Select,
                          {
                            value: tab.content_type,
                            onChange: (e) => handleTabContentTypeChange(
                              tab.id,
                              e.target.value
                            ),
                            disabled: !tab.enabled,
                            className: "text-xs",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "overview", children: __$1("Overview", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "itinerary", children: __$1("Itinerary", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "included_excluded", children: __$1("Included", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "location", children: __$1("Location", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "important_info", children: __$1("Important Info", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "downloads", children: __$1("Downloads", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "faq", children: __$1("FAQ", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "trip_story", children: __$1("Story", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "what_makes_special", children: __$1("Special", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "testimonials", children: __$1("Testimonials", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "custom", children: __$1("Custom Content", "yatra") })
                            ]
                          }
                        ) })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            type: "button",
                            variant: "ghost",
                            size: "sm",
                            onClick: () => handleTabMove(tab.id, "up"),
                            disabled: index === 0,
                            className: "h-10 w-10 p-0",
                            title: __$1("Move up", "yatra"),
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "w-5 h-5" })
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            type: "button",
                            variant: "ghost",
                            size: "sm",
                            onClick: () => handleTabMove(tab.id, "down"),
                            disabled: index === formData.frontend_tabs.length - 1,
                            className: "h-10 w-10 p-0",
                            title: __$1("Move down", "yatra"),
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-5 h-5" })
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "checkbox",
                              checked: tab.enabled,
                              onChange: () => handleTabToggle(tab.id),
                              className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: tab.enabled ? __$1("Enabled", "yatra") : __$1("Disabled", "yatra") })
                        ] })
                      ] })
                    ] })
                  ]
                },
                tab.id
              )) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 pt-4 border-t border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: handleTabAdd,
                  className: "w-full",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                    __$1("Add Custom Tab", "yatra")
                  ]
                }
              ) })
            ] })
          ] })
        ] });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-gray-500", children: __$1("Section content coming soon...", "yatra") });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-h-0 flex flex-col bg-white dark:bg-gray-900 overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-base font-semibold text-gray-900 dark:text-white truncate", children: formData.title || __$1("New Trip", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              className: `bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${formData.status === "publish" ? "text-green-700 dark:text-green-400 border-green-300 dark:border-green-800" : formData.status === "review" ? "text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800" : formData.status === "approved" ? "text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800" : formData.status === "suspended" ? "text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800" : formData.status === "archived" ? "text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600" : "text-gray-700 dark:text-gray-300"}`,
              children: formData.status === "draft" ? __$1("Draft", "yatra") : formData.status === "review" ? __$1("Review", "yatra") : formData.status === "approved" ? __$1("Approved", "yatra") : formData.status === "publish" ? __$1("Published", "yatra") : formData.status === "suspended" ? __$1("Suspended", "yatra") : __$1("Archived", "yatra")
            }
          ) })
        ] }),
        !isEditMode && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-700/50 flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setSimpleMode(!simpleMode),
            className: "flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
            title: simpleMode ? __$1("Switch to Advanced Mode", "yatra") : __$1("Switch to Simple Mode", "yatra"),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Lightbulb,
                {
                  className: `w-3.5 h-3.5 ${simpleMode ? "text-yellow-500" : ""}`
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: simpleMode ? __$1("Simple", "yatra") : __$1("Advanced", "yatra") })
            ]
          }
        ) }),
        !isEditMode && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => {
              showToast(
                __$1("Guided tour feature coming soon!", "yatra"),
                "info"
              );
            },
            className: "text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex-shrink-0",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "w-3.5 h-3.5 mr-1" }),
              __$1("Take a Tour", "yatra")
            ]
          }
        ),
        !isEditMode && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: handleFillDummyData,
            className: "text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex-shrink-0",
            title: __$1("Fill form with dummy data", "yatra"),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "w-3.5 h-3.5 mr-1" }),
              __$1("Fill Dummy Data", "yatra"),
              " (",
              dummyDataIndex + 1,
              "/",
              dummyTripsData.length,
              ")"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [
        isEditMode && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            onClick: () => setShowRevisionsDialog(true),
            className: "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "w-4 h-4 mr-2" }),
              __$1("Revisions", "yatra")
            ]
          }
        ),
        isAiEligible() && isAiModuleEnabled() && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            onClick: () => {
              setAiModalMode("all");
              setAiModalOpen(true);
            },
            className: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 hover:from-purple-700 hover:to-indigo-700",
            title: __$1(
              "Generate description, itinerary, included items, SEO meta, and more — from this trip's facts.",
              "yatra"
            ),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-4 h-4 mr-2" }),
              __$1("Auto-fill with AI", "yatra")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            onClick: handlePreview,
            className: "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700",
            disabled: !formData.slug,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4 mr-2" }),
              __$1("Preview", "yatra")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            onClick: handleSaveDraft,
            disabled: isSubmitting,
            className: "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4 mr-2" }),
              isEditMode ? __$1("Update Draft", "yatra") : __$1("Save Draft", "yatra")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: handlePublish,
              disabled: isSubmitting,
              className: "bg-blue-600 hover:bg-blue-700 text-white border-0 relative",
              children: isSubmitting ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-4 h-4 mr-2" }),
                isEditMode ? __$1("Update Trip", "yatra") : __$1("Publish Trip", "yatra"),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-4 h-4 ml-2" })
              ] })
            }
          ),
          !isSubmitting && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  handleFieldChange("status", "draft");
                  handleSaveDraft();
                },
                className: "w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __$1("Save as Draft", "yatra") })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  handleFieldChange("status", "review");
                  handlePublish();
                },
                className: "w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __$1("Save for Review", "yatra") })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  handleFieldChange("status", "approved");
                  handlePublish();
                },
                className: "w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __$1("Mark as Approved", "yatra") })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: handlePublish,
                className: "w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium flex items-center gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-4 h-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isEditMode ? __$1("Update & Publish", "yatra") : __$1("Publish", "yatra") })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  handleFieldChange("status", "suspended");
                  handlePublish();
                },
                className: "w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __$1("Suspend", "yatra") })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  handleFieldChange("status", "archived");
                  handlePublish();
                },
                className: "w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __$1("Archive", "yatra") })
              }
            )
          ] }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          size: "default",
          onClick: goToPreviousSection,
          disabled: currentStepIndex === 0,
          className: "flex items-center gap-2 text-sm font-semibold border-2 border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-500 dark:hover:border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 px-4 py-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "w-4 h-4" }),
            __$1("Previous", "yatra")
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          size: "default",
          onClick: goToNextSection,
          disabled: currentStepIndex >= allSections.length - 1,
          className: "flex items-center gap-2 text-sm font-semibold border-2 border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-500 dark:hover:border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 px-4 py-2",
          children: [
            __$1("Next", "yatra"),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4" })
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 min-h-0 p-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto overflow-x-hidden flex-shrink-0 min-h-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 pb-8 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3 px-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { className: "w-3.5 h-3.5 text-red-500 dark:text-red-400 flex-shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest", children: __$1("PHASE 1: ESSENTIALS", "yatra") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: "text-[9px] px-1.5 py-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
                children: __$1("Must Complete", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-0.5", children: essentialsSections.map((section, index) => {
            const Icon = section.icon;
            const isActive = currentSection === section.id;
            const isNext = !section.completed && essentialsSections.slice(0, index).every((s) => s.completed);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setCurrentSection(section.id),
                className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200 text-left group border relative ${isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm border-blue-200 dark:border-blue-800" : isNext ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: `text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isActive ? "bg-blue-600 text-white dark:bg-blue-500" : isNext ? "bg-amber-500 text-white" : section.completed ? "bg-green-500 text-white" : section.hasErrors ? "bg-red-500 text-white" : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`,
                        children: index + 1
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Icon,
                      {
                        className: `w-4 h-4 transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : isNext ? "text-amber-600 dark:text-amber-400" : section.hasErrors ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"}`
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-1 min-w-0 break-words leading-snug", children: [
                    section.label,
                    section.required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 text-[9px] text-red-500", children: "*" })
                  ] }),
                  section.hasErrors && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "flex-shrink-0 w-2 h-2 bg-red-500 rounded-full",
                      title: __$1("This section has errors", "yatra")
                    }
                  )
                ]
              },
              section.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3 px-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest", children: __$1("PHASE 2: DETAILS", "yatra") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: "text-[9px] px-1.5 py-0 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
                children: __$1("Recommended", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-0.5", children: detailsSections.map((section, index) => {
            const Icon = section.icon;
            const isActive = currentSection === section.id;
            const sectionNumber = essentialsSections.length + index + 1;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setCurrentSection(section.id),
                className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200 text-left group border ${isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm border-blue-200 dark:border-blue-800" : section.hasErrors ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10" : "border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: `text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isActive ? "bg-blue-600 text-white dark:bg-blue-500" : section.completed ? "bg-green-500 text-white" : section.hasErrors ? "bg-red-500 text-white" : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`,
                        children: sectionNumber
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Icon,
                      {
                        className: `w-4 h-4 transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : section.hasErrors ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"}`
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 min-w-0 break-words leading-snug", children: section.label }),
                  section.hasErrors && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "flex-shrink-0 w-2 h-2 bg-red-500 rounded-full",
                      title: __$1("This section has errors", "yatra")
                    }
                  )
                ]
              },
              section.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3 px-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(BarChart3, { className: "w-3.5 h-3.5 text-purple-500 dark:text-purple-400 flex-shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest", children: __$1("PHASE 3: OPTIMIZATION", "yatra") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: "text-[9px] px-1.5 py-0 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
                children: __$1("Optional", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-0.5", children: optimizationSections.map((section, index) => {
            const Icon = section.icon;
            const isActive = currentSection === section.id;
            const sectionNumber = essentialsSections.length + detailsSections.length + index + 1;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setCurrentSection(section.id),
                className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200 text-left group border ${isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm border-blue-200 dark:border-blue-800" : section.hasErrors ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10" : "border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: `text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isActive ? "bg-blue-600 text-white dark:bg-blue-500" : section.completed ? "bg-green-500 text-white" : section.hasErrors ? "bg-red-500 text-white" : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`,
                        children: sectionNumber
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Icon,
                      {
                        className: `w-4 h-4 transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : section.hasErrors ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"}`
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 min-w-0 break-words leading-snug", children: section.label }),
                  section.hasErrors && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "flex-shrink-0 w-2 h-2 bg-red-500 rounded-full",
                      title: __$1("This section has errors", "yatra")
                    }
                  )
                ]
              },
              section.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pb-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3 px-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest", children: __$1("PHASE 4: ADVANCED", "yatra") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: "text-[9px] px-1.5 py-0 bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800",
                children: __$1("Power Users", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-0.5", children: advancedSections.map((section, index) => {
            const Icon = section.icon;
            const isActive = currentSection === section.id;
            const sectionNumber = essentialsSections.length + detailsSections.length + optimizationSections.length + index + 1;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setCurrentSection(section.id),
                className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200 text-left group border ${isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm border-blue-200 dark:border-blue-800" : "border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: `text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isActive ? "bg-blue-600 text-white dark:bg-blue-500" : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`,
                        children: sectionNumber
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Icon,
                      {
                        className: `w-4 h-4 transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"}`
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 min-w-0 break-words leading-snug", children: section.label })
                ]
              },
              section.id
            );
          }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto bg-white dark:bg-gray-900", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 pb-24 max-w-4xl", children: [
        errors.submit && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { variant: "error", className: "mb-4", children: errors.submit }),
        renderSectionContent()
      ] }) })
    ] }),
    showHighlightModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50",
        onClick: () => setShowHighlightModal(false),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: __$1("Add Highlight", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5", children: __$1("Highlight Text", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "text",
                      value: modalInput.text,
                      onChange: (e) => setModalInput({ ...modalInput, text: e.target.value }),
                      placeholder: __$1("e.g., Private guide included", "yatra"),
                      autoFocus: true,
                      onKeyDown: (e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleHighlightSave();
                        }
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __$1(
                        'Keep it short and impactful. Examples: "All meals included", "Skip-the-line tickets", "Free airport transfer"',
                        "yatra"
                      ),
                      className: "mt-2"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "outline",
                      onClick: () => setShowHighlightModal(false),
                      children: __$1("Cancel", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      onClick: handleHighlightSave,
                      disabled: !modalInput.text.trim(),
                      children: __$1("Add", "yatra")
                    }
                  )
                ] })
              ] })
            ]
          }
        )
      }
    ),
    showRevisionsDialog && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm",
        onClick: () => setShowRevisionsDialog(false),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Card,
          {
            className: "w-full max-w-2xl max-h-[80vh] mx-4 shadow-xl overflow-hidden flex flex-col",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3 flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "w-5 h-5" }),
                  __$1("Trip Revisions", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => setShowRevisionsDialog(false),
                    className: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors",
                    "aria-label": __$1("Close", "yatra"),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-5 h-5" })
                  }
                )
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "flex-1 overflow-y-auto pb-4", children: revisions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-gray-500 dark:text-gray-400", children: __$1("No revisions found", "yatra") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: revisions.map((revision) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors",
                  onClick: () => handleRevisionClick(revision.id),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
                          "v",
                          revision.version
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium text-gray-900 dark:text-white", children: [
                          __$1("Revision", "yatra"),
                          " ",
                          revision.version
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
                        __$1("Created by", "yatra"),
                        " ",
                        revision.created_by_name,
                        " •",
                        " ",
                        new Date(revision.created_at).toLocaleString()
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        variant: "outline",
                        size: "sm",
                        onClick: (e) => {
                          e.stopPropagation();
                          handleRevisionClick(revision.id);
                        },
                        children: __$1("Use This Revision", "yatra")
                      }
                    )
                  ] })
                },
                revision.id
              )) }) })
            ]
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: showRevisionConfirm,
        onClose: () => {
          setShowRevisionConfirm(false);
          setSelectedRevisionId(null);
        },
        onConfirm: handleRevisionConfirm,
        title: __$1("Use This Revision?", "yatra"),
        message: __$1(
          "Do you want to use this revision? This will replace all current form data with the revision data.",
          "yatra"
        ),
        confirmText: __$1("Yes, Use This Revision", "yatra"),
        cancelText: __$1("Cancel", "yatra"),
        variant: "info",
        isLoading: false
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: showLandmarkDialog,
        onClose: () => {
          setShowLandmarkDialog(false);
          setLandmarkInput("");
        },
        title: __$1("Add Landmark", "yatra"),
        description: __$1(
          "Enter the name of the landmark or point of interest",
          "yatra"
        ),
        size: "sm",
        hideFooter: false,
        footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 justify-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              onClick: () => {
                setShowLandmarkDialog(false);
                setLandmarkInput("");
              },
              children: __$1("Cancel", "yatra")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => {
                if (landmarkInput.trim()) {
                  handleFieldChange("landmarks", [
                    ...formData.landmarks,
                    landmarkInput.trim()
                  ]);
                  setLandmarkInput("");
                  setShowLandmarkDialog(false);
                }
              },
              disabled: !landmarkInput.trim(),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                __$1("Add Landmark", "yatra")
              ]
            }
          )
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __$1("Landmark Name", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "text",
                value: landmarkInput,
                onChange: (e) => setLandmarkInput(e.target.value),
                placeholder: __$1(
                  "e.g., Eiffel Tower, Central Park, Grand Canyon",
                  "yatra"
                ),
                className: "w-full",
                autoFocus: true,
                onKeyDown: (e) => {
                  if (e.key === "Enter" && landmarkInput.trim()) {
                    handleFieldChange("landmarks", [
                      ...formData.landmarks,
                      landmarkInput.trim()
                    ]);
                    setLandmarkInput("");
                    setShowLandmarkDialog(false);
                  }
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: __$1(
            "Examples: Famous monuments, natural landmarks, historical sites, viewpoints, or points of interest that travelers will visit during this trip.",
            "yatra"
          ) })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AutoFillTripModal,
      {
        open: aiModalOpen,
        onClose: () => setAiModalOpen(false),
        buildContext: () => buildTripAiContext(formData),
        itineraryOnly: aiModalMode === "itinerary",
        onFieldsAccepted: (updates) => {
          for (const [key, value] of Object.entries(updates)) {
            handleFieldChange(key, value);
          }
        }
      }
    ),
    isEditMode && tripId && /* @__PURE__ */ jsxRuntimeExports.jsx(
      BuildItineraryModal,
      {
        open: itineraryBuildOpen,
        onClose: () => setItineraryBuildOpen(false),
        tripId,
        tripName: (formData == null ? void 0 : formData.title) || __$1("Trip", "yatra"),
        tripDurationDays: Number(formData == null ? void 0 : formData.duration_days) || 0,
        onApplied: () => {
          setItineraryBuildOpen(false);
        }
      }
    )
  ] });
};
export {
  TripForm as default
};
//# sourceMappingURL=TripForm-C5Ot3_1C.js.map
