import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  RefreshCw,
  Mail,
  CreditCard,
  Plane,
  Inbox,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import { aiApi, type AiDigest } from "../../api/ai-api";
import { isAiEligible, isAiModuleEnabled } from "../../lib/ai-availability";

/**
 * Dashboard "Today's Brief" — the most-visible piece of the operations
 * AI surface. Renders five distinct states cleanly:
 *
 *   1. `ready`            — AI-generated paragraph + metric pills
 *   2. `all_caught_up`    — green calm state, no LLM call needed
 *   3. `no_api_key`       — friendly CTA pointing at AI settings
 *   4. `module_disabled`  — CTA pointing at Modules page
 *   5. `upgrade_required` — soft upsell (Growth/Agency)
 *   6. `error`            — shows the error + a retry button
 *
 * Always renders the metric pills (real numbers, no LLM needed) so the
 * card has value even when AI is unavailable. The prose is bonus.
 */
const QUERY_KEY = ["ai-dashboard-digest"];

export const TodaysBriefCard: React.FC = () => {
  const queryClient = useQueryClient();

  // Skip rendering entirely when the operator can't or hasn't enabled
  // AI. Two gates, both must pass:
  //
  //   1. `isAiEligible()` — license tier unlocks AI at all. If false,
  //      the card would just redirect to an upgrade page and is noise
  //      for the operator.
  //
  //   2. `isAiModuleEnabled()` — the AI Assistant module is switched on
  //      under Modules. If false, the card previously rendered the
  //      whole gradient banner with an "Enable AI Assistant module..."
  //      CTA inside, which surprised operators who had explicitly
  //      decided not to enable AI. Hide it entirely instead — the
  //      Modules page itself is the right entry point for "I want to
  //      turn this on", not the dashboard.
  if (!isAiEligible() || !isAiModuleEnabled()) {
    return null;
  }

  const { data, isLoading, isError } = useQuery<{ data: AiDigest }>({
    queryKey: QUERY_KEY,
    queryFn: () => aiApi.getDashboardDigest(),
    staleTime: 15 * 60 * 1000, // matches server-side 30m cache; client refresh
  });

  const refresh = useMutation({
    mutationFn: () => aiApi.refreshDashboardDigest(),
    onSuccess: (resp) => {
      queryClient.setQueryData(QUERY_KEY, resp);
    },
  });

  if (isLoading) {
    return <SkeletonCard />;
  }

  const digest = data?.data;
  if (!digest) {
    return null;
  }

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-50 shadow-sm dark:border-blue-500/40 dark:from-blue-900/20 dark:to-blue-900/20">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-blue-600 p-1.5 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {__("Today's Brief", "yatra")}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">
              {digest.cached
                ? __(
                    "Last updated a few minutes ago — refreshes when something material changes.",
                    "yatra",
                  )
                : digest.generated_at
                  ? __("Just now", "yatra")
                  : __("Operations summary", "yatra")}
            </div>
          </div>
        </div>
        {digest.state === "ready" && (
          <button
            type="button"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            title={__("Regenerate brief", "yatra")}
            className="inline-flex items-center gap-1 rounded-md border border-transparent bg-white/70 px-2 py-1 text-xs text-blue-700 hover:bg-white dark:bg-gray-800/70 dark:text-blue-300 dark:hover:bg-gray-800"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refresh.isPending ? "animate-spin" : ""}`}
            />
            {__("Refresh", "yatra")}
          </button>
        )}
      </div>

      {/* Metric pills — always rendered, even when AI is unavailable */}
      <div className="grid grid-cols-2 gap-2 px-5 pb-3 sm:grid-cols-4">
        <MetricPill
          icon={Inbox}
          label={__("Unanswered enquiries", "yatra")}
          value={digest.metrics.enquiries_unresponded_count}
          tooltip={__(
            "How many enquiries are still waiting for a reply from the operator. Click to open the Enquiries list and respond.",
            "yatra",
          )}
          link="admin.php?page=yatra&subpage=enquiries"
        />
        <MetricPill
          icon={Mail}
          label={__("Longest wait (hrs)", "yatra")}
          value={digest.metrics.enquiries_oldest_waiting_hours}
          tooltip={__(
            "Hours the OLDEST unanswered enquiry has been waiting for a reply. A high number means at least one customer hasn't heard back for that long — answer it before it goes cold.",
            "yatra",
          )}
          tone="amber"
        />
        <MetricPill
          icon={CreditCard}
          label={__("Pending payments", "yatra")}
          value={digest.metrics.bookings_payment_pending_count}
          tooltip={__(
            "Bookings whose payment has not been received yet. Click to open the Payments page and follow up.",
            "yatra",
          )}
          link="admin.php?page=yatra&subpage=payments"
        />
        <MetricPill
          icon={Plane}
          label={__("Departing in 7d", "yatra")}
          value={digest.metrics.bookings_departing_soon_count}
          tooltip={__(
            "Bookings whose departure date falls within the next 7 days. Useful for last-minute prep — final reminders, group lists, paperwork.",
            "yatra",
          )}
          link="admin.php?page=yatra&subpage=departures"
        />
      </div>

      {/* Brief body */}
      <div className="border-t border-blue-100 bg-white/40 px-5 py-3 dark:border-blue-500/30 dark:bg-gray-900/30">
        {isError && (
          <BriefError onRetry={() => refresh.mutate()} retrying={refresh.isPending} />
        )}
        {!isError && (
          <BriefBody digest={digest} onRetry={() => refresh.mutate()} retrying={refresh.isPending} />
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Sub-renderers                                                             */
/* -------------------------------------------------------------------------- */

const BriefBody: React.FC<{
  digest: AiDigest;
  onRetry: () => void;
  retrying: boolean;
}> = ({ digest, onRetry, retrying }) => {
  if (digest.state === "all_caught_up") {
    return (
      <p className="text-sm text-emerald-700 dark:text-emerald-300">
        ✓ {__("You're caught up. Nothing urgent needs attention right now.", "yatra")}
      </p>
    );
  }

  if (digest.state === "upgrade_required") {
    return (
      <CtaLine
        message={__(
          "Today's Brief is part of the AI Assistant module — available on Growth and Agency plans.",
          "yatra",
        )}
        href="admin.php?page=yatra&subpage=license"
        label={__("View plans", "yatra")}
      />
    );
  }

  // The `module_disabled` state is unreachable here — the parent
  // <TodaysBriefCard> returns null before this body renders when the
  // module is off. Server may still send this state during a brief
  // race window between module toggle + client cache; treat it the
  // same as no-API-key (caller wants AI but something isn't ready).

  if (digest.state === "no_api_key") {
    return (
      <CtaLine
        message={__(
          "Add an OpenAI or Anthropic key to unlock the AI summary. Numbers above don't need a key.",
          "yatra",
        )}
        href="admin.php?page=yatra&subpage=ai-assistant"
        label={__("Open AI settings", "yatra")}
      />
    );
  }

  if (digest.state === "error") {
    return (
      <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex-1">
          <div>
            {__("Couldn't generate the brief.", "yatra")}{" "}
            {digest.error ? `(${digest.error})` : ""}
          </div>
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="mt-1 inline-flex items-center gap-1 rounded border border-red-200 px-2 py-0.5 text-xs hover:bg-red-50 dark:border-red-500/40 dark:hover:bg-red-900/20"
          >
            {retrying ? __("Retrying…", "yatra") : __("Retry", "yatra")}
          </button>
        </div>
      </div>
    );
  }

  // ready
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">
      {digest.text ||
        __("AI summary is empty for today — try refreshing.", "yatra")}
    </p>
  );
};

const BriefError: React.FC<{ onRetry: () => void; retrying: boolean }> = ({
  onRetry,
  retrying,
}) => (
  <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
    <div className="flex-1">
      <div>{__("Failed to load today's brief.", "yatra")}</div>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-1 inline-flex items-center gap-1 rounded border border-red-200 px-2 py-0.5 text-xs hover:bg-red-50 dark:border-red-500/40 dark:hover:bg-red-900/20"
      >
        {retrying ? __("Retrying…", "yatra") : __("Retry", "yatra")}
      </button>
    </div>
  </div>
);

const CtaLine: React.FC<{ message: string; href: string; label: string }> = ({
  message,
  href,
  label,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-700 dark:text-gray-200">
    <span>{message}</span>
    <a
      href={href}
      className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  </div>
);

const MetricPill: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "default" | "amber";
  link?: string;
  /** Hover hint — surfaces via `title=`, since the brief already has a
      lot of moving parts and a dedicated popover is overkill. */
  tooltip?: string;
}> = ({ icon: Icon, label, value, tone = "default", link, tooltip }) => {
  const n = parseInt(value, 10);
  const safe = Number.isFinite(n) ? n : 0;
  const accent =
    tone === "amber" && safe > 24
      ? "text-amber-700 dark:text-amber-300"
      : tone === "amber" && safe > 8
        ? "text-yellow-700 dark:text-yellow-300"
        : "text-gray-900 dark:text-white";

  const body = (
    <div
      className="flex items-center gap-2 rounded-md bg-white px-2.5 py-2 shadow-sm ring-1 ring-blue-100 hover:ring-blue-300 dark:bg-gray-900/60 dark:ring-blue-500/30"
      title={tooltip}
    >
      <Icon className="h-4 w-4 text-blue-500" />
      <div>
        <div className={`text-base font-semibold leading-none ${accent}`}>
          {safe.toLocaleString()}
        </div>
        <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </div>
      </div>
    </div>
  );

  if (link && safe > 0) {
    return (
      <a href={link} className="transition-transform hover:scale-[1.02]">
        {body}
      </a>
    );
  }
  return body;
};

const SkeletonCard: React.FC = () => (
  <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 animate-pulse rounded bg-blue-100 dark:bg-blue-900/40" />
      <div className="h-4 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-12 animate-pulse rounded bg-gray-100 dark:bg-gray-700"
        />
      ))}
    </div>
    <div className="mt-3 h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
    <div className="mt-1 h-4 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
  </div>
);

export default TodaysBriefCard;
