/**
 * Role-aware Dashboard for non-administrator team members.
 *
 * The main Dashboard at `/pages/Dashboard.tsx` is built around the
 * assumption that the operator can see everything — every KPI card,
 * every chart, every widget. For a granular role like Accountant,
 * Sales Agent, or Guide, that assumption breaks down: most of the
 * widgets render empty (no cap → nothing) and the page looks like
 * a half-loaded skeleton.
 *
 * This component takes the opposite approach: instead of starting
 * from the full layout and hiding what the user can't see, it starts
 * from the role's caps and builds a compact, focused dashboard
 * tailored to what that role actually does day-to-day.
 *
 * Routing:
 *   `Dashboard.tsx` detects `!window.yatraAdmin.isWpAdmin` and
 *   delegates to this component. WP administrators always get the
 *   full Dashboard (they should see everything they own).
 *
 * Layout philosophy:
 *   - Welcome hero with the user's name + their role label + a clear
 *     "this is what you can do" framing.
 *   - 2–3 high-signal KPIs sized for the role's day-to-day decisions.
 *   - Two-column main area: a recent-activity widget the role cares
 *     about most + a secondary widget.
 *   - Quick-action buttons that link to the pages the role can access.
 *
 * No upsell, no "you don't have access to this" messages — the
 * Yatra menu already cap-gates pages, the API already cap-gates
 * mutations. This page just tells the user what they CAN do, not
 * what they can't.
 *
 * @since 3.5.0
 */

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  DollarSign,
  Users,
  Plane,
  TrendingUp,
  CheckCircle,
  Mail,
  MessageSquare,
  CreditCard,
  BarChart3,
  RotateCcw,
  Shield,
  ArrowRight,
} from "lucide-react";
import { __, sprintf, brandName } from "../lib/i18n";
import { StatCard } from "../components/common/StatCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { RecentBookings } from "../components/dashboard/RecentBookings";
import { UpcomingDepartures } from "../components/dashboard/UpcomingDepartures";
import { PendingPayments } from "../components/dashboard/PendingPayments";
import { apiClient } from "../lib/api-client";
import {
  formatYatraMoney,
  readYatraCurrencyPositionFromWindow,
} from "../lib/currency-display";
import { canCap } from "../hooks/useCapabilities";
import { navigateMenu } from "../hooks/useNavigate";

/**
 * Resolve the user's primary Yatra role label from window.yatraAdmin.
 * Looks at `roles` (array of WP role slugs) for any `yatra_*` entry,
 * then maps to a human label.
 */
