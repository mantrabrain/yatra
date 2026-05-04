/**
 * Itinerary Page - Day-by-Day Schedule Builder
 * Manage itinerary entries organized by days with expandable cards
 */

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Trash2,
  MapPin,
  Clock,
  UtensilsCrossed,
  Hotel,
  Calendar,
  CalendarDays,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { getCurrencySymbol } from "../data/currencies";
import { __ } from "../lib/i18n";
import { usePermissions } from "../hooks/usePermissions";
import { apiClient } from "../lib/api-client";
import { useToast } from "../components/ui/toast";
import { Button } from "../components/ui/button";
import { SearchableSelect } from "../components/ui/searchable-select";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ConditionalRender } from "../components/ui/conditional-render";
import {
  IconSelector,
  type IconSelectorProvider,
} from "../components/ui/icon-selector";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { BulkActionToolbar } from "../components/shared/BulkActionToolbar";
import { getErrorContext } from "../lib/errors";

function parseItemTypeIcon(
  icon: unknown,
  defaultName = "footprints",
): {
  name: string;
  provider: IconSelectorProvider;
  isImage: boolean;
  imageSrc?: string;
} {
  if (!icon) {
    return { name: defaultName, provider: "yatra", isImage: false };
  }
  if (typeof icon === "string") {
    return { name: icon, provider: "yatra", isImage: false };
  }
  if (typeof icon === "object" && icon !== null && "type" in icon) {
    const o = icon as { type?: string; value?: string; provider?: string };
    if (o.type === "image" && o.value) {
      return {
        name: "image",
        provider: "yatra",
        isImage: true,
        imageSrc: String(o.value),
      };
    }
    const prov: IconSelectorProvider =
      o.provider === "fa-solid" || o.provider === "fa-regular"
        ? o.provider
        : "yatra";
    return {
      name: (o.value && String(o.value)) || defaultName,
      provider: prov,
      isImage: false,
    };
  }
  return { name: defaultName, provider: "yatra", isImage: false };
}

interface ItineraryEntry {
  id: number;
  trip_id: number;
  trip_title: string;
  day: number;
  day_title?: string;
  item_type: string;
  item_name: string;
  item_icon: string;
  item_icon_provider?: IconSelectorProvider;
  item_icon_is_image?: boolean;
  item_icon_image_src?: string;
  item_color?: string;
  item_type_id: number | null;
  item_id: number | null;
  title: string;
  description: string;
  location?: string;
  duration?: string;
  start_time: string;
  end_time: string;
  cost?: string;
  cost_per_person?: boolean;
  included_items?: string[] | string | null;
  excluded_items?: string[] | string | null;
  status: string;
  created_at: string;
}

interface DayGroup {
  trip_id: number;
  trip_title: string;
  day: number;
  day_title?: string;
  day_id?: number;
  day_status?: string;
  entries: ItineraryEntry[];
}

