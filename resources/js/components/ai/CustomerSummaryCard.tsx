import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2, ShieldOff, Shield, RefreshCw } from "lucide-react";
import { __ } from "../../lib/i18n";
import { aiApi } from "../../api/ai-api";
import {
  isAiEligible,
  isAiModuleEnabled,
  isAiReady,
} from "../../lib/ai-availability";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

/**
 * 3-line AI-generated snapshot of a customer record, surfaced on the
 * ViewCustomer detail page. Renders only when the operator has the
 * AI Assistant module on + at least one provider configured (same
 * gate as every other AI affordance).
 *
 * The summary isn't auto-generated on page load — operators click
 * `Generate summary` so the page stays fast and the AI cost is
 * spent only when the operator actually wants the view. They can
 * opt-in to include sensitive PII (medical, dietary, notes) per
 * generation via a toggle — defaults to OFF so health data doesn't
 * leak to the LLM unless the operator clearly decides it should.
 */
interface Props {
  customerId: number;
}

export const CustomerSummaryCard: React.FC<Props> = ({ customerId }) => {
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  // Hard gate — don't render the card at all for non-eligible
  // tiers / unconfigured installs. Saves a visible empty section
  // on every customer page in the free / Personal tier.
  if (!isAiEligible() || !isAiModuleEnabled()) {
    return null;
  }

  const ready = isAiReady();

  const mutation = useMutation({
    mutationFn: () => aiApi.getCustomerSummary(customerId, includeSensitive),
    onSuccess: (resp) => {
      setSummary(String(resp.data?.text ?? "").trim());
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              {__("AI Customer Summary", "yatra")}
            </CardTitle>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {__(
                "A 3-line operator-facing snapshot — status, last trip, anything notable for ops.",
                "yatra",
              )}
            </p>
          </div>
          {!summary && (
            <Button
              type="button"
              size="sm"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !ready}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  {__("Generating…", "yatra")}
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  {__("Generate summary", "yatra")}
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!ready && (
          <div className="rounded-md border border-amber-200 bg-amber-50/40 p-3 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-200">
            {__(
              "Configure an AI provider key under Yatra → AI Assistant to enable this.",
              "yatra",
            )}
          </div>
        )}

        {/* Sensitive-data opt-in — defaults to OFF so health/dietary
            notes never reach the LLM unless the operator deliberately
            flips this for the run. Hidden once we have a result so
            it doesn't visually compete with the summary itself. */}
        {!summary && (
          <label className="flex cursor-pointer items-start gap-2 rounded-md border border-gray-200 p-2.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60">
            <input
              type="checkbox"
              checked={includeSensitive}
              onChange={(e) => setIncludeSensitive(e.target.checked)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
                {includeSensitive ? (
                  <Shield className="h-3.5 w-3.5 text-amber-500" />
                ) : (
                  <ShieldOff className="h-3.5 w-3.5 text-gray-400" />
                )}
                {__(
                  "Include sensitive fields (medical, dietary, notes)",
                  "yatra",
                )}
              </div>
              <div className="mt-0.5 text-gray-500 dark:text-gray-400">
                {__(
                  "Off by default. When on, the customer's health and preference details flow to the AI for this generation only.",
                  "yatra",
                )}
              </div>
            </div>
          </label>
        )}

        {mutation.isError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300">
            {(mutation.error as any)?.response?.data?.message ||
              (mutation.error as any)?.message ||
              __("AI request failed.", "yatra")}
          </div>
        )}

        {summary && (
          <div className="space-y-2">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-white">
              {summary}
            </p>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSummary(null);
                }}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <RefreshCw className="mr-1.5 h-3 w-3" />
                {__("Regenerate", "yatra")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerSummaryCard;
