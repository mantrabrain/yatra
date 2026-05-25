/**
 * YATRA TRAVEL BOOKING REPORTS
 * Essential reports for travel booking businesses
 * Based on deep understanding of Yatra business model
 */

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { __ } from "../lib/i18n";
import { apiClient, apiService } from "../lib/api-client";
import { unwrapApiPayload } from "../lib/unwrap-api-payload";
import { useToast } from "../components/ui/toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import BookingsOverviewChart from "../components/charts/BookingsOverviewChart";
import BookingStatusChart from "../components/charts/BookingStatusChart";
import { formatYatraMoney } from "../lib/currency-display";
import {
  bucketSeries,
  bucketStatusSeries,
  buildCsv,
  csvFilename,
  downloadCsv,
  type SeriesPoint,
  type StatusPoint,
  type TrendView,
} from "../lib/report-series";
import { isModuleActive, isProPluginActive } from "../lib/plugin-utils";
import { canCap } from "../hooks/useCapabilities";

// Skeleton Loading Components
const SkeletonCard = () => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
      </div>
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
    </div>
  </Card>
);

const SkeletonReportSection = () => (
  <div className="space-y-4">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
        </div>
      ))}
    </div>
  </div>
);

// SVG Icons for Travel Reports
const SVGIcons = {
  Calendar: () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  DollarSign: () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
      />
    </svg>
  ),
  MapPin: () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  Truck: () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM21 17a2 2 0 11-4 0 2 2 0 014 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
      />
    </svg>
  ),
  Users: () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  Activity: () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  Facebook: () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  Google: () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  ),
  Target: () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  BarChart: () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  XCircle: () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

// Travel Business Report Categories
// Each category declares the capability that gates it. The Reports
// page filters this list by `usePermissions().can()` at render time
// so an Accountant only sees Revenue + Operational tabs, a Marketing
// role sees Customer + Operational + Pixel + GA, etc. Categories
// without a `cap` field are visible to anyone who can see Reports
// (the page itself is already gated at the sidebar layer).
const TravelReportCategories: Array<{
  id: string;
  title: string;
  icon: string;
  description: string;
  cap: string;
}> = [
  {
    id: "booking-overview",
    title: "Booking Overview",
    icon: "Calendar",
    description: "Booking volume, status distribution, trends",
    cap: "yatra_view_operational_reports",
  },
  {
    id: "revenue-analysis",
    title: "Revenue Analysis",
    icon: "DollarSign",
    description: "Revenue trends, payment status, profitability",
    cap: "yatra_view_financial_reports",
  },
  {
    id: "trip-performance",
    title: "Trip Performance",
    icon: "MapPin",
    description: "Trip popularity, occupancy rates, capacity utilization",
    cap: "yatra_view_operational_reports",
  },
  {
    id: "departure-management",
    title: "Departure Management",
    icon: "Truck",
    description: "Upcoming departures, capacity planning, scheduling",
    cap: "yatra_view_departures",
  },
  {
    id: "customer-insights",
    title: "Customer Insights",
    icon: "Users",
    description: "Customer behavior, retention, demographics",
    cap: "yatra_view_customers",
  },
  {
    id: "operational-metrics",
    title: "Operational Metrics",
    icon: "Activity",
    description: "Lead times, cancellations, efficiency metrics",
    cap: "yatra_view_operational_reports",
  },
  {
    id: "facebook-pixel",
    title: "Facebook Pixel",
    icon: "Facebook",
    description: "Conversion tracking, event analytics, pixel performance",
    cap: "yatra_view_operational_reports",
  },
  {
    id: "google-analytics",
    title: "Google Analytics 4",
    icon: "Google",
    description:
      "Enhanced e-commerce tracking, Measurement Protocol, visitor analytics",
    cap: "yatra_view_operational_reports",
  },
];

