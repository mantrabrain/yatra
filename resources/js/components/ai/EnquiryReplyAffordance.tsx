import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Wand2,
  Heart,
  Scissors,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Shield,
  ShieldOff,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import { aiApi, type EnquiryReplyVariant } from "../../api/ai-api";
import {
  isAiEligible,
  isAiModuleEnabled,
  isAiReady,
} from "../../lib/ai-availability";

/**
 * Sparkle affordance for the enquiry "Response notes" textarea. Unlike
 * the trip-content version (AiFieldAffordance), this one knows it lives
 * on an enquiry — so it talks to the server-side EnquiryContext loader,
 * which pulls trip + customer history without us shipping that data
 * through the browser.
 *
 * Behaviour:
 *   - Auto-draft mode: when the enquiry has no existing reply AND the
 *     prop `autoDraftOnMount` is true, fires a draft on mount so the
 *     operator opens the form to a pre-filled reply.
 *   - Manual: sparkle button opens a tiny menu with Generate / Warmer /
 *     Shorter — only Warmer / Shorter need an existing draft.
 *   - Sensitive-data toggle in the menu: opt-in flag for sending the
 *     customer's medical / dietary / special-needs fields to the LLM.
 */
interface EnquiryReplyAffordanceProps {
  enquiryId: number;
  /** Current textarea value — used for warmer/shorter, and to decide
   *  whether to skip the auto-draft. */
  value: string;
  /** Called with the AI-drafted reply once the operator accepts it. */
  onAccept: (text: string) => void;
  /** Called as soon as a draft starts streaming back — lets the parent
   *  show a "draft in progress" banner above the field. */
  onDraftingChange?: (isDrafting: boolean) => void;
  /** Auto-fire a generate when this is the first time opening an
   *  unanswered enquiry. */
  autoDraftOnMount?: boolean;
  className?: string;
}

export const EnquiryReplyAffordance: React.FC<EnquiryReplyAffordanceProps> = ({
  enquiryId,
  value,
  onAccept,
  onDraftingChange,
  autoDraftOnMount = false,
  className = "",
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    text: string;
    variant: EnquiryReplyVariant;
  } | null>(null);
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const autoDraftedRef = useRef(false);

  // Hard gate — same logic as AiFieldAffordance for consistent behaviour.
  if (!isAiEligible() || !isAiModuleEnabled()) {
    return null;
  }
  const ready = isAiReady();

  // Close on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const runDraft = useCallback(
    async (variant: EnquiryReplyVariant) => {
      if (!ready) {
        setError(
          __(
            "Add an API key in Yatra → AI Assistant before drafting replies.",
            "yatra",
          ),
        );
        return;
      }
      setMenuOpen(false);
      setError(null);
      setIsRunning(true);
      onDraftingChange?.(true);
      try {
        const res = await aiApi.draftEnquiryReply(enquiryId, {
          variant,
          current_value: value,
          include_sensitive: includeSensitive,
        });
        setPreview({ text: res.text, variant });
      } catch (e: any) {
        setError(extractError(e));
      } finally {
        setIsRunning(false);
        onDraftingChange?.(false);
      }
    },
    [enquiryId, value, includeSensitive, ready, onDraftingChange],
  );

  // Auto-draft once on mount when the operator hasn't typed anything yet.
  useEffect(() => {
    if (!autoDraftOnMount || autoDraftedRef.current) return;
    if (!ready) return;
    if (value.trim() !== "") return;
    if (enquiryId <= 0) return;
    autoDraftedRef.current = true;
    runDraft("fresh");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDraftOnMount, ready, enquiryId]);

  const accept = () => {
    if (!preview) return;
    onAccept(preview.text);
    setPreview(null);
  };

  const tryAgain = () => {
    if (!preview) return;
    runDraft(preview.variant);
  };

  const hasValue = value.trim() !== "";

  return (
    <div ref={wrapperRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (!ready) {
            setError(
              __("Add an API key in Yatra → AI Assistant first.", "yatra"),
            );
            return;
          }
          if (preview) return;
          setMenuOpen((v) => !v);
          setError(null);
        }}
        disabled={isRunning}
        title={__("AI: draft a reply", "yatra")}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
          isRunning
            ? "border-blue-200 bg-blue-50 text-blue-500 dark:border-blue-500/40 dark:bg-blue-900/20 dark:text-blue-300"
            : "border-blue-300 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-900/20 dark:text-blue-200 dark:hover:bg-blue-900/40"
        }`}
        aria-label={__("Draft reply with AI", "yatra")}
      >
        {isRunning ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {__("Draft reply", "yatra")}
      </button>

      {menuOpen && !preview && (
        <div
          className="absolute right-0 z-30 mt-1 w-64 rounded-md border border-gray-200 bg-white p-1 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-800"
          role="menu"
        >
          <button
            type="button"
            onClick={() => runDraft("fresh")}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-blue-900/30"
          >
            <Wand2 className="h-4 w-4 text-blue-500" />
            {hasValue
              ? __("Regenerate from scratch", "yatra")
              : __("Generate reply", "yatra")}
          </button>
          {hasValue && (
            <>
              <button
                type="button"
                onClick={() => runDraft("warmer")}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-blue-900/30"
              >
                <Heart className="h-4 w-4 text-blue-400" />
                {__("Make warmer", "yatra")}
              </button>
              <button
                type="button"
                onClick={() => runDraft("shorter")}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-blue-900/30"
              >
                <Scissors className="h-4 w-4 text-blue-400" />
                {__("Make shorter", "yatra")}
              </button>
            </>
          )}

          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
          <label className="flex items-start gap-2 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={includeSensitive}
              onChange={(e) => setIncludeSensitive(e.target.checked)}
            />
            <span>
              {includeSensitive ? (
                <ShieldOff className="mr-1 inline h-3 w-3 text-amber-500" />
              ) : (
                <Shield className="mr-1 inline h-3 w-3 text-green-500" />
              )}
              {__(
                "Include dietary / medical / special-needs in prompt",
                "yatra",
              )}
            </span>
          </label>
        </div>
      )}

      {preview && (
        <div className="absolute right-0 z-30 mt-1 w-[480px] max-w-[90vw] rounded-md border border-blue-200 bg-white p-3 text-sm shadow-xl dark:border-blue-500/40 dark:bg-gray-800">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            {preview.variant === "fresh"
              ? __("AI drafted this reply", "yatra")
              : preview.variant === "warmer"
                ? __("AI rewrote to be warmer", "yatra")
                : __("AI rewrote to be shorter", "yatra")}
          </div>
          <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded border border-gray-100 bg-gray-50 p-2 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
            {preview.text || (
              <span className="text-gray-400">
                {__("(empty response)", "yatra")}
              </span>
            )}
          </pre>
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
              onClick={() => setPreview(null)}
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
              {__("Use this reply", "yatra")}
            </button>
          </div>
        </div>
      )}

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
  if (
    data &&
    typeof data === "object" &&
    typeof (data as any).message === "string"
  ) {
    return (data as any).message;
  }
  if (typeof e?.message === "string") return e.message;
  return String(e);
}

export default EnquiryReplyAffordance;
