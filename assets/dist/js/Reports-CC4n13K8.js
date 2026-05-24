import { r as reactExports, a5 as React, u as useQuery, j as jsxRuntimeExports } from "./react-vendor-CqkbFEvK.js";
import { _ as __, f as formatYatraMoney, u as useToast, b as apiService, a as apiClient } from "./index-fqW8jODk.js";
import { Y as canCap, B as Button, C as Card, f as CardHeader, g as CardTitle, h as CardDescription, S as Select, d as CardContent, Z as BookingStatusChart, _ as BookingsOverviewChart, $ as isProPluginActive, a0 as isModuleActive, r as unwrapApiPayload } from "../../admin/dist/js/app.js";
function isoWeek(d) {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = (target.getTime() - firstThursday.getTime()) / 864e5;
  return {
    year: target.getUTCFullYear(),
    week: 1 + Math.floor(diff / 7)
  };
}
function parseISO(date) {
  if (!date) return null;
  const [y, m, d] = date.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
function bucketSeries(points, view) {
  if (view === "daily" || points.length === 0) {
    return points;
  }
  if (view === "weekly") {
    const buckets2 = /* @__PURE__ */ new Map();
    for (const p of points) {
      const d = parseISO(p.date);
      if (!d) continue;
      const { year, week } = isoWeek(d);
      const key = `${year}-W${week.toString().padStart(2, "0")}`;
      const existing = buckets2.get(key);
      if (existing) {
        existing.value += p.value;
      } else {
        buckets2.set(key, {
          date: p.date,
          // first-day-in-week anchor; UI rarely needs it
          label: `W${week} ${MONTH_LABELS[d.getUTCMonth()]}`,
          value: p.value
        });
      }
    }
    return Array.from(buckets2.values());
  }
  const buckets = /* @__PURE__ */ new Map();
  for (const p of points) {
    const d = parseISO(p.date);
    if (!d) continue;
    const key = `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, "0")}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.value += p.value;
    } else {
      buckets.set(key, {
        date: p.date,
        label: `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
        value: p.value
      });
    }
  }
  return Array.from(buckets.values());
}
function bucketStatusSeries(points, view) {
  if (view === "daily" || points.length === 0) {
    return points;
  }
  const keyFn = (d) => {
    if (view === "weekly") {
      const { year, week } = isoWeek(d);
      return {
        key: `${year}-W${week.toString().padStart(2, "0")}`,
        label: `W${week} ${MONTH_LABELS[d.getUTCMonth()]}`
      };
    }
    return {
      key: `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, "0")}`,
      label: `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
    };
  };
  const buckets = /* @__PURE__ */ new Map();
  for (const p of points) {
    const d = parseISO(p.date);
    if (!d) continue;
    const { key, label } = keyFn(d);
    const existing = buckets.get(key);
    if (existing) {
      existing.confirmed += p.confirmed;
      existing.pending += p.pending;
      existing.cancelled += p.cancelled;
      existing.completed += p.completed;
    } else {
      buckets.set(key, {
        date: p.date,
        label,
        confirmed: p.confirmed,
        pending: p.pending,
        cancelled: p.cancelled,
        completed: p.completed
      });
    }
  }
  return Array.from(buckets.values());
}
function buildCsv(rows) {
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    if (/[",\r\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const body = rows.map((r) => r.map(escape).join(",")).join("\r\n");
  return new Blob([body], { type: "text/csv;charset=utf-8" });
}
function downloadCsv(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
function csvFilename(slug, from, to) {
  if (from && to) {
    return `yatra-${slug}-${from}-to-${to}.csv`;
  }
  const now = /* @__PURE__ */ new Date();
  const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  return `yatra-${slug}-${today}.csv`;
}
const SkeletonCard = () => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20" })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" })
] }) });
const SkeletonReportSection = () => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [...Array(4)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-800 rounded-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" })
  ] }, i)) })
] });
const SVGIcons = {
  Calendar: () => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "svg",
    {
      className: "w-6 h-6",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        }
      )
    }
  ),
  DollarSign: () => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "svg",
    {
      className: "w-6 h-6",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
        }
      )
    }
  ),
  MapPin: () => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "svg",
    {
      className: "w-6 h-6",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          }
        )
      ]
    }
  ),
  Truck: () => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "svg",
    {
      className: "w-6 h-6",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM21 17a2 2 0 11-4 0 2 2 0 014 0z"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
          }
        )
      ]
    }
  ),
  Users: () => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "svg",
    {
      className: "w-6 h-6",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z"
        }
      )
    }
  ),
  Activity: () => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "svg",
    {
      className: "w-6 h-6",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        }
      )
    }
  ),
  Facebook: () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" }) }),
  Google: () => /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })
  ] }),
  Target: () => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "svg",
    {
      className: "w-6 h-6",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        }
      )
    }
  ),
  BarChart: () => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "svg",
    {
      className: "w-6 h-6",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        }
      )
    }
  ),
  XCircle: () => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "svg",
    {
      className: "w-6 h-6",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        }
      )
    }
  )
};
const TravelReportCategories = [
  {
    id: "booking-overview",
    title: "Booking Overview",
    icon: "Calendar",
    description: "Booking volume, status distribution, trends",
    cap: "yatra_view_operational_reports"
  },
  {
    id: "revenue-analysis",
    title: "Revenue Analysis",
    icon: "DollarSign",
    description: "Revenue trends, payment status, profitability",
    cap: "yatra_view_financial_reports"
  },
  {
    id: "trip-performance",
    title: "Trip Performance",
    icon: "MapPin",
    description: "Trip popularity, occupancy rates, capacity utilization",
    cap: "yatra_view_operational_reports"
  },
  {
    id: "departure-management",
    title: "Departure Management",
    icon: "Truck",
    description: "Upcoming departures, capacity planning, scheduling",
    cap: "yatra_view_departures"
  },
  {
    id: "customer-insights",
    title: "Customer Insights",
    icon: "Users",
    description: "Customer behavior, retention, demographics",
    cap: "yatra_view_customers"
  },
  {
    id: "operational-metrics",
    title: "Operational Metrics",
    icon: "Activity",
    description: "Lead times, cancellations, efficiency metrics",
    cap: "yatra_view_operational_reports"
  },
  {
    id: "facebook-pixel",
    title: "Facebook Pixel",
    icon: "Facebook",
    description: "Conversion tracking, event analytics, pixel performance",
    cap: "yatra_view_operational_reports"
  },
  {
    id: "google-analytics",
    title: "Google Analytics 4",
    icon: "Google",
    description: "Enhanced e-commerce tracking, Measurement Protocol, visitor analytics",
    cap: "yatra_view_operational_reports"
  }
];
const DetailedBreakdownChart = ({ viewType, selectedCategory, reportData }) => {
  var _a;
  const globalCurrency = ((_a = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a.currency) || "USD";
  const formatCurrencyAmount = (amount) => formatYatraMoney(Number(amount) || 0, globalCurrency, {
    zeroAsUnknown: false
  });
  const sourceSeries = reactExports.useMemo(() => {
    if (!reportData) return [];
    if (selectedCategory === "revenue-analysis") {
      return reportData.revenue_trend || [];
    }
    if (selectedCategory === "departure-management") {
      const dep = reportData.departures_table || [];
      if (Array.isArray(dep) && dep.length > 0) {
        const byDay = /* @__PURE__ */ new Map();
        for (const d of dep) {
          const date = ((d == null ? void 0 : d.date) || "").slice(0, 10);
          if (!date) continue;
          byDay.set(date, (byDay.get(date) || 0) + 1);
        }
        return Array.from(byDay.entries()).map(([date, value]) => ({
          date,
          label: date,
          value
        }));
      }
      return reportData.booking_trend || [];
    }
    return reportData.booking_trend || [];
  }, [reportData, selectedCategory]);
  const view = viewType === "weekly" || viewType === "monthly" ? viewType : "daily";
  const bucketed = reactExports.useMemo(
    () => bucketSeries(sourceSeries, view),
    [sourceSeries, view]
  );
  if (!reportData || bucketed.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-10 text-center text-sm text-gray-500 dark:text-gray-400", children: __("No data in this period yet.", "yatra") });
  }
  const maxValue = Math.max(1, ...bucketed.map((p) => p.value));
  const isRevenue = selectedCategory === "revenue-analysis";
  const isDepartures = selectedCategory === "departure-management";
  const barClass = isRevenue ? "bg-emerald-500" : isDepartures ? "bg-purple-500" : "bg-blue-500";
  const valueLabel = (v) => isRevenue ? formatCurrencyAmount(v) : v.toLocaleString();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-white", children: isRevenue ? __("Revenue Trend", "yatra") : isDepartures ? __("Departures Trend", "yatra") : __("Bookings Trend", "yatra") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: bucketed.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 shrink-0 text-right text-xs text-gray-600 dark:text-gray-400", children: item.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative h-4 flex-1 rounded-full bg-gray-100 dark:bg-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `flex h-4 items-center justify-end rounded-full pr-1.5 ${barClass}`,
          style: {
            width: `${Math.max(2, item.value / maxValue * 100)}%`
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-medium text-white", children: valueLabel(item.value) })
        }
      ) })
    ] }, `${item.date}-${index}`)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-3 w-3 rounded ${barClass}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: isRevenue ? __("Revenue", "yatra") : isDepartures ? __("Departures", "yatra") : __("Bookings", "yatra") })
    ] })
  ] });
};
const DetailedBreakdownTable = ({ viewType, selectedCategory, reportData }) => {
  var _a;
  const effectiveView = viewType === "weekly" || viewType === "monthly" ? viewType : "daily";
  const bookingTrend = (reportData == null ? void 0 : reportData.booking_trend) || [];
  const revenueTrend = (reportData == null ? void 0 : reportData.revenue_trend) || [];
  const statusTrend = (reportData == null ? void 0 : reportData.status_trend) || [];
  (reportData == null ? void 0 : reportData.occupancy_trend) || [];
  const bookingsBucketed = bucketSeries(bookingTrend, effectiveView);
  const revenueBucketed = bucketSeries(revenueTrend, effectiveView);
  const statusBucketed = bucketStatusSeries(statusTrend, effectiveView);
  const departuresTable = (reportData == null ? void 0 : reportData.departures_table) || [];
  const occByDay = /* @__PURE__ */ new Map();
  for (const d of departuresTable) {
    const date = ((d == null ? void 0 : d.date) || "").slice(0, 10);
    if (!date) continue;
    const acc = occByDay.get(date) || { booked: 0, capacity: 0 };
    acc.booked += Number((d == null ? void 0 : d.bookedSeats) ?? (d == null ? void 0 : d.booked) ?? 0);
    acc.capacity += Number((d == null ? void 0 : d.maxSeats) ?? (d == null ? void 0 : d.capacity) ?? 0);
    occByDay.set(date, acc);
  }
  const occBookingSeries = Array.from(occByDay.entries()).map(
    ([date, agg]) => ({ date, label: date, value: agg.booked })
  );
  const occCapacitySeries = Array.from(occByDay.entries()).map(
    ([date, agg]) => ({ date, label: date, value: agg.capacity })
  );
  const occBookedBucketed = bucketSeries(occBookingSeries, effectiveView);
  const occCapacityBucketed = bucketSeries(occCapacitySeries, effectiveView);
  const breakdownData = bookingsBucketed.map((bRow, i) => {
    var _a2;
    const rev = ((_a2 = revenueBucketed[i]) == null ? void 0 : _a2.value) ?? 0;
    const status = statusBucketed[i];
    const ob = occBookedBucketed.find((p) => p.label === bRow.label);
    const oc = occCapacityBucketed.find((p) => p.label === bRow.label);
    const bookedSeats = (ob == null ? void 0 : ob.value) ?? 0;
    const capacitySeats = (oc == null ? void 0 : oc.value) ?? 0;
    const occRate = capacitySeats > 0 ? Math.round(bookedSeats / capacitySeats * 1e3) / 10 : 0;
    return {
      period: bRow.label,
      fullDate: bRow.date,
      bookings: bRow.value,
      confirmed: (status == null ? void 0 : status.confirmed) ?? 0,
      pending: (status == null ? void 0 : status.pending) ?? 0,
      cancelled: (status == null ? void 0 : status.cancelled) ?? 0,
      revenue: rev,
      avgBookingValue: bRow.value > 0 ? Math.round(rev / bRow.value) : 0,
      occupancyRate: occRate,
      booked: bookedSeats,
      capacity: capacitySeats,
      departures: capacitySeats > 0 ? 1 : 0
      // count via departures_table when available
    };
  });
  if (departuresTable.length > 0) {
    const depCountSeries = (() => {
      const m = /* @__PURE__ */ new Map();
      for (const d of departuresTable) {
        const date = ((d == null ? void 0 : d.date) || "").slice(0, 10);
        if (!date) continue;
        m.set(date, (m.get(date) || 0) + 1);
      }
      return Array.from(m.entries()).map(([date, value]) => ({
        date,
        label: date,
        value
      }));
    })();
    const depBucketed = bucketSeries(depCountSeries, effectiveView);
    breakdownData.forEach((row) => {
      const hit = depBucketed.find((p) => p.label === row.period);
      row.departures = (hit == null ? void 0 : hit.value) ?? 0;
    });
  }
  const globalCurrency = ((_a = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a.currency) || "USD";
  const formatCurrencyAmount = (amount) => formatYatraMoney(Number(amount) || 0, globalCurrency, {
    zeroAsUnknown: false
  });
  const renderTableHeaders = () => {
    switch (selectedCategory) {
      case "booking-overview":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Period", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Total Bookings", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Confirmed", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Pending", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Cancelled", "yatra") })
        ] });
      case "revenue-analysis":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Period", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Total Revenue", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Bookings", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Avg Booking Value", "yatra") })
        ] });
      case "trip-performance":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Period", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Trip Bookings", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Occupancy Rate", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Revenue", "yatra") })
        ] });
      case "departure-management":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Period", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Departures", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Total Capacity", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Booked", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Utilization", "yatra") })
        ] });
      case "customer-insights":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Period", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("New Customers", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Returning Customers", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Satisfaction", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Total Revenue", "yatra") })
        ] });
      case "operational-metrics":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Period", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Lead Time (days)", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Cancellation Rate", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Efficiency", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Bookings", "yatra") })
        ] });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Period", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Bookings", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: __("Revenue", "yatra") })
        ] });
    }
  };
  const renderTableRows = () => {
    return breakdownData.map((row, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white", children: row.period }),
      selectedCategory === "booking-overview" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400", children: row.bookings }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400", children: row.confirmed }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400", children: row.pending }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400", children: row.cancelled }) })
      ] }),
      selectedCategory === "revenue-analysis" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400", children: formatCurrencyAmount(row.revenue) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400", children: row.bookings }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600 dark:text-purple-400", children: formatCurrencyAmount(row.avgBookingValue) })
      ] }),
      selectedCategory === "trip-performance" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400", children: row.bookings }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "bg-green-500 h-2 rounded-full",
              style: { width: `${row.occupancyRate}%` }
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-medium", children: [
            row.occupancyRate,
            "%"
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400", children: formatCurrencyAmount(row.revenue) })
      ] }),
      selectedCategory === "departure-management" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400", children: row.departures }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300", children: row.capacity }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400", children: row.booked }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "bg-green-500 h-2 rounded-full",
              style: {
                width: row.capacity > 0 ? `${Math.round(row.booked / row.capacity * 100)}%` : "0%"
              }
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-medium", children: [
            row.capacity > 0 ? Math.round(row.booked / row.capacity * 100) : 0,
            "%"
          ] })
        ] }) })
      ] })
    ] }, index));
  };
  const categoriesWithoutBreakdown = /* @__PURE__ */ new Set([
    "customer-insights",
    "operational-metrics"
  ]);
  if (categoriesWithoutBreakdown.has(selectedCategory)) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-dashed border-gray-300 dark:border-gray-700 py-10 text-center text-sm text-gray-500 dark:text-gray-400", children: __(
      "Per-period breakdown isn't available for this section. The summary cards above show the aggregate for the selected date range.",
      "yatra"
    ) });
  }
  if (breakdownData.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-dashed border-gray-300 dark:border-gray-700 py-10 text-center text-sm text-gray-500 dark:text-gray-400", children: __("No data in this date range yet.", "yatra") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-x-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full divide-y divide-gray-200 dark:divide-gray-700", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50 dark:bg-gray-800", children: renderTableHeaders() }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700", children: renderTableRows() })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Total Bookings", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-bold text-blue-600 dark:text-blue-400", children: breakdownData.reduce((sum, row) => sum + row.bookings, 0) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Total Revenue", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-bold text-green-600 dark:text-green-400", children: formatCurrencyAmount(
          breakdownData.reduce((sum, row) => sum + row.revenue, 0)
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Total Departures", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-bold text-purple-600 dark:text-purple-400", children: breakdownData.reduce((sum, row) => sum + row.departures, 0) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Avg Occupancy", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-bold text-orange-600 dark:text-orange-400", children: [
          (breakdownData.reduce((sum, row) => sum + row.occupancyRate, 0) / breakdownData.length).toFixed(1),
          "%"
        ] })
      ] })
    ] }) })
  ] });
};
const FacebookPixelReports = () => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const [clearingLogs, setClearingLogs] = reactExports.useState(false);
  const { showToast } = useToast();
  const {
    data: freshPixelData,
    refetch: refetchPixelData,
    isLoading: isPixelLoading
  } = useQuery({
    queryKey: ["facebook-pixel-status"],
    queryFn: async () => {
      const response = await apiService.getFacebookPixelSettings();
      return (response == null ? void 0 : response.data) || {};
    },
    refetchInterval: 3e4
    // Refresh every 30 seconds
  });
  const facebookPixelData = freshPixelData || ((_a = window.yatraAdmin) == null ? void 0 : _a.facebookPixel) || {};
  const getEventStats = () => {
    const logs = facebookPixelData.eventLogs || [];
    return {
      success: logs.filter((log) => log.status === "success").length,
      errors: logs.filter((log) => log.status === "error").length,
      total: logs.length
    };
  };
  const getRecentEvents = () => {
    const logs = facebookPixelData.eventLogs || [];
    return logs.slice(-10).reverse();
  };
  const clearPixelLogs = async () => {
    setClearingLogs(true);
    try {
      const response = await apiService.clearFacebookPixelEventLogs();
      if (response.success) {
        showToast(__("Event logs cleared successfully.", "yatra"), "success");
        await refetchPixelData();
      }
    } catch (error) {
      showToast(error.message || __("Failed to clear logs.", "yatra"), "error");
    } finally {
      setClearingLogs(false);
    }
  };
  const eventStats = getEventStats();
  const recentEvents = getRecentEvents();
  const fbModuleActive = isProPluginActive() && isModuleActive("facebook_pixel");
  if (!fbModuleActive || !facebookPixelData.pixel_id) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "svg",
        {
          className: "w-8 h-8 text-gray-400",
          fill: "currentColor",
          viewBox: "0 0 24 24",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" })
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2", children: __("Facebook Pixel Not Configured", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-4", children: !fbModuleActive ? __(
        "Enable the Facebook Pixel module under Modules and add your Pixel ID in Settings to start tracking conversion events.",
        "yatra"
      ) : __(
        "Configure your Facebook Pixel in Settings to start tracking conversion events.",
        "yatra"
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: `${((_b = window.yatraAdmin) == null ? void 0 : _b.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=${!fbModuleActive ? "modules" : "settings#integration"}`,
          className: "inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
          children: !fbModuleActive ? __("Open Modules", "yatra") : __("Configure Facebook Pixel", "yatra")
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Connection Status", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          onClick: () => {
            refetchPixelData();
            showToast(__("Status refreshed successfully!", "yatra"), "success");
          },
          variant: "outline",
          size: "sm",
          disabled: isPixelLoading,
          children: isPixelLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "svg",
              {
                className: "animate-spin -ml-1 mr-2 h-4 w-4",
                fill: "none",
                viewBox: "0 0 24 24",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "circle",
                    {
                      className: "opacity-25",
                      cx: "12",
                      cy: "12",
                      r: "10",
                      stroke: "currentColor",
                      strokeWidth: "4"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "path",
                    {
                      className: "opacity-75",
                      fill: "currentColor",
                      d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    }
                  )
                ]
              }
            ),
            __("Refreshing...", "yatra")
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "svg",
              {
                className: "-ml-1 mr-2 h-4 w-4",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  }
                )
              }
            ),
            __("Refresh Status", "yatra")
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `p-4 rounded-lg border ${((_c = facebookPixelData.connectionStatus) == null ? void 0 : _c.pixelConnected) ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("Pixel Connection", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 mt-1", children: ((_d = facebookPixelData.connectionStatus) == null ? void 0 : _d.pixelConnected) ? __("Connected", "yatra") : __("Not Connected", "yatra") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `w-8 h-8 rounded-full flex items-center justify-center ${((_e = facebookPixelData.connectionStatus) == null ? void 0 : _e.pixelConnected) ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`,
                children: ((_f = facebookPixelData.connectionStatus) == null ? void 0 : _f.pixelConnected) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    className: "w-4 h-4 text-green-600 dark:text-green-400",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M5 13l4 4L19 7"
                      }
                    )
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    className: "w-4 h-4 text-red-600 dark:text-red-400",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M6 18L18 6M6 6l12 12"
                      }
                    )
                  }
                )
              }
            )
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `p-4 rounded-lg border ${((_g = facebookPixelData.connectionStatus) == null ? void 0 : _g.tokenConnected) ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("API Token", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 mt-1", children: ((_h = facebookPixelData.connectionStatus) == null ? void 0 : _h.tokenConnected) ? __("Valid", "yatra") : __("Invalid", "yatra") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `w-8 h-8 rounded-full flex items-center justify-center ${((_i = facebookPixelData.connectionStatus) == null ? void 0 : _i.tokenConnected) ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`,
                children: ((_j = facebookPixelData.connectionStatus) == null ? void 0 : _j.tokenConnected) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    className: "w-4 h-4 text-green-600 dark:text-green-400",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M5 13l4 4L19 7"
                      }
                    )
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    className: "w-4 h-4 text-red-600 dark:text-red-400",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M6 18L18 6M6 6l12 12"
                      }
                    )
                  }
                )
              }
            )
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("Pixel ID", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 mt-1", children: facebookPixelData.pixel_id || __("Not Set", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "svg",
          {
            className: "w-4 h-4 text-blue-600 dark:text-blue-400",
            fill: "currentColor",
            viewBox: "0 0 24 24",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" })
          }
        ) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Event Statistics", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            onClick: () => clearPixelLogs(),
            variant: "outline",
            size: "sm",
            disabled: clearingLogs,
            children: clearingLogs ? __("Clearing...", "yatra") : __("Clear Logs", "yatra")
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-green-600 dark:text-green-400", children: eventStats.success }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: __("Successful Events", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-red-600 dark:text-red-400", children: eventStats.errors }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: __("Failed Events", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-blue-600 dark:text-blue-400", children: eventStats.total }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: __("Total Events", "yatra") })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Recent Activity", "yatra") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: recentEvents.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: recentEvents.map((log, index) => {
        var _a2, _b2, _c2;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `w-8 h-8 rounded-full flex items-center justify-center ${log.status === "success" ? "bg-green-100 dark:bg-green-900/30" : log.status === "error" ? "bg-red-100 dark:bg-red-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`,
                    children: [
                      log.status === "success" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "svg",
                        {
                          className: "w-4 h-4 text-green-600 dark:text-green-400",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "path",
                            {
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              strokeWidth: 2,
                              d: "M5 13l4 4L19 7"
                            }
                          )
                        }
                      ),
                      log.status === "error" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "svg",
                        {
                          className: "w-4 h-4 text-red-600 dark:text-red-400",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "path",
                            {
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              strokeWidth: 2,
                              d: "M6 18L18 6M6 6l12 12"
                            }
                          )
                        }
                      ),
                      log.status === "logged" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "svg",
                        {
                          className: "w-4 h-4 text-blue-600 dark:text-blue-400",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "path",
                            {
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              strokeWidth: 2,
                              d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            }
                          )
                        }
                      )
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: log.event_name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: ((_a2 = log.event_data) == null ? void 0 : _a2.trip_name) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      __("Trip:", "yatra"),
                      " "
                    ] }),
                    ((_b2 = log.event_data) == null ? void 0 : _b2.trip_url) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "a",
                      {
                        href: log.event_data.trip_url,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-blue-600 hover:text-blue-800 underline",
                        children: log.event_data.trip_name
                      }
                    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: log.event_data.trip_name })
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: log.event_type || "Frontend" }) }),
                  ((_c2 = log.event_data) == null ? void 0 : _c2.value) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-500", children: [
                    __("Value:", "yatra"),
                    " ",
                    log.event_data.currency || "USD",
                    " ",
                    log.event_data.value
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: new Date(log.timestamp).toLocaleTimeString() }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-600 dark:text-gray-400", children: new Date(log.timestamp).toLocaleDateString() })
              ] })
            ]
          },
          index
        );
      }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "svg",
          {
            className: "w-6 h-6 text-gray-400",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              }
            )
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2", children: __("No Events Yet", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400", children: __(
          "Events will appear here once users start interacting with your site.",
          "yatra"
        ) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: __("Quick Links", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: `https://www.facebook.com/events_manager2/list/pixel/${facebookPixelData.pixel_id}/test_events`,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "svg",
                {
                  className: "w-4 h-4 text-blue-600 dark:text-blue-400",
                  fill: "currentColor",
                  viewBox: "0 0 24 24",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" })
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: __("Test Events", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Facebook Events Manager", "yatra") })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: `${((_k = window.yatraAdmin) == null ? void 0 : _k.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=settings#integration`,
            className: "flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "svg",
                {
                  className: "w-4 h-4 text-blue-600 dark:text-blue-400",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      }
                    )
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: __("Pixel Settings", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Configuration & Options", "yatra") })
              ] })
            ]
          }
        )
      ] })
    ] })
  ] });
};
const GoogleAnalyticsReports = () => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const [clearingLogs, setClearingLogs] = reactExports.useState(false);
  const { showToast } = useToast();
  const {
    data: freshGAData,
    refetch: refetchGAData,
    isLoading: isGALoading
  } = useQuery({
    queryKey: ["google-analytics-status"],
    queryFn: async () => {
      const raw = await apiService.getGoogleAnalyticsSettings();
      const payload = unwrapApiPayload(raw);
      return payload && typeof payload === "object" ? payload : {};
    },
    refetchInterval: 3e4
    // Refresh every 30 seconds
  });
  const googleAnalyticsData = freshGAData || {};
  const getEventStats = () => {
    const logs = googleAnalyticsData.eventLogs || [];
    return {
      success: logs.filter((log) => log.status === "success").length,
      errors: logs.filter((log) => log.status === "error").length,
      total: logs.length
    };
  };
  const getRecentEvents = () => {
    const logs = googleAnalyticsData.eventLogs || [];
    return logs.slice(-10).reverse();
  };
  const clearGALogs = async () => {
    setClearingLogs(true);
    try {
      const raw = await apiService.clearGoogleAnalyticsEventLogs();
      if (raw == null ? void 0 : raw.success) {
        showToast(__("Event logs cleared successfully.", "yatra"), "success");
        await refetchGAData();
      }
    } catch (error) {
      showToast(error.message || __("Failed to clear logs.", "yatra"), "error");
    } finally {
      setClearingLogs(false);
    }
  };
  const eventStats = getEventStats();
  const recentEvents = getRecentEvents();
  const gaModuleActive = isProPluginActive() && isModuleActive("google_analytics");
  if (!gaModuleActive || !googleAnalyticsData.measurement_id) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "svg",
        {
          className: "w-8 h-8 text-gray-400",
          fill: "currentColor",
          viewBox: "0 0 24 24",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2", children: __("Google Analytics 4 Not Configured", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-4", children: !gaModuleActive ? __(
        "Enable the Google Analytics 4 module under Modules and add your Measurement ID in Settings to start tracking conversion events.",
        "yatra"
      ) : __(
        "Configure your Google Analytics 4 in Settings to start tracking conversion events.",
        "yatra"
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: `${((_a = window.yatraAdmin) == null ? void 0 : _a.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=${!gaModuleActive ? "modules" : "settings#integration"}`,
          className: "inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
          children: !gaModuleActive ? __("Open Modules", "yatra") : __("Configure Google Analytics 4", "yatra")
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Connection Status", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          onClick: () => {
            refetchGAData();
            showToast(__("Status refreshed successfully!", "yatra"), "success");
          },
          variant: "outline",
          size: "sm",
          disabled: isGALoading,
          children: isGALoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "svg",
              {
                className: "animate-spin -ml-1 mr-2 h-4 w-4",
                fill: "none",
                viewBox: "0 0 24 24",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "circle",
                    {
                      className: "opacity-25",
                      cx: "12",
                      cy: "12",
                      r: "10",
                      stroke: "currentColor",
                      strokeWidth: "4"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "path",
                    {
                      className: "opacity-75",
                      fill: "currentColor",
                      d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    }
                  )
                ]
              }
            ),
            __("Refreshing...", "yatra")
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "svg",
              {
                className: "-ml-1 mr-2 h-4 w-4",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  }
                )
              }
            ),
            __("Refresh Status", "yatra")
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `p-4 rounded-lg border ${((_b = googleAnalyticsData.connectionStatus) == null ? void 0 : _b.measurementConnected) ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("Measurement ID", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 mt-1", children: ((_c = googleAnalyticsData.connectionStatus) == null ? void 0 : _c.measurementConnected) ? __("Connected", "yatra") : __("Not Connected", "yatra") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `w-8 h-8 rounded-full flex items-center justify-center ${((_d = googleAnalyticsData.connectionStatus) == null ? void 0 : _d.measurementConnected) ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`,
                children: ((_e = googleAnalyticsData.connectionStatus) == null ? void 0 : _e.measurementConnected) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    className: "w-4 h-4 text-green-600 dark:text-green-400",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M5 13l4 4L19 7"
                      }
                    )
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    className: "w-4 h-4 text-red-600 dark:text-red-400",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M6 18L18 6M6 6l12 12"
                      }
                    )
                  }
                )
              }
            )
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `p-4 rounded-lg border ${((_f = googleAnalyticsData.connectionStatus) == null ? void 0 : _f.apiSecretConnected) ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("API Secret", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 mt-1", children: ((_g = googleAnalyticsData.connectionStatus) == null ? void 0 : _g.apiSecretConnected) ? __("Valid", "yatra") : __("Invalid", "yatra") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `w-8 h-8 rounded-full flex items-center justify-center ${((_h = googleAnalyticsData.connectionStatus) == null ? void 0 : _h.apiSecretConnected) ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`,
                children: ((_i = googleAnalyticsData.connectionStatus) == null ? void 0 : _i.apiSecretConnected) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    className: "w-4 h-4 text-green-600 dark:text-green-400",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M5 13l4 4L19 7"
                      }
                    )
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    className: "w-4 h-4 text-red-600 dark:text-red-400",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M6 18L18 6M6 6l12 12"
                      }
                    )
                  }
                )
              }
            )
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("Measurement Protocol", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 mt-1", children: googleAnalyticsData.use_measurement_protocol ? __("Enabled", "yatra") : __("Disabled", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "svg",
          {
            className: "w-4 h-4 text-blue-600 dark:text-blue-400",
            fill: "currentColor",
            viewBox: "0 0 24 24",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" })
            ]
          }
        ) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Event Statistics", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            onClick: () => clearGALogs(),
            variant: "outline",
            size: "sm",
            disabled: clearingLogs,
            children: clearingLogs ? __("Clearing...", "yatra") : __("Clear Logs", "yatra")
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-green-600 dark:text-green-400", children: eventStats.success }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: __("Successful Events", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-red-600 dark:text-red-400", children: eventStats.errors }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: __("Failed Events", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-blue-600 dark:text-blue-400", children: eventStats.total }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: __("Total Events", "yatra") })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Recent Activity", "yatra") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: recentEvents.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: recentEvents.map((log, index) => {
        var _a2, _b2, _c2;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `w-8 h-8 rounded-full flex items-center justify-center ${log.status === "success" ? "bg-green-100 dark:bg-green-900/30" : log.status === "error" ? "bg-red-100 dark:bg-red-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`,
                    children: [
                      log.status === "success" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "svg",
                        {
                          className: "w-4 h-4 text-green-600 dark:text-green-400",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "path",
                            {
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              strokeWidth: 2,
                              d: "M5 13l4 4L19 7"
                            }
                          )
                        }
                      ),
                      log.status === "error" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "svg",
                        {
                          className: "w-4 h-4 text-red-600 dark:text-red-400",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "path",
                            {
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              strokeWidth: 2,
                              d: "M6 18L18 6M6 6l12 12"
                            }
                          )
                        }
                      ),
                      log.status === "logged" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "svg",
                        {
                          className: "w-4 h-4 text-blue-600 dark:text-blue-400",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "path",
                            {
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              strokeWidth: 2,
                              d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            }
                          )
                        }
                      )
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: log.event_name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: ((_a2 = log.event_data) == null ? void 0 : _a2.trip_name) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      __("Trip:", "yatra"),
                      " "
                    ] }),
                    ((_b2 = log.event_data) == null ? void 0 : _b2.trip_url) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "a",
                      {
                        href: log.event_data.trip_url,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-blue-600 hover:text-blue-800 underline",
                        children: log.event_data.trip_name
                      }
                    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: log.event_data.trip_name })
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: log.event_type || "Frontend" }) }),
                  ((_c2 = log.event_data) == null ? void 0 : _c2.value) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-500", children: [
                    __("Value:", "yatra"),
                    " ",
                    log.event_data.currency || "USD",
                    " ",
                    log.event_data.value
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: new Date(log.timestamp).toLocaleTimeString() }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-600 dark:text-gray-400", children: new Date(log.timestamp).toLocaleDateString() })
              ] })
            ]
          },
          index
        );
      }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "svg",
          {
            className: "w-6 h-6 text-gray-400",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              }
            )
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2", children: __("No Events Yet", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400", children: __(
          "Events will appear here once users start interacting with your site.",
          "yatra"
        ) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: __("Quick Links", "yatra") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: `https://analytics.google.com/analytics/web/#/debugview`,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "svg",
                {
                  className: "w-4 h-4 text-blue-600 dark:text-blue-400",
                  fill: "currentColor",
                  viewBox: "0 0 24 24",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" })
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: __("Debug View", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Google Analytics Debug", "yatra") })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: `${((_j = window.yatraAdmin) == null ? void 0 : _j.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=settings#integration`,
            className: "flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "svg",
                {
                  className: "w-4 h-4 text-blue-600 dark:text-blue-400",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      }
                    )
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: __("GA4 Settings", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Configuration & Options", "yatra") })
              ] })
            ]
          }
        )
      ] })
    ] })
  ] });
};
const TravelBookingReports = () => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
  const visibleCategories = reactExports.useMemo(
    () => TravelReportCategories.filter((c) => canCap(c.cap)),
    []
  );
  const [selectedCategory, setSelectedCategory] = reactExports.useState(
    () => {
      var _a2;
      return ((_a2 = visibleCategories[0]) == null ? void 0 : _a2.id) || "booking-overview";
    }
  );
  const [dateRange, setDateRange] = reactExports.useState("last_30_days");
  const [viewType, setViewType] = reactExports.useState("summary");
  React.useEffect(() => {
    var _a2;
    if (!visibleCategories.some((c) => c.id === selectedCategory)) {
      const fallback = (_a2 = visibleCategories[0]) == null ? void 0 : _a2.id;
      if (fallback) setSelectedCategory(fallback);
    }
  }, [visibleCategories, selectedCategory]);
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["yatra-travel-reports", dateRange],
    queryFn: async () => {
      const params = getDateRangeParams(dateRange);
      const response = await apiClient.get(
        `/reports?date_from=${params.start}&date_to=${params.end}`
      );
      return (response == null ? void 0 : response.data) || {};
    }
  });
  function getDateRangeParams(range) {
    const today = /* @__PURE__ */ new Date();
    const start = /* @__PURE__ */ new Date();
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
      end: today.toISOString().split("T")[0]
    };
  }
  const travelKPIs = reactExports.useMemo(() => {
    var _a2, _b2, _c2, _d2, _e2, _f2;
    if (!reportData)
      return {
        totalBookings: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        avgBookingValue: 0,
        cancellationRate: 0,
        upcomingDepartures: 0
      };
    return {
      totalBookings: ((_a2 = reportData.booking_stats) == null ? void 0 : _a2.total) || 0,
      totalRevenue: ((_b2 = reportData.revenue_stats) == null ? void 0 : _b2.total) || 0,
      occupancyRate: ((_c2 = reportData.operational_stats) == null ? void 0 : _c2.occupancyRate) || 0,
      avgBookingValue: ((_d2 = reportData.revenue_stats) == null ? void 0 : _d2.average) || 0,
      cancellationRate: ((_e2 = reportData.booking_stats) == null ? void 0 : _e2.cancellationRate) || 0,
      upcomingDepartures: ((_f2 = reportData.operational_stats) == null ? void 0 : _f2.upcomingDepartures) || 0
    };
  }, [reportData]);
  const globalCurrency = ((_a = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a.currency) || "USD";
  const formatCurrencyAmount = (amount) => formatYatraMoney(Number(amount) || 0, globalCurrency, {
    zeroAsUnknown: false
  });
  const handleExportCsv = () => {
    const params = getDateRangeParams(dateRange);
    const rows = [];
    rows.push(["Yatra Reports — Summary"]);
    rows.push([
      `Date range: ${params.start} to ${params.end}`
    ]);
    rows.push([]);
    rows.push(["Metric", "Value"]);
    rows.push(["Total bookings", travelKPIs.totalBookings]);
    rows.push(["Total revenue", travelKPIs.totalRevenue]);
    rows.push(["Avg booking value", travelKPIs.avgBookingValue]);
    rows.push(["Occupancy rate (%)", travelKPIs.occupancyRate]);
    rows.push(["Cancellation rate (%)", travelKPIs.cancellationRate]);
    rows.push(["Upcoming departures", travelKPIs.upcomingDepartures]);
    rows.push([]);
    const trend = (reportData == null ? void 0 : reportData.booking_trend) || [];
    const revenueTrend = (reportData == null ? void 0 : reportData.revenue_trend) || [];
    if (trend.length) {
      rows.push(["Day", "Bookings", "Revenue"]);
      trend.forEach((row, i) => {
        var _a2;
        rows.push([
          row.date || row.label,
          row.value,
          ((_a2 = revenueTrend[i]) == null ? void 0 : _a2.value) ?? ""
        ]);
      });
      rows.push([]);
    }
    const tp = (reportData == null ? void 0 : reportData.trip_performance) || [];
    if (tp.length) {
      rows.push(["Trip", "Bookings", "Revenue", "Occupancy %"]);
      tp.forEach((t) => {
        rows.push([t.label, t.value, t.revenue, t.occupancy]);
      });
      rows.push([]);
    }
    const pm = (reportData == null ? void 0 : reportData.payment_methods) || [];
    if (pm.length) {
      rows.push(["Payment method", "Count", "Revenue"]);
      pm.forEach((m) => {
        rows.push([m.method, m.count, m.revenue]);
      });
      rows.push([]);
    }
    const dest = (reportData == null ? void 0 : reportData.top_destinations) || [];
    if (dest.length) {
      rows.push(["Destination", "Bookings", "Revenue"]);
      dest.forEach((d) => {
        rows.push([d.label, d.value, d.revenue]);
      });
      rows.push([]);
    }
    const blob = buildCsv(rows);
    downloadCsv(blob, csvFilename("reports", params.start, params.end));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SVGIcons.BarChart, {}),
          __("Travel Booking Reports", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __(
          "Essential analytics for your travel booking business.",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: dateRange,
            onChange: (e) => setDateRange(e.target.value),
            className: "rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white",
            "aria-label": __("Date range", "yatra"),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "today", children: __("Today", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "last_7_days", children: __("Last 7 days", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "last_30_days", children: __("Last 30 days", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "last_90_days", children: __("Last 90 days", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "this_year", children: __("This year", "yatra") })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: viewType,
            onChange: (e) => setViewType(e.target.value),
            className: "rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white",
            "aria-label": __("Breakdown view", "yatra"),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "summary", children: __("Summary View", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "daily", children: __("Daily Breakdown", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "weekly", children: __("Weekly Breakdown", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "monthly", children: __("Monthly Breakdown", "yatra") })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            onClick: handleExportCsv,
            disabled: isLoading || !reportData,
            title: __("Download this report's data as CSV", "yatra"),
            children: __("Export CSV", "yatra")
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: [...Array(6)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, {}, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Total Bookings", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: travelKPIs.totalBookings })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SVGIcons.Calendar, {}) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Total Revenue", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrencyAmount(travelKPIs.totalRevenue) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SVGIcons.DollarSign, {}) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Occupancy Rate", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl font-bold text-purple-600 dark:text-purple-400", children: [
            travelKPIs.occupancyRate.toFixed(1),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SVGIcons.Target, {}) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Avg Booking Value", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-amber-600 dark:text-amber-400", children: formatCurrencyAmount(travelKPIs.avgBookingValue) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SVGIcons.BarChart, {}) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Cancellation Rate", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl font-bold text-red-600 dark:text-red-400", children: [
            travelKPIs.cancellationRate.toFixed(1),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-red-50 dark:bg-red-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SVGIcons.XCircle, {}) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Upcoming Departures", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-blue-600 dark:text-blue-400", children: travelKPIs.upcomingDepartures })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SVGIcons.Truck, {}) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SVGIcons.BarChart, {}),
          __("Travel Business Reports", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
          "Comprehensive analytics for your travel booking operations",
          "yatra"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-gray-200 dark:border-gray-700 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pt-2 pb-3 md:hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "label",
            {
              htmlFor: "yatra-report-section-select",
              className: "mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400",
              children: __("Report section", "yatra")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Select,
            {
              id: "yatra-report-section-select",
              value: selectedCategory,
              onChange: (e) => setSelectedCategory(e.target.value),
              "aria-label": __("Report section", "yatra"),
              children: visibleCategories.map((category) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: category.id, children: __(category.title, "yatra") }, category.id))
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "nav",
          {
            className: "hidden md:flex min-w-0 flex-nowrap items-stretch gap-1 overflow-x-auto overflow-y-hidden scroll-smooth px-4 pe-6 pb-1 sm:px-6 sm:pe-8 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]",
            "aria-label": __("Report sections", "yatra"),
            children: visibleCategories.map((category) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setSelectedCategory(category.id),
                className: `shrink-0 snap-start inline-flex max-w-none items-center gap-2 rounded-t-md border-b-2 px-3 py-3 text-left text-sm font-medium whitespace-nowrap transition-colors sm:px-4 sm:py-3.5 ${selectedCategory === category.id ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30" : "border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:hover:border-gray-600 dark:hover:bg-gray-800/50 dark:hover:text-gray-200"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex shrink-0 [&_svg]:h-5 [&_svg]:w-5", children: React.createElement(
                    SVGIcons[category.icon]
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "leading-tight", children: __(category.title, "yatra") })
                ]
              },
              category.id
            ))
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonReportSection, {}) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      selectedCategory === "booking-overview" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: __("Booking Overview", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Confirmed Bookings", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-green-600", children: ((_b = reportData == null ? void 0 : reportData.booking_stats) == null ? void 0 : _b.confirmed) || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Pending Bookings", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-yellow-600", children: ((_c = reportData == null ? void 0 : reportData.booking_stats) == null ? void 0 : _c.pending) || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Cancelled Bookings", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-red-600", children: ((_d = reportData == null ? void 0 : reportData.booking_stats) == null ? void 0 : _d.cancelled) || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Completed Bookings", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-blue-600", children: ((_e = reportData == null ? void 0 : reportData.booking_stats) == null ? void 0 : _e.completed) || 0 })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Booking Status Distribution", "yatra") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              BookingStatusChart,
              {
                data: [
                  {
                    label: "Confirmed",
                    value: ((_f = reportData == null ? void 0 : reportData.booking_stats) == null ? void 0 : _f.confirmed) || 0,
                    color: "#10b981"
                  },
                  {
                    label: "Pending",
                    value: ((_g = reportData == null ? void 0 : reportData.booking_stats) == null ? void 0 : _g.pending) || 0,
                    color: "#f59e0b"
                  },
                  {
                    label: "Cancelled",
                    value: ((_h = reportData == null ? void 0 : reportData.booking_stats) == null ? void 0 : _h.cancelled) || 0,
                    color: "#ef4444"
                  },
                  {
                    label: "Completed",
                    value: ((_i = reportData == null ? void 0 : reportData.booking_stats) == null ? void 0 : _i.completed) || 0,
                    color: "#3b82f6"
                  }
                ]
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Revenue Trend", "yatra") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              BookingsOverviewChart,
              {
                data: (reportData == null ? void 0 : reportData.revenue_trend) || [],
                currency: globalCurrency
              }
            ) })
          ] })
        ] })
      ] }),
      selectedCategory === "revenue-analysis" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Revenue Analysis" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Total Revenue" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-green-600", children: formatCurrencyAmount(
              ((_j = reportData == null ? void 0 : reportData.revenue_stats) == null ? void 0 : _j.total) || 0
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Average Booking Value" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-blue-600", children: formatCurrencyAmount(
              ((_k = reportData == null ? void 0 : reportData.revenue_stats) == null ? void 0 : _k.average) || 0
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Revenue Lost (Cancellations)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-red-600", children: formatCurrencyAmount(
              ((_l = reportData == null ? void 0 : reportData.cancellations) == null ? void 0 : _l.revenueLost) || 0
            ) })
          ] })
        ] })
      ] }),
      selectedCategory === "trip-performance" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Trip Performance" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: ((reportData == null ? void 0 : reportData.trip_performance) || []).slice(0, 5).map((trip, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: trip.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: [
                  trip.value,
                  " bookings"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-green-600", children: formatCurrencyAmount(trip.revenue || 0) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Revenue" })
              ] })
            ]
          },
          index
        )) })
      ] }),
      selectedCategory === "departure-management" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Departure Management" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Upcoming Departures" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-blue-600", children: ((_m = reportData == null ? void 0 : reportData.operational_stats) == null ? void 0 : _m.upcomingDepartures) || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Total Capacity" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-purple-600", children: ((_n = reportData == null ? void 0 : reportData.operational_stats) == null ? void 0 : _n.totalCapacity) || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Booked Capacity" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-green-600", children: ((_o = reportData == null ? void 0 : reportData.operational_stats) == null ? void 0 : _o.bookedCapacity) || 0 })
          ] })
        ] })
      ] }),
      selectedCategory === "customer-insights" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Customer Insights" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Total Customers" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-blue-600", children: ((_p = reportData == null ? void 0 : reportData.customer_analytics) == null ? void 0 : _p.totalCustomers) || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "New Customers" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-green-600", children: ((_q = reportData == null ? void 0 : reportData.customer_analytics) == null ? void 0 : _q.newCustomers) || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Returning Customers" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-purple-600", children: ((_r = reportData == null ? void 0 : reportData.customer_analytics) == null ? void 0 : _r.returningCustomers) || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Customer Lifetime Value" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-orange-600", children: formatCurrencyAmount(
              ((_s = reportData == null ? void 0 : reportData.customer_analytics) == null ? void 0 : _s.customerLifetimeValue) || 0
            ) })
          ] })
        ] })
      ] }),
      selectedCategory === "operational-metrics" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Operational Metrics" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Occupancy Rate" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl font-bold text-green-600", children: [
              (((_t = reportData == null ? void 0 : reportData.operational_stats) == null ? void 0 : _t.occupancyRate) || 0).toFixed(1),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Average Group Size" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-blue-600", children: (((_u = reportData == null ? void 0 : reportData.operational_stats) == null ? void 0 : _u.averageGroupSize) || 0).toFixed(1) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Cancellation Rate" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl font-bold text-red-600", children: [
              (((_v = reportData == null ? void 0 : reportData.booking_stats) == null ? void 0 : _v.cancellationRate) || 0).toFixed(1),
              "%"
            ] })
          ] })
        ] })
      ] }),
      selectedCategory === "revenue-analysis" && Array.isArray(reportData == null ? void 0 : reportData.payment_methods) && reportData.payment_methods.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 text-lg font-semibold text-gray-900 dark:text-white", children: __("Payment Methods", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs text-gray-500 dark:text-gray-400", children: __(
          "Bookings and gross revenue split by payment gateway. Ranked by revenue.",
          "yatra"
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3", children: reportData.payment_methods.slice(0, 6).map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400", children: m.method }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400", children: formatCurrencyAmount(m.revenue) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
                m.count,
                " ",
                __("bookings", "yatra")
              ] })
            ]
          },
          m.method
        )) })
      ] }),
      selectedCategory === "trip-performance" && Array.isArray(reportData == null ? void 0 : reportData.top_destinations) && reportData.top_destinations.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 text-lg font-semibold text-gray-900 dark:text-white", children: __("Top Destinations", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs text-gray-500 dark:text-gray-400", children: __(
          "Booking count and revenue by primary destination. Useful for spotting geographic concentration.",
          "yatra"
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: reportData.top_destinations.map((d) => {
          const max = Math.max(
            1,
            ...reportData.top_destinations.map(
              (x) => x.value
            )
          );
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center gap-3",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-32 truncate text-sm text-gray-700 dark:text-gray-200", children: d.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative h-3 flex-1 rounded-full bg-gray-100 dark:bg-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "h-3 rounded-full bg-blue-500",
                    style: {
                      width: `${Math.max(2, d.value / max * 100)}%`
                    }
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 text-right text-sm tabular-nums text-gray-700 dark:text-gray-200", children: d.value }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 text-right text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400", children: formatCurrencyAmount(d.revenue || 0) })
              ]
            },
            d.label
          );
        }) })
      ] }),
      selectedCategory === "operational-metrics" && (reportData == null ? void 0 : reportData.lead_time) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 text-lg font-semibold text-gray-900 dark:text-white", children: __("Booking Lead Time", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-3 text-xs text-gray-500 dark:text-gray-400", children: [
          __(
            "Time between booking creation and travel date. Average:",
            "yatra"
          ),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-gray-700 dark:text-gray-200", children: [
            Number(reportData.lead_time.averageDays || 0).toFixed(1),
            " ",
            __("days", "yatra")
          ] }),
          " ",
          "(",
          reportData.lead_time.sampleSize,
          " ",
          __("bookings sampled", "yatra"),
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: (reportData.lead_time.buckets || []).map(
          (b) => {
            const total = (reportData.lead_time.buckets || []).reduce((s, x) => s + x.value, 0);
            const pct = total > 0 ? Math.round(b.value / total * 100) : 0;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center gap-3",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-44 truncate text-sm text-gray-700 dark:text-gray-200", children: b.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative h-3 flex-1 rounded-full bg-gray-100 dark:bg-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "h-3 rounded-full",
                      style: {
                        width: `${Math.max(2, pct)}%`,
                        background: b.color || "#3b82f6"
                      }
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 text-right text-sm tabular-nums text-gray-700 dark:text-gray-200", children: b.value }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-12 text-right text-xs text-gray-500 dark:text-gray-400", children: [
                    pct,
                    "%"
                  ] })
                ]
              },
              b.label
            );
          }
        ) })
      ] }),
      selectedCategory === "operational-metrics" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 text-lg font-semibold text-gray-900 dark:text-white", children: __("Refunds", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400", children: __("Refunds issued", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-lg font-semibold tabular-nums text-red-600 dark:text-red-400", children: ((_w = reportData == null ? void 0 : reportData.refunds) == null ? void 0 : _w.count) ?? 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400", children: __("Refund total", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-lg font-semibold tabular-nums text-red-600 dark:text-red-400", children: formatCurrencyAmount(
              Number((_x = reportData == null ? void 0 : reportData.refunds) == null ? void 0 : _x.total) || 0
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400", children: __("Refund rate", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-lg font-semibold tabular-nums text-amber-600 dark:text-amber-400", children: [
              Number(((_y = reportData == null ? void 0 : reportData.refunds) == null ? void 0 : _y.refundRate) || 0).toFixed(
                1
              ),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400", children: __("Avg refund", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-lg font-semibold tabular-nums text-gray-700 dark:text-gray-200", children: formatCurrencyAmount(
              Number((_z = reportData == null ? void 0 : reportData.refunds) == null ? void 0 : _z.avgRefund) || 0
            ) })
          ] })
        ] })
      ] }),
      selectedCategory === "facebook-pixel" && /* @__PURE__ */ jsxRuntimeExports.jsx(FacebookPixelReports, {}),
      selectedCategory === "google-analytics" && /* @__PURE__ */ jsxRuntimeExports.jsx(GoogleAnalyticsReports, {})
    ] }) }) }),
    viewType !== "summary" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "mt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "svg",
            {
              className: "w-5 h-5",
              fill: "none",
              stroke: "currentColor",
              viewBox: "0 0 24 24",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                }
              )
            }
          ),
          __("Detailed", "yatra"),
          " ",
          viewType.charAt(0).toUpperCase() + viewType.slice(1),
          " ",
          __("Report", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
          viewType === "daily" && __(
            "Daily breakdown of bookings, revenue, and departures",
            "yatra"
          ),
          viewType === "weekly" && __(
            "Weekly breakdown of bookings, revenue, and departures",
            "yatra"
          ),
          viewType === "monthly" && __(
            "Monthly breakdown of bookings, revenue, and departures",
            "yatra"
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          DetailedBreakdownTable,
          {
            viewType,
            dateRange,
            selectedCategory,
            reportData
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          DetailedBreakdownChart,
          {
            viewType,
            dateRange,
            selectedCategory,
            reportData
          }
        ) })
      ] }) })
    ] })
  ] });
};
export {
  TravelBookingReports as default
};
//# sourceMappingURL=Reports-CC4n13K8.js.map
