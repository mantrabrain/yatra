/**
 * Custom hook for fetching all data needed by ItineraryForm
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiClient } from "../lib/api-client";
import { API_ENDPOINTS } from "../lib/api-endpoints";
import { usePermissions } from "./usePermissions";
import { __ } from "../lib/i18n";

interface UseItineraryFormDataParams {
  entryId: number | null;
  isEditMode: boolean;
  isEditDayMode: boolean;
  isAddDayMode: boolean;
  tripIdParam: string | null;
  dayParam: string | null;
  formDataItemTypeId: string;
  formDataTripId?: string; // Trip ID from form data (for dropdown selection)
}

export const useItineraryFormData = ({
  entryId,
  isEditMode,
  isEditDayMode,
  isAddDayMode,
  tripIdParam,
  dayParam,
  formDataItemTypeId,
  formDataTripId,
}: UseItineraryFormDataParams) => {
  const { can } = usePermissions();

  // Fetch trips
  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["trips-simple"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/trips", {
          params: {
            per_page: 100,
            status: "all",
          },
        });
        const trips = response?.data?.data || response?.data || response || [];
        return Array.isArray(trips) ? trips : [];
      } catch (error: any) {
        console.error("Failed to load trips:", error);
        return [];
      }
    },
    enabled: can("yatra_view_trips"),
  });

  // Fetch item types
  const { data: typesData } = useQuery({
    queryKey: ["item-types-published"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/item-types", {
          params: {
            per_page: 100,
            status: "publish",
          },
        });
        const types = response?.data?.data || response?.data || response || [];
        return Array.isArray(types) ? types : [];
      } catch (error: any) {
        console.error("Failed to load item types:", error);
        return [];
      }
    },
    enabled: can("yatra_view_trips"),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch items - in day mode fetch all items, in activity mode fetch by type
  const itemsQueryKey = useMemo(
    () =>
      isAddDayMode
        ? ["items-all-published"]
        : ["items-by-type", formDataItemTypeId],
    [isAddDayMode, formDataItemTypeId],
  );

  const { data: itemsData } = useQuery({
    queryKey: itemsQueryKey,
    queryFn: async () => {
      try {
        if (isAddDayMode) {
          const response = await apiClient.get("/items", {
            params: {
              per_page: 1000,
              status: "publish",
            },
          });
          const items =
            response?.data?.data || response?.data || response || [];
          return Array.isArray(items) ? items : [];
        }

        if (!formDataItemTypeId) return [];

        const response = await apiClient.get("/items", {
          params: {
            per_page: 1000,
            type_id: formDataItemTypeId,
            status: "publish",
          },
        });
        const items = response?.data?.data || response?.data || response || [];
        return Array.isArray(items) ? items : [];
      } catch (error: any) {
        console.error("Failed to load items:", error);
        return [];
      }
    },
    enabled: can("yatra_view_trips"),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch entry data when editing
  const { data: entryData, isLoading: isLoadingEntryData } = useQuery({
    queryKey: ["itinerary-entry", entryId, isEditDayMode ? "day" : "activity"],
    queryFn: async () => {
      if (!entryId) return null;
      try {
        // Pass mode parameter to API based on isEditDayMode
        const mode = isEditDayMode ? "day" : "activity";
        const endpoint = API_ENDPOINTS.ITINERARY_GET(entryId, mode);
        const response = await apiClient.get(endpoint);
        const result = response?.data?.data || response?.data || response;

        return result;
      } catch (error: any) {
        console.error("Failed to load itinerary entry:", error);
        return null;
      }
    },
    enabled: isEditMode && !!entryId && can("yatra_view_trips"),
  });

  // Extract identifiers from the initially loaded entry (could be activity)
  const entryDayId = useMemo(() => entryData?.day_id, [entryData?.day_id]);

  // Check if entryData is an activity (has non-zero item_type_id and item_id)
  // Day entries have item_type_id: 0 and item_id: 0
  const isActivityEntry = useMemo(() => {
    return (
      entryData &&
      entryData.item_type_id !== null &&
      entryData.item_type_id !== undefined &&
      entryData.item_type_id !== 0 &&
      entryData.item_id !== null &&
      entryData.item_id !== undefined &&
      entryData.item_id !== 0
    );
  }, [entryData]);

  // Fetch day entry when editing a day and entryData is an activity
  const { data: dayEntryData } = useQuery({
    queryKey: ["day-entry-by-day-id", entryDayId],
    queryFn: async () => {
      if (!entryDayId || !isEditDayMode) return null;
      try {
        const response = await apiClient.get(
          `/itinerary/day-entry-by-day-id/${entryDayId}`,
        );
        const dayEntryId =
          response?.data?.day_entry_id ||
          response?.day_entry_id ||
          response?.data?.id ||
          response?.id ||
          null;
        if (dayEntryId) {
          // Fetch the actual day entry data
          const entryResponse = await apiClient.get(`/itinerary/${dayEntryId}`);
          return (
            entryResponse?.data?.data || entryResponse?.data || entryResponse
          );
        }
        return null;
      } catch (error: any) {
        console.error("Failed to load day entry:", error);
        return null;
      }
    },
    enabled:
      isEditDayMode &&
      !!entryDayId &&
      isActivityEntry &&
      can("yatra_view_trips"),
  });

  // Determine the effective entry data (day entry when editing a day)
  const effectiveEntryData = useMemo(() => {
    if (isEditDayMode && isActivityEntry && dayEntryData) {
      return dayEntryData;
    }
    return entryData;
  }, [isEditDayMode, isActivityEntry, dayEntryData, entryData]);

  // Extract stable primitive values from the effective entry data
  const entryTripId = useMemo(
    () => effectiveEntryData?.trip_id,
    [effectiveEntryData?.trip_id],
  );
  const entryDay = useMemo(
    () => effectiveEntryData?.day,
    [effectiveEntryData?.day],
  );

  // Fetch trip data for day editing to get all activities
  const { data: dayTripData } = useQuery({
    queryKey: ["trip-for-day-edit", entryTripId, entryDay],
    queryFn: async () => {
      if (!entryTripId || !isEditDayMode) return null;
      try {
        const response = await apiClient.get(`/trips/${entryTripId}`);
        return response?.data || response;
      } catch (error: any) {
        console.error("Failed to load trip data for day edit:", error);
        return null;
      }
    },
    enabled:
      isEditDayMode && !!entryTripId && !!entryDay && can("yatra_view_trips"),
  });

  // Fetch trip data to get day title when in activity mode, and to check existing days in day mode
  // Use tripIdParam if available (from URL), otherwise use formDataTripId (from dropdown selection)
  const effectiveTripIdForQuery = tripIdParam || formDataTripId || "";

  const tripDataQueryKey = useMemo(
    () => ["trip-for-day", effectiveTripIdForQuery, dayParam || ""],
    [effectiveTripIdForQuery, dayParam],
  );

  const { data: tripDataForDay } = useQuery({
    queryKey: tripDataQueryKey,
    queryFn: async () => {
      if (!effectiveTripIdForQuery) return null;
      try {
        const response = await apiClient.get(
          `/trips/${effectiveTripIdForQuery}`,
        );
        return response?.data || response;
      } catch (error) {
        console.error("Failed to fetch trip data:", error);
        return null;
      }
    },
    enabled:
      !isEditDayMode && !!effectiveTripIdForQuery && can("yatra_view_trips"),
  });

  // Use dayTripData when in edit day mode, otherwise use tripDataForDay
  const effectiveTripData = isEditDayMode ? dayTripData : tripDataForDay;

  return {
    tripsData: tripsData || [],
    isLoadingTrips,
    typesData: typesData || [],
    itemsData: itemsData || [],
    entryData: effectiveEntryData,
    isLoadingEntry: isLoadingEntryData,
    dayTripData,
    tripDataForDay,
    effectiveTripData,
    entryTripId,
    entryDay,
  };
};
