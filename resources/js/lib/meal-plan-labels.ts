/**
 * Trip meal_plan field: canonical slugs and translated labels (admin + consistency with PHP).
 */
import { __ } from "./i18n";

export type MealPlanSlug =
  | ""
  | "breakfast"
  | "half_board"
  | "full_board"
  | "all_inclusive"
  | "none";

/** Options for <select> (value + translated label). */
export const MEAL_PLAN_SELECT_OPTIONS: {
  value: MealPlanSlug;
  label: string;
}[] = [
  { value: "", label: __("Select meal plan", "yatra") },
  { value: "breakfast", label: __("Breakfast Only", "yatra") },
  {
    value: "half_board",
    label: __("Half Board (Breakfast + Dinner)", "yatra"),
  },
  { value: "full_board", label: __("Full Board (All Meals)", "yatra") },
  { value: "all_inclusive", label: __("All Inclusive", "yatra") },
  { value: "none", label: __("No Meals Included", "yatra") },
];

/** Normalize legacy or odd casing to canonical slug key (underscore form). */
export function normalizeMealPlanSlug(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/** Translated label for a stored slug, or title-cased fallback for unknown values. */
export function getMealPlanLabel(raw: string): string {
  const key = normalizeMealPlanSlug(raw) as MealPlanSlug;
  const row = MEAL_PLAN_SELECT_OPTIONS.find((o) => o.value === key);
  if (row) {
    return row.label;
  }
  if (!key) {
    return "";
  }
  return key
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}
