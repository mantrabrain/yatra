import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  KeyRound,
  Send,
  FileText,
  Clock,
  Settings2,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  Code,
  Copy,
  Check,
  Zap,
  Info,
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  UserCircle,
  Webhook,
  Users,
  History,
  RotateCcw,
} from "lucide-react";
import { __, sprintf } from "../lib/i18n";
import { PageHeader } from "../components/common/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  ModulePageSkeleton,
  ModuleFormSkeleton,
} from "../components/ui/module-skeleton";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Pagination } from "../components/shared/Pagination";
import { useToast } from "../components/ui/toast";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { Modal } from "../components/ui/modal";
import { Alert } from "../components/ui/alert";
import {
  whatsappApi,
  type WhatsappMeta,
  type WhatsappSettings,
  type WhatsappSettingsResponse,
  type WhatsappTemplate,
  type WhatsappTemplateVersion,
  type WhatsappEvent,
  type WhatsappWidgetSettings,
} from "../api/whatsapp-api";

/**
 * Yatra → WhatsApp Notifications hub.
 *
 * Mirrors EmailAutomation's tab strip + card pattern. Templates are
 * now backed by the `yatra_whatsapp_templates` DB table:
 *
 *   - System templates: editable body / meta_template_name / language /
 *     active; CANNOT change event_key, recipient_type, or be deleted
 *   - Custom templates: every field editable, including delete
 */

type WhatsappTab = "delivery" | "templates" | "widget" | "logs" | "opt-ins";

function getInitialTab(): WhatsappTab {
  if (typeof window === "undefined") return "delivery";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab === "templates" || tab === "template") return "templates";
  if (tab === "widget") return "widget";
  if (tab === "logs" || tab === "log") return "logs";
  if (tab === "opt-ins" || tab === "optins") return "opt-ins";
  return "delivery";
}

