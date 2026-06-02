import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";

/**
 * "New since you last looked" counts for the admin sidebar badges.
 *
 * Backed by GET /yatra/v1/admin/new-counts (markers live in wp_options;
 * see NotificationCountsController). Shared via a single react-query cache key
 * so the sidebar badges and the mark-seen effect stay in sync automatically.
 */
export type NewCounts = {
  bookings?: number;
  payments?: number;
  enquiries?: number;
  reviews?: number;
  abandoned?: number;
  [section: string]: number | undefined;
};

/** Sidebar subpages that carry a badge → the count key they map to. */
export const SUBPAGE_TO_SECTION: Record<string, string> = {
  bookings: "bookings",
  payments: "payments",
  enquiries: "enquiries",
  reviews: "reviews",
  "abandoned-recovery": "abandoned",
};

export const NEW_COUNTS_QUERY_KEY = ["yatra", "admin", "new-counts"] as const;

export function useNotificationCounts() {
  return useQuery<NewCounts>({
    queryKey: NEW_COUNTS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get("/admin/new-counts");
      return (res?.counts ?? {}) as NewCounts;
    },
    // Pick up new orders/payments while the admin sits on another page,
    // without hammering the server.
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    // A failed counts call must never break the admin UI — just render no badge.
    retry: 1,
  });
}

/**
 * Mark a section seen (bumps its marker to MAX(id) server-side), then refresh
 * the shared counts so the badge clears immediately.
 */
export function useMarkSectionSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (section: string) => {
      return apiClient.post("/admin/mark-seen", { section });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NEW_COUNTS_QUERY_KEY });
    },
  });
}
