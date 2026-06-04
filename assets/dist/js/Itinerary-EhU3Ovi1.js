import { r as reactExports, t as useQueryClient, u as useQuery, v as useMutation, j as jsxRuntimeExports, o as CalendarDays, q as MapPin, az as AlertCircle, S as Sparkles, aw as Plus, p as Calendar, bU as UtensilsCrossed, bV as Hotel, aH as MoreVertical, bB as Pencil, aN as Trash2, x as ChevronDown, y as ChevronRight, ar as Clock } from "./react-vendor-zODANjVp.js";
import { g as getCurrencySymbol, u as useToast, _ as __, s as sprintf, a as apiClient } from "./index-zauBMzvd.js";
import { u as usePermissions, j as getErrorContext, x as SearchableSelect, e as Badge, s as ConditionalRender, i as isAiEligible, a as isAiModuleEnabled, B as Button, a2 as BulkActionToolbar, C as Card, d as CardContent, a3 as IconSelector, k as ConfirmationDialog } from "../../admin/dist/js/app.js";
import { B as BuildItineraryModal } from "./BuildItineraryModal-Db1LZgrN.js";
function parseItemTypeIcon(icon, defaultName = "footprints") {
  if (!icon) {
    return { name: defaultName, provider: "yatra", isImage: false };
  }
  if (typeof icon === "string") {
    return { name: icon, provider: "yatra", isImage: false };
  }
  if (typeof icon === "object" && icon !== null && "type" in icon) {
    const o = icon;
    if (o.type === "image" && o.value) {
      return {
        name: "image",
        provider: "yatra",
        isImage: true,
        imageSrc: String(o.value)
      };
    }
    const prov = o.provider === "fa-solid" || o.provider === "fa-regular" ? o.provider : "yatra";
    return {
      name: o.value && String(o.value) || defaultName,
      provider: prov,
      isImage: false
    };
  }
  return { name: defaultName, provider: "yatra", isImage: false };
}
const Itinerary = () => {
  var _a, _b, _c, _d;
  const globalCurrency = ((_a = window.yatraAdmin) == null ? void 0 : _a.currency) || "USD";
  const currencySymbol = getCurrencySymbol(globalCurrency) || "";
  const baseAdminUrl = ((_b = window.yatraAdmin) == null ? void 0 : _b.adminUrl) || "";
  const urlParams = new URLSearchParams(window.location.search);
  const tripIdParam = urlParams.get("trip_id");
  const dayParam = urlParams.get("day");
  const storedTripId = !tripIdParam ? window.localStorage.getItem("yatra_itinerary_selected_trip") || "" : "";
  const [tripFilter, setTripFilter] = reactExports.useState(tripIdParam || storedTripId);
  const [aiModalOpen, setAiModalOpen] = reactExports.useState(false);
  const [expandedDays, setExpandedDays] = reactExports.useState(/* @__PURE__ */ new Set());
  const [selectedEmptyDays, setSelectedEmptyDays] = reactExports.useState(
    /* @__PURE__ */ new Set()
  );
  const [selectedDay, setSelectedDay] = reactExports.useState(null);
  const [deleteConfirm, setDeleteConfirm] = reactExports.useState({
    isOpen: false,
    entry: null
  });
  const [dayMenuOpen, setDayMenuOpen] = reactExports.useState(null);
  const [selectedEntries, setSelectedEntries] = reactExports.useState(
    /* @__PURE__ */ new Set()
  );
  const [bulkAction, setBulkAction] = reactExports.useState("");
  const [showColumnsDropdown, setShowColumnsDropdown] = reactExports.useState(false);
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  reactExports.useEffect(() => {
    if (tripIdParam) {
      setTripFilter(tripIdParam);
    }
  }, [tripIdParam]);
  reactExports.useEffect(() => {
    if (tripFilter) {
      window.localStorage.setItem("yatra_itinerary_selected_trip", tripFilter);
    }
  }, [tripFilter]);
  const [itemTypesData, setItemTypesData] = reactExports.useState([]);
  const [itemsData, setItemsData] = reactExports.useState([]);
  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["trips-with-itinerary-meta"],
    queryFn: async () => {
      var _a2, _b2;
      try {
        const response = await apiClient.get("/trips", {
          params: {
            per_page: 100,
            status: "all",
            // Get all trips for filter
            include_itinerary_meta: 1
            // Include item types and items in meta
          }
        });
        const trips = ((_a2 = response == null ? void 0 : response.data) == null ? void 0 : _a2.data) || (response == null ? void 0 : response.data) || response || [];
        const meta = ((_b2 = response == null ? void 0 : response.data) == null ? void 0 : _b2.meta) || (response == null ? void 0 : response.meta) || {};
        if (meta.available_item_types) {
          setItemTypesData(meta.available_item_types);
        }
        if (meta.available_items) {
          setItemsData(meta.available_items);
        }
        return Array.isArray(trips) ? trips : [];
      } catch (error2) {
        showToast(
          (error2 == null ? void 0 : error2.message) || __("Failed to load trips", "yatra"),
          "error"
        );
        return [];
      }
    },
    enabled: can("yatra_view_trips"),
    staleTime: 2 * 60 * 1e3,
    // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1e3,
    // Keep in cache for 5 minutes
    refetchOnWindowFocus: false
    // Don't refetch when switching tabs
  });
  const mapItemIds = (itemTypeId, itemId) => {
    const itemType = itemTypeId ? itemTypesData.find(
      (type) => {
        var _a2;
        return type.id === itemTypeId || ((_a2 = type.id) == null ? void 0 : _a2.toString()) === (itemTypeId == null ? void 0 : itemTypeId.toString());
      }
    ) : null;
    const item = itemId ? itemsData.find(
      (it) => {
        var _a2;
        return it.id === itemId || ((_a2 = it.id) == null ? void 0 : _a2.toString()) === (itemId == null ? void 0 : itemId.toString());
      }
    ) : null;
    const parsed = parseItemTypeIcon(itemType == null ? void 0 : itemType.icon, "footprints");
    const itemColor = (itemType == null ? void 0 : itemType.color) || "gray";
    if (itemType && item) {
      return {
        item_type: itemType.name || "Activity",
        item_name: item.name || "Activity",
        item_icon: parsed.name,
        item_icon_provider: parsed.provider,
        item_icon_is_image: parsed.isImage,
        item_icon_image_src: parsed.imageSrc,
        item_color: itemColor
      };
    }
    if (itemType) {
      return {
        item_type: itemType.name || "Activity",
        item_name: itemType.name || "Activity",
        item_icon: parsed.name,
        item_icon_provider: parsed.provider,
        item_icon_is_image: parsed.isImage,
        item_icon_image_src: parsed.imageSrc,
        item_color: itemColor
      };
    }
    return {
      item_type: "Activity",
      item_name: "Activity",
      item_icon: "footprints",
      item_icon_provider: "yatra",
      item_icon_is_image: false,
      item_color: "gray"
    };
  };
  const parseTime = (time) => {
    if (!time) return { start_time: "", end_time: "" };
    const timeMatch = time.match(
      /(\d{1,2}):(\d{2})\s*(?:-|to|–)\s*(\d{1,2}):(\d{2})/i
    );
    if (timeMatch) {
      return {
        start_time: `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`,
        end_time: `${timeMatch[3].padStart(2, "0")}:${timeMatch[4]}`
      };
    }
    const singleTime = time.match(/(\d{1,2}):(\d{2})/);
    if (singleTime) {
      return {
        start_time: `${singleTime[1].padStart(2, "0")}:${singleTime[2]}`,
        end_time: ""
      };
    }
    return { start_time: "", end_time: "" };
  };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["itinerary", tripFilter, tripsData],
    queryFn: async () => {
      const trips = Array.isArray(tripsData) ? tripsData : [];
      const allEntries = [];
      const allDays = /* @__PURE__ */ new Map();
      const dayStatuses = /* @__PURE__ */ new Map();
      if (!tripFilter) {
        return [];
      }
      const tripsToFetch = trips.filter(
        (t) => t.id === parseInt(tripFilter)
      );
      for (const trip of tripsToFetch) {
        const urlParams2 = new URLSearchParams(window.location.search);
        if (urlParams2.get("simulate_error") === "true") {
          throw new Error(
            "Simulated API error for testing error UI functionality"
          );
        }
        const itineraryResponse = await apiClient.get("/itinerary", {
          params: {
            trip_id: trip.id,
            _t: Date.now()
            // Cache buster
          }
        });
        const itineraryEntries = Array.isArray(itineraryResponse) ? itineraryResponse : Array.isArray(itineraryResponse == null ? void 0 : itineraryResponse.data) ? itineraryResponse.data : [];
        const entriesByDay = /* @__PURE__ */ new Map();
        const dayInfo = /* @__PURE__ */ new Map();
        for (const entry of itineraryEntries) {
          const dayNumber = entry.day || 1;
          if ((!entry.item_type_id || entry.item_type_id === 0) && (!entry.item_id || entry.item_id === 0)) {
            dayInfo.set(dayNumber, {
              title: entry.day_title || entry.title || "",
              description: entry.day_description || entry.description || "",
              status: entry.status,
              day_id: entry.id
              // Store the day ID from the day entry
            });
          } else {
            if (!entriesByDay.has(dayNumber)) {
              entriesByDay.set(dayNumber, []);
            }
            entriesByDay.get(dayNumber).push(entry);
          }
        }
        const itineraryDays = [];
        for (const [dayNumber, info] of dayInfo) {
          const entries = entriesByDay.get(dayNumber) || [];
          itineraryDays.push({
            id: info.day_id,
            // Day ID from the days table
            day_id: info.day_id,
            // Day ID for Edit/Delete operations
            day: dayNumber,
            day_number: dayNumber,
            day_title: info.title || `Day ${dayNumber}`,
            title: info.title || `Day ${dayNumber}`,
            description: info.description || "",
            entries,
            status: info.status
          });
        }
        for (const [dayNumber, entries] of entriesByDay) {
          if (!dayInfo.has(dayNumber)) {
            itineraryDays.push({
              id: void 0,
              day_id: void 0,
              day: dayNumber,
              day_number: dayNumber,
              day_title: `Day ${dayNumber}`,
              title: `Day ${dayNumber}`,
              description: "",
              entries,
              status: "publish"
            });
          }
        }
        itineraryDays.sort((a, b) => a.day_number - b.day_number);
        for (const day of itineraryDays) {
          const dayNumber = day.day_number || day.day || 1;
          const dayTitle = day.title || day.day_title || "";
          const entries = day.entries || [];
          const dayKey = `${trip.id}-${dayNumber}`;
          for (const entry of entries) {
            if (!entry || !entry.id) {
              continue;
            }
            if ((entry.item_type_id === null || entry.item_type_id === void 0 || entry.item_type_id === 0) && (entry.item_id === null || entry.item_id === void 0 || entry.item_id === 0)) {
              if (entry.status) {
                dayStatuses.set(dayKey, String(entry.status));
              }
              continue;
            }
            const mapped = mapItemIds(entry.item_type_id, entry.item_id);
            const times = entry.start_time ? { start_time: entry.start_time, end_time: entry.end_time || "" } : parseTime(entry.time);
            const processedEntry = {
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
              start_time: times.start_time || "",
              end_time: times.end_time || "",
              cost: typeof entry.cost === "number" || typeof entry.cost === "string" ? String(entry.cost) : void 0,
              cost_per_person: entry.cost_per_person !== void 0 ? !!entry.cost_per_person : void 0,
              included_items: entry.included_items ?? [],
              excluded_items: entry.excluded_items ?? [],
              status: entry.status || "active",
              created_at: entry.created_at || entry.createdAt || "",
              order: Number.isFinite(Number(entry.order)) ? Number(entry.order) : 0,
              time_type: entry.time_type || "exact"
            };
            allEntries.push(processedEntry);
          }
        }
        for (const day of itineraryDays) {
          const dayNumber = day.day_number || day.day || 1;
          const dayTitle = day.title || day.day_title || "";
          const dayId = day.id || day.day_id || void 0;
          const dayKey = `${trip.id}-${dayNumber}`;
          if (!allDays.has(dayKey)) {
            allDays.set(dayKey, {
              trip_id: trip.id,
              trip_title: trip.title || trip.name || "",
              day: dayNumber,
              day_title: dayTitle,
              day_id: dayId,
              day_status: dayStatuses.get(dayKey)
            });
          }
        }
      }
      const grouped = [];
      const seen = /* @__PURE__ */ new Set();
      allDays.forEach(
        (dayInfo, key) => {
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
                (e) => e.trip_id === dayInfo.trip_id && e.day === dayInfo.day
              )
            });
          }
        }
      );
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
              (e) => e.trip_id === entry.trip_id && e.day === entry.day
            )
          });
        }
      });
      grouped.sort((a, b) => {
        if (a.trip_id !== b.trip_id) return a.trip_id - b.trip_id;
        return a.day - b.day;
      });
      for (const dg of grouped) {
        dg.entries.sort((a, b) => {
          const oa = Number.isFinite(Number(a.order)) ? Number(a.order) : 0;
          const ob = Number.isFinite(Number(b.order)) ? Number(b.order) : 0;
          if (oa !== ob) return oa - ob;
          return a.id - b.id;
        });
      }
      return grouped;
    },
    enabled: can("yatra_view_trips") && !!tripsData && !!tripFilter,
    staleTime: 0,
    // Always refetch to ensure fresh data
    gcTime: 0,
    // Don't cache to ensure fresh data (formerly cacheTime)
    refetchOnMount: true,
    // Always refetch when component mounts
    refetchOnWindowFocus: true,
    // Refetch when window regains focus
    refetchOnReconnect: true
    // Refetch when network reconnects
  });
  reactExports.useEffect(() => {
    if (data && data.length > 0 && expandedDays.size === 0) {
      if (dayParam && tripIdParam) {
        const dayNumber = parseInt(dayParam);
        const tripId = parseInt(tripIdParam);
        const targetDay = data.find(
          (dg) => dg.trip_id === tripId && dg.day === dayNumber
        );
        if (targetDay) {
          const dayKey = `${tripId}-${dayNumber}`;
          setExpandedDays(/* @__PURE__ */ new Set([dayKey]));
          setSelectedDay({ tripId, day: dayNumber });
          setTimeout(() => {
            const dayElement = document.querySelector(
              `[data-day-key="${dayKey}"]`
            );
            if (dayElement) {
              dayElement.scrollIntoView({
                behavior: "smooth",
                block: "center"
              });
            }
          }, 300);
        } else {
          const firstDay = data[0];
          setExpandedDays(/* @__PURE__ */ new Set([`${firstDay.trip_id}-${firstDay.day}`]));
        }
      } else {
        const firstDay = data[0];
        setExpandedDays(/* @__PURE__ */ new Set([`${firstDay.trip_id}-${firstDay.day}`]));
      }
    }
  }, [data, dayParam, tripIdParam]);
  const bulkDeleteMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await apiClient.delete("/itinerary", {
        data: { ids: payload.ids, day_ids: payload.day_ids }
      });
      return (response == null ? void 0 : response.data) || response;
    },
    onSuccess: (data2) => {
      const deleted = (data2 == null ? void 0 : data2.deleted) || 0;
      const failed = (data2 == null ? void 0 : data2.failed) || 0;
      if (deleted > 0) {
        showToast(
          failed > 0 ? sprintf(
            __(
              "%1$d item(s) deleted successfully. %2$d item(s) failed to delete.",
              "yatra"
            ),
            deleted,
            failed
          ) : sprintf(
            __("%d item(s) deleted successfully.", "yatra"),
            deleted
          ),
          "success"
        );
      } else {
        showToast(
          __("Failed to delete items. Please try again.", "yatra"),
          "error"
        );
      }
      setSelectedEntries(/* @__PURE__ */ new Set());
      setSelectedEmptyDays(/* @__PURE__ */ new Set());
      queryClient.invalidateQueries({ queryKey: ["itinerary"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips-simple"] });
      refetch();
    },
    onError: (error2) => {
      showToast(
        (error2 == null ? void 0 : error2.message) || __("Failed to delete items. Please try again.", "yatra"),
        "error"
      );
    }
  });
  const deleteMutation = useMutation({
    mutationFn: async (entry) => {
      try {
        const isDayEntry = !entry.item_type_id || entry.item_type_id === 0;
        const mode = isDayEntry ? "day" : "activity";
        const response = await apiClient.delete(
          `/itinerary/${entry.id}?mode=${mode}`
        );
        return { response: (response == null ? void 0 : response.data) || response, entry };
      } catch (error2) {
        throw error2;
      }
    },
    onSuccess: (data2) => {
      const entry = data2.entry;
      const isDayDeletion = entry == null ? void 0 : entry._isDayDeletion;
      showToast(
        isDayDeletion ? __("Day and all activities deleted successfully", "yatra") : __("Itinerary entry deleted successfully", "yatra"),
        "success"
      );
      setDeleteConfirm({ isOpen: false, entry: null });
      queryClient.invalidateQueries({ queryKey: ["itinerary"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips-simple"] });
      refetch();
    },
    onError: (error2) => {
      showToast(
        (error2 == null ? void 0 : error2.message) || __("Failed to delete itinerary entry", "yatra"),
        "error"
      );
    }
  });
  const updateItemMutation = useMutation({
    mutationFn: async ({
      entryId,
      itemId,
      itemTypeId
    }) => {
      var _a2;
      const currentEntry = await apiClient.get(
        `/itinerary/${entryId}?mode=activity`
      );
      const entryData = ((_a2 = currentEntry == null ? void 0 : currentEntry.data) == null ? void 0 : _a2.data) || (currentEntry == null ? void 0 : currentEntry.data) || currentEntry;
      return await apiClient.put(`/itinerary/${entryId}?mode=activity`, {
        ...entryData,
        item_id: itemId,
        item_type_id: itemTypeId
      });
    },
    onSuccess: () => {
      showToast(__("Item updated successfully", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["itinerary"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips-simple"] });
      refetch();
    },
    onError: (error2) => {
      showToast(
        (error2 == null ? void 0 : error2.message) || __("Failed to update item", "yatra"),
        "error"
      );
    }
  });
  const handleAddDay = () => {
    var _a2, _b2;
    if (tripFilter) {
      const tripEntries = dayGroups.filter(
        (dg) => dg.trip_id === parseInt(tripFilter)
      );
      const maxDay = tripEntries.length > 0 ? Math.max(...tripEntries.map((dg) => dg.day)) : 0;
      const nextDay = maxDay + 1;
      window.location.href = `${((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripFilter}&day=${nextDay}&mode=day`;
    } else {
      window.location.href = `${((_b2 = window.yatraAdmin) == null ? void 0 : _b2.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&mode=day`;
    }
  };
  const quickAddOptions = reactExports.useMemo(() => {
    const itemTypes = Array.isArray(itemTypesData) ? itemTypesData : [];
    return itemTypes.map((itemType) => {
      const parsed = parseItemTypeIcon(itemType.icon, "footprints");
      const color = itemType.color || "blue";
      return {
        typeId: itemType.id,
        typeName: itemType.name || "",
        typeIcon: parsed.name,
        typeIconProvider: parsed.provider,
        typeIconImageSrc: parsed.isImage ? parsed.imageSrc : void 0,
        typeIconData: itemType.icon,
        typeColor: color
      };
    }).filter((option) => option.typeName);
  }, [itemTypesData]);
  const handleQuickAdd = (typeId) => {
    var _a2;
    if (!selectedDay) {
      const firstDay = data == null ? void 0 : data[0];
      if (firstDay) {
        setSelectedDay({ tripId: firstDay.trip_id, day: firstDay.day });
        const key = `${firstDay.trip_id}-${firstDay.day}`;
        setExpandedDays(/* @__PURE__ */ new Set([key]));
      }
    }
    const tripId = (selectedDay == null ? void 0 : selectedDay.tripId) || (tripFilter ? parseInt(tripFilter) : 1);
    const day = (selectedDay == null ? void 0 : selectedDay.day) || 1;
    window.location.href = `${((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripId}&day=${day}&type_id=${typeId}`;
  };
  const handleEdit = (entry) => {
    var _a2;
    const isDayEntry = !entry.item_type_id || entry.item_type_id === 0;
    const mode = isDayEntry ? "day" : "activity";
    window.location.href = `${((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=edit&id=${entry.id}&mode=${mode}`;
  };
  const handleEditDay = async (tripId, day) => {
    var _a2, _b2;
    const redirectToCreate = () => {
      var _a3;
      window.location.href = `${((_a3 = window.yatraAdmin) == null ? void 0 : _a3.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripId}&day=${day}&mode=day`;
    };
    const redirectToEdit = (entryId) => {
      var _a3;
      const params = new URLSearchParams({
        action: "edit",
        id: entryId.toString(),
        mode: "day",
        trip_id: tripId.toString(),
        day: day.toString()
      });
      window.location.href = `${((_a3 = window.yatraAdmin) == null ? void 0 : _a3.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&${params.toString()}`;
    };
    const dayGroup = dayGroups.find(
      (dg) => dg.trip_id === tripId && dg.day === day
    );
    if (!dayGroup) {
      redirectToCreate();
      setDayMenuOpen(null);
      return;
    }
    if (dayGroup.day_id) {
      try {
        const response = await apiClient.get(
          `/itinerary/day-entry-by-day-id/${dayGroup.day_id}`
        );
        const dayEntryId = ((_a2 = response == null ? void 0 : response.data) == null ? void 0 : _a2.day_entry_id) || (response == null ? void 0 : response.day_entry_id) || ((_b2 = response == null ? void 0 : response.data) == null ? void 0 : _b2.id) || (response == null ? void 0 : response.id) || null;
        if (dayEntryId) {
          redirectToEdit(dayEntryId);
          setDayMenuOpen(null);
          return;
        }
      } catch (error2) {
        console.error(
          "[YATRA DEBUG] Failed to fetch day entry for editing:",
          error2
        );
      }
    }
    if (dayGroup.entries.length > 0) {
      const dayEntry = dayGroup.entries.find((entry) => {
        const isDayEntry = (entry.item_type_id === null || entry.item_type_id === void 0 || entry.item_type_id === 0) && (entry.item_id === null || entry.item_id === void 0 || entry.item_id === 0);
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
  const handleDeleteDay = async (tripId, day) => {
    var _a2, _b2;
    const dayGroup = dayGroups.find(
      (dg) => dg.trip_id === tripId && dg.day === day
    );
    if (!dayGroup) {
      showToast(__("Day not found", "yatra"), "error");
      setDayMenuOpen(null);
      return;
    }
    if (dayGroup.day_id) {
      try {
        const response = await apiClient.get(
          `/itinerary/day-entry-by-day-id/${dayGroup.day_id}`
        );
        const dayEntryId = ((_a2 = response == null ? void 0 : response.data) == null ? void 0 : _a2.day_entry_id) || (response == null ? void 0 : response.day_entry_id) || ((_b2 = response == null ? void 0 : response.data) == null ? void 0 : _b2.id) || (response == null ? void 0 : response.id) || null;
        if (dayEntryId) {
          const dayEntryForDeletion = {
            id: dayEntryId,
            trip_id: tripId,
            day,
            _isDayDeletion: true,
            _dayNumber: day
          };
          setDeleteConfirm({ isOpen: true, entry: dayEntryForDeletion });
        } else {
          showToast(__("Day entry not found", "yatra"), "error");
        }
      } catch (error2) {
        showToast(__("Failed to fetch day entry", "yatra"), "error");
      }
    } else {
      showToast(__("Day ID not available", "yatra"), "error");
    }
    setDayMenuOpen(null);
  };
  const handleDelete = (entry) => {
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
  const handleToggleSelect = (entryId) => {
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
  const handleSelectAll = (dayGroup) => {
    const allEntryIds2 = dayGroup.entries.map((e) => e.id);
    setSelectedEntries((prev) => {
      const newSet = new Set(prev);
      const allSelected = allEntryIds2.every((id) => newSet.has(id));
      if (allSelected) {
        allEntryIds2.forEach((id) => newSet.delete(id));
      } else {
        allEntryIds2.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };
  const handleSelectAllDays = () => {
    const allEntryIds2 = filteredDayGroups.flatMap(
      (dg) => dg.entries.map((e) => e.id)
    );
    const emptyDayKeys = filteredDayGroups.filter((dg) => dg.entries.length === 0).map((dg) => `${dg.trip_id}-${dg.day}`);
    setSelectedEntries((prev) => {
      const newSet = new Set(prev);
      const allSelected = allEntryIds2.length > 0 && allEntryIds2.every((id) => newSet.has(id));
      if (allSelected) {
        allEntryIds2.forEach((id) => newSet.delete(id));
      } else {
        allEntryIds2.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
    setSelectedEmptyDays((prev) => {
      const allSelected = emptyDayKeys.length > 0 && emptyDayKeys.every((key) => prev.has(key));
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
    const selectedDayKeysFromEntries = /* @__PURE__ */ new Set();
    filteredDayGroups.forEach((dg) => {
      const hasSelectedEntry = dg.entries.some(
        (e) => selectedEntries.has(e.id)
      );
      if (hasSelectedEntry) {
        selectedDayKeysFromEntries.add(`${dg.trip_id}-${dg.day}`);
      }
    });
    const combinedDayKeys = /* @__PURE__ */ new Set([
      ...emptyDayKeys,
      ...selectedDayKeysFromEntries
    ]);
    if (!bulkAction || ids.length === 0 && combinedDayKeys.size === 0) {
      showToast(
        __("Please select entries or days and a bulk action first.", "yatra"),
        "error"
      );
      return;
    }
    const resolveDayEntryIds = async (keys) => {
      var _a2, _b2;
      const dayEntryIds2 = [];
      for (const key of keys) {
        const [tripIdStr, dayStr] = key.split("-");
        const tripIdNum = parseInt(tripIdStr, 10);
        const dayNum = parseInt(dayStr, 10);
        if (Number.isNaN(tripIdNum) || Number.isNaN(dayNum)) {
          continue;
        }
        const dg = dayGroups.find(
          (g) => g.trip_id === tripIdNum && g.day === dayNum
        );
        if (!dg || !dg.day_id) {
          continue;
        }
        try {
          const response = await apiClient.get(
            `/itinerary/day-entry-by-day-id/${dg.day_id}`
          );
          const dayEntryId = ((_a2 = response == null ? void 0 : response.data) == null ? void 0 : _a2.day_entry_id) || (response == null ? void 0 : response.day_entry_id) || ((_b2 = response == null ? void 0 : response.data) == null ? void 0 : _b2.id) || (response == null ? void 0 : response.id) || null;
          if (dayEntryId) {
            dayEntryIds2.push(Number(dayEntryId));
          }
        } catch (error2) {
          console.error("Failed to resolve day entry ID for day", key, error2);
        }
      }
      return dayEntryIds2;
    };
    if (bulkAction === "delete") {
      const fullDayKeys = new Set(emptyDayKeys);
      const activityIdsToDelete = [];
      filteredDayGroups.forEach((dg) => {
        const selectedInDay = dg.entries.filter(
          (e) => selectedEntries.has(e.id)
        );
        if (selectedInDay.length === 0) {
          return;
        }
        if (dg.entries.length > 0 && selectedInDay.length === dg.entries.length) {
          fullDayKeys.add(`${dg.trip_id}-${dg.day}`);
        } else {
          for (const e of selectedInDay) {
            activityIdsToDelete.push(e.id);
          }
        }
      });
      const dayIdsToDelete = await resolveDayEntryIds(fullDayKeys);
      if (activityIdsToDelete.length === 0 && dayIdsToDelete.length === 0) {
        showToast(
          __("No valid entries or days found to apply this action.", "yatra"),
          "error"
        );
        return;
      }
      bulkDeleteMutation.mutate({
        ids: activityIdsToDelete,
        day_ids: dayIdsToDelete
      });
      return;
    }
    const dayEntryIds = await resolveDayEntryIds(combinedDayKeys);
    const allIdsForAction = [...ids, ...dayEntryIds];
    if (allIdsForAction.length === 0) {
      showToast(
        __("No valid entries or days found to apply this action.", "yatra"),
        "error"
      );
      return;
    }
    const targetStatus = (() => {
      if (bulkAction === "publish") return "published";
      if (bulkAction === "draft") return "draft";
      if (bulkAction === "trash") return "trash";
      if (bulkAction === "restore") return "draft";
      return "";
    })();
    if (!targetStatus) {
      return;
    }
    try {
      await Promise.all(
        allIdsForAction.map(async (id) => {
          var _a2;
          let current;
          let mode = "activity";
          try {
            current = await apiClient.get(`/itinerary/${id}?mode=activity`);
          } catch (error2) {
            mode = "day";
            current = await apiClient.get(`/itinerary/${id}?mode=day`);
          }
          const entryData = ((_a2 = current == null ? void 0 : current.data) == null ? void 0 : _a2.data) || (current == null ? void 0 : current.data) || current;
          await apiClient.put(`/itinerary/${id}?mode=${mode}`, {
            ...entryData,
            status: targetStatus
          });
        })
      );
      showToast(__("Bulk action applied successfully.", "yatra"), "success");
      setSelectedEntries(/* @__PURE__ */ new Set());
      setSelectedEmptyDays(/* @__PURE__ */ new Set());
      setBulkAction("");
      queryClient.invalidateQueries({ queryKey: ["itinerary"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips-simple"] });
      refetch();
    } catch (error2) {
      showToast(
        (error2 == null ? void 0 : error2.message) || __("Failed to apply bulk action. Please try again.", "yatra"),
        "error"
      );
    }
  };
  const toggleDay = (tripId, day) => {
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
  const getItemCounts = (entries) => {
    const meals = entries.filter((e) => e.item_type === "Meal").length;
    const activities = entries.filter((e) => e.item_type === "Activity").length;
    const accommodations = entries.filter(
      (e) => e.item_type === "Accommodation"
    ).length;
    return { meals, activities, accommodations, total: entries.length };
  };
  const getDayStatusBadge = (dayGroup) => {
    const normalize = (value) => (value || "").toLowerCase();
    const explicitStatus = normalize(dayGroup.day_status);
    let label = "";
    let className = "";
    if (explicitStatus === "publish") {
      label = __("Published", "yatra");
      className = "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
    } else if (explicitStatus === "draft") {
      label = __("Draft", "yatra");
      className = "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    } else if (explicitStatus === "trash") {
      label = __("Trash", "yatra");
      className = "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    } else {
      const statuses = dayGroup.entries.map((e) => normalize(e.status));
      const hasPublished = statuses.some((s) => s === "publish");
      const hasDraft = statuses.some((s) => s === "draft");
      const hasTrash = statuses.some((s) => s === "trash");
      if (hasPublished) {
        label = __("Published", "yatra");
        className = "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      } else if (hasDraft) {
        label = __("Draft", "yatra");
        className = "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
      } else if (hasTrash) {
        label = __("Trash", "yatra");
        className = "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      } else {
        label = __("No Status", "yatra");
        className = "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
      }
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `ml-2 text-[11px] px-2 py-0.5 ${className}`, children: label });
  };
  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  const getEntryStatusBadge = (status) => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "publish" || normalized === "published") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-2 text-[11px] px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800", children: __("Published", "yatra") });
    }
    if (normalized === "draft") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-2 text-[11px] px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600", children: __("Draft", "yatra") });
    }
    if (normalized === "trash") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-2 text-[11px] px-2 py-0.5 bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-400 dark:border-gray-700", children: __("Trash", "yatra") });
    }
    return null;
  };
  const dayGroups = data || [];
  const errorContext = getErrorContext(error);
  const apiErrorMessage = (data == null ? void 0 : data.error) || (data == null ? void 0 : data.message);
  const derivedErrorDetails = errorContext.details || (apiErrorMessage ? String(apiErrorMessage) : void 0) || (error ? String((error == null ? void 0 : error.message) || error) : void 0);
  const queryEnabled = can("yatra_view_trips") && !!tripsData && !!tripFilter;
  const isItineraryError = queryEnabled && (!!error || !!apiErrorMessage);
  const matchesStatusValue = (statusValue, filter) => {
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
    return true;
  };
  const matchesStatusFilter = (entry, filter) => {
    return matchesStatusValue(entry.status, filter);
  };
  const matchesStatusFilterForDay = (dayGroup, filter) => {
    if (!filter || filter === "all") {
      return true;
    }
    if (matchesStatusValue(dayGroup.day_status, filter)) {
      return true;
    }
    return dayGroup.entries.some((entry) => matchesStatusFilter(entry, filter));
  };
  const filteredDayGroups = reactExports.useMemo(() => {
    const groupsWithFilteredEntries = dayGroups.map((dg) => ({
      ...dg,
      entries: dg.entries.filter(
        (entry) => matchesStatusFilter(entry, statusFilter)
      )
    }));
    if (!statusFilter || statusFilter === "all") {
      return groupsWithFilteredEntries;
    }
    return groupsWithFilteredEntries.filter(
      (dg) => matchesStatusFilterForDay(dg, statusFilter)
    );
  }, [dayGroups, statusFilter]);
  const totalEntries = filteredDayGroups.reduce(
    (acc, dg) => acc + dg.entries.length,
    0
  );
  const totalEmptyDays = filteredDayGroups.filter(
    (dg) => dg.entries.length === 0
  ).length;
  const totalSelectableItems = totalEntries + totalEmptyDays;
  const allEntryIds = filteredDayGroups.flatMap(
    (dg) => dg.entries.map((e) => e.id)
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
    { publish: 0, draft: 0, trash: 0 }
  );
  const statusOptions = [
    { key: "all", label: __("All", "yatra"), count: dayGroups.length },
    {
      key: "publish",
      label: __("Published", "yatra"),
      count: statusCounts.publish
    },
    { key: "draft", label: __("Draft", "yatra"), count: statusCounts.draft },
    { key: "trash", label: __("Trash", "yatra"), count: statusCounts.trash }
  ];
  const bulkActionOptions = reactExports.useMemo(() => {
    if (statusFilter === "trash") {
      return [
        { value: "restore", label: __("Restore to Draft", "yatra") },
        { value: "delete", label: __("Delete Permanently", "yatra") }
      ];
    }
    return [
      { value: "publish", label: __("Mark as Published", "yatra") },
      { value: "draft", label: __("Mark as Draft", "yatra") },
      { value: "trash", label: __("Move to Trash", "yatra") },
      { value: "delete", label: __("Delete Permanently", "yatra") }
    ];
  }, [statusFilter]);
  reactExports.useEffect(() => {
    const handleClickOutside = () => {
      setDayMenuOpen(null);
    };
    if (dayMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [dayMenuOpen]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 pb-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __(
      "Build your complete itinerary with activities, meals, and accommodations",
      "yatra"
    ) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-r from-blue-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-gray-700 p-6 mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between gap-4 mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Select Trip", "yatra") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: __(
          "Choose a trip to manage its itinerary entries and day-by-day schedule",
          "yatra"
        ) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 overflow-visible", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
            __("Trip", "yatra"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SearchableSelect,
            {
              value: tripFilter,
              onChange: (value) => setTripFilter(value),
              options: (Array.isArray(tripsData) ? tripsData : []).map(
                (trip) => ({
                  value: trip.id.toString(),
                  label: `${trip.title || trip.name || ""}${trip.trip_type === "single_day" ? __(" (Single Day)", "yatra") : trip.trip_type === "multi_day" ? __(" (Multi-Day)", "yatra") : ""}`
                })
              ) || [],
              placeholder: __("Search or select a trip...", "yatra"),
              searchPlaceholder: __("Search by trip name or ID...", "yatra"),
              className: "w-full",
              required: true
            }
          )
        ] }),
        tripFilter && (() => {
          const tripsList = Array.isArray(tripsData) ? tripsData : [];
          const selectedTrip = tripsList.find(
            (t) => t.id.toString() === tripFilter
          );
          return selectedTrip ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 pt-2 border-t border-blue-200 dark:border-gray-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-4 h-4 text-blue-600 dark:text-blue-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: selectedTrip.starting_location || selectedTrip.start_location || "N/A" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-400", children: "→" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: selectedTrip.ending_location || selectedTrip.end_location || "N/A" })
            ] }),
            selectedTrip.trip_type && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                className: selectedTrip.trip_type === "single_day" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
                children: selectedTrip.trip_type === "single_day" ? __("Single Day", "yatra") : __("Multi-Day", "yatra")
              }
            )
          ] }) : null;
        })(),
        !tripFilter && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200/50 dark:border-gray-700/50 overflow-visible", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4 text-blue-600 dark:text-blue-400" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white mb-1", children: __("Get Started", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __(
              "Select a trip from the dropdown above to view and manage its itinerary entries and day-by-day schedule.",
              "yatra"
            ) })
          ] })
        ] }) })
      ] })
    ] }),
    tripFilter && (() => {
      const selectedTrip = tripsData == null ? void 0 : tripsData.find(
        (t) => t.id.toString() === tripFilter
      );
      const isSingleDay = (selectedTrip == null ? void 0 : selectedTrip.trip_type) === "single_day";
      const buttonLabel = isSingleDay ? __("Add Entry", "yatra") : __("Add Day", "yatra");
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-3 flex flex-wrap items-center justify-end gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(ConditionalRender, { capability: "yatra_edit_trips", children: [
        !isSingleDay && isAiEligible() && isAiModuleEnabled() && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            onClick: () => setAiModalOpen(true),
            className: "mr-1 inline-flex items-center gap-2 whitespace-nowrap bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 hover:from-blue-700 hover:to-blue-800",
            title: __(
              "Generate a day-by-day itinerary using AI, grounded in this trip's facts.",
              "yatra"
            ),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __("Build with AI", "yatra") })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: handleAddDay,
            className: "inline-flex items-center gap-2 whitespace-nowrap bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: buttonLabel })
            ]
          }
        )
      ] }) });
    })(),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_view_trips", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        BulkActionToolbar,
        {
          selectedIds: [
            ...Array.from(selectedEntries),
            ...Array.from(selectedEmptyDays)
          ],
          bulkAction,
          setBulkAction,
          onApply: handleBulkApply,
          onClearSelection: () => {
            setSelectedEntries(/* @__PURE__ */ new Set());
            setSelectedEmptyDays(/* @__PURE__ */ new Set());
          },
          statusFilter,
          setStatusFilter,
          statusOptions,
          showColumnsDropdown,
          setShowColumnsDropdown,
          columnOptions: [],
          onToggleColumn: () => {
          },
          bulkMutationPending: bulkDeleteMutation.isPending,
          totalItems: totalSelectableItems,
          bulkActionOptions
        }
      ),
      isItineraryError ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-5 h-5 text-red-600 dark:text-red-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: __("Error Loading Itinerary", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __(
              "We couldn't connect to the itinerary service. Please refresh or try again shortly.",
              "We couldn't connect to the itinerary service. Please refresh or try again shortly."
            ) })
          ] })
        ] }),
        derivedErrorDetails && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 dark:bg-gray-800 rounded-lg p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("Error Details", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => {
                  const details = JSON.stringify(
                    {
                      error: derivedErrorDetails,
                      request: errorContext.requestInfo
                    },
                    null,
                    2
                  );
                  navigator.clipboard.writeText(details);
                  showToast(
                    __("Error details copied to clipboard", "yatra"),
                    "success"
                  );
                },
                className: "text-xs text-blue-600 dark:text-blue-400 hover:underline",
                children: __("Copy", "yatra")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-900 p-2 rounded border", children: derivedErrorDetails }),
            errorContext.requestInfo && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-600 dark:text-gray-400 space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                  __("Request", "yatra"),
                  ":"
                ] }),
                " ",
                errorContext.requestInfo.method,
                " ",
                errorContext.requestInfo.url
              ] }),
              errorContext.requestInfo.payload && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                  __("Payload", "yatra"),
                  ":"
                ] }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded overflow-auto max-h-20", children: JSON.stringify(
                  errorContext.requestInfo.payload,
                  null,
                  2
                ) })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => refetch(),
              variant: "outline",
              className: "flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                __("Retry", "yatra")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: () => window.location.reload(),
              variant: "ghost",
              className: "text-gray-600 dark:text-gray-400",
              children: __("Refresh Page", "yatra")
            }
          )
        ] })
      ] }) }) }) : isLoading || isLoadingTrips ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-4 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" })
        ] })
      ] }) }) }) }, i)) }) : filteredDayGroups.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-8 h-8 text-gray-400" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: (() => {
            const selectedTrip = tripsData == null ? void 0 : tripsData.find(
              (t) => t.id.toString() === tripFilter
            );
            const isSingleDay = (selectedTrip == null ? void 0 : selectedTrip.trip_type) === "single_day";
            return isSingleDay ? __("No itinerary entries yet", "yatra") : __("No itinerary days yet", "yatra");
          })() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md", children: (() => {
            const selectedTrip = tripsData == null ? void 0 : tripsData.find(
              (t) => t.id.toString() === tripFilter
            );
            const isSingleDay = (selectedTrip == null ? void 0 : selectedTrip.trip_type) === "single_day";
            return isSingleDay ? __(
              "Start building your itinerary by adding your first entry to create a detailed schedule for your trip.",
              "yatra"
            ) : __(
              "Start building your itinerary by adding your first day to organize your trip schedule.",
              "yatra"
            );
          })() }),
          can("yatra_edit_trips") && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handleAddDay,
              className: "flex items-center gap-2 mx-auto",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                (() => {
                  const selectedTrip = tripsData == null ? void 0 : tripsData.find(
                    (t) => t.id.toString() === tripFilter
                  );
                  const isSingleDay = (selectedTrip == null ? void 0 : selectedTrip.trip_type) === "single_day";
                  return isSingleDay ? __("Add Your First Entry", "yatra") : __("Add Your First Day", "yatra");
                })()
              ]
            }
          )
        ] })
      ] }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        filteredDayGroups.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_delete_trips", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-visible", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 rounded-t-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: allEntryIds.length > 0 && allEntryIds.every((id) => selectedEntries.has(id)),
                onChange: handleSelectAllDays,
                className: "w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer", children: __("Select All", "yatra") }),
            selectedEntries.size > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: [
              "(",
              selectedEntries.size,
              " ",
              __("selected", "yatra"),
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "hover:text-gray-700 dark:hover:text-gray-200 underline-offset-2 hover:underline",
                onClick: () => {
                  const allKeys = filteredDayGroups.map(
                    (dg) => `${dg.trip_id}-${dg.day}`
                  );
                  setExpandedDays(new Set(allKeys));
                },
                children: __("Expand all", "yatra")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "hover:text-gray-700 dark:hover:text-gray-200 underline-offset-2 hover:underline",
                onClick: () => {
                  setExpandedDays(/* @__PURE__ */ new Set());
                },
                children: __("Collapse all", "yatra")
              }
            )
          ] })
        ] }) }) }) }),
        filteredDayGroups.map((dayGroup) => {
          const key = `${dayGroup.trip_id}-${dayGroup.day}`;
          const isExpanded = expandedDays.has(key);
          const counts = getItemCounts(dayGroup.entries);
          const sortedEntries = [...dayGroup.entries].sort((a, b) => {
            const orderA = typeof a.order === "number" ? a.order : 0;
            const orderB = typeof b.order === "number" ? b.order : 0;
            if (orderA !== orderB) return orderA - orderB;
            return a.id - b.id;
          });
          const tripsList = Array.isArray(tripsData) ? tripsData : [];
          const selectedTripForLayout = tripsList.find(
            (t) => t.id.toString() === tripFilter
          );
          const isSingleDayTrip = (selectedTripForLayout == null ? void 0 : selectedTripForLayout.trip_type) === "single_day";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-day-key": key,
              className: "bg-gradient-to-r from-blue-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-gray-700 mb-4 overflow-visible",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 px-4 py-3 rounded-t-lg", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_delete_trips", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: dayGroup.entries.length === 0 ? selectedEmptyDays.has(key) : dayGroup.entries.every(
                        (e) => selectedEntries.has(e.id)
                      ),
                      onChange: (e) => {
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
                      },
                      onClick: (e) => e.stopPropagation(),
                      className: "w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer",
                      title: __("Select all entries for this day", "yatra")
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "flex items-center gap-4 flex-1 cursor-pointer",
                      onClick: () => toggleDay(dayGroup.trip_id, dayGroup.day),
                      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-medium", children: [
                          isSingleDayTrip ? __("Entry", "yatra") : __("Day", "yatra"),
                          " ",
                          dayGroup.day
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white flex items-center", children: [
                            dayGroup.day_title ? `${isSingleDayTrip ? __("Entry", "yatra") : __("Day", "yatra")} ${dayGroup.day}: ${dayGroup.day_title}` : `${isSingleDayTrip ? __("Entry", "yatra") : __("Day", "yatra")} ${dayGroup.day}`,
                            getDayStatusBadge(dayGroup)
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                              counts.total,
                              " ",
                              __("items", "yatra")
                            ] }),
                            counts.meals > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(UtensilsCrossed, { className: "w-3.5 h-3.5" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: counts.meals })
                            ] }),
                            counts.activities > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-3.5 h-3.5" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: counts.activities })
                            ] }),
                            counts.accommodations > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Hotel, { className: "w-3.5 h-3.5" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: __("Stay", "yatra") })
                            ] })
                          ] })
                        ] })
                      ] })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "flex items-center gap-2 relative cursor-pointer",
                      onClick: (e) => {
                        e.stopPropagation();
                        toggleDay(dayGroup.trip_id, dayGroup.day);
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_edit_trips", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Button,
                            {
                              variant: "ghost",
                              size: "icon",
                              className: "h-8 w-8",
                              onClick: (e) => {
                                e.stopPropagation();
                                if (dayMenuOpen && dayMenuOpen.tripId === dayGroup.trip_id && dayMenuOpen.day === dayGroup.day) {
                                  setDayMenuOpen(null);
                                } else {
                                  setDayMenuOpen({
                                    tripId: dayGroup.trip_id,
                                    day: dayGroup.day
                                  });
                                }
                              },
                              title: __("Day Options", "yatra"),
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(MoreVertical, { className: "w-4 h-4" })
                            }
                          ),
                          dayMenuOpen && dayMenuOpen.tripId === dayGroup.trip_id && dayMenuOpen.day === dayGroup.day && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "div",
                            {
                              className: "absolute right-0 top-10 z-50 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1",
                              onClick: (e) => e.stopPropagation(),
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                  "button",
                                  {
                                    onClick: () => handleEditDay(
                                      dayGroup.trip_id,
                                      dayGroup.day
                                    ),
                                    className: "w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2",
                                    children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "w-4 h-4" }),
                                      isSingleDayTrip ? __("Edit Entry", "yatra") : __("Edit Day", "yatra")
                                    ]
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_delete_trips", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                  "button",
                                  {
                                    onClick: () => handleDeleteDay(
                                      dayGroup.trip_id,
                                      dayGroup.day
                                    ),
                                    className: "w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2",
                                    children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }),
                                      isSingleDayTrip ? __("Delete Entry", "yatra") : __("Delete Day", "yatra")
                                    ]
                                  }
                                ) })
                              ]
                            }
                          )
                        ] }) }),
                        isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-5 h-5 text-gray-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-5 h-5 text-gray-400" })
                      ]
                    }
                  )
                ] }),
                isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-gray-200 dark:border-gray-700 overflow-visible", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide", children: __("QUICK ADD", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: quickAddOptions.length > 0 ? quickAddOptions.map((option) => {
                      const colorClasses = {
                        blue: "border-blue-500 text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20",
                        green: "border-green-500 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20",
                        red: "border-red-500 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20",
                        yellow: "border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20",
                        purple: "border-purple-500 text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20",
                        orange: "border-orange-500 text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20",
                        pink: "border-pink-500 text-pink-700 hover:bg-pink-50 dark:text-pink-400 dark:hover:bg-pink-900/20",
                        indigo: "border-indigo-500 text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20",
                        gray: "border-gray-500 text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900/20"
                      };
                      const colorClass = colorClasses[option.typeColor] || colorClasses.blue;
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          variant: "outline",
                          size: "sm",
                          onClick: () => handleQuickAdd(option.typeId),
                          className: `flex items-center gap-2 ${colorClass}`,
                          style: {
                            borderColor: option.typeColor ? `var(--color-${option.typeColor}-500)` : void 0
                          },
                          children: [
                            option.typeIconImageSrc ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "img",
                              {
                                src: option.typeIconImageSrc,
                                alt: option.typeName,
                                className: "w-4 h-4 object-contain"
                              }
                            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                              IconSelector,
                              {
                                iconName: option.typeIcon,
                                provider: option.typeIconProvider ?? "yatra",
                                className: "w-4 h-4"
                              }
                            ),
                            option.typeName
                          ]
                        },
                        option.typeId
                      );
                    }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-500 dark:text-gray-400", children: __("No item types available", "yatra") }) })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-3 pt-2 space-y-3 overflow-visible rounded-b-lg", children: [
                    sortedEntries.map((entry) => {
                      var _a2;
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "div",
                        {
                          className: "flex items-center gap-4 p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-100/60 dark:border-gray-800/80 shadow-sm overflow-visible",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_delete_trips", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "input",
                              {
                                type: "checkbox",
                                checked: selectedEntries.has(entry.id),
                                onChange: (e) => {
                                  e.stopPropagation();
                                  handleToggleSelect(entry.id);
                                },
                                onClick: (e) => e.stopPropagation(),
                                className: "w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer",
                                title: __("Select this entry", "yatra")
                              }
                            ) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center min-w-[80px]", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: entry.time_type === "flexible" ? __("Flexible", "yatra") : entry.time_type === "duration" ? entry.duration || __("Duration", "yatra") : entry.start_time ? entry.end_time ? `${formatTime(entry.start_time)} - ${formatTime(entry.end_time)}` : formatTime(entry.start_time) : "—" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 flex items-center gap-1", children: entry.end_time ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-center justify-center", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inline-flex h-5 w-5 rounded-full bg-blue-400/40 animate-ping" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex h-3 w-3 rounded-full bg-blue-600" })
                                ] }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 border-t border-dashed border-gray-300 dark:border-gray-600" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-center justify-center", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inline-flex h-5 w-5 rounded-full bg-red-400/40 animate-ping" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex h-3 w-3 rounded-full bg-red-500" })
                                ] })
                              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-center justify-center", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inline-flex h-5 w-5 rounded-full bg-blue-400/40 animate-ping" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex h-3 w-3 rounded-full bg-blue-600" })
                              ] }) })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 mb-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  "a",
                                  {
                                    href: entry.item_type_id ? `${baseAdminUrl}?page=yatra&subpage=itinerary&tab=item-types&action=edit&id=${entry.item_type_id}` : "#",
                                    className: "focus:outline-none text-blue-600 dark:text-blue-400",
                                    onClick: (e) => {
                                      if (!entry.item_type_id)
                                        e.preventDefault();
                                    },
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                      Badge,
                                      {
                                        className: "text-xs font-medium px-2 py-0.5 hover:underline underline-offset-2",
                                        style: {
                                          backgroundColor: entry.item_color === "blue" ? "rgb(219, 234, 254)" : entry.item_color === "green" ? "rgb(220, 252, 231)" : entry.item_color === "orange" ? "rgb(255, 237, 213)" : entry.item_color === "purple" ? "rgb(243, 232, 255)" : entry.item_color === "red" ? "rgb(254, 226, 226)" : entry.item_color === "yellow" ? "rgb(254, 249, 195)" : "rgb(243, 244, 246)",
                                          color: entry.item_color === "blue" ? "rgb(29, 78, 216)" : entry.item_color === "green" ? "rgb(21, 128, 61)" : entry.item_color === "orange" ? "rgb(194, 65, 12)" : entry.item_color === "purple" ? "rgb(126, 34, 206)" : entry.item_color === "red" ? "rgb(185, 28, 28)" : entry.item_color === "yellow" ? "rgb(161, 98, 7)" : "rgb(55, 65, 81)",
                                          borderColor: entry.item_color === "blue" ? "rgb(147, 197, 253)" : entry.item_color === "green" ? "rgb(134, 239, 172)" : entry.item_color === "orange" ? "rgb(254, 215, 170)" : entry.item_color === "purple" ? "rgb(221, 214, 254)" : entry.item_color === "red" ? "rgb(252, 165, 165)" : entry.item_color === "yellow" ? "rgb(253, 230, 138)" : "rgb(209, 213, 219)",
                                          borderWidth: "1px",
                                          borderStyle: "solid"
                                        },
                                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                                          entry.item_icon_is_image && entry.item_icon_image_src ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                                            "img",
                                            {
                                              src: entry.item_icon_image_src,
                                              alt: "",
                                              className: "w-3 h-3 object-contain"
                                            }
                                          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                                            IconSelector,
                                            {
                                              iconName: entry.item_icon,
                                              provider: entry.item_icon_provider ?? "yatra",
                                              className: "w-3 h-3"
                                            }
                                          ),
                                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: entry.item_type })
                                        ] })
                                      }
                                    )
                                  }
                                ) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    "a",
                                    {
                                      href: entry.item_id ? `${baseAdminUrl}?page=yatra&subpage=items&action=edit&id=${entry.item_id}` : "#",
                                      className: "text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 focus:outline-none text-left",
                                      onClick: (e) => {
                                        if (!entry.item_id)
                                          e.preventDefault();
                                      },
                                      children: entry.title
                                    }
                                  ),
                                  getEntryStatusBadge(entry.status)
                                ] }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400 mb-2", children: entry.description }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center flex-wrap gap-4", children: [
                                    entry.location && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-3.5 h-3.5" }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: entry.location })
                                    ] }),
                                    entry.duration && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-3.5 h-3.5" }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: entry.duration })
                                    ] }),
                                    entry.cost && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: currencySymbol }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                                        entry.cost,
                                        entry.cost_per_person ? ` / ${__("person", "yatra")}` : ""
                                      ] })
                                    ] })
                                  ] }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: (() => {
                                    let included = [];
                                    let excluded = [];
                                    if (Array.isArray(entry.included_items)) {
                                      included = entry.included_items;
                                    } else if (typeof entry.included_items === "string" && entry.included_items.trim()) {
                                      try {
                                        const parsed = JSON.parse(
                                          entry.included_items
                                        );
                                        if (Array.isArray(parsed))
                                          included = parsed;
                                      } catch {
                                        included = entry.included_items.split(",").map((i) => i.trim()).filter(Boolean);
                                      }
                                    }
                                    if (Array.isArray(entry.excluded_items)) {
                                      excluded = entry.excluded_items;
                                    } else if (typeof entry.excluded_items === "string" && entry.excluded_items.trim()) {
                                      try {
                                        const parsed = JSON.parse(
                                          entry.excluded_items
                                        );
                                        if (Array.isArray(parsed))
                                          excluded = parsed;
                                      } catch {
                                        excluded = entry.excluded_items.split(",").map((i) => i.trim()).filter(Boolean);
                                      }
                                    }
                                    if (included.length === 0 && excluded.length === 0) {
                                      return null;
                                    }
                                    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-gray-500 dark:text-gray-400", children: [
                                      included.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-green-600 dark:text-green-400", children: [
                                          __("Includes", "yatra"),
                                          ":"
                                        ] }),
                                        " ",
                                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: included.join(", ") })
                                      ] }),
                                      included.length > 0 && excluded.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "  ·  " }),
                                      excluded.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-red-600 dark:text-red-400", children: [
                                          __("Excludes", "yatra"),
                                          ":"
                                        ] }),
                                        " ",
                                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: excluded.join(", ") })
                                      ] })
                                    ] });
                                  })() })
                                ] })
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 relative z-10", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  SearchableSelect,
                                  {
                                    value: ((_a2 = entry.item_id) == null ? void 0 : _a2.toString()) || "",
                                    onChange: (value) => {
                                      if (!value) return;
                                      const selectedItem = itemsData == null ? void 0 : itemsData.find(
                                        (item) => item.id.toString() === value
                                      );
                                      if (selectedItem && entry.item_type_id) {
                                        updateItemMutation.mutate({
                                          entryId: entry.id,
                                          itemId: selectedItem.id,
                                          itemTypeId: entry.item_type_id
                                        });
                                      }
                                    },
                                    options: (() => {
                                      const itemTypeId = entry.item_type_id;
                                      if (!itemTypeId) return [];
                                      const itemTypeIdNum = typeof itemTypeId === "string" ? parseInt(itemTypeId, 10) : Number(itemTypeId);
                                      if (!itemTypeIdNum || isNaN(itemTypeIdNum))
                                        return [];
                                      const filteredItems = itemsData.filter((item) => {
                                        const typeId = item.type_id;
                                        if (!typeId) return false;
                                        const typeIdNum = typeof typeId === "string" ? parseInt(typeId, 10) : Number(typeId);
                                        const matches = typeIdNum === itemTypeIdNum;
                                        return matches;
                                      }).map((item) => ({
                                        value: item.id.toString(),
                                        label: item.name
                                      }));
                                      return filteredItems;
                                    })(),
                                    placeholder: __(
                                      "Select item...",
                                      "yatra"
                                    ),
                                    searchPlaceholder: __(
                                      "Search items...",
                                      "yatra"
                                    ),
                                    className: "min-w-[140px]",
                                    disabled: updateItemMutation.isPending
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_edit_trips", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Button,
                                  {
                                    variant: "ghost",
                                    size: "icon",
                                    onClick: () => handleEdit(entry),
                                    className: "h-8 w-8",
                                    title: __("Edit Activity", "yatra"),
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "w-4 h-4" })
                                  }
                                ) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_delete_trips", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Button,
                                  {
                                    variant: "ghost",
                                    size: "icon",
                                    onClick: () => handleDelete(entry),
                                    className: "h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300",
                                    title: __("Delete", "yatra"),
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" })
                                  }
                                ) })
                              ] })
                            ] }) })
                          ]
                        },
                        entry.id
                      );
                    }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_edit_trips", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        variant: "outline",
                        className: "w-full flex items-center justify-center gap-2 border-2 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/70 shadow-sm transition-colors",
                        style: { borderColor: "#3b82f6" },
                        onClick: () => {
                          var _a2;
                          const tripId = dayGroup.trip_id;
                          const day = dayGroup.day;
                          window.location.href = `${((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripId}&day=${day}&mode=activity`;
                        },
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                          __("Add Activity", "yatra")
                        ]
                      }
                    ) })
                  ] })
                ] })
              ]
            },
            key
          );
        })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: deleteConfirm.isOpen,
        onClose: handleDeleteCancel,
        onConfirm: handleDeleteConfirm,
        title: ((_c = deleteConfirm.entry) == null ? void 0 : _c._isDayDeletion) ? __("Delete Day", "yatra") : __("Delete Itinerary Entry", "yatra"),
        message: ((_d = deleteConfirm.entry) == null ? void 0 : _d._isDayDeletion) ? __(
          "Are you sure you want to delete this day and all its activities? This action cannot be undone.",
          "yatra"
        ) : __(
          "Are you sure you want to delete this itinerary entry? This action cannot be undone.",
          "yatra"
        ),
        confirmText: __("Delete", "yatra"),
        variant: "danger",
        isLoading: deleteMutation.isPending
      }
    ),
    tripFilter && (() => {
      const selectedTrip = tripsData == null ? void 0 : tripsData.find(
        (t) => String(t.id) === String(tripFilter)
      );
      const duration = Number((selectedTrip == null ? void 0 : selectedTrip.duration_days) ?? 0);
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        BuildItineraryModal,
        {
          open: aiModalOpen,
          onClose: () => setAiModalOpen(false),
          tripId: Number(tripFilter),
          tripName: (selectedTrip == null ? void 0 : selectedTrip.title) || (selectedTrip == null ? void 0 : selectedTrip.name) || __("Selected trip", "yatra"),
          tripDurationDays: Number.isFinite(duration) ? duration : 0,
          onApplied: ({ message }) => {
            showToast(message, "success");
            queryClient.invalidateQueries({ queryKey: ["itinerary"] });
            queryClient.invalidateQueries({
              queryKey: ["trips-with-itinerary-meta"]
            });
          }
        }
      );
    })()
  ] });
};
export {
  Itinerary as default
};
//# sourceMappingURL=Itinerary-EhU3Ovi1.js.map
