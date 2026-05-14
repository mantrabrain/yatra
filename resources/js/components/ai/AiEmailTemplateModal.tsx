import React, { useState } from "react";
import { Sparkles, Loader2, X, Check } from "lucide-react";
import { __ } from "../../lib/i18n";
import { aiApi } from "../../api/ai-api";
import { isAiReady } from "../../lib/ai-availability";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";

/**
 * AI generator for one email-template's subject + body.
 *
 * The caller (EmailTemplateForm) opens this with the template's
 * catalog metadata pre-filled — template_key, name, description,
 * recipient_type, merge_tags. The operator picks a tone, optionally
 * adds extra context, hits Generate. The backend agent emits one
 * `set_email(subject, body)` tool call so the response shape is
 * guaranteed structured (no regex parsing).
 *
 * On accept, the modal calls `onAccept({subject, body})` and the
 * form replaces its current values with the AI output. On cancel,
 * the existing subject/body stay untouched — the operator can try
 * again without losing what they had.
 */

interface MergeTag {
  key: string;
  label?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  templateKey: string;
  templateName?: string;
  templateDescription?: string;
  recipientType?: "customer" | "admin";
  mergeTags: string[];
  currentSubject: string;
  currentBody: string;
  onAccept: (result: { subject: string; body: string }) => void;
}

const TONE_PRESETS = [
  { id: "warm-professional", label: "Warm + professional" },
  { id: "friendly-casual", label: "Friendly + casual" },
  { id: "concise-formal", label: "Concise + formal" },
  { id: "excited-promotional", label: "Excited + promotional" },
];

