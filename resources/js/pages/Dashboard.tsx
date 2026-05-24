/**
 * Dashboard Page — redesigned 3.0.5
 *
 * Layout principles:
 *
 *   - One header row: page title + date-range picker. Welcome card is
 *     dismissible (state stored in localStorage so the operator doesn't
 *     see it every time after onboarding).
 *
 *   - KPI strip: five high-signal cards in a single row with period-
 *     over-period deltas from `/reports`. Removes the duplicate
 *     "Pending Bookings" card the old design had at top + side, and
 *     adds tooltips for the confusable "Booked vs Collected Revenue"
 *     pair operators routinely conflate.
 *
 *   - Main grid: charts on the left (Bookings Overview + Status +
 *     Destinations), operational widgets on the right (Upcoming
 *     Departures, Pending Payments).
 *
 *   - Tertiary: Recent Bookings + Quick Actions full-width at the
 *     bottom. Quick Actions also surface as compact icon buttons in
 *     the page header for faster access from anywhere on the page.
 *
 *   - AI Today's Brief is gated on AI module enabled (see
 *     TodaysBriefCard.tsx) — never renders a "buy AI" upsell.
 */

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Plane,
  TrendingUp,
  Activity,
  CheckCircle,
  Plus,
  X,
} from "lucide-react";
import { __ } from "../lib/i18n";
import { usePermissions } from "../hooks/usePermissions";
import { TodaysBriefCard } from "../components/ai/TodaysBriefCard";
import { StatCard } from "../components/common/StatCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ConditionalRender } from "../components/ui/conditional-render";
import { Skeleton } from "../components/ui/skeleton";
import { SimpleBarChart } from "../components/charts/SimpleBarChart";
import BookingsOverviewChart from "../components/charts/BookingsOverviewChart";
import BookingStatusChart from "../components/charts/BookingStatusChart";
import { UpcomingDepartures } from "../components/dashboard/UpcomingDepartures";
import { PendingPayments } from "../components/dashboard/PendingPayments";
import { RecentBookings } from "../components/dashboard/RecentBookings";
import RoleDashboard from "./RoleDashboard";
import { apiClient } from "../lib/api-client";
import {
  formatYatraMoney,
  readYatraCurrencyPositionFromWindow,
} from "../lib/currency-display";

// ---------------------------------------------------------------------------
// Date-range presets
//
// Same options as the Reports page so operators learn the model once.
// Stored in state so the rest of the dashboard can scope its queries to
// the picked window. The "all_time" option keeps backwards-compat with
// the previous Dashboard behaviour (no date scoping) — it's the
// default until the operator picks something else.
// ---------------------------------------------------------------------------

type DashboardRange =
  | "all_time"
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "this_year";

// Translatable labels for the date-range presets.
// gettext extractors only pick up calls where the msgid is a literal,
// so we wrap each label inside `__()` directly here rather than store
// raw strings and translate them at the call site (which would emit
// `__(variable, ...)` — invisible to make-pot). Renders are still
// cheap; this function runs once per render of the <select>.
const rangeLabels = (): Record<DashboardRange, string> => ({
  all_time: __("All time", "yatra"),
  today: __("Today", "yatra"),
  last_7_days: __("Last 7 days", "yatra"),
  last_30_days: __("Last 30 days", "yatra"),
  last_90_days: __("Last 90 days", "yatra"),
  this_year: __("This year", "yatra"),
});

function getDateBounds(range: DashboardRange): { from?: string; to?: string } {
  if (range === "all_time") return {};
  const today = new Date();
  const start = new Date(today);
  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "last_7_days":
      start.setDate(today.getDate() - 7);
      break;
    case "last_30_days":
      start.setDate(today.getDate() - 30);
      break;
    case "last_90_days":
      start.setDate(today.getDate() - 90);
      break;
    case "this_year":
      start.setMonth(0, 1);
      break;
  }
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
  return { from: fmt(start), to: fmt(today) };
}

// ---------------------------------------------------------------------------
// Skeleton components
// ---------------------------------------------------------------------------

const SkeletonStatCard = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>
    </CardContent>
  </Card>
);

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

const WELCOME_DISMISSED_KEY = "yatra:dashboard:welcome-dismissed:v1";

