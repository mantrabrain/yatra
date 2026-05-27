import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Webhook,
  Plus,
  Trash2,
  Pencil,
  Send,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  RotateCcw,
  ShieldCheck,
  Crown,
  Clock,
  Zap,
  ChevronDown,
  Filter,
} from "lucide-react";
import { __, sprintf } from "../lib/i18n";
import { PageHeader } from "../components/common/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Modal } from "../components/ui/modal";
import { ModulePageSkeleton } from "../components/ui/module-skeleton";
import { Switch } from "../components/ui/switch";
import { Tooltip } from "../components/ui/tooltip";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { Pagination } from "../components/shared/Pagination";
import { useToast } from "../components/ui/toast";
import { Table as SharedTable } from "../components/shared/Table";
import {
  webhooksApi,
  type ListenStatus,
  type WebhookDeliveryRow,
  type WebhookEndpoint,
  type WebhookEndpointWriteInput,
  type WebhookEvent,
  type WebhooksMeta,
} from "../api/webhooks-api";

/**
 * Yatra → Webhooks — Agency-tier outbound integration hub.
 *
 * Two tabs:
 *   1. Endpoints — CRUD against `wp_yatra_webhook_endpoints`
 *   2. Deliveries — paginated audit log with full payload inspection
 *                   (the "listen mode" view)
 *
 * Critical UX patterns:
 *   - The signing secret is shown ONCE on create + regenerate, in a
 *     copy-only modal. Subsequent reads only see the last-4 hint.
 *     Mirrors Stripe / GitHub / WP REST best practice.
 *   - HTTPS-only is enforced server-side (WP_DEBUG allows HTTP for
 *     local dev). The form labels this clearly.
 *   - Auto-disabled endpoints (after 10 permanent failures) show a
 *     red banner with a re-enable affordance.
 *
 * White-label-safe: no product names in user-facing copy; textdomain
 * `yatra` for translation parity with the rest of the admin React.
 */
/* -------------------------------------------------------------------------- */
/*  Shared key/value editor — used for both custom HTTP headers AND the       */
/*  additional payload fields editor on the endpoint form.                    */
/* -------------------------------------------------------------------------- */

interface KvRow {
  key: string;
  value: string;
}

/** Object → list of rows. Stable order = insertion order (Object.entries). */
function objectToRows(obj: Record<string, string>): KvRow[] {
  return Object.entries(obj || {}).map(([k, v]) => ({ key: k, value: v }));
}

/** Rows → object. Blank rows skipped; later rows clobber earlier ones with
 *  the same key (server-side validation rejects truly invalid keys). */
function rowsToObject(rows: KvRow[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rows) {
    const k = r.key.trim();
    const v = r.value;
    if (k === "") continue;
    out[k] = v;
  }
  return out;
}

const KeyValueEditor: React.FC<{
  rows: KvRow[];
  onChange: (rows: KvRow[]) => void;
  keyPlaceholder: string;
  valuePlaceholder: string;
  /** Used to namespace input id attributes for a11y. */
  idPrefix: string;
}> = ({ rows, onChange, keyPlaceholder, valuePlaceholder, idPrefix }) => {
  const setRow = (idx: number, patch: Partial<KvRow>) => {
    const next = rows.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const removeRow = (idx: number) => {
    onChange(rows.filter((_, i) => i !== idx));
  };
  const addRow = () => onChange([...rows, { key: "", value: "" }]);

  return (
    <div className="space-y-2">
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {__("None configured.", "yatra")}
        </p>
      ) : (
        rows.map((row, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <Input
              id={`${idPrefix}-key-${idx}`}
              aria-label={keyPlaceholder}
              value={row.key}
              onChange={(e) => setRow(idx, { key: e.target.value })}
              placeholder={keyPlaceholder}
              className="font-mono text-sm flex-1"
            />
            <Input
              id={`${idPrefix}-value-${idx}`}
              aria-label={valuePlaceholder}
              value={row.value}
              onChange={(e) => setRow(idx, { value: e.target.value })}
              placeholder={valuePlaceholder}
              className="font-mono text-sm flex-[2]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeRow(idx)}
              aria-label={__("Remove row", "yatra")}
              className="flex-shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))
      )}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {__("Add row", "yatra")}
      </Button>
    </div>
  );
};

type WebhookTab = "endpoints" | "deliveries" | "buried";

function getInitialTab(): WebhookTab {
  if (typeof window === "undefined") return "endpoints";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab === "deliveries" || tab === "logs") return "deliveries";
  if (tab === "buried" || tab === "dead-letter" || tab === "dlq")
    return "buried";
  return "endpoints";
}

