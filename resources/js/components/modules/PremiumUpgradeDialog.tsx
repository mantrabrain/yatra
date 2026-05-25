import React from "react";
import { createPortal } from "react-dom";
import {
  Crown,
  X,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
  Play,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";

interface PremiumUpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  moduleName?: string;
  /** Module slug — used to pick module-specific bullet copy. */
  moduleSlug?: string;
  purchaseUrl?: string;
  moduleDescription?: string;
  /**
   * Required plan tier for this feature — drives the badge in the
   * header AND the CTA copy. When unset, the dialog falls back to
   * the generic "Yatra Pro" messaging.
   */
  requiredPlan?: "personal" | "growth" | "agency";
}

/**
 * Module-specific bullets shown in the "Key Features" list. Without
 * these we'd be stuck with the generic four-item placeholder
 * ("Advanced analytics and reporting", etc.) regardless of which
 * module the operator is looking at — confusing because the dialog
 * title already says "White Label" but the bullets say nothing about
 * branding.
 */
const MODULE_FEATURES: Record<string, string[]> = {
  white_label: [
    "Rebrand the plugin: name, logo, author, support URL",
    "Replace Yatra/MantraBrain references on plugin list + PDFs",
    "Custom admin menu labels, icons, ordering",
    "Custom brand color applied across the admin UI",
  ],
  "white-label": [
    "Rebrand the plugin: name, logo, author, support URL",
    "Replace Yatra/MantraBrain references on plugin list + PDFs",
    "Custom admin menu labels, icons, ordering",
    "Custom brand color applied across the admin UI",
  ],
  ai_assistant: [
    "Inline AI generation on trip descriptions, FAQs, SEO meta",
    "Multi-step agents for full trip + itinerary creation",
    "AI public chat widget on every single-trip page",
    "Bring your own OpenAI / Anthropic key — no per-call markup",
  ],
  "ai-assistant": [
    "Inline AI generation on trip descriptions, FAQs, SEO meta",
    "Multi-step agents for full trip + itinerary creation",
    "AI public chat widget on every single-trip page",
    "Bring your own OpenAI / Anthropic key — no per-call markup",
  ],
};

/**
 * Fallback bullets per plan tier when the module isn't in
 * MODULE_FEATURES yet. Tier-appropriate so a "Growth" module's
 * generic bullets don't accidentally mention Agency-only perks.
 */
const TIER_DEFAULT_FEATURES: Record<string, string[]> = {
  agency: [
    "Unlocks every premium module — Agency-tier and below",
    "Full white-label rebranding capability",
    "Priority support with faster response times",
    "All future Agency-tier features included",
  ],
  growth: [
    "Advanced operator-productivity features",
    "AI assistant for content + itinerary generation",
    "Priority support included",
    "All future Growth-tier features included",
  ],
  personal: [
    "Premium booking-system extensions",
    "Email automation + abandoned-recovery workflows",
    "Dynamic pricing + advanced discount tools",
    "All future Personal-tier features included",
  ],
};

