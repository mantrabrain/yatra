import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { __, sprintf } from "../lib/i18n";
import { apiClient, apiService } from "../lib/api-client";
import type { MultiSelectOption } from "../components/ui/multi-select";
import type { FormConditionTargets } from "../components/settings/booking-form-types";

/**
 * Trip targeting shared by the booking-form Conditions popup and the email
 * template overrides: one MultiSelect holds trip types, categories (nested)
 * and individual trips, encoded as "type:x" / "category:ID" / "trip:ID".
 * Mirrors the Pro-side matching (trip › category incl. ancestors › trip type).
 */
export type TripTargets = FormConditionTargets;

// ---- picker: trips / categories / trip types in one MultiSelect -----------

const TRIP_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "single_day", label: __("Single Day Trip", "yatra") },
  { value: "multi_day", label: __("Multi-Day Trip", "yatra") },
];

export const encodeTargets = (t?: FormConditionTargets): string[] => [
  ...(t?.trip_types ?? []).map((v) => `type:${v}`),
  ...(t?.categories ?? []).map((id) => `category:${id}`),
  ...(t?.trips ?? []).map((id) => `trip:${id}`),
];

export const decodeTargets = (
  values: (string | number)[],
): FormConditionTargets => {
  const out: FormConditionTargets = {};
  values.forEach((raw) => {
    const [kind, rest] = String(raw).split(":", 2);
    if (kind === "trip" && Number(rest) > 0) {
      (out.trips ||= []).push(Number(rest));
    } else if (kind === "category" && Number(rest) > 0) {
      (out.categories ||= []).push(Number(rest));
    } else if (kind === "type" && rest) {
      (out.trip_types ||= []).push(rest);
    }
  });
  return out;
};

export const hasTargets = (t?: FormConditionTargets): boolean =>
  !!t &&
  ((t.trips?.length ?? 0) > 0 ||
    (t.categories?.length ?? 0) > 0 ||
    (t.trip_types?.length ?? 0) > 0);

interface CategoryNode {
  id: number;
  name: string;
  subcategories?: CategoryNode[];
}

const flattenCategories = (
  nodes: CategoryNode[],
  depth = 0,
): MultiSelectOption[] =>
  nodes.flatMap((c) => [
    {
      value: `category:${c.id}`,
      label: `${__("Category", "yatra")}: ${"— ".repeat(depth)}${c.name}`,
    },
    ...(Array.isArray(c.subcategories)
      ? flattenCategories(c.subcategories, depth + 1)
      : []),
  ]);

/** Trips + categories the picker can target; fetched only while `enabled`. */
export const useTripTargets = (enabled: boolean) => {
  const trips = useQuery({
    queryKey: ["booking-form-conditions", "trips"],
    queryFn: async () => {
      const res: any = await apiService.getTrips({
        per_page: 500,
        orderby: "title",
        order: "ASC",
      });
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      return list
        .filter((t: any) => t && t.id && t.status !== "trash")
        .map((t: any) => ({
          value: `trip:${t.id}`,
          label: `${__("Trip", "yatra")}: ${t.title || `#${t.id}`}`,
        })) as MultiSelectOption[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const categories = useQuery({
    queryKey: ["booking-form-conditions", "categories"],
    queryFn: async () => {
      const res: any = await apiClient.get("/trip-categories", {
        params: {
          per_page: 100,
          hierarchical: true,
          orderby: "name",
          order: "ASC",
        },
      });
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      return flattenCategories(list as CategoryNode[]);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const options = useMemo<MultiSelectOption[]>(
    () => [
      ...TRIP_TYPE_OPTIONS.map((t) => ({
        value: `type:${t.value}`,
        label: `${__("Trip type", "yatra")}: ${t.label}`,
      })),
      ...(categories.data ?? []),
      ...(trips.data ?? []),
    ],
    [trips.data, categories.data],
  );

  return { options, isLoading: trips.isLoading || categories.isLoading };
};

/** Human summary of a condition's targets, for the page and the popup header. */
export const describeTargets = (
  t: FormConditionTargets | undefined,
  options: MultiSelectOption[],
): string => {
  const names = encodeTargets(t).map((v) => {
    const opt = options.find((o) => String(o.value) === v);
    if (opt) return opt.label.replace(/^[^:]+: /, "");
    const [kind, rest] = v.split(":", 2);
    if (kind === "type") {
      return TRIP_TYPE_OPTIONS.find((x) => x.value === rest)?.label || rest;
    }
    return kind === "trip"
      ? sprintf(__("Trip #%s", "yatra"), rest)
      : sprintf(__("Category #%s", "yatra"), rest);
  });
  return names.join(", ");
};
