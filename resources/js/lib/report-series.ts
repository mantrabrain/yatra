/**
 * Reusable series-bucketing helpers for the Reports admin page.
 *
 * The /reports endpoint emits day-level trend arrays with both an ISO
 * `date` and a human `label`:
 *
 *     [{ date: "2025-11-01", label: "1 Nov", value: 5 }, ...]
 *
 * The UI surfaces three view types — daily / weekly / monthly. Rather
 * than ask the backend for three different shapes (and pay three
 * roundtrips when the user toggles the dropdown), we receive day-level
 * data once and re-bucket it client-side.
 *
 * Why ISO weeks: locale-independent week numbering survives DST jumps
 * and year boundaries. Operators in Sydney see the same Monday-anchored
 * week as operators in Lisbon — the chart they share over email won't
 * misalign by a day. Months use the local year+month-of-year string.
 *
 * Bucketing strategy:
 *   - daily: 1-to-1 passthrough
 *   - weekly: aggregate by ISO week, label "W{N} {short month}"
 *   - monthly: aggregate by year+month, label "{Mon} {YYYY}"
 *
 * @since 3.0.5
 */

export type TrendView = "daily" | "weekly" | "monthly";

export interface SeriesPoint {
  date: string; // YYYY-MM-DD
  label: string;
  value: number;
}

/** Status-split row that the controller's `status_trend` returns. */
export interface StatusPoint {
  date: string;
  label: string;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
}

interface ISOWeek {
  year: number;
  week: number;
}

/**
 * ISO week number of a date. Returns 1..53. Mirrors the SQL
 * WEEK(date, 3) mode WordPress uses elsewhere.
 */
function isoWeek(d: Date): ISOWeek {
  // Copy so we don't mutate the input.
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // ISO week starts Monday. Shift the target to the Thursday of its
  // week — that Thursday's year is the ISO year.
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = (target.getTime() - firstThursday.getTime()) / 86400000;
  return {
    year: target.getUTCFullYear(),
    week: 1 + Math.floor(diff / 7),
  };
}

function parseISO(date: string): Date | null {
  if (!date) return null;
  // The backend hands us "YYYY-MM-DD". Parse as UTC to avoid TZ drift
  // on the day boundary — a midnight-local-time parse would land on
  // the wrong day for negative offsets.
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
  "Dec",
];

/**
 * Aggregate a day-level series into the requested view.
 *
 * Behaviour:
 *  - daily: passthrough (already day-aligned by the backend).
 *  - weekly: sum values per ISO week. Label = "W{n} Nov".
 *  - monthly: sum values per calendar month. Label = "Nov 2025".
 *
 * @param points  day-level series from `/reports`
 * @param view    daily | weekly | monthly
 */
export function bucketSeries(
  points: SeriesPoint[],
  view: TrendView,
): SeriesPoint[] {
  if (view === "daily" || points.length === 0) {
    return points;
  }

  if (view === "weekly") {
    const buckets = new Map<string, SeriesPoint>();
    for (const p of points) {
      const d = parseISO(p.date);
      if (!d) continue;
      const { year, week } = isoWeek(d);
      const key = `${year}-W${week.toString().padStart(2, "0")}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.value += p.value;
      } else {
        buckets.set(key, {
          date: p.date, // first-day-in-week anchor; UI rarely needs it
          label: `W${week} ${MONTH_LABELS[d.getUTCMonth()]}`,
          value: p.value,
        });
      }
    }
    return Array.from(buckets.values());
  }

  // monthly
  const buckets = new Map<string, SeriesPoint>();
  for (const p of points) {
    const d = parseISO(p.date);
    if (!d) continue;
    const key = `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.value += p.value;
    } else {
      buckets.set(key, {
        date: p.date,
        label: `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
        value: p.value,
      });
    }
  }
  return Array.from(buckets.values());
}

/**
 * Same shape as bucketSeries but for `status_trend`: aggregates
 * confirmed/pending/cancelled/completed across the bucket.
 */
export function bucketStatusSeries(
  points: StatusPoint[],
  view: TrendView,
): StatusPoint[] {
  if (view === "daily" || points.length === 0) {
    return points;
  }

  const keyFn = (d: Date): { key: string; label: string } => {
    if (view === "weekly") {
      const { year, week } = isoWeek(d);
      return {
        key: `${year}-W${week.toString().padStart(2, "0")}`,
        label: `W${week} ${MONTH_LABELS[d.getUTCMonth()]}`,
      };
    }
    return {
      key: `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1)
        .toString()
        .padStart(2, "0")}`,
      label: `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
    };
  };

  const buckets = new Map<string, StatusPoint>();
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
        completed: p.completed,
      });
    }
  }
  return Array.from(buckets.values());
}

/**
 * CSV builder used by the Reports export button.
 *
 * - Escapes per RFC 4180: wraps any field containing quote, comma or
 *   newline in double-quotes, with embedded quotes doubled.
 * - Uses CRLF row endings (Excel-friendly).
 * - Returns a Blob ready for <a download>.
 *
 * Don't add a UTF-8 BOM — Excel-for-Windows-prior-to-2016 wants one but
 * every modern build of Excel + Numbers + LibreOffice handles UTF-8 fine.
 * If an operator hits the older Excel, opening via Data → From Text works.
 */
export function buildCsv(rows: (string | number | null | undefined)[][]): Blob {
  const escape = (v: string | number | null | undefined): string => {
    const s = v == null ? "" : String(v);
    if (/[",\r\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const body = rows.map((r) => r.map(escape).join(",")).join("\r\n");
  return new Blob([body], { type: "text/csv;charset=utf-8" });
}

/**
 * Trigger a browser download for a CSV blob. Hidden anchor + click()
 * pattern — works on every supported browser without any libs.
 */
export function downloadCsv(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so single-process browsers (older Safari) finish the
  // download dialog before the URL is invalidated.
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

/**
 * Build a deterministic filename for a CSV export.
 * Example: yatra-bookings-2025-11-01-2025-11-30.csv
 */
export function csvFilename(slug: string, from?: string, to?: string): string {
  if (from && to) {
    return `yatra-${slug}-${from}-to-${to}.csv`;
  }
  // No range supplied — fall back to today's date so the file still
  // tells a future-you which day it was exported.
  const now = new Date();
  const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  return `yatra-${slug}-${today}.csv`;
}
