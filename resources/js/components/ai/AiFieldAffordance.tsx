import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Wand2,
  Scissors,
  Maximize2,
  Heart,
  Pencil,
  Check,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import { aiApi, type AiGenerateResponse } from "../../api/ai-api";
import { isAiReady, isAiEligible, isAiModuleEnabled } from "../../lib/ai-availability";

interface AiFieldAffordanceProps {
  /**
   * Generation task name from PromptBuilder::ALLOWED_TASKS. Drives both the
   * server-side prompt template AND the labels users see in the menu.
   * Improve* tasks are derived per-action, not passed in.
   */
  task: string;
  /** Current field value — used for `Improve` operations + as a "filled" cue. */
  value: string;
  /** Called with the generated text once the operator accepts the preview. */
  onAccept: (next: string) => void;
  /**
   * Returns the per-field context object that grounds generation. Called
   * lazily on click so the latest form values are captured every time.
   */
  buildContext: () => Record<string, unknown>;
  /** Field label shown inside the menu / preview ("Description", "FAQ"...). */
  label: string;
  /** When false, "Improve" submenu is hidden. Default true. */
  allowImprove?: boolean;
  /** Hides the affordance entirely (e.g. when read-only). */
  disabled?: boolean;
  /** Optional className for the trigger button. */
  className?: string;
}

interface PreviewState {
  text: string;
  source: "generate" | "improve";
  task: string;
}

const IMPROVE_OPTIONS: Array<{
  task: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { task: "improve-tighten", label: "Tighten", icon: Scissors },
  { task: "improve-lengthen", label: "Lengthen", icon: Maximize2 },
  { task: "improve-tone-warmer", label: "Warmer tone", icon: Heart },
  { task: "improve-tone-formal", label: "More formal", icon: Pencil },
  { task: "improve-tone-shorter", label: "Make shorter", icon: Scissors },
];

export const AiFieldAffordance: React.FC<AiFieldAffordanceProps> = ({
  task,
  value,
  onAccept,
  buildContext,
  label,
  allowImprove = true,
  disabled = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [showImprove, setShowImprove] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Hard gate — completely skip rendering when the operator can't use AI.
  // Cheap to evaluate; keeps editors clean for free / Personal tier users.
  if (disabled || !isAiEligible() || !isAiModuleEnabled()) {
    return null;
  }

  const ready = isAiReady();

  // Close menu on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowImprove(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const runGenerate = useCallback(async () => {
    setOpen(false);
    setShowImprove(false);
    setError(null);
    setIsRunning(true);
    try {
      const ctx = buildContext();
      const res: AiGenerateResponse = await aiApi.generate(task, ctx);
      setPreview({ text: res.text, source: "generate", task });
    } catch (e: any) {
      setError(extractError(e));
    } finally {
      setIsRunning(false);
    }
  }, [task, buildContext]);

  const runImprove = useCallback(
    async (improveTask: string) => {
      setOpen(false);
      setShowImprove(false);
      setError(null);
      setIsRunning(true);
      try {
        const res: AiGenerateResponse = await aiApi.improve(improveTask, value);
        setPreview({ text: res.text, source: "improve", task: improveTask });
      } catch (e: any) {
        setError(extractError(e));
      } finally {
        setIsRunning(false);
      }
    },
    [value],
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

  return (
    <div ref={wrapperRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (!ready) {
            setError(
              __(
                "Add an API key in Yatra → AI Assistant before using this.",
                "yatra",
              ),
            );
            return;
          }
          setOpen((v) => !v);
          setShowImprove(false);
          setError(null);
        }}
        disabled={isRunning}
        title={__("AI Assistant", "yatra")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 ${
          isRunning ? "animate-pulse" : ""
        }`}
        aria-label={__("AI Assistant", "yatra")}
      >
        {isRunning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </button>

      {/* Action menu */}
      {open && !preview && (
        <div
          className="absolute right-0 z-30 mt-1 w-56 rounded-md border border-gray-200 bg-white p-1 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-800"
          role="menu"
        >
          <button
            type="button"
            onClick={runGenerate}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-blue-900/30"
          >
            <Wand2 className="h-4 w-4 text-blue-500" />
            <span className="flex-1">
              {hasValue
                ? __("Regenerate", "yatra")
                : __("Generate", "yatra")}{" "}
              <span className="text-gray-400">— {label}</span>
            </span>
          </button>

          {allowImprove && hasValue && (
            <>
              <button
                type="button"
                onClick={() => setShowImprove((v) => !v)}
                className="mt-0.5 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-blue-900/30"
              >
                <Pencil className="h-4 w-4 text-blue-500" />
                <span className="flex-1">{__("Improve this", "yatra")}</span>
                <span className="text-gray-400">{showImprove ? "▴" : "▾"}</span>
              </button>
              {showImprove && (
                <div className="ml-2 mt-0.5 border-l border-gray-100 pl-2 dark:border-gray-700">
                  {IMPROVE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.task}
                        type="button"
                        onClick={() => runImprove(opt.task)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-blue-900/30"
                      >
                        <Icon className="h-3.5 w-3.5 text-blue-400" />
                        {__(opt.label, "yatra")}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Preview popover — Accept / Try again / Cancel */}
      {preview && (
        <div className="absolute right-0 z-30 mt-1 w-[420px] max-w-[90vw] rounded-md border border-blue-200 bg-white p-3 text-sm shadow-xl dark:border-blue-500/40 dark:bg-gray-800">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            {preview.source === "improve"
              ? __("AI improved your text", "yatra")
              : __("AI generated this draft", "yatra")}
          </div>
          <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded border border-gray-100 bg-gray-50 p-2 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
            {preview.text || (
              <span className="text-gray-400">
                {__("(empty response)", "yatra")}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={tryAgain}
              className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {__("Try again", "yatra")}
            </button>
            <button
              type="button"
              onClick={reject}
              className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <X className="h-3 w-3" />
              {__("Discard", "yatra")}
            </button>
            <button
              type="button"
              onClick={accept}
              disabled={!preview.text}
              className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              {__("Accept", "yatra")}
            </button>
          </div>
        </div>
      )}

      {/* Inline error toast */}
      {error && !preview && (
        <div
          className="absolute right-0 z-30 mt-1 w-72 rounded-md border border-red-200 bg-white p-2 text-xs text-red-700 shadow-lg dark:border-red-500/40 dark:bg-gray-800 dark:text-red-300"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="flex-1">{error}</div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
              aria-label={__("Dismiss", "yatra")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function extractError(e: any): string {
  if (!e) return "AI request failed.";
  const data = e?.response?.data ?? e?.data ?? null;
  if (data && typeof data === "object") {
    if (typeof (data as any).message === "string") return (data as any).message;
    if (Array.isArray((data as any).errors)) {
      return (data as any).errors.map((x: any) => x?.message ?? String(x)).join("; ");
    }
  }
  if (typeof e?.message === "string") return e.message;
  return String(e);
}

export default AiFieldAffordance;
