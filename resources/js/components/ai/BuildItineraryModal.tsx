import React, { useEffect, useState } from "react";
import {
  Sparkles,
  X,
  Loader2,
  Check,
  AlertCircle,
  Replace,
  Plus,
  Calendar,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import { aiApi } from "../../api/ai-api";
import { isAiReady } from "../../lib/ai-availability";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";
import { detectClarification } from "./clarificationDetector";

/**
 * "Build Itinerary with AI" — the standalone version that lives on the
 * Itinerary page (Yatra → Itinerary → trip selected → ✨ button).
 *
 * Flow:
 *   1. Generate phase: kicks off /ai/itinerary/{tripId}/draft → returns
 *      a parsed days[] array (server-side parsing, so a bad LLM response
 *      that the React parser would choke on still surfaces meaningfully).
 *   2. Preview phase: shows each day's title + description with the
 *      ability to scroll. Operator picks `Replace` (drop existing
 *      AI/manual days) or `Add` (append after existing days).
 *   3. Apply phase: posts /ai/itinerary/{tripId}/apply with the chosen
 *      mode. Modal closes on success and the parent triggers a refetch.
 */
interface ParsedActivity {
  title: string;
  description?: string;
  item_type?: string;
  item_name?: string;
  start_time?: string;
  end_time?: string;
  duration?: string;
  location?: string;
}

interface ParsedDay {
  day: number;
  day_title: string;
  description: string;
  /** Day entries (activity / meal / accommodation / transport blocks)
   *  the agent populates under each day. May be empty for days that
   *  the agent decided don't need a granular schedule. */
  activities?: ParsedActivity[];
}

interface BuildItineraryModalProps {
  open: boolean;
  onClose: () => void;
  /** Trip selected on the Itinerary page. */
  tripId: number;
  /** Display label for the trip — purely cosmetic, helps the operator
   *  confirm they're building for the right trip. */
  tripName: string;
  /** Duration from the trip record. We use this to drive UX before the
   *  request even fires: 0 means the operator needs to set duration on
   *  the Trip form first; otherwise show the actual day count so
   *  there's no doubt what AI will draft. */
  tripDurationDays: number;
  /** Called after a successful apply so the parent can refetch the
   *  itinerary list to surface the new rows. */
  onApplied: (info: { count: number; message: string }) => void;
}

type Phase =
  | "intro"
  | "generating"
  | "preview"
  | "applying"
  | "done"
  | "error"
  | "needs_context";

export const BuildItineraryModal: React.FC<BuildItineraryModalProps> = ({
  open,
  onClose,
  tripId,
  tripName,
  tripDurationDays,
  onApplied,
}) => {
  const [phase, setPhase] = useState<Phase>("intro");
  const [days, setDays] = useState<ParsedDay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [trip, setTrip] = useState<{ duration_days: number } | null>(null);
  // Operator's free-text "what should AI know" notes — sent as
  // `extra_context` so the LLM has ground-truth facts even when the
  // form is sparsely filled.
  const [extraContext, setExtraContext] = useState("");
  // Structured wizard inputs — get serialized into extra_context so we
  // don't need new prompt-template fields per option.
  const [pace, setPace] = useState<"relaxed" | "balanced" | "packed">(
    "balanced",
  );
  const [style, setStyle] = useState("cultural");
  const [focus, setFocus] = useState("");
  const [arrivalNotes, setArrivalNotes] = useState("");
  const [accommodationTier, setAccommodationTier] = useState("mid-range");
  // AI clarification details (when LLM refuses with a question).
  const [clarification, setClarification] = useState<{
    message: string;
    questions: string[];
    rawText: string;
  } | null>(null);
  // Operator's inline answer to a clarification request. Must be
  // declared with the rest of the hooks (before any early-return) to
  // preserve React's hook-order invariant (error #310).
  const [retryContext, setRetryContext] = useState("");

  useEffect(() => {
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

  useEffect(() => {
    if (phase !== "needs_context") setRetryContext("");
  }, [phase]);

  const hasDuration = tripDurationDays > 0;

  if (!open) return null;

  if (!isAiReady()) {
    return (
      <Modal isOpen={open} onClose={onClose} size="md" hideHeader hideFooter>
        <div className="p-6 max-w-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {__("AI Assistant not configured", "yatra")}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {__(
                  "Add an OpenAI or Anthropic key under Yatra → AI Assistant first.",
                  "yatra",
                )}
              </p>
              <div className="mt-3 flex gap-2">
                <Button asChild>
                  <a href="admin.php?page=yatra&subpage=ai-assistant">
                    {__("Open AI settings", "yatra")}
                  </a>
                </Button>
                <Button variant="outline" onClick={onClose}>
                  {__("Cancel", "yatra")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  /**
   * Merge the structured wizard fields into the free-text extra_context
   * the prompt template already expects. Keeps the prompt-template
   * surface narrow — operators can override the master template later
   * via the Prompts tab without us breaking when we add wizard fields.
   */
  const buildExtraContext = (extraSuffix = ""): string => {
    const structured: string[] = [];
    if (style) structured.push(`Travel style: ${style}`);
    if (pace) structured.push(`Pace: ${pace} (${paceHint(pace)})`);
    if (accommodationTier)
      structured.push(`Accommodation tier: ${accommodationTier}`);
    if (focus.trim()) structured.push(`Daily focus emphasis: ${focus.trim()}`);
    if (arrivalNotes.trim())
      structured.push(`Arrival/departure logistics: ${arrivalNotes.trim()}`);

    return [structured.join("\n"), extraContext.trim(), extraSuffix.trim()]
      .filter((s) => s !== "")
      .join("\n\n");
  };

  const generate = async (extraSuffix = "") => {
    setPhase("generating");
    setError(null);
    setClarification(null);
    try {
      const combined = buildExtraContext(extraSuffix);
      const res = await aiApi.draftItinerary(tripId, combined);

      // Detect when the LLM responded with a refusal/clarification
      // instead of a valid Day-N itinerary. The standalone server-side
      // parser would return 0 days, which historically just produced
      // an unhelpful "couldn't parse" message — now we surface the AI's
      // question and let the operator answer inline.
      const c = detectClarification(res.text, { expectDayHeads: true });
      if ((!res.days || res.days.length === 0) && c.isClarification) {
        setClarification({
          message: c.message,
          questions: c.questions,
          rawText: res.text,
        });
        setTrip({ duration_days: res.trip.duration_days });
        setPhase("needs_context");
        return;
      }

      setDays(res.days);
      setTrip({ duration_days: res.trip.duration_days });
      setPhase("preview");
    } catch (e: any) {
      setError(extractError(e));
      setPhase("error");
    }
  };

  const retryWithAnswers = () => {
    const suffix = retryContext.trim();
    if (suffix === "") return;
    // Merge the answers into the persistent extraContext so subsequent
    // retries don't lose them. Then re-run.
    setExtraContext((prev) =>
      [prev.trim(), suffix].filter((s) => s !== "").join("\n\n"),
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
      // Auto-close after a beat so the operator sees the success state.
      setTimeout(() => onClose(), 900);
    } catch (e: any) {
      setError(extractError(e));
      setPhase("error");
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      size="xl"
      hideHeader
      hideFooter
      // Suppress the Modal's default padding + 70vh body scroll so this
      // wizard's own sticky-header / scrolling-body / sticky-footer
      // layout takes over. Without these overrides the outer modal
      // capped at 70vh and the wizard's body never engaged its own
      // scroll, forcing the operator to scroll the whole modal.
      bodyClassName=""
      bodyScrollClassName=""
    >
      <div className="flex h-[85vh] max-h-[85vh] min-h-[480px] w-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-gradient-to-br from-blue-600 to-blue-700 p-1.5 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {__("Build Itinerary with AI", "yatra")}
              </h2>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {tripName}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded text-gray-400 hover:text-gray-600"
            aria-label={__("Close", "yatra")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {phase === "intro" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {__(
                  "AI will draft a day-by-day itinerary based on this trip's details — destination, difficulty, activities. The result will be parsed into individual day rows that you can edit afterwards.",
                  "yatra",
                )}
              </p>

              {/* Show the actual duration from the trip record. If it's
                  missing, only then surface the warning — and tell the
                  operator where to set it. */}
              {hasDuration ? (
                <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/60 px-3 py-2 text-sm text-blue-900 dark:border-blue-500/40 dark:bg-blue-900/20 dark:text-blue-200">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {__("AI will generate", "yatra")}{" "}
                    <strong>
                      {tripDurationDays} {__("days", "yatra")}
                    </strong>{" "}
                    {__(
                      "of itinerary, matching this trip's duration.",
                      "yatra",
                    )}
                  </span>
                </div>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50/40 p-3 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-200">
                  <AlertCircle className="mr-1 inline h-3.5 w-3.5" />
                  {__(
                    "This trip has no duration set. Open the trip and fill in 'Duration (days)' under Duration & Schedule, then come back here.",
                    "yatra",
                  )}
                </div>
              )}

              {/* Structured wizard inputs — these get serialized into
                  extra_context so the prompt template doesn't need new
                  fields per option. */}
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">
                    {__("Pace", "yatra")}
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    value={pace}
                    onChange={(e) => setPace(e.target.value as typeof pace)}
                  >
                    <option value="relaxed">{__("Relaxed", "yatra")}</option>
                    <option value="balanced">{__("Balanced", "yatra")}</option>
                    <option value="packed">{__("Packed", "yatra")}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">
                    {__("Travel style", "yatra")}
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  >
                    <option value="cultural">{__("Cultural", "yatra")}</option>
                    <option value="adventure">
                      {__("Adventure", "yatra")}
                    </option>
                    <option value="luxury">{__("Luxury", "yatra")}</option>
                    <option value="budget">{__("Budget", "yatra")}</option>
                    <option value="family-friendly">
                      {__("Family-friendly", "yatra")}
                    </option>
                    <option value="food-focused">
                      {__("Food-focused", "yatra")}
                    </option>
                    <option value="photography">
                      {__("Photography", "yatra")}
                    </option>
                    <option value="wildlife">{__("Wildlife", "yatra")}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">
                    {__("Accommodation", "yatra")}
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    value={accommodationTier}
                    onChange={(e) => setAccommodationTier(e.target.value)}
                  >
                    <option value="budget">{__("Budget", "yatra")}</option>
                    <option value="mid-range">
                      {__("Mid-range", "yatra")}
                    </option>
                    <option value="boutique">{__("Boutique", "yatra")}</option>
                    <option value="luxury">{__("Luxury", "yatra")}</option>
                    <option value="homestay">
                      {__("Homestay / local", "yatra")}
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">
                    {__("Daily focus emphasis", "yatra")}{" "}
                    <span className="text-[10px] font-normal text-gray-400">
                      {__("(optional)", "yatra")}
                    </span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    placeholder={__(
                      "morning hikes, afternoon culture, evening street food",
                      "yatra",
                    )}
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">
                    {__("Arrival / departure logistics", "yatra")}{" "}
                    <span className="text-[10px] font-normal text-gray-400">
                      {__("(optional)", "yatra")}
                    </span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    placeholder={__(
                      "Day 1 evening arrival, last day morning departure",
                      "yatra",
                    )}
                    value={arrivalNotes}
                    onChange={(e) => setArrivalNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Free-text context — the operator's notes flow into the
                  prompt as `{{extra_context}}` so AI doesn't refuse on
                  sparse trips. */}
              <div className="rounded-md border border-blue-200 bg-blue-50/40 p-3 dark:border-blue-500/40 dark:bg-blue-900/20">
                <label
                  htmlFor="build-itin-context"
                  className="mb-1 flex items-center gap-1.5 text-xs font-medium text-blue-900 dark:text-blue-200"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {__("Anything else AI should know", "yatra")}
                  <span className="ml-1 rounded bg-blue-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                    {__("Recommended", "yatra")}
                  </span>
                </label>
                <textarea
                  id="build-itin-context"
                  rows={2}
                  className="w-full rounded-md border border-blue-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-500/40 dark:bg-gray-800"
                  placeholder={__(
                    "Halal-friendly meals, max group size 8, photo-friendly viewpoints…",
                    "yatra",
                  )}
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                />
              </div>
            </div>
          )}

          {phase === "needs_context" && (
            <div className="space-y-3">
              <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-500/40 dark:bg-amber-900/20">
                <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="flex-1 text-sm">
                    <div className="font-medium">
                      {__(
                        "AI needs a few more details to draft a useful itinerary.",
                        "yatra",
                      )}
                    </div>
                    {clarification?.message && (
                      <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-200/90">
                        {clarification.message}
                      </p>
                    )}
                    {clarification?.questions &&
                      clarification.questions.length > 0 && (
                        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-amber-900 dark:text-amber-200">
                          {clarification.questions.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      )}
                  </div>
                </div>
              </div>
              <label
                htmlFor="build-itin-retry"
                className="block text-xs font-medium text-gray-700 dark:text-gray-200"
              >
                {__("Answer the questions in your own words:", "yatra")}
              </label>
              <textarea
                id="build-itin-retry"
                rows={5}
                className="w-full rounded-md border border-amber-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-amber-500/40 dark:bg-gray-800"
                placeholder={__(
                  "e.g. 7 days, focus on food tours and rickshaw rides, moderate difficulty, best in November-February.",
                  "yatra",
                )}
                value={retryContext}
                onChange={(e) => setRetryContext(e.target.value)}
              />
            </div>
          )}

          {phase === "generating" && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {__("AI is drafting your itinerary…", "yatra")}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {__("This usually takes 10-20 seconds.", "yatra")}
              </div>
            </div>
          )}

          {phase === "preview" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50/60 px-3 py-2 dark:border-blue-500/40 dark:bg-blue-900/20">
                <div className="text-sm text-blue-900 dark:text-blue-200">
                  {__("Drafted", "yatra")} <strong>{days.length}</strong>{" "}
                  {__("days. Review before applying.", "yatra")}
                  {trip && days.length !== trip.duration_days && (
                    <div className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      <AlertCircle className="mr-1 inline h-3 w-3" />
                      {__("Trip duration is", "yatra")} {trip.duration_days}{" "}
                      {__("days — itinerary may need adjustment.", "yatra")}
                    </div>
                  )}
                </div>
              </div>

              {days.length === 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300">
                  <AlertCircle className="mr-1 inline h-4 w-4" />
                  {__(
                    "AI couldn't parse a clean itinerary. Try generating again.",
                    "yatra",
                  )}
                </div>
              )}

              {days.map((d) => (
                <div
                  key={d.day}
                  className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="inline-flex h-5 min-w-[40px] items-center justify-center rounded bg-blue-100 px-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                      {__("Day", "yatra")} {d.day}
                    </span>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {d.day_title || `Day ${d.day}`}
                    </h4>
                  </div>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                    {d.description}
                  </p>
                  {/* Activities list — each block becomes a day_entry
                      row on apply. Shown as a compact stack inside
                      each day card so the operator sees the same
                      two-layer structure the public trip page will
                      render (day overview + per-activity blocks). */}
                  {d.activities && d.activities.length > 0 && (
                    <ul className="mt-3 space-y-1.5 border-t border-gray-100 pt-2 dark:border-gray-700">
                      {d.activities.map((a, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs"
                        >
                          <span
                            className="mt-0.5 inline-flex shrink-0 items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                            title={a.item_type}
                          >
                            {a.item_name ||
                              (a.item_type
                                ? a.item_type.replace(/_/g, " ")
                                : __("Activity", "yatra"))}
                          </span>
                          <div className="flex-1 leading-relaxed">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {a.title}
                            </span>
                            {(a.start_time || a.end_time || a.duration) && (
                              <span className="ml-2 text-gray-500 dark:text-gray-400">
                                ·{" "}
                                {a.start_time && a.end_time
                                  ? `${a.start_time}–${a.end_time}`
                                  : a.start_time || a.duration}
                              </span>
                            )}
                            {a.location && (
                              <span className="ml-2 text-gray-500 dark:text-gray-400">
                                · {a.location}
                              </span>
                            )}
                            {a.description && (
                              <div className="mt-0.5 text-gray-600 dark:text-gray-300">
                                {a.description}
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {days.length > 0 && (
                <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-200">
                    {__("How should these days land?", "yatra")}
                  </div>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <label className="flex flex-1 cursor-pointer items-start gap-2 rounded-md border border-gray-200 p-2 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                      <input
                        type="radio"
                        className="mt-0.5"
                        checked={mode === "replace"}
                        onChange={() => setMode("replace")}
                      />
                      <div>
                        <div className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                          <Replace className="h-3.5 w-3.5" />
                          {__("Replace existing", "yatra")}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {__(
                            "Deletes the trip's current day rows first. Use when starting fresh.",
                            "yatra",
                          )}
                        </div>
                      </div>
                    </label>
                    <label className="flex flex-1 cursor-pointer items-start gap-2 rounded-md border border-gray-200 p-2 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                      <input
                        type="radio"
                        className="mt-0.5"
                        checked={mode === "append"}
                        onChange={() => setMode("append")}
                      />
                      <div>
                        <div className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                          <Plus className="h-3.5 w-3.5" />
                          {__("Append after existing", "yatra")}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {__(
                            "Keeps current days and adds these on top.",
                            "yatra",
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === "applying" && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {__("Saving days to the itinerary…", "yatra")}
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {__("Itinerary built.", "yatra")}
              </div>
            </div>
          )}

          {phase === "error" && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300">
              <AlertCircle className="mr-1 inline h-4 w-4" />
              {error || __("Something went wrong.", "yatra")}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          {phase === "intro" && (
            <>
              <Button variant="outline" onClick={onClose}>
                {__("Cancel", "yatra")}
              </Button>
              <Button onClick={() => generate()} disabled={!hasDuration}>
                <Sparkles className="mr-2 h-4 w-4" />
                {__("Generate", "yatra")}
              </Button>
            </>
          )}
          {phase === "needs_context" && (
            <>
              <Button variant="outline" onClick={onClose}>
                {__("Cancel", "yatra")}
              </Button>
              <Button
                onClick={retryWithAnswers}
                disabled={retryContext.trim() === ""}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {__("Try again with this", "yatra")}
              </Button>
            </>
          )}
          {phase === "generating" && (
            <Button variant="outline" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {__("Generating…", "yatra")}
            </Button>
          )}
          {phase === "preview" && (
            <>
              <Button variant="outline" onClick={onClose}>
                {__("Discard", "yatra")}
              </Button>
              <Button variant="outline" onClick={() => generate()}>
                {__("Try again", "yatra")}
              </Button>
              <Button onClick={apply} disabled={days.length === 0}>
                <Check className="mr-2 h-4 w-4" />
                {mode === "replace"
                  ? __("Replace & save", "yatra")
                  : __("Append & save", "yatra")}
              </Button>
            </>
          )}
          {phase === "applying" && (
            <Button variant="outline" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {__("Saving…", "yatra")}
            </Button>
          )}
          {phase === "error" && (
            <>
              <Button variant="outline" onClick={onClose}>
                {__("Close", "yatra")}
              </Button>
              <Button onClick={() => generate()}>
                {__("Try again", "yatra")}
              </Button>
            </>
          )}
          {phase === "done" && (
            <Button variant="outline" onClick={onClose}>
              {__("Close", "yatra")}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

function paceHint(p: "relaxed" | "balanced" | "packed"): string {
  if (p === "relaxed") return "1-2 main activities per day, time for rest";
  if (p === "packed") return "4-5 activities per day, full schedule";
  return "2-3 main activities per day with breathing room";
}

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

export default BuildItineraryModal;
