/**
 * Departures Page
 * Manage trip departures (manual and recurring-generated)
 */

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RotateCcw,
  Eye,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { __ } from "../lib/i18n";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { SearchableSelect } from "../components/ui/searchable-select";
import { PageHeader } from "../components/common/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { DateRangePicker } from "../components/ui/date-range-picker";
import { BulkActionToolbar } from "../components/shared/BulkActionToolbar";
import { Table as SharedTable } from "../components/shared/Table";
import { Pagination } from "../components/shared/Pagination";
import { apiClient } from "../lib/api-client";
import { useToast } from "../components/ui/toast";
import { getErrorContext } from "../lib/errors";
// Format date helper
const formatDate = (dateString: string): string => {
  if (!dateString) return "--";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

interface Traveler {
  id: number;
  booking_id: number;
  booking_reference: string;
  is_lead: boolean;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface Departure {
  id: number;
  trip_id: number;
  date: string;
  start_date?: string;
  time?: string;
  max_capacity: number;
  booked_count: number;
  available_capacity: number;
  status: "upcoming" | "full" | "past" | "cancelled" | "trash";
  source: "manual" | "booking_created";
  price_override?: number;
  total_revenue?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  trip?: {
    id: number;
    title: string;
    slug?: string;
  };
  booking_ids?: number[];
  bookings_count?: number;
  travelers?: Traveler[];
  travelers_count?: number;
}

interface Trip {
  id: number;
  title: string;
  trip_type?: "single_day" | "multi_day";
  starting_location?: string;
  ending_location?: string;
}

const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null) {
    return "--";
  }
  const currency = (window as any).yatraAdmin?.currency || "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

/**
 * Normalize /trips list payloads and any stale React Query cache (SPA navigation can reuse bad shapes).
 */
function normalizeTripsForDropdown(raw: unknown): Trip[] {
  if (Array.isArray(raw)) {
    return raw as Trip[];
  }
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.data)) {
      return r.data as Trip[];
    }
    const inner = r.data;
    if (
      inner &&
      typeof inner === "object" &&
      Array.isArray((inner as Record<string, unknown>).data)
    ) {
      return (inner as Record<string, unknown>).data as Trip[];
    }
  }
  return [];
}

