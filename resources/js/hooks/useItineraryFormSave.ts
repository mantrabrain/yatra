/**
 * Custom hook for ItineraryForm save/mutation logic
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { API_ENDPOINTS } from "../lib/api-endpoints";
import { useToast } from "../components/ui/toast";
import { __ } from "../lib/i18n";
import { ItineraryFormData, ActivityForm } from "./useItineraryFormValidation";

interface UseItineraryFormSaveParams {
  isAddDayMode: boolean;
  isEditMode: boolean;
  entryId: number | null;
  activityForms: ActivityForm[];
  formData: ItineraryFormData;
  calculateDuration: (
    startTime?: string,
    endTime?: string,
    timeType?: string,
  ) => string;
  entryData?: any; // Entry data to check if it's a day entry
  dayTripData?: any; // Trip data to find day entry
  tripsData?: any[]; // Trips data to check trip type
}

export const useItineraryFormSave = ({
  isAddDayMode,
  isEditMode,
  entryId,
  activityForms,
  formData,
  calculateDuration,
  entryData,
  dayTripData,
  tripsData,
}: UseItineraryFormSaveParams) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async (data: ItineraryFormData) => {
      // For day mode, create day and all activities
      if (isAddDayMode) {
        const tripId = parseInt(data.trip_id);
        const day = parseInt(data.day);
        const dayTitle = data.day_title?.trim() || null;

        // In edit mode, update the day entry itself first (only day info, not activities)
        if (isEditMode && entryId) {
          // Only send day-specific fields to avoid updating activity titles
          // The backend requires 'title' field, so we set it to day_title
          const dayPayload: any = {
            trip_id: tripId,
            day: day,
            day_title: dayTitle,
            day_description: data.day_description?.trim() || null,
            title: dayTitle || `Day ${day}`, // Backend requires title field
            item_type_id: null,
            item_id: null,
            status: data.status || "draft",
          };

          // When editing, we MUST find the day entry ID - never use POST for updates
          // Find the day entry ID from the data we already have
          // IMPORTANT: Use the ORIGINAL day number from entryData, not the new day from formData
          let dayEntryId: number | null = null;

          // First, check if entryData is a day entry (has null item_type_id and item_id)
          if (
            entryData &&
            (entryData.item_type_id === null ||
              entryData.item_type_id === undefined) &&
            (entryData.item_id === null || entryData.item_id === undefined)
          ) {
            dayEntryId = entryData.id
              ? parseInt(entryData.id.toString())
              : null;
          }

          // If entryData has day_id, query the backend to get the day entry ID
          // This is the most reliable way when entryData is an activity
          if (!dayEntryId && entryData && entryData.day_id) {
            try {
              const dayEntryResponse = await apiClient.get(
                `/itinerary/day-entry-by-day-id/${entryData.day_id}`,
              );
              const dayEntryData = dayEntryResponse?.data || dayEntryResponse;
              if (dayEntryData && dayEntryData.day_entry_id) {
                dayEntryId = parseInt(dayEntryData.day_entry_id.toString());
              }
            } catch (error) {
              // Silently fail and try other methods
              // Error is logged by the API client if needed
            }
          }

          // If still not found and we have dayTripData, try to find from dayTripData
          if (!dayEntryId && entryData && entryData.day_id && dayTripData) {
            const itineraryDays = dayTripData.itinerary_days || [];
            // Find the day that matches entryData.day_id
            for (const dayData of itineraryDays) {
              // Check if this day's id matches entryData.day_id
              if (
                dayData.id === entryData.day_id ||
                dayData.day_id === entryData.day_id
              ) {
                if (dayData.entries) {
                  // Find entry with null item_type_id/item_id (the day entry)
                  const dayEntry = dayData.entries.find(
                    (e: any) =>
                      (e.item_type_id === null ||
                        e.item_type_id === undefined) &&
                      (e.item_id === null || e.item_id === undefined),
                  );
                  if (dayEntry && dayEntry.id) {
                    dayEntryId = parseInt(dayEntry.id.toString());
                    break;
                  }
                }
              }
            }
          }

          // If still not found, try to find from dayTripData using ORIGINAL day number
          // Use entryData.day (original) to find the day entry, not formData.day (new)
          const originalDay = entryData?.day
            ? parseInt(entryData.day.toString())
            : null;
          if (!dayEntryId && dayTripData && originalDay) {
            const itineraryDays = dayTripData.itinerary_days || [];
            const dayData = itineraryDays.find(
              (d: any) => (d.day_number || d.day) === originalDay,
            );
            if (dayData && dayData.entries) {
              const dayEntry = dayData.entries.find(
                (e: any) =>
                  (e.item_type_id === null || e.item_type_id === undefined) &&
                  (e.item_id === null || e.item_id === undefined),
              );
              if (dayEntry && dayEntry.id) {
                dayEntryId = parseInt(dayEntry.id.toString());
              }
            }
          }

          // In edit mode, we MUST have a day entry ID - never use POST
          // If day entry doesn't exist, it's an error (should have been created when day was created)
          if (!dayEntryId) {
            throw new Error(
              "Day entry not found. The day entry should exist when editing. Please refresh the page and try again, or contact support if the issue persists.",
            );
          }

          // In edit mode, ALWAYS use PUT - never POST
          // Days always use mode=day
          const endpoint = API_ENDPOINTS.ITINERARY_GET(dayEntryId, "day");
          const dayResponse = await apiClient.put(endpoint, dayPayload);

          // Map each activityForm.id → its index in the parent activityForms array.
          // The index is what becomes the persisted `order` value (the column on
          // yatra_new_trip_itinerary_day_entry, written by the existing repo
          // setter we just extended). Drag-and-drop reorders activityForms in the
          // parent component, so reading the index here naturally captures the
          // user's intended ordering. Using a Map (instead of filtered-array
          // index) avoids the off-by-one when existing+new activities are split
          // into separate loops below.
          const orderById = new Map<string, number>(
            activityForms.map((af, idx) => [af.id, idx]),
          );

          const buildActivityPayload = (
            activityData: ActivityForm["data"],
            order: number,
          ) => {
            // Time fields only apply when time_type is 'exact'. For 'duration'
            // the user expresses time only via the duration text; for 'flexible'
            // there is no specific time at all. Sending defaults like 08:00
            // would silently overwrite the user's intent and pollute every row
            // with the same fake clock range.
            const timeType = activityData.time_type || "exact";
            const startTime =
              timeType === "exact" && activityData.start_time
                ? activityData.start_time
                : null;
            const endTime =
              timeType === "exact" && activityData.end_time
                ? activityData.end_time
                : null;
            return {
              trip_id: tripId,
              day: day,
              day_title: dayTitle,
              item_type_id: parseInt(activityData.item_type_id!),
              item_id: parseInt(activityData.item_id!),
              title: activityData.title!.trim(),
              description: (activityData.description || "").trim(),
              location: (activityData.location || "").trim(),
              // Latitude / longitude were saved by the form but never sent in the
              // payload before — saving silently dropped them. Send as floats; let
              // the repo coerce empty strings to null.
              location_latitude:
                activityData.location_latitude !== undefined &&
                activityData.location_latitude !== ""
                  ? parseFloat(activityData.location_latitude as any)
                  : null,
              location_longitude:
                activityData.location_longitude !== undefined &&
                activityData.location_longitude !== ""
                  ? parseFloat(activityData.location_longitude as any)
                  : null,
              duration:
                (activityData.duration || "").trim() ||
                (startTime && endTime
                  ? calculateDuration(startTime, endTime, timeType)
                  : null),
              start_time: startTime,
              end_time: endTime,
              time_type: timeType,
              cost: activityData.cost ? parseFloat(activityData.cost) : null,
              cost_per_person: activityData.cost_per_person === true,
              notes: (activityData.notes || "").trim(),
              included_items: Array.isArray(activityData.included_items)
                ? activityData.included_items
                : [],
              excluded_items: Array.isArray(activityData.excluded_items)
                ? activityData.excluded_items
                : [],
              gallery: activityData.gallery || [],
              video_url: activityData.video_url || "",
              status: activityData.status || "draft",
              order: Math.max(0, order),
            };
          };

          // BATCH SAVE — replaces the previous loop that fired one PUT per
          // activity (5 activities = 5 sequential round-trips). We collect every
          // activity into a single payload and POST to the bulk endpoint, which
          // dispatches each row to update / create server-side and invalidates
          // caches once at the end. Each row carries `id` for updates or omits
          // it for creates; `order` is the index in `activityForms` so the
          // user's drag-sort ordering is what gets persisted.
          const validatedRows = activityForms.map((af, index) => {
            const activityData = af.data;
            if (
              !activityData.item_type_id ||
              !activityData.item_id ||
              !activityData.title?.trim()
            ) {
              throw new Error(
                `Activity ${index + 1} is missing required fields (item type, item, or title)`,
              );
            }
            const order = orderById.get(af.id) ?? index;
            const payload = buildActivityPayload(activityData, order) as any;
            // Update vs create is determined by presence of `id`. For existing
            // activities we send the entryId; for newly added rows we omit it.
            if (af.entryId) {
              payload.id =
                typeof af.entryId === "string"
                  ? parseInt(af.entryId, 10)
                  : af.entryId;
            }
            return payload;
          });

          // dayEntryId here is the yatra_new_trip_itinerary_days.id row — same
          // value that the day-update PUT just used a few lines above. The bulk
          // endpoint scopes all writes to that day_id.
          const bulkEndpoint =
            API_ENDPOINTS.ITINERARY_DAY_ACTIVITIES_BULK(dayEntryId);
          try {
            const bulkResponse = await apiClient.put(bulkEndpoint, {
              trip_id: tripId,
              activities: validatedRows,
            });
            const bulkData =
              (bulkResponse as any)?.data || (bulkResponse as any) || {};
            // Surface a partial-failure error so the user knows something
            // didn't save instead of silently swallowing it.
            if (bulkData.failed && bulkData.failed > 0) {
              const firstError = (bulkData.results || []).find(
                (r: any) => r && r.ok === false,
              );
              throw new Error(
                `${bulkData.failed} activit${
                  bulkData.failed === 1 ? "y" : "ies"
                } failed to save${
                  firstError?.error ? `: ${firstError.error}` : ""
                }`,
              );
            }
          } catch (error: any) {
            throw new Error(
              `Failed to save activities: ${error?.message || "Unknown error"}`,
            );
          }

          return dayResponse.data || dayResponse;
        }

        // Create mode: create day and all activities
        // Filter out empty/invalid activities (those missing required fields)
        const validActivities = activityForms.filter((af) => {
          const activityData = af.data;
          return (
            activityData.item_type_id &&
            activityData.item_id &&
            activityData.title?.trim()
          );
        });

        // If no valid activities, create only the day entry
        if (validActivities.length === 0) {
          const payload = {
            trip_id: tripId,
            day: day,
            day_title: dayTitle,
            day_description: data.day_description?.trim() || null,
            item_type_id: null,
            item_id: null,
            title: dayTitle || `Day ${day}`,
            description: "",
            location: null,
            duration: null,
            start_time: null,
            end_time: null,
            time_type: "exact",
            cost: null,
            cost_per_person: false,
            notes: null,
            included_items: [],
            excluded_items: [],
            status: data.status || "draft",
          };

          const response = await apiClient.post("/itinerary", payload);
          return response.data || response;
        }

        // Save all valid activities sequentially to ensure proper ordering and day creation
        const responses = [];
        for (let index = 0; index < validActivities.length; index++) {
          const activityForm = validActivities[index];
          const activityData = activityForm.data;

          const timeType = activityData.time_type || "exact";
          const startTime =
            timeType === "exact" && activityData.start_time
              ? activityData.start_time
              : null;
          const endTime =
            timeType === "exact" && activityData.end_time
              ? activityData.end_time
              : null;

          const payload = {
            trip_id: tripId,
            day: day,
            day_title: dayTitle,
            item_type_id: parseInt(activityData.item_type_id!),
            item_id: parseInt(activityData.item_id!),
            title: activityData.title!.trim(),
            description: (activityData.description || "").trim(),
            location: (activityData.location || "").trim(),
            location_latitude: activityData.location_latitude
              ? parseFloat(activityData.location_latitude)
              : null,
            location_longitude: activityData.location_longitude
              ? parseFloat(activityData.location_longitude)
              : null,
            duration:
              (activityData.duration || "").trim() ||
              (startTime && endTime
                ? calculateDuration(startTime, endTime, timeType)
                : null),
            start_time: startTime,
            end_time: endTime,
            time_type: timeType,
            cost: activityData.cost ? parseFloat(activityData.cost) : null,
            cost_per_person: activityData.cost_per_person === true,
            notes: (activityData.notes || "").trim(),
            included_items: Array.isArray(activityData.included_items)
              ? activityData.included_items
              : [],
            excluded_items: Array.isArray(activityData.excluded_items)
              ? activityData.excluded_items
              : [],
            gallery: activityData.gallery || [],
            video_url: activityData.video_url || "",
            status: activityData.status || "draft",
          };

          try {
            const response = await apiClient.post("/itinerary", payload);
            responses.push(response.data || response);
          } catch (error: any) {
            throw new Error(
              `Failed to save activity ${index + 1}: ${error?.message || "Unknown error"}`,
            );
          }
        }

        // Return the first response (contains day info)
        return responses[0] || responses;
      }

      // For activity mode, use all fields
      const timeType = data.time_type || "exact";
      const startTime =
        timeType === "exact" && data.start_time ? data.start_time : null;
      const endTime =
        timeType === "exact" && data.end_time ? data.end_time : null;
      const payload = {
        trip_id: parseInt(data.trip_id),
        day: parseInt(data.day),
        day_title: data.day_title?.trim() || null,
        item_type_id: parseInt(data.item_type_id),
        item_id: parseInt(data.item_id),
        title: data.title.trim(),
        description: data.description.trim(),
        location: data.location.trim(),
        location_latitude: data.location_latitude
          ? parseFloat(data.location_latitude)
          : null,
        location_longitude: data.location_longitude
          ? parseFloat(data.location_longitude)
          : null,
        duration:
          data.duration.trim() ||
          (startTime && endTime
            ? calculateDuration(startTime, endTime, timeType)
            : null),
        start_time: startTime,
        end_time: endTime,
        time_type: timeType,
        cost: data.cost ? parseFloat(data.cost) : null,
        cost_per_person: data.cost_per_person,
        notes: data.notes.trim(),
        included_items: data.included_items,
        excluded_items: data.excluded_items,
        gallery: data.gallery || [],
        video_url: data.video_url || "",
        status: data.status || "draft", // Ensure status is always included
      };

      if (isEditMode && entryId) {
        // Ensure status is explicitly included in update payload
        const updatePayload = {
          ...payload,
          status: data.status || "draft", // Explicitly include status for updates
        };
        // Pass mode parameter to specify we're updating an activity entry
        const endpoint = API_ENDPOINTS.ITINERARY_GET(entryId, "activity");
        const response = await apiClient.put(endpoint, updatePayload);
        return response.data || response;
      } else {
        const response = await apiClient.post("/itinerary", payload);
        return response.data || response;
      }
    },
    onSuccess: () => {
      // For day mode, show success message and navigate
      if (isAddDayMode) {
        // Count only valid activities (those with required fields filled)
        const validActivitiesCount = activityForms.filter((af) => {
          const activityData = af.data;
          return (
            activityData.item_type_id &&
            activityData.item_id &&
            activityData.title?.trim()
          );
        }).length;

        // Check if it's a single-day trip for dynamic messages
        const selectedTrip = tripsData?.find(
          (t: any) => t.id.toString() === formData.trip_id,
        );
        const isSingleDay = selectedTrip?.trip_type === "single_day";

        if (isEditMode) {
          // Edit mode messages - dynamic based on trip type
          if (validActivitiesCount === 0) {
            const message = isSingleDay
              ? __("Entry updated successfully!", "yatra")
              : __("Day updated successfully!", "yatra");
            showToast(message, "success");
          } else {
            const message = isSingleDay
              ? __(
                  "Entry and activities updated successfully!",
                  "yatra",
                ).replace(
                  "activities",
                  `${validActivitiesCount} ${validActivitiesCount === 1 ? "activity" : "activities"}`,
                )
              : __("Day and activities updated successfully!", "yatra").replace(
                  "activities",
                  `${validActivitiesCount} ${validActivitiesCount === 1 ? "activity" : "activities"}`,
                );
            showToast(message, "success");
          }
        } else {
          // Create mode messages - dynamic based on trip type
          if (validActivitiesCount === 0) {
            const message = isSingleDay
              ? __("Entry created successfully!", "yatra")
              : __("Day created successfully!", "yatra");
            showToast(message, "success");
          } else {
            const message = isSingleDay
              ? __(
                  "Entry and activities created successfully!",
                  "yatra",
                ).replace(
                  "activities",
                  `${validActivitiesCount} ${validActivitiesCount === 1 ? "activity" : "activities"}`,
                )
              : __("Day and activities created successfully!", "yatra").replace(
                  "activities",
                  `${validActivitiesCount} ${validActivitiesCount === 1 ? "activity" : "activities"}`,
                );
            showToast(message, "success");
          }
        }

        // Invalidate all itinerary-related queries
        queryClient.invalidateQueries({ queryKey: ["itinerary"] });
        queryClient.invalidateQueries({ queryKey: ["itinerary-entries"] });
        queryClient.invalidateQueries({ queryKey: ["trips"] });
        queryClient.invalidateQueries({ queryKey: ["trips-simple"] });

        // Also invalidate the specific trip query if we have trip_id
        if (formData.trip_id) {
          queryClient.invalidateQueries({
            queryKey: ["trips", parseInt(formData.trip_id)],
          });
          queryClient.invalidateQueries({
            queryKey: ["trip", parseInt(formData.trip_id)],
          });
        }

        // Only redirect for new days, not for editing existing days
        if (!isEditMode) {
          const day = parseInt(formData.day);
          const tripId = formData.trip_id;
          setTimeout(() => {
            const params = new URLSearchParams({
              trip_id: tripId,
              day: day.toString(),
            });
            window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&${params.toString()}`;
          }, 1500);
        }
        // For editing, stay on the same page - no redirect
        return;
      }

      // For activity mode or edit mode
      showToast(
        isEditMode
          ? __("Itinerary entry updated successfully!", "yatra")
          : __("Itinerary entry created successfully!", "yatra"),
        "success",
      );

      // Invalidate all itinerary-related queries
      queryClient.invalidateQueries({ queryKey: ["itinerary"] });
      queryClient.invalidateQueries({ queryKey: ["itinerary-entries"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips-simple"] });

      // Also invalidate the specific trip query if we have trip_id
      if (formData.trip_id) {
        queryClient.invalidateQueries({
          queryKey: ["trips", parseInt(formData.trip_id)],
        });
        queryClient.invalidateQueries({
          queryKey: ["trip", parseInt(formData.trip_id)],
        });
        // Force refetch the trip data
        queryClient.refetchQueries({
          queryKey: ["trips", parseInt(formData.trip_id)],
        });
      }

      // Force refetch all trips to ensure fresh data
      queryClient.refetchQueries({ queryKey: ["trips"] });
      queryClient.refetchQueries({ queryKey: ["trips-simple"] });

      // Only redirect for new entries, not for editing existing entries
      if (!isEditMode) {
        setTimeout(() => {
          const tripIdParam = formData.trip_id
            ? `&trip_id=${formData.trip_id}`
            : "";
          window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary${tripIdParam}`;
        }, 1000);
      }
      // For editing, stay on the same page - no redirect
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message || __("An error occurred while saving", "yatra");
      showToast(errorMessage, "error");
    },
    onSettled: () => {
      // Reset submitting state when mutation completes (success or error)
      // This ensures the loading state is properly cleared
    },
  });

  return { saveMutation };
};