const Whatsapp: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<WhatsappTab>(() =>
    getInitialTab(),
  );

  const switchTab = (next: WhatsappTab) => {
    setActiveTab(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const { data: meta, isLoading: metaLoading } = useQuery<WhatsappMeta>({
    queryKey: ["whatsapp-meta"],
    queryFn: () => whatsappApi.getMeta(),
  });

  const { data: cfg } = useQuery<WhatsappSettingsResponse>({
    queryKey: ["whatsapp-settings"],
    queryFn: () => whatsappApi.getSettings(),
    enabled: Boolean(meta?.is_eligible && meta?.is_module_enabled),
  });

  const saveSettings = useMutation({
    mutationFn: (patch: Partial<WhatsappSettings>) =>
      whatsappApi.updateSettings(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-meta"] });
      showToast(__("WhatsApp settings saved.", "yatra"), "success");
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const saveCredential = useMutation({
    mutationFn: (vars: { field: string; value: string }) =>
      whatsappApi.updateCredential("cloud_api", vars.field, vars.value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-meta"] });
      showToast(__("Credential saved.", "yatra"), "success");
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  if (metaLoading) {
    return <ModulePageSkeleton variant="tabs" />;
  }

  if (!meta || !meta.is_eligible) {
    return (
      <div className="space-y-6">
        <PageHeader
          description={__(
            "Send booking + payment + reminder messages over WhatsApp.",
            "yatra",
          )}
        />
        <UpgradeCard meta={meta} />
      </div>
    );
  }

  const automationReady = Boolean(meta.is_module_enabled);

  const tabs: Array<{ key: WhatsappTab; label: string; icon: any }> = [
    { key: "delivery", label: __("Delivery", "yatra"), icon: Send },
    { key: "templates", label: __("Templates", "yatra"), icon: FileText },
    {
      key: "widget",
      label: __("Frontend widget", "yatra"),
      icon: MessageCircle,
    },
    { key: "logs", label: __("Message logs", "yatra"), icon: MessageCircle },
    { key: "opt-ins", label: __("Opt-ins", "yatra"), icon: Users },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        description={__(
          "WhatsApp credentials, system + custom templates, and message logs — bring your own Cloud API account.",
          "yatra",
        )}
      />

      <Card>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex flex-wrap gap-1 px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => switchTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                    active
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <CardContent className="p-6">
          {activeTab === "delivery" && (
            <>
              {!automationReady ? (
                <WhatsappModulePrompt />
              ) : !cfg ? (
                <ModuleFormSkeleton rows={5} />
              ) : (
                <DeliverySection
                  cfg={cfg}
                  meta={meta}
                  onSaveCredential={(field, value) =>
                    saveCredential.mutate({ field, value })
                  }
                  onSaveSettings={(patch) => saveSettings.mutate(patch)}
                  saving={saveSettings.isPending || saveCredential.isPending}
                />
              )}
            </>
          )}

          {activeTab === "templates" && (
            <>
              {!automationReady ? <WhatsappModulePrompt /> : <TemplatesTab />}
            </>
          )}

          {activeTab === "widget" && (
            <>
              {!automationReady ? (
                <WhatsappModulePrompt />
              ) : !cfg ? (
                <ModuleFormSkeleton rows={5} />
              ) : (
                <WidgetSection
                  settings={cfg.settings}
                  onSave={(patch) => saveSettings.mutate(patch)}
                  saving={saveSettings.isPending}
                />
              )}
            </>
          )}

          {activeTab === "logs" &&
            (automationReady ? <LogsList /> : <WhatsappModulePrompt />)}

          {activeTab === "opt-ins" &&
            (automationReady ? <OptInsList /> : <WhatsappModulePrompt />)}
        </CardContent>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Upgrade card / module prompt — same patterns as Email Automation          */
/* -------------------------------------------------------------------------- */

const UpgradeCard: React.FC<{ meta?: WhatsappMeta }> = ({ meta }) => {
  const upgradeUrl =
    meta?.upgrade_url || "https://wpyatra.com/pricing?module=whatsapp";
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle>{__("WhatsApp Notifications", "yatra")}</CardTitle>
            <CardDescription className="mt-1">
              {__(
                "Available on the Growth plan (or Agency). Send booking + payment + reminder messages — bring your own Meta Cloud API credentials.",
                "yatra",
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <a href={upgradeUrl} target="_blank" rel="noopener noreferrer">
            {__("Upgrade to Growth", "yatra")}
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

const WhatsappModulePrompt: React.FC = () => (
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <Settings2 className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100">
            {__("Enable the WhatsApp Notifications module", "yatra")}
          </h3>
          <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/90">
            {__(
              "Your license tier qualifies. Turn on WhatsApp Notifications under Modules to start configuring it.",
              "yatra",
            )}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        asChild
        className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
      >
        <a href="admin.php?page=yatra&subpage=modules">
          {__("Open Modules", "yatra")}
        </a>
      </Button>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Delivery section                                                          */
/* -------------------------------------------------------------------------- */

const DeliverySection: React.FC<{
  cfg: WhatsappSettingsResponse;
  meta: WhatsappMeta;
  onSaveCredential: (field: string, value: string) => void;
  onSaveSettings: (patch: Partial<WhatsappSettings>) => void;
  saving: boolean;
}> = ({ cfg, meta, onSaveCredential, onSaveSettings, saving }) => {
  const settings = cfg.settings;
  const credStatus = cfg.credentials?.cloud_api ?? {};

  const [tokenInput, setTokenInput] = useState("");
  const [webhookInput, setWebhookInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);

  const [phoneNumberId, setPhoneNumberId] = useState(settings.phone_number_id);
  const [businessAccountId, setBusinessAccountId] = useState(
    settings.business_account_id,
  );
  const [defaultCountryCode, setDefaultCountryCode] = useState(
    settings.default_country_code,
  );
  const [senderName, setSenderName] = useState(settings.sender_display_name);
  const [adminPhone, setAdminPhone] = useState(settings.admin_phone);
  const [optInRequired, setOptInRequired] = useState(settings.opt_in_required);
  const [optInCopy, setOptInCopy] = useState(settings.opt_in_copy);
  const [reminderBefore, setReminderBefore] = useState<number>(
    settings.reminder_hours_before,
  );
  const [reviewAfter, setReviewAfter] = useState<number>(
    settings.review_hours_after,
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
    settings.review_hours_after,
  ]);

  const dirty =
    phoneNumberId !== settings.phone_number_id ||
    businessAccountId !== settings.business_account_id ||
    defaultCountryCode !== settings.default_country_code ||
    senderName !== settings.sender_display_name ||
    adminPhone !== settings.admin_phone ||
    optInRequired !== settings.opt_in_required ||
    optInCopy !== settings.opt_in_copy ||
    reminderBefore !== settings.reminder_hours_before ||
    reviewAfter !== settings.review_hours_after;

  const saveAll = () =>
    onSaveSettings({
      phone_number_id: phoneNumberId,
      business_account_id: businessAccountId,
      sender_display_name: senderName,
      default_country_code: defaultCountryCode,
      admin_phone: adminPhone,
      opt_in_required: optInRequired,
      opt_in_copy: optInCopy,
      reminder_hours_before: reminderBefore,
      review_hours_after: reviewAfter,
    });

  return (
    <div className="space-y-6">
      {/* Setup walkthrough */}
      <Card className="border-blue-200 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {__(
              "Before you start — getting WhatsApp Cloud API access",
              "yatra",
            )}
          </CardTitle>
          <CardDescription className="mt-2">
            {__(
              "All values below come from Meta's WhatsApp Business Platform. Bring your own credentials — messages are billed directly by Meta, no markup from the plugin.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                {__("Cloud API: Get started", "yatra")}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://business.facebook.com/wa/manage/home/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                {__("Open WhatsApp Manager", "yatra")}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-blue-500" />
            {__("WhatsApp Cloud API credentials", "yatra")}
          </CardTitle>
          <CardDescription>
            {__(
              "Encrypted credentials Meta requires for the plugin to send messages on your behalf. Stored with libsodium AEAD; the browser only ever sees a masked last-4 hint.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CredentialField
            label={__("Permanent access token", "yatra")}
            description={__(
              "Required for every API call to Meta. Find it under Meta for Developers → your app → WhatsApp → API Setup, or generate a permanent token under Business Settings → System Users.",
              "yatra",
            )}
            docsUrl="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#access-tokens"
            placeholder={
              credStatus.access_token?.configured
                ? credStatus.access_token.hint
                : "EAAB..."
            }
            configured={!!credStatus.access_token?.configured}
            visible={showToken}
            value={tokenInput}
            onToggle={() => setShowToken((v) => !v)}
            onChange={setTokenInput}
            onSave={() => {
              onSaveCredential("access_token", tokenInput);
              setTokenInput("");
            }}
            onClear={() => onSaveCredential("access_token", "")}
            saving={saving}
          />
          <CredentialField
            label={__("Webhook verify secret (App Secret)", "yatra")}
            description={__(
              "Required only when receiving inbound replies. Find it under your app → Settings → Basic → App Secret.",
              "yatra",
            )}
            docsUrl="https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks"
            optional
            placeholder={
              credStatus.webhook_secret?.configured
                ? credStatus.webhook_secret.hint
                : __("Optional — only needed when receiving messages.", "yatra")
            }
            configured={!!credStatus.webhook_secret?.configured}
            visible={showWebhook}
            value={webhookInput}
            onToggle={() => setShowWebhook((v) => !v)}
            onChange={setWebhookInput}
            onSave={() => {
              onSaveCredential("webhook_secret", webhookInput);
              setWebhookInput("");
            }}
            onClear={() => onSaveCredential("webhook_secret", "")}
            saving={saving}
          />
        </CardContent>
      </Card>

      <WebhookSetupCard meta={meta} />

      {/* Identifiers + admin phone */}
      <Card>
        <CardHeader>
          <CardTitle>{__("Business identifiers", "yatra")}</CardTitle>
          <CardDescription>
            {__(
              "Numeric IDs from Meta + the admin phone that receives operator-recipient templates.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{__("Phone number ID", "yatra")}</Label>
              <Input
                value={phoneNumberId}
                placeholder="123456789012345"
                onChange={(e) => setPhoneNumberId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{__("WhatsApp Business Account ID", "yatra")}</Label>
              <Input
                value={businessAccountId}
                placeholder="987654321098765"
                onChange={(e) => setBusinessAccountId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{__("Sender display name", "yatra")}</Label>
              <Input
                value={senderName}
                placeholder={__("Your tour brand", "yatra")}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{__("Default country code", "yatra")}</Label>
              <Input
                value={defaultCountryCode}
                placeholder="+977"
                onChange={(e) => setDefaultCountryCode(e.target.value)}
              />
            </div>
          </div>

          {/* Admin phone — destination for recipient_type=admin templates */}
          <div className="space-y-2 rounded-md border border-orange-200 bg-orange-50/40 p-3 dark:border-orange-700 dark:bg-orange-900/20">
            <div className="flex items-center gap-1.5">
              <UserCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <Label className="font-semibold text-orange-900 dark:text-orange-200">
                {__("Admin phone (for operator notifications)", "yatra")}
              </Label>
            </div>
            <p className="text-xs text-orange-900/80 dark:text-orange-200/80">
              {__(
                'Destination for any template with recipient type "Admin" — for example a "New booking" alert sent to the operator. Leave blank to skip those sends. Must be in E.164 format.',
                "yatra",
              )}
            </p>
            <Input
              value={adminPhone}
              placeholder="+9779800000000"
              onChange={(e) => setAdminPhone(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            {__("Compliance & opt-in", "yatra")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={optInRequired}
              onChange={(e) => setOptInRequired(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {__("Require opt-in before sending", "yatra")}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {__(
                  "Refuses sends to phone numbers that haven't explicitly opted in. Admin-recipient templates are exempt (the operator owns that number).",
                  "yatra",
                )}
              </div>
            </div>
          </label>
          <div className="space-y-2">
            <Label>{__("Opt-in checkbox copy", "yatra")}</Label>
            <textarea
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              rows={3}
              value={optInCopy}
              onChange={(e) => setOptInCopy(e.target.value)}
              placeholder={__(
                "Send me booking updates and trip reminders on WhatsApp. Reply STOP to opt out anytime.",
                "yatra",
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reminder schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            {__("Reminder schedule", "yatra")}
          </CardTitle>
          <CardDescription>
            {__(
              "How far before / after a trip the time-based templates fire. Clamped 1–168 hours.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{__("Departure reminder (hours before)", "yatra")}</Label>
              <Input
                type="number"
                min={1}
                max={168}
                value={reminderBefore}
                onChange={(e) => setReminderBefore(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>{__("Review request (hours after)", "yatra")}</Label>
              <Input
                type="number"
                min={1}
                max={168}
                value={reviewAfter}
                onChange={(e) => setReviewAfter(Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {dirty && (
        <CardFooter className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-700/50">
          <Button onClick={saveAll} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                {__("Saving…", "yatra")}
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" />
                {__("Save WhatsApp settings", "yatra")}
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </div>
  );
};

/**
 * Renders the read-only webhook configuration block — the operator
 * copies these values into Meta's WhatsApp → Webhooks subscription:
 *   • Callback URL          → this plugin's REST endpoint
 *   • Verify token          → auto-generated on first settings save
 *   • App Secret status     → visibility flag (the secret itself is
 *                             encrypted at rest and never sent here)
 */
const WebhookSetupCard: React.FC<{ meta: WhatsappMeta }> = ({ meta }) => {
  const { showToast } = useToast();
  const webhook = meta.webhook;
  const [justCopied, setJustCopied] = useState<"url" | "token" | null>(null);

  const copy = async (text: string, label: "url" | "token") => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts
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
      window.setTimeout(() => setJustCopied(null), 2000);
    } catch (_e) {
      showToast(__("Failed to copy to clipboard.", "yatra"), "error");
    }
  };

  const tokenMissing = !webhook?.verify_token;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          {__("Meta webhook setup", "yatra")}
        </CardTitle>
        <CardDescription>
          {__(
            "Paste these values into your Meta app → WhatsApp → Configuration → Webhooks. Once verified, Meta will deliver message status callbacks (sent / delivered / read / failed) and inbound replies here.",
            "yatra",
          )}{" "}
          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            {__("Setup guide", "yatra")}{" "}
            <ExternalLink className="inline h-3 w-3" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Callback URL */}
        <div>
          <Label
            htmlFor="whatsapp-webhook-url"
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            {__("Callback URL", "yatra")}
          </Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="whatsapp-webhook-url"
              readOnly
              value={webhook?.url || ""}
              className="font-mono text-sm"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copy(webhook?.url || "", "url")}
              disabled={!webhook?.url}
              aria-label={__("Copy callback URL", "yatra")}
            >
              {justCopied === "url" ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  {__("Copied", "yatra")}
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  {__("Copy", "yatra")}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Verify token */}
        <div>
          <Label
            htmlFor="whatsapp-verify-token"
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            {__("Verify token", "yatra")}
          </Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="whatsapp-verify-token"
              readOnly
              value={webhook?.verify_token || ""}
              placeholder={
                tokenMissing
                  ? __(
                      "Will be generated when you save settings for the first time.",
                      "yatra",
                    )
                  : ""
              }
              className="font-mono text-sm"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copy(webhook?.verify_token || "", "token")}
              disabled={tokenMissing}
              aria-label={__("Copy verify token", "yatra")}
            >
              {justCopied === "token" ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  {__("Copied", "yatra")}
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  {__("Copy", "yatra")}
                </>
              )}
            </Button>
          </div>
          {tokenMissing && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              {__(
                "Save your settings once to generate a verify token, then come back to copy it.",
                "yatra",
              )}
            </p>
          )}
        </div>

        {/* App secret status (read-only) */}
        <div className="rounded-md bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm">
          {webhook?.app_secret_configured ? (
            <span className="inline-flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              {__(
                "App Secret is configured — webhook signatures will be verified.",
                "yatra",
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <XCircle className="h-4 w-4" />
              {__(
                "App Secret not set — inbound webhook events will be rejected for security. Paste your Meta App Secret above as “Webhook verify secret”.",
                "yatra",
              )}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CredentialField: React.FC<{
  label: string;
  description?: string;
  docsUrl?: string;
  optional?: boolean;
  placeholder: string;
  configured: boolean;
  visible: boolean;
  value: string;
  onToggle: () => void;
  onChange: (v: string) => void;
  onSave: () => void;
  onClear: () => void;
  saving: boolean;
}> = ({
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
  saving,
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <Label className="flex items-center gap-1.5">
        {label}
        {optional && (
          <span className="text-[10px] uppercase tracking-wide text-gray-400">
            {__("optional", "yatra")}
          </span>
        )}
      </Label>
      {docsUrl && (
        <a
          href={docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          {__("Where to find this", "yatra")}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
    {description && (
      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
        <span>{description}</span>
      </p>
    )}
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      <Button onClick={onSave} disabled={saving || value.trim() === ""}>
        <Save className="mr-1.5 h-4 w-4" />
        {__("Save", "yatra")}
      </Button>
      {configured && (
        <Button variant="outline" onClick={onClear} disabled={saving}>
          {__("Clear", "yatra")}
        </Button>
      )}
    </div>
    {configured && (
      <p className="text-xs text-green-600 dark:text-green-400">
        <CheckCircle2 className="mr-1 inline h-3 w-3" />
        {__("Configured", "yatra")}
      </p>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Templates tab — DB-driven list + create/edit                              */
/* -------------------------------------------------------------------------- */

const TemplatesTab: React.FC = () => {
  const [editingId, setEditingId] = useState<number | "new" | null>(null);

  const { data: tplData, isLoading: tplLoading } = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: () => whatsappApi.listTemplates(),
  });
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["whatsapp-events"],
    queryFn: () => whatsappApi.listEvents(),
  });

  if (tplLoading || eventsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    );
  }

  const templates = tplData?.data ?? [];
  const events = eventsData?.data ?? [];

  if (editingId !== null) {
    const existing =
      editingId === "new"
        ? null
        : (templates.find((t) => t.id === editingId) ?? null);
    return (
      <TemplateEditForm
        existing={existing}
        events={events}
        onClose={() => setEditingId(null)}
      />
    );
  }

  return (
    <TemplatesList
      templates={templates}
      events={events}
      onEdit={(id) => setEditingId(id)}
      onCreate={() => setEditingId("new")}
    />
  );
};

const TemplatesList: React.FC<{
  templates: WhatsappTemplate[];
  events: WhatsappEvent[];
  onEdit: (id: number) => void;
  onCreate: () => void;
}> = ({ templates, events, onEdit, onCreate }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const eventName = (key: string) =>
    events.find((e) => e.key === key)?.name ?? key;

  // Confirm-before-delete state, replaces native window.confirm()
  // for visual + accessibility consistency with the rest of the admin.
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  // Version-history dialog state. Holds the template the operator
  // clicked "History" on; null = dialog closed.
  const [historyFor, setHistoryFor] = useState<{
    id: number;
    name: string;
    isSystem: boolean;
  } | null>(null);

  const deleteTpl = useMutation({
    mutationFn: (id: number) => whatsappApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      showToast(__("Template deleted.", "yatra"), "success");
      setPendingDelete(null);
    },
    onError: (e: any) => {
      showToast(extractError(e), "error");
      setPendingDelete(null);
    },
  });

  const restoreDefaults = useMutation({
    mutationFn: () => whatsappApi.restoreDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      showToast(__("Default templates restored.", "yatra"), "success");
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  // First-install recovery — if no system templates exist (e.g. seed
  // didn't run because of a hook-order race) we surface a "Restore
  // default templates" button so the operator can recover without
  // dev intervention.
  const noSystemTemplates = templates.every((t) => !t.is_system);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {__("WhatsApp templates", "yatra")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {__(
              "System templates ship with the plugin — you can toggle them on/off but not edit or delete them. Add custom templates for any event you want.",
              "yatra",
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {noSystemTemplates && (
            <Button
              variant="outline"
              onClick={() => restoreDefaults.mutate()}
              disabled={restoreDefaults.isPending}
            >
              {restoreDefaults.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" />
              )}
              {__("Restore default templates", "yatra")}
            </Button>
          )}
          <Button onClick={onCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            {__("Add custom template", "yatra")}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {__("Name", "yatra")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {__("Event", "yatra")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {__("Recipient", "yatra")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {__("Type", "yatra")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {__("Status", "yatra")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {__("Actions", "yatra")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {templates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      {__(
                        "No templates yet — click Add custom template.",
                        "yatra",
                      )}
                    </td>
                  </tr>
                ) : (
                  templates.map((tpl) => (
                    <tr
                      key={tpl.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                          <FileText className="h-4 w-4 text-blue-500" />
                          {tpl.name}
                        </div>
                        {tpl.description && (
                          <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {tpl.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          <Zap className="w-3 h-3" />
                          {eventName(tpl.event_key)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            tpl.recipient_type === "admin"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }
                        >
                          {tpl.recipient_type === "admin"
                            ? __("Admin", "yatra")
                            : __("Customer", "yatra")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            tpl.is_system
                              ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }
                        >
                          {tpl.is_system
                            ? __("System", "yatra")
                            : __("Custom", "yatra")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            tpl.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                          }
                        >
                          {tpl.is_active
                            ? __("Active", "yatra")
                            : __("Disabled", "yatra")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(tpl.id)}
                          >
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            {__("Edit", "yatra")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setHistoryFor({
                                id: tpl.id,
                                name: tpl.name,
                                isSystem: tpl.is_system,
                              })
                            }
                            aria-label={__("Version history", "yatra")}
                            title={__("Version history", "yatra")}
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                          {!tpl.is_system && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                              onClick={() =>
                                setPendingDelete({ id: tpl.id, name: tpl.name })
                              }
                              disabled={deleteTpl.isPending}
                              aria-label={__("Delete template", "yatra")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <ConfirmationDialog
        isOpen={pendingDelete !== null}
        onClose={() => {
          if (!deleteTpl.isPending) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete) deleteTpl.mutate(pendingDelete.id);
        }}
        title={__("Delete template?", "yatra")}
        description={
          pendingDelete
            ? __(
                "Delete the “{name}” template? This cannot be undone, and any events bound to it will stop sending until you create a replacement.",
                "yatra",
              ).replace("{name}", pendingDelete.name)
            : ""
        }
        confirmText={__("Delete template", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={deleteTpl.isPending}
      />

      <TemplateHistoryDialog
        template={historyFor}
        onClose={() => setHistoryFor(null)}
      />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Template version-history dialog                                           */
/*                                                                            */
/*  Lists every prior snapshot of a template newest-first. Each row shows     */
/*  the version number, who edited, when, and a short summary of what they   */
/*  changed. Clicking a row expands its body so the operator can compare      */
/*  before/after at a glance. "Restore this version" rewrites the live row    */
/*  with the snapshot's fields (honoring the system-row immutability rule —   */
/*  for system templates only `is_active` restores).                          */
/* -------------------------------------------------------------------------- */

const TemplateHistoryDialog: React.FC<{
  template: { id: number; name: string; isSystem: boolean } | null;
  onClose: () => void;
}> = ({ template, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [pendingRestore, setPendingRestore] =
    useState<WhatsappTemplateVersion | null>(null);

  const enabled = template !== null;
  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-template-versions", template?.id],
    queryFn: () => whatsappApi.listTemplateVersions(template!.id),
    enabled,
  });

  const restore = useMutation({
    mutationFn: (versionId: number) =>
      whatsappApi.restoreTemplateVersion(template!.id, versionId),
    onSuccess: (r) => {
      showToast(r.message, "success");
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      void queryClient.invalidateQueries({
        queryKey: ["whatsapp-template-versions", template!.id],
      });
      setPendingRestore(null);
    },
    onError: (e: any) => {
      showToast(extractError(e), "error");
      setPendingRestore(null);
    },
  });

  if (!template) return null;
  const versions = data?.data ?? [];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={sprintf(
        /* translators: %s: template name */
        __("Version history — %s", "yatra"),
        template.name,
      )}
      size="xl"
    >
      <div className="space-y-3">
        {template.isSystem && (
          <Alert variant="info">
            {__(
              "Restoring a system template only resets its Active/Disabled toggle. Body, event binding, and recipient type are managed by the plugin and can't be reverted from history.",
              "yatra",
            )}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="w-10 h-10 text-gray-400 mx-auto" />
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {__(
                "No prior versions yet. Make an edit and history starts building from the next save.",
                "yatra",
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {versions.map((v) => {
              const isExpanded = expandedId === v.id;
              return (
                <div
                  key={v.id}
                  className="rounded-md border border-gray-200 dark:border-gray-700"
                >
                  <button
                    type="button"
                    className="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    onClick={() => setExpandedId(isExpanded ? null : v.id)}
                  >
                    <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mt-0.5">
                      v{v.version_number}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {v.change_summary || __("(no diff captured)", "yatra")}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {v.created_at}
                        {v.created_by !== null && (
                          <span>
                            {" · "}
                            {sprintf(
                              /* translators: %d: WP user id of the editor */
                              __("by user #%d", "yatra"),
                              v.created_by,
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 mt-1 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600 dark:text-gray-300">
                        <div>
                          <div className="font-medium text-gray-500">
                            {__("Name", "yatra")}
                          </div>
                          <div>{v.snapshot.name || "—"}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-500">
                            {__("Event", "yatra")}
                          </div>
                          <div className="font-mono">
                            {v.snapshot.event_key || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-500">
                            {__("Recipient", "yatra")}
                          </div>
                          <div>{v.snapshot.recipient_type || "—"}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-500">
                            {__("Active", "yatra")}
                          </div>
                          <div>
                            {v.snapshot.is_active
                              ? __("Yes", "yatra")
                              : __("No", "yatra")}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-500">
                          {__("Body", "yatra")}
                        </div>
                        <pre className="mt-1 whitespace-pre-wrap rounded bg-gray-50 dark:bg-gray-800/50 p-2 font-mono text-[11px] max-h-48 overflow-y-auto">
                          {v.snapshot.body || "—"}
                        </pre>
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPendingRestore(v)}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          {__("Restore this version", "yatra")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={pendingRestore !== null}
        onClose={() => {
          if (!restore.isPending) setPendingRestore(null);
        }}
        onConfirm={() => {
          if (pendingRestore) restore.mutate(pendingRestore.id);
        }}
        title={__("Restore this version?", "yatra")}
        description={
          pendingRestore
            ? sprintf(
                __(
                  "This rewrites the live template with v%d's contents. The current state is saved as a new version first so you can roll back this restore later.",
                  "yatra",
                ),
                pendingRestore.version_number,
              )
            : ""
        }
        confirmText={__("Restore version", "yatra")}
        cancelText={__("Cancel", "yatra")}
        isLoading={restore.isPending}
      />
    </Modal>
  );
};

const TemplateEditForm: React.FC<{
  existing: WhatsappTemplate | null;
  events: WhatsappEvent[];
  onClose: () => void;
}> = ({ existing, events, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isCreate = existing === null;
  const isSystem = !!existing?.is_system;

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [eventKey, setEventKey] = useState(existing?.event_key ?? "");
  const [recipient, setRecipient] = useState<"customer" | "admin">(
    existing?.recipient_type ?? "customer",
  );
  const [isActive, setIsActive] = useState(existing?.is_active ?? true);
  const [metaTemplateName, setMetaTemplateName] = useState(
    existing?.meta_template_name ?? "",
  );
  const [languageCode, setLanguageCode] = useState(
    existing?.language_code ?? "en_US",
  );
  const [body, setBody] = useState(existing?.body ?? "");
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  const bodyRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Variables list re-derived whenever the selected event changes —
  // each event declares its own variables array on the server.
  const selectedEvent = useMemo(
    () => events.find((e) => e.key === eventKey) ?? null,
    [events, eventKey],
  );
  const variables = selectedEvent?.variables ?? [];

  const save = useMutation({
    mutationFn: () => {
      // System rows accept ONLY is_active. Sending everything else
      // would be no-ops server-side but the smaller payload is
      // clearer in network logs and matches the locked-UI contract.
      const payload: Partial<WhatsappTemplate> = isSystem
        ? { is_active: isActive }
        : {
            name,
            description,
            event_key: eventKey,
            recipient_type: recipient,
            is_active: isActive,
            body,
            settings: {
              meta_template_name: metaTemplateName,
              language_code: languageCode,
            },
          };
      return isCreate
        ? whatsappApi.createTemplate(payload)
        : whatsappApi.updateTemplate(existing!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      showToast(
        isCreate
          ? __("Template created.", "yatra")
          : __("Template saved.", "yatra"),
        "success",
      );
      onClose();
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const copyVariable = (placeholder: string) => {
    try {
      navigator.clipboard?.writeText(placeholder);
      setCopiedVar(placeholder);
      setTimeout(() => setCopiedVar(null), 1500);
    } catch {
      /* silent */
    }
  };

  const insertVariable = (placeholder: string) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {__("Back to templates", "yatra")}
          </Button>
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
              <FileText className="h-5 w-5 text-blue-500" />
              {isCreate ? __("Add custom template", "yatra") : existing!.name}
              {isSystem && (
                <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {__("System", "yatra")}
                </Badge>
              )}
            </h2>
            {existing?.description && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {existing.description}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending || name.trim() === ""}
        >
          {save.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              {__("Saving…", "yatra")}
            </>
          ) : (
            <>
              <Save className="mr-1.5 h-4 w-4" />
              {isCreate
                ? __("Create template", "yatra")
                : __("Save changes", "yatra")}
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{__("Template details", "yatra")}</span>
                <label className="flex items-center gap-2 text-sm font-normal">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <Badge
                    className={
                      isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }
                  >
                    {isActive ? __("Active", "yatra") : __("Disabled", "yatra")}
                  </Badge>
                </label>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSystem && (
                <div className="rounded-md border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-700 dark:bg-blue-900/20">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <div className="text-xs text-blue-900 dark:text-blue-200">
                      {__(
                        "This is a system template. You can toggle it on or off but every other field is locked — that way plugin updates can safely refresh the copy. Create a custom template if you need different content for this event.",
                        "yatra",
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>{__("Template name", "yatra")}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={isSystem}
                  className={isSystem ? "bg-gray-50 dark:bg-gray-900/40" : ""}
                  placeholder={__("e.g. Welcome to your trip", "yatra")}
                />
              </div>

              <div className="space-y-2">
                <Label>{__("Description", "yatra")}</Label>
                <Input
                  value={description ?? ""}
                  onChange={(e) => setDescription(e.target.value)}
                  readOnly={isSystem}
                  className={isSystem ? "bg-gray-50 dark:bg-gray-900/40" : ""}
                  placeholder={__(
                    "Short description shown in the template list",
                    "yatra",
                  )}
                />
              </div>

              {/* Trigger Event — read-only chip for system, dropdown for custom */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {__("Trigger Event", "yatra")}
                </label>
                {isSystem ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        <Zap className="w-4 h-4" />
                        {selectedEvent?.name ?? eventKey}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {__("System templates can't change events", "yatra")}
                      </span>
                    </div>
                    {selectedEvent?.description && (
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <p className="text-sm text-indigo-800 dark:text-indigo-300">
                          {selectedEvent.description}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEventDropdown((v) => !v)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    >
                      {selectedEvent ? (
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedEvent.name}
                          </span>
                          <code className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                            {selectedEvent.key}
                          </code>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {__("Pick an event…", "yatra")}
                          </span>
                        </div>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          showEventDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {showEventDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                        <div className="py-1">
                          {events.map((event) => {
                            const active = event.key === eventKey;
                            return (
                              <button
                                key={event.key}
                                type="button"
                                onClick={() => {
                                  setEventKey(event.key);
                                  setShowEventDropdown(false);
                                }}
                                className={`w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                                  active
                                    ? "bg-indigo-50 dark:bg-indigo-900/20"
                                    : ""
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <Zap
                                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                      active ? "text-blue-500" : "text-gray-400"
                                    }`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-sm font-medium ${
                                          active
                                            ? "text-blue-800 dark:text-blue-400"
                                            : "text-gray-900 dark:text-white"
                                        }`}
                                      >
                                        {event.name}
                                      </span>
                                      <code className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                                        {event.key}
                                      </code>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                      {event.description}
                                    </p>
                                  </div>
                                  {active && (
                                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {selectedEvent && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                    {selectedEvent.description}
                  </p>
                )}
              </div>

              {/* Recipient type */}
              <div className="space-y-2">
                <Label>{__("Recipient", "yatra")}</Label>
                <div className="flex gap-2">
                  <label
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${
                      recipient === "customer"
                        ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600"
                    } ${isSystem ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="radio"
                      checked={recipient === "customer"}
                      onChange={() => !isSystem && setRecipient("customer")}
                      disabled={isSystem}
                    />
                    <UserCircle className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium">
                        {__("Customer", "yatra")}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {__("Sends to the booking customer", "yatra")}
                      </div>
                    </div>
                  </label>
                  <label
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${
                      recipient === "admin"
                        ? "border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20"
                        : "border-gray-300 dark:border-gray-600"
                    } ${isSystem ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="radio"
                      checked={recipient === "admin"}
                      onChange={() => !isSystem && setRecipient("admin")}
                      disabled={isSystem}
                    />
                    <UserCircle className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="text-sm font-medium">
                        {__("Admin", "yatra")}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {__(
                          "Sends to the admin phone in Delivery settings",
                          "yatra",
                        )}
                      </div>
                    </div>
                  </label>
                </div>
                {isSystem && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {__(
                      "System templates can't change recipient type.",
                      "yatra",
                    )}
                  </p>
                )}
              </div>

              {/* Meta provider settings */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{__("Meta template name", "yatra")}</Label>
                  <Input
                    value={metaTemplateName}
                    onChange={(e) => setMetaTemplateName(e.target.value)}
                    readOnly={isSystem}
                    className={isSystem ? "bg-gray-50 dark:bg-gray-900/40" : ""}
                    placeholder="yatra_booking_confirmed"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{__("Language code", "yatra")}</Label>
                  <Input
                    value={languageCode}
                    onChange={(e) => setLanguageCode(e.target.value)}
                    readOnly={isSystem}
                    className={isSystem ? "bg-gray-50 dark:bg-gray-900/40" : ""}
                    placeholder="en_US"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {__("Message body", "yatra")}
                </label>
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  readOnly={isSystem}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm text-gray-900 dark:text-white ${
                    isSystem
                      ? "bg-gray-50 dark:bg-gray-900/40"
                      : "bg-white dark:bg-gray-800"
                  }`}
                  placeholder={__(
                    "Use {{variable}} syntax — variables come from the trigger event.",
                    "yatra",
                  )}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isSystem
                    ? __(
                        "System template body is locked. Create a custom template to author your own copy for this event.",
                        "yatra",
                      )
                    : __(
                        "Click a variable on the right to copy, double-click to insert at the cursor.",
                        "yatra",
                      )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Variables sidebar — filtered by selected event */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-500" />
                {__("Available Variables", "yatra")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedEvent ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {__(
                    "Pick a Trigger Event above to see the variables you can use here.",
                    "yatra",
                  )}
                </p>
              ) : variables.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {__("This event has no variables.", "yatra")}
                </p>
              ) : (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {__(
                      "Click to copy, double-click to insert at cursor",
                      "yatra",
                    )}
                  </p>
                  <div className="space-y-1">
                    {variables.map((v) => {
                      const placeholder = `{{${v.key}}}`;
                      return (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => copyVariable(placeholder)}
                          onDoubleClick={() => insertVariable(placeholder)}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <code className="text-xs text-blue-600 dark:text-blue-400">
                              {placeholder}
                            </code>
                            {copiedVar === placeholder ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                            )}
                          </div>
                          {v.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {v.description}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {!isCreate && (
            <TemplateTestSendCard
              templateId={existing!.id}
              recipient={recipient}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const TemplateTestSendCard: React.FC<{
  templateId: number;
  recipient: "customer" | "admin";
}> = ({ templateId, recipient }) => {
  const { showToast } = useToast();
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
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
        phone: phone.trim(),
      });
      setResult({
        ok: res.ok,
        message: res.ok
          ? __("Sent — check your WhatsApp.", "yatra") +
            (res.provider_message_id ? ` (id: ${res.provider_message_id})` : "")
          : res.error || __("Send failed.", "yatra"),
      });
    } catch (e: any) {
      setResult({ ok: false, message: extractError(e) });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-500" />
          {__("Send test message", "yatra")}
        </CardTitle>
        <CardDescription>
          {recipient === "admin"
            ? __(
                "Admin-recipient templates send to the admin phone in Delivery settings.",
                "yatra",
              )
            : __("Sends this template to the phone you enter below.", "yatra")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recipient === "customer" && (
          <div className="space-y-2">
            <Label>{__("Phone (E.164)", "yatra")}</Label>
            <Input
              value={phone}
              placeholder="+9779800000000"
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        )}
        <Button onClick={run} disabled={sending} className="w-full">
          {sending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-1.5 h-4 w-4" />
          )}
          {__("Send test", "yatra")}
        </Button>
        {result && (
          <div
            className={`flex items-start gap-2 rounded-md p-3 text-sm ${
              result.ok
                ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"
            }`}
          >
            {result.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4" />
            )}
            <span>{result.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/*  Frontend widget settings                                                  */
/* -------------------------------------------------------------------------- */

/**
 * "Frontend widget" tab — configures the public-facing click-to-
 * WhatsApp affordances rendered by `Services/Widget.php`:
 *   - Floating button (wp_footer)
 *   - Single-trip sidebar CTA
 *   - `[yatra_whatsapp_button]` shortcode
 *
 * The widget uses wa.me deep linking (free) — no Cloud API call on
 * tap, so this tab is independent of the credentials in Delivery.
 */
const WidgetSection: React.FC<{
  settings: WhatsappSettings;
  onSave: (patch: Partial<WhatsappSettings>) => void;
  saving: boolean;
}> = ({ settings, onSave, saving }) => {
  const w: WhatsappWidgetSettings = settings.widget;
  const [enabled, setEnabled] = useState(w.enabled);
  const [contactPhone, setContactPhone] = useState(w.contact_phone);
  const [prefilled, setPrefilled] = useState(w.prefilled_message);
  const [displayOn, setDisplayOn] = useState<"all" | "trips_only">(
    w.display_on,
  );
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">(
    w.position,
  );
  const [label, setLabel] = useState(w.label);
  const [showOnSidebar, setShowOnSidebar] = useState(w.show_on_trip_sidebar);

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
    w.show_on_trip_sidebar,
  ]);

  const dirty =
    enabled !== w.enabled ||
    contactPhone !== w.contact_phone ||
    prefilled !== w.prefilled_message ||
    displayOn !== w.display_on ||
    position !== w.position ||
    label !== w.label ||
    showOnSidebar !== w.show_on_trip_sidebar;

  const save = () =>
    onSave({
      widget: {
        enabled,
        contact_phone: contactPhone,
        prefilled_message: prefilled,
        display_on: displayOn,
        position,
        label,
        show_on_trip_sidebar: showOnSidebar,
      },
    });

  // Live preview of the wa.me URL the button will open against.
  const previewUrl = useMemo(() => {
    const digits = contactPhone.replace(/[^0-9]/g, "");
    const msg = prefilled.replace(/\{\{trip_name\}\}/g, "Demo Trip");
    return digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
      : "";
  }, [contactPhone, prefilled]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            {__("Public WhatsApp widget", "yatra")}
          </CardTitle>
          <CardDescription>
            {__(
              'Adds a "Chat on WhatsApp" affordance to your public site. Free for the operator — uses wa.me deep linking, no per-tap charges. Independent of the Cloud API credentials you configured under Delivery.',
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Master toggle */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {__("Enable widget", "yatra")}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {__(
                  "Off by default. When on, renders per the display rules below.",
                  "yatra",
                )}
              </div>
            </div>
          </label>

          {/* Contact phone */}
          <div className="space-y-2">
            <Label>{__("Contact phone (E.164)", "yatra")}</Label>
            <Input
              value={contactPhone}
              placeholder="+9779800000000"
              onChange={(e) => setContactPhone(e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {__(
                "Visitors land on a chat with THIS number. Can be any WhatsApp-enabled phone — doesn't have to be the Cloud-API phone you use for outbound automation.",
                "yatra",
              )}
            </p>
          </div>

          {/* Prefilled message */}
          <div className="space-y-2">
            <Label>{__("Pre-filled message", "yatra")}</Label>
            <textarea
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              rows={3}
              value={prefilled}
              onChange={(e) => setPrefilled(e.target.value)}
              placeholder={__(
                "Hi! I'd like to know more about {{trip_name}}.",
                "yatra",
              )}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {__(
                "Use {{trip_name}} to insert the current trip's name when the widget renders on a single-trip page. Replaced with the actual title at render time.",
                "yatra",
              )}
            </p>
          </div>

          {/* Display rules */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{__("Show on", "yatra")}</Label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={displayOn === "trips_only"}
                    onChange={() => setDisplayOn("trips_only")}
                  />
                  {__("Single trip pages only", "yatra")}
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={displayOn === "all"}
                    onChange={() => setDisplayOn("all")}
                  />
                  {__("Every frontend page", "yatra")}
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{__("Position", "yatra")}</Label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={position === "bottom-right"}
                    onChange={() => setPosition("bottom-right")}
                  />
                  {__("Bottom right", "yatra")}
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={position === "bottom-left"}
                    onChange={() => setPosition("bottom-left")}
                  />
                  {__("Bottom left", "yatra")}
                </label>
              </div>
            </div>
          </div>

          {/* Label + trip-sidebar CTA */}
          <div className="space-y-2">
            <Label>{__("Button label", "yatra")}</Label>
            <Input
              value={label}
              placeholder={__("Chat on WhatsApp", "yatra")}
              onChange={(e) => setLabel(e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {__("Leave blank to show only the WhatsApp icon.", "yatra")}
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnSidebar}
              onChange={(e) => setShowOnSidebar(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {__(
                  "Also show a full-width CTA in the single-trip sidebar",
                  "yatra",
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {__(
                  'Renders an "Ask about this trip on WhatsApp" button next to the booking form, separate from the floating button.',
                  "yatra",
                )}
              </div>
            </div>
          </label>

          {/* Preview + shortcode hint */}
          {previewUrl && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/40">
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                {__("Preview URL the button will open", "yatra")}
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 break-all hover:underline dark:text-blue-400"
              >
                {previewUrl}
              </a>
            </div>
          )}

          <div className="rounded-md border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-700 dark:bg-blue-900/20">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="text-xs text-blue-900 dark:text-blue-200">
                {__(
                  'Drop the button anywhere using the shortcode [yatra_whatsapp_button label="Chat with us"]. Supports label, message, and trip_name attributes.',
                  "yatra",
                )}
              </div>
            </div>
          </div>
        </CardContent>
        {dirty && (
          <CardFooter className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-700/50">
            <Button onClick={save} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  {__("Saving…", "yatra")}
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-4 w-4" />
                  {__("Save widget settings", "yatra")}
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Logs                                                                      */
/* -------------------------------------------------------------------------- */

const LogsList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [phoneFilter, setPhoneFilter] = useState<string>("");
  // Debounced phone filter so we don't re-query on every keystroke.
  const [phoneFilterApplied, setPhoneFilterApplied] = useState<string>("");
  const perPage = 20;

  React.useEffect(() => {
    const t = window.setTimeout(
      () => setPhoneFilterApplied(phoneFilter.trim()),
      350,
    );
    return () => window.clearTimeout(t);
  }, [phoneFilter]);

  // Reset to page 1 whenever a filter changes.
  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, phoneFilterApplied]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "whatsapp-messages",
      page,
      perPage,
      statusFilter,
      phoneFilterApplied,
    ],
    queryFn: () =>
      whatsappApi.listMessages({
        page,
        per_page: perPage,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(phoneFilterApplied ? { phone: phoneFilterApplied } : {}),
      }),
    refetchInterval: 15000,
    placeholderData: (prev) => prev, // smoother pagination — keep last page visible while loading
  });

  const rows = data?.data ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const hasFilters = !!(statusFilter || phoneFilter);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          {__("Message logs", "yatra")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {__(
            "Every outbound send and inbound reply, filterable by status or phone. Updated every 15 seconds.",
            "yatra",
          )}
        </p>
      </div>

      {/* Canonical Yatra filter row — same pattern as Discounts / Bookings */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                placeholder={__("Search by phone…", "yatra")}
                aria-label={__("Search by phone", "yatra")}
                className="w-full"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label={__("Filter by status", "yatra")}
              className="w-full lg:w-48 lg:flex-none"
            >
              <option value="">{__("All statuses", "yatra")}</option>
              <option value="queued">{__("Queued", "yatra")}</option>
              <option value="sent">{__("Sent", "yatra")}</option>
              <option value="delivered">{__("Delivered", "yatra")}</option>
              <option value="read">{__("Read", "yatra")}</option>
              <option value="failed">{__("Failed", "yatra")}</option>
              <option value="received">
                {__("Received (inbound)", "yatra")}
              </option>
            </Select>
            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStatusFilter("");
                  setPhoneFilter("");
                }}
                className="w-full lg:w-auto"
              >
                {__("Reset", "yatra")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {totalItems === 0 && !statusFilter && !phoneFilterApplied
                ? __("No messages sent yet.", "yatra")
                : __("No messages match your filters.", "yatra")}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead className="w-28">
                    {__("Direction", "yatra")}
                  </TableHead>
                  <TableHead className="w-44">{__("Phone", "yatra")}</TableHead>
                  <TableHead>{__("Body / Error", "yatra")}</TableHead>
                  <TableHead className="w-48">
                    {__("Template", "yatra")}
                  </TableHead>
                  <TableHead className="w-28">
                    {__("Status", "yatra")}
                  </TableHead>
                  <TableHead className="w-44 whitespace-nowrap">
                    {__("Sent", "yatra")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Badge
                        className={
                          row.direction === "inbound"
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }
                      >
                        {row.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-gray-900 dark:text-white whitespace-nowrap">
                      {row.phone}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-200">
                      <div
                        className="max-w-md truncate"
                        title={row.error_message || row.body || ""}
                      >
                        {row.error_message || row.body || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">
                      <span
                        className="truncate block max-w-[12rem]"
                        title={row.template_key || ""}
                      >
                        {row.template_key || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          row.status === "sent" ||
                          row.status === "delivered" ||
                          row.status === "read"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : row.status === "failed"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {rows.length > 0 && totalPages > 1 && (
            <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={perPage}
                onPageChange={setPage}
                itemName={__("messages", "yatra")}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Opt-ins                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * GDPR audit view — every phone number that has opted in (or been
 * explicitly opted out via inbound STOP keyword). Read-only here;
 * mutations happen via the booking form (in) and inbound webhook (out).
 *
 * Exports to CSV for data-portability requests.
 */
const OptInsList: React.FC = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-opt-ins"],
    queryFn: () => whatsappApi.listOptIns(),
    staleTime: 30 * 1000,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rows = data?.data ?? [];

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "in" && !r.opted_in) return false;
      if (filter === "out" && r.opted_in) return false;
      if (search.trim() !== "") {
        const needle = search.trim().toLowerCase();
        if (
          !r.phone.toLowerCase().includes(needle) &&
          !r.source.toLowerCase().includes(needle)
        )
          return false;
      }
      return true;
    });
  }, [rows, filter, search]);

  const inCount = useMemo(() => rows.filter((r) => r.opted_in).length, [rows]);
  const outCount = rows.length - inCount;

  const exportCsv = () => {
    // Build CSV client-side to avoid a server round-trip. RFC 4180:
    // quote every field, double-quote escapes embedded quotes, CRLF line endings.
    const escape = (v: string) => '"' + v.replace(/"/g, '""') + '"';
    const lines = [
      ["phone", "opted_in", "source", "updated_at"].map(escape).join(","),
      ...filtered.map((r) =>
        [r.phone, r.opted_in ? "yes" : "no", r.source, r.updated_at]
          .map((v) => escape(String(v ?? "")))
          .join(","),
      ),
    ];
    const csv = lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp-opt-ins-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            {__("Opt-in audit", "yatra")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {__(
              "Every phone number that's opted into WhatsApp messaging, plus those that opted out via inbound STOP keyword. Export this list for GDPR / privacy requests.",
              "yatra",
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={exportCsv}
          disabled={filtered.length === 0}
        >
          <ExternalLink className="mr-1.5 h-4 w-4" />
          {__("Export CSV", "yatra")}
        </Button>
      </div>

      {/* Canonical Yatra filter row */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={__("Search by phone or source…", "yatra")}
                aria-label={__("Search opt-ins", "yatra")}
                className="w-full"
              />
            </div>
            <Select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as "all" | "in" | "out")
              }
              aria-label={__("Filter opt-in status", "yatra")}
              className="w-full lg:w-56 lg:flex-none"
            >
              <option value="all">
                {__("All", "yatra")} ({rows.length})
              </option>
              <option value="in">
                {__("Opted in", "yatra")} ({inCount})
              </option>
              <option value="out">
                {__("Opted out", "yatra")} ({outCount})
              </option>
            </Select>
            {(search || filter !== "all") && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="w-full lg:w-auto"
              >
                {__("Reset", "yatra")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {rows.length === 0
                ? __(
                    "No opt-in records yet. Records appear here when customers tick the WhatsApp opt-in on a booking form, or reply STOP to opt out.",
                    "yatra",
                  )
                : __("No records match your search.", "yatra")}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead className="w-44">{__("Phone", "yatra")}</TableHead>
                  <TableHead className="w-32">
                    {__("Status", "yatra")}
                  </TableHead>
                  <TableHead>{__("Source", "yatra")}</TableHead>
                  <TableHead className="w-44 whitespace-nowrap">
                    {__("Updated", "yatra")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.phone}>
                    <TableCell className="font-mono text-gray-900 dark:text-white whitespace-nowrap">
                      {row.phone}
                    </TableCell>
                    <TableCell>
                      {row.opted_in ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {__("Opted in", "yatra")}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          <XCircle className="mr-1 h-3 w-3" />
                          {__("Opted out", "yatra")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">
                      {row.source || "—"}
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {row.updated_at}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

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

export default Whatsapp;