export const AiEmailTemplateModal: React.FC<Props> = ({
  open,
  onClose,
  templateKey,
  templateName,
  templateDescription,
  recipientType = "customer",
  mergeTags,
  currentSubject,
  currentBody,
  onAccept,
}) => {
  const [tone, setTone] = useState<string>(TONE_PRESETS[0].id);
  const [extraContext, setExtraContext] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(
    null,
  );

  // Reset when the modal opens/closes — operators should see a fresh
  // form each time they reopen the sparkle, not stale state.
  React.useEffect(() => {
    if (open) {
      setError(null);
      setDraft(null);
      setIsGenerating(false);
    }
  }, [open]);

  if (!open) return null;

  if (!isAiReady()) {
    return (
      <Modal isOpen={open} onClose={onClose} size="md" hideHeader hideFooter>
        <div className="p-6">
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
      </Modal>
    );
  }

  const generate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await aiApi.generateEmailTemplate({
        template_key: templateKey,
        template_name: templateName,
        template_description: templateDescription,
        recipient_type: recipientType,
        merge_tags: mergeTags,
        current_subject: currentSubject,
        current_body: currentBody,
        tone: TONE_PRESETS.find((t) => t.id === tone)?.label ?? tone,
        extra_context: extraContext,
      });
      setDraft({ subject: result.subject, body: result.body });
    } catch (e: any) {
      const data = e?.response?.data ?? e?.data ?? null;
      const msg =
        data && typeof data === "object" && typeof data.message === "string"
          ? data.message
          : e?.message || __("AI generation failed.", "yatra");
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const accept = () => {
    if (!draft) return;
    onAccept({ subject: draft.subject, body: draft.body });
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} size="xl" hideHeader hideFooter>
      <div className="flex max-h-[90vh] min-h-[420px] min-w-[640px] max-w-[860px] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-gradient-to-br from-blue-600 to-blue-700 p-1.5 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {__("Generate email with AI", "yatra")}
              </h2>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {templateName || templateKey}
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
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!draft && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {templateDescription ||
                  __(
                    "AI will write a fresh subject and body using only the merge tags this template supports.",
                    "yatra",
                  )}
              </p>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">
                  {__("Tone", "yatra")}
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TONE_PRESETS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={`rounded-md border px-2.5 py-1.5 text-xs ${
                        tone === t.id
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-200"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">
                  {__("Anything else AI should know", "yatra")}{" "}
                  <span className="text-[10px] font-normal text-gray-400">
                    {__("(optional)", "yatra")}
                  </span>
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800"
                  placeholder={__(
                    "e.g. Mention our 24/7 support hotline. Keep total length under 120 words. Emphasize peace of mind.",
                    "yatra",
                  )}
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                />
              </div>

              {mergeTags.length > 0 && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/40">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {__("Available merge tags", "yatra")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mergeTags.slice(0, 24).map((t) => (
                      <code
                        key={t}
                        className="rounded bg-white px-1.5 py-0.5 text-[10px] text-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      >
                        {`{{${t}}}`}
                      </code>
                    ))}
                    {mergeTags.length > 24 && (
                      <span className="text-[10px] text-gray-500">
                        +{mergeTags.length - 24} {__("more", "yatra")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    {__(
                      "AI will only use tags from this list; it won't invent new ones.",
                      "yatra",
                    )}
                  </p>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {draft && (
            <DraftEditor
              draft={draft}
              onChange={(d) => setDraft(d)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          {!draft && (
            <>
              <Button variant="outline" onClick={onClose} disabled={isGenerating}>
                {__("Cancel", "yatra")}
              </Button>
              <Button onClick={generate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {__("Generating…", "yatra")}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {__("Generate", "yatra")}
                  </>
                )}
              </Button>
            </>
          )}
          {draft && (
            <>
              <Button variant="outline" onClick={() => setDraft(null)}>
                {__("Discard, try again", "yatra")}
              </Button>
              <Button onClick={accept}>
                <Check className="mr-2 h-4 w-4" />
                {__("Use this", "yatra")}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

/**
 * Subject + body editor with tabbed Preview / HTML views. The
 * Preview tab renders the agent's HTML in a sandboxed iframe so the
 * inline styles look like they will in a real email client; the
 * HTML tab is a plain textarea for power users who want to tweak
 * before accepting.
 *
 * iframe sandbox is important — operators paste the result into a
 * production email template, so we must NOT execute any script the
 * model might emit (scripts shouldn't be in the agent's output but
 * we treat that as defense-in-depth, not a guarantee).
 */
const DraftEditor: React.FC<{
  draft: { subject: string; body: string };
  onChange: (d: { subject: string; body: string }) => void;
}> = ({ draft, onChange }) => {
  const [tab, setTab] = useState<"preview" | "html">("preview");
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">
          {__("Subject", "yatra")}
        </label>
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 bg-white p-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-800"
          value={draft.subject}
          onChange={(e) => onChange({ ...draft, subject: e.target.value })}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-200">
            {__("Body", "yatra")}
          </label>
          <div
            role="tablist"
            className="inline-flex overflow-hidden rounded-md border border-gray-200 dark:border-gray-700"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "preview"}
              onClick={() => setTab("preview")}
              className={`px-2.5 py-1 text-[11px] font-medium ${
                tab === "preview"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200"
              }`}
            >
              {__("Preview", "yatra")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "html"}
              onClick={() => setTab("html")}
              className={`px-2.5 py-1 text-[11px] font-medium ${
                tab === "html"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200"
              }`}
            >
              {__("HTML", "yatra")}
            </button>
          </div>
        </div>

        {tab === "preview" ? (
          <EmailPreview html={draft.body} />
        ) : (
          <textarea
            rows={14}
            className="w-full rounded-md border border-gray-300 bg-white p-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-800"
            value={draft.body}
            onChange={(e) => onChange({ ...draft, body: e.target.value })}
          />
        )}
        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
          {__(
            "Preview shows the rendered email; HTML tab lets you edit. Merge tags like {{customer_name}} stay as-is — they're replaced when the email actually sends.",
            "yatra",
          )}
        </p>
      </div>
    </div>
  );
};

/**
 * Sandboxed iframe that renders the agent's HTML body inside a
 * minimal shell — same neutral typography + light background that
 * Yatra's email shell will eventually wrap around. Sandboxed with
 * `allow-same-origin` only, so any <script> the model emits is
 * inert (scripts shouldn't exist; this is defense-in-depth).
 */
const EmailPreview: React.FC<{ html: string }> = ({ html }) => {
  // Build a self-contained HTML doc. The agent's body is dropped in
  // raw — its inline styles are what we want to see. The wrapper
  // provides only the neutral background + the centered content
  // width that a real email client would render with.
  const doc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:24px 16px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:28px 24px;">
    ${html}
  </div>
</body>
</html>`;

  return (
    <iframe
      title="Email preview"
      sandbox="allow-same-origin"
      srcDoc={doc}
      className="w-full rounded-md border border-gray-200 bg-white dark:border-gray-700"
      style={{ height: "420px" }}
    />
  );
};

export default AiEmailTemplateModal;
