/**
 * Skeleton primitives for Yatra Pro module pages.
 *
 * Replaces the generic centered <Loader2 className="animate-spin" />
 * pattern that all six Growth/Agency module pages used while their
 * meta endpoint was in-flight. A spinning icon over an empty page
 * gives no sense of what's about to render — a layout-shaped
 * skeleton lets the operator anticipate the page and feels faster
 * even when the actual fetch time is unchanged.
 *
 * Each export below maps to a real shape used by one or more of
 * the module pages (page meta gate, tabbed content, settings form,
 * stat-grid section). Reuse aggressively — every module page
 * follows the same PageHeader + intro Card + content body shape.
 */

import React from "react";
import { Card, CardContent, CardHeader } from "./card";

const Bar: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`}
  />
);

/**
 * Page-level skeleton for the initial meta/license check on every
 * Pro module page. Mirrors the universal Header + intro Alert +
 * content area shape so the page doesn't visually "jump" once
 * data arrives.
 */
export const ModulePageSkeleton: React.FC<{
  /** Variant of the content body skeleton to render. */
  variant?: "tabs" | "form" | "list";
}> = ({ variant = "tabs" }) => {
  return (
    <div className="space-y-4">
      {/* Page header (title + subtitle) */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Bar className="h-7 w-48" />
          <Bar className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Bar className="h-9 w-28" />
          <Bar className="h-9 w-24" />
        </div>
      </div>

      {/* Intro/about info card — every Pro module renders one of these
          above the main content (tier badge, description, doc link). */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Bar className="h-5 w-5 rounded-full" />
            <Bar className="h-4 w-40" />
          </div>
          <Bar className="h-3 w-full max-w-2xl" />
          <Bar className="h-3 w-3/4 max-w-xl" />
        </CardContent>
      </Card>

      {variant === "tabs" && <ModuleTabsSkeleton />}
      {variant === "form" && <ModuleFormSkeleton />}
      {variant === "list" && <ModuleListSkeleton />}
    </div>
  );
};

/**
 * Tabbed content card with a faux tab strip + 5-row table preview.
 * Matches Webhooks, Channel Manager, Team, WhatsApp layouts.
 */
export const ModuleTabsSkeleton: React.FC<{
  /** Number of tabs to render in the faux strip. */
  tabCount?: number;
  /** Number of rows in the faux table body. */
  rows?: number;
  /** Number of columns in the faux table body. */
  columns?: number;
}> = ({ tabCount = 4, rows = 5, columns = 5 }) => {
  return (
    <Card>
      {/* Tab strip */}
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-0">
        <div className="flex items-center gap-1 -mb-px">
          {Array.from({ length: tabCount }).map((_, i) => (
            <div
              key={i}
              className={`px-4 py-2.5 ${
                i === 0
                  ? "border-b-2 border-gray-300 dark:border-gray-600"
                  : ""
              }`}
            >
              <Bar className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <ModuleTableSkeleton rows={rows} columns={columns} />
      </CardContent>
    </Card>
  );
};

/**
 * Table-shaped skeleton with header row + body rows. Drop-in
 * replacement for the centered spinners that previously sat inside
 * tab content panels.
 */
export const ModuleTableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
}> = ({ rows = 5, columns = 5 }) => {
  const cols = Math.max(1, columns);
  return (
    <div className="space-y-3 animate-pulse">
      {/* Toolbar row (search + filters that most module tabs have) */}
      <div className="flex items-center gap-2 pb-2">
        <Bar className="h-9 w-64" />
        <Bar className="h-9 w-32" />
        <div className="flex-1" />
        <Bar className="h-9 w-28" />
      </div>

      {/* Header */}
      <div
        className="grid gap-3 border-b border-gray-200 dark:border-gray-700 pb-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Bar key={i} className="h-3.5" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-3 py-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Bar
              key={colIndex}
              className={`h-4 ${
                colIndex === 0
                  ? "w-3/4"
                  : colIndex === cols - 1
                    ? "w-1/2"
                    : "w-full"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Settings-form-shaped skeleton: label/input pairs in a single
 * column. Used for AI Assistant key form, WhatsApp credentials,
 * White Label settings.
 */
export const ModuleFormSkeleton: React.FC<{
  /** Number of label+input rows. */
  rows?: number;
}> = ({ rows = 6 }) => {
  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Bar className="h-3.5 w-32" />
            <Bar className="h-10 w-full" />
            <Bar className="h-3 w-72 max-w-full" />
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <Bar className="h-10 w-24" />
          <Bar className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Card-list shape — for tabs that render channels, members, or
 * other entity cards instead of a strict table (Channel Manager's
 * Channels tab, Team Members layout in card mode, etc.).
 */
export const ModuleListSkeleton: React.FC<{
  /** Number of list rows. */
  rows?: number;
}> = ({ rows = 4 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center gap-4">
            <Bar className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Bar className="h-4 w-1/3" />
              <Bar className="h-3 w-2/3 max-w-md" />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Bar className="h-6 w-16 rounded-full" />
              <Bar className="h-9 w-9" />
              <Bar className="h-9 w-9" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * Stat-grid skeleton — for analytics/usage sections (AI Assistant
 * usage tab, WhatsApp templates count, etc.). 4 stat tiles in a
 * responsive grid.
 */
export const ModuleStatGridSkeleton: React.FC<{
  /** Number of stat tiles. */
  tiles?: number;
}> = ({ tiles = 4 }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
      {Array.from({ length: tiles }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <Bar className="h-3 w-20" />
            <Bar className="h-7 w-24" />
            <Bar className="h-3 w-32 max-w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * Compact section-content skeleton — for in-card content loads
 * where the surrounding card chrome is already rendered (e.g.
 * Webhooks certificate section, AI Assistant prompt detail panel).
 */
export const ModuleSectionSkeleton: React.FC<{
  /** Number of label/value lines. */
  lines?: number;
}> = ({ lines = 4 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Bar className="h-3 w-28" />
          <Bar className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
};
