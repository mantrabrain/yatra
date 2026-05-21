/**
 * Tooltip — small CSS-only hover popover.
 *
 * Used by KPI cards on Dashboard / Reports for the `?` info icon
 * that explains confusable metrics (Booked vs Collected Revenue,
 * Conversion Rate, Occupancy Rate, etc.).
 *
 * Why not the native HTML `title` attribute: native title has a
 * ~700ms delay, paints in OS-default style (gray, small, easy to
 * miss), and isn't focusable — keyboard users never see it. This
 * component shows instantly on pointer-enter AND on keyboard focus,
 * is themed to match the rest of the admin UI, and uses
 * `role="tooltip"` + `aria-describedby` so screen readers announce it.
 *
 * Implementation is intentionally dependency-free (no Radix /
 * @floating-ui) — we don't need collision detection / portals for a
 * help-icon hint that lives next to a known anchor. The trigger is
 * positioned `relative`, the popover absolutely, and we use
 * `pointer-events: none` so the tooltip never blocks a click on
 * something underneath.
 */

import React, { useId, useState } from "react";

interface TooltipProps {
  /** The text shown in the popover. Pass null/empty to hide entirely. */
  content: React.ReactNode;
  /** The anchor — usually the `?` icon. Wrapped in a focusable span. */
  children: React.ReactNode;
  /** Where the popover appears relative to the anchor. Default: "top". */
  side?: "top" | "bottom" | "left" | "right";
  /** Optional className applied to the anchor wrapper. */
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = "top",
  className = "",
}) => {
  const id = useId();
  const [open, setOpen] = useState(false);

  if (!content) {
    return <span className={className}>{children}</span>;
  }

  // Side-specific position classes. The popover is anchored to one
  // edge of the trigger; a 6px arrow sits on the opposite edge
  // (computed from `side`). We keep arrow + popover in the same
  // border + bg color so they read as one unit.
  const popoverPos: Record<NonNullable<TooltipProps["side"]>, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  };
  const arrowPos: Record<NonNullable<TooltipProps["side"]>, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-100",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-100",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-100",
    right:
      "right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-100",
  };
  const arrowStyle: Record<NonNullable<TooltipProps["side"]>, string> = {
    top: "border-x-transparent border-b-transparent",
    bottom: "border-x-transparent border-t-transparent",
    left: "border-y-transparent border-r-transparent",
    right: "border-y-transparent border-l-transparent",
  };

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      {/* Trigger wrapper. We make the inner button tabbable for keyboard
          access; sighted users still click/hover the same target. */}
      <span aria-describedby={open ? id : undefined} tabIndex={0}>
        {children}
      </span>

      {open && (
        <span
          id={id}
          role="tooltip"
          className={`absolute z-50 pointer-events-none whitespace-normal break-words rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-normal leading-snug text-white shadow-lg max-w-xs w-max dark:bg-gray-100 dark:text-gray-900 ${popoverPos[side]}`}
        >
          {content}
          {/* Arrow */}
          <span
            aria-hidden="true"
            className={`absolute h-0 w-0 border-[6px] ${arrowStyle[side]} ${arrowPos[side]}`}
          />
        </span>
      )}
    </span>
  );
};

export default Tooltip;
