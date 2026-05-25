import { r as reactExports, j as jsxRuntimeExports, az as AlertCircle, S as Sparkles, ax as X, p as Calendar, aE as HelpCircle, D as Loader2, bU as Replace, aw as Plus, aA as Check, J as RefreshCw } from "./react-vendor-CqkbFEvK.js";
import { _ as __ } from "./index-DRAt5dnR.js";
import { b as isAiReady, M as Modal, B as Button, c as aiApi } from "../../admin/dist/js/app.js";
const CLARIFICATION_PHRASES = [
  "i don't have enough",
  "i do not have enough",
  "i need more information",
  "i need more details",
  "i need more context",
  "could you provide",
  "could you please provide",
  "can you provide",
  "please provide",
  "please share",
  "to write accurate",
  "to write specific",
  "once i have these details",
  "once you provide",
  "with these details i'll",
  "with these details i can",
  "without more information",
  "without more details",
  "the operator's notes show empty",
  "operator's notes are empty",
  "i'll need to know",
  "to give you a meaningful"
];
function detectClarification(rawText, opts = {}) {
  const text = (rawText || "").trim();
  if (text === "") {
    return { isClarification: false, message: "", questions: [] };
  }
  const lower = text.toLowerCase();
  const matchedPhrase = CLARIFICATION_PHRASES.find((p) => lower.includes(p));
  if (!matchedPhrase) {
    return { isClarification: false, message: "", questions: [] };
  }
  if (opts.expectDayHeads) {
    const hasDayHead = /^\s*(?:#+\s*)?(?:\*+\s*)?day\s+\d+/im.test(text);
    if (hasDayHead) {
      return { isClarification: false, message: "", questions: [] };
    }
  }
  const questionCount = (text.match(/\?/g) || []).length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (!opts.expectDayHeads && questionCount < 2 && wordCount > 80) {
    return { isClarification: false, message: "", questions: [] };
  }
  const lines = text.split(/\r?\n/);
  const messageLines = [];
  const questions = [];
  let pastIntro = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      if (messageLines.length > 0) pastIntro = true;
      continue;
    }
    const stripped = line.replace(/^[\s\-\*•·●]+/, "").trim();
    const looksLikeQuestion = stripped.endsWith("?") || /^(could|can|please|would|will|what|when|where|who|why|how)\b/i.test(
      stripped
    );
    const isBullet = /^[\s\-\*•·●]/.test(line);
    if (pastIntro || isBullet || looksLikeQuestion) {
      questions.push(stripped);
      pastIntro = true;
    } else {
      messageLines.push(line);
    }
  }
  return {
    isClarification: true,
    message: messageLines.join("\n").trim(),
    questions
  };
}
const BuildItineraryModal = ({
  open,
  onClose,
  tripId,
  tripName,
  tripDurationDays,
  onApplied
}) => {
  const [phase, setPhase] = reactExports.useState("intro");
  const [days, setDays] = reactExports.useState([]);
  const [error, setError] = reactExports.useState(null);
  const [mode, setMode] = reactExports.useState("replace");
  const [trip, setTrip] = reactExports.useState(null);
  const [extraContext, setExtraContext] = reactExports.useState("");
  const [pace, setPace] = reactExports.useState(
    "balanced"
  );
  const [style, setStyle] = reactExports.useState("cultural");
  const [focus, setFocus] = reactExports.useState("");
  const [arrivalNotes, setArrivalNotes] = reactExports.useState("");
  const [accommodationTier, setAccommodationTier] = reactExports.useState("mid-range");
  const [clarification, setClarification] = reactExports.useState(null);
  const [retryContext, setRetryContext] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (open) {
      setPhase("intro");
      setDays([]);
      setError(null);
      setMode("replace");
      setTrip(null);
      setExtraContext("");
      setPace("balanced");
      setStyle("cultural");
      setFocus("");
      setArrivalNotes("");
      setAccommodationTier("mid-range");
      setClarification(null);
      setRetryContext("");
    }
  }, [open]);
  reactExports.useEffect(() => {
    if (phase !== "needs_context") setRetryContext("");
  }, [phase]);
  const hasDuration = tripDurationDays > 0;
  if (!open) return null;
  if (!isAiReady()) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: open, onClose, size: "md", hideHeader: true, hideFooter: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "mt-0.5 h-5 w-5 text-amber-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: __("AI Assistant not configured", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-300", children: __(
          "Add an OpenAI or Anthropic key under Yatra → AI Assistant first.",
          "yatra"
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "admin.php?page=yatra&subpage=ai-assistant", children: __("Open AI settings", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Cancel", "yatra") })
        ] })
      ] })
    ] }) }) });
  }
  const buildExtraContext = (extraSuffix = "") => {
    const structured = [];
    if (style) structured.push(`Travel style: ${style}`);
    if (pace) structured.push(`Pace: ${pace} (${paceHint(pace)})`);
    if (accommodationTier)
      structured.push(`Accommodation tier: ${accommodationTier}`);
    if (focus.trim()) structured.push(`Daily focus emphasis: ${focus.trim()}`);
    if (arrivalNotes.trim())
      structured.push(`Arrival/departure logistics: ${arrivalNotes.trim()}`);
    return [structured.join("\n"), extraContext.trim(), extraSuffix.trim()].filter((s) => s !== "").join("\n\n");
  };
  const generate = async (extraSuffix = "") => {
    setPhase("generating");
    setError(null);
    setClarification(null);
    try {
      const combined = buildExtraContext(extraSuffix);
      const res = await aiApi.draftItinerary(tripId, combined);
      const c = detectClarification(res.text, { expectDayHeads: true });
      if ((!res.days || res.days.length === 0) && c.isClarification) {
        setClarification({
          message: c.message,
          questions: c.questions,
          rawText: res.text
        });
        setTrip({ duration_days: res.trip.duration_days });
        setPhase("needs_context");
        return;
      }
      setDays(res.days);
      setTrip({ duration_days: res.trip.duration_days });
      setPhase("preview");
    } catch (e) {
      setError(extractError(e));
      setPhase("error");
    }
  };
  const retryWithAnswers = () => {
    const suffix = retryContext.trim();
    if (suffix === "") return;
    setExtraContext(
      (prev) => [prev.trim(), suffix].filter((s) => s !== "").join("\n\n")
    );
    void generate(suffix);
  };
  const apply = async () => {
    setPhase("applying");
    setError(null);
    try {
      const res = await aiApi.applyItinerary(tripId, days, mode === "replace");
      setPhase("done");
      onApplied({ count: res.count, message: res.message });
      setTimeout(() => onClose(), 900);
    } catch (e) {
      setError(extractError(e));
      setPhase("error");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      isOpen: open,
      onClose,
      size: "xl",
      hideHeader: true,
      hideFooter: true,
      bodyClassName: "",
      bodyScrollClassName: "",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-[85vh] max-h-[85vh] min-h-[480px] w-full flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md bg-gradient-to-br from-blue-600 to-blue-700 p-1.5 text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold text-gray-900 dark:text-white", children: __("Build Itinerary with AI", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: tripName })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "rounded text-gray-400 hover:text-gray-600",
              "aria-label": __("Close", "yatra"),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-6 py-4", children: [
          phase === "intro" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300", children: __(
              "AI will draft a day-by-day itinerary based on this trip's details — destination, difficulty, activities. The result will be parsed into individual day rows that you can edit afterwards.",
              "yatra"
            ) }),
            hasDuration ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/60 px-3 py-2 text-sm text-blue-900 dark:border-blue-500/40 dark:bg-blue-900/20 dark:text-blue-200", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                __("AI will generate", "yatra"),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                  tripDurationDays,
                  " ",
                  __("days", "yatra")
                ] }),
                " ",
                __(
                  "of itinerary, matching this trip's duration.",
                  "yatra"
                )
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-amber-200 bg-amber-50/40 p-3 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-200", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "mr-1 inline h-3.5 w-3.5" }),
              __(
                "This trip has no duration set. Open the trip and fill in 'Duration (days)' under Duration & Schedule, then come back here.",
                "yatra"
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200", children: __("Pace", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "select",
                  {
                    className: "w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800",
                    value: pace,
                    onChange: (e) => setPace(e.target.value),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "relaxed", children: __("Relaxed", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "balanced", children: __("Balanced", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "packed", children: __("Packed", "yatra") })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200", children: __("Travel style", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "select",
                  {
                    className: "w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800",
                    value: style,
                    onChange: (e) => setStyle(e.target.value),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "cultural", children: __("Cultural", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "adventure", children: __("Adventure", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "luxury", children: __("Luxury", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "budget", children: __("Budget", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "family-friendly", children: __("Family-friendly", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "food-focused", children: __("Food-focused", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "photography", children: __("Photography", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "wildlife", children: __("Wildlife", "yatra") })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200", children: __("Accommodation", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "select",
                  {
                    className: "w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800",
                    value: accommodationTier,
                    onChange: (e) => setAccommodationTier(e.target.value),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "budget", children: __("Budget", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "mid-range", children: __("Mid-range", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "boutique", children: __("Boutique", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "luxury", children: __("Luxury", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "homestay", children: __("Homestay / local", "yatra") })
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200", children: [
                  __("Daily focus emphasis", "yatra"),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-normal text-gray-400", children: __("(optional)", "yatra") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    className: "w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800",
                    placeholder: __(
                      "morning hikes, afternoon culture, evening street food",
                      "yatra"
                    ),
                    value: focus,
                    onChange: (e) => setFocus(e.target.value)
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200", children: [
                  __("Arrival / departure logistics", "yatra"),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-normal text-gray-400", children: __("(optional)", "yatra") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    className: "w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800",
                    placeholder: __(
                      "Day 1 evening arrival, last day morning departure",
                      "yatra"
                    ),
                    value: arrivalNotes,
                    onChange: (e) => setArrivalNotes(e.target.value)
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-blue-200 bg-blue-50/40 p-3 dark:border-blue-500/40 dark:bg-blue-900/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "label",
                {
                  htmlFor: "build-itin-context",
                  className: "mb-1 flex items-center gap-1.5 text-xs font-medium text-blue-900 dark:text-blue-200",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5" }),
                    __("Anything else AI should know", "yatra"),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 rounded bg-blue-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-800 dark:bg-blue-900/60 dark:text-blue-200", children: __("Recommended", "yatra") })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  id: "build-itin-context",
                  rows: 2,
                  className: "w-full rounded-md border border-blue-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-500/40 dark:bg-gray-800",
                  placeholder: __(
                    "Halal-friendly meals, max group size 8, photo-friendly viewpoints…",
                    "yatra"
                  ),
                  value: extraContext,
                  onChange: (e) => setExtraContext(e.target.value)
                }
              )
            ] })
          ] }),
          phase === "needs_context" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-500/40 dark:bg-amber-900/20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 text-amber-900 dark:text-amber-200", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(HelpCircle, { className: "mt-0.5 h-4 w-4 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: __(
                  "AI needs a few more details to draft a useful itinerary.",
                  "yatra"
                ) }),
                (clarification == null ? void 0 : clarification.message) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-amber-800/90 dark:text-amber-200/90", children: clarification.message }),
                (clarification == null ? void 0 : clarification.questions) && clarification.questions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-2 list-disc space-y-0.5 pl-4 text-xs text-amber-900 dark:text-amber-200", children: clarification.questions.map((q, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: q }, i)) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "label",
              {
                htmlFor: "build-itin-retry",
                className: "block text-xs font-medium text-gray-700 dark:text-gray-200",
                children: __("Answer the questions in your own words:", "yatra")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                id: "build-itin-retry",
                rows: 5,
                className: "w-full rounded-md border border-amber-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-amber-500/40 dark:bg-gray-800",
                placeholder: __(
                  "e.g. 7 days, focus on food tours and rickshaw rides, moderate difficulty, best in November-February.",
                  "yatra"
                ),
                value: retryContext,
                onChange: (e) => setRetryContext(e.target.value)
              }
            )
          ] }),
          phase === "generating" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full flex-col items-center justify-center gap-3 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-8 w-8 animate-spin text-blue-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-700 dark:text-gray-300", children: __("AI is drafting your itinerary…", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: __("This usually takes 10-20 seconds.", "yatra") })
          ] }),
          phase === "preview" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between rounded-md border border-blue-200 bg-blue-50/60 px-3 py-2 dark:border-blue-500/40 dark:bg-blue-900/20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-blue-900 dark:text-blue-200", children: [
              __("Drafted", "yatra"),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: days.length }),
              " ",
              __("days. Review before applying.", "yatra"),
              trip && days.length !== trip.duration_days && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-amber-700 dark:text-amber-300", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "mr-1 inline h-3 w-3" }),
                __("Trip duration is", "yatra"),
                " ",
                trip.duration_days,
                " ",
                __("days — itinerary may need adjustment.", "yatra")
              ] })
            ] }) }),
            days.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "mr-1 inline h-4 w-4" }),
              __(
                "AI couldn't parse a clean itinerary. Try generating again.",
                "yatra"
              )
            ] }),
            days.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex h-5 min-w-[40px] items-center justify-center rounded bg-blue-100 px-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200", children: [
                      __("Day", "yatra"),
                      " ",
                      d.day
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-white", children: d.day_title || `Day ${d.day}` })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap text-xs leading-relaxed text-gray-700 dark:text-gray-300", children: d.description }),
                  d.activities && d.activities.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 space-y-1.5 border-t border-gray-100 pt-2 dark:border-gray-700", children: d.activities.map((a, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "li",
                    {
                      className: "flex items-start gap-2 text-xs",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "span",
                          {
                            className: "mt-0.5 inline-flex shrink-0 items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600 dark:bg-gray-700 dark:text-gray-300",
                            title: a.item_type,
                            children: a.item_name || (a.item_type ? a.item_type.replace(/_/g, " ") : __("Activity", "yatra"))
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 leading-relaxed", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: a.title }),
                          (a.start_time || a.end_time || a.duration) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-gray-500 dark:text-gray-400", children: [
                            "·",
                            " ",
                            a.start_time && a.end_time ? `${a.start_time}–${a.end_time}` : a.start_time || a.duration
                          ] }),
                          a.location && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-gray-500 dark:text-gray-400", children: [
                            "· ",
                            a.location
                          ] }),
                          a.description && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-gray-600 dark:text-gray-300", children: a.description })
                        ] })
                      ]
                    },
                    idx
                  )) })
                ]
              },
              d.day
            )),
            days.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-gray-200 p-3 dark:border-gray-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-gray-700 dark:text-gray-200", children: __("How should these days land?", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-col gap-2 sm:flex-row", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-1 cursor-pointer items-start gap-2 rounded-md border border-gray-200 p-2 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "radio",
                      className: "mt-0.5",
                      checked: mode === "replace",
                      onChange: () => setMode("replace")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 font-medium text-gray-900 dark:text-white", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Replace, { className: "h-3.5 w-3.5" }),
                      __("Replace existing", "yatra")
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-500 dark:text-gray-400", children: __(
                      "Deletes the trip's current day rows first. Use when starting fresh.",
                      "yatra"
                    ) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-1 cursor-pointer items-start gap-2 rounded-md border border-gray-200 p-2 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "radio",
                      className: "mt-0.5",
                      checked: mode === "append",
                      onChange: () => setMode("append")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 font-medium text-gray-900 dark:text-white", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3.5 w-3.5" }),
                      __("Append after existing", "yatra")
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-500 dark:text-gray-400", children: __(
                      "Keeps current days and adds these on top.",
                      "yatra"
                    ) })
                  ] })
                ] })
              ] })
            ] })
          ] }),
          phase === "applying" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full flex-col items-center justify-center gap-3 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "h-8 w-8 animate-spin text-blue-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-700 dark:text-gray-300", children: __("Saving days to the itinerary…", "yatra") })
          ] }),
          phase === "done" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full flex-col items-center justify-center gap-3 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-full bg-green-100 p-3 dark:bg-green-900/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-6 w-6 text-green-600" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("Itinerary built.", "yatra") })
          ] }),
          phase === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "mr-1 inline h-4 w-4" }),
            error || __("Something went wrong.", "yatra")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-3 dark:border-gray-700", children: [
          phase === "intro" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Cancel", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => generate(), disabled: !hasDuration, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
              __("Generate", "yatra")
            ] })
          ] }),
          phase === "needs_context" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Cancel", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: retryWithAnswers,
                disabled: retryContext.trim() === "",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
                  __("Try again with this", "yatra")
                ]
              }
            )
          ] }),
          phase === "generating" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", disabled: true, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
            __("Generating…", "yatra")
          ] }),
          phase === "preview" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Discard", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => generate(), children: __("Try again", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: apply, disabled: days.length === 0, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-2 h-4 w-4" }),
              mode === "replace" ? __("Replace & save", "yatra") : __("Append & save", "yatra")
            ] })
          ] }),
          phase === "applying" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", disabled: true, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
            __("Saving…", "yatra")
          ] }),
          phase === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Close", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => generate(), children: __("Try again", "yatra") })
          ] }),
          phase === "done" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: __("Close", "yatra") })
        ] })
      ] })
    }
  );
};
function paceHint(p) {
  if (p === "relaxed") return "1-2 main activities per day, time for rest";
  if (p === "packed") return "4-5 activities per day, full schedule";
  return "2-3 main activities per day with breathing room";
}
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
  BuildItineraryModal as B,
  detectClarification as d
};
//# sourceMappingURL=BuildItineraryModal-Dq10SB7H.js.map