const Departures: React.FC = () => {
  // Load selected trip from localStorage on initial render
  const [selectedTripId, setSelectedTripId] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem("yatra_selected_trip_id");
      return saved ? parseInt(saved) : null;
    } catch {
      return null;
    }
  });
  const [statusFilter, setStatusFilter] = useState<
    "all" | "upcoming" | "full" | "past" | "cancelled" | "trash"
  >("all");
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "manual" | "booking_created"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem("yatra_departures_visible_columns");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore errors
    }
    // Default column visibility (trip and source hidden by default)
    return {
      trip: false,
      date: true,
      time: true,
      capacity: true,
      booked: true,
      available: true,
      revenue: true,
      travelers: true,
      bookings: true,
      status: true,
      source: false,
    };
  });
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const [travelerModalDeparture, setTravelerModalDeparture] =
    useState<Departure | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Save column visibility to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "yatra_departures_visible_columns",
        JSON.stringify(visibleColumns),
      );
    } catch (error) {
      console.error("Failed to save column visibility to localStorage:", error);
    }
  }, [visibleColumns]);

  // Close column menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(event.target as Node)
      ) {
        setShowColumnMenu(false);
      }
    };

    if (showColumnMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColumnMenu]);

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev: typeof visibleColumns) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const columnOptions = Object.entries(visibleColumns).map(([key, value]) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    visible: Boolean(value),
  }));

  // Save selected trip to localStorage whenever it changes
  useEffect(() => {
    try {
      if (selectedTripId) {
        localStorage.setItem(
          "yatra_selected_trip_id",
          selectedTripId.toString(),
        );
      } else {
        localStorage.removeItem("yatra_selected_trip_id");
      }
    } catch (error) {
      console.error("Failed to save trip selection to localStorage:", error);
    }
  }, [selectedTripId]);

  // Fetch trips for dropdown (same response shapes as Trips.tsx: data[] or data.data[])
  const { data: tripsData } = useQuery({
    queryKey: ["trips", "departures-dropdown", "v1"],
    queryFn: async () => {
      const response = await apiClient.get("/trips", {
        params: { per_page: 1000 },
      });
      return normalizeTripsForDropdown(response);
    },
  });

  const tripsList = useMemo(
    () => normalizeTripsForDropdown(tripsData),
    [tripsData],
  );

  // Note: We pass filter values directly to the API call instead of building queryParams

  // Fetch departures data for the current status tab (filtered list)
  const {
    data: departuresData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "departures",
      selectedTripId,
      statusFilter,
      sourceFilter,
      searchTerm,
      dateFrom,
      dateTo,
      page,
    ],
    queryFn: async () => {
      // Check URL parameter for error simulation (for testing)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("simulate_error") === "true") {
        throw new Error(
          "Simulated API error for testing error UI functionality",
        );
      }

      // API endpoint based on if a trip is selected
      const endpoint = selectedTripId
        ? `/trips/${selectedTripId}/departures`
        : "/departures";

      const response = await apiClient.get(endpoint, {
        params: {
          status: statusFilter !== "all" ? statusFilter : undefined,
          source: sourceFilter !== "all" ? sourceFilter : undefined,
          search: searchTerm || undefined,
          date_from: dateFrom && dateFrom.trim() !== "" ? dateFrom : undefined,
          date_to: dateTo && dateTo.trim() !== "" ? dateTo : undefined,
          include_past:
            (dateFrom && dateFrom.trim() !== "") ||
            (dateTo && dateTo.trim() !== "")
              ? "true"
              : "false",
          page: page,
          per_page: 20,
        },
      });

      // apiClient returns the full response: {success, data, meta}
      // response.data is the array of departures
      // We need to return the structure as {data: [...], meta: {...}}
      const result = {
        data: response?.data || [],
        meta: response?.meta || { total: 0 },
      };

      // Debug: Log the first departure to see time and revenue values
      if (result.data.length > 0) {
      }

      return result;
    },
    // Always enabled, whether trip is selected or not
    enabled: true,
  });

  const departures: Departure[] = departuresData?.data || [];

  // Enhanced error handling
  const errorContext = getErrorContext(error);
  const apiErrorMessage =
    (departuresData as any)?.error || (departuresData as any)?.message;
  const derivedErrorDetails =
    errorContext.details ||
    (apiErrorMessage ? String(apiErrorMessage) : undefined) ||
    (error ? String(error?.message || error) : undefined);
  const isDeparturesError = !!error || !!apiErrorMessage;

  const totalItems = departuresData?.meta?.total ?? 0;
  const itemsPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Fetch departures stats without status filter so tab counts stay stable across tabs
  const { data: departuresStatsData } = useQuery({
    queryKey: [
      "departures-stats",
      selectedTripId,
      sourceFilter,
      searchTerm,
      dateFrom,
      dateTo,
    ],
    queryFn: async () => {
      const endpoint = selectedTripId
        ? `/trips/${selectedTripId}/departures`
        : "/departures";

      const response = await apiClient.get(endpoint, {
        params: {
          // NOTE: intentionally no status param here
          source: sourceFilter !== "all" ? sourceFilter : undefined,
          search: searchTerm || undefined,
          date_from: dateFrom && dateFrom.trim() !== "" ? dateFrom : undefined,
          date_to: dateTo && dateTo.trim() !== "" ? dateTo : undefined,
          include_past:
            (dateFrom && dateFrom.trim() !== "") ||
            (dateTo && dateTo.trim() !== "")
              ? "true"
              : "false",
          page: 1,
          per_page: 1000,
        },
      });

      return response?.data || [];
    },
    enabled: true,
  });

  const statusCounts = useMemo(() => {
    const allDepartures: Departure[] = Array.isArray(departuresStatsData)
      ? departuresStatsData
      : [];

    const counts = {
      all: allDepartures.length,
      upcoming: 0,
      full: 0,
      past: 0,
      cancelled: 0,
      trash: 0,
    };

    allDepartures.forEach((departure) => {
      if (departure.status === "upcoming") counts.upcoming += 1;
      if (departure.status === "full") counts.full += 1;
      if (departure.status === "past") counts.past += 1;
      if (departure.status === "cancelled") counts.cancelled += 1;
      if (departure.status === "trash") counts.trash += 1;
    });

    return counts;
  }, [departuresStatsData]);

  const statusOptions = [
    { key: "all", label: __("All", "yatra"), count: statusCounts.all },
    {
      key: "upcoming",
      label: __("Upcoming", "yatra"),
      count: statusCounts.upcoming,
    },
    { key: "full", label: __("Full", "yatra"), count: statusCounts.full },
    { key: "past", label: __("Past", "yatra"), count: statusCounts.past },
    {
      key: "cancelled",
      label: __("Cancelled", "yatra"),
      count: statusCounts.cancelled,
    },
    { key: "trash", label: __("Trash", "yatra"), count: statusCounts.trash },
  ];

  const bulkActionOptions = useMemo(() => {
    if (statusFilter === "trash") {
      return [
        { value: "restore", label: __("Restore", "yatra") },
        { value: "delete", label: __("Delete Permanently", "yatra") },
      ];
    }
    return [{ value: "trash", label: __("Move to Trash", "yatra") }];
  }, [statusFilter]);

  const handleBulkApply = async () => {
    const ids = selectedIds;

    if (!bulkAction || ids.length === 0) {
      showToast(
        __("Please select departures and a bulk action first.", "yatra"),
        "error",
      );
      return;
    }

    if (!selectedTripId) {
      showToast(__("Please select a trip first", "yatra"), "error");
      return;
    }

    try {
      if (bulkAction === "trash") {
        // Move to trash
        await Promise.all(
          ids.map((id) =>
            apiClient.patch(`/trips/${selectedTripId}/departures/${id}`, {
              status: "trash",
            }),
          ),
        );
        showToast(
          __("Selected departures moved to trash.", "yatra"),
          "success",
        );
      } else if (bulkAction === "restore") {
        // Restore from trash
        await Promise.all(
          ids.map((id) =>
            apiClient.patch(`/trips/${selectedTripId}/departures/${id}`, {
              status: "upcoming",
            }),
          ),
        );
        showToast(__("Selected departures restored.", "yatra"), "success");
      } else if (bulkAction === "delete") {
        // Delete permanently (only from trash)
        const eligibleIds = departures
          .filter(
            (d) =>
              ids.includes(d.id) &&
              d.status === "trash" &&
              d.source === "booking_created" &&
              d.booked_count === 0,
          )
          .map((d) => d.id);

        if (eligibleIds.length === 0) {
          showToast(
            __(
              "No selected departures can be deleted (must be in trash, booking-created with zero bookings).",
              "No selected departures can be deleted (must be in trash, booking-created with zero bookings).",
            ),
            "error",
          );
          return;
        }

        await Promise.all(
          eligibleIds.map((id) =>
            apiClient.delete(`/trips/${selectedTripId}/departures/${id}`),
          ),
        );
        showToast(
          __("Selected departures deleted permanently.", "yatra"),
          "success",
        );
      }

      setSelectedIds([]);
      setBulkAction("");
      queryClient.invalidateQueries({
        queryKey: ["departures", selectedTripId],
      });
      queryClient.invalidateQueries({
        queryKey: ["departures-stats", selectedTripId],
      });
    } catch (error: any) {
      showToast(
        error?.message ||
          __(
            "Failed to perform bulk action. Please try again.",
            "Failed to perform bulk action. Please try again.",
          ),
        "error",
      );
    }
  };

  /** Trip id for REST URLs: each row includes trip_id for /departures; filter supplies it when one trip is selected. */
  const tripIdForDeparture = useCallback(
    (departure: Departure): number | null => {
      if (departure.trip_id > 0) {
        return departure.trip_id;
      }
      if (selectedTripId != null && selectedTripId > 0) {
        return selectedTripId;
      }
      return null;
    },
    [selectedTripId],
  );

  const navigateToAdd = () => {
    if (!selectedTripId) {
      showToast(__("Please select a trip first", "yatra"), "error");
      return;
    }
    window.location.href = `?page=yatra&subpage=departures&action=create&trip_id=${selectedTripId}`;
  };

  const navigateToEdit = useCallback(
    (departure: Departure) => {
      const tid = tripIdForDeparture(departure);
      if (!tid) {
        showToast(
          __(
            "Cannot open edit: this departure has no trip id. Select a trip filter or refresh the list.",
            "yatra",
          ),
          "error",
        );
        return;
      }
      window.location.href = `?page=yatra&subpage=departures&action=edit&id=${departure.id}&trip_id=${tid}`;
    },
    [tripIdForDeparture, showToast],
  );

  const navigateToView = useCallback(
    (departure: Departure) => {
      const tid = tripIdForDeparture(departure);
      if (!tid) {
        showToast(
          __(
            "Cannot open departure: missing trip id. Select a trip filter or refresh the list.",
            "yatra",
          ),
          "error",
        );
        return;
      }
      window.location.href = `?page=yatra&subpage=departures&action=view&id=${departure.id}&trip_id=${tid}`;
    },
    [tripIdForDeparture, showToast],
  );

  // Delete departure mutation (per-row trip id supports "All trips" list)
  const deleteMutation = useMutation({
    mutationFn: async ({ id, tripId: tid }: { id: number; tripId: number }) => {
      await apiClient.delete(`/trips/${tid}/departures/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departures"] });
      queryClient.invalidateQueries({ queryKey: ["departures-stats"] });
      showToast(__("Departure deleted successfully", "yatra"), "success");
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to delete departure", "yatra"),
        "error",
      );
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleDelete = (departure: Departure) => {
    const tid = tripIdForDeparture(departure);
    if (!tid) {
      showToast(
        __("Cannot delete: missing trip id for this departure.", "yatra"),
        "error",
      );
      return;
    }
    if (
      !confirm(__("Are you sure you want to delete this departure?", "yatra"))
    ) {
      return;
    }
    deleteMutation.mutate({ id: departure.id, tripId: tid });
  };

  const isAllSelected =
    departures.length > 0 && selectedIds.length === departures.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(departures.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((existingId) => existingId !== id),
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      upcoming: {
        label: __("Upcoming", "yatra"),
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
      },
      full: {
        label: __("Full", "yatra"),
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
      },
      past: {
        label: __("Past", "yatra"),
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
      },
      cancelled: {
        label: __("Cancelled", "yatra"),
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
      },
      trash: {
        label: __("Trash", "yatra"),
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
      },
    };

    const statusInfo = statusMap[status] || statusMap.upcoming;

    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getSourceBadge = (source: string) => {
    if (source === "manual") {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {__("Manual", "yatra")}
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
        {__("Booking Created", "yatra")}
      </Badge>
    );
  };

  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const openTravelerModal = (departure: Departure) => {
    if (!departure.travelers || !departure.travelers.length) {
      return;
    }
    setTravelerModalDeparture(departure);
  };

  const closeTravelerModal = () => setTravelerModalDeparture(null);

  const departureColumns = React.useMemo(
    () => [
      {
        key: "trip",
        label: __("Trip", "yatra"),
        visible: visibleColumns.trip,
        render: (departure: Departure) =>
          departure.trip?.title ? (
            <a
              href={`?page=yatra&subpage=trips&action=edit&id=${departure.trip.id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
              title={__("View trip", "yatra")}
            >
              {departure.trip.title}
            </a>
          ) : (
            <span className="text-gray-400">--</span>
          ),
      },
      {
        key: "date",
        label: __("Date", "yatra"),
        visible: visibleColumns.date,
        render: (departure: Departure) =>
          formatDate(departure.start_date || departure.date),
      },
      {
        key: "time",
        label: __("Time", "yatra"),
        visible: visibleColumns.time,
        render: (departure: Departure) =>
          departure.time ? (
            <span className="font-mono">{departure.time}</span>
          ) : (
            <span className="text-gray-400">--</span>
          ),
      },
      {
        key: "capacity",
        label: __("Capacity", "yatra"),
        visible: visibleColumns.capacity,
        render: (departure: Departure) => (
          <span title={__("Max Capacity", "yatra")}>
            {departure.max_capacity}
          </span>
        ),
      },
      {
        key: "booked",
        label: __("Booked", "yatra"),
        visible: visibleColumns.booked,
        render: (departure: Departure) => (
          <span title={__("Booked Count", "yatra")}>
            {departure.booked_count}
          </span>
        ),
      },
      {
        key: "available",
        label: __("Available", "yatra"),
        visible: visibleColumns.available,
        render: (departure: Departure) => (
          <span
            className={
              departure.available_capacity === 0
                ? "text-red-600 font-semibold"
                : ""
            }
            title={__("Available Capacity", "yatra")}
          >
            {departure.available_capacity}
          </span>
        ),
      },
      {
        key: "revenue",
        label: __("Revenue", "yatra"),
        visible: visibleColumns.revenue,
        render: (departure: Departure) =>
          departure.total_revenue !== undefined &&
          departure.total_revenue > 0 ? (
            <span className="font-semibold text-green-600">
              {formatCurrency(departure.total_revenue)}
            </span>
          ) : (
            <span className="text-gray-400">--</span>
          ),
      },
      {
        key: "travelers",
        label: __("Travelers", "yatra"),
        visible: visibleColumns.travelers,
        render: (departure: Departure) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openTravelerModal(departure)}
            disabled={!departure.travelers || departure.travelers.length === 0}
            className="px-3 py-1.5"
          >
            {departure.travelers_count || departure.travelers?.length || 0}{" "}
            {__("Traveler(s)", "yatra")}
          </Button>
        ),
      },
      {
        key: "bookings",
        label: __("Bookings", "yatra"),
        visible: visibleColumns.bookings,
        render: (departure: Departure) =>
          departure.booking_ids && departure.booking_ids.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {departure.booking_ids.slice(0, 3).map((bookingId) => (
                <a
                  key={bookingId}
                  href={`?page=yatra&subpage=bookings&action=view&id=${bookingId}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                  title={__("View booking", "yatra")}
                >
                  #{bookingId}
                </a>
              ))}
              {departure.booking_ids.length > 3 && (
                <span className="text-gray-500 text-sm">
                  +{departure.booking_ids.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400">--</span>
          ),
      },
      {
        key: "status",
        label: __("Status", "yatra"),
        visible: visibleColumns.status,
        render: (departure: Departure) => getStatusBadge(departure.status),
      },
      {
        key: "source",
        label: __("Source", "yatra"),
        visible: visibleColumns.source,
        render: (departure: Departure) => getSourceBadge(departure.source),
      },
    ],
    [visibleColumns, openTravelerModal],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMoveToTrash = async (departure: Departure) => {
    const tid = tripIdForDeparture(departure);
    if (!tid) {
      showToast(
        __(
          "Cannot move to trash: missing trip id for this departure.",
          "yatra",
        ),
        "error",
      );
      return;
    }
    if (
      !window.confirm(
        __("Are you sure you want to move this departure to trash?", "yatra"),
      )
    ) {
      return;
    }
    try {
      await apiClient.patch(`/trips/${tid}/departures/${departure.id}`, {
        status: "trash",
      });
      showToast(__("Departure moved to trash.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["departures"] });
      queryClient.invalidateQueries({ queryKey: ["departures-stats"] });
    } catch (error: any) {
      showToast(
        error?.message || __("Failed to move departure to trash", "yatra"),
        "error",
      );
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleRestore = async (departure: Departure) => {
    const tid = tripIdForDeparture(departure);
    if (!tid) {
      showToast(
        __("Cannot restore: missing trip id for this departure.", "yatra"),
        "error",
      );
      return;
    }
    if (
      !window.confirm(
        __("Are you sure you want to restore this departure?", "yatra"),
      )
    ) {
      return;
    }
    try {
      await apiClient.patch(`/trips/${tid}/departures/${departure.id}`, {
        status: "upcoming",
      });
      showToast(__("Departure restored.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["departures"] });
      queryClient.invalidateQueries({ queryKey: ["departures-stats"] });
    } catch (error: any) {
      showToast(
        error?.message || __("Failed to restore departure", "yatra"),
        "error",
      );
    }
  };

  const tableActions = React.useMemo(() => {
    const actions = [
      {
        key: "view",
        label: __("View", "yatra"),
        icon: <Eye className="w-4 h-4" />,
        onClick: (departure: Departure) => navigateToView(departure),
      },
      {
        key: "edit",
        label: __("Edit", "yatra"),
        icon: <Edit className="w-4 h-4" />,
        onClick: (departure: Departure) => navigateToEdit(departure),
        condition: (departure: Departure) => departure.status !== "trash",
      },
    ];

    if (statusFilter === "trash") {
      actions.push({
        key: "restore",
        label: __("Restore", "yatra"),
        icon: <RotateCcw className="w-4 h-4" />,
        onClick: (departure: Departure) => handleRestore(departure),
      } as any);
      actions.push({
        key: "delete",
        label: __("Delete Permanently", "yatra"),
        icon: <Trash2 className="w-4 h-4" />,
        onClick: (departure: Departure) => handleDelete(departure),
      } as any);
    } else {
      actions.push({
        key: "trash",
        label: __("Move to Trash", "yatra"),
        icon: <Trash2 className="w-4 h-4" />,
        onClick: (departure: Departure) => handleMoveToTrash(departure),
        variant: "destructive" as const,
      } as any);
    }

    return actions;
  }, [
    statusFilter,
    navigateToEdit,
    navigateToView,
    handleDelete,
    handleRestore,
    handleMoveToTrash,
  ]);

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title={__("Departures", "yatra")}
          description={__("Manage trip departure dates and capacity", "yatra")}
          actions={
            <div className="flex gap-2">
              {selectedTripId && (
                <Button onClick={navigateToAdd} variant="default">
                  <Plus className="w-4 h-4 mr-2" />
                  {__("Add Departure", "yatra")}
                </Button>
              )}
            </div>
          }
        />

        {/* Trip Selector - Clean Design */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {__("Select Trip", "yatra")}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {__(
                  "Choose a trip to manage its departures and capacity",
                  "yatra",
                )}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__("Trip", "yatra")} <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                value={selectedTripId?.toString() || ""}
                onChange={(value) => {
                  const tripId = value ? parseInt(value) : null;
                  setSelectedTripId(tripId);
                  setPage(1);
                }}
                options={[
                  { value: "", label: __("-- Select a Trip --", "yatra") },
                  ...tripsList.map((trip: Trip) => ({
                    value: trip.id.toString(),
                    label: `${trip.title}${trip.trip_type === "single_day" ? " (Single Day)" : trip.trip_type === "multi_day" ? " (Multi-Day)" : ""}`,
                  })),
                ]}
                placeholder={__("Search or select a trip...", "yatra")}
                searchPlaceholder={__("Search by trip name or ID...", "yatra")}
                className="w-full"
                required
              />
            </div>

            {selectedTripId &&
              (() => {
                const selectedTripData = tripsList.find(
                  (trip: Trip) => trip.id === selectedTripId,
                );
                return selectedTripData ? (
                  <div className="flex items-center gap-4 pt-2 border-t border-blue-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium">
                        {selectedTripData.starting_location}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium">
                        {selectedTripData.ending_location}
                      </span>
                    </div>
                    {selectedTripData.trip_type && (
                      <Badge
                        className={
                          selectedTripData.trip_type === "single_day"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                            : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                        }
                      >
                        {selectedTripData.trip_type === "single_day"
                          ? __("Single Day", "yatra")
                          : __("Multi-Day", "yatra")}
                      </Badge>
                    )}
                  </div>
                ) : null;
              })()}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__("Search", "yatra")}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder={__("Search by date or notes...", "yatra")}
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__("Status", "yatra")}
                  </label>
                  <Select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
                      setPage(1);
                    }}
                  >
                    <option value="all">{__("All Status", "yatra")}</option>
                    <option value="upcoming">{__("Upcoming", "yatra")}</option>
                    <option value="full">{__("Full", "yatra")}</option>
                    <option value="past">{__("Past", "yatra")}</option>
                    <option value="cancelled">
                      {__("Cancelled", "yatra")}
                    </option>
                  </Select>
                </div>
                <div className="w-48">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__("Source", "yatra")}
                  </label>
                  <Select
                    value={sourceFilter}
                    onChange={(e) => {
                      setSourceFilter(e.target.value as any);
                      setPage(1);
                    }}
                  >
                    <option value="all">{__("All Sources", "yatra")}</option>
                    <option value="manual">{__("Manual", "yatra")}</option>
                    <option value="booking_created">
                      {__("Booking Created", "yatra")}
                    </option>
                  </Select>
                </div>
                <div className="w-80">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__("Date Range", "yatra")}
                  </label>
                  <DateRangePicker
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onDateFromChange={(dateStr) => {
                      setDateFrom(dateStr || "");
                      setPage(1);
                    }}
                    onDateToChange={(dateStr) => {
                      setDateTo(dateStr || "");
                      setPage(1);
                    }}
                    onClear={clearDateFilters}
                    placeholder={__("Select date range...", "yatra")}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk actions + status tabs */}
        {!isDeparturesError && (
          <BulkActionToolbar
            selectedIds={selectedIds}
            bulkAction={bulkAction}
            setBulkAction={setBulkAction}
            onApply={handleBulkApply}
            onClearSelection={() => setSelectedIds([])}
            statusFilter={statusFilter}
            setStatusFilter={(filter) => {
              setStatusFilter(filter as any);
              setPage(1);
            }}
            statusOptions={statusOptions}
            showColumnsDropdown={showColumnMenu}
            setShowColumnsDropdown={setShowColumnMenu}
            columnOptions={columnOptions}
            onToggleColumn={(key) =>
              toggleColumn(key as keyof typeof visibleColumns)
            }
            bulkMutationPending={deleteMutation.isPending}
            totalItems={departures.length}
            bulkActionOptions={bulkActionOptions}
          />
        )}

        {/* Departures Table */}
        <Card>
          <CardContent className="pt-6">
            <SharedTable
              data={departures}
              columns={departureColumns}
              actions={tableActions}
              isLoading={isLoading}
              isError={isDeparturesError}
              errorText={__("Error loading departures", "yatra")}
              errorDescription={__(
                "We couldn't connect to the departures service. Please refresh or try again shortly.",
                "yatra",
              )}
              errorDetails={derivedErrorDetails}
              errorRequestInfo={errorContext.requestInfo}
              onRetry={() => refetch()}
              emptyText={__("No departures found", "yatra")}
              emptyDescription={__(
                "Get started by creating your first departure.",
                "yatra",
              )}
              onCreateClick={navigateToAdd}
              selectedItemIds={selectedIds}
              onSelectItem={(id, checked) =>
                handleSelectRow(id as number, checked)
              }
              onSelectAll={handleSelectAll}
              isAllSelected={isAllSelected}
              getItemId={(departure: Departure) => departure.id}
              getItemStatus={(departure: Departure) => departure.status}
              capability="yatra_view_trips"
            />
          </CardContent>
        </Card>

        {totalItems > 0 && departures.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={(newPage) => setPage(newPage)}
              itemName={__("departures", "yatra")}
            />
          </div>
        )}
      </div>

      {travelerModalDeparture && travelerModalDeparture.travelers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {__("Travelers for", "yatra")}{" "}
                  {travelerModalDeparture.trip?.title || __("Trip", "yatra")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(
                    travelerModalDeparture.start_date ||
                      travelerModalDeparture.date,
                  )}
                </p>
              </div>
              <Button variant="outline" onClick={closeTravelerModal}>
                {__("Close", "yatra")}
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{__("Traveler", "yatra")}</TableHead>
                    <TableHead>{__("Lead", "yatra")}</TableHead>
                    <TableHead>{__("Email", "yatra")}</TableHead>
                    <TableHead>{__("Phone", "yatra")}</TableHead>
                    <TableHead>{__("Booking", "yatra")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {travelerModalDeparture.travelers.map((traveler) => (
                    <TableRow key={traveler.id}>
                      <TableCell className="font-semibold text-gray-800 dark:text-gray-100">
                        {traveler.first_name || "—"} {traveler.last_name || ""}
                      </TableCell>
                      <TableCell>
                        {traveler.is_lead ? (
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            {__("Lead", "yatra")}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>{traveler.email || "—"}</TableCell>
                      <TableCell>{traveler.phone || "—"}</TableCell>
                      <TableCell>
                        <a
                          href={`?page=yatra&subpage=bookings&action=view&id=${traveler.booking_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {traveler.booking_reference ||
                            `#${traveler.booking_id}`}
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Departures;