const Webhooks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WebhookTab>(() => getInitialTab());

  const switchTab = (next: WebhookTab) => {
    setActiveTab(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const { data: meta, isLoading: metaLoading } = useQuery({
    queryKey: ["webhooks-meta"],
    queryFn: () => webhooksApi.getMeta(),
  });

  if (metaLoading) {
    return <ModulePageSkeleton variant="tabs" />;
  }
  if (!meta) return null;

  // Hard tier gate — Agency-only.
  if (!meta.is_agency_active) {
    return (
      <div className="space-y-6">
        <PageHeader
          description={__(
            "Push every Yatra event to your CRM, accounting tool, Zapier, Make, Slack, or any HTTPS endpoint.",
            "yatra",
          )}
        />
        <UpgradeCard meta={meta} />
      </div>
    );
  }

  if (!meta.is_module_enabled) {
    return (
      <div className="space-y-6">
        <PageHeader
          description={__(
            "Push every Yatra event to your CRM, accounting tool, Zapier, Make, Slack, or any HTTPS endpoint.",
            "yatra",
          )}
        />
        <ModulePrompt />
      </div>
    );
  }

  const tabs: Array<{ key: WebhookTab; label: string; icon: any }> = [
    { key: "endpoints", label: __("Endpoints", "yatra"), icon: Webhook },
    { key: "deliveries", label: __("Deliveries", "yatra"), icon: Clock },
    // "Buried" surfaces every delivery that exhausted retries +
    // landed in permanent_failure. Bulk-replay lives here so operators
    // triage from the summary instead of paging through deliveries.
    { key: "buried", label: __("Buried", "yatra"), icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        description={__(
          "HMAC-signed outbound events. HTTPS endpoints only, encrypted secrets, automatic retry with exponential backoff, full delivery log with payload inspection + replay.",
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
          {activeTab === "endpoints" && <EndpointsTab />}
          {activeTab === "deliveries" && <DeliveriesTab />}
          {activeTab === "buried" && <BuriedTab />}
        </CardContent>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Upgrade / module-disabled cards                                           */
/* -------------------------------------------------------------------------- */

const UpgradeCard: React.FC<{ meta: WebhooksMeta }> = ({ meta }) => (
  <Card className="max-w-3xl">
    <CardHeader>
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
          <Crown className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <CardTitle>{__("Webhooks", "yatra")}</CardTitle>
          <CardDescription className="mt-1">
            {__(
              "Available on the Scale plan. The integration backbone for agencies wiring Yatra into a custom tech stack — sync bookings to CRMs, post revenue events to accounting tools, trigger Zapier workflows, ping Slack on VIP bookings.",
              "yatra",
            )}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[
          [
            __("Encrypted per-endpoint secrets", "yatra"),
            __("Libsodium-backed at-rest encryption.", "yatra"),
          ],
          [
            __("HMAC-SHA256 signed payloads", "yatra"),
            __("Stripe-style signature header.", "yatra"),
          ],
          [
            __("Automatic retry with backoff", "yatra"),
            __("5 attempts with jittered exponential delay.", "yatra"),
          ],
          [
            __("Full delivery log + replay", "yatra"),
            __("Every payload preserved for 90 days.", "yatra"),
          ],
        ].map(([title, sub]) => (
          <div
            key={title}
            className="rounded-md border border-gray-200 dark:border-gray-700 p-3"
          >
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {sub}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <Button asChild>
          <a href={meta.upgrade_url} target="_blank" rel="noopener noreferrer">
            {__("Upgrade to Scale", "yatra")}
            <ExternalLink className="ml-1.5 h-4 w-4" />
          </a>
        </Button>
        {meta.docs_url && (
          <Button variant="outline" asChild>
            <a href={meta.docs_url} target="_blank" rel="noopener noreferrer">
              {__("Read the docs", "yatra")}
            </a>
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

const ModulePrompt: React.FC = () => (
  <Card className="max-w-3xl">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Webhook className="h-5 w-5 text-blue-500" />
        {__("Enable the Webhooks module", "yatra")}
      </CardTitle>
      <CardDescription>
        {__(
          'Toggle "Webhooks" on under Yatra → Modules to start configuring endpoints.',
          "yatra",
        )}
      </CardDescription>
    </CardHeader>
  </Card>
);

/* -------------------------------------------------------------------------- */
/*  Endpoints tab                                                             */
/* -------------------------------------------------------------------------- */

const EndpointsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<WebhookEndpoint | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WebhookEndpoint | null>(
    null,
  );
  // The plaintext secret only ever lives in memory — we show it once
  // in a copy-only modal then drop it. Stripe-style.
  const [revealSecret, setRevealSecret] = useState<{
    secret: string;
    endpointName: string;
  } | null>(null);
  // After a Ping, open the delivery inspector immediately — operators
  // shouldn't have to tab-switch to find out whether the test worked.
  const [pingInspectId, setPingInspectId] = useState<number | null>(null);
  // mTLS client-cert dialog state. Holds the endpoint we're editing
  // the cert for; null = dialog closed.
  const [mtlsEndpoint, setMtlsEndpoint] = useState<WebhookEndpoint | null>(
    null,
  );

  const { data: endpointsData, isLoading } = useQuery({
    queryKey: ["webhooks-endpoints"],
    queryFn: () => webhooksApi.listEndpoints(),
  });
  const { data: eventsData } = useQuery({
    queryKey: ["webhooks-events"],
    queryFn: () => webhooksApi.listEvents(),
  });

  const deleteEndpoint = useMutation({
    mutationFn: (id: number) => webhooksApi.deleteEndpoint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-endpoints"] });
      showToast(__("Endpoint deleted.", "yatra"), "success");
      setPendingDelete(null);
    },
    onError: (e: any) => {
      showToast(extractError(e), "error");
      setPendingDelete(null);
    },
  });

  const pingEndpoint = useMutation({
    mutationFn: (id: number) => webhooksApi.pingEndpoint(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-deliveries"] });
      // Pop the inspector for the new row so the operator sees the
      // dispatch progress in real time. The inspector itself polls
      // until the row reaches a terminal status.
      setPingInspectId(res.row_id);
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const regenerateSecret = useMutation({
    mutationFn: (id: number) => webhooksApi.regenerateSecret(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-endpoints"] });
      const endpoint = endpointsData?.data.find((e) => e.id === id);
      setRevealSecret({
        secret: res.secret,
        endpointName: endpoint?.name || __("this endpoint", "yatra"),
      });
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  if (editing !== null) {
    return (
      <EndpointEditForm
        existing={editing === "new" ? null : editing}
        events={eventsData?.data ?? []}
        onClose={() => setEditing(null)}
        onCreated={(secret, name) => {
          setEditing(null);
          setRevealSecret({ secret, endpointName: name });
        }}
      />
    );
  }

  const endpoints = endpointsData?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="max-w-2xl">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {__("HTTP endpoints", "yatra")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {__(
              "Each endpoint receives a signed POST when one of its subscribed events fires. The signing secret is shown once on create — store it in your receiver's config.",
              "yatra",
            )}
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="mr-1.5 h-4 w-4" />
          {__("Add endpoint", "yatra")}
        </Button>
      </div>

      {/* Canonical Yatra table — same shell as Activities / Destinations.
       *  Name is a clickable link that opens the edit view; secondary
       *  actions live in the per-row 3-dot menu. SharedTable handles
       *  loading / empty / error states for us. */}
      <Card className="overflow-visible">
        <CardContent className="p-0 overflow-visible">
          <SharedTable
            data={endpoints}
            columns={[
              {
                key: "name",
                label: __("Endpoint", "yatra"),
                render: (ep: WebhookEndpoint) => (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <Webhook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setEditing(ep)}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer text-left"
                      >
                        {ep.name}
                      </button>
                      <div
                        className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-md"
                        title={ep.url}
                      >
                        {ep.url}
                      </div>
                      {ep.consecutive_failures >= 5 && (
                        <div className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3" />
                          {ep.consecutive_failures}{" "}
                          {__("consecutive failures", "yatra")}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: "status",
                label: __("Status", "yatra"),
                render: (ep: WebhookEndpoint) =>
                  ep.is_active ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {__("Active", "yatra")}
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      <XCircle className="mr-1 h-3 w-3" />
                      {__("Inactive", "yatra")}
                    </Badge>
                  ),
              },
              {
                key: "event",
                label: __("Event", "yatra"),
                render: (ep: WebhookEndpoint) => (
                  <>
                    {ep.event ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        <Zap className="h-3 w-3" />
                        <code className="font-mono">{ep.event}</code>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                    {ep.selected_fields && ep.selected_fields.length > 0 && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                        <Filter className="h-3 w-3" />
                        {ep.selected_fields.length} {__("fields", "yatra")}
                      </div>
                    )}
                    {!ep.log_deliveries && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                        {__("Logging off", "yatra")}
                      </div>
                    )}
                  </>
                ),
              },
              {
                key: "health",
                label: __("Health", "yatra"),
                render: (ep: WebhookEndpoint) => (
                  <HealthCell health={ep.health} />
                ),
              },
              {
                key: "last_delivered_at",
                label: __("Last delivery", "yatra"),
                render: (ep: WebhookEndpoint) =>
                  ep.last_delivered_at ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      <div>
                        {new Date(ep.last_delivered_at).toLocaleString()}
                      </div>
                      <div className="mt-0.5">{ep.last_status || "—"}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  ),
              },
            ]}
            actions={[
              {
                key: "edit",
                label: __("Edit", "yatra"),
                icon: <Pencil className="w-4 h-4" />,
                onClick: (ep: WebhookEndpoint) => setEditing(ep),
              },
              {
                key: "ping",
                label: __("Send test ping", "yatra"),
                icon: <Send className="w-4 h-4" />,
                onClick: (ep: WebhookEndpoint) => pingEndpoint.mutate(ep.id),
                condition: (ep: WebhookEndpoint) => ep.is_active,
              },
              {
                key: "regenerate",
                label: __("Regenerate signing secret", "yatra"),
                icon: <RefreshCw className="w-4 h-4" />,
                onClick: (ep: WebhookEndpoint) =>
                  regenerateSecret.mutate(ep.id),
              },
              {
                key: "mtls",
                label: __("Client certificate (mTLS)", "yatra"),
                icon: <ShieldCheck className="w-4 h-4" />,
                onClick: (ep: WebhookEndpoint) => setMtlsEndpoint(ep),
              },
              {
                key: "delete",
                label: __("Delete endpoint", "yatra"),
                icon: <Trash2 className="w-4 h-4" />,
                onClick: (ep: WebhookEndpoint) => setPendingDelete(ep),
                variant: "destructive",
              },
            ]}
            isLoading={isLoading}
            emptyText={__("No endpoints configured yet", "yatra")}
            emptyDescription={__(
              "Add your first endpoint to start receiving events. Common targets: Zapier catch hooks, Make scenarios, internal CRM ingest URLs, Slack webhook URLs.",
              "yatra",
            )}
            onCreateClick={() => setEditing("new")}
          />
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={pendingDelete !== null}
        onClose={() => {
          if (!deleteEndpoint.isPending) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete) deleteEndpoint.mutate(pendingDelete.id);
        }}
        title={__("Delete endpoint?", "yatra")}
        description={
          pendingDelete
            ? __(
                'Delete "{name}"? Its delivery log will also be removed. This cannot be undone.',
                "yatra",
              ).replace("{name}", pendingDelete.name)
            : ""
        }
        confirmText={__("Delete endpoint", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={deleteEndpoint.isPending}
      />

      <SecretRevealDialog
        secret={revealSecret?.secret ?? null}
        endpointName={revealSecret?.endpointName ?? ""}
        onClose={() => setRevealSecret(null)}
      />

      {/* Live ping inspector — polls until the row reaches a terminal
       *  status so the operator sees the test result without leaving
       *  the Endpoints tab. */}
      {pingInspectId !== null && (
        <DeliveryInspectDialog
          id={pingInspectId}
          onClose={() => setPingInspectId(null)}
        />
      )}

      <MtlsDialog
        endpoint={mtlsEndpoint}
        onClose={() => setMtlsEndpoint(null)}
      />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Client-side mirror of PayloadFilter::apply() — used by the "Output        */
/*  preview" panel so operators can see EXACTLY what their receiver will get  */
/*  before saving. Behavior MUST stay in lockstep with the PHP service:       */
/*    - envelope keys (id/type/api_version/occurred_at) are always preserved  */
/*    - data block is filtered to selected dot-paths                          */
/*    - picking a parent path ships the entire subtree                        */
/*    - empty selection OR ["*"] = send everything                            */
/* -------------------------------------------------------------------------- */

const ENVELOPE_KEYS = ["id", "type", "api_version", "occurred_at"] as const;

function applyFieldFilter(
  payload: Record<string, unknown> | null,
  selected: string[],
): Record<string, unknown> | null {
  if (payload === null) return null;
  // No filter / wildcard → return as-is.
  if (selected.length === 0 || selected.includes("*")) return payload;

  // Normalize paths: strip leading "data." so paths are always
  // relative to the data block, same as the server.
  const paths = Array.from(
    new Set(
      selected
        .map((p) => p.trim())
        .filter((p) => p !== "")
        .map((p) => (p.startsWith("data.") ? p.slice(5) : p))
        .filter((p) => p !== ""),
    ),
  );

  const out: Record<string, unknown> = {};
  // Envelope always copies through.
  for (const k of ENVELOPE_KEYS) {
    if (k in payload) out[k] = payload[k];
  }

  const data = payload.data;
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    out.data = data;
    return out;
  }

  const filteredData: Record<string, unknown> = {};
  for (const path of paths) {
    extractInto(
      data as Record<string, unknown>,
      path.split("."),
      0,
      filteredData,
    );
  }
  out.data = filteredData;
  return out;
}

function extractInto(
  tree: Record<string, unknown>,
  parts: string[],
  depth: number,
  out: Record<string, unknown>,
): void {
  if (depth >= parts.length) return;
  const key = parts[depth];
  if (!(key in tree)) return;

  const isLeaf = depth === parts.length - 1;
  if (isLeaf) {
    out[key] = tree[key];
    return;
  }

  const child = tree[key];
  if (typeof child !== "object" || child === null || Array.isArray(child)) {
    // Path goes deeper but tree has a scalar/array here — bail out.
    return;
  }
  let nested = out[key];
  if (typeof nested !== "object" || nested === null || Array.isArray(nested)) {
    nested = {};
    out[key] = nested;
  }
  extractInto(
    child as Record<string, unknown>,
    parts,
    depth + 1,
    nested as Record<string, unknown>,
  );
}

/* -------------------------------------------------------------------------- */
/*  Endpoint health snapshot — colored success-rate badge + delivered/failed  */
/*  ratio. Computed server-side over the last 100 terminal deliveries so it   */
/*  reflects current behaviour, not lifetime stats.                           */
/* -------------------------------------------------------------------------- */

const HealthCell: React.FC<{
  health: WebhookEndpoint["health"];
}> = ({ health }) => {
  if (!health || health.total === 0) {
    return (
      <span className="text-xs text-gray-400">{__("No data", "yatra")}</span>
    );
  }
  const rate = health.success_rate ?? 0;
  const cls =
    rate >= 95
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      : rate >= 80
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  return (
    <div>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cls}`}
        title={`${health.delivered} delivered / ${health.failed} failed (last ${health.total})`}
      >
        {rate}%
      </span>
      <div className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {health.delivered}/{health.total}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Field selector — Pabbly-style checklist of dot-paths inside the event's   */
/*  payload, sourced from the sample payload endpoint. Empty selection +      */
/*  "Send all" toggle = send the whole data block; otherwise only the picked  */
/*  paths flow through (the canonical envelope is always preserved by         */
/*  PayloadFilter::apply on the server).                                       */
/* -------------------------------------------------------------------------- */

const FieldSelectorCard: React.FC<{
  eventKey: string;
  eventName: string;
  paths: Array<{ path: string; sample: unknown }>;
  isLoading: boolean;
  sendAll: boolean;
  onChangeSendAll: (next: boolean) => void;
  selectedFields: string[];
  onToggle: (path: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  samplePayload: Record<string, unknown> | null;
  sampleSource: "captured" | "delivery_log" | null;
  sampleCapturedAt: number | null;
}> = ({
  eventKey,
  eventName,
  paths,
  isLoading,
  sendAll,
  onChangeSendAll,
  selectedFields,
  onToggle,
  onSelectAll,
  onClear,
  samplePayload,
  sampleSource,
  sampleCapturedAt,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showRawPayload, setShowRawPayload] = useState(false);
  // Two-tab payload viewer: "raw" = real input data we captured;
  // "output" = what your receiver actually gets after field filtering
  // is applied. Defaults to "output" because that's the question
  // operators are most often trying to answer.
  const [payloadView, setPayloadView] = useState<"output" | "raw">("output");

  // Pabbly-style listen mode — polls every 3s while armed.
  const listenQuery = useQuery({
    queryKey: ["webhooks-listen", eventKey],
    queryFn: () => webhooksApi.getListenStatus(eventKey),
    enabled: eventKey !== "",
    refetchInterval: (q) =>
      (q.state.data as ListenStatus | undefined)?.armed ? 3000 : false,
  });
  const armed = listenQuery.data?.armed ?? false;
  const expiresAt = listenQuery.data?.expires_at ?? null;

  const armMutation = useMutation({
    mutationFn: () => webhooksApi.startListen(eventKey),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["webhooks-listen", eventKey],
      });
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });
  const disarmMutation = useMutation({
    mutationFn: (forget: boolean) => webhooksApi.stopListen(eventKey, forget),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["webhooks-listen", eventKey],
      });
      queryClient.invalidateQueries({
        queryKey: ["webhooks-event-sample", eventKey],
      });
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  // When a sample is captured live, refresh the sample query so the
  // dot-path list updates without a manual reload.
  React.useEffect(() => {
    if (listenQuery.data?.captured) {
      queryClient.invalidateQueries({
        queryKey: ["webhooks-event-sample", eventKey],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listenQuery.data?.captured?.captured_at, eventKey, queryClient]);

  const formatSample = (val: unknown): string => {
    if (val === null || val === undefined) return "null";
    if (typeof val === "string") return val === "" ? '""' : val;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (Array.isArray(val) || typeof val === "object")
      return JSON.stringify(val);
    return String(val);
  };

  // Countdown timer for armed capture.
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  React.useEffect(() => {
    if (!armed) return;
    const t = window.setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      1000,
    );
    return () => window.clearInterval(t);
  }, [armed]);
  const remaining = armed && expiresAt ? Math.max(0, expiresAt - now) : 0;
  const mm = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  const sourceLabel: Record<"captured" | "delivery_log", string> = {
    captured: __("Captured live", "yatra"),
    delivery_log: __("From last delivery", "yatra"),
  };

  const hasSample = paths.length > 0 && samplePayload !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-500" />
              {__("Payload fields to send", "yatra")}
            </CardTitle>
            <CardDescription className="space-y-1">
              <span className="block">
                {__(
                  "Pick which fields from this event's data block should be forwarded. The envelope (id, type, api_version, occurred_at) is always sent so receivers can route the event.",
                  "yatra",
                )}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                {__(
                  "Fields ship in the JSON body of the POST under their original keys — nested structure is preserved (e.g. customer.email arrives as data.customer.email, not flattened).",
                  "yatra",
                )}
              </span>
            </CardDescription>
          </div>
          {hasSample && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRawPayload(!showRawPayload)}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              {showRawPayload
                ? __("Hide payload preview", "yatra")
                : __("Preview payload", "yatra")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Listen control strip — uses Yatra's Alert primitive for
         *  visual consistency with the rest of the admin. The
         *  variant (info / success / warning) reflects the listen
         *  state, and the action buttons live on the right. */}
        <Alert
          variant={armed ? "info" : hasSample ? "success" : "warning"}
          title={
            armed
              ? `${__("Listening for", "yatra")} ${eventName}…`
              : hasSample
                ? sampleSource
                  ? sourceLabel[sampleSource]
                  : __("Sample ready", "yatra")
                : __("No sample captured yet", "yatra")
          }
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1 space-y-1">
              {armed ? (
                <>
                  <p>
                    {__(
                      "Trigger this event in Yatra (create a booking, submit an enquiry, etc.). The real payload will appear here automatically.",
                      "yatra",
                    )}
                  </p>
                  <p className="font-mono text-xs">
                    {__("Expires in", "yatra")} {mm}:{ss}
                  </p>
                </>
              ) : hasSample ? (
                <>
                  <p>
                    {__(
                      "Pick from the real fields below — these are the exact paths your receiver will see.",
                      "yatra",
                    )}
                  </p>
                  {sampleCapturedAt && (
                    <p className="text-xs opacity-80">
                      {__("Captured", "yatra")}{" "}
                      {new Date(sampleCapturedAt * 1000).toLocaleString()}
                    </p>
                  )}
                </>
              ) : (
                <p>
                  {__(
                    'Click "Listen for sample" then perform the action that triggers this event in Yatra. We\'ll show you the real payload — no guesswork.',
                    "yatra",
                  )}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              {armed ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => disarmMutation.mutate(false)}
                  disabled={disarmMutation.isPending}
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  {__("Stop listening", "yatra")}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => armMutation.mutate()}
                  disabled={armMutation.isPending}
                >
                  {armMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {hasSample
                    ? __("Re-capture sample", "yatra")
                    : __("Listen for sample", "yatra")}
                </Button>
              )}
              {hasSample && !armed && (
                <Tooltip content={__("Discard the captured sample", "yatra")}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => disarmMutation.mutate(true)}
                    disabled={disarmMutation.isPending}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    {__("Clear", "yatra")}
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        </Alert>

        {/* Forwarding mode — Send everything OR pick fields. */}
        <label
          htmlFor={`webhook-send-all-${eventKey}`}
          className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
            sendAll
              ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          }`}
        >
          <input
            id={`webhook-send-all-${eventKey}`}
            type="radio"
            name="webhook-field-mode"
            checked={sendAll}
            onChange={() => onChangeSendAll(true)}
            className="h-4 w-4 mt-0.5 flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {__("Send the full payload", "yatra")}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {__(
                "POSTs the entire envelope + data block — every field under its original key. Recommended when your receiver picks what it needs.",
                "yatra",
              )}
            </div>
          </div>
        </label>

        <label
          htmlFor={`webhook-select-${eventKey}`}
          className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
            !sendAll
              ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          } ${!hasSample ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input
            id={`webhook-select-${eventKey}`}
            type="radio"
            name="webhook-field-mode"
            checked={!sendAll}
            onChange={() => onChangeSendAll(false)}
            disabled={!hasSample}
            className="h-4 w-4 mt-0.5 flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {__("Send only selected fields", "yatra")}
              {!hasSample && (
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  ({__("capture a sample first", "yatra")})
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {__(
                "Only the dot-paths you tick will ship in data{…}. Nested structure is preserved (picking customer.email keeps it nested, not flattened). Useful to strip PII or fields a downstream system bills you for.",
                "yatra",
              )}
            </div>
          </div>
        </label>

        {!sendAll && hasSample && (
          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {__(
                "Each row is a dot-path inside data{}. The value shown is from the real captured sample — your receiver will get that same key, at that same nesting.",
                "yatra",
              )}
            </p>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedFields.length} / {paths.length}{" "}
                {__("fields selected", "yatra")}
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onSelectAll}
                  disabled={paths.length === 0}
                >
                  {__("Select all", "yatra")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClear}
                  disabled={selectedFields.length === 0}
                >
                  {__("Clear", "yatra")}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-9 rounded bg-gray-200 dark:bg-gray-700"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                {paths.map((row) => {
                  const checked = selectedFields.includes(row.path);
                  return (
                    <label
                      key={row.path}
                      htmlFor={`field-${row.path}`}
                      className={`flex items-start gap-2 p-2.5 rounded-md border cursor-pointer transition-colors ${
                        checked
                          ? "border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <input
                        id={`field-${row.path}`}
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(row.path)}
                        className="h-4 w-4 mt-0.5 rounded border-gray-300 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <code className="text-xs font-mono text-gray-900 dark:text-white break-all">
                          {row.path}
                        </code>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {formatSample(row.sample)}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {showRawPayload && samplePayload && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {/* Tab strip — "Output" first because that's what operators
             *  most need to verify: "what will my receiver actually get?" */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPayloadView("output")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    payloadView === "output"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {__("Output (what your receiver gets)", "yatra")}
                </button>
                <button
                  type="button"
                  onClick={() => setPayloadView("raw")}
                  className={`px-3 py-1.5 text-xs font-medium border-l border-gray-200 dark:border-gray-700 transition-colors ${
                    payloadView === "raw"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {__("Input (full event data)", "yatra")}
                </button>
              </div>
              <CopyButton
                text={JSON.stringify(
                  payloadView === "output"
                    ? applyFieldFilter(
                        samplePayload,
                        sendAll ? [] : selectedFields,
                      )
                    : samplePayload,
                  null,
                  2,
                )}
              />
            </div>

            <pre className="text-xs font-mono bg-gray-900 text-gray-100 dark:bg-black rounded-md p-3 max-h-80 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(
                payloadView === "output"
                  ? applyFieldFilter(
                      samplePayload,
                      sendAll ? [] : selectedFields,
                    )
                  : samplePayload,
                null,
                2,
              )}
            </pre>

            {payloadView === "output" ? (
              <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 p-2.5">
                <p className="text-[11px] text-blue-800 dark:text-blue-300">
                  {sendAll || selectedFields.length === 0
                    ? __(
                        "Send full payload mode — every field above ships in the POST body, exactly as shown.",
                        "yatra",
                      )
                    : __(
                        "These are the exact JSON bytes that will be POSTed to your receiver. Keys stay nested under their original paths.",
                        "yatra",
                      )}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {sampleSource === "captured"
                  ? __("Captured live from a real event firing.", "yatra")
                  : __(
                      "Pulled from the most recent successful delivery for this event.",
                      "yatra",
                    )}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/*  Endpoint create / edit form                                               */
/* -------------------------------------------------------------------------- */

const EndpointEditForm: React.FC<{
  existing: WebhookEndpoint | null;
  events: WebhookEvent[];
  onClose: () => void;
  onCreated: (secret: string, endpointName: string) => void;
}> = ({ existing, events, onClose, onCreated }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isCreate = existing === null;

  const [name, setName] = useState(existing?.name ?? "");
  const [url, setUrl] = useState(existing?.url ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  // ONE event per endpoint (mirrors Email Automation's 1:1 model).
  // The selected_fields filter applies to this event's payload shape,
  // so binding multiple events here would make field selection ambiguous.
  const [eventKey, setEventKey] = useState<string>(existing?.event ?? "");
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  // Outbound HTTP verb. POST default matches the universal webhook
  // convention; operators with non-POST receivers (PUT for upsert,
  // PATCH for partial, DELETE for object-removed mirrors, GET for
  // legacy polling-callback patterns) pick from the dropdown.
  const [httpMethod, setHttpMethod] = useState<WebhookEndpoint["http_method"]>(
    existing?.http_method ?? "POST",
  );
  const [isActive, setIsActive] = useState(existing?.is_active ?? true);
  const [logDeliveries, setLogDeliveries] = useState(
    existing?.log_deliveries ?? true,
  );

  // Pabbly-style field filter. Empty = "send everything". Populated =
  // "send only these dot-paths" (envelope always preserved server-side).
  const [selectedFields, setSelectedFields] = useState<string[]>(
    existing?.selected_fields ?? [],
  );
  // "Send all data" is the default for new endpoints — toggling it off
  // reveals the dot-path checklist sourced from the event's sample payload.
  const [sendAllData, setSendAllData] = useState<boolean>(
    (existing?.selected_fields?.length ?? 0) === 0,
  );

  // Convert the server's map → list of {key, value} rows for the
  // KeyValueEditor (easier to manage incremental edits + ordering).
  // Empty trailing row is auto-managed by the editor itself.
  const [headerRows, setHeaderRows] = useState<KvRow[]>(() =>
    objectToRows(existing?.headers ?? {}),
  );
  const [extraRows, setExtraRows] = useState<KvRow[]>(() =>
    objectToRows(existing?.additional_payload_fields ?? {}),
  );
  const [useCustomSecret, setUseCustomSecret] = useState(false);
  const [customSecret, setCustomSecret] = useState("");

  // Headers + extras are sent as plain key→value maps; the
  // KeyValueEditor strips blank rows so we don't transmit junk.
  const buildPayload = (): WebhookEndpointWriteInput => {
    const payload: WebhookEndpointWriteInput = {
      name,
      url,
      description,
      event: eventKey,
      http_method: httpMethod,
      headers: rowsToObject(headerRows),
      additional_payload_fields: rowsToObject(extraRows),
      // Empty list = "send everything"; the server keeps null in DB.
      selected_fields: sendAllData ? [] : selectedFields,
      is_active: isActive,
      log_deliveries: logDeliveries,
    };
    if (useCustomSecret && customSecret.trim() !== "") {
      payload.custom_secret = customSecret.trim();
    }
    return payload;
  };

  const createMutation = useMutation({
    mutationFn: () => webhooksApi.createEndpoint(buildPayload()),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-endpoints"] });
      onCreated(res.secret, res.data.name);
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const updateMutation = useMutation({
    mutationFn: () => webhooksApi.updateEndpoint(existing!.id, buildPayload()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-endpoints"] });
      showToast(__("Endpoint updated.", "yatra"), "success");
      onClose();
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  // Look up the currently selected event row for the dropdown label +
  // description box. memo'd so we don't re-scan the list on every render.
  const selectedEvent = useMemo(
    () => events.find((e) => e.key === eventKey) ?? null,
    [events, eventKey],
  );

  // Fetch the latest REAL payload for the picked event (captured or
  // pulled from the delivery log). When there's no sample yet, the
  // form prompts the operator to start a Listen session.
  const sampleQuery = useQuery({
    queryKey: ["webhooks-event-sample", eventKey],
    queryFn: () => webhooksApi.getEventSample(eventKey),
    enabled: eventKey !== "",
    staleTime: 30_000,
  });
  const samplePaths = sampleQuery.data?.paths ?? [];
  const samplePayload = sampleQuery.data?.payload ?? null;
  const sampleSource = sampleQuery.data?.source ?? null;
  const sampleCapturedAt = sampleQuery.data?.captured_at ?? null;

  const toggleField = (path: string) => {
    setSelectedFields((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };
  const selectAllFields = () =>
    setSelectedFields(samplePaths.map((p) => p.path));
  const clearAllFields = () => setSelectedFields([]);

  const customSecretValid =
    !useCustomSecret || customSecret.trim().length >= 24;
  // UX trap: if the operator picked "Send only selected fields" but
  // ticked zero, the server would silently treat it as "send
  // everything" — counter-intuitive. Block save until they either
  // pick at least one field or switch back to "Send full payload".
  const fieldSelectionValid = sendAllData || selectedFields.length > 0;
  const canSave =
    name.trim() !== "" &&
    url.trim() !== "" &&
    eventKey !== "" &&
    customSecretValid &&
    fieldSelectionValid &&
    !createMutation.isPending &&
    !updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isCreate
            ? __("Add endpoint", "yatra")
            : __("Edit endpoint", "yatra")}
        </h3>
        <Button variant="outline" onClick={onClose}>
          {__("Cancel", "yatra")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{__("Destination", "yatra")}</CardTitle>
          <CardDescription>
            {__(
              "HTTPS-only. We sign every request with HMAC-SHA256 — your receiver verifies the X-Yatra-Signature header against your stored secret.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webhook-name">{__("Name", "yatra")}</Label>
            <Input
              id="webhook-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={__("Zapier — booking sync", "yatra")}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="webhook-url">{__("URL", "yatra")}</Label>
            <Input
              id="webhook-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/12345/abcdef/"
              className="mt-1 font-mono text-sm"
            />
            {/* Inline scheme warning — caught at typing time so the
             *  operator notices before saving. Plain http:// is rejected
             *  server-side unless WP_DEBUG is on (dev-only). */}
            {url.trim().startsWith("http://") ? (
              <div className="mt-1 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  {__(
                    "Insecure URL — http:// is only accepted in WP_DEBUG mode for local development. Production receivers must use https://.",
                    "yatra",
                  )}
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__("Must use HTTPS in production.", "yatra")}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="webhook-description">
              {__("Description", "yatra")}{" "}
              <span className="text-xs font-normal text-gray-500">
                ({__("optional", "yatra")})
              </span>
            </Label>
            <Input
              id="webhook-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={__("Internal CRM ingest — sales team", "yatra")}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="webhook-method">{__("HTTP method", "yatra")}</Label>
            <Select
              id="webhook-method"
              value={httpMethod}
              onChange={(e) =>
                setHttpMethod(e.target.value as WebhookEndpoint["http_method"])
              }
              className="mt-1"
            >
              <option value="POST">
                POST {__("(default — recommended)", "yatra")}
              </option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
              <option value="GET">GET</option>
            </Select>
            {httpMethod === "GET" ? (
              <div className="mt-1 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  {__(
                    "GET deliveries send the payload as a ?payload=<json> query parameter (URL-encoded). The HMAC signature is then computed over an empty body — receivers should reconstruct the signed string as `timestamp + '.' + ''`. Only use GET when the receiver explicitly requires it.",
                    "yatra",
                  )}
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__(
                  "POST is the universal webhook convention. PUT / PATCH / DELETE are for receivers that explicitly require them (upsert, partial update, object-removal mirrors).",
                  "yatra",
                )}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-700 p-3">
            <Label
              htmlFor="webhook-is-active"
              className="font-normal cursor-pointer"
            >
              <span className="block text-sm font-medium text-gray-900 dark:text-white">
                {__("Active", "yatra")}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {__(
                  "Start delivering events as soon as this is saved.",
                  "yatra",
                )}
              </span>
            </Label>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              className="flex-shrink-0"
            />
          </div>

          {/* log_deliveries — high-volume endpoints turn off body
           *  persistence so the delivery log doesn't bloat. Status,
           *  duration, attempts still recorded so health metrics
           *  + retry semantics stay intact. */}
          <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-700 p-3">
            <Label
              htmlFor="webhook-log-deliveries"
              className="font-normal cursor-pointer"
            >
              <span className="block text-sm font-medium text-gray-900 dark:text-white">
                {__("Log delivery payloads", "yatra")}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {logDeliveries
                  ? __(
                      "Stores the full POST body + receiver response on every attempt (90-day retention). Recommended for debugging.",
                      "yatra",
                    )
                  : __(
                      "Only metadata (status, duration, attempts) is stored. Saves disk on high-volume endpoints, but the inspector won't show payload or response bodies.",
                      "yatra",
                    )}
              </span>
            </Label>
            <Switch
              checked={logDeliveries}
              onCheckedChange={setLogDeliveries}
              className="flex-shrink-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trigger event — single select, matches the Email Automation
       *  picker UX exactly (Zap icon button, indigo description box). */}
      <Card>
        <CardHeader>
          <CardTitle>{__("Trigger event", "yatra")}</CardTitle>
          <CardDescription>
            {__(
              "Pick the single event that triggers this endpoint. The field selector below will then show you the exact payload shape so you can choose which data to forward.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEventDropdown(!showEventDropdown)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              {selectedEvent ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Zap className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {selectedEvent.name}
                  </span>
                  <code className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded font-mono">
                    {selectedEvent.key}
                  </code>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {__("Choose an event…", "yatra")}
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
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
                    {__(
                      "Select the Yatra event that should fire this webhook",
                      "yatra",
                    )}
                  </p>
                </div>
                <div className="py-1">
                  {events.map((event) => (
                    <button
                      key={event.key}
                      type="button"
                      onClick={() => {
                        setEventKey(event.key);
                        setShowEventDropdown(false);
                        // Reset field selection when the event changes —
                        // selected paths for the OLD event are irrelevant
                        // to the new event's payload shape.
                        if (event.key !== eventKey) {
                          setSelectedFields([]);
                          setSendAllData(true);
                        }
                      }}
                      className={`w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                        eventKey === event.key
                          ? "bg-indigo-50 dark:bg-indigo-900/20"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Zap
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            eventKey === event.key
                              ? "text-blue-500"
                              : "text-gray-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                eventKey === event.key
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
                          {event.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                        {eventKey === event.key && (
                          <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showEventDropdown && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowEventDropdown(false)}
              />
            )}
          </div>

          {selectedEvent?.description && (
            <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-indigo-800 dark:text-indigo-300">
                {selectedEvent.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pabbly-style field selector — only shown once an event is
       *  picked, because the dot-path list depends on the event's
       *  payload shape. */}
      {eventKey !== "" && (
        <FieldSelectorCard
          eventKey={eventKey}
          eventName={selectedEvent?.name ?? eventKey}
          paths={samplePaths}
          isLoading={sampleQuery.isLoading}
          sendAll={sendAllData}
          onChangeSendAll={(next) => {
            setSendAllData(next);
            if (next) setSelectedFields([]);
          }}
          selectedFields={selectedFields}
          onToggle={toggleField}
          onSelectAll={selectAllFields}
          onClear={clearAllFields}
          samplePayload={samplePayload}
          sampleSource={sampleSource}
          sampleCapturedAt={sampleCapturedAt}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{__("Custom HTTP headers", "yatra")}</CardTitle>
          <CardDescription>
            {__(
              "Sent alongside Yatra's signed headers on every request. Useful for receivers that require Bearer / Basic auth on TOP of the HMAC signature, or for tagging requests for routing. Reserved headers (X-Yatra-*, Content-Length, Host, Cookie) are blocked.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KeyValueEditor
            rows={headerRows}
            onChange={setHeaderRows}
            keyPlaceholder={__("Header name (e.g. Authorization)", "yatra")}
            valuePlaceholder={__("Header value (e.g. Bearer xyz)", "yatra")}
            idPrefix="webhook-header"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{__("Additional payload fields", "yatra")}</CardTitle>
          <CardDescription>
            {__(
              "Static fields merged into every payload's \"data\" block. Use this to tag events with operator-specific metadata (tenant_id, environment, region, source_app) without writing a server-side filter. Operator fields never overwrite Yatra's canonical entity fields.",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KeyValueEditor
            rows={extraRows}
            onChange={setExtraRows}
            keyPlaceholder={__("Field key (e.g. tenant_id)", "yatra")}
            valuePlaceholder={__("Static value (e.g. acme-prod)", "yatra")}
            idPrefix="webhook-extra"
          />
        </CardContent>
      </Card>

      {/* Custom signing secret — only on create (rotate via the
       *  Regenerate icon on the list view for existing endpoints, OR
       *  by toggling this on while editing). */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            {__("Signing secret", "yatra")}
          </CardTitle>
          <CardDescription>
            {isCreate
              ? __(
                  "By default Yatra generates a strong random 32-byte signing secret. If your receiver already has a secret configured (e.g. you're migrating from another system), paste it below — minimum 24 characters.",
                  "yatra",
                )
              : __(
                  "Leave unchecked to keep the existing secret. Check to rotate to a new one — receivers using the old secret will start failing signature verification until you update them.",
                  "yatra",
                )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-700 p-3">
            <Label
              htmlFor="webhook-use-custom-secret"
              className="font-normal cursor-pointer"
            >
              <span className="block text-sm font-medium text-gray-900 dark:text-white">
                {isCreate
                  ? __("Use my own signing secret", "yatra")
                  : __("Rotate to a new signing secret", "yatra")}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isCreate
                  ? __(
                      "Provide a 24+ character secret instead of letting Yatra auto-generate one.",
                      "yatra",
                    )
                  : __(
                      "Replaces the current secret. Receivers using the old one will start failing signature verification.",
                      "yatra",
                    )}
              </span>
            </Label>
            <Switch
              checked={useCustomSecret}
              onCheckedChange={(next) => {
                setUseCustomSecret(next);
                if (!next) setCustomSecret("");
              }}
              className="flex-shrink-0"
            />
          </div>
          {useCustomSecret && (
            <div>
              <Input
                id="webhook-custom-secret"
                type="password"
                value={customSecret}
                onChange={(e) => setCustomSecret(e.target.value)}
                placeholder={__(
                  "Paste your signing secret (min 24 chars)",
                  "yatra",
                )}
                className="font-mono text-sm"
                aria-describedby="webhook-custom-secret-help"
              />
              <p
                id="webhook-custom-secret-help"
                className="mt-1 text-xs text-gray-500 dark:text-gray-400"
              >
                {customSecret.length > 0 && customSecret.length < 24 ? (
                  <span className="text-amber-600 dark:text-amber-400">
                    {__("Too short — need at least 24 characters.", "yatra")} (
                    {customSecret.length}/24)
                  </span>
                ) : (
                  __(
                    "Stored encrypted at rest. Treat it like a password.",
                    "yatra",
                  )
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {__("Cancel", "yatra")}
        </Button>
        <Button
          disabled={!canSave}
          onClick={() =>
            isCreate ? createMutation.mutate() : updateMutation.mutate()
          }
        >
          {createMutation.isPending || updateMutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              {__("Saving…", "yatra")}
            </>
          ) : isCreate ? (
            __("Create endpoint", "yatra")
          ) : (
            __("Save changes", "yatra")
          )}
        </Button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Secret-reveal copy-once dialog                                            */
/* -------------------------------------------------------------------------- */

const SecretRevealDialog: React.FC<{
  secret: string | null;
  endpointName: string;
  onClose: () => void;
}> = ({ secret, endpointName, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [snippetLang, setSnippetLang] = useState<"php" | "node" | "python">(
    "php",
  );

  const doCopy = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (_e) {
      // No-op — operator can select-all manually.
    }
  };

  if (!secret) return null;

  // Receiver verification snippets — operator pastes into their handler.
  // Stripe-style "t=<unix>,v1=<hex>" signature header verification.
  const snippets: Record<"php" | "node" | "python", string> = {
    php: `// PHP receiver verification
$signature = $_SERVER['HTTP_X_YATRA_SIGNATURE'] ?? '';
$body = file_get_contents('php://input');
$parts = [];
foreach (explode(',', $signature) as $kv) {
    [$k, $v] = array_pad(explode('=', $kv, 2), 2, '');
    $parts[$k] = $v;
}
$ts = (int) ($parts['t'] ?? 0);
$sig = $parts['v1'] ?? '';
// Reject replays > 5 min old
if (abs(time() - $ts) > 300) { http_response_code(400); exit; }
$expected = hash_hmac('sha256', $ts . '.' . $body, '${secret}');
if (!hash_equals($expected, $sig)) { http_response_code(401); exit; }
// Signature valid — process json_decode($body, true)`,
    node: `// Node.js (Express) receiver verification
import crypto from 'crypto';
app.post('/webhook', express.raw({ type: '*/*' }), (req, res) => {
  const sig = req.header('x-yatra-signature') || '';
  const parts = Object.fromEntries(
    sig.split(',').map(kv => kv.split('=', 2))
  );
  const ts = parseInt(parts.t || '0', 10);
  // Reject replays > 5 min old
  if (Math.abs(Date.now() / 1000 - ts) > 300) return res.status(400).end();
  const expected = crypto
    .createHmac('sha256', '${secret}')
    .update(\`\${ts}.\${req.body}\`)
    .digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1 || ''))) {
    return res.status(401).end();
  }
  const event = JSON.parse(req.body);
  // …handle event
});`,
    python: `# Python (Flask) receiver verification
import hmac, hashlib, time
from flask import request, abort

@app.route('/webhook', methods=['POST'])
def webhook():
    sig = request.headers.get('X-Yatra-Signature', '')
    parts = dict(kv.split('=', 1) for kv in sig.split(',') if '=' in kv)
    ts = int(parts.get('t', '0'))
    if abs(time.time() - ts) > 300:
        abort(400)  # replay protection
    expected = hmac.new(
        b'${secret}',
        f"{ts}.{request.data.decode()}".encode(),
        hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected, parts.get('v1', '')):
        abort(401)
    event = request.get_json()
    # …handle event`,
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-500" />
          {__("Signing secret", "yatra")}
        </div>
      }
      size="lg"
      hideFooter={false}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{__("I've saved it", "yatra")}</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          {__("Below is the signing secret for ", "yatra")}
          <strong>{endpointName}</strong>.{" "}
          {__(
            "It will not be shown again — copy it now and store it in your receiver's configuration. If you lose it, you'll need to regenerate (which invalidates the old one).",
            "yatra",
          )}
        </p>
        <div className="flex gap-2">
          <Input
            value={secret}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
            className="font-mono text-sm"
            aria-label={__("Signing secret value", "yatra")}
          />
          <Button onClick={doCopy} variant="outline">
            {copied ? (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                {__("Copied", "yatra")}
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-4 w-4" />
                {__("Copy", "yatra")}
              </>
            )}
          </Button>
        </div>

        {/* Receiver verification snippet — Stripe / GitHub UX:
         *  reduces "how do I verify the signature?" support tickets
         *  by handing the operator working code. */}
        <div>
          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
            <Label className="text-sm font-semibold">
              {__("Verify the signature on your receiver", "yatra")}
            </Label>
            <div className="flex gap-1">
              {(["php", "node", "python"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSnippetLang(lang)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    snippetLang === lang
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
              <CopyButton text={snippets[snippetLang]} />
            </div>
          </div>
          <pre className="bg-gray-900 text-gray-100 dark:bg-black rounded-md p-3 text-[11px] font-mono overflow-auto max-h-64 whitespace-pre-wrap">
            {snippets[snippetLang]}
          </pre>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-3">
          <div className="flex gap-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              {__(
                "Treat this secret like a password. Anyone with it can forge requests that appear to come from Yatra.",
                "yatra",
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/*  Deliveries tab — "listen mode" / payload inspector                        */
/* -------------------------------------------------------------------------- */

const DeliveriesTab: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [endpointFilter, setEndpointFilter] = useState<number>(0);
  const [eventFilter, setEventFilter] = useState<string>("");
  const [inspectId, setInspectId] = useState<number | null>(null);
  const perPage = 25;

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, endpointFilter, eventFilter]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "webhooks-deliveries",
      page,
      perPage,
      statusFilter,
      endpointFilter,
      eventFilter,
    ],
    queryFn: () =>
      webhooksApi.listDeliveries({
        page,
        per_page: perPage,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(endpointFilter ? { endpoint_id: endpointFilter } : {}),
        ...(eventFilter ? { event_key: eventFilter } : {}),
      }),
    refetchInterval: 10000,
    placeholderData: (prev) => prev,
  });
  const { data: endpointsData } = useQuery({
    queryKey: ["webhooks-endpoints"],
    queryFn: () => webhooksApi.listEndpoints(),
  });
  const { data: eventsData } = useQuery({
    queryKey: ["webhooks-events"],
    queryFn: () => webhooksApi.listEvents(),
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const replayMutation = useMutation({
    mutationFn: (id: number) => webhooksApi.replayDelivery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-deliveries"] });
      showToast(__("Delivery re-queued.", "yatra"), "success");
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasFilters = !!(statusFilter || endpointFilter || eventFilter);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          {__("Delivery log", "yatra")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {__(
            "Every outbound POST attempt with status, response, and the full payload that was sent. Click any row to inspect the JSON your receiver got.",
            "yatra",
          )}
        </p>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <Select
              value={String(endpointFilter)}
              onChange={(e) => setEndpointFilter(Number(e.target.value))}
              aria-label={__("Filter by endpoint", "yatra")}
              className="w-full lg:w-64 lg:flex-none"
            >
              <option value="0">{__("All endpoints", "yatra")}</option>
              {(endpointsData?.data ?? []).map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.name}
                </option>
              ))}
            </Select>
            <Select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              aria-label={__("Filter by event", "yatra")}
              className="w-full lg:w-56 lg:flex-none"
            >
              <option value="">{__("All events", "yatra")}</option>
              {(eventsData?.data ?? []).map((ev) => (
                <option key={ev.key} value={ev.key}>
                  {ev.name} ({ev.key})
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label={__("Filter by status", "yatra")}
              className="w-full lg:w-48 lg:flex-none"
            >
              <option value="">{__("All statuses", "yatra")}</option>
              <option value="queued">{__("Queued", "yatra")}</option>
              <option value="delivering">{__("Delivering", "yatra")}</option>
              <option value="delivered">{__("Delivered", "yatra")}</option>
              <option value="failed">{__("Failed (retrying)", "yatra")}</option>
              <option value="permanent_failure">
                {__("Permanent failure", "yatra")}
              </option>
            </Select>
            {hasFilters && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("");
                  setEndpointFilter(0);
                  setEventFilter("");
                }}
                className="w-full lg:w-auto"
              >
                {__("Reset", "yatra")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-visible">
        <CardContent className="p-0 overflow-visible">
          <SharedTable
            data={rows}
            columns={[
              {
                key: "event_key",
                label: __("Event", "yatra"),
                render: (d: WebhookDeliveryRow) => {
                  const ep = endpointsData?.data.find(
                    (e) => e.id === d.endpoint_id,
                  );
                  return (
                    <div className="min-w-0">
                      {/* Clicking the event/endpoint name opens the inspector
                       *  the same way clicking an activity name opens its edit. */}
                      <button
                        type="button"
                        onClick={() => setInspectId(d.id)}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer text-left"
                      >
                        <span className="font-mono text-xs">{d.event_key}</span>
                      </button>
                      <div
                        className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-md"
                        title={ep?.url || ""}
                      >
                        → {ep?.name ?? `#${d.endpoint_id}`}
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "status",
                label: __("Status", "yatra"),
                render: (d: WebhookDeliveryRow) => (
                  <StatusBadge status={d.status} httpStatus={d.http_status} />
                ),
              },
              {
                key: "attempts",
                label: __("Attempts", "yatra"),
                render: (d: WebhookDeliveryRow) => (
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {d.attempts}
                  </span>
                ),
              },
              {
                key: "duration_ms",
                label: __("Duration", "yatra"),
                render: (d: WebhookDeliveryRow) =>
                  d.duration_ms !== null ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {d.duration_ms} ms
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  ),
              },
              {
                key: "created_at",
                label: __("Created", "yatra"),
                render: (d: WebhookDeliveryRow) => (
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {d.created_at
                      ? new Date(d.created_at).toLocaleString()
                      : "—"}
                  </span>
                ),
              },
            ]}
            actions={[
              {
                key: "inspect",
                label: __("Inspect payload + response", "yatra"),
                icon: <Eye className="w-4 h-4" />,
                onClick: (d: WebhookDeliveryRow) => setInspectId(d.id),
              },
              {
                key: "replay",
                label: __("Replay delivery", "yatra"),
                icon: <RotateCcw className="w-4 h-4" />,
                onClick: (d: WebhookDeliveryRow) => replayMutation.mutate(d.id),
                condition: (d: WebhookDeliveryRow) =>
                  d.status === "failed" || d.status === "permanent_failure",
              },
            ]}
            isLoading={isLoading}
            emptyText={
              total === 0 && !hasFilters
                ? __("No deliveries yet", "yatra")
                : __("No matches", "yatra")
            }
            emptyDescription={
              total === 0 && !hasFilters
                ? __(
                    "Deliveries appear here once an event fires. Use the Ping button on an endpoint to fire a test event.",
                    "yatra",
                  )
                : __("Try adjusting your filters to see more results.", "yatra")
            }
          />
          {rows.length > 0 && totalPages > 1 && (
            <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={perPage}
                onPageChange={setPage}
                itemName={__("deliveries", "yatra")}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <DeliveryInspectDialog
        id={inspectId}
        onClose={() => setInspectId(null)}
      />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  mTLS dialog — upload / inspect / remove client cert per endpoint          */
/*                                                                            */
/*  Three states:                                                             */
/*    - configured=false: empty form (paste cert + key + optional passphrase) */
/*    - configured=true:  fingerprint + expiry hint + "Replace" / "Remove"    */
/*    - mid-mutation: spinner                                                 */
/*                                                                            */
/*  The cert+key never leave the server roundtrip — we paste, POST, then      */
/*  drop the strings from React state. Read-back only returns the hint.       */
/* -------------------------------------------------------------------------- */

const MtlsDialog: React.FC<{
  endpoint: WebhookEndpoint | null;
  onClose: () => void;
}> = ({ endpoint, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [cert, setCert] = useState("");
  const [keyPem, setKeyPem] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [mode, setMode] = useState<"view" | "edit">("view");

  const enabled = endpoint !== null;
  const { data, isLoading } = useQuery({
    queryKey: ["webhook-mtls", endpoint?.id],
    queryFn: () => webhooksApi.getMtlsHint(endpoint!.id),
    enabled,
  });
  const hint = data?.data;

  // Reset form whenever the dialog opens for a new endpoint.
  React.useEffect(() => {
    if (endpoint) {
      setCert("");
      setKeyPem("");
      setPassphrase("");
      setMode(hint?.configured ? "view" : "edit");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint?.id, hint?.configured]);

  const save = useMutation({
    mutationFn: () =>
      webhooksApi.setMtls(endpoint!.id, { cert, key: keyPem, passphrase }),
    onSuccess: (r) => {
      showToast(r.message, "success");
      setCert("");
      setKeyPem("");
      setPassphrase("");
      setMode("view");
      void queryClient.invalidateQueries({
        queryKey: ["webhook-mtls", endpoint!.id],
      });
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  const clear = useMutation({
    mutationFn: () => webhooksApi.clearMtls(endpoint!.id),
    onSuccess: (r) => {
      showToast(r.message, "success");
      void queryClient.invalidateQueries({
        queryKey: ["webhook-mtls", endpoint!.id],
      });
      onClose();
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  if (!endpoint) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={__("Client certificate (mTLS)", "yatra")}
      size="xl"
    >
      <div className="space-y-4">
        <Alert variant="info">
          {__(
            "Optional. Some receivers require Yatra to authenticate at the TLS handshake with a client certificate, in addition to the HMAC signature on the body. Paste your PEM-encoded cert and private key below. The pair is encrypted at rest and used only at delivery time.",
            "yatra",
          )}
        </Alert>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : mode === "view" && hint?.configured ? (
          <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                {__("Client certificate configured", "yatra")}
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex gap-2">
                <span className="text-gray-500 w-24 flex-shrink-0">
                  {__("Fingerprint", "yatra")}
                </span>
                <code className="font-mono break-all text-gray-700 dark:text-gray-300">
                  {hint.fingerprint || __("(unavailable)", "yatra")}
                </code>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-24 flex-shrink-0">
                  {__("Expires", "yatra")}
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {hint.expires_at
                    ? new Date(hint.expires_at).toLocaleString()
                    : __("(unknown)", "yatra")}
                </span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setMode("edit")}>
                {__("Replace certificate", "yatra")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => clear.mutate()}
                disabled={clear.isPending}
              >
                {clear.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                {__("Remove certificate", "yatra")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="mtls-cert">
                {__("Certificate (PEM)", "yatra")}
              </Label>
              <textarea
                id="mtls-cert"
                className="mt-1 w-full font-mono text-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 min-h-[140px]"
                value={cert}
                onChange={(e) => setCert(e.target.value)}
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
              />
            </div>
            <div>
              <Label htmlFor="mtls-key">
                {__("Private key (PEM)", "yatra")}
              </Label>
              <textarea
                id="mtls-key"
                className="mt-1 w-full font-mono text-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 min-h-[140px]"
                value={keyPem}
                onChange={(e) => setKeyPem(e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              />
            </div>
            <div>
              <Label htmlFor="mtls-pass">
                {__("Key passphrase (optional)", "yatra")}
              </Label>
              <Input
                id="mtls-pass"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder={__(
                  "Leave blank if the key is unencrypted",
                  "yatra",
                )}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {hint?.configured && (
                <Button variant="outline" onClick={() => setMode("view")}>
                  {__("Cancel", "yatra")}
                </Button>
              )}
              <Button
                onClick={() => save.mutate()}
                disabled={!cert || !keyPem || save.isPending}
              >
                {save.isPending && (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                )}
                {__("Save certificate", "yatra")}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              {__(
                "The certificate and key are validated together before storage — if they don't match, the save is rejected. Stored encrypted with libsodium / OpenSSL AES-256-GCM.",
                "yatra",
              )}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/*  Buried (dead-letter) tab                                                  */
/*                                                                            */
/*  Read+write surface for every delivery in `permanent_failure`. The         */
/*  backend returns a pre-aggregated summary (top 10 by endpoint / event /    */
/*  error fingerprint) so the operator triages "what's broken right now"     */
/*  before deciding what to replay. Three replay paths:                       */
/*    1. By endpoint: "re-fire everything buried for endpoint X"              */
/*    2. By error: "re-fire everything matching this error pattern"           */
/*    3. By explicit ids: pick rows from the recent list                      */
/*                                                                            */
/*  All three converge on POST /webhooks/deliveries/bulk-replay — the         */
/*  server caps at 200 ids / 500 filtered, skips inactive endpoints, and      */
/*  returns per-category counts the UI surfaces as a toast.                   */
/* -------------------------------------------------------------------------- */

const BuriedTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [inspectId, setInspectId] = useState<number | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["webhook-dead-letter"],
    queryFn: () => webhooksApi.getDeadLetterSummary(),
    refetchOnWindowFocus: false,
  });

  // Endpoint id → name lookup so summary cards can show real names
  // instead of bare ids.
  const { data: endpoints } = useQuery({
    queryKey: ["webhook-endpoints"],
    queryFn: () => webhooksApi.listEndpoints(),
  });
  const endpointNameById = useMemo(() => {
    const map = new Map<number, string>();
    endpoints?.data?.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [endpoints]);

  const bulkReplay = useMutation({
    mutationFn: (
      input: Parameters<typeof webhooksApi.bulkReplayDeliveries>[0],
    ) => webhooksApi.bulkReplayDeliveries(input),
    onSuccess: (r) => {
      showToast(r.message, "success");
      setSelectedIds(new Set());
      void queryClient.invalidateQueries({ queryKey: ["webhook-dead-letter"] });
      void queryClient.invalidateQueries({ queryKey: ["webhook-deliveries"] });
    },
    onError: (e) => showToast(extractError(e), "error"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  const summary = data?.data;
  const total = summary?.total ?? 0;

  if (total === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
          {__("Nothing buried", "yatra")}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          {__(
            "Every delivery either succeeded or is still mid-retry. Permanent failures will show up here so you can replay or investigate.",
            "yatra",
          )}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`}
          />
          {__("Refresh", "yatra")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header strip — total count + global refresh */}
      <div className="flex items-start gap-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">
            {sprintf(
              /* translators: %d: number of buried deliveries */
              __("%d delivery(ies) reached permanent failure", "yatra"),
              total,
            )}
          </h3>
          <p className="text-sm text-red-800 dark:text-red-200/90 mt-0.5">
            {__(
              "These exhausted automatic retries. Group by endpoint or error pattern below and bulk-replay once the downstream issue is fixed.",
              "yatra",
            )}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`}
          />
          {__("Refresh", "yatra")}
        </Button>
      </div>

      {/* Three grouping cards: by endpoint / by event / by error */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {__("By endpoint", "yatra")}
            </CardTitle>
            <CardDescription>
              {__("Top receivers accumulating failures.", "yatra")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary!.by_endpoint.length === 0 && (
              <p className="text-xs text-gray-500">{__("None.", "yatra")}</p>
            )}
            {summary!.by_endpoint.map((row) => (
              <div
                key={row.endpoint_id}
                className="flex items-center justify-between gap-2 rounded border border-gray-200 dark:border-gray-700 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {endpointNameById.get(row.endpoint_id) ??
                      `Endpoint #${row.endpoint_id}`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {sprintf(__("%d buried", "yatra"), row.count)}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    bulkReplay.mutate({
                      filter: {
                        endpoint_id: row.endpoint_id,
                        status: "permanent_failure",
                      },
                    })
                  }
                  disabled={bulkReplay.isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  {__("Replay all", "yatra")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {__("By event", "yatra")}
            </CardTitle>
            <CardDescription>
              {__("Event types failing most.", "yatra")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary!.by_event.length === 0 && (
              <p className="text-xs text-gray-500">{__("None.", "yatra")}</p>
            )}
            {summary!.by_event.map((row) => (
              <div
                key={row.event_key}
                className="flex items-center justify-between gap-2 rounded border border-gray-200 dark:border-gray-700 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-mono text-gray-900 dark:text-white truncate">
                    {row.event_key || __("(unknown)", "yatra")}
                  </div>
                  <div className="text-xs text-gray-500">
                    {sprintf(__("%d buried", "yatra"), row.count)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {__("By error", "yatra")}
            </CardTitle>
            <CardDescription>
              {__("Grouped by error-message prefix.", "yatra")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary!.by_error.length === 0 && (
              <p className="text-xs text-gray-500">{__("None.", "yatra")}</p>
            )}
            {summary!.by_error.map((row, idx) => (
              <div
                key={`${row.fingerprint}-${idx}`}
                className="rounded border border-gray-200 dark:border-gray-700 px-3 py-2"
              >
                <div className="text-xs text-gray-700 dark:text-gray-300 break-words">
                  {row.fingerprint}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {sprintf(__("%d buried", "yatra"), row.count)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent buried — selectable, with per-row Inspect + Replay */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                {__("Recent buried", "yatra")}
              </CardTitle>
              <CardDescription>
                {sprintf(
                  /* translators: %d: number of recent rows shown */
                  __("Last %d deliveries in permanent failure.", "yatra"),
                  summary!.recent.length,
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <span className="text-sm text-gray-500">
                  {sprintf(
                    /* translators: %d: number selected */
                    __("%d selected", "yatra"),
                    selectedIds.size,
                  )}
                </span>
              )}
              <Button
                onClick={() =>
                  bulkReplay.mutate({ ids: Array.from(selectedIds) })
                }
                disabled={selectedIds.size === 0 || bulkReplay.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                {__("Replay selected", "yatra")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size > 0 &&
                        selectedIds.size === summary!.recent.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(
                            new Set(summary!.recent.map((r) => r.id)),
                          );
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    {__("Event", "yatra")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    {__("Endpoint", "yatra")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    {__("Attempts", "yatra")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    {__("Error", "yatra")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    {__("When", "yatra")}
                  </th>
                  <th className="px-3 py-2 w-32 text-right font-medium text-gray-700 dark:text-gray-300">
                    {__("Actions", "yatra")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {summary!.recent.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={(e) => {
                          const next = new Set(selectedIds);
                          if (e.target.checked) next.add(row.id);
                          else next.delete(row.id);
                          setSelectedIds(next);
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-900 dark:text-white">
                      {row.event_key}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {endpointNameById.get(row.endpoint_id) ??
                        `#${row.endpoint_id}`}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {row.attempts}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 max-w-md truncate">
                      <Tooltip content={row.error_message ?? ""}>
                        <span>{row.error_message ?? __("—", "yatra")}</span>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                      {row.created_at}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setInspectId(row.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => bulkReplay.mutate({ ids: [row.id] })}
                          disabled={bulkReplay.isPending}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <DeliveryInspectDialog
        id={inspectId}
        onClose={() => setInspectId(null)}
      />
    </div>
  );
};

const StatusBadge: React.FC<{ status: string; httpStatus: number | null }> = ({
  status,
  httpStatus,
}) => {
  const cfg: Record<string, { cls: string; label: string }> = {
    queued: {
      cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      label: __("Queued", "yatra"),
    },
    delivering: {
      cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
      label: __("Delivering", "yatra"),
    },
    delivered: {
      cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      label: __("Delivered", "yatra"),
    },
    failed: {
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      label: __("Failed", "yatra"),
    },
    permanent_failure: {
      cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      label: __("Failed (final)", "yatra"),
    },
  };
  const x = cfg[status] ?? {
    cls: "bg-gray-100 text-gray-700",
    label: status,
  };
  return (
    <Badge className={x.cls}>
      {x.label}
      {httpStatus !== null ? ` (${httpStatus})` : ""}
    </Badge>
  );
};

/* -------------------------------------------------------------------------- */
/*  Delivery inspect — full payload + response viewer ("listen mode")         */
/* -------------------------------------------------------------------------- */

const DeliveryInspectDialog: React.FC<{
  id: number | null;
  onClose: () => void;
}> = ({ id, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["webhooks-delivery", id],
    queryFn: () => webhooksApi.getDelivery(id!),
    enabled: id !== null,
    // Auto-refetch while the row hasn't reached a terminal status.
    // Ensures the inspector reflects "queued → delivering → delivered"
    // live, which matters most right after a Ping click.
    refetchInterval: (q) => {
      const status = (
        q.state.data as { data?: { status?: string } } | undefined
      )?.data?.status;
      const terminal = status === "delivered" || status === "permanent_failure";
      return terminal ? false : 2000;
    },
  });

  const replay = useMutation({
    mutationFn: (deliveryId: number) => webhooksApi.replayDelivery(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["webhooks-delivery", id] });
      showToast(__("Delivery re-queued.", "yatra"), "success");
    },
    onError: (e: any) => showToast(extractError(e), "error"),
  });

  if (id === null) return null;

  const delivery = data?.data;
  const payloadJson = delivery ? JSON.stringify(delivery.payload, null, 2) : "";

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-500" />
          {__("Delivery inspector", "yatra")}
        </div>
      }
      size="xl"
      hideFooter={false}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {__("Close", "yatra")}
          </Button>
          {delivery &&
            (delivery.status === "failed" ||
              delivery.status === "permanent_failure") && (
              <Button
                onClick={() => replay.mutate(delivery.id)}
                disabled={replay.isPending}
              >
                {replay.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    {__("Replaying…", "yatra")}
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    {__("Replay delivery", "yatra")}
                  </>
                )}
              </Button>
            )}
        </div>
      }
    >
      {isLoading || !delivery ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field
              label={__("Event", "yatra")}
              value={delivery.event_key}
              mono
            />
            <Field
              label={__("Delivery ID", "yatra")}
              value={delivery.delivery_id}
              mono
            />
            <Field
              label={__("Status", "yatra")}
              raw={
                <StatusBadge
                  status={delivery.status}
                  httpStatus={delivery.http_status}
                />
              }
            />
            <Field
              label={__("Attempts", "yatra")}
              value={String(delivery.attempts)}
            />
            <Field
              label={__("Created", "yatra")}
              value={new Date(delivery.created_at).toLocaleString()}
            />
            <Field
              label={__("Delivered", "yatra")}
              value={
                delivery.delivered_at
                  ? new Date(delivery.delivered_at).toLocaleString()
                  : "—"
              }
            />
            {delivery.duration_ms !== null && (
              <Field
                label={__("Duration", "yatra")}
                value={`${delivery.duration_ms} ms`}
              />
            )}
            {delivery.next_attempt_at && (
              <Field
                label={__("Next attempt", "yatra")}
                value={new Date(delivery.next_attempt_at).toLocaleString()}
              />
            )}
          </div>

          {delivery.error_message && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-3 text-sm text-red-700 dark:text-red-400">
              <strong className="block mb-1">{__("Error", "yatra")}</strong>
              {delivery.error_message}
            </div>
          )}

          {/* Payload sent */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm font-semibold">
                {__("Payload sent", "yatra")}
              </Label>
              <CopyButton text={payloadJson} />
            </div>
            <pre className="bg-gray-900 text-gray-100 dark:bg-black rounded-md p-4 text-xs font-mono overflow-auto max-h-96">
              {payloadJson}
            </pre>
          </div>

          {/* Response body */}
          {delivery.response_body && (
            <div>
              <Label className="text-sm font-semibold mb-1 block">
                {__("Response body", "yatra")}
              </Label>
              <pre className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 text-xs font-mono overflow-auto max-h-48">
                {delivery.response_body}
              </pre>
            </div>
          )}

          {/* Response headers */}
          {delivery.response_headers && (
            <div>
              <Label className="text-sm font-semibold mb-1 block">
                {__("Response headers", "yatra")}
              </Label>
              <pre className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 text-xs font-mono overflow-auto max-h-32">
                {delivery.response_headers}
              </pre>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

const Field: React.FC<{
  label: string;
  value?: string;
  mono?: boolean;
  raw?: React.ReactNode;
}> = ({ label, value, mono, raw }) => (
  <div>
    <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    <div
      className={`text-sm text-gray-900 dark:text-white ${mono ? "font-mono" : ""}`}
    >
      {raw ?? value ?? "—"}
    </div>
  </div>
);

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch (_e) {}
      }}
    >
      {copied ? (
        <>
          <Check className="mr-1 h-3 w-3" />
          {__("Copied", "yatra")}
        </>
      ) : (
        <>
          <Copy className="mr-1 h-3 w-3" />
          {__("Copy", "yatra")}
        </>
      )}
    </Button>
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

export default Webhooks;