// Detailed Breakdown Chart Component
//
// REWRITE NOTE (3.0.5):
// The previous implementation fabricated daily/weekly/monthly values by
// multiplying period totals by a `seasonalFactor` so the chart "looked
// like" historical data. Operators were making decisions on numbers
// that didn't exist in the database. This version reads day-level
// trends straight from `/reports` (booking_trend / revenue_trend /
// occupancy_trend) and buckets them via `report-series.bucketSeries`
// when the operator picks Weekly or Monthly. The numbers always come
// from real bookings.
const DetailedBreakdownChart: React.FC<{
  viewType: string;
  dateRange: string;
  selectedCategory: string;
  reportData?: any;
}> = ({ viewType, selectedCategory, reportData }) => {
  const globalCurrency = (window as any)?.yatraAdmin?.currency || "USD";
  const formatCurrencyAmount = (amount: number) =>
    formatYatraMoney(Number(amount) || 0, globalCurrency, {
      zeroAsUnknown: false,
    });

  // Pick the right source series for the selected report category.
  // Each is already day-aligned and gap-filled by the backend.
  const sourceSeries: SeriesPoint[] = useMemo(() => {
    if (!reportData) return [];
    if (selectedCategory === "revenue-analysis") {
      return (reportData.revenue_trend as SeriesPoint[]) || [];
    }
    if (selectedCategory === "departure-management") {
      // occupancy_trend stores rate-per-day (already aggregated). For a
      // bar chart we want a comparable absolute (counts of departures),
      // so we derive from departures_table when present. Fall back to
      // booking_trend so the chart never goes empty.
      const dep = reportData.departures_table || [];
      if (Array.isArray(dep) && dep.length > 0) {
        const byDay = new Map<string, number>();
        for (const d of dep) {
          const date = (d?.date || "").slice(0, 10);
          if (!date) continue;
          byDay.set(date, (byDay.get(date) || 0) + 1);
        }
        return Array.from(byDay.entries()).map(([date, value]) => ({
          date,
          label: date,
          value,
        }));
      }
      return (reportData.booking_trend as SeriesPoint[]) || [];
    }
    return (reportData.booking_trend as SeriesPoint[]) || [];
  }, [reportData, selectedCategory]);

  // viewType can be "summary" (a synthetic UI option that maps to
  // "daily" for the chart) or any TrendView. Coerce defensively.
  const view: TrendView =
    viewType === "weekly" || viewType === "monthly" ? viewType : "daily";
  const bucketed = useMemo(
    () => bucketSeries(sourceSeries, view),
    [sourceSeries, view],
  );

  // Empty-state guard: the chart formerly fell back to fabricated
  // values; now we render an honest "no data" instead. Better the
  // operator sees the truth than a synthetic 12-bar chart.
  if (!reportData || bucketed.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        {__("No data in this period yet.", "yatra")}
      </div>
    );
  }

  // Find max for bar-width normalisation. Guard against zero.
  const maxValue = Math.max(1, ...bucketed.map((p) => p.value));
  const isRevenue = selectedCategory === "revenue-analysis";
  const isDepartures = selectedCategory === "departure-management";

  const barClass = isRevenue
    ? "bg-emerald-500"
    : isDepartures
      ? "bg-purple-500"
      : "bg-blue-500";

  const valueLabel = (v: number) =>
    isRevenue ? formatCurrencyAmount(v) : v.toLocaleString();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
          {isRevenue
            ? __("Revenue Trend", "yatra")
            : isDepartures
              ? __("Departures Trend", "yatra")
              : __("Bookings Trend", "yatra")}
        </h4>
      </div>

      {/* Bucketed bar chart — values are real data straight from the
          backend trend arrays. Bar widths normalised against the max
          in the bucketed set so a single outlier doesn't squash the
          rest into invisibility. */}
      <div className="space-y-2">
        {bucketed.map((item, index) => (
          <div
            key={`${item.date}-${index}`}
            className="flex items-center gap-2"
          >
            <div className="w-20 shrink-0 text-right text-xs text-gray-600 dark:text-gray-400">
              {item.label}
            </div>
            <div className="relative h-4 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                className={`flex h-4 items-center justify-end rounded-full pr-1.5 ${barClass}`}
                style={{
                  width: `${Math.max(2, (item.value / maxValue) * 100)}%`,
                }}
              >
                <span className="text-[11px] font-medium text-white">
                  {valueLabel(item.value)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 text-xs">
        <div className={`h-3 w-3 rounded ${barClass}`}></div>
        <span className="text-gray-600 dark:text-gray-400">
          {isRevenue
            ? __("Revenue", "yatra")
            : isDepartures
              ? __("Departures", "yatra")
              : __("Bookings", "yatra")}
        </span>
      </div>
    </div>
  );
};

// Detailed Breakdown Table Component
//
// REWRITE NOTE (3.0.5):
// Replaces the previous synthetic data path that:
//   - Fabricated daily/weekly/monthly bookings + revenue from period
//     totals * a `seasonalFactor`
//   - Made up confirmed/pending/cancelled splits (80/15/5 fixed ratio)
//   - Made up customer satisfaction (90 * factor), efficiency (85 *
//     factor), lead time (7..14 * inverse-factor)
//   - Cycled "topTrip" through trip_performance[i % 3] regardless of
//     which period the row represented
//
// New version reads four trend arrays from the backend, all day-aligned:
//   - booking_trend  : { date, label, value }   total bookings/day
//   - revenue_trend  : { date, label, value }   revenue/day
//   - status_trend   : { date, label, confirmed, pending, cancelled,
//                       completed }   per-day status split
//   - traveler_segments.trend : { date, label, value }   travellers/day
//
// We bucket those into the operator's selected view (daily/weekly/
// monthly) using report-series.bucketSeries / bucketStatusSeries and
// render only columns we can stand behind. Columns whose source data
// doesn't exist (customer satisfaction, efficiency, top-trip-per-
// period) are removed — better than rendering invented numbers.
const DetailedBreakdownTable: React.FC<{
  viewType: string;
  dateRange: string;
  selectedCategory: string;
  reportData: any;
}> = ({ viewType, selectedCategory, reportData }) => {
  // Suppress lints — these props are intentionally received for API
  // stability with the parent but the view bucket pipeline doesn't
  // need dateRange directly; backend already handed us the slice.
  // (Recovery of formatCurrencyAmount happens later in the component.)
  // viewType can be "summary" (UI-only) or a real TrendView. Coerce
  // anything that's not weekly/monthly to "daily" — same rule the
  // chart uses, so chart + table always agree on bucketing.
  const effectiveView: TrendView =
    viewType === "weekly" || viewType === "monthly" ? viewType : "daily";

  const bookingTrend: SeriesPoint[] =
    (reportData?.booking_trend as SeriesPoint[]) || [];
  const revenueTrend: SeriesPoint[] =
    (reportData?.revenue_trend as SeriesPoint[]) || [];
  const statusTrend: StatusPoint[] =
    (reportData?.status_trend as StatusPoint[]) || [];
  const occupancyTrend: SeriesPoint[] =
    (reportData?.occupancy_trend as SeriesPoint[]) || [];

  // Bucket each series identically so rows in the same bucket line up.
  const bookingsBucketed = bucketSeries(bookingTrend, effectiveView);
  const revenueBucketed = bucketSeries(revenueTrend, effectiveView);
  const statusBucketed = bucketStatusSeries(statusTrend, effectiveView);

  // For occupancy per period: we have a per-day rate (%), and rates
  // don't sum across days — they average. Recompute properly using
  // departures_table when bucketing.
  const departuresTable = (reportData?.departures_table as any[]) || [];
  type OccupancyAgg = { booked: number; capacity: number };
  const occByDay = new Map<string, OccupancyAgg>();
  for (const d of departuresTable) {
    const date = (d?.date || "").slice(0, 10);
    if (!date) continue;
    const acc = occByDay.get(date) || { booked: 0, capacity: 0 };
    acc.booked += Number(d?.bookedSeats ?? d?.booked ?? 0);
    acc.capacity += Number(d?.maxSeats ?? d?.capacity ?? 0);
    occByDay.set(date, acc);
  }
  // Same bucket-key strategy used by bucketSeries — re-derive labels.
  const occBookingSeries: SeriesPoint[] = Array.from(occByDay.entries()).map(
    ([date, agg]) => ({ date, label: date, value: agg.booked }),
  );
  const occCapacitySeries: SeriesPoint[] = Array.from(occByDay.entries()).map(
    ([date, agg]) => ({ date, label: date, value: agg.capacity }),
  );
  const occBookedBucketed = bucketSeries(occBookingSeries, effectiveView);
  const occCapacityBucketed = bucketSeries(occCapacitySeries, effectiveView);

  // Build the unified row set the table iterates. Each row carries
  // every field a category column might want; unsupported fields stay
  // null so the renderer can show "—" instead of a fabricated number.
  type Row = {
    period: string;
    fullDate: string;
    // Booking columns
    bookings: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    // Revenue
    revenue: number;
    avgBookingValue: number;
    // Trip performance
    occupancyRate: number;
    booked: number;
    capacity: number;
    // Departures
    departures: number;
  };
  const breakdownData: Row[] = bookingsBucketed.map((bRow, i) => {
    const rev = revenueBucketed[i]?.value ?? 0;
    const status = statusBucketed[i];
    const ob = occBookedBucketed.find((p) => p.label === bRow.label);
    const oc = occCapacityBucketed.find((p) => p.label === bRow.label);
    const bookedSeats = ob?.value ?? 0;
    const capacitySeats = oc?.value ?? 0;
    const occRate =
      capacitySeats > 0
        ? Math.round((bookedSeats / capacitySeats) * 1000) / 10
        : 0;
    return {
      period: bRow.label,
      fullDate: bRow.date,
      bookings: bRow.value,
      confirmed: status?.confirmed ?? 0,
      pending: status?.pending ?? 0,
      cancelled: status?.cancelled ?? 0,
      revenue: rev,
      avgBookingValue: bRow.value > 0 ? Math.round(rev / bRow.value) : 0,
      occupancyRate: occRate,
      booked: bookedSeats,
      capacity: capacitySeats,
      departures: capacitySeats > 0 ? 1 : 0, // count via departures_table when available
    };
  });

  // Restore departures count if departures_table has them by bucket.
  if (departuresTable.length > 0) {
    const depCountSeries: SeriesPoint[] = (() => {
      const m = new Map<string, number>();
      for (const d of departuresTable) {
        const date = (d?.date || "").slice(0, 10);
        if (!date) continue;
        m.set(date, (m.get(date) || 0) + 1);
      }
      return Array.from(m.entries()).map(([date, value]) => ({
        date,
        label: date,
        value,
      }));
    })();
    const depBucketed = bucketSeries(depCountSeries, effectiveView);
    breakdownData.forEach((row) => {
      const hit = depBucketed.find((p) => p.label === row.period);
      row.departures = hit?.value ?? 0;
    });
  }

  // Suppress legacy unused references to avoid TS dead-code warnings
  // until the rest of the table renderer is also pruned.
  void occupancyTrend;

  const globalCurrency = (window as any)?.yatraAdmin?.currency || "USD";
  const formatCurrencyAmount = (amount: number) =>
    formatYatraMoney(Number(amount) || 0, globalCurrency, {
      zeroAsUnknown: false,
    });

  // Render different table headers and columns based on category
  const renderTableHeaders = () => {
    switch (selectedCategory) {
      case "booking-overview":
        return (
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Period", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Total Bookings", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Confirmed", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Pending", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Cancelled", "yatra")}
            </th>
          </tr>
        );
      case "revenue-analysis":
        // Dropped "Collected" / "Outstanding" columns: we don't track
        // per-period collected vs. outstanding at the trend level. The
        // payment_status block in the Revenue Analysis section shows
        // the period-aggregate paid/pending/refunded split — that's
        // the right place for it.
        return (
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Period", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Total Revenue", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Bookings", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Avg Booking Value", "yatra")}
            </th>
          </tr>
        );
      case "trip-performance":
        // Dropped "Top Trip" column: top trip is a period-level concept,
        // not a per-bucket one. The Top Trips card above the table
        // shows the real ranking.
        return (
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Period", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Trip Bookings", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Occupancy Rate", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Revenue", "yatra")}
            </th>
          </tr>
        );
      case "departure-management":
        return (
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Period", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Departures", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Total Capacity", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Booked", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Utilization", "yatra")}
            </th>
          </tr>
        );
      case "customer-insights":
        return (
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Period", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("New Customers", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Returning Customers", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Satisfaction", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Total Revenue", "yatra")}
            </th>
          </tr>
        );
      case "operational-metrics":
        return (
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Period", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Lead Time (days)", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Cancellation Rate", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Efficiency", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Bookings", "yatra")}
            </th>
          </tr>
        );
      default:
        return (
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Period", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Bookings", "yatra")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {__("Revenue", "yatra")}
            </th>
          </tr>
        );
    }
  };

  const renderTableRows = () => {
    return breakdownData.map((row, index) => (
      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
          {row.period}
        </td>
        {selectedCategory === "booking-overview" && (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
                {row.bookings}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                {row.confirmed}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400">
                {row.pending}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400">
                {row.cancelled}
              </span>
            </td>
          </>
        )}
        {selectedCategory === "revenue-analysis" && (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
              {formatCurrencyAmount(row.revenue)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
                {row.bookings}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600 dark:text-purple-400">
              {formatCurrencyAmount(row.avgBookingValue)}
            </td>
          </>
        )}
        {selectedCategory === "trip-performance" && (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
                {row.bookings}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${row.occupancyRate}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium">
                  {row.occupancyRate}%
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
              {formatCurrencyAmount(row.revenue)}
            </td>
          </>
        )}
        {selectedCategory === "departure-management" && (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400">
                {row.departures}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                {row.capacity}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
                {row.booked}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width:
                        row.capacity > 0
                          ? `${Math.round((row.booked / row.capacity) * 100)}%`
                          : "0%",
                    }}
                  ></div>
                </div>
                <span className="text-xs font-medium">
                  {row.capacity > 0
                    ? Math.round((row.booked / row.capacity) * 100)
                    : 0}
                  %
                </span>
              </div>
            </td>
          </>
        )}
      </tr>
    ));
  };

  // Customer-Insights + Operational-Metrics no longer ship a per-period
  // breakdown table — we don't aggregate those metrics day-by-day yet,
  // and the previous version filled them with synthetic numbers. Show
  // a calm note pointing the operator at the summary cards above.
  const categoriesWithoutBreakdown = new Set([
    "customer-insights",
    "operational-metrics",
  ]);
  if (categoriesWithoutBreakdown.has(selectedCategory)) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        {__(
          "Per-period breakdown isn't available for this section. The summary cards above show the aggregate for the selected date range.",
          "yatra",
        )}
      </div>
    );
  }

  // Empty-state for ranges with no data — better than a 0-bar table.
  if (breakdownData.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        {__("No data in this date range yet.", "yatra")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          {renderTableHeaders()}
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {renderTableRows()}
        </tbody>
      </table>

      {/* Summary Row */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {__("Total Bookings", "yatra")}
            </p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {breakdownData.reduce((sum, row) => sum + row.bookings, 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {__("Total Revenue", "yatra")}
            </p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrencyAmount(
                breakdownData.reduce((sum, row) => sum + row.revenue, 0),
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {__("Total Departures", "yatra")}
            </p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {breakdownData.reduce((sum, row) => sum + row.departures, 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {__("Avg Occupancy", "yatra")}
            </p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {(
                breakdownData.reduce((sum, row) => sum + row.occupancyRate, 0) /
                breakdownData.length
              ).toFixed(1)}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Facebook Pixel Reports Component
const FacebookPixelReports: React.FC = () => {
  const [clearingLogs, setClearingLogs] = useState(false);
  const { showToast } = useToast();

  // Fetch fresh Facebook Pixel data
  const {
    data: freshPixelData,
    refetch: refetchPixelData,
    isLoading: isPixelLoading,
  } = useQuery({
    queryKey: ["facebook-pixel-status"],
    queryFn: async () => {
      const response = await apiService.getFacebookPixelSettings();
      return response?.data || {};
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Use fresh data if available, fallback to cached data
  const facebookPixelData =
    freshPixelData || (window as any).yatraAdmin?.facebookPixel || {};

  const getEventStats = () => {
    const logs = facebookPixelData.eventLogs || [];
    return {
      success: logs.filter((log: any) => log.status === "success").length,
      errors: logs.filter((log: any) => log.status === "error").length,
      total: logs.length,
    };
  };

  const getRecentEvents = () => {
    const logs = facebookPixelData.eventLogs || [];
    return logs.slice(-10).reverse(); // Show last 10 events, newest first
  };

  const clearPixelLogs = async () => {
    setClearingLogs(true);
    try {
      const response = await apiService.clearFacebookPixelEventLogs();
      if (response.success) {
        showToast(__("Event logs cleared successfully.", "yatra"), "success");
        // Refetch fresh data to update the UI
        await refetchPixelData();
      }
    } catch (error: any) {
      showToast(error.message || __("Failed to clear logs.", "yatra"), "error");
    } finally {
      setClearingLogs(false);
    }
  };

  const eventStats = getEventStats();
  const recentEvents = getRecentEvents();

  // Empty-state gate.
  // Three conditions all funnel into the same "Not Configured" screen
  // because, from the operator's point of view, they look the same:
  //   1. Pro plugin isn't installed/activated at all
  //   2. Pro is installed but the Facebook Pixel module is toggled off
  //      under Modules — pre-existing pixel_id stays in the DB and
  //      would otherwise let this tab render with stale data
  //   3. Module is on but no Pixel ID has been saved yet
  const fbModuleActive =
    isProPluginActive() && isModuleActive("facebook_pixel");
  if (!fbModuleActive || !facebookPixelData.pixel_id) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {__("Facebook Pixel Not Configured", "yatra")}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {!fbModuleActive
            ? __(
                "Enable the Facebook Pixel module under Modules and add your Pixel ID in Settings to start tracking conversion events.",
                "yatra",
              )
            : __(
                "Configure your Facebook Pixel in Settings to start tracking conversion events.",
                "yatra",
              )}
        </p>
        <a
          href={`${(window as any).yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=${
            !fbModuleActive ? "modules" : "settings#integration"
          }`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {!fbModuleActive
            ? __("Open Modules", "yatra")
            : __("Configure Facebook Pixel", "yatra")}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {__("Connection Status", "yatra")}
        </h3>
        <Button
          type="button"
          onClick={() => {
            refetchPixelData();
            showToast(__("Status refreshed successfully!", "yatra"), "success");
          }}
          variant="outline"
          size="sm"
          disabled={isPixelLoading}
        >
          {isPixelLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {__("Refreshing...", "yatra")}
            </>
          ) : (
            <>
              <svg
                className="-ml-1 mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {__("Refresh Status", "yatra")}
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-lg border ${
            facebookPixelData.connectionStatus?.pixelConnected
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {__("Pixel Connection", "yatra")}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {facebookPixelData.connectionStatus?.pixelConnected
                  ? __("Connected", "yatra")
                  : __("Not Connected", "yatra")}
              </p>
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                facebookPixelData.connectionStatus?.pixelConnected
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {facebookPixelData.connectionStatus?.pixelConnected ? (
                <svg
                  className="w-4 h-4 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            facebookPixelData.connectionStatus?.tokenConnected
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {__("API Token", "yatra")}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {facebookPixelData.connectionStatus?.tokenConnected
                  ? __("Valid", "yatra")
                  : __("Invalid", "yatra")}
              </p>
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                facebookPixelData.connectionStatus?.tokenConnected
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {facebookPixelData.connectionStatus?.tokenConnected ? (
                <svg
                  className="w-4 h-4 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {__("Pixel ID", "yatra")}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {facebookPixelData.pixel_id || __("Not Set", "yatra")}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Event Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {__("Event Statistics", "yatra")}
            </h3>
            <Button
              type="button"
              onClick={() => clearPixelLogs()}
              variant="outline"
              size="sm"
              disabled={clearingLogs}
            >
              {clearingLogs
                ? __("Clearing...", "yatra")
                : __("Clear Logs", "yatra")}
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {eventStats.success}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {__("Successful Events", "yatra")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {eventStats.errors}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {__("Failed Events", "yatra")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {eventStats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {__("Total Events", "yatra")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {__("Recent Activity", "yatra")}
          </h3>
        </div>

        <div className="p-6">
          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.map((log: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        log.status === "success"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : log.status === "error"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-blue-100 dark:bg-blue-900/30"
                      }`}
                    >
                      {log.status === "success" && (
                        <svg
                          className="w-4 h-4 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      {log.status === "error" && (
                        <svg
                          className="w-4 h-4 text-red-600 dark:text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                      {log.status === "logged" && (
                        <svg
                          className="w-4 h-4 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {log.event_name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {log.event_data?.trip_name ? (
                          <div>
                            <span>{__("Trip:", "yatra")} </span>
                            {log.event_data?.trip_url ? (
                              <a
                                href={log.event_data.trip_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {log.event_data.trip_name}
                              </a>
                            ) : (
                              <span>{log.event_data.trip_name}</span>
                            )}
                          </div>
                        ) : (
                          <span>{log.event_type || "Frontend"}</span>
                        )}
                      </div>
                      {log.event_data?.value && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {__("Value:", "yatra")}{" "}
                          {log.event_data.currency || "USD"}{" "}
                          {log.event_data.value}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {__("No Events Yet", "yatra")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {__(
                  "Events will appear here once users start interacting with your site.",
                  "yatra",
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {__("Quick Links", "yatra")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href={`https://www.facebook.com/events_manager2/list/pixel/${facebookPixelData.pixel_id}/test_events`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {__("Test Events", "yatra")}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {__("Facebook Events Manager", "yatra")}
              </div>
            </div>
          </a>

          <a
            href={`${(window as any).yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=settings#integration`}
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {__("Pixel Settings", "yatra")}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {__("Configuration & Options", "yatra")}
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

// Google Analytics 4 Reports Component
const GoogleAnalyticsReports: React.FC = () => {
  const [clearingLogs, setClearingLogs] = useState(false);
  const { showToast } = useToast();

  // Fetch fresh Google Analytics data
  const {
    data: freshGAData,
    refetch: refetchGAData,
    isLoading: isGALoading,
  } = useQuery({
    queryKey: ["google-analytics-status"],
    queryFn: async () => {
      const raw = await apiService.getGoogleAnalyticsSettings();
      const payload = unwrapApiPayload<Record<string, unknown>>(raw);
      return (payload && typeof payload === "object" ? payload : {}) as Record<
        string,
        unknown
      >;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Always use fresh data from API
  const googleAnalyticsData = (freshGAData || {}) as {
    measurement_id?: string;
    eventLogs?: Array<{ status?: string; [key: string]: unknown }>;
    connectionStatus?: {
      measurementConnected?: boolean;
      apiSecretConnected?: boolean;
    };
    [key: string]: unknown;
  };

  const getEventStats = () => {
    const logs = googleAnalyticsData.eventLogs || [];
    return {
      success: logs.filter((log) => log.status === "success").length,
      errors: logs.filter((log) => log.status === "error").length,
      total: logs.length,
    };
  };

  const getRecentEvents = () => {
    const logs = googleAnalyticsData.eventLogs || [];
    return logs.slice(-10).reverse(); // Show last 10 events, newest first
  };

  const clearGALogs = async () => {
    setClearingLogs(true);
    try {
      const raw = (await apiService.clearGoogleAnalyticsEventLogs()) as {
        success?: boolean;
      };
      if (raw?.success) {
        showToast(__("Event logs cleared successfully.", "yatra"), "success");
        // Refetch fresh data to update the UI
        await refetchGAData();
      }
    } catch (error: any) {
      showToast(error.message || __("Failed to clear logs.", "yatra"), "error");
    } finally {
      setClearingLogs(false);
    }
  };

  const eventStats = getEventStats();
  const recentEvents = getRecentEvents();

  // Empty-state gate. Mirrors the Facebook Pixel tab: same three
  // funnel paths (no Pro, module disabled, no Measurement ID) → same
  // visual treatment. Splits the CTA + body between
  // "Enable the module" vs. "Configure in Settings" based on which
  // condition tripped.
  const gaModuleActive =
    isProPluginActive() && isModuleActive("google_analytics");
  if (!gaModuleActive || !googleAnalyticsData.measurement_id) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {__("Google Analytics 4 Not Configured", "yatra")}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {!gaModuleActive
            ? __(
                "Enable the Google Analytics 4 module under Modules and add your Measurement ID in Settings to start tracking conversion events.",
                "yatra",
              )
            : __(
                "Configure your Google Analytics 4 in Settings to start tracking conversion events.",
                "yatra",
              )}
        </p>
        <a
          href={`${(window as any).yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=${
            !gaModuleActive ? "modules" : "settings#integration"
          }`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {!gaModuleActive
            ? __("Open Modules", "yatra")
            : __("Configure Google Analytics 4", "yatra")}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {__("Connection Status", "yatra")}
        </h3>
        <Button
          type="button"
          onClick={() => {
            refetchGAData();
            showToast(__("Status refreshed successfully!", "yatra"), "success");
          }}
          variant="outline"
          size="sm"
          disabled={isGALoading}
        >
          {isGALoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {__("Refreshing...", "yatra")}
            </>
          ) : (
            <>
              <svg
                className="-ml-1 mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {__("Refresh Status", "yatra")}
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-lg border ${
            googleAnalyticsData.connectionStatus?.measurementConnected
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {__("Measurement ID", "yatra")}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {googleAnalyticsData.connectionStatus?.measurementConnected
                  ? __("Connected", "yatra")
                  : __("Not Connected", "yatra")}
              </p>
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                googleAnalyticsData.connectionStatus?.measurementConnected
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {googleAnalyticsData.connectionStatus?.measurementConnected ? (
                <svg
                  className="w-4 h-4 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            googleAnalyticsData.connectionStatus?.apiSecretConnected
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {__("API Secret", "yatra")}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {googleAnalyticsData.connectionStatus?.apiSecretConnected
                  ? __("Valid", "yatra")
                  : __("Invalid", "yatra")}
              </p>
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                googleAnalyticsData.connectionStatus?.apiSecretConnected
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {googleAnalyticsData.connectionStatus?.apiSecretConnected ? (
                <svg
                  className="w-4 h-4 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {__("Measurement Protocol", "yatra")}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {googleAnalyticsData.use_measurement_protocol
                  ? __("Enabled", "yatra")
                  : __("Disabled", "yatra")}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Event Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {__("Event Statistics", "yatra")}
            </h3>
            <Button
              type="button"
              onClick={() => clearGALogs()}
              variant="outline"
              size="sm"
              disabled={clearingLogs}
            >
              {clearingLogs
                ? __("Clearing...", "yatra")
                : __("Clear Logs", "yatra")}
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {eventStats.success}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {__("Successful Events", "yatra")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {eventStats.errors}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {__("Failed Events", "yatra")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {eventStats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {__("Total Events", "yatra")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {__("Recent Activity", "yatra")}
          </h3>
        </div>

        <div className="p-6">
          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.map((log: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        log.status === "success"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : log.status === "error"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-blue-100 dark:bg-blue-900/30"
                      }`}
                    >
                      {log.status === "success" && (
                        <svg
                          className="w-4 h-4 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      {log.status === "error" && (
                        <svg
                          className="w-4 h-4 text-red-600 dark:text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                      {log.status === "logged" && (
                        <svg
                          className="w-4 h-4 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {log.event_name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {log.event_data?.trip_name ? (
                          <div>
                            <span>{__("Trip:", "yatra")} </span>
                            {log.event_data?.trip_url ? (
                              <a
                                href={log.event_data.trip_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {log.event_data.trip_name}
                              </a>
                            ) : (
                              <span>{log.event_data.trip_name}</span>
                            )}
                          </div>
                        ) : (
                          <span>{log.event_type || "Frontend"}</span>
                        )}
                      </div>
                      {log.event_data?.value && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {__("Value:", "yatra")}{" "}
                          {log.event_data.currency || "USD"}{" "}
                          {log.event_data.value}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {__("No Events Yet", "yatra")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {__(
                  "Events will appear here once users start interacting with your site.",
                  "yatra",
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {__("Quick Links", "yatra")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href={`https://analytics.google.com/analytics/web/#/debugview`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {__("Debug View", "yatra")}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {__("Google Analytics Debug", "yatra")}
              </div>
            </div>
          </a>

          <a
            href={`${(window as any).yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=settings#integration`}
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {__("GA4 Settings", "yatra")}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {__("Configuration & Options", "yatra")}
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

const TravelBookingReports: React.FC = () => {
  // Cap-filter the category list. canCap honors the WP admin fallback
  // (admins see everything), the Team module's userCaps array (granular
  // role-based), and falls back to default-allow when no team module is
  // installed (so non-Team installs keep their pre-existing behavior).
  const visibleCategories = useMemo(
    () => TravelReportCategories.filter((c) => canCap(c.cap)),
    [],
  );

  const [selectedCategory, setSelectedCategory] = useState(
    () => visibleCategories[0]?.id || "booking-overview",
  );
  const [dateRange, setDateRange] = useState("last_30_days");
  const [viewType, setViewType] = useState("summary"); // 'summary', 'daily', 'weekly', 'monthly'

  // If the operator's currently-selected tab becomes invalid (e.g.
  // role changed mid-session), fall back to the first visible tab.
  React.useEffect(() => {
    if (!visibleCategories.some((c) => c.id === selectedCategory)) {
      const fallback = visibleCategories[0]?.id;
      if (fallback) setSelectedCategory(fallback);
    }
  }, [visibleCategories, selectedCategory]);

  // Fetch real data from Yatra ReportsController using apiClient
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["yatra-travel-reports", dateRange],
    queryFn: async () => {
      const params = getDateRangeParams(dateRange);
      const response = await apiClient.get(
        `/reports?date_from=${params.start}&date_to=${params.end}`,
      );
      return response?.data || {};
    },
  });

  // Calculate date range parameters
  function getDateRangeParams(range: string) {
    const today = new Date();
    const start = new Date();

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
      default:
        start.setDate(today.getDate() - 30);
    }

    return {
      start: start.toISOString().split("T")[0],
      end: today.toISOString().split("T")[0],
    };
  }

  // Travel Business KPIs
  const travelKPIs = useMemo(() => {
    if (!reportData)
      return {
        totalBookings: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        avgBookingValue: 0,
        cancellationRate: 0,
        upcomingDepartures: 0,
      };

    return {
      totalBookings: reportData.booking_stats?.total || 0,
      totalRevenue: reportData.revenue_stats?.total || 0,
      occupancyRate: reportData.operational_stats?.occupancyRate || 0,
      avgBookingValue: reportData.revenue_stats?.average || 0,
      cancellationRate: reportData.booking_stats?.cancellationRate || 0,
      upcomingDepartures: reportData.operational_stats?.upcomingDepartures || 0,
    };
  }, [reportData]);

  const globalCurrency = (window as any)?.yatraAdmin?.currency || "USD";
  const formatCurrencyAmount = (amount: number) =>
    formatYatraMoney(Number(amount) || 0, globalCurrency, {
      zeroAsUnknown: false,
    });

  // CSV export — bundles the visible breakdown (or summary KPIs when
  // no breakdown is appropriate) into a downloadable file scoped to
  // the picked date range. Doesn't hit the network; everything we
  // already have in memory is enough.
  const handleExportCsv = () => {
    const params = getDateRangeParams(dateRange);
    const rows: (string | number | null | undefined)[][] = [];

    // Top KPI summary first — operators paste this into the email
    // before the detail table.
    rows.push(["Yatra Reports — Summary"]);
    rows.push([`Date range: ${params.start} to ${params.end}`]);
    rows.push([]);
    rows.push(["Metric", "Value"]);
    rows.push(["Total bookings", travelKPIs.totalBookings]);
    rows.push(["Total revenue", travelKPIs.totalRevenue]);
    rows.push(["Avg booking value", travelKPIs.avgBookingValue]);
    rows.push(["Occupancy rate (%)", travelKPIs.occupancyRate]);
    rows.push(["Cancellation rate (%)", travelKPIs.cancellationRate]);
    rows.push(["Upcoming departures", travelKPIs.upcomingDepartures]);
    rows.push([]);

    // Booking trend (day-level) if the operator has revenue/booking data.
    const trend: any[] = reportData?.booking_trend || [];
    const revenueTrend: any[] = reportData?.revenue_trend || [];
    if (trend.length) {
      rows.push(["Day", "Bookings", "Revenue"]);
      trend.forEach((row: any, i: number) => {
        rows.push([
          row.date || row.label,
          row.value,
          revenueTrend[i]?.value ?? "",
        ]);
      });
      rows.push([]);
    }

    // Top trips
    const tp = reportData?.trip_performance || [];
    if (tp.length) {
      rows.push(["Trip", "Bookings", "Revenue", "Occupancy %"]);
      tp.forEach((t: any) => {
        rows.push([t.label, t.value, t.revenue, t.occupancy]);
      });
      rows.push([]);
    }

    // Payment methods
    const pm = reportData?.payment_methods || [];
    if (pm.length) {
      rows.push(["Payment method", "Count", "Revenue"]);
      pm.forEach((m: any) => {
        rows.push([m.method, m.count, m.revenue]);
      });
      rows.push([]);
    }

    // Top destinations
    const dest = reportData?.top_destinations || [];
    if (dest.length) {
      rows.push(["Destination", "Bookings", "Revenue"]);
      dest.forEach((d: any) => {
        rows.push([d.label, d.value, d.revenue]);
      });
      rows.push([]);
    }

    const blob = buildCsv(rows);
    downloadCsv(blob, csvFilename("reports", params.start, params.end));
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
            <SVGIcons.BarChart />
            {__("Travel Booking Reports", "yatra")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {__(
              "Essential analytics for your travel booking business.",
              "yatra",
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            aria-label={__("Date range", "yatra")}
          >
            <option value="today">{__("Today", "yatra")}</option>
            <option value="last_7_days">{__("Last 7 days", "yatra")}</option>
            <option value="last_30_days">{__("Last 30 days", "yatra")}</option>
            <option value="last_90_days">{__("Last 90 days", "yatra")}</option>
            <option value="this_year">{__("This year", "yatra")}</option>
          </select>

          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            aria-label={__("Breakdown view", "yatra")}
          >
            <option value="summary">{__("Summary View", "yatra")}</option>
            <option value="daily">{__("Daily Breakdown", "yatra")}</option>
            <option value="weekly">{__("Weekly Breakdown", "yatra")}</option>
            <option value="monthly">{__("Monthly Breakdown", "yatra")}</option>
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isLoading || !reportData}
            title={__("Download this report's data as CSV", "yatra")}
          >
            {__("Export CSV", "yatra")}
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {isLoading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </>
        ) : (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {__("Total Bookings", "yatra")}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {travelKPIs.totalBookings}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <SVGIcons.Calendar />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {__("Total Revenue", "yatra")}
                  </p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyAmount(travelKPIs.totalRevenue)}
                  </p>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <SVGIcons.DollarSign />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {__("Occupancy Rate", "yatra")}
                  </p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {travelKPIs.occupancyRate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <SVGIcons.Target />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {__("Avg Booking Value", "yatra")}
                  </p>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrencyAmount(travelKPIs.avgBookingValue)}
                  </p>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <SVGIcons.BarChart />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {__("Cancellation Rate", "yatra")}
                  </p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {travelKPIs.cancellationRate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <SVGIcons.XCircle />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {__("Upcoming Departures", "yatra")}
                  </p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {travelKPIs.upcomingDepartures}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <SVGIcons.Truck />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Report Categories - Tab Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SVGIcons.BarChart />
            {__("Travel Business Reports", "yatra")}
          </CardTitle>
          <CardDescription>
            {__(
              "Comprehensive analytics for your travel booking operations",
              "yatra",
            )}
          </CardDescription>
        </CardHeader>

        {/* Tab Navigation: dropdown on small screens; scrollable pill row on md+ */}
        <div className="border-b border-gray-200 dark:border-gray-700 min-w-0">
          <div className="px-4 pt-2 pb-3 md:hidden">
            <label
              htmlFor="yatra-report-section-select"
              className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400"
            >
              {__("Report section", "yatra")}
            </label>
            <Select
              id="yatra-report-section-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label={__("Report section", "yatra")}
            >
              {visibleCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {__(category.title, "yatra")}
                </option>
              ))}
            </Select>
          </div>

          <nav
            className="hidden md:flex min-w-0 flex-nowrap items-stretch gap-1 overflow-x-auto overflow-y-hidden scroll-smooth px-4 pe-6 pb-1 sm:px-6 sm:pe-8 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
            aria-label={__("Report sections", "yatra")}
          >
            {visibleCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`shrink-0 snap-start inline-flex max-w-none items-center gap-2 rounded-t-md border-b-2 px-3 py-3 text-left text-sm font-medium whitespace-nowrap transition-colors sm:px-4 sm:py-3.5 ${
                  selectedCategory === category.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:hover:border-gray-600 dark:hover:bg-gray-800/50 dark:hover:text-gray-200"
                }`}
              >
                <span className="flex shrink-0 [&_svg]:h-5 [&_svg]:w-5">
                  {React.createElement(
                    SVGIcons[category.icon as keyof typeof SVGIcons],
                  )}
                </span>
                <span className="leading-tight">
                  {__(category.title, "yatra")}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </Card>

      {/* Report Content */}
      <Card>
        <CardContent>
          {isLoading ? (
            <SkeletonReportSection />
          ) : (
            <div className="space-y-6">
              {selectedCategory === "booking-overview" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {__("Booking Overview", "yatra")}
                  </h3>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Confirmed Bookings", "yatra")}
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        {reportData?.booking_stats?.confirmed || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Pending Bookings", "yatra")}
                      </p>
                      <p className="text-xl font-bold text-yellow-600">
                        {reportData?.booking_stats?.pending || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Cancelled Bookings", "yatra")}
                      </p>
                      <p className="text-xl font-bold text-red-600">
                        {reportData?.booking_stats?.cancelled || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Completed Bookings", "yatra")}
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        {reportData?.booking_stats?.completed || 0}
                      </p>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Booking Status Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {__("Booking Status Distribution", "yatra")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <BookingStatusChart
                          data={[
                            {
                              label: "Confirmed",
                              value: reportData?.booking_stats?.confirmed || 0,
                              color: "#10b981",
                            },
                            {
                              label: "Pending",
                              value: reportData?.booking_stats?.pending || 0,
                              color: "#f59e0b",
                            },
                            {
                              label: "Cancelled",
                              value: reportData?.booking_stats?.cancelled || 0,
                              color: "#ef4444",
                            },
                            {
                              label: "Completed",
                              value: reportData?.booking_stats?.completed || 0,
                              color: "#3b82f6",
                            },
                          ]}
                        />
                      </CardContent>
                    </Card>

                    {/* Revenue Trend Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>{__("Revenue Trend", "yatra")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <BookingsOverviewChart
                          data={reportData?.revenue_trend || []}
                          currency={globalCurrency}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {selectedCategory === "revenue-analysis" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Revenue Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Revenue
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrencyAmount(
                          reportData?.revenue_stats?.total || 0,
                        )}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Average Booking Value
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrencyAmount(
                          reportData?.revenue_stats?.average || 0,
                        )}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Revenue Lost (Cancellations)
                      </p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrencyAmount(
                          reportData?.cancellations?.revenueLost || 0,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedCategory === "trip-performance" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Trip Performance
                  </h3>
                  <div className="space-y-4">
                    {(reportData?.trip_performance || [])
                      .slice(0, 5)
                      .map((trip: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {trip.label}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {trip.value} bookings
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {formatCurrencyAmount(trip.revenue || 0)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Revenue
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {selectedCategory === "departure-management" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Departure Management
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upcoming Departures
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        {reportData?.operational_stats?.upcomingDepartures || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Capacity
                      </p>
                      <p className="text-xl font-bold text-purple-600">
                        {reportData?.operational_stats?.totalCapacity || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Booked Capacity
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        {reportData?.operational_stats?.bookedCapacity || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedCategory === "customer-insights" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Customer Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Customers
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        {reportData?.customer_analytics?.totalCustomers || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        New Customers
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        {reportData?.customer_analytics?.newCustomers || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Returning Customers
                      </p>
                      <p className="text-xl font-bold text-purple-600">
                        {reportData?.customer_analytics?.returningCustomers ||
                          0}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Customer Lifetime Value
                      </p>
                      <p className="text-xl font-bold text-orange-600">
                        {formatCurrencyAmount(
                          reportData?.customer_analytics
                            ?.customerLifetimeValue || 0,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedCategory === "operational-metrics" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Operational Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Occupancy Rate
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        {(
                          reportData?.operational_stats?.occupancyRate || 0
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Average Group Size
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        {(
                          reportData?.operational_stats?.averageGroupSize || 0
                        ).toFixed(1)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Cancellation Rate
                      </p>
                      <p className="text-xl font-bold text-red-600">
                        {(
                          reportData?.booking_stats?.cancellationRate || 0
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── REVENUE ANALYSIS — Payment method breakdown ─────────
                  Operators routinely want to know which gateways are
                  pulling weight (and which they could turn off). The
                  data is computed in the backend per request. */}
              {selectedCategory === "revenue-analysis" &&
                Array.isArray(reportData?.payment_methods) &&
                reportData.payment_methods.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                      {__("Payment Methods", "yatra")}
                    </h3>
                    <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                      {__(
                        "Bookings and gross revenue split by payment gateway. Ranked by revenue.",
                        "yatra",
                      )}
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {reportData.payment_methods.slice(0, 6).map((m: any) => (
                        <div
                          key={m.method}
                          className="rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                        >
                          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {m.method}
                          </p>
                          <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {formatCurrencyAmount(m.revenue)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {m.count} {__("bookings", "yatra")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* ── TRIP PERFORMANCE — Top destinations ────────────────
                  Geographic concentration. Useful when paired with
                  Top Trips: a single trip can dominate a destination,
                  or a destination can have a long tail of small wins. */}
              {selectedCategory === "trip-performance" &&
                Array.isArray(reportData?.top_destinations) &&
                reportData.top_destinations.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                      {__("Top Destinations", "yatra")}
                    </h3>
                    <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                      {__(
                        "Booking count and revenue by primary destination. Useful for spotting geographic concentration.",
                        "yatra",
                      )}
                    </p>
                    <div className="space-y-2">
                      {reportData.top_destinations.map((d: any) => {
                        const max = Math.max(
                          1,
                          ...reportData.top_destinations.map(
                            (x: any) => x.value,
                          ),
                        );
                        return (
                          <div
                            key={d.label}
                            className="flex items-center gap-3"
                          >
                            <div className="w-32 truncate text-sm text-gray-700 dark:text-gray-200">
                              {d.label}
                            </div>
                            <div className="relative h-3 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
                              <div
                                className="h-3 rounded-full bg-blue-500"
                                style={{
                                  width: `${Math.max(2, (d.value / max) * 100)}%`,
                                }}
                              />
                            </div>
                            <div className="w-16 text-right text-sm tabular-nums text-gray-700 dark:text-gray-200">
                              {d.value}
                            </div>
                            <div className="w-24 text-right text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                              {formatCurrencyAmount(d.revenue || 0)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* ── OPERATIONAL METRICS — Lead time histogram ──────────
                  How far in advance customers book. Same-day = last-
                  minute demand. >quarter = need solid deposit policy. */}
              {selectedCategory === "operational-metrics" &&
                reportData?.lead_time && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                      {__("Booking Lead Time", "yatra")}
                    </h3>
                    <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                      {__(
                        "Time between booking creation and travel date. Average:",
                        "yatra",
                      )}{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {Number(reportData.lead_time.averageDays || 0).toFixed(
                          1,
                        )}{" "}
                        {__("days", "yatra")}
                      </span>{" "}
                      ({reportData.lead_time.sampleSize}{" "}
                      {__("bookings sampled", "yatra")})
                    </p>
                    <div className="space-y-2">
                      {(reportData.lead_time.buckets || []).map((b: any) => {
                        const total = (
                          reportData.lead_time.buckets || []
                        ).reduce((s: number, x: any) => s + x.value, 0);
                        const pct =
                          total > 0 ? Math.round((b.value / total) * 100) : 0;
                        return (
                          <div
                            key={b.label}
                            className="flex items-center gap-3"
                          >
                            <div className="w-44 truncate text-sm text-gray-700 dark:text-gray-200">
                              {b.label}
                            </div>
                            <div className="relative h-3 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
                              <div
                                className="h-3 rounded-full"
                                style={{
                                  width: `${Math.max(2, pct)}%`,
                                  background: b.color || "#3b82f6",
                                }}
                              />
                            </div>
                            <div className="w-16 text-right text-sm tabular-nums text-gray-700 dark:text-gray-200">
                              {b.value}
                            </div>
                            <div className="w-12 text-right text-xs text-gray-500 dark:text-gray-400">
                              {pct}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* ── OPERATIONAL METRICS — Refunds summary ──────────────
                  Refunds are distinct from cancellations: cancelling
                  doesn't necessarily refund (deposit policy). Track
                  separately so finance has a clean view.

                  Renders unconditionally on this tab — falls back to
                  zero KPIs when the backend hasn't shipped the
                  `refunds` block yet (e.g. PHP-FPM cached an older
                  copy of the controller). Visible empty-state beats
                  silently hiding the section. */}
              {selectedCategory === "operational-metrics" && (
                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                    {__("Refunds", "yatra")}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {__("Refunds issued", "yatra")}
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">
                        {reportData?.refunds?.count ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {__("Refund total", "yatra")}
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">
                        {formatCurrencyAmount(
                          Number(reportData?.refunds?.total) || 0,
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {__("Refund rate", "yatra")}
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                        {Number(reportData?.refunds?.refundRate || 0).toFixed(
                          1,
                        )}
                        %
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {__("Avg refund", "yatra")}
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums text-gray-700 dark:text-gray-200">
                        {formatCurrencyAmount(
                          Number(reportData?.refunds?.avgRefund) || 0,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedCategory === "facebook-pixel" && (
                <FacebookPixelReports />
              )}

              {selectedCategory === "google-analytics" && (
                <GoogleAnalyticsReports />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Breakdown Section */}
      {viewType !== "summary" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              {__("Detailed", "yatra")}{" "}
              {viewType.charAt(0).toUpperCase() + viewType.slice(1)}{" "}
              {__("Report", "yatra")}
            </CardTitle>
            <CardDescription>
              {viewType === "daily" &&
                __(
                  "Daily breakdown of bookings, revenue, and departures",
                  "yatra",
                )}
              {viewType === "weekly" &&
                __(
                  "Weekly breakdown of bookings, revenue, and departures",
                  "yatra",
                )}
              {viewType === "monthly" &&
                __(
                  "Monthly breakdown of bookings, revenue, and departures",
                  "yatra",
                )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Table Section - Takes 2/3 width on large screens */}
              <div className="lg:col-span-2">
                <DetailedBreakdownTable
                  viewType={viewType}
                  dateRange={dateRange}
                  selectedCategory={selectedCategory}
                  reportData={reportData}
                />
              </div>

              {/* Chart Section - Takes 1/3 width on large screens */}
              <div className="lg:col-span-1">
                <DetailedBreakdownChart
                  viewType={viewType}
                  dateRange={dateRange}
                  selectedCategory={selectedCategory}
                  reportData={reportData}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TravelBookingReports;
