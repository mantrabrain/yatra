import React, { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  KeyRound,
  ExternalLink,
  Loader2,
  Lock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Plug,
  Eye,
  EyeOff,
  Trash2,
  Save,
  Pencil,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  MessageCircle,
  Crown,
  Info,
} from "lucide-react";
import { __ } from "../lib/i18n";
import { useToast } from "../components/ui/toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { PageHeader } from "../components/common/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  aiApi,
  type AiMeta,
  type AiBrandVoice,
  type AiChatLimits,
  type AiPromptRow,
  type AiUsageSummary,
} from "../api/ai-api";

type SectionId = "keys" | "voice" | "prompts" | "usage";

interface SectionDef {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const SECTIONS: SectionDef[] = [
  {
    id: "keys",
    label: "API Keys",
    icon: KeyRound,
    description:
      "Bring your own OpenAI or Anthropic key. Keys are stored encrypted and never leave your server.",
  },
  {
    id: "voice",
    label: "Brand Voice",
    icon: Sparkles,
    description:
      "Tone, examples, vocabulary preferences — applied to every generation so AI output sounds like your business.",
  },
  {
    id: "prompts",
    label: "Prompts",
    icon: Pencil,
    description:
      "Inspect or edit every system + user prompt the assistant uses. Overrides fall back to defaults per-field.",
  },
  {
    id: "usage",
    label: "Usage",
    icon: BarChart3,
    description: "Token usage by month, per provider, per feature.",
  },
];

const DEFAULT_BRAND_VOICE: AiBrandVoice = {
  tone: "",
  examples: [],
  forbidden: [],
  required: [],
  language: "en-US",
  default_provider: "openai",
  default_model: "",
};

/* -------------------------------------------------------------------------- */
/*  Plan tier badge                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Pill rendered in the AI Assistant page header so operators see at a
 * glance which license tier unlocks this page. Mirrors the badge style
 * used on the Modules page card so the language is consistent across
 * surfaces. Keep colors aligned with the Modules.tsx badges:
 *   growth → emerald/teal gradient
 *   agency → purple/indigo gradient
 */
const PlanBadge: React.FC<{ tier: "growth" | "agency" }> = ({ tier }) => {
  if (tier === "agency") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
        <Crown className="h-3 w-3" />
        {__("Agency plan", "yatra")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
      <Sparkles className="h-3 w-3" />
      {__("Growth plan", "yatra")}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/*  Upgrade card                                                              */
/* -------------------------------------------------------------------------- */

const UpgradeCard: React.FC<{ meta?: AiMeta }> = ({ meta }) => {
  const upgradeUrl =
    meta?.upgrade_url || "https://wpyatra.com/pricing?module=ai-assistant";
  const licensePageUrl =
    meta?.license_page_url || "admin.php?page=yatra&subpage=license";

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{__("AI Assistant", "yatra")}</CardTitle>
              <PlanBadge tier="growth" />
            </div>
            <CardDescription className="mt-1">
              {__(
                "AI Assistant unlocks on the Growth plan (or Agency). Bring your own OpenAI or Anthropic key — costs are paid directly to your provider, no per-call markup from the plugin.",
                "yatra",
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {__(
            "Inline AI affordances on trip descriptions, SEO meta, included/excluded items, FAQs, and more — write less, finish more.",
            "yatra",
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild>
            <a href={upgradeUrl} target="_blank" rel="noopener noreferrer">
              {meta?.is_pro_active
                ? __("Upgrade plan", "yatra")
                : __("Get Yatra Pro Growth", "yatra")}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          {meta?.is_pro_active && (
            <Button variant="outline" asChild>
              <a href={licensePageUrl}>{__("Manage License", "yatra")}</a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/*  Settings page                                                             */
/* -------------------------------------------------------------------------- */

const AiAssistant: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionId>("keys");

  // ---------- meta ----------
  const { data: meta, isLoading: metaLoading } = useQuery<AiMeta>({
    queryKey: ["ai-meta"],
    queryFn: () => aiApi.meta(),
  });

  // ---------- brand voice ----------
  const { data: bvResp } = useQuery<{ data: AiBrandVoice }>({
    queryKey: ["ai-brand-voice"],
    queryFn: () => aiApi.getBrandVoice(),
    enabled: Boolean(meta?.is_ai_eligible),
  });

  const [bv, setBv] = useState<AiBrandVoice>(DEFAULT_BRAND_VOICE);
  useEffect(() => {
    if (bvResp?.data) {
      setBv({ ...DEFAULT_BRAND_VOICE, ...bvResp.data });
    }
  }, [bvResp]);

  const saveBvMutation = useMutation({
    mutationFn: (data: AiBrandVoice) => aiApi.saveBrandVoice(data),
    onSuccess: () => {
      showToast(__("Brand voice saved.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["ai-brand-voice"] });
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  // ---------- API keys ----------
  const [keyDrafts, setKeyDrafts] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const setKeyMutation = useMutation({
    mutationFn: ({ provider, key }: { provider: string; key: string }) =>
      aiApi.setKey(provider, key),
    onSuccess: (_resp, vars) => {
      showToast(__("API key saved.", "yatra"), "success");
      setKeyDrafts((d) => ({ ...d, [vars.provider]: "" }));
      queryClient.invalidateQueries({ queryKey: ["ai-meta"] });
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (provider: string) => aiApi.deleteKey(provider),
    onSuccess: () => {
      showToast(__("API key cleared.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["ai-meta"] });
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const testKeyMutation = useMutation({
    mutationFn: (provider: string) => aiApi.testKey(provider),
    onSuccess: (resp) => {
      showToast(resp.message || __("Connection successful.", "yatra"), "success");
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  // ---------- public chat toggle ----------
  const tripChatMutation = useMutation({
    mutationFn: (enabled: boolean) => aiApi.setTripChatEnabled(enabled),
    onSuccess: (resp) => {
      showToast(resp.message, "success");
      queryClient.invalidateQueries({ queryKey: ["ai-meta"] });
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  // ---------- public chat rate-limits (operator-configurable) ----------
  const [chatLimitsDraft, setChatLimitsDraft] = useState<
    Record<keyof AiChatLimits, string>
  >({
    per_trip_day: "",
    per_ip_hour: "",
    per_session: "",
    per_session_booking: "",
    max_message_chars: "",
    history_turns: "",
  });
  // Hydrate the form whenever the server values arrive / change.
  useEffect(() => {
    if (meta?.trip_chat_limits) {
      const l = meta.trip_chat_limits;
      setChatLimitsDraft({
        per_trip_day: String(l.per_trip_day),
        per_ip_hour: String(l.per_ip_hour),
        per_session: String(l.per_session),
        per_session_booking: String(l.per_session_booking),
        max_message_chars: String(l.max_message_chars),
        history_turns: String(l.history_turns),
      });
    }
  }, [meta?.trip_chat_limits]);

  const tripChatLimitsMutation = useMutation({
    mutationFn: (patch: Partial<AiChatLimits>) => aiApi.setTripChatLimits(patch),
    onSuccess: (resp) => {
      showToast(resp.message, "success");
      queryClient.invalidateQueries({ queryKey: ["ai-meta"] });
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  // ---------- usage ----------
  const { data: usageResp } = useQuery<{ data: AiUsageSummary }>({
    queryKey: ["ai-usage"],
    queryFn: () => aiApi.getUsage(),
    enabled: Boolean(meta?.is_ai_eligible) && activeSection === "usage",
  });

  // ---------- prompts ----------
  const { data: promptsResp, isLoading: promptsLoading } = useQuery<{
    data: AiPromptRow[];
  }>({
    queryKey: ["ai-prompts"],
    queryFn: () => aiApi.listPrompts(),
    enabled: Boolean(meta?.is_ai_eligible) && activeSection === "prompts",
  });

  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [promptDrafts, setPromptDrafts] = useState<
    Record<
      string,
      {
        system: string;
        user: string;
        max_tokens: string;
        temperature: string;
      }
    >
  >({});

  // Hydrate drafts whenever the prompt list changes (e.g. after save/reset).
  useEffect(() => {
    if (!promptsResp?.data) return;
    const next: typeof promptDrafts = {};
    for (const row of promptsResp.data) {
      const effSystem =
        row.override.system && row.override.system !== ""
          ? row.override.system
          : row.default.system;
      const effUser =
        row.override.user && row.override.user !== ""
          ? row.override.user
          : row.default.user;
      const effMaxTokens =
        row.override.max_tokens != null
          ? String(row.override.max_tokens)
          : String(row.default.max_tokens);
      const effTemperature =
        row.override.temperature != null
          ? String(row.override.temperature)
          : String(row.default.temperature);
      next[row.task] = {
        system: effSystem,
        user: effUser,
        max_tokens: effMaxTokens,
        temperature: effTemperature,
      };
    }
    setPromptDrafts(next);
  }, [promptsResp]);

  const savePromptMutation = useMutation({
    mutationFn: ({
      task,
      override,
    }: {
      task: string;
      override: Parameters<typeof aiApi.savePromptOverride>[1];
    }) => aiApi.savePromptOverride(task, override),
    onSuccess: () => {
      showToast(__("Prompt saved.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["ai-prompts"] });
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const resetPromptMutation = useMutation({
    mutationFn: (task: string) => aiApi.resetPrompt(task),
    onSuccess: () => {
      showToast(__("Prompt reset to default.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["ai-prompts"] });
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const resetAllPromptsMutation = useMutation({
    mutationFn: () => aiApi.resetAllPrompts(),
    onSuccess: () => {
      showToast(__("All prompts reset to defaults.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["ai-prompts"] });
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  /* --------------------------- early-out states --------------------------- */

  if (metaLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!meta || !meta.is_ai_eligible) {
    return (
      <div className="space-y-6">
        <PageHeader
          description={__(
            "Inline AI generation for trip content, SEO, and more.",
            "yatra",
          )}
        />
        <UpgradeCard meta={meta} />
      </div>
    );
  }

  const moduleEnabled = meta.is_module_enabled;

  /* ------------------------------- helpers ------------------------------- */

  const updateBv = <K extends keyof AiBrandVoice>(
    key: K,
    value: AiBrandVoice[K],
  ) => setBv((prev) => ({ ...prev, [key]: value }));

  const updateBvList = (
    key: "examples" | "forbidden" | "required",
    raw: string,
  ) => {
    // Textarea → array of trimmed lines. Empty lines drop.
    const list = raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s !== "");
    setBv((prev) => ({ ...prev, [key]: list }));
  };

  const submitBv = (e: React.FormEvent) => {
    e.preventDefault();
    saveBvMutation.mutate(bv);
  };

  /* ------------------------------- renderers ------------------------------- */

  // Per-provider docs metadata — explains why an operator needs the
  // key + where to find it + the canonical pricing page. Keyed by
  // provider id so adding a future provider is one entry. Source of
  // truth: each provider's published docs.
  const providerDocs: Record<
    string,
    { whyDescription: string; whereToFind: string; docsUrl: string; pricingUrl: string }
  > = {
    openai: {
      whyDescription: __(
        "Authenticates every request the plugin sends to OpenAI on your behalf. OpenAI bills your account directly per request — the plugin adds no markup. Without a key, the AI sparkle affordances on Trip / SEO / Email editors stay disabled.",
        "yatra",
      ),
      whereToFind: __(
        "Sign in at platform.openai.com → API keys → Create new secret key. Copy the value (starts with sk-…) immediately — OpenAI shows it only once.",
        "yatra",
      ),
      docsUrl: "https://platform.openai.com/api-keys",
      pricingUrl: "https://openai.com/api/pricing/",
    },
    anthropic: {
      whyDescription: __(
        "Authenticates requests to Anthropic's Claude API. Anthropic bills your account directly per request — no plugin markup. Used for the same in-editor sparkle features OpenAI handles; pick whichever provider your team prefers.",
        "yatra",
      ),
      whereToFind: __(
        "Sign in at console.anthropic.com → Settings → API Keys → Create Key. Copy the value (starts with sk-ant-…) immediately — Anthropic shows it only once.",
        "yatra",
      ),
      docsUrl: "https://console.anthropic.com/settings/keys",
      pricingUrl: "https://www.anthropic.com/pricing#anthropic-api",
    },
  };

  const renderKeys = () => (
    <Card>
      <CardHeader>
        <CardTitle>{__("API Keys", "yatra")}</CardTitle>
        <CardDescription>
          {__(
            "Keys are encrypted at rest with libsodium and never sent to the browser. Generation requests are made from your server directly to your chosen provider — no third-party proxy is involved.",
            "yatra",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Setup walkthrough — same pattern WhatsApp uses, so an
            operator who configured one module knows what to expect
            on the other. Explains the model: bring your own key,
            usage is billed by the provider, the plugin adds no
            markup. */}
        <div className="rounded-md border border-blue-200 bg-blue-50/40 p-3 text-sm dark:border-blue-700 dark:bg-blue-900/20">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="space-y-2 text-blue-900 dark:text-blue-200">
              <div className="font-medium">
                {__(
                  "How AI Assistant billing works",
                  "yatra",
                )}
              </div>
              <p className="text-xs">
                {__(
                  "You bring your own OpenAI or Anthropic key. Each AI generation (trip description, FAQ, email body, etc.) is a single API call your provider charges you for — usually fractions of a cent. The plugin never proxies traffic and adds no markup. You only need one key to start; you can save both and pick a default per task under the Defaults tab.",
                  "yatra",
                )}
              </p>
              <p className="text-[11px] opacity-80">
                {__(
                  "Click \"Where to find this\" next to a provider for the exact steps in their dashboard.",
                  "yatra",
                )}
              </p>
            </div>
          </div>
        </div>
        {meta.providers.map((p) => {
          const status = meta.keys[p.id] ?? { configured: false, hint: "" };
          const draft = keyDrafts[p.id] ?? "";
          const visible = Boolean(showKey[p.id]);
          const docs = providerDocs[p.id];
          return (
            <div
              key={p.id}
              className="rounded-md border border-gray-200 p-3 dark:border-gray-700"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Plug className="h-4 w-4 text-gray-500" />
                  <div className="font-medium text-gray-900 dark:text-white">
                    {p.label}
                  </div>
                  {status.configured ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3" />
                      {__("Configured", "yatra")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      <XCircle className="h-3 w-3" />
                      {__("Not configured", "yatra")}
                    </span>
                  )}
                </div>
                {status.configured && (
                  <div className="text-xs text-gray-500">{status.hint}</div>
                )}
              </div>

              {/* Per-provider "why + where" callout. Two columns: a
                  short why-needed paragraph + a where-to-find recipe
                  with a deep link to the provider's keys page. Only
                  renders when we have docs metadata for the provider
                  — the fallback is silent so a future custom provider
                  doesn't show a broken docs block. */}
              {docs && (
                <div className="mb-3 space-y-2 rounded-md border border-gray-100 bg-gray-50/60 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300">
                  <div className="flex items-start gap-1.5">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {__("Why it's needed:", "yatra")}
                      </span>{" "}
                      {docs.whyDescription}
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {__("Where to find it:", "yatra")}
                      </span>{" "}
                      {docs.whereToFind}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={docs.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-0.5 text-[11px] text-gray-700 hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      {__("Open API keys page", "yatra")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href={docs.pricingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-0.5 text-[11px] text-gray-700 hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      {__("Pricing", "yatra")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[240px]">
                  <Label htmlFor={`ai-key-${p.id}`}>
                    {__("API key", "yatra")}
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id={`ai-key-${p.id}`}
                      type={visible ? "text" : "password"}
                      value={draft}
                      placeholder={
                        status.configured
                          ? __("Enter a new key to replace…", "yatra")
                          : __("sk-… or sk-ant-…", "yatra")
                      }
                      autoComplete="off"
                      onChange={(e) =>
                        setKeyDrafts((d) => ({
                          ...d,
                          [p.id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowKey((s) => ({ ...s, [p.id]: !s[p.id] }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={
                        visible
                          ? __("Hide key", "yatra")
                          : __("Show key", "yatra")
                      }
                    >
                      {visible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() =>
                    setKeyMutation.mutate({ provider: p.id, key: draft })
                  }
                  disabled={
                    draft.trim() === "" || setKeyMutation.isPending
                  }
                >
                  <Save className="mr-2 h-4 w-4" />
                  {__("Save", "yatra")}
                </Button>
                {status.configured && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => testKeyMutation.mutate(p.id)}
                      disabled={testKeyMutation.isPending}
                    >
                      {testKeyMutation.isPending &&
                      testKeyMutation.variables === p.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {__("Test connection", "yatra")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => deleteKeyMutation.mutate(p.id)}
                      disabled={deleteKeyMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {__("Clear", "yatra")}
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {!moduleEnabled && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/40 p-3 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-200">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              {__(
                "AI Assistant module is not enabled yet. Once a key is saved, enable the module from the Modules page so sparkle affordances appear in the editors.",
                "yatra",
              )}{" "}
              <a
                className="font-medium underline"
                href="admin.php?page=yatra&subpage=modules"
              >
                {__("Go to Modules →", "yatra")}
              </a>
            </div>
          </div>
        )}

        {/* Public chat-widget toggle — separate from the module switch
            so operators can opt-in to the front-of-house AI without
            touching their back-office editor affordances. */}
        <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <MessageCircle className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-300" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {__("Public Chat Widget", "yatra")}
                </div>
                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {__(
                    "Adds a \"Chat with AI about this trip\" button below the Send Enquiry button on every single-trip page. Visitors can ask trip-specific questions. Rate-limited per IP/session/trip/day so a hostile visitor can't burn your provider budget.",
                    "yatra",
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(meta.trip_chat_enabled)}
              onClick={() =>
                tripChatMutation.mutate(!meta.trip_chat_enabled)
              }
              disabled={tripChatMutation.isPending || !moduleEnabled}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                meta.trip_chat_enabled
                  ? "bg-blue-600"
                  : "bg-gray-300 dark:bg-gray-600"
              } ${
                tripChatMutation.isPending || !moduleEnabled
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  meta.trip_chat_enabled ? "translate-x-5" : "translate-x-0.5"
                } translate-y-0.5`}
              />
            </button>
          </div>
          {!moduleEnabled && (
            <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-300">
              {__(
                "Enable the AI Assistant module first, then turn this on.",
                "yatra",
              )}
            </div>
          )}

          {/* Rate-limit configuration. Only meaningful when the chat
              widget itself is enabled — but we render the form anyway
              so operators can pre-tune limits before flipping the
              toggle. Each field is clamped to its server-side schema
              range on save so a runaway number can't accidentally
              uncap the AI bill. */}
          {meta.trip_chat_enabled && meta.trip_chat_limits_schema && (
            <div className="mt-3 space-y-3 border-t border-gray-200 pt-3 dark:border-gray-700">
              <div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  {__("Chat rate limits", "yatra")}
                </div>
                <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                  {__(
                    "Caps on the public chat widget to protect your AI provider budget. Higher numbers = more freedom for visitors and more potential cost. Each field is clamped to a safe range on save.",
                    "yatra",
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <LimitField
                  label={__("Per trip · per day", "yatra")}
                  hint={__("Max chat messages per trip per day.", "yatra")}
                  field="per_trip_day"
                  draft={chatLimitsDraft}
                  setDraft={setChatLimitsDraft}
                  schema={meta.trip_chat_limits_schema}
                />
                <LimitField
                  label={__("Per IP · per hour", "yatra")}
                  hint={__("Max messages from one visitor IP per hour.", "yatra")}
                  field="per_ip_hour"
                  draft={chatLimitsDraft}
                  setDraft={setChatLimitsDraft}
                  schema={meta.trip_chat_limits_schema}
                />
                <LimitField
                  label={__("Per session (info)", "yatra")}
                  hint={__("Cap when visitor is just asking questions.", "yatra")}
                  field="per_session"
                  draft={chatLimitsDraft}
                  setDraft={setChatLimitsDraft}
                  schema={meta.trip_chat_limits_schema}
                />
                <LimitField
                  label={__("Per session (booking)", "yatra")}
                  hint={__("Higher cap once visitor signals booking intent.", "yatra")}
                  field="per_session_booking"
                  draft={chatLimitsDraft}
                  setDraft={setChatLimitsDraft}
                  schema={meta.trip_chat_limits_schema}
                />
                <LimitField
                  label={__("Max message length", "yatra")}
                  hint={__("Max characters in a single visitor message.", "yatra")}
                  field="max_message_chars"
                  draft={chatLimitsDraft}
                  setDraft={setChatLimitsDraft}
                  schema={meta.trip_chat_limits_schema}
                />
                <LimitField
                  label={__("History turns sent", "yatra")}
                  hint={__("How many recent turns the AI sees for context.", "yatra")}
                  field="history_turns"
                  draft={chatLimitsDraft}
                  setDraft={setChatLimitsDraft}
                  schema={meta.trip_chat_limits_schema}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Revert the form to whatever the server currently
                    // has stored, discarding unsaved edits.
                    if (meta.trip_chat_limits) {
                      const l = meta.trip_chat_limits;
                      setChatLimitsDraft({
                        per_trip_day: String(l.per_trip_day),
                        per_ip_hour: String(l.per_ip_hour),
                        per_session: String(l.per_session),
                        per_session_booking: String(l.per_session_booking),
                        max_message_chars: String(l.max_message_chars),
                        history_turns: String(l.history_turns),
                      });
                    }
                  }}
                  disabled={tripChatLimitsMutation.isPending}
                >
                  {__("Revert", "yatra")}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    // Convert all fields to numbers — empty / NaN
                    // skipped so the server falls back to whatever
                    // it currently has stored for that key.
                    const patch: Partial<AiChatLimits> = {};
                    (
                      Object.keys(chatLimitsDraft) as Array<keyof AiChatLimits>
                    ).forEach((k) => {
                      const v = parseInt(chatLimitsDraft[k], 10);
                      if (Number.isFinite(v)) patch[k] = v;
                    });
                    tripChatLimitsMutation.mutate(patch);
                  }}
                  disabled={tripChatLimitsMutation.isPending}
                >
                  {tripChatLimitsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {__("Saving…", "yatra")}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {__("Save limits", "yatra")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderVoice = () => (
    <Card>
      <CardHeader>
        <CardTitle>{__("Brand voice", "yatra")}</CardTitle>
        <CardDescription>
          {__(
            "Define your voice once — it flows into every generation across trips, SEO, and emails. The more specific, the more your AI output sounds like you.",
            "yatra",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Intro callout — explains the WHY of brand voice. Every
            AI prompt the plugin sends to OpenAI / Anthropic gets the
            brand-voice block auto-prepended as the first lines of
            the system prompt, so trip descriptions, enquiry replies,
            email subjects, and chat responses all share a consistent
            tone. */}
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-900 dark:border-blue-500/40 dark:bg-blue-900/20 dark:text-blue-200">
          <div className="mb-1 font-semibold">
            {__("How brand voice is used", "yatra")}
          </div>
          <p className="leading-relaxed">
            {__(
              "Everything you fill in here is automatically prepended to every prompt the plugin sends to your AI provider. Trip descriptions, enquiry replies, email templates, the public chat widget, and the back-office wizards all start with these instructions — so your output sounds like one consistent brand, not a different voice per feature.",
              "yatra",
            )}
          </p>
        </div>

        <form onSubmit={submitBv} className="space-y-5">
          <div>
            <Label htmlFor="bv-tone">{__("Tone description", "yatra")}</Label>
            <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">
              {__(
                "The single most important field. 2-3 sentences describing how you'd describe your brand to a new copywriter. Plain English — not marketing jargon. AI reads this every generation and aims for this tone.",
                "yatra",
              )}
            </p>
            <textarea
              id="bv-tone"
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              value={bv.tone}
              placeholder={__(
                "e.g. Warm, adventurous, never corporate. Speak directly to the traveler. We're a small team, not a corporation.",
                "yatra",
              )}
              onChange={(e) => updateBv("tone", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="bv-examples">
              {__("Style examples (one paragraph per line)", "yatra")}
            </Label>
            <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">
              {__(
                "Paste 3-5 paragraphs from your existing trip pages, emails, or marketing copy that sound right. AI uses these as few-shot examples — concrete writing samples beat abstract tone descriptions for getting the voice exactly right. One paragraph per line.",
                "yatra",
              )}
            </p>
            <textarea
              id="bv-examples"
              rows={6}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-800"
              value={bv.examples.join("\n")}
              placeholder={__(
                "Paste 3-5 paragraphs from your existing trips/emails that sound like you. AI uses these as few-shot examples.",
                "yatra",
              )}
              onChange={(e) => updateBvList("examples", e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="bv-forbidden">
                {__("Forbidden words / phrases", "yatra")}
              </Label>
              <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">
                {__(
                  "Words AI must never use. Common entries: \"unforgettable\", \"once in a lifetime\", \"breathtaking\", \"world-class\", or any competitor name. One per line — AI treats these as a hard blocklist.",
                  "yatra",
                )}
              </p>
              <textarea
                id="bv-forbidden"
                rows={4}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-xs dark:border-gray-600 dark:bg-gray-800"
                value={bv.forbidden.join("\n")}
                placeholder={__(
                  "One per line — words / phrases to avoid.",
                  "yatra",
                )}
                onChange={(e) => updateBvList("forbidden", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bv-required">
                {__("Required mentions", "yatra")}
              </Label>
              <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">
                {__(
                  "Things AI should weave in WHEN RELEVANT — never forced. Examples: \"local guides\", \"small group sizes\", \"sustainable practices\", \"our 24/7 support\". One per line. AI mentions these only when they fit the context naturally.",
                  "yatra",
                )}
              </p>
              <textarea
                id="bv-required"
                rows={4}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-xs dark:border-gray-600 dark:bg-gray-800"
                value={bv.required.join("\n")}
                placeholder={__(
                  "One per line — things to weave in when relevant.",
                  "yatra",
                )}
                onChange={(e) => updateBvList("required", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="bv-lang">
                {__("Default language", "yatra")}
              </Label>
              <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">
                {__(
                  "BCP-47 code. AI writes in this language unless overridden by per-prompt context (e.g. enquiry replies match the customer's preferred language when known).",
                  "yatra",
                )}
              </p>
              <Input
                id="bv-lang"
                value={bv.language}
                placeholder="en-US"
                onChange={(e) => updateBv("language", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bv-provider">
                {__("Default provider", "yatra")}
              </Label>
              <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">
                {__(
                  "Which AI service handles each generation by default. Per-feature usage runs through the provider whose API key is configured under API Keys above.",
                  "yatra",
                )}
              </p>
              <Select
                id="bv-provider"
                value={bv.default_provider}
                onChange={(e) =>
                  updateBv("default_provider", e.target.value)
                }
              >
                {meta.providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="bv-model">
                {__("Default model", "yatra")}
              </Label>
              <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">
                {__(
                  "Specific model within the provider. Smaller / faster models (gpt-4o-mini, Claude Haiku) are cheaper and ~good enough for most generations. Larger models are slower + costlier but produce richer output for trip descriptions.",
                  "yatra",
                )}
              </p>
              <Select
                id="bv-model"
                value={bv.default_model}
                onChange={(e) => updateBv("default_model", e.target.value)}
              >
                <option value="">
                  {__("(Provider default)", "yatra")}
                </option>
                {(
                  meta.providers.find((p) => p.id === bv.default_provider)
                    ?.models ?? []
                ).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saveBvMutation.isPending}>
              {saveBvMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {__("Saving…", "yatra")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {__("Save brand voice", "yatra")}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderUsage = () => {
    const usage = usageResp?.data;
    return (
      <Card>
        <CardHeader>
          <CardTitle>{__("Usage", "yatra")}</CardTitle>
          <CardDescription>
            {__(
              "Rolling 13-month token totals, per provider, per task. Costs are paid directly to your AI provider — no markup is added.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!usage ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-3 gap-3">
                <Stat label={__("Total calls", "yatra")} value={usage.totals.calls.toLocaleString()} />
                <Stat
                  label={__("Prompt tokens", "yatra")}
                  value={usage.totals.prompt.toLocaleString()}
                />
                <Stat
                  label={__("Completion tokens", "yatra")}
                  value={usage.totals.completion.toLocaleString()}
                />
              </div>

              {Object.keys(usage.months).length === 0 && (
                <p className="text-sm text-gray-500">
                  {__("No AI usage yet.", "yatra")}
                </p>
              )}

              <div className="space-y-3">
                {Object.entries(usage.months).map(([month, providers]) => (
                  <div
                    key={month}
                    className="rounded-md border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <div className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      {month}
                      {month === usage.current_month && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {__("Current", "yatra")}
                        </span>
                      )}
                    </div>
                    {Object.entries(providers).map(([prov, bucket]) => (
                      <div
                        key={prov}
                        className="mb-1 grid grid-cols-4 gap-2 text-xs"
                      >
                        <div className="font-medium text-gray-700 dark:text-gray-200">
                          {prov}
                        </div>
                        <div>
                          {bucket.calls} {__("calls", "yatra")}
                        </div>
                        <div>
                          {bucket.prompt.toLocaleString()}{" "}
                          {__("in", "yatra")}
                        </div>
                        <div>
                          {bucket.completion.toLocaleString()}{" "}
                          {__("out", "yatra")}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPrompts = () => {
    const rows = promptsResp?.data ?? [];

    // Group by category for an easier-to-scan list.
    const grouped: Record<string, AiPromptRow[]> = {};
    for (const r of rows) {
      (grouped[r.category] ||= []).push(r);
    }
    const groupOrder = Object.keys(grouped);

    const submitPrompt = (row: AiPromptRow) => {
      const draft = promptDrafts[row.task];
      if (!draft) return;
      // Only persist fields that differ from default. Empty string = revert.
      const override: {
        system?: string;
        user?: string;
        max_tokens?: number | null;
        temperature?: number | null;
      } = {};

      const sysTrim = draft.system.trim();
      override.system =
        sysTrim === "" || sysTrim === row.default.system.trim()
          ? ""
          : draft.system;

      const usrTrim = draft.user.trim();
      override.user =
        usrTrim === "" || usrTrim === row.default.user.trim()
          ? ""
          : draft.user;

      const mt = parseInt(draft.max_tokens, 10);
      override.max_tokens =
        Number.isFinite(mt) && mt !== row.default.max_tokens ? mt : null;

      const tp = parseFloat(draft.temperature);
      override.temperature =
        Number.isFinite(tp) && tp !== row.default.temperature ? tp : null;

      savePromptMutation.mutate({ task: row.task, override });
    };

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{__("Prompts", "yatra")}</CardTitle>
              <CardDescription>
                {__(
                  "Every system + user prompt the assistant uses. Edit any field — blank fields fall back to the shipped default per-field. Brand voice is auto-prepended to system prompts, so don't repeat it here.",
                  "yatra",
                )}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (
                  window.confirm(
                    __(
                      "Reset every prompt to its shipped default? This wipes all your overrides.",
                      "yatra",
                    ),
                  )
                ) {
                  resetAllPromptsMutation.mutate();
                }
              }}
              disabled={resetAllPromptsMutation.isPending}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {__("Reset all", "yatra")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {promptsLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500">
              {__("No prompts available.", "yatra")}
            </p>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50/40 p-3 text-xs text-blue-800 dark:border-blue-500/40 dark:bg-blue-900/20 dark:text-blue-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  {__(
                    "Use {{placeholders}} to inject runtime context (e.g. {{name}}, {{extra_context}}). Removing a placeholder means the assistant won't see that field — edit with care.",
                    "yatra",
                  )}
                </div>
              </div>

              {groupOrder.map((cat) => (
                <div key={cat}>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {cat}
                  </div>
                  <div className="space-y-2">
                    {grouped[cat].map((row) => {
                      const isOpen = expandedPrompt === row.task;
                      const draft =
                        promptDrafts[row.task] ?? {
                          system: row.default.system,
                          user: row.default.user,
                          max_tokens: String(row.default.max_tokens),
                          temperature: String(row.default.temperature),
                        };
                      const saving =
                        savePromptMutation.isPending &&
                        (savePromptMutation.variables as any)?.task ===
                          row.task;
                      const resetting =
                        resetPromptMutation.isPending &&
                        resetPromptMutation.variables === row.task;

                      return (
                        <div
                          key={row.task}
                          className="rounded-md border border-gray-200 dark:border-gray-700"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPrompt(isOpen ? null : row.task)
                            }
                            className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/60"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {row.label}
                                </span>
                                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                  {row.task}
                                </code>
                                {row.has_override && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    {__("Customized", "yatra")}
                                  </span>
                                )}
                              </div>
                              {/* Operator-facing one-liner explaining
                                  WHERE this prompt is used in the
                                  product. Renders only when registered
                                  (no description = nothing shown). */}
                              {row.description && (
                                <div className="mt-0.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                                  {row.description}
                                </div>
                              )}
                            </div>
                            {isOpen ? (
                              <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                            ) : (
                              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                            )}
                          </button>

                          {isOpen && (
                            <div className="space-y-3 border-t border-gray-200 p-3 dark:border-gray-700">
                              <div>
                                <Label htmlFor={`pr-sys-${row.task}`}>
                                  {__("System prompt", "yatra")}
                                </Label>
                                <textarea
                                  id={`pr-sys-${row.task}`}
                                  rows={5}
                                  className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-800"
                                  value={draft.system}
                                  onChange={(e) =>
                                    setPromptDrafts((d) => ({
                                      ...d,
                                      [row.task]: {
                                        ...draft,
                                        system: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>

                              <div>
                                <Label htmlFor={`pr-usr-${row.task}`}>
                                  {__("User prompt", "yatra")}
                                </Label>
                                <textarea
                                  id={`pr-usr-${row.task}`}
                                  rows={10}
                                  className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-800"
                                  value={draft.user}
                                  onChange={(e) =>
                                    setPromptDrafts((d) => ({
                                      ...d,
                                      [row.task]: {
                                        ...draft,
                                        user: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <Label htmlFor={`pr-mt-${row.task}`}>
                                    {__("Max tokens", "yatra")}{" "}
                                    <span className="text-[10px] text-gray-400">
                                      ({__("default", "yatra")}:{" "}
                                      {row.default.max_tokens})
                                    </span>
                                  </Label>
                                  <Input
                                    id={`pr-mt-${row.task}`}
                                    type="number"
                                    min={16}
                                    max={8000}
                                    value={draft.max_tokens}
                                    onChange={(e) =>
                                      setPromptDrafts((d) => ({
                                        ...d,
                                        [row.task]: {
                                          ...draft,
                                          max_tokens: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`pr-tp-${row.task}`}>
                                    {__("Temperature", "yatra")}{" "}
                                    <span className="text-[10px] text-gray-400">
                                      ({__("default", "yatra")}:{" "}
                                      {row.default.temperature})
                                    </span>
                                  </Label>
                                  <Input
                                    id={`pr-tp-${row.task}`}
                                    type="number"
                                    min={0}
                                    max={2}
                                    step={0.1}
                                    value={draft.temperature}
                                    onChange={(e) =>
                                      setPromptDrafts((d) => ({
                                        ...d,
                                        [row.task]: {
                                          ...draft,
                                          temperature: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              </div>

                              <details className="rounded-md border border-dashed border-gray-200 px-3 py-2 text-xs dark:border-gray-700">
                                <summary className="cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400">
                                  {__("Show shipped defaults", "yatra")}
                                </summary>
                                <div className="mt-2 space-y-2">
                                  <div>
                                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                      {__("Default system", "yatra")}
                                    </div>
                                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-[11px] text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                                      {row.default.system}
                                    </pre>
                                  </div>
                                  <div>
                                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                      {__("Default user", "yatra")}
                                    </div>
                                    <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-[11px] text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                                      {row.default.user}
                                    </pre>
                                  </div>
                                </div>
                              </details>

                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Button
                                  type="button"
                                  onClick={() => submitPrompt(row)}
                                  disabled={saving}
                                >
                                  {saving ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      {__("Saving…", "yatra")}
                                    </>
                                  ) : (
                                    <>
                                      <Save className="mr-2 h-4 w-4" />
                                      {__("Save", "yatra")}
                                    </>
                                  )}
                                </Button>
                                {row.has_override && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                      resetPromptMutation.mutate(row.task)
                                    }
                                    disabled={resetting}
                                  >
                                    {resetting ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <RotateCcw className="mr-2 h-4 w-4" />
                                    )}
                                    {__("Reset to default", "yatra")}
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const currentSection =
    SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];

  return (
    <div className="space-y-6">
      <PageHeader
        description={__(
          "Inline AI generation grounded in your trip data. Bring your own key.",
          "yatra",
        )}
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardContent className="p-2">
              <nav className="flex flex-col gap-1">
                {SECTIONS.map((s) => {
                  const Icon = s.icon;
                  const active = s.id === activeSection;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSection(s.id)}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        active
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{s.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
          <div className="mt-3 px-2 text-xs text-gray-500 dark:text-gray-400">
            {currentSection.description}
          </div>
        </aside>

        <div className="space-y-4">
          {activeSection === "keys" && renderKeys()}
          {activeSection === "voice" && renderVoice()}
          {activeSection === "prompts" && renderPrompts()}
          {activeSection === "usage" && renderUsage()}
        </div>
      </div>
    </div>
  );
};

/**
 * Numeric input + label for one chat rate-limit field. Shows the
 * schema-declared min/max as a hint so the operator knows the
 * accepted range before they save.
 */
const LimitField: React.FC<{
  label: string;
  hint: string;
  field: keyof AiChatLimits;
  draft: Record<keyof AiChatLimits, string>;
  setDraft: React.Dispatch<
    React.SetStateAction<Record<keyof AiChatLimits, string>>
  >;
  schema: Record<keyof AiChatLimits, { default: number; min: number; max: number }>;
}> = ({ label, hint, field, draft, setDraft, schema }) => {
  const range = schema[field];
  return (
    <div>
      <Label htmlFor={`chat-limit-${field}`}>{label}</Label>
      <Input
        id={`chat-limit-${field}`}
        type="number"
        min={range?.min}
        max={range?.max}
        value={draft[field]}
        onChange={(e) =>
          setDraft((prev) => ({ ...prev, [field]: e.target.value }))
        }
      />
      <div className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
        {hint}
        {range && (
          <>
            {" "}
            <span className="text-gray-400">
              ({range.min}–{range.max})
            </span>
          </>
        )}
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
    <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {label}
    </div>
    <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
      {value}
    </div>
  </div>
);

function extractError(e: any): string {
  const data = e?.response?.data ?? e?.data ?? null;
  if (data && typeof data === "object" && typeof (data as any).message === "string") {
    return (data as any).message;
  }
  return e?.message || "AI request failed.";
}

export default AiAssistant;
