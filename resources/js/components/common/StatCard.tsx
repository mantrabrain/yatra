/**
 * Stat Card — KPI tile used on Dashboard and Reports pages.
 *
 * Two-line content layout: caption (label) on top, value below. A
 * coloured pill icon sits flush-right. When period-over-period
 * comparison data is available, a small delta line appears under the
 * value with up/down arrow + colour-coded percentage and an optional
 * "vs {period}" caption (previously hard-coded to "vs last month").
 *
 * Optional `tooltip` surfaces a `?` icon next to the title; the
 * tooltip text appears on hover. Used by Dashboard to disambiguate
 * confusable metrics ("Booked Revenue" vs "Collected Revenue") that
 * operators routinely mix up.
 */

import React from "react";
import { LucideIcon } from "lucide-react";
import { Tooltip } from "../ui/tooltip";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    /** Caption next to the percentage. Defaults to "vs prev. period". */
    label?: string;
  };
  color?: "blue" | "green" | "purple" | "orange" | "red";
  loading?: boolean;
  /** Hover-tooltip text. Renders a `?` icon next to the title. */
  tooltip?: string;
  /** Click handler — turns the card into a navigable surface. */
  onClick?: () => void;
}

/**
 * Stat Card Component — clean SaaS-style KPI tile.
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
  loading = false,
  tooltip,
  onClick,
}) => {
  const interactive = !!onClick;
  return (
    <div
      className={`group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700/50 p-3 transition-colors ${
        interactive
          ? "cursor-pointer hover:border-blue-300 dark:hover:border-blue-600/70"
          : "hover:border-gray-200 dark:hover:border-gray-600"
      }`}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {title}
            </p>
            {tooltip && (
              // Real hover-popover (see components/ui/tooltip.tsx). Native
              // `title=` was previously used here but had a ~700ms delay
              // and an easy-to-miss OS-default style — operators reported
              // the `?` icon "didn't show anything". The new tooltip
              // appears instantly on hover/focus and matches admin theme.
              <Tooltip content={tooltip} side="top">
                <span
                  className="inline-flex h-3.5 w-3.5 shrink-0 cursor-help items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold leading-none text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-100"
                  aria-label={typeof tooltip === "string" ? tooltip : undefined}
                  role="img"
                >
                  ?
                </span>
              </Tooltip>
            )}
          </div>
          {loading ? (
            <div className="h-6 w-20 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="text-xl font-semibold tabular-nums text-gray-900 dark:text-white truncate">
              {value}
            </p>
          )}
          {trend && !loading && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs font-medium tabular-nums ${
                  trend.isPositive
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {trend.label || "vs prev. period"}
              </span>
            </div>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 shrink-0">
          <Icon
            className={`w-4 h-4 ${
              color === "blue"
                ? "text-blue-600 dark:text-blue-400"
                : color === "green"
                  ? "text-green-600 dark:text-green-400"
                  : color === "purple"
                    ? "text-purple-600 dark:text-purple-400"
                    : color === "red"
                      ? "text-red-600 dark:text-red-400"
                      : "text-orange-600 dark:text-orange-400"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
