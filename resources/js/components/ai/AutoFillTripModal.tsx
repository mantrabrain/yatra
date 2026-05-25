import React, { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  X,
  Loader2,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import { aiApi, type AiGenerateResponse } from "../../api/ai-api";
import { isAiReady } from "../../lib/ai-availability";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";
import { parseItineraryText, type ParsedDay } from "./itineraryParser";
import { detectClarification } from "./clarificationDetector";

/**
 * Each selectable field on the AutoFillTrip modal — maps a TripForm
 * field name to the prompt task that fills it and to a "decoder"
 * that turns the LLM's text into the shape TripForm expects.
 */
interface TaskSpec {
  /** Unique key matching a TripForm field name. */
  key: string;
  /** Human-readable label shown in the modal. */
  label: string;
  /** Server-side prompt task identifier. */
  task: string;
  /** Decode the raw LLM output into the form-state value. */
  decode: (text: string, formData: any) => unknown;
  /** Build a preview string from the decoded value for the modal. */
  preview: (value: unknown) => string;
}

/** Item shape TripForm uses for included_items / excluded_items. */
interface AmenityItem {
  title: string;
  description: string;
}

/** Itinerary entry mirroring TripForm's `ItineraryEntry` minimally. */
interface ItineraryEntry {
  id: string;
  day: number;
  day_title?: string;
  item_type_id: string;
  item_id: string;
  item_type: "Activity";
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  time_type: "flexible";
  cost_per_person: boolean;
  included_items: string[];
  excluded_items: string[];
  images: string[];
  status: "active";
}

/** Itinerary day shape — must match TripForm.ItineraryDay. */
interface ItineraryDay {
  day: number;
  day_title?: string;
  entries: ItineraryEntry[];
}

/**
 * The LLM emits plain text with blank lines between paragraphs. The trip
 * description field uses a RichTextEditor that expects HTML — without
 * conversion the result renders as one collapsed blob. We wrap each
 * non-empty paragraph block in `<p>` and preserve single-line breaks
 * as `<br>` so list-like content (rare for descriptions) still survives.
 */
function plainTextToHtml(text: string): string {
  if (!text) return "";
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p !== "");
  return paragraphs
    .map((p) => `<p>${escape(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function decodeAmenityList(text: string): AmenityItem[] {
  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^[\s\-\*••]+/, "") // strip leading bullets, even though prompt says no
        .trim(),
    )
    .filter((line) => line !== "" && !/^Day\s+\d+/i.test(line))
    .map((title) => ({ title, description: "" }));
}

function decodeItinerary(text: string): ItineraryDay[] {
  const parsed: ParsedDay[] = parseItineraryText(text);
  return parsed.map<ItineraryDay>((p) => ({
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
        status: "active",
      },
    ],
  }));
}

const ALL_TASKS: TaskSpec[] = [
  {
    key: "short_description",
    label: __("Short description", "yatra"),
    task: "trip-short-description",
    decode: (t) => t.trim(),
    preview: (v) => String(v ?? ""),
  },
  {
    key: "description",
    label: __("Trip description", "yatra"),
    task: "trip-description",
    // RichTextEditor expects HTML — wrap LLM's plain-text paragraphs in <p>.
    decode: (t) => plainTextToHtml(t),
    preview: (v) =>
      typeof v === "string"
        ? v
            .replace(/<\/p>\s*<p>/gi, "\n\n")
            .replace(/<[^>]+>/g, "")
            .trim()
        : "",
  },
  {
    key: "highlights",
    label: __("Highlights", "yatra"),
    task: "trip-highlights",
    // TripForm's `highlights` field is a string[] — each line of the
    // LLM output becomes one bullet, stripping any accidental leading
    // bullets / dashes the model may have added despite the prompt.
    decode: (t) =>
      t
        .split(/\r?\n/)
        .map((l) => l.replace(/^[\s\-\*•·●]+/, "").trim())
        .filter((l) => l !== ""),
    preview: (v) =>
      Array.isArray(v) ? (v as string[]).map((s) => `• ${s}`).join("\n") : "",
  },
  {
    key: "included_items",
    label: __("What's included", "yatra"),
    task: "trip-included-items",
    decode: (t) => decodeAmenityList(t),
    preview: (v) =>
      Array.isArray(v)
        ? (v as AmenityItem[]).map((i) => `• ${i.title}`).join("\n")
        : "",
  },
  {
    key: "excluded_items",
    label: __("What's excluded", "yatra"),
    task: "trip-excluded-items",
    decode: (t) => decodeAmenityList(t),
    preview: (v) =>
      Array.isArray(v)
        ? (v as AmenityItem[]).map((i) => `• ${i.title}`).join("\n")
        : "",
  },
  {
    key: "cancellation_policy",
    label: __("Cancellation policy", "yatra"),
    task: "trip-cancellation-policy",
    decode: (t) => t.trim(),
    preview: (v) => String(v ?? ""),
  },
  {
    key: "itinerary_days",
    label: __("Day-by-day itinerary", "yatra"),
    task: "trip-itinerary",
    decode: (t) => decodeItinerary(t),
    preview: (v) =>
      Array.isArray(v)
        ? (v as ItineraryDay[])
            .map(
              (d) =>
                `Day ${d.day}: ${d.day_title || ""}\n${
                  d.entries[0]?.description ?? ""
                }`,
            )
            .join("\n\n")
        : "",
  },
  {
    key: "meta_title",
    label: __("SEO meta title", "yatra"),
    task: "seo-meta-title",
    decode: (t) => t.trim().slice(0, 60),
    preview: (v) => String(v ?? ""),
  },
  {
    key: "meta_description",
    label: __("SEO meta description", "yatra"),
    task: "seo-meta-description",
    decode: (t) => t.trim().slice(0, 160),
    preview: (v) => String(v ?? ""),
  },
];

type TaskStatus = "idle" | "running" | "done" | "failed" | "needs_context";

interface TaskRow {
  spec: TaskSpec;
  selected: boolean;
  status: TaskStatus;
  decoded?: unknown;
  preview?: string;
  error?: string;
  accepted: boolean;
  /** AI's clarification prose, when status === "needs_context". */
  clarificationMessage?: string;
  /** AI's bulleted questions, when status === "needs_context". */
  clarificationQuestions?: string[];
  /** Operator's free-text reply to the clarification, used on retry. */
  retryContext?: string;
}

interface AutoFillTripModalProps {
  open: boolean;
  onClose: () => void;
  buildContext: () => Record<string, unknown>;
  /** Called once with `{ fieldName: decodedValue }` for each accepted task. */
  onFieldsAccepted: (updates: Record<string, unknown>) => void;
  /** When true, only the itinerary task is preselected — used by the
   *  dedicated "Generate Itinerary" button so we don't trigger 9 calls. */
  itineraryOnly?: boolean;
}

export const AutoFillTripModal: React.FC<AutoFillTripModalProps> = ({
  open,
  onClose,
  buildContext,
  onFieldsAccepted,
  itineraryOnly = false,
}) => {
  const initialRows = useMemo<TaskRow[]>(
    () =>
      ALL_TASKS.map((spec) => ({
        spec,
        selected: itineraryOnly ? spec.key === "itinerary_days" : true,
        status: "idle",
        accepted: false,
      })),
    [itineraryOnly],
  );

  const [rows, setRows] = useState<TaskRow[]>(initialRows);
  const [phase, setPhase] = useState<"setup" | "running" | "preview">("setup");
  // Free-text context the operator types into the modal. Gets passed to
  // every selected task as `{{extra_context}}`, so a brand-new trip
  // with only a title still produces useful output instead of the LLM
  // politely asking for clarification.
  const [extraContext, setExtraContext] = useState("");

  // Reset state whenever the modal re-opens — prevents stale results
  // from a previous run from leaking into a fresh one.
  useEffect(() => {
    if (open) {
      setRows(initialRows);
      setPhase("setup");
      setExtraContext("");
    }
  }, [open, initialRows]);

  if (!open) return null;

  if (!isAiReady()) {
    return (
      <Modal isOpen={open} onClose={onClose} size="md" hideHeader hideFooter>
        <div className="p-6 max-w-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
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

  const selectedCount = rows.filter((r) => r.selected).length;
  const generatedCount = rows.filter((r) => r.status === "done").length;
  const failedCount = rows.filter((r) => r.status === "failed").length;
  const needsContextCount = rows.filter(
    (r) => r.status === "needs_context",
  ).length;
  const allDone = rows
    .filter((r) => r.selected)
    .every(
      (r) =>
        r.status === "done" ||
        r.status === "failed" ||
        r.status === "needs_context",
    );

  const toggle = (key: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.spec.key === key ? { ...r, selected: !r.selected } : r,
      ),
    );

  const toggleAccept = (key: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.spec.key === key && r.status === "done"
          ? { ...r, accepted: !r.accepted }
          : r,
      ),
    );

  /**
   * Generate a single task. Used both for the initial batch (called via
   * Promise.all from runGenerations) and for inline retries when the
   * operator answers a clarification question.
   *
   * The extra-context argument is appended to whatever was typed in the
   * setup textarea — that way the operator's original notes aren't lost
   * when they reply to a clarification.
   */
  const runOneTask = async (taskKey: string, extraSuffix = "") => {
    setRows((prev) =>
      prev.map((row) =>
        row.spec.key === taskKey
          ? {
              ...row,
              status: "running" as TaskStatus,
              error: undefined,
              clarificationMessage: undefined,
              clarificationQuestions: undefined,
            }
          : row,
      ),
    );

    const spec = ALL_TASKS.find((t) => t.key === taskKey);
    if (!spec) return;

    const combinedContext = [extraContext.trim(), extraSuffix.trim()]
      .filter((s) => s !== "")
      .join("\n\n");

    const ctx = {
      ...buildContext(),
      extra_context: combinedContext,
    };

    try {
      const res: AiGenerateResponse = await aiApi.generate(spec.task, ctx);

      // Detect "I need more info" responses BEFORE decoding — otherwise
      // the question text gets pushed into form fields as if it were
      // content (e.g. lines become highlight bullets, zero days parse).
      const clarification = detectClarification(res.text, {
        expectDayHeads: spec.task === "trip-itinerary",
      });
      if (clarification.isClarification) {
        setRows((prev) =>
          prev.map((row) =>
            row.spec.key === taskKey
              ? {
                  ...row,
                  status: "needs_context" as TaskStatus,
                  clarificationMessage: clarification.message,
                  clarificationQuestions: clarification.questions,
                  retryContext: "",
                }
              : row,
          ),
        );
        return;
      }

      const decoded = spec.decode(res.text, ctx);
      const preview = spec.preview(decoded);
      setRows((prev) =>
        prev.map((row) =>
          row.spec.key === taskKey
            ? {
                ...row,
                status: "done" as TaskStatus,
                decoded,
                preview,
                accepted: true,
              }
            : row,
        ),
      );
    } catch (e: any) {
      const msg = extractError(e);
      setRows((prev) =>
        prev.map((row) =>
          row.spec.key === taskKey
            ? {
                ...row,
                status: "failed" as TaskStatus,
                error: msg,
              }
            : row,
        ),
      );
    }
  };

  const runGenerations = async () => {
    setPhase("running");
    const selected = rows.filter((r) => r.selected).map((r) => r.spec.key);
    // Fire all selected tasks in parallel. The provider rate-limits us if
    // we go too wide; in practice 9 simultaneous chat completions is fine
    // for OpenAI/Anthropic on a paid tier.
    await Promise.all(selected.map((k) => runOneTask(k)));
    setPhase("preview");
  };

  const retryWithContext = (taskKey: string) => {
    const row = rows.find((r) => r.spec.key === taskKey);
    const suffix = row?.retryContext?.trim() ?? "";
    if (suffix === "") return;
    void runOneTask(taskKey, suffix);
  };

  const updateRetryContext = (taskKey: string, value: string) =>
    setRows((prev) =>
      prev.map((row) =>
        row.spec.key === taskKey ? { ...row, retryContext: value } : row,
      ),
    );

  const applyAccepted = () => {
    const updates: Record<string, unknown> = {};
    for (const r of rows) {
      if (r.status === "done" && r.accepted && r.decoded !== undefined) {
        updates[r.spec.key] = r.decoded;
      }
    }
    onFieldsAccepted(updates);
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      size="xl"
      hideHeader
      hideFooter
      bodyScrollClassName="overflow-visible"
    >
      <div className="flex h-[80vh] max-h-[800px] min-w-[640px] max-w-[920px] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {itineraryOnly
                ? __("Generate itinerary", "yatra")
                : __("Auto-fill trip with AI", "yatra")}
            </h2>
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
          {phase === "setup" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {itineraryOnly
                  ? __(
                      "AI will generate a day-by-day itinerary grounded in this trip's facts. Existing itinerary will be replaced when you accept the result.",
                      "yatra",
                    )
                  : __(
                      "Pick the sections to generate. AI runs them in parallel, then you review each result before anything touches the form.",
                      "yatra",
                    )}
              </p>

              {/* Freeform context — the single most valuable input on
                  a fresh trip. Without it the LLM has only a title and
                  refuses to invent facts. */}
              <div className="rounded-md border border-blue-200 bg-blue-50/40 p-3 dark:border-blue-500/40 dark:bg-blue-900/20">
                <label
                  htmlFor="autofill-context"
                  className="mb-1 flex items-center gap-1.5 text-xs font-medium text-blue-900 dark:text-blue-200"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {__("Tell AI about this trip", "yatra")}
                  <span className="ml-1 rounded bg-blue-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                    {__("Recommended", "yatra")}
                  </span>
                </label>
                <textarea
                  id="autofill-context"
                  rows={4}
                  className="w-full rounded-md border border-blue-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-500/40 dark:bg-gray-800"
                  placeholder={__(
                    "e.g. 7-day cultural trek to Dhaka, moderate difficulty. Includes food tours, rickshaw rides, old town walking tour. Best for ages 18-65. Mid-range hotels.",
                    "yatra",
                  )}
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-blue-700 dark:text-blue-300">
                  {__(
                    "The more facts you share, the better the output. Existing fields on the form (title, destinations, duration) are also passed automatically.",
                    "yatra",
                  )}
                </p>
              </div>

              <div className="rounded-md border border-gray-200 dark:border-gray-700">
                {rows.map((r) => (
                  <label
                    key={r.spec.key}
                    className="flex items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0 dark:border-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={r.selected}
                      onChange={() => toggle(r.spec.key)}
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {r.spec.label}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      {r.spec.task}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {__("Tokens count against your provider plan.", "yatra")}{" "}
                <a
                  className="text-blue-600 underline dark:text-blue-300"
                  href="admin.php?page=yatra&subpage=ai-assistant"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {__("See usage", "yatra")}
                </a>
              </p>
            </div>
          )}

          {phase !== "setup" && (
            <div className="space-y-3">
              {rows
                .filter((r) => r.selected)
                .map((r) => (
                  <TaskRowView
                    key={r.spec.key}
                    row={r}
                    onToggleAccept={() => toggleAccept(r.spec.key)}
                    onRetryContextChange={(v) =>
                      updateRetryContext(r.spec.key, v)
                    }
                    onRetry={() => retryWithContext(r.spec.key)}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {phase === "setup" &&
              (selectedCount === 0
                ? __("Pick at least one section.", "yatra")
                : `${selectedCount} ${__("sections selected.", "yatra")}`)}
            {phase === "running" &&
              `${__("Generating…", "yatra")} ${generatedCount}/${selectedCount}`}
            {phase === "preview" && (
              <>
                {`${generatedCount} ${__("ready", "yatra")}`}
                {needsContextCount > 0 && (
                  <span className="ml-2 text-amber-600 dark:text-amber-300">
                    {`${needsContextCount} ${__("need more info", "yatra")}`}
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="ml-2 text-red-500">
                    {`${failedCount} ${__("failed", "yatra")}`}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {__("Cancel", "yatra")}
            </Button>
            {phase === "setup" && (
              <Button onClick={runGenerations} disabled={selectedCount === 0}>
                <Sparkles className="mr-2 h-4 w-4" />
                {__("Generate", "yatra")}
              </Button>
            )}
            {phase === "preview" && (
              <Button
                onClick={applyAccepted}
                disabled={!rows.some((r) => r.accepted && r.status === "done")}
              >
                <Check className="mr-2 h-4 w-4" />
                {__("Apply accepted", "yatra")}
              </Button>
            )}
            {phase === "running" && !allDone && (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {__("Working…", "yatra")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const TaskRowView: React.FC<{
  row: TaskRow;
  onToggleAccept: () => void;
  onRetryContextChange: (value: string) => void;
  onRetry: () => void;
}> = ({ row, onToggleAccept, onRetryContextChange, onRetry }) => {
  const [expanded, setExpanded] = useState(false);
  const retryDisabled = (row.retryContext ?? "").trim() === "";
  return (
    <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <StatusBadge status={row.status} />
        <div className="font-medium text-sm text-gray-900 dark:text-white">
          {row.spec.label}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {row.status === "done" && (
            <>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Eye className="h-3 w-3" />
                {expanded ? __("Hide", "yatra") : __("Preview", "yatra")}
              </button>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={row.accepted}
                  onChange={onToggleAccept}
                />
                {__("Apply", "yatra")}
              </label>
            </>
          )}
        </div>
      </div>
      {expanded && row.status === "done" && (
        <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          {row.preview || (
            <span className="text-gray-400">{__("(empty)", "yatra")}</span>
          )}
        </pre>
      )}
      {row.status === "needs_context" && (
        <div className="mt-2 space-y-2 rounded-md border border-amber-200 bg-amber-50/60 p-3 text-xs dark:border-amber-500/40 dark:bg-amber-900/20">
          <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
            <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="flex-1">
              <div className="font-medium">
                {__(
                  "AI needs a few more details to write something useful.",
                  "yatra",
                )}
              </div>
              {row.clarificationMessage && (
                <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
                  {row.clarificationMessage}
                </p>
              )}
              {row.clarificationQuestions &&
                row.clarificationQuestions.length > 0 && (
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-amber-900 dark:text-amber-200">
                    {row.clarificationQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                )}
            </div>
          </div>
          <textarea
            rows={3}
            placeholder={__(
              "Type the answers here — e.g. duration, activities, difficulty, best season…",
              "yatra",
            )}
            value={row.retryContext ?? ""}
            onChange={(e) => onRetryContextChange(e.target.value)}
            className="w-full rounded-md border border-amber-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-amber-500/40 dark:bg-gray-800"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={onRetry}
              disabled={retryDisabled}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              {__("Try again with this", "yatra")}
            </Button>
          </div>
        </div>
      )}
      {row.status === "failed" && (
        <div className="mt-2 flex items-start gap-2 rounded bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div className="flex-1">{row.error}</div>
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  if (status === "idle") {
    return <Clock className="h-4 w-4 text-gray-400" />;
  }
  if (status === "running") {
    return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  }
  if (status === "done") {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  return <AlertCircle className="h-4 w-4 text-red-500" />;
};

function extractError(e: any): string {
  if (!e) return "Generation failed.";
  const data = e?.response?.data ?? e?.data ?? null;
  if (
    data &&
    typeof data === "object" &&
    typeof (data as any).message === "string"
  ) {
    return (data as any).message;
  }
  return e?.message || "Generation failed.";
}

export default AutoFillTripModal;