const Itinerary: React.FC = () => {
  // Global currency from settings (same as other admin pages)
  const globalCurrency = (window as any).yatraAdmin?.currency || "USD";
  const currencySymbol = getCurrencySymbol(globalCurrency) || "";
  const baseAdminUrl = (window as any).yatraAdmin?.adminUrl || "";
  // Get trip_id and day from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const tripIdParam = urlParams.get("trip_id");
  const dayParam = urlParams.get("day");

  // Restore last selected trip from localStorage if no URL param
  const storedTripId = !tripIdParam
    ? window.localStorage.getItem("yatra_itinerary_selected_trip") || ""
    : "";

  const [tripFilter, setTripFilter] = useState(tripIdParam || storedTripId);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [selectedEmptyDays, setSelectedEmptyDays] = useState<Set<string>>(
    new Set(),
  );
  const [selectedDay, setSelectedDay] = useState<{
    tripId: number;
    day: number;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    entry: ItineraryEntry | null;
  }>({
    isOpen: false,
    entry: null,
  });
  const [dayMenuOpen, setDayMenuOpen] = useState<{
    tripId: number;
    day: number;
  } | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(
    new Set(),
  );
  const [bulkAction, setBulkAction] = useState("");
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();

  // Update trip filter when URL param changes
  useEffect(() => {
    if (tripIdParam) {
      setTripFilter(tripIdParam);
    }
  }, [tripIdParam]);

  // Persist selected trip to localStorage so it is restored on next visit
  useEffect(() => {
    if (tripFilter) {
      window.localStorage.setItem("yatra_itinerary_selected_trip", tripFilter);
    }
  }, [tripFilter]);

  // State for item types and items (populated from trips API meta)
  const [itemTypesData, setItemTypesData] = useState<
    Array<{ id: number; name: string; icon: string; color: string }>
  >([]);
  const [itemsData, setItemsData] = useState<
    Array<{ id: number; name: string; type_id: number }>
  >([]);

  // Fetch trips for filter (with itinerary meta for item types and items)
  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["trips-with-itinerary-meta"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/trips", {
          params: {
            per_page: 100,
            status: "all", // Get all trips for filter
            include_itinerary_meta: 1, // Include item types and items in meta
          },
        });

        // Extract trips data
        const trips = response?.data?.data || response?.data || response || [];

        // Extract meta data for item types and items
        const meta = response?.data?.meta || response?.meta || {};
        if (meta.available_item_types) {
          setItemTypesData(meta.available_item_types);
        }
        if (meta.available_items) {
          setItemsData(meta.available_items);
        }

        return Array.isArray(trips) ? trips : [];
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to load trips", "yatra"),
          "error",
        );
        return [];
      }
    },
    enabled: can("yatra_view_trips"),
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
  });

  // Helper function to map item_type_id and item_id to item_type/item_name/item_icon/item_color
  const mapItemIds = (
    itemTypeId: number | null | undefined,
    itemId: number | null | undefined,
  ) => {
    // Find item type
    const itemType = itemTypeId
      ? itemTypesData.find(
          (type) =>
            type.id === itemTypeId ||
            type.id?.toString() === itemTypeId?.toString(),
        )
      : null;

    // Find item
    const item = itemId
      ? itemsData.find(
          (it) => it.id === itemId || it.id?.toString() === itemId?.toString(),
        )
      : null;

    const parsed = parseItemTypeIcon(itemType?.icon, "footprints");
    const itemColor = itemType?.color || "gray";

    if (itemType && item) {
      return {
        item_type: itemType.name || "Activity",
        item_name: item.name || "Activity",
        item_icon: parsed.name,
        item_icon_provider: parsed.provider,
        item_icon_is_image: parsed.isImage,
        item_icon_image_src: parsed.imageSrc,
        item_color: itemColor,
      };
    }

    if (itemType) {
      // Only item type found
      return {
        item_type: itemType.name || "Activity",
        item_name: itemType.name || "Activity",
        item_icon: parsed.name,
        item_icon_provider: parsed.provider,
        item_icon_is_image: parsed.isImage,
        item_icon_image_src: parsed.imageSrc,
        item_color: itemColor,
      };
    }

    // Fallback
    return {
      item_type: "Activity",
      item_name: "Activity",
      item_icon: "footprints",
      item_icon_provider: "yatra" as const,
      item_icon_is_image: false,
      item_color: "gray",
    };
  };

  // Helper to parse time field to start_time and end_time
  const parseTime = (
    time: string | null | undefined,
  ): { start_time: string; end_time: string } => {
    if (!time) return { start_time: "08:00", end_time: "17:00" };

    // Try to parse formats like "08:00-17:00" or "08:00 to 17:00"
    const timeMatch = time.match(
      /(\d{1,2}):(\d{2})\s*(?:-|to|–)\s*(\d{1,2}):(\d{2})/i,
    );
    if (timeMatch) {
      return {
        start_time: `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`,
        end_time: `${timeMatch[3].padStart(2, "0")}:${timeMatch[4]}`,
      };
    }

    // Try single time format
    const singleTime = time.match(/(\d{1,2}):(\d{2})/);
    if (singleTime) {
      const hour = parseInt(singleTime[1]);
      return {
        start_time: `${singleTime[1].padStart(2, "0")}:${singleTime[2]}`,
        end_time: `${((hour + 1) % 24).toString().padStart(2, "0")}:${singleTime[2]}`,
      };
    }

    return { start_time: "08:00", end_time: "17:00" };
  };

  const { data, isLoading, error, refetch } = useQuery<DayGroup[]>({
    queryKey: ["itinerary", tripFilter, tripsData],
    queryFn: async (): Promise<DayGroup[]> => {
      const trips = Array.isArray(tripsData) ? tripsData : [];
      const allEntries: ItineraryEntry[] = [];
      const allDays = new Map<
        string,
        {
          trip_id: number;
          trip_title: string;
          day: number;
          day_title: string;
          day_id?: number;
          day_status?: string;
        }
      >();
      const dayStatuses = new Map<string, string>();

      // Fetch itinerary data for the selected trip
      if (!tripFilter) {
        return [];
      }
      const tripsToFetch = trips.filter(
        (t: any) => t.id === parseInt(tripFilter),
      );

      for (const trip of tripsToFetch) {
        // Check URL parameter for error simulation (for testing)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("simulate_error") === "true") {
          throw new Error(
            "Simulated API error for testing error UI functionality",
          );
        }

        // Fetch itinerary data from the new itinerary endpoint
        const itineraryResponse = await apiClient.get("/itinerary", {
          params: {
            trip_id: trip.id,
            _t: Date.now(), // Cache buster
          },
        });

        // Debug logging

        // Extract data - WordPress REST API returns data directly, not nested under 'data'
        const itineraryEntries = Array.isArray(itineraryResponse)
          ? itineraryResponse
          : Array.isArray(itineraryResponse?.data)
            ? itineraryResponse.data
            : [];

        // Group entries by day number
        const entriesByDay = new Map<number, any[]>();
        const dayInfo = new Map<
          number,
          {
            title?: string;
            description?: string;
            status?: string;
            day_id?: number;
          }
        >();

        // First, group entries by day and collect day info
        for (const entry of itineraryEntries) {
          const dayNumber = entry.day || 1;

          // Store day info from day entries (entries where item_type_id and item_id are 0)
          if (
            (!entry.item_type_id || entry.item_type_id === 0) &&
            (!entry.item_id || entry.item_id === 0)
          ) {
            dayInfo.set(dayNumber, {
              title: entry.day_title || entry.title || "",
              description: entry.day_description || entry.description || "",
              status: entry.status,
              day_id: entry.id, // Store the day ID from the day entry
            });
          } else {
            // This is an activity entry, add to the day's entries
            if (!entriesByDay.has(dayNumber)) {
              entriesByDay.set(dayNumber, []);
            }
            entriesByDay.get(dayNumber)!.push(entry);
          }
        }

        // Create day structures similar to the old format
        const itineraryDays = [];

        // First, add all days that have day info (even if no activities)
        for (const [dayNumber, info] of dayInfo) {
          const entries = entriesByDay.get(dayNumber) || [];
          itineraryDays.push({
            id: info.day_id, // Day ID from the days table
            day_id: info.day_id, // Day ID for Edit/Delete operations
            day: dayNumber,
            day_number: dayNumber,
            day_title: info.title || `Day ${dayNumber}`,
            title: info.title || `Day ${dayNumber}`,
            description: info.description || "",
            entries: entries,
            status: info.status,
          });
        }

        // Then, add any days that only have activities but no day info
        for (const [dayNumber, entries] of entriesByDay) {
          if (!dayInfo.has(dayNumber)) {
            itineraryDays.push({
              id: undefined,
              day_id: undefined,
              day: dayNumber,
              day_number: dayNumber,
              day_title: `Day ${dayNumber}`,
              title: `Day ${dayNumber}`,
              description: "",
              entries: entries,
              status: "publish",
            });
          }
        }

        // Sort days by day_number
        itineraryDays.sort((a, b) => a.day_number - b.day_number);

        // Debug logging

        // Process each day
        for (const day of itineraryDays) {
          const dayNumber = day.day_number || day.day || 1;
          const dayTitle = day.title || day.day_title || "";
          const entries = day.entries || [];
          const dayKey = `${trip.id}-${dayNumber}`;

          // Process each entry (only activities, not day entries)
          for (const entry of entries) {
            // Ensure entry has required fields from database
            if (!entry || !entry.id) {
              continue;
            }

            // Skip day entries (entries where item_type_id and item_id are null)
            // Day entries should not be displayed as activities
            if (
              (entry.item_type_id === null ||
                entry.item_type_id === undefined ||
                entry.item_type_id === 0) &&
              (entry.item_id === null ||
                entry.item_id === undefined ||
                entry.item_id === 0)
            ) {
              // Capture day-level status from the day entry so day badges respond to edits
              if (entry.status) {
                dayStatuses.set(dayKey, String(entry.status));
              }
              continue;
            }

            const mapped = mapItemIds(entry.item_type_id, entry.item_id);
            const times = parseTime(entry.time);

            const processedEntry: ItineraryEntry = {
              id: entry.id || 0,
              trip_id: trip.id,
              trip_title: trip.title || trip.name || "",
              day: dayNumber,
              day_title: dayTitle,
              item_type: mapped.item_type,
              item_name: mapped.item_name,
              item_icon: mapped.item_icon,
              item_icon_provider: mapped.item_icon_provider,
              item_icon_is_image: mapped.item_icon_is_image,
              item_icon_image_src: mapped.item_icon_image_src,
              item_color: mapped.item_color || "gray",
              item_type_id: entry.item_type_id || null,
              item_id: entry.item_id || null,
              title: entry.title || "",
              description: entry.description || "",
              location: entry.location || "",
              duration: entry.duration || "",
              start_time: times.start_time,
              end_time: times.end_time,
              cost:
                typeof entry.cost === "number" || typeof entry.cost === "string"
                  ? String(entry.cost)
                  : undefined,
              cost_per_person:
                entry.cost_per_person !== undefined
                  ? !!entry.cost_per_person
                  : undefined,
              included_items: entry.included_items ?? [],
              excluded_items: entry.excluded_items ?? [],
              status: entry.status || "active",
              created_at: entry.created_at || entry.createdAt || "",
            };

            allEntries.push(processedEntry);
          }
        }

        // Also track all days (even if they have no activities) to ensure they appear in the listing
        for (const day of itineraryDays) {
          const dayNumber = day.day_number || day.day || 1;
          const dayTitle = day.title || day.day_title || "";
          const dayId = day.id || day.day_id || undefined;
          const dayKey = `${trip.id}-${dayNumber}`;

          // Store day info for grouping later
          if (!allDays.has(dayKey)) {
            allDays.set(dayKey, {
              trip_id: trip.id,
              trip_title: trip.title || trip.name || "",
              day: dayNumber,
              day_title: dayTitle,
              day_id: dayId,
              day_status: dayStatuses.get(dayKey),
            });
          }
        }
      }

      // Group by trip and day
      // First, create groups from all days (even if they have no activities)
      const grouped: DayGroup[] = [];
      const seen = new Set<string>();

      // Add all days first (from allDays map)
      allDays.forEach(
        (
          dayInfo: {
            trip_id: number;
            trip_title: string;
            day: number;
            day_title: string;
            day_id?: number;
            day_status?: string;
          },
          key: string,
        ) => {
          if (!seen.has(key)) {
            seen.add(key);
            grouped.push({
              trip_id: dayInfo.trip_id,
              trip_title: dayInfo.trip_title,
              day: dayInfo.day,
              day_title: dayInfo.day_title,
              day_id: dayInfo.day_id,
              day_status: dayInfo.day_status,
              entries: allEntries.filter(
                (e) => e.trip_id === dayInfo.trip_id && e.day === dayInfo.day,
              ),
            });
          }
        },
      );

      // Also add any days that have entries but weren't in allDays (fallback)
      allEntries.forEach((entry) => {
        const key = `${entry.trip_id}-${entry.day}`;
        if (!seen.has(key)) {
          seen.add(key);
          grouped.push({
            trip_id: entry.trip_id,
            trip_title: entry.trip_title,
            day: entry.day,
            day_title: entry.day_title,
            entries: allEntries.filter(
              (e) => e.trip_id === entry.trip_id && e.day === entry.day,
            ),
          });
        }
      });

      // Sort by trip_id and day
      grouped.sort((a, b) => {
        if (a.trip_id !== b.trip_id) return a.trip_id - b.trip_id;
        return a.day - b.day;
      });

      return grouped;
    },
    enabled: can("yatra_view_trips") && !!tripsData && !!tripFilter,
    staleTime: 0, // Always refetch to ensure fresh data
    gcTime: 0, // Don't cache to ensure fresh data (formerly cacheTime)
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
  });

  // Auto-expand day from URL or first day when data loads (only when data/URL change)
  useEffect(() => {
    if (data && data.length > 0 && expandedDays.size === 0) {
      // If day parameter is in URL, expand that specific day
      if (dayParam && tripIdParam) {
        const dayNumber = parseInt(dayParam);
        const tripId = parseInt(tripIdParam);
        const targetDay = data.find(
          (dg: DayGroup) => dg.trip_id === tripId && dg.day === dayNumber,
        );

        if (targetDay) {
          const dayKey = `${tripId}-${dayNumber}`;
          setExpandedDays(new Set([dayKey]));
          setSelectedDay({ tripId, day: dayNumber });
          // Scroll to the day after a short delay to ensure it's rendered
          setTimeout(() => {
            const dayElement = document.querySelector(
              `[data-day-key="${dayKey}"]`,
            );
            if (dayElement) {
              dayElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 300);
        } else {
          // If target day not found, expand first day as fallback
          const firstDay = data[0];
          setExpandedDays(new Set([`${firstDay.trip_id}-${firstDay.day}`]));
        }
      } else {
        // No day parameter, expand first day
        const firstDay = data[0];
        setExpandedDays(new Set([`${firstDay.trip_id}-${firstDay.day}`]));
      }
    }
  }, [data, dayParam, tripIdParam]);

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await apiClient.delete("/itinerary", {
        data: { ids },
      });
      return response?.data || response;
    },
    onSuccess: (data) => {
      const deleted = data?.deleted || 0;
      const failed = data?.failed || 0;

      if (deleted > 0) {
        showToast(
          failed > 0
            ? `${deleted} item(s) deleted successfully. ${failed} item(s) failed to delete.`
            : `${deleted} item(s) deleted successfully.`,
          "success",
        );
      } else {
        showToast("Failed to delete items. Please try again.", "error");
      }

      setSelectedEntries(new Set());
      queryClient.invalidateQueries({ queryKey: ["itinerary"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips-simple"] });
      refetch();
    },
    onError: (error: any) => {
      showToast(
        error?.message || "Failed to delete items. Please try again.",
        "error",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (entry: ItineraryEntry) => {
      try {
        // Determine mode based on whether this is a day entry or activity entry
        const isDayEntry = !entry.item_type_id || entry.item_type_id === 0;
        const mode = isDayEntry ? "day" : "activity";
        const response = await apiClient.delete(
          `/itinerary/${entry.id}?mode=${mode}`,
        );
        return { response: response?.data || response, entry };
      } catch (error: any) {
        throw error;
      }
    },
    onSuccess: (data) => {
      const entry = data.entry;
      const isDayDeletion = (entry as any)?._isDayDeletion;
      showToast(
        isDayDeletion
          ? __("Day and all activities deleted successfully", "yatra")
          : __("Itinerary entry deleted successfully", "yatra"),
        "success",
      );
      // Close confirmation dialog
      setDeleteConfirm({ isOpen: false, entry: null });
      // Refresh itinerary data
      queryClient.invalidateQueries({ queryKey: ["itinerary"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips-simple"] });
      // Force refetch
      refetch();
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to delete itinerary entry", "yatra"),
        "error",
      );
    },
  });

  // Mutation to update itinerary entry item
  const updateItemMutation = useMutation({
    mutationFn: async ({
      entryId,
      itemId,
      itemTypeId,
    }: {
      entryId: number;
      itemId: number;
      itemTypeId: number;
    }) => {
      // Item assignment is always for activities, so use mode=activity
      const currentEntry = await apiClient.get(
        `/itinerary/${entryId}?mode=activity`,
      );
      const entryData =
        currentEntry?.data?.data || currentEntry?.data || currentEntry;

      // Update with new item_id and item_type_id
      return await apiClient.put(`/itinerary/${entryId}?mode=activity`, {
        ...entryData,
        item_id: itemId,
        item_type_id: itemTypeId,
      });
    },
    onSuccess: () => {
      showToast(__("Item updated successfully", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["itinerary"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips-simple"] });
      refetch();
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to update item", "yatra"),
        "error",
      );
    },
  });

  const handleAddDay = () => {
    // Navigate to add day form - this creates a new day entry
    // If a trip is selected, pass trip_id; otherwise let the form show the trip selector
    if (tripFilter) {
      // Get the max day number for this trip to suggest the next day
      const tripEntries = dayGroups.filter(
        (dg: DayGroup) => dg.trip_id === parseInt(tripFilter),
      );
      const maxDay =
        tripEntries.length > 0
          ? Math.max(...tripEntries.map((dg: DayGroup) => dg.day))
          : 0;
      const nextDay = maxDay + 1;

      window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripFilter}&day=${nextDay}&mode=day`;
    } else {
      // No trip selected - navigate without trip_id so form shows trip selector
      window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&mode=day`;
    }
  };

  // Get quick add options from item types and items
  const quickAddOptions = useMemo(() => {
    const itemTypes = Array.isArray(itemTypesData) ? itemTypesData : [];

    return itemTypes
      .map((itemType: any) => {
        const parsed = parseItemTypeIcon(itemType.icon, "footprints");
        const color = itemType.color || "blue";

        return {
          typeId: itemType.id,
          typeName: itemType.name || "",
          typeIcon: parsed.name,
          typeIconProvider: parsed.provider,
          typeIconImageSrc: parsed.isImage ? parsed.imageSrc : undefined,
          typeIconData: itemType.icon,
          typeColor: color,
        };
      })
      .filter((option: any) => option.typeName); // Filter out invalid options
  }, [itemTypesData]);

  const handleQuickAdd = (typeId: number | string) => {
    if (!selectedDay) {
      // Select first day if none selected
      const firstDay = data?.[0];
      if (firstDay) {
        setSelectedDay({ tripId: firstDay.trip_id, day: firstDay.day });
        const key = `${firstDay.trip_id}-${firstDay.day}`;
        setExpandedDays(new Set([key]));
      }
    }

    const tripId =
      selectedDay?.tripId || (tripFilter ? parseInt(tripFilter) : 1);
    const day = selectedDay?.day || 1;

    // Use item type ID for navigation
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripId}&day=${day}&type_id=${typeId}`;
  };

  const handleEdit = (entry: ItineraryEntry) => {
    // Determine if this is a day entry or activity entry
    // Day entries have item_type_id: 0 or null, activity entries have item_type_id > 0
    const isDayEntry = !entry.item_type_id || entry.item_type_id === 0;
    const mode = isDayEntry ? "day" : "activity";
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=edit&id=${entry.id}&mode=${mode}`;
  };

  const handleEditDay = async (tripId: number, day: number) => {
    const redirectToCreate = () => {
      window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripId}&day=${day}&mode=day`;
    };

    const redirectToEdit = (entryId: number) => {
      const params = new URLSearchParams({
        action: "edit",
        id: entryId.toString(),
        mode: "day",
        trip_id: tripId.toString(),
        day: day.toString(),
      });
      window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&${params.toString()}`;
    };

    const dayGroup = dayGroups.find(
      (dg: DayGroup) => dg.trip_id === tripId && dg.day === day,
    );

    if (!dayGroup) {
      redirectToCreate();
      setDayMenuOpen(null);
      return;
    }

    if (dayGroup.day_id) {
      try {
        const response = await apiClient.get(
          `/itinerary/day-entry-by-day-id/${dayGroup.day_id}`,
        );

        const dayEntryId =
          response?.data?.day_entry_id ||
          response?.day_entry_id ||
          response?.data?.id ||
          response?.id ||
          null;

        if (dayEntryId) {
          redirectToEdit(dayEntryId);
          setDayMenuOpen(null);
          return;
        }
      } catch (error) {
        console.error(
          "[YATRA DEBUG] Failed to fetch day entry for editing:",
          error,
        );
      }
    }

    if (dayGroup.entries.length > 0) {
      // Look for day entry (item_type_id and item_id are 0, null, or undefined)
      const dayEntry = dayGroup.entries.find((entry: any) => {
        const isDayEntry =
          (entry.item_type_id === null ||
            entry.item_type_id === undefined ||
            entry.item_type_id === 0) &&
          (entry.item_id === null ||
            entry.item_id === undefined ||
            entry.item_id === 0);

        return isDayEntry;
      });

      if (dayEntry && dayEntry.id) {
        redirectToEdit(dayEntry.id);
        setDayMenuOpen(null);
        return;
      }

      const firstEntry = dayGroup.entries[0];

      if (firstEntry && firstEntry.id) {
        redirectToEdit(firstEntry.id);
        setDayMenuOpen(null);
        return;
      }
    }

    redirectToCreate();
    setDayMenuOpen(null);
  };

  const handleDeleteDay = async (tripId: number, day: number) => {
    // Find the day group
    const dayGroup = dayGroups.find(
      (dg: DayGroup) => dg.trip_id === tripId && dg.day === day,
    );

    if (!dayGroup) {
      showToast(__("Day not found", "yatra"), "error");
      setDayMenuOpen(null);
      return;
    }

    // If we have day_id, fetch the day entry ID from backend
    if (dayGroup.day_id) {
      try {
        const response = await apiClient.get(
          `/itinerary/day-entry-by-day-id/${dayGroup.day_id}`,
        );
        const dayEntryId =
          response?.data?.day_entry_id ||
          response?.day_entry_id ||
          response?.data?.id ||
          response?.id ||
          null;

        if (dayEntryId) {
          const dayEntryForDeletion = {
            id: dayEntryId,
            trip_id: tripId,
            day: day,
            _isDayDeletion: true,
            _dayNumber: day,
          } as ItineraryEntry & {
            _isDayDeletion?: boolean;
            _dayNumber?: number;
          };

          setDeleteConfirm({ isOpen: true, entry: dayEntryForDeletion });
        } else {
          showToast(__("Day entry not found", "yatra"), "error");
        }
      } catch (error: any) {
        showToast(__("Failed to fetch day entry", "yatra"), "error");
      }
    } else {
      showToast(__("Day ID not available", "yatra"), "error");
    }
    setDayMenuOpen(null);
  };

  const handleDelete = (entry: ItineraryEntry) => {
    setDeleteConfirm({ isOpen: true, entry });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.entry) {
      deleteMutation.mutate(deleteConfirm.entry);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, entry: null });
  };

  // Bulk selection handlers
  const handleToggleSelect = (entryId: number) => {
    setSelectedEntries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (dayGroup: DayGroup) => {
    const allEntryIds = dayGroup.entries.map((e) => e.id);
    setSelectedEntries((prev) => {
      const newSet = new Set(prev);
      const allSelected = allEntryIds.every((id) => newSet.has(id));
      if (allSelected) {
        allEntryIds.forEach((id) => newSet.delete(id));
      } else {
        allEntryIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleSelectAllDays = () => {
    // Only operate on entries that are currently visible under the active status tab
    const allEntryIds = filteredDayGroups.flatMap((dg) =>
      dg.entries.map((e) => e.id),
    );
    const emptyDayKeys = filteredDayGroups
      .filter((dg) => dg.entries.length === 0)
      .map((dg) => `${dg.trip_id}-${dg.day}`);

    setSelectedEntries((prev) => {
      const newSet = new Set(prev);
      const allSelected =
        allEntryIds.length > 0 && allEntryIds.every((id) => newSet.has(id));
      if (allSelected) {
        allEntryIds.forEach((id) => newSet.delete(id));
      } else {
        allEntryIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });

    // Keep empty-day selection in sync with global Select All
    setSelectedEmptyDays((prev) => {
      const allSelected =
        emptyDayKeys.length > 0 && emptyDayKeys.every((key) => prev.has(key));
      const next = new Set(prev);
      if (allSelected) {
        emptyDayKeys.forEach((key) => next.delete(key));
      } else {
        emptyDayKeys.forEach((key) => next.add(key));
      }
      return next;
    });
  };

  const handleBulkApply = async () => {
    const ids = Array.from(selectedEntries);
    const emptyDayKeys = Array.from(selectedEmptyDays);

    // Also treat days that have at least one selected entry as selected days
    const selectedDayKeysFromEntries = new Set<string>();
    filteredDayGroups.forEach((dg) => {
      const hasSelectedEntry = dg.entries.some((e) =>
        selectedEntries.has(e.id),
      );
      if (hasSelectedEntry) {
        selectedDayKeysFromEntries.add(`${dg.trip_id}-${dg.day}`);
      }
    });

    const combinedDayKeys = new Set<string>([
      ...emptyDayKeys,
      ...selectedDayKeysFromEntries,
    ]);

    if (!bulkAction || (ids.length === 0 && combinedDayKeys.size === 0)) {
      showToast(
        __("Please select entries or days and a bulk action first.", "yatra"),
        "error",
      );
      return;
    }

    // Resolve day_entry IDs for selected empty days
    const resolveDayEntryIds = async (): Promise<number[]> => {
      const dayEntryIds: number[] = [];

      for (const key of combinedDayKeys) {
        const [tripIdStr, dayStr] = key.split("-");
        const tripIdNum = parseInt(tripIdStr, 10);
        const dayNum = parseInt(dayStr, 10);

        if (Number.isNaN(tripIdNum) || Number.isNaN(dayNum)) {
          continue;
        }

        const dg = dayGroups.find(
          (g) => g.trip_id === tripIdNum && g.day === dayNum,
        );

        if (!dg || !dg.day_id) {
          continue;
        }

        try {
          const response = await apiClient.get(
            `/itinerary/day-entry-by-day-id/${dg.day_id}`,
          );
          const dayEntryId =
            response?.data?.day_entry_id ||
            response?.day_entry_id ||
            response?.data?.id ||
            response?.id ||
            null;

          if (dayEntryId) {
            dayEntryIds.push(Number(dayEntryId));
          }
        } catch (error) {
          // Ignore failures for individual days; bulk handler will still proceed for others
          console.error("Failed to resolve day entry ID for day", key, error);
        }
      }

      return dayEntryIds;
    };

    const dayEntryIds = await resolveDayEntryIds();
    const allIdsForAction = [...ids, ...dayEntryIds];

    if (allIdsForAction.length === 0) {
      showToast(
        __("No valid entries or days found to apply this action.", "yatra"),
        "error",
      );
      return;
    }

    // Delete permanently (uses dedicated bulk delete endpoint)
    if (bulkAction === "delete") {
      bulkDeleteMutation.mutate(allIdsForAction);
      return;
    }

    // Status changes are applied one-by-one using the REST API
    const targetStatus = (() => {
      if (bulkAction === "publish") return "published";
      if (bulkAction === "draft") return "draft";
      if (bulkAction === "trash") return "trash";
      if (bulkAction === "restore") return "draft"; // restore from Trash -> Draft
      return "";
    })();

    if (!targetStatus) {
      return;
    }

    try {
      await Promise.all(
        allIdsForAction.map(async (id) => {
          // First fetch with activity mode (most common case)
          // If it fails, the backend will handle it
          let current;
          let mode = "activity";

          try {
            current = await apiClient.get(`/itinerary/${id}?mode=activity`);
          } catch (error) {
            // If activity mode fails, try day mode
            mode = "day";
            current = await apiClient.get(`/itinerary/${id}?mode=day`);
          }

          const entryData = current?.data?.data || current?.data || current;

          // Apply status change while preserving other fields
          await apiClient.put(`/itinerary/${id}?mode=${mode}`, {
            ...entryData,
            status: targetStatus,
          });
        }),
      );

      showToast(__("Bulk action applied successfully.", "yatra"), "success");
      setSelectedEntries(new Set());
      setSelectedEmptyDays(new Set());
      setBulkAction("");
      queryClient.invalidateQueries({ queryKey: ["itinerary"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips-simple"] });
      refetch();
    } catch (error: any) {
      showToast(
        error?.message ||
          __("Failed to apply bulk action. Please try again.", "yatra"),
        "error",
      );
    }
  };

  const toggleDay = (tripId: number, day: number) => {
    const key = `${tripId}-${day}`;
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setSelectedDay({ tripId, day });
  };

  const getItemCounts = (entries: ItineraryEntry[]) => {
    const meals = entries.filter((e) => e.item_type === "Meal").length;
    const activities = entries.filter((e) => e.item_type === "Activity").length;
    const accommodations = entries.filter(
      (e) => e.item_type === "Accommodation",
    ).length;
    return { meals, activities, accommodations, total: entries.length };
  };

  const getDayStatusBadge = (dayGroup: DayGroup) => {
    const normalize = (value?: string | null) => (value || "").toLowerCase();

    // Prefer explicit day_status from the day entry
    const explicitStatus = normalize(dayGroup.day_status);

    let label = "";
    let className = "";

    if (explicitStatus === "publish") {
      label = __("Published", "yatra");
      className =
        "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
    } else if (explicitStatus === "draft") {
      label = __("Draft", "yatra");
      className =
        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    } else if (explicitStatus === "trash") {
      label = __("Trash", "yatra");
      className =
        "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    } else {
      // Fallback: infer from activity entries when day_status is not set
      const statuses = dayGroup.entries.map((e) => normalize(e.status));

      const hasPublished = statuses.some((s) => s === "publish");
      const hasDraft = statuses.some((s) => s === "draft");
      const hasTrash = statuses.some((s) => s === "trash");

      if (hasPublished) {
        label = __("Published", "yatra");
        className =
          "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      } else if (hasDraft) {
        label = __("Draft", "yatra");
        className =
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
      } else if (hasTrash) {
        label = __("Trash", "yatra");
        className =
          "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      } else {
        label = __("No Status", "yatra");
        className =
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
      }
    }

    return (
      <Badge className={`ml-2 text-[11px] px-2 py-0.5 ${className}`}>
        {label}
      </Badge>
    );
  };

  const formatTime = (time: string) => {
    // Convert 24h to 12h format
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getEntryStatusBadge = (status: string) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "publish" || normalized === "published") {
      return (
        <Badge className="ml-2 text-[11px] px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
          {__("Published", "yatra")}
        </Badge>
      );
    }

    if (normalized === "draft") {
      return (
        <Badge className="ml-2 text-[11px] px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
          {__("Draft", "yatra")}
        </Badge>
      );
    }

    if (normalized === "trash") {
      return (
        <Badge className="ml-2 text-[11px] px-2 py-0.5 bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-400 dark:border-gray-700">
          {__("Trash", "yatra")}
        </Badge>
      );
    }

    return null;
  };

  const dayGroups: DayGroup[] = (data || []) as DayGroup[];
  const errorContext = getErrorContext(error);
  const apiErrorMessage = (data as any)?.error || (data as any)?.message;
  const derivedErrorDetails =
    errorContext.details ||
    (apiErrorMessage ? String(apiErrorMessage) : undefined) ||
    (error ? String(error?.message || error) : undefined);

  // More precise error detection - only true if query ran and failed
  const queryEnabled = can("yatra_view_trips") && !!tripsData && !!tripFilter;
  const isItineraryError = queryEnabled && (!!error || !!apiErrorMessage);

  // Debug logging to understand the state

  const matchesStatusValue = (
    statusValue: string | undefined | null,
    filter: string,
  ) => {
    if (!filter || filter === "all") {
      return true;
    }

    const status = (statusValue || "").toLowerCase();

    if (filter === "publish") {
      return status === "publish";
    }

    if (filter === "draft") {
      return status === "draft";
    }

    if (filter === "trash") {
      return status === "trash";
    }

    // Fallback: treat unknown filters as "match all"
    return true;
  };

  const matchesStatusFilter = (entry: ItineraryEntry, filter: string) => {
    return matchesStatusValue(entry.status, filter);
  };

  const matchesStatusFilterForDay = (dayGroup: DayGroup, filter: string) => {
    if (!filter || filter === "all") {
      return true;
    }

    // Prefer explicit day_status when available
    if (matchesStatusValue(dayGroup.day_status, filter)) {
      return true;
    }

    // Fallback: infer from any of the day's entries
    return dayGroup.entries.some((entry) => matchesStatusFilter(entry, filter));
  };

  const filteredDayGroups: DayGroup[] = useMemo(() => {
    const groupsWithFilteredEntries = dayGroups.map((dg) => ({
      ...dg,
      entries: dg.entries.filter((entry) =>
        matchesStatusFilter(entry, statusFilter),
      ),
    }));

    if (!statusFilter || statusFilter === "all") {
      return groupsWithFilteredEntries;
    }

    // For specific status tabs, only show days whose own status OR any entry matches the filter
    return groupsWithFilteredEntries.filter((dg) =>
      matchesStatusFilterForDay(dg, statusFilter),
    );
  }, [dayGroups, statusFilter]);

  const totalEntries = filteredDayGroups.reduce(
    (acc, dg) => acc + dg.entries.length,
    0,
  );
  const totalEmptyDays = filteredDayGroups.filter(
    (dg) => dg.entries.length === 0,
  ).length;
  const totalSelectableItems = totalEntries + totalEmptyDays;

  // Precompute all entry IDs for header "Select All" checkbox (respecting current status filter)
  const allEntryIds = filteredDayGroups.flatMap((dg) =>
    dg.entries.map((e) => e.id),
  );

  const statusCounts = dayGroups.reduce(
    (acc, dg) => {
      if (matchesStatusFilterForDay(dg, "publish")) {
        acc.publish += 1;
      }
      if (matchesStatusFilterForDay(dg, "draft")) {
        acc.draft += 1;
      }
      if (matchesStatusFilterForDay(dg, "trash")) {
        acc.trash += 1;
      }

      return acc;
    },
    { publish: 0, draft: 0, trash: 0 },
  );

  const statusOptions = [
    { key: "all", label: __("All", "yatra"), count: dayGroups.length },
    {
      key: "publish",
      label: __("Published", "yatra"),
      count: statusCounts.publish,
    },
    { key: "draft", label: __("Draft", "yatra"), count: statusCounts.draft },
    { key: "trash", label: __("Trash", "yatra"), count: statusCounts.trash },
  ];

  const bulkActionOptions = useMemo(() => {
    // In Trash view: allow restore to Draft and permanent delete only
    if (statusFilter === "trash") {
      return [
        { value: "restore", label: __("Restore to Draft", "yatra") },
        { value: "delete", label: __("Delete Permanently", "yatra") },
      ];
    }

    // Other views: normal status changes + move to trash + delete
    return [
      { value: "publish", label: __("Mark as Published", "yatra") },
      { value: "draft", label: __("Mark as Draft", "yatra") },
      { value: "trash", label: __("Move to Trash", "yatra") },
      { value: "delete", label: __("Delete Permanently", "yatra") },
    ];
  }, [statusFilter]);

  // Close day menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setDayMenuOpen(null);
    };
    if (dayMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [dayMenuOpen]);

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {__(
              "Build your complete itinerary with activities, meals, and accommodations",
              "yatra",
            )}
          </p>
        </div>
      </div>

      {/* Trip Selector - Clean Design */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("Select Trip", "yatra")}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {__(
                "Choose a trip to manage its itinerary entries and day-by-day schedule",
                "yatra",
              )}
            </p>
          </div>
        </div>

        <div className="space-y-4 overflow-visible">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {__("Trip", "yatra")} <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={tripFilter}
              onChange={(value) => setTripFilter(value)}
              options={
                (Array.isArray(tripsData) ? tripsData : []).map(
                  (trip: any) => ({
                    value: trip.id.toString(),
                    label: `${trip.title || trip.name || ""}${trip.trip_type === "single_day" ? __(" (Single Day)", "yatra") : trip.trip_type === "multi_day" ? __(" (Multi-Day)", "yatra") : ""}`,
                  }),
                ) || []
              }
              placeholder={__("Search or select a trip...", "yatra")}
              searchPlaceholder={__("Search by trip name or ID...", "yatra")}
              className="w-full"
              required
            />
          </div>

          {tripFilter &&
            (() => {
              const tripsList = Array.isArray(tripsData) ? tripsData : [];
              const selectedTrip = tripsList.find(
                (t: any) => t.id.toString() === tripFilter,
              );
              return selectedTrip ? (
                <div className="flex items-center gap-4 pt-2 border-t border-blue-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium">
                      {selectedTrip.starting_location ||
                        selectedTrip.start_location ||
                        "N/A"}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium">
                      {selectedTrip.ending_location ||
                        selectedTrip.end_location ||
                        "N/A"}
                    </span>
                  </div>
                  {selectedTrip.trip_type && (
                    <Badge
                      className={
                        selectedTrip.trip_type === "single_day"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                          : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                      }
                    >
                      {selectedTrip.trip_type === "single_day"
                        ? __("Single Day", "yatra")
                        : __("Multi-Day", "yatra")}
                    </Badge>
                  )}
                </div>
              ) : null;
            })()}

          {!tripFilter && (
            <div className="mt-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200/50 dark:border-gray-700/50 overflow-visible">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {__("Get Started", "yatra")}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {__(
                      "Select a trip from the dropdown above to view and manage its itinerary entries and day-by-day schedule.",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Day / Add Entry button below trip selector */}
      {tripFilter &&
        (() => {
          const selectedTrip = tripsData?.find(
            (t: any) => t.id.toString() === tripFilter,
          );
          const isSingleDay = selectedTrip?.trip_type === "single_day";
          const buttonLabel = isSingleDay
            ? __("Add Entry", "yatra")
            : __("Add Day", "yatra");

          return (
            <div className="flex justify-end mt-4">
              <ConditionalRender capability="yatra_edit_trips">
                <Button
                  onClick={handleAddDay}
                  className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                  {buttonLabel}
                </Button>
              </ConditionalRender>
            </div>
          );
        })()}

      <ConditionalRender capability="yatra_view_trips">
        <>
          <BulkActionToolbar
            selectedIds={[
              ...Array.from(selectedEntries),
              ...Array.from(selectedEmptyDays),
            ]}
            bulkAction={bulkAction}
            setBulkAction={setBulkAction}
            onApply={handleBulkApply}
            onClearSelection={() => {
              setSelectedEntries(new Set());
              setSelectedEmptyDays(new Set());
            }}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            statusOptions={statusOptions}
            showColumnsDropdown={showColumnsDropdown}
            setShowColumnsDropdown={setShowColumnsDropdown}
            columnOptions={[]}
            onToggleColumn={() => {}}
            bulkMutationPending={bulkDeleteMutation.isPending}
            totalItems={totalSelectableItems}
            bulkActionOptions={bulkActionOptions}
          />
          {isItineraryError ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {__("Error Loading Itinerary", "yatra")}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__(
                          "We couldn't connect to the itinerary service. Please refresh or try again shortly.",
                          "We couldn't connect to the itinerary service. Please refresh or try again shortly.",
                        )}
                      </p>
                    </div>
                  </div>

                  {derivedErrorDetails && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {__("Error Details", "yatra")}
                        </h4>
                        <button
                          onClick={() => {
                            const details = JSON.stringify(
                              {
                                error: derivedErrorDetails,
                                request: errorContext.requestInfo,
                              },
                              null,
                              2,
                            );
                            navigator.clipboard.writeText(details);
                            // Show toast feedback
                            showToast(
                              __("Error details copied to clipboard", "yatra"),
                              "success",
                            );
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {__("Copy", "yatra")}
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-900 p-2 rounded border">
                          {derivedErrorDetails}
                        </div>
                        {errorContext.requestInfo && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <div>
                              <strong>{__("Request", "yatra")}:</strong>{" "}
                              {errorContext.requestInfo.method}{" "}
                              {errorContext.requestInfo.url}
                            </div>
                            {errorContext.requestInfo.payload && (
                              <div>
                                <strong>{__("Payload", "yatra")}:</strong>{" "}
                                <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded overflow-auto max-h-20">
                                  {JSON.stringify(
                                    errorContext.requestInfo.payload,
                                    null,
                                    2,
                                  )}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => refetch()}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {__("Retry", "yatra")}
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="ghost"
                      className="text-gray-600 dark:text-gray-400"
                    >
                      {__("Refresh Page", "yatra")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : isLoading || isLoadingTrips ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDayGroups.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {(() => {
                        const selectedTrip = tripsData?.find(
                          (t: any) => t.id.toString() === tripFilter,
                        );
                        const isSingleDay =
                          selectedTrip?.trip_type === "single_day";
                        return isSingleDay
                          ? __("No itinerary entries yet", "yatra")
                          : __("No itinerary days yet", "yatra");
                      })()}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                      {(() => {
                        const selectedTrip = tripsData?.find(
                          (t: any) => t.id.toString() === tripFilter,
                        );
                        const isSingleDay =
                          selectedTrip?.trip_type === "single_day";
                        return isSingleDay
                          ? __(
                              "Start building your itinerary by adding your first entry to create a detailed schedule for your trip.",
                              "yatra",
                            )
                          : __(
                              "Start building your itinerary by adding your first day to organize your trip schedule.",
                              "yatra",
                            );
                      })()}
                    </p>
                    {can("yatra_edit_trips") && (
                      <Button
                        onClick={handleAddDay}
                        className="flex items-center gap-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        {(() => {
                          const selectedTrip = tripsData?.find(
                            (t: any) => t.id.toString() === tripFilter,
                          );
                          const isSingleDay =
                            selectedTrip?.trip_type === "single_day";
                          return isSingleDay
                            ? __("Add Your First Entry", "yatra")
                            : __("Add Your First Day", "yatra");
                        })()}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Bulk Select All Option */}
              {filteredDayGroups.length > 0 && (
                <ConditionalRender capability="yatra_delete_trips">
                  <Card className="overflow-visible">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between gap-4 rounded-t-lg">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={
                              allEntryIds.length > 0 &&
                              allEntryIds.every((id) => selectedEntries.has(id))
                            }
                            onChange={handleSelectAllDays}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            {__("Select All", "yatra")}
                          </label>
                          {selectedEntries.size > 0 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({selectedEntries.size} {__("selected", "yatra")})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <button
                            type="button"
                            className="hover:text-gray-700 dark:hover:text-gray-200 underline-offset-2 hover:underline"
                            onClick={() => {
                              // Expand all days
                              const allKeys = filteredDayGroups.map(
                                (dg) => `${dg.trip_id}-${dg.day}`,
                              );
                              setExpandedDays(new Set(allKeys));
                            }}
                          >
                            {__("Expand all", "yatra")}
                          </button>
                          <button
                            type="button"
                            className="hover:text-gray-700 dark:hover:text-gray-200 underline-offset-2 hover:underline"
                            onClick={() => {
                              // Collapse all days
                              setExpandedDays(new Set());
                            }}
                          >
                            {__("Collapse all", "yatra")}
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ConditionalRender>
              )}
              {filteredDayGroups.map((dayGroup) => {
                const key = `${dayGroup.trip_id}-${dayGroup.day}`;
                const isExpanded = expandedDays.has(key);
                const counts = getItemCounts(dayGroup.entries);
                const sortedEntries = [...dayGroup.entries].sort((a, b) => {
                  const timeA = a.start_time.split(":").map(Number);
                  const timeB = b.start_time.split(":").map(Number);
                  return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
                });

                const tripsList = Array.isArray(tripsData) ? tripsData : [];
                const selectedTripForLayout = tripsList.find(
                  (t: any) => t.id.toString() === tripFilter,
                );
                const isSingleDayTrip =
                  selectedTripForLayout?.trip_type === "single_day";

                return (
                  <div
                    key={key}
                    data-day-key={key}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-gray-700 mb-4 overflow-visible"
                  >
                    {/* Day Header */}
                    <div className="flex items-center gap-4 px-4 py-3 rounded-t-lg">
                      <ConditionalRender capability="yatra_delete_trips">
                        <input
                          type="checkbox"
                          checked={
                            dayGroup.entries.length === 0
                              ? selectedEmptyDays.has(key)
                              : dayGroup.entries.every((e) =>
                                  selectedEntries.has(e.id),
                                )
                          }
                          onChange={(e) => {
                            e.stopPropagation();
                            if (dayGroup.entries.length > 0) {
                              handleSelectAll(dayGroup);
                            } else {
                              setSelectedEmptyDays((prev) => {
                                const next = new Set(prev);
                                if (next.has(key)) {
                                  next.delete(key);
                                } else {
                                  next.add(key);
                                }
                                return next;
                              });
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          title={__("Select all entries for this day", "yatra")}
                        />
                      </ConditionalRender>
                      <div
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() =>
                          toggleDay(dayGroup.trip_id, dayGroup.day)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-medium">
                            {isSingleDayTrip
                              ? __("Entry", "yatra")
                              : __("Day", "yatra")}{" "}
                            {dayGroup.day}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                              {dayGroup.day_title
                                ? `${isSingleDayTrip ? __("Entry", "yatra") : __("Day", "yatra")} ${dayGroup.day}: ${dayGroup.day_title}`
                                : `${isSingleDayTrip ? __("Entry", "yatra") : __("Day", "yatra")} ${dayGroup.day}`}
                              {getDayStatusBadge(dayGroup)}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <span>
                                {counts.total} {__("items", "yatra")}
                              </span>
                              {counts.meals > 0 && (
                                <div className="flex items-center gap-1">
                                  <UtensilsCrossed className="w-3.5 h-3.5" />
                                  <span>{counts.meals}</span>
                                </div>
                              )}
                              {counts.activities > 0 && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{counts.activities}</span>
                                </div>
                              )}
                              {counts.accommodations > 0 && (
                                <div className="flex items-center gap-1">
                                  <Hotel className="w-3.5 h-3.5" />
                                  <span>{__("Stay", "yatra")}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2 relative cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDay(dayGroup.trip_id, dayGroup.day);
                        }}
                      >
                        <ConditionalRender capability="yatra_edit_trips">
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  dayMenuOpen &&
                                  dayMenuOpen.tripId === dayGroup.trip_id &&
                                  dayMenuOpen.day === dayGroup.day
                                ) {
                                  setDayMenuOpen(null);
                                } else {
                                  setDayMenuOpen({
                                    tripId: dayGroup.trip_id,
                                    day: dayGroup.day,
                                  });
                                }
                              }}
                              title={__("Day Options", "yatra")}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                            {dayMenuOpen &&
                              dayMenuOpen.tripId === dayGroup.trip_id &&
                              dayMenuOpen.day === dayGroup.day && (
                                <div
                                  className="absolute right-0 top-10 z-50 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() =>
                                      handleEditDay(
                                        dayGroup.trip_id,
                                        dayGroup.day,
                                      )
                                    }
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    {isSingleDayTrip
                                      ? __("Edit Entry", "yatra")
                                      : __("Edit Day", "yatra")}
                                  </button>
                                  <ConditionalRender capability="yatra_delete_trips">
                                    <button
                                      onClick={() =>
                                        handleDeleteDay(
                                          dayGroup.trip_id,
                                          dayGroup.day,
                                        )
                                      }
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      {isSingleDayTrip
                                        ? __("Delete Entry", "yatra")
                                        : __("Delete Day", "yatra")}
                                    </button>
                                  </ConditionalRender>
                                </div>
                              )}
                          </div>
                        </ConditionalRender>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Day Content - Expanded */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 overflow-visible">
                        {/* Quick Add Section */}
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              {__("QUICK ADD", "yatra")}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {quickAddOptions.length > 0 ? (
                                quickAddOptions.map((option: any) => {
                                  // Get color classes based on typeColor
                                  const colorClasses: Record<string, string> = {
                                    blue: "border-blue-500 text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20",
                                    green:
                                      "border-green-500 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20",
                                    red: "border-red-500 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20",
                                    yellow:
                                      "border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20",
                                    purple:
                                      "border-purple-500 text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20",
                                    orange:
                                      "border-orange-500 text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20",
                                    pink: "border-pink-500 text-pink-700 hover:bg-pink-50 dark:text-pink-400 dark:hover:bg-pink-900/20",
                                    indigo:
                                      "border-indigo-500 text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20",
                                    gray: "border-gray-500 text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900/20",
                                  };

                                  const colorClass =
                                    colorClasses[option.typeColor] ||
                                    colorClasses.blue;

                                  return (
                                    <Button
                                      key={option.typeId}
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleQuickAdd(option.typeId)
                                      }
                                      className={`flex items-center gap-2 ${colorClass}`}
                                      style={{
                                        borderColor: option.typeColor
                                          ? `var(--color-${option.typeColor}-500)`
                                          : undefined,
                                      }}
                                    >
                                      {option.typeIconImageSrc ? (
                                        <img
                                          src={option.typeIconImageSrc}
                                          alt={option.typeName}
                                          className="w-4 h-4 object-contain"
                                        />
                                      ) : (
                                        <IconSelector
                                          iconName={option.typeIcon as any}
                                          provider={
                                            option.typeIconProvider ?? "yatra"
                                          }
                                          className="w-4 h-4"
                                        />
                                      )}
                                      {option.typeName}
                                    </Button>
                                  );
                                })
                              ) : (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {__("No item types available", "yatra")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Itinerary Items */}
                        <div className="px-4 pb-3 pt-2 space-y-3 overflow-visible rounded-b-lg">
                          {sortedEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-center gap-4 p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-100/60 dark:border-gray-800/80 shadow-sm overflow-visible"
                            >
                              {/* Checkbox */}
                              <ConditionalRender capability="yatra_delete_trips">
                                <input
                                  type="checkbox"
                                  checked={selectedEntries.has(entry.id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleToggleSelect(entry.id);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                  title={__("Select this entry", "yatra")}
                                />
                              </ConditionalRender>
                              {/* Time */}
                              <div className="flex flex-col items-center min-w-[80px]">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {entry.end_time
                                    ? `${formatTime(entry.start_time)} - ${formatTime(entry.end_time)}`
                                    : formatTime(entry.start_time)}
                                </div>
                                <div className="mt-1 flex items-center gap-1">
                                  {entry.end_time ? (
                                    <>
                                      <div className="relative flex items-center justify-center">
                                        <span className="absolute inline-flex h-5 w-5 rounded-full bg-blue-400/40 animate-ping" />
                                        <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-600" />
                                      </div>
                                      <div className="w-16 border-t border-dashed border-gray-300 dark:border-gray-600" />
                                      <div className="relative flex items-center justify-center">
                                        <span className="absolute inline-flex h-5 w-5 rounded-full bg-red-400/40 animate-ping" />
                                        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                                      </div>
                                    </>
                                  ) : (
                                    <div className="relative flex items-center justify-center">
                                      <span className="absolute inline-flex h-5 w-5 rounded-full bg-blue-400/40 animate-ping" />
                                      <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-600" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <a
                                        href={
                                          entry.item_type_id
                                            ? `${baseAdminUrl}?page=yatra&subpage=itinerary&tab=item-types&action=edit&id=${entry.item_type_id}`
                                            : "#"
                                        }
                                        className="focus:outline-none text-blue-600 dark:text-blue-400"
                                        onClick={(e) => {
                                          if (!entry.item_type_id)
                                            e.preventDefault();
                                        }}
                                      >
                                        <Badge
                                          className="text-xs font-medium px-2 py-0.5 hover:underline underline-offset-2"
                                          style={{
                                            backgroundColor:
                                              entry.item_color === "blue"
                                                ? "rgb(219, 234, 254)"
                                                : entry.item_color === "green"
                                                  ? "rgb(220, 252, 231)"
                                                  : entry.item_color ===
                                                      "orange"
                                                    ? "rgb(255, 237, 213)"
                                                    : entry.item_color ===
                                                        "purple"
                                                      ? "rgb(243, 232, 255)"
                                                      : entry.item_color ===
                                                          "red"
                                                        ? "rgb(254, 226, 226)"
                                                        : entry.item_color ===
                                                            "yellow"
                                                          ? "rgb(254, 249, 195)"
                                                          : "rgb(243, 244, 246)",
                                            color:
                                              entry.item_color === "blue"
                                                ? "rgb(29, 78, 216)"
                                                : entry.item_color === "green"
                                                  ? "rgb(21, 128, 61)"
                                                  : entry.item_color ===
                                                      "orange"
                                                    ? "rgb(194, 65, 12)"
                                                    : entry.item_color ===
                                                        "purple"
                                                      ? "rgb(126, 34, 206)"
                                                      : entry.item_color ===
                                                          "red"
                                                        ? "rgb(185, 28, 28)"
                                                        : entry.item_color ===
                                                            "yellow"
                                                          ? "rgb(161, 98, 7)"
                                                          : "rgb(55, 65, 81)",
                                            borderColor:
                                              entry.item_color === "blue"
                                                ? "rgb(147, 197, 253)"
                                                : entry.item_color === "green"
                                                  ? "rgb(134, 239, 172)"
                                                  : entry.item_color ===
                                                      "orange"
                                                    ? "rgb(254, 215, 170)"
                                                    : entry.item_color ===
                                                        "purple"
                                                      ? "rgb(221, 214, 254)"
                                                      : entry.item_color ===
                                                          "red"
                                                        ? "rgb(252, 165, 165)"
                                                        : entry.item_color ===
                                                            "yellow"
                                                          ? "rgb(253, 230, 138)"
                                                          : "rgb(209, 213, 219)",
                                            borderWidth: "1px",
                                            borderStyle: "solid",
                                          }}
                                        >
                                          <div className="flex items-center gap-1.5">
                                            {entry.item_icon_is_image &&
                                            entry.item_icon_image_src ? (
                                              <img
                                                src={entry.item_icon_image_src}
                                                alt=""
                                                className="w-3 h-3 object-contain"
                                              />
                                            ) : (
                                              <IconSelector
                                                iconName={entry.item_icon as any}
                                                provider={
                                                  entry.item_icon_provider ??
                                                  "yatra"
                                                }
                                                className="w-3 h-3"
                                              />
                                            )}
                                            <span>{entry.item_type}</span>
                                          </div>
                                        </Badge>
                                      </a>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <a
                                        href={
                                          entry.item_id
                                            ? `${baseAdminUrl}?page=yatra&subpage=items&action=edit&id=${entry.item_id}`
                                            : "#"
                                        }
                                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 focus:outline-none text-left"
                                        onClick={(e) => {
                                          if (!entry.item_id)
                                            e.preventDefault();
                                        }}
                                      >
                                        {entry.title}
                                      </a>
                                      {getEntryStatusBadge(entry.status)}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                      {entry.description}
                                    </div>
                                    <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
                                      {/* Top row: location / duration / price */}
                                      <div className="flex items-center flex-wrap gap-4">
                                        {entry.location && (
                                          <div className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>{entry.location}</span>
                                          </div>
                                        )}
                                        {entry.duration && (
                                          <div className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{entry.duration}</span>
                                          </div>
                                        )}
                                        {entry.cost && (
                                          <div className="flex items-center gap-1">
                                            <span>{currencySymbol}</span>
                                            <span>
                                              {entry.cost}
                                              {entry.cost_per_person
                                                ? ` / ${__("person", "yatra")}`
                                                : ""}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Bottom row: Includes / Excludes inline text */}
                                      <div>
                                        {(() => {
                                          // Normalize included/excluded items in case they come as JSON strings
                                          let included: string[] = [];
                                          let excluded: string[] = [];

                                          if (
                                            Array.isArray(entry.included_items)
                                          ) {
                                            included = entry.included_items;
                                          } else if (
                                            typeof entry.included_items ===
                                              "string" &&
                                            entry.included_items.trim()
                                          ) {
                                            try {
                                              const parsed = JSON.parse(
                                                entry.included_items as string,
                                              );
                                              if (Array.isArray(parsed))
                                                included = parsed;
                                            } catch {
                                              // Fallback: split by comma
                                              included = (
                                                entry.included_items as string
                                              )
                                                .split(",")
                                                .map((i: string) => i.trim())
                                                .filter(Boolean);
                                            }
                                          }

                                          if (
                                            Array.isArray(entry.excluded_items)
                                          ) {
                                            excluded = entry.excluded_items;
                                          } else if (
                                            typeof entry.excluded_items ===
                                              "string" &&
                                            entry.excluded_items.trim()
                                          ) {
                                            try {
                                              const parsed = JSON.parse(
                                                entry.excluded_items as string,
                                              );
                                              if (Array.isArray(parsed))
                                                excluded = parsed;
                                            } catch {
                                              excluded = (
                                                entry.excluded_items as string
                                              )
                                                .split(",")
                                                .map((i: string) => i.trim())
                                                .filter(Boolean);
                                            }
                                          }

                                          if (
                                            included.length === 0 &&
                                            excluded.length === 0
                                          ) {
                                            return null;
                                          }

                                          return (
                                            <div className="text-gray-500 dark:text-gray-400">
                                              {included.length > 0 && (
                                                <span>
                                                  <span className="font-medium text-green-600 dark:text-green-400">
                                                    {__("Includes", "yatra")}:
                                                  </span>{" "}
                                                  <span>
                                                    {included.join(", ")}
                                                  </span>
                                                </span>
                                              )}
                                              {included.length > 0 &&
                                                excluded.length > 0 && (
                                                  <span>{"  ·  "}</span>
                                                )}
                                              {excluded.length > 0 && (
                                                <span>
                                                  <span className="font-medium text-red-600 dark:text-red-400">
                                                    {__("Excludes", "yatra")}:
                                                  </span>{" "}
                                                  <span>
                                                    {excluded.join(", ")}
                                                  </span>
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 relative z-10">
                                    <SearchableSelect
                                      value={entry.item_id?.toString() || ""}
                                      onChange={(value) => {
                                        if (!value) return;

                                        const selectedItem = itemsData?.find(
                                          (item) =>
                                            item.id.toString() === value,
                                        );

                                        if (
                                          selectedItem &&
                                          entry.item_type_id
                                        ) {
                                          updateItemMutation.mutate({
                                            entryId: entry.id,
                                            itemId: selectedItem.id,
                                            itemTypeId: entry.item_type_id,
                                          });
                                        }
                                      }}
                                      options={(() => {
                                        const itemTypeId = entry.item_type_id;

                                        if (!itemTypeId) return [];

                                        const itemTypeIdNum =
                                          typeof itemTypeId === "string"
                                            ? parseInt(itemTypeId, 10)
                                            : Number(itemTypeId);

                                        if (
                                          !itemTypeIdNum ||
                                          isNaN(itemTypeIdNum)
                                        )
                                          return [];

                                        const filteredItems = itemsData
                                          .filter((item) => {
                                            const typeId = item.type_id;
                                            if (!typeId) return false;
                                            const typeIdNum =
                                              typeof typeId === "string"
                                                ? parseInt(typeId, 10)
                                                : Number(typeId);
                                            const matches =
                                              typeIdNum === itemTypeIdNum;

                                            return matches;
                                          })
                                          .map((item) => ({
                                            value: item.id.toString(),
                                            label: item.name,
                                          }));

                                        return filteredItems;
                                      })()}
                                      placeholder={__(
                                        "Select item...",
                                        "yatra",
                                      )}
                                      searchPlaceholder={__(
                                        "Search items...",
                                        "yatra",
                                      )}
                                      className="min-w-[140px]"
                                      disabled={updateItemMutation.isPending}
                                    />
                                    <ConditionalRender capability="yatra_edit_trips">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(entry)}
                                        className="h-8 w-8"
                                        title={__("Edit Activity", "yatra")}
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                    </ConditionalRender>
                                    <ConditionalRender capability="yatra_delete_trips">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(entry)}
                                        className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                        title={__("Delete", "yatra")}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </ConditionalRender>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Add Activity Button */}
                          <ConditionalRender capability="yatra_edit_trips">
                            <Button
                              variant="outline"
                              className="w-full flex items-center justify-center gap-2 border-2 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/70 shadow-sm transition-colors"
                              style={{ borderColor: "#3b82f6" }}
                              onClick={() => {
                                const tripId = dayGroup.trip_id;
                                const day = dayGroup.day;
                                window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripId}&day=${day}&mode=activity`;
                              }}
                            >
                              <Plus className="w-4 h-4" />
                              {__("Add Activity", "yatra")}
                            </Button>
                          </ConditionalRender>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      </ConditionalRender>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={
          (deleteConfirm.entry as any)?._isDayDeletion
            ? __("Delete Day", "yatra")
            : __("Delete Itinerary Entry", "yatra")
        }
        message={
          (deleteConfirm.entry as any)?._isDayDeletion
            ? __(
                "Are you sure you want to delete this day and all its activities? This action cannot be undone.",
                "yatra",
              )
            : __(
                "Are you sure you want to delete this itinerary entry? This action cannot be undone.",
                "yatra",
              )
        }
        confirmText={__("Delete", "yatra")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Itinerary;