export const PremiumUpgradeDialog: React.FC<PremiumUpgradeDialogProps> = ({
  open,
  onClose,
  moduleName,
  moduleSlug,
  purchaseUrl,
  moduleDescription,
  requiredPlan,
}) => {
  if (!open) return null;

  // Resolve the customer-facing plan name from the tier slug. The
  // header badge + footer CTA both consume this so the operator
  // sees one consistent answer to "which plan do I need?".
  const planLabel =
    requiredPlan === "agency"
      ? __("Agency plan", "yatra")
      : requiredPlan === "growth"
        ? __("Growth plan", "yatra")
        : requiredPlan === "personal"
          ? __("Personal plan", "yatra")
          : null;
  const planCtaLabel =
    requiredPlan === "agency"
      ? __("Upgrade to Agency", "yatra")
      : requiredPlan === "growth"
        ? __("Upgrade to Growth", "yatra")
        : requiredPlan === "personal"
          ? __("Upgrade to Personal", "yatra")
          : __("Upgrade to Pro", "yatra");
  const planFooterCopy =
    requiredPlan === "agency"
      ? __(
          "This feature is exclusive to the Agency plan. Upgrade to unlock it.",
          "yatra",
        )
      : requiredPlan === "growth"
        ? __(
            "This feature unlocks on the Growth plan (or Agency). Upgrade to enable it.",
            "yatra",
          )
        : requiredPlan === "personal"
          ? __(
              "This feature is included on every Pro plan. Upgrade to unlock it.",
              "yatra",
            )
          : __("Upgrade to Yatra Pro and unlock this feature today", "yatra");

  // Module-specific bullets first; fall back to tier-appropriate
  // defaults; finally fall back to the very generic Pro bullets so
  // the section never renders empty.
  const features: string[] = (moduleSlug && MODULE_FEATURES[moduleSlug]) ||
    (requiredPlan && TIER_DEFAULT_FEATURES[requiredPlan]) || [
      __("Advanced analytics and reporting", "yatra"),
      __("Automated workflows and notifications", "yatra"),
      __("Enhanced customer management tools", "yatra"),
      __("Priority support and updates", "yatra"),
    ];

  return createPortal(
    <div
      className="fixed top-0 left-0 right-0 bottom-0 m-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 pb-4"
      style={{
        zIndex: 999999,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div className="relative w-full max-w-5xl">
        {/* Subtle premium glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-orange-400/20 to-orange-500/20 rounded-2xl blur-2xl"></div>

        <Card className="relative w-full shadow-2xl border border-orange-300/80 dark:border-orange-700/50 bg-white dark:bg-slate-900 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Premium accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500"></div>

          <CardHeader className="relative pb-4 pt-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gradient-to-b from-orange-50/30 to-transparent dark:from-orange-950/20">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      {moduleName || __("Premium Feature", "yatra")}
                    </CardTitle>
                    {/* Plan-tier badge so the operator immediately
                        knows which license unlocks this. Without it the
                        generic "Premium Feature" copy was ambiguous —
                        Growth and Agency are both premium but cost
                        different amounts. */}
                    {planLabel && (
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-sm " +
                          (requiredPlan === "agency"
                            ? "bg-gradient-to-r from-purple-600 to-indigo-500"
                            : requiredPlan === "growth"
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                              : "bg-gradient-to-r from-blue-500 to-blue-600")
                        }
                      >
                        {requiredPlan === "growth" ? (
                          <Sparkles className="h-3 w-3" />
                        ) : (
                          <Crown className="h-3 w-3" />
                        )}
                        {planLabel}
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                    {moduleDescription ||
                      __(
                        "This feature requires Yatra Pro to unlock powerful premium capabilities.",
                        "yatra",
                      )}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden pt-6 px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Left Side - Module Description */}
              <div className="flex flex-col overflow-y-auto pr-3">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-500" />
                      {__("What This Module Does", "yatra")}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {moduleDescription ||
                        __(
                          "This premium module adds advanced functionality to your Yatra booking system, helping you grow your business and streamline operations.",
                          "yatra",
                        )}
                    </p>
                  </div>

                  {/* Feature List — module-specific bullets so the
                      operator sees exactly what they're getting, not
                      a generic placeholder list. */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      {__("Key Features", "yatra")}
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      {features.map((line, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Side - Video Preview */}
              <div className="flex flex-col">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Play className="w-4 h-4 text-orange-500" />
                    {__("See It In Action", "yatra")}
                  </h4>
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="text-center">
                      <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {__("Click to watch demo video", "yatra")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <div className="border-t border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {planFooterCopy}
                </p>
              </div>
              <Button
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200 group"
                onClick={() =>
                  window.open(
                    purchaseUrl || "https://wpyatra.com/pricing",
                    "_blank",
                  )
                }
              >
                <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                {planCtaLabel}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>,
    document.body,
  );
};