function getPrimaryRoleLabel(): { slug: string; label: string } {
  const roles = (window.yatraAdmin as { roles?: string[] } | undefined)?.roles;
  if (!Array.isArray(roles))
    return { slug: "", label: __("Team member", "yatra") };

  // Yatra system roles, in priority order — first match wins. Display
  // labels mirror RoleProvisioner::roleLabels() so the front-end UX
  // stays consistent with the server-side role bundle.
  const systemRoles: Array<{ slug: string; label: string }> = [
    { slug: "yatra_owner", label: __("Owner", "yatra") },
    { slug: "yatra_manager", label: __("Manager", "yatra") },
    { slug: "yatra_sales_agent", label: __("Sales Agent", "yatra") },
    { slug: "yatra_front_desk", label: __("Front Desk", "yatra") },
    { slug: "yatra_guide", label: __("Guide", "yatra") },
    { slug: "yatra_accountant", label: __("Accountant", "yatra") },
    { slug: "yatra_marketing", label: __("Marketing", "yatra") },
    { slug: "yatra_auditor", label: __("Auditor", "yatra") },
  ];
  for (const candidate of systemRoles) {
    if (roles.includes(candidate.slug)) return candidate;
  }
  // Custom yatra_* role — humanize the slug.
  const custom = roles.find((r) => r.startsWith("yatra_"));
  if (custom) {
    const label = custom
      .replace(/^yatra_/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { slug: custom, label };
  }
  return { slug: "", label: __("Team member", "yatra") };
}

const RoleDashboard: React.FC = () => {
  const role = useMemo(() => getPrimaryRoleLabel(), []);
  const displayName =
    (window.yatraAdmin as { currentUserDisplayName?: string } | undefined)
      ?.currentUserDisplayName || __("there", "yatra");

  const defaultCurrency =
    (window as { yatraAdmin?: { currency?: string } })?.yatraAdmin?.currency ||
    "USD";
  const currencyPosition = readYatraCurrencyPositionFromWindow();
  const currencyDecimalsRaw = window.yatraAdmin as
    | { decimalPlaces?: number; currency_decimals?: number }
    | undefined;
  const currencyDecimals = Number.isFinite(
    Number(
      currencyDecimalsRaw?.decimalPlaces ??
        currencyDecimalsRaw?.currency_decimals,
    ),
  )
    ? Number(
        currencyDecimalsRaw?.decimalPlaces ??
          currencyDecimalsRaw?.currency_decimals,
      )
    : 2;

  const formatCurrencyAmount = (amount: number) =>
    formatYatraMoney(Number(amount) || 0, defaultCurrency, {
      zeroAsUnknown: false,
    });

  // --- Cap-gated queries -------------------------------------------------
  // Only fetch what the user can actually see. `enabled` skips the
  // request when the cap isn't held, so we never spam the API with
  // requests that would 403 anyway.

  const { data: bookingStats, isLoading: bookingStatsLoading } = useQuery({
    queryKey: ["role-dashboard-booking-stats"],
    queryFn: async () => {
      const response = await apiClient.get("/bookings/stats");
      return response?.data ?? response ?? {};
    },
    enabled: canCap("yatra_view_bookings"),
  });

  const { data: reportData } = useQuery({
    queryKey: ["role-dashboard-reports"],
    queryFn: async () => {
      const response = await apiClient.get("/reports");
      return response?.data ?? response ?? {};
    },
    enabled:
      canCap("yatra_view_financial_reports") ||
      canCap("yatra_view_operational_reports"),
    staleTime: 60_000,
  });

  const recentBookings = useMemo(
    () =>
      (bookingStats as { recent_bookings?: any[] } | undefined)
        ?.recent_bookings || [],
    [bookingStats],
  );

  const { data: departures } = useQuery({
    queryKey: ["role-dashboard-departures"],
    queryFn: async () => {
      const response = await apiClient.get("/departures/upcoming");
      return response?.data ?? response ?? [];
    },
    enabled: canCap("yatra_view_departures"),
  });

  const { data: pendingPayments } = useQuery({
    queryKey: ["role-dashboard-pending-payments"],
    queryFn: async () => {
      const response = await apiClient.get("/payments/pending");
      return response?.data ?? response ?? [];
    },
    enabled: canCap("yatra_view_financial_reports"),
  });

  // --- Quick actions ------------------------------------------------------
  // Each action declares the cap it needs. Filtered at render time.
  const quickActions: Array<{
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    cap: string;
    onClick: () => void;
  }> = [
    {
      label: __("Bookings", "yatra"),
      icon: Calendar,
      cap: "yatra_view_bookings",
      onClick: () => navigateMenu("bookings"),
    },
    {
      label: __("Enquiries", "yatra"),
      icon: MessageSquare,
      cap: "yatra_view_enquiries",
      onClick: () => navigateMenu("enquiries"),
    },
    {
      label: __("Departures", "yatra"),
      icon: Plane,
      cap: "yatra_view_departures",
      onClick: () => navigateMenu("departures"),
    },
    {
      label: __("Customers", "yatra"),
      icon: Users,
      cap: "yatra_view_customers",
      onClick: () => navigateMenu("customers"),
    },
    {
      label: __("Payments", "yatra"),
      icon: CreditCard,
      cap: "yatra_view_financial_reports",
      onClick: () => navigateMenu("payments"),
    },
    {
      label: __("Reports", "yatra"),
      icon: BarChart3,
      cap: "yatra_view_operational_reports",
      onClick: () => navigateMenu("reports"),
    },
    {
      label: __("Email Campaigns", "yatra"),
      icon: Mail,
      cap: "yatra_manage_email_automation",
      onClick: () => navigateMenu("email-automation"),
    },
    {
      label: __("Audit Log", "yatra"),
      icon: Shield,
      cap: "yatra_view_audit_log",
      onClick: () => navigateMenu("team", { tab: "audit" }),
    },
  ];
  const visibleActions = quickActions.filter((a) => canCap(a.cap));

  // --- Stat cards --------------------------------------------------------
  // Same cap-gating pattern. Each card declares which cap it needs and
  // we render only the ones the user can see. Layout adapts: 2-col on
  // small viewports, 3-col on large.

  const showBookingsCount = canCap("yatra_view_bookings");
  const showBookedRevenue = canCap("yatra_view_financial_reports");
  const showCollectedRevenue = canCap("yatra_view_financial_reports");
  const showConversion = canCap("yatra_view_operational_reports");
  const showOccupancy = canCap("yatra_view_operational_reports");

  return (
    <div className="space-y-5">
      {/* HERO — role-aware welcome */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:border-blue-800 dark:from-blue-900/20 dark:via-gray-900 dark:to-indigo-900/20">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {__("Welcome back,", "yatra")} {displayName}.
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                  {__("You're signed in as", "yatra")}{" "}
                  <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 ml-1">
                    {role.label}
                  </Badge>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    {__(
                      "Your dashboard is tailored to the surfaces your role can access.",
                      "yatra",
                    )}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QUICK ACTIONS — link grid to pages the user can access */}
      {visibleActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {__("Quick actions", "yatra")}
            </CardTitle>
            <CardDescription>
              {__(
                "Jump straight to the surfaces you use most. Filtered to what your role can open.",
                "yatra",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {visibleActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:border-blue-700 dark:hover:bg-blue-900/10 transition-colors text-left group"
                  >
                    <div className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {action.label}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 ml-auto flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI strip — adaptive grid based on how many cards the role can see */}
      {(showBookingsCount ||
        showBookedRevenue ||
        showCollectedRevenue ||
        showConversion ||
        showOccupancy) && (
        <div
          className={`grid gap-3 ${
            [
              showBookingsCount,
              showBookedRevenue,
              showCollectedRevenue,
              showConversion,
              showOccupancy,
            ].filter(Boolean).length >= 4
              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {showBookingsCount && (
            <StatCard
              title={__("Bookings", "yatra")}
              value={
                (bookingStats as { total?: number } | undefined)?.total ?? 0
              }
              icon={Calendar}
              color="green"
              loading={bookingStatsLoading}
              onClick={() => navigateMenu("bookings")}
            />
          )}
          {showBookedRevenue && (
            <StatCard
              title={__("Booked Revenue", "yatra")}
              value={formatCurrencyAmount(
                (bookingStats as { total_revenue?: number } | undefined)
                  ?.total_revenue || 0,
              )}
              icon={DollarSign}
              color="purple"
              loading={bookingStatsLoading}
              tooltip={__(
                "Total value of confirmed bookings — gross, before refunds.",
                "yatra",
              )}
              onClick={() => navigateMenu("payments")}
            />
          )}
          {showCollectedRevenue && (
            <StatCard
              title={__("Collected Revenue", "yatra")}
              value={formatCurrencyAmount(
                (bookingStats as { total_collected?: number } | undefined)
                  ?.total_collected || 0,
              )}
              icon={DollarSign}
              color="green"
              loading={bookingStatsLoading}
              tooltip={__(
                "Cash already received — actually in your accounts.",
                "yatra",
              )}
              onClick={() => navigateMenu("payments")}
            />
          )}
          {showConversion && (
            <StatCard
              title={__("Conversion", "yatra")}
              value={`${Number(
                (
                  reportData as
                    | { booking_stats?: { conversionRate?: number } }
                    | undefined
                )?.booking_stats?.conversionRate || 0,
              ).toFixed(1)}%`}
              icon={TrendingUp}
              color="blue"
              tooltip={__(
                "Share of bookings that landed in confirmed or completed.",
                "yatra",
              )}
            />
          )}
          {showOccupancy && (
            <StatCard
              title={__("Occupancy", "yatra")}
              value={`${Number(
                (
                  reportData as
                    | { operational_stats?: { occupancyRate?: number } }
                    | undefined
                )?.operational_stats?.occupancyRate || 0,
              ).toFixed(1)}%`}
              icon={CheckCircle}
              color="orange"
              tooltip={__(
                "Booked seats vs total seats across upcoming departures.",
                "yatra",
              )}
            />
          )}
        </div>
      )}

      {/* Main two-column area — only render columns with visible widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="space-y-3 lg:col-span-7">
          {canCap("yatra_view_bookings") &&
            (bookingStatsLoading ? (
              <Card>
                <CardContent className="p-4">
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ) : (
              <RecentBookings
                bookings={recentBookings || []}
                loading={bookingStatsLoading}
                onView={(booking) =>
                  navigateMenu("bookings", {
                    action: "view",
                    id: String(booking.id),
                  })
                }
              />
            ))}
        </div>

        <div className="space-y-3 lg:col-span-5">
          {canCap("yatra_view_departures") && (
            <UpcomingDepartures departures={departures || []} loading={false} />
          )}
          {canCap("yatra_view_financial_reports") && (
            <PendingPayments payments={pendingPayments || []} loading={false} />
          )}
        </div>
      </div>

      {/* Empty state — when the role can't see any widget at all (rare,
       *  e.g. Marketing with no booking access). Fall back to a helpful
       *  pointer rather than an empty page. */}
      {visibleActions.length === 0 &&
        !showBookingsCount &&
        !showBookedRevenue &&
        !showConversion && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <RotateCcw className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {__("Your role doesn't expose dashboard widgets yet.", "yatra")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                {sprintf(
                  /* translators: %s: brand name */
                  __(
                    "Talk to your account owner — they can grant additional capabilities to your user from %s → Team & Access.",
                    "yatra",
                  ),
                  brandName(),
                )}
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default RoleDashboard;