const Dashboard: React.FC = () => {
  // Role-aware split: the full admin dashboard (charts, KPIs, ops widgets)
  // is built for site owners/managers. Non-admin team members (Sales,
  // Accountant, Guide, etc.) see a focused, cap-filtered RoleDashboard
  // instead — they shouldn't see KPI cards or charts they can't read.
  // The branch is intentionally before any hooks because `isWpAdmin` is
  // a stable, server-injected flag — the component never flips between
  // dashboards within a single mount, so hook order stays consistent.
  const isWpAdmin = (window.yatraAdmin as { isWpAdmin?: boolean } | undefined)
    ?.isWpAdmin;
  if (!isWpAdmin) {
    return <RoleDashboard />;
  }

  const { can } = usePermissions();

  const [range, setRange] = useState<DashboardRange>("all_time");
  const dateBounds = useMemo(() => getDateBounds(range), [range]);

  // Welcome card dismissal — sticky per browser. Operators see it once
  // during onboarding, then never again. localStorage instead of cookie
  // because dashboards aren't shared and the value never needs to
  // round-trip to the server.
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(WELCOME_DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const dismissWelcome = () => {
    setWelcomeDismissed(true);
    try {
      localStorage.setItem(WELCOME_DISMISSED_KEY, "1");
    } catch {
      /* private-mode browser; just no-persist */
    }
  };

  const defaultCurrency =
    (window as any)?.yatraAdmin?.currency ||
    (window as any)?.yatraBookingData?.currency ||
    "USD";

  const currencyPosition = readYatraCurrencyPositionFromWindow();
  const currencyDecimalsRaw =
    (window as any)?.yatraAdmin?.decimalPlaces ??
    (window as any)?.yatraAdmin?.currency_decimals ??
    (window as any)?.yatraBookingData?.decimalPlaces ??
    (window as any)?.yatraBookingData?.currency_decimals;
  const currencyDecimals = Number.isFinite(Number(currencyDecimalsRaw))
    ? Number(currencyDecimalsRaw)
    : 2;

  const formatCurrencyAmount = (amount: number) =>
    formatYatraMoney(Number(amount) || 0, defaultCurrency, {
      zeroAsUnknown: false,
    });

  // --- Data fetches -------------------------------------------------------

  // Booking stats (totals + by-status). Independent of the date filter
  // for now — endpoint doesn't yet honour date params. Date-aware
  // metrics come from /reports below.
  const { data: bookingStats, isLoading: bookingStatsLoading } = useQuery({
    queryKey: ["dashboard-booking-stats"],
    queryFn: async () => {
      const response = await apiClient.get("/bookings/stats");
      return response?.data ?? response ?? {};
    },
  });

  const { data: tripsSummary } = useQuery({
    queryKey: ["dashboard-trips-total"],
    queryFn: async () => {
      const response = await apiClient.get("/trips", {
        params: { per_page: 1 },
      });
      return { total: response?.total ?? 0 };
    },
    enabled: can("yatra_view_trips"),
  });

  const { data: customersSummary } = useQuery({
    queryKey: ["dashboard-customers-total"],
    queryFn: async () => {
      const response = await apiClient.get("/customers", {
        params: { per_page: 1 },
      });
      return { total: response?.total ?? 0 };
    },
    enabled: can("yatra_view_bookings"),
  });

  // Period-aware metrics via /reports. Only kicks in when the operator
  // picked a real range — "all_time" doesn't need a delta.
  const { data: reportData } = useQuery({
    queryKey: ["dashboard-reports", dateBounds.from, dateBounds.to],
    queryFn: async () => {
      const response = await apiClient.get("/reports", {
        params: {
          date_from: dateBounds.from,
          date_to: dateBounds.to,
        },
      });
      return response?.data ?? response ?? {};
    },
    enabled: !!dateBounds.from && !!dateBounds.to,
    staleTime: 60_000,
  });

  // Bookings chart — when a range is picked, prefer the /reports
  // `booking_trend` (already day-aligned + period-correct). Otherwise
  // fall back to the legacy 500-row aggregate.
  const { data: bookingsChartData } = useQuery({
    queryKey: ["dashboard-bookings-chart", range],
    queryFn: async () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");

      const response = await apiClient.get("/bookings", {
        params: { per_page: 500 },
      });

      const items: any[] = response?.data || [];
      const counts: Record<string, number> = {};
      const amounts: Record<string, number> = {};

      items.forEach((b) => {
        const dateStr = b.created_at || b.travel_date;
        const date = dateStr ? new Date(dateStr) : null;
        if (!date || Number.isNaN(date.getTime())) return;
        const ym = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
        counts[ym] = (counts[ym] || 0) + 1;
        const amount = Number(b.total_amount ?? 0) || 0;
        amounts[ym] = (amounts[ym] || 0) + amount;
      });

      const months: { label: string; count: number; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ym = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
        const label = d.toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        });
        months.push({
          label,
          count: counts[ym] || 0,
          amount: amounts[ym] || 0,
        });
      }

      return months;
    },
    enabled: can("yatra_view_bookings") && range === "all_time",
  });

  // Status breakdown — same /bookings/stats source.
  const statusData = useMemo(() => {
    const byStatus = (bookingStats as any)?.by_status || {};
    const getCount = (key: string) => {
      const entry = byStatus[key];
      if (!entry) return 0;
      const raw = (entry as any).count;
      const n = typeof raw === "string" ? parseInt(raw, 10) : Number(raw ?? 0);
      return Number.isNaN(n) ? 0 : n;
    };
    return [
      { label: __("Pending", "yatra"), value: getCount("pending"), color: "#f59e0b" },
      { label: __("Confirmed", "yatra"), value: getCount("confirmed"), color: "#10b981" },
      { label: __("Completed", "yatra"), value: getCount("completed"), color: "#3b82f6" },
      { label: __("Cancelled", "yatra"), value: getCount("cancelled"), color: "#ef4444" },
      { label: __("Refunded", "yatra"), value: getCount("refunded"), color: "#a855f7" },
    ];
  }, [bookingStats]);

  // Popular destinations — derived from trips list (still bounded by
  // 50; tracked in audit as a server-aggregate follow-up).
  const { data: destinationsData } = useQuery({
    queryKey: ["dashboard-destinations"],
    queryFn: async () => {
      const response = await apiClient.get("/trips", { params: { per_page: 50 } });
      const trips = response?.data || [];
      const counts: Record<string, number> = {};
      trips.forEach((trip: any) => {
        const destinations = trip.destinations || [];
        destinations.forEach((dest: any) => {
          const name = dest?.name || dest?.destination_name || "";
          if (!name) return;
          counts[name] = (counts[name] || 0) + 1;
        });
      });
      const palette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6"];
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value], index) => ({
          label: name,
          value,
          color: palette[index % palette.length],
        }));
    },
    enabled: can("yatra_view_trips"),
  });

  const { data: departures } = useQuery({
    queryKey: ["dashboard-upcoming-departures"],
    queryFn: async () => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const response = await apiClient.get("/departures", {
        params: {
          status: "upcoming",
          date_from: todayStr,
          include_past: false,
        },
      });
      const items = response?.data || [];
      return items.map((d: any) => {
        const tripTitle = d?.trip?.title || d?.trip_title || d?.title || "";
        const destination =
          (d?.trip?.destinations && d.trip.destinations[0]?.name) ||
          d?.destination ||
          undefined;
        const totalSpots =
          d?.total_spots ??
          d?.capacity ??
          d?.total_seats ??
          d?.max_travelers ??
          0;
        const availableSpots =
          d?.available_spots ??
          d?.available_seats ??
          d?.remaining_slots ??
          totalSpots - (d?.bookings_count || 0);
        return {
          id: d.id,
          trip_id: d.trip_id || d?.trip?.id,
          trip_title: tripTitle,
          departure_date: d.start_date || d.date || d.departure_date,
          available_spots: Number.isFinite(availableSpots) ? availableSpots : 0,
          total_spots: Number.isFinite(totalSpots) ? totalSpots : 0,
          status: d.status || "upcoming",
          destination,
        };
      });
    },
    enabled: can("yatra_view_trips"),
  });

  const { data: pendingPayments } = useQuery({
    queryKey: ["dashboard-pending-payments"],
    queryFn: async () => {
      const response = await apiClient.get("/payments", {
        params: { status: "pending", per_page: 5 },
      });
      return response?.data || [];
    },
    enabled: can("yatra_view_bookings"),
  });

  const { data: recentBookings } = useQuery({
    queryKey: ["dashboard-recent-bookings"],
    queryFn: async () => {
      const response = await apiClient.get("/bookings", { params: { per_page: 5 } });
      const items = response?.data || [];
      return items.map((b: any) => ({
        id: b.id,
        booking_id: b.reference || `BK-${b.id}`,
        customer_name: b.customer_name || b.contact_first_name || "",
        trip_title: b.trip_title || "",
        booking_date: b.created_at || b.travel_date || "",
        total_amount: b.total_amount ?? 0,
        status: (b.status || "pending") as
          | "confirmed"
          | "pending"
          | "cancelled"
          | "completed",
      }));
    },
    enabled: can("yatra_view_bookings"),
  });

  // Build trend props for KPI cards. Only present when a real range is
  // picked (period-over-period only makes sense against a comparable
  // window, not "all time").
  const trendLabel = `vs prev. ${range === "today" ? "day" : range === "this_year" ? "year" : range.replace("last_", "").replace("_", " ")}`;
  const revenueChange = Number((reportData as any)?.revenue_stats?.change ?? 0);
  const totalChange = Number((reportData as any)?.booking_stats?.totalChange ?? 0);
  const conversionChange = Number(
    (reportData as any)?.booking_stats?.conversionRateChange ?? 0,
  );
  const hasPeriodData = range !== "all_time" && !!reportData;

  // Navigate to a sub-page on the admin SPA.
  const goTo = (subpage: string, extras: Record<string, string> = {}) => {
    const admin = (window as any)?.yatraAdmin;
    const baseUrl = admin?.siteUrl || "";
    const qs = Object.entries(extras)
      .map(([k, v]) => `&${k}=${encodeURIComponent(v)}`)
      .join("");
    window.location.href = `${baseUrl}/wp-admin/admin.php?page=yatra&subpage=${subpage}${qs}`;
  };

  if (bookingStatsLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {__("Dashboard", "yatra")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {__("Operations overview at a glance.", "yatra")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range */}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as DashboardRange)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            aria-label={__("Date range", "yatra")}
          >
            {(() => {
              const labels = rangeLabels();
              return (Object.keys(labels) as DashboardRange[]).map((k) => (
                <option key={k} value={k}>
                  {labels[k]}
                </option>
              ));
            })()}
          </select>
          {/* Primary action — most common task on a travel dashboard
              is "I want to add a new trip". Surface it as a primary
              button so it's always one click away. */}
          <Button
            type="button"
            onClick={() => goTo("trips", { action: "add" })}
            className="inline-flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            {__("Add Trip", "yatra")}
          </Button>
        </div>
      </div>

      {/* ── AI BRIEF (renders nothing when module disabled) ─────────── */}
      <TodaysBriefCard />

      {/* ── WELCOME (dismissible) ──────────────────────────────────── */}
      {!welcomeDismissed && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Activity className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                    {__("Welcome to Yatra", "yatra")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {__(
                      "Real-time insights for your travel business. Monitor performance, track bookings, and manage operations from one place.",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissWelcome}
                className="rounded-md p-1 text-gray-500 transition-colors hover:bg-blue-100 hover:text-gray-700 dark:hover:bg-blue-900/30 dark:hover:text-gray-200"
                aria-label={__("Dismiss welcome message", "yatra")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── KPI STRIP ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <ConditionalRender capability="yatra_view_trips">
          <StatCard
            title={__("Total Trips", "yatra")}
            value={tripsSummary?.total || 0}
            icon={MapPin}
            color="blue"
            loading={!tripsSummary}
            onClick={() => goTo("trips")}
          />
        </ConditionalRender>

        <ConditionalRender capability="yatra_view_bookings">
          <StatCard
            title={__("Total Bookings", "yatra")}
            value={bookingStats?.total || 0}
            icon={Calendar}
            color="green"
            loading={bookingStatsLoading}
            trend={
              hasPeriodData
                ? {
                    value: totalChange,
                    isPositive: totalChange >= 0,
                    label: trendLabel,
                  }
                : undefined
            }
            onClick={() => goTo("bookings")}
          />
        </ConditionalRender>

        <ConditionalRender capability="yatra_view_financial_reports">
          <StatCard
            title={__("Booked Revenue", "yatra")}
            value={formatCurrencyAmount(bookingStats?.total_revenue || 0)}
            icon={DollarSign}
            color="purple"
            loading={bookingStatsLoading}
            tooltip={__(
              "Total value of confirmed bookings — the gross revenue you're entitled to. Not yet net of cancellations or refunds.",
              "yatra",
            )}
            trend={
              hasPeriodData
                ? {
                    value: revenueChange,
                    isPositive: revenueChange >= 0,
                    label: trendLabel,
                  }
                : undefined
            }
            onClick={() => goTo("payments")}
          />
        </ConditionalRender>

        <ConditionalRender capability="yatra_view_financial_reports">
          <StatCard
            title={__("Collected Revenue", "yatra")}
            value={formatCurrencyAmount(bookingStats?.total_collected || 0)}
            icon={DollarSign}
            color="green"
            loading={bookingStatsLoading}
            tooltip={__(
              "Cash already received — what's actually in your accounts. The gap between Booked and Collected is your accounts-receivable (pending payments + scheduled instalments).",
              "yatra",
            )}
            onClick={() => goTo("payments")}
          />
        </ConditionalRender>

        <ConditionalRender capability="yatra_view_customers">
          <StatCard
            title={__("Total Customers", "yatra")}
            value={customersSummary?.total || 0}
            icon={Users}
            color="orange"
            loading={!customersSummary}
            onClick={() => goTo("customers")}
          />
        </ConditionalRender>
      </div>

      {/* ── SECONDARY KPI ROW (period-aware) ────────────────────────── */}
      {/* These are operational + revenue indicators. Wrap each card in
       *  the appropriate cap — revenue-flavoured for finance roles
       *  (Accountant), conversion / occupancy / cancellation for
       *  operational roles (Sales Agent / Manager / Marketing). */}
      {hasPeriodData && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <ConditionalRender capability="yatra_view_operational_reports">
            <StatCard
              title={__("Conversion Rate", "yatra")}
              value={`${Number((reportData as any)?.booking_stats?.conversionRate || 0).toFixed(1)}%`}
              icon={TrendingUp}
              color="green"
              tooltip={__(
                "Share of bookings in this period that landed in a confirmed or completed state. Higher is better.",
                "yatra",
              )}
              trend={{
                value: conversionChange,
                isPositive: conversionChange >= 0,
                label: trendLabel,
              }}
            />
          </ConditionalRender>
          <ConditionalRender capability="yatra_view_financial_reports">
            <StatCard
              title={__("Avg Booking Value", "yatra")}
              value={formatCurrencyAmount(
                Number((reportData as any)?.revenue_stats?.average || 0),
              )}
              icon={DollarSign}
              color="purple"
              tooltip={__(
                "Mean revenue per booking in this period. A rising AOV with stable booking count is the cleanest growth signal.",
                "yatra",
              )}
            />
          </ConditionalRender>
          <ConditionalRender capability="yatra_view_operational_reports">
            <StatCard
              title={__("Occupancy Rate", "yatra")}
              value={`${Number((reportData as any)?.operational_stats?.occupancyRate || 0).toFixed(1)}%`}
              icon={Plane}
              color="blue"
              tooltip={__(
                "Booked seats / total seats across upcoming departures. Capacity utilisation indicator.",
                "yatra",
              )}
            />
          </ConditionalRender>
          <ConditionalRender capability="yatra_view_operational_reports">
            <StatCard
              title={__("Cancellation Rate", "yatra")}
              value={`${Number((reportData as any)?.booking_stats?.cancellationRate || 0).toFixed(1)}%`}
              icon={CheckCircle}
              color="red"
              tooltip={__(
                "Share of bookings that ended cancelled. Watch the trend — a spike usually points at a specific trip or timing issue.",
                "yatra",
              )}
            />
          </ConditionalRender>
        </div>
      )}

      {/* ── MAIN GRID: charts (left) + widgets (right) ──────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7">
          <ConditionalRender capability="yatra_view_bookings">
            <Card>
              <CardHeader>
                <CardTitle>{__("Bookings Overview", "yatra")}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <BookingsOverviewChart
                  data={bookingsChartData || []}
                  currency={defaultCurrency}
                  currencyPosition={currencyPosition}
                  currencyDecimals={currencyDecimals}
                />
              </CardContent>
            </Card>
          </ConditionalRender>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ConditionalRender capability="yatra_view_bookings">
              <Card>
                <CardHeader>
                  <CardTitle>{__("Booking Status", "yatra")}</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <BookingStatusChart data={statusData || []} />
                </CardContent>
              </Card>
            </ConditionalRender>

            <ConditionalRender capability="yatra_view_operational_reports">
              <Card>
                <CardHeader>
                  <CardTitle>{__("Popular Destinations", "yatra")}</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  {destinationsData && destinationsData.length > 0 ? (
                    <SimpleBarChart
                      data={destinationsData || []}
                      title=""
                      height={180}
                      showValues={true}
                    />
                  ) : (
                    <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      {__("No destination data yet.", "yatra")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </ConditionalRender>
          </div>

          <ConditionalRender capability="yatra_view_bookings">
            <RecentBookings
              bookings={recentBookings || []}
              loading={bookingStatsLoading}
              onView={(booking) => {
                goTo("bookings", { action: "view", id: String(booking.id) });
              }}
            />
          </ConditionalRender>
        </div>

        <div className="space-y-3 lg:col-span-5">
          <ConditionalRender capability="yatra_view_departures">
            <UpcomingDepartures
              departures={departures || []}
              loading={bookingStatsLoading}
            />
          </ConditionalRender>

          <ConditionalRender capability="yatra_view_financial_reports">
            <PendingPayments
              payments={pendingPayments || []}
              loading={bookingStatsLoading}
            />
          </ConditionalRender>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
