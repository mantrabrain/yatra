/**
 * Availability Management Page
 * Manage trip availability dates separately from trip packages
 * Allows adding/editing dates for trips without modifying the trip itself
 */

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Plus,
  Search,
  X,
  Edit,
  Copy,
  Trash2,
  MapPin,
  Users,
  AlertCircle,
  List,
  Calendar,
  RefreshCw,
  Bell,
  Ban,
  Clock,
  Eye,
  Settings,
} from "lucide-react";
import { __ } from "../lib/i18n";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { SearchableSelect } from "../components/ui/searchable-select";
import { PageHeader } from "../components/common/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Alert } from "../components/ui/alert";
import { useNavigate } from "../hooks/useNavigate";
import { AvailabilityCalendar } from "../components/availability/AvailabilityCalendar";
import { RecurringRules } from "../components/availability/RecurringRules";
import { apiClient } from "../lib/api-client";
import { getErrorContext } from "../lib/errors";
import { useToast } from "../components/ui/toast";
import { BulkActionToolbar, Table as SharedTable } from "../components/shared";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { DatePicker } from "../components/ui/date-picker";
import { TimePicker } from "../components/ui/time-picker";

interface Trip {
  id: number;
  title: string;
  slug: string;
  currency: string;
  starting_location?: string;
  ending_location?: string;
  trip_type?: "single_day" | "multi_day";
}

interface AvailabilityDate {
  id: string;
  trip_id: number;
  departure_date: string;
  departure_time?: string;
  arrival_date: string;
  arrival_time?: string;
  total_seats: number; // Total capacity
  booked_seats: number; // Currently booked
  available_seats: number; // Calculated: total_seats - booked_seats
  waitlist_count: number; // Number of people on waitlist
  seats_remaining: string; // Legacy field for display
  original_price: string;
  discounted_price: string;
  discount_percentage: string;
  status:
    | "available"
    | "sold_out"
    | "limited"
    | "closed"
    | "blocked"
    | "cancelled";
  from_location?: string;
  to_location?: string;
  is_blocked?: boolean; // Blocked for maintenance/holidays
  block_reason?: string; // Reason for blocking
  alert_threshold?: number; // Alert when seats drop below this
  last_synced_at?: string; // Last real-time sync timestamp
  created_at?: string;
  updated_at?: string;
}

const Availability: React.FC = () => {
  const { navigate } = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Get trip_id from URL on mount and when URL changes
  const [urlKey, setUrlKey] = useState(0);
  useEffect(() => {
    const handleLocationChange = () => {
      setUrlKey((prev) => prev + 1);
    };

    // Listen for popstate (back/forward button)
    window.addEventListener("popstate", handleLocationChange);

    // Also check periodically (fallback for direct navigation)
    const interval = setInterval(() => {
      const currentSearch = window.location.search;
      if (currentSearch !== (window as any).__lastAvailabilitySearch) {
        (window as any).__lastAvailabilitySearch = currentSearch;
        handleLocationChange();
      }
    }, 100);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      clearInterval(interval);
    };
  }, []);

  // Read trip_id from URL
  const tripIdFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const tripId = params.get("trip_id");
    return tripId ? parseInt(tripId) : null;
  }, [urlKey]);

  // Trip selection - initialize from localStorage or URL if available
  const [selectedTripId, setSelectedTripId] = useState<number | null>(() => {
    const storedTripId = localStorage.getItem("yatra_selected_trip_id");
    if (storedTripId) {
      const parsed = parseInt(storedTripId, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return tripIdFromUrl;
  });

  // When URL trip_id changes, prefer it over stored value
  useEffect(() => {
    if (tripIdFromUrl && tripIdFromUrl !== selectedTripId) {
      setSelectedTripId(tripIdFromUrl);
      localStorage.setItem("yatra_selected_trip_id", tripIdFromUrl.toString());
    }
  }, [tripIdFromUrl, selectedTripId]);

  // Persist current selection
  useEffect(() => {
    if (selectedTripId) {
      localStorage.setItem("yatra_selected_trip_id", selectedTripId.toString());
    } else {
      localStorage.removeItem("yatra_selected_trip_id");
    }
  }, [selectedTripId]);

  // View mode: 'list' or 'calendar'
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Tab mode: 'specific' or 'recurring'
  const [tabMode, _setTabMode] = useState<"specific" | "recurring">(() => {
    const params = new URLSearchParams(window.location.search);
    const tabModeParam = params.get("tab_mode");
    return tabModeParam === "recurring" ? "recurring" : "specific";
  });

  const setTabMode = (mode: "specific" | "recurring") => {
    _setTabMode(mode);
    const params = new URLSearchParams(window.location.search);
    params.set("tab_mode", mode);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  };

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  // Real-time sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Inventory alerts visibility
  const [showAlerts, setShowAlerts] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);

  // Bulk selection & columns state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    departure: true,
    arrival: true,
    locations: true,
    capacity: true,
    booked: true,
    available: true,
    waitlist: true,
    price: true,
    status: true, // Always show status column
  });

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Fetch all trips for dropdown
  const { data: tripsData } = useQuery({
    queryKey: ["trips", "all"],
    queryFn: async () => {
      const response = await apiClient.get("/trips", {
        params: { per_page: 100, status: "publish" },
      });
      return {
        trips: (response?.data || []).map((trip: any) => ({
          id: trip.id,
          title: trip.title,
          slug: trip.slug,
          currency: trip.currency || "USD",
          starting_location: trip.starting_location,
          ending_location: trip.ending_location,
          trip_type: trip.trip_type || "multi_day",
        })) as Trip[],
      };
    },
  });

  // Fetch availability dates for selected trip
  const {
    data: availabilityData,
    isLoading,
    error: availabilityError,
  } = useQuery({
    queryKey: ["availability", selectedTripId, monthFilter, page, searchTerm],
    queryFn: async () => {
      if (!selectedTripId) return { dates: [], total: 0 };

      const response = await apiClient.get("/availability", {
        params: {
          trip_id: selectedTripId,
          month: monthFilter !== "all" ? monthFilter : undefined,
          search: searchTerm || undefined,
          page,
          per_page: 50,
        },
      });

      return {
        dates: (response?.dates || []).map((date: any) => ({
          id: date.id.toString(),
          trip_id: date.trip_id,
          departure_date: date.departure_date,
          departure_time: date.departure_time,
          arrival_date: date.arrival_date || date.departure_date,
          arrival_time: date.arrival_time,
          total_seats: date.total_seats || date.seats_total || 0,
          booked_seats:
            date.booked_seats ||
            (date.total_seats || date.seats_total) -
              (date.available_seats || date.seats_available || 0),
          available_seats: date.available_seats || date.seats_available || 0,
          waitlist_count: date.waitlist_count || date.seats_waitlist || 0,
          seats_remaining:
            (date.available_seats || date.seats_available || 0) > 10
              ? "10+"
              : (date.available_seats || date.seats_available || 0).toString(),
          original_price: date.original_price?.toString() || "0",
          discounted_price:
            date.discounted_price?.toString() ||
            date.original_price?.toString() ||
            "0",
          discount_percentage: date.discount_percentage?.toString() || "0",
          status: date.status || "available",
          is_blocked: date.is_blocked || date.status === "blocked",
          block_reason: date.block_reason,
          alert_threshold: date.alert_threshold || 5,
          last_synced_at: date.last_synced_at || date.updated_at,
          from_location: date.from_location,
          to_location: date.to_location,
          created_at: date.created_at,
          updated_at: date.updated_at,
        })) as AvailabilityDate[],
        total: response?.total || 0,
      };
    },
    enabled: !!selectedTripId,
  });

  // Delete availability date
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/availability/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      showToast(
        __("Availability date deleted successfully", "yatra"),
        "success",
      );
      setDeleteConfirm({ isOpen: false, date: null });
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to delete availability date", "yatra"),
        "error",
      );
    },
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get currency symbol
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      INR: "₹",
    };
    return symbols[currency] || currency;
  };

  // Get status badge variant
  const getStatusBadge = (status: string, isBlocked?: boolean) => {
    // Debug: Log the status values to help with debugging

    if (isBlocked) {
      return (
        <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {__("Blocked", "yatra")}
        </Badge>
      );
    }
    switch (status) {
      case "available":
        return (
          <Badge
            variant="success"
            className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          >
            {__("Available", "yatra")}
          </Badge>
        );
      case "limited":
        return (
          <Badge
            variant="warning"
            className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
          >
            {__("Limited", "yatra")}
          </Badge>
        );
      case "sold_out":
        return (
          <Badge
            variant="error"
            className="text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          >
            {__("Sold Out", "yatra")}
          </Badge>
        );
      case "closed":
        return (
          <Badge
            variant="outline"
            className="text-xs border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400"
          >
            {__("Closed", "yatra")}
          </Badge>
        );
      case "blocked":
        return (
          <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {__("Blocked", "yatra")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400">
            {__("Cancelled", "yatra")}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-xs border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400"
          >
            {status || "Unknown"}
          </Badge>
        );
    }
  };

  // Real-time sync function
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Refresh availability data
      await queryClient.invalidateQueries({ queryKey: ["availability"] });
      setLastSyncTime(new Date());
      showToast(
        __("Availability data synced successfully", "yatra"),
        "success",
      );
    } catch (error) {
      console.error("Sync failed:", error);
      showToast(__("Failed to sync availability data", "yatra"), "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const selectedTrip = tripsData?.trips.find((t) => t.id === selectedTripId);
  const availabilityErrorContext = availabilityError
    ? getErrorContext(availabilityError)
    : null;

  // Filter availability dates
  const filteredDates = useMemo(() => {
    if (!availabilityData?.dates) return [];

    let filtered = [...availabilityData.dates];

    // Filter by search term (date range or time)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (date) =>
          date.departure_date.includes(searchLower) ||
          date.arrival_date.includes(searchLower) ||
          date.departure_time?.toLowerCase().includes(searchLower) ||
          date.arrival_time?.toLowerCase().includes(searchLower) ||
          date.from_location?.toLowerCase().includes(searchLower) ||
          date.to_location?.toLowerCase().includes(searchLower),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((date) => date.status === statusFilter);
    }

    // Filter by month (only for multi-day trips)
    if (monthFilter !== "all" && selectedTrip?.trip_type !== "single_day") {
      const [year, month] = monthFilter.split("-");
      filtered = filtered.filter((date) => {
        const dateObj = new Date(date.departure_date);
        return (
          dateObj.getFullYear() === parseInt(year) &&
          dateObj.getMonth() === parseInt(month) - 1
        );
      });
    }

    return filtered;
  }, [availabilityData, searchTerm, statusFilter, monthFilter, selectedTrip]);

  // Get available months for filter (only for multi-day trips)
  const availableMonths = useMemo(() => {
    if (!availabilityData?.dates || selectedTrip?.trip_type === "single_day")
      return [];

    const months = new Set<string>();
    availabilityData.dates.forEach((date) => {
      const dateObj = new Date(date.departure_date);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
      months.add(monthKey);
    });

    return Array.from(months).sort();
  }, [availabilityData, selectedTrip]);

  // Calculate inventory alerts (after filteredDates is defined)
  const inventoryAlerts = useMemo(() => {
    if (!filteredDates || filteredDates.length === 0) return [];
    return filteredDates.filter((date) => {
      if (date.is_blocked) return false;
      const threshold = date.alert_threshold || 5;
      return date.available_seats <= threshold && date.available_seats > 0;
    });
  }, [filteredDates]);

  // Get waitlist entries
  const waitlistEntries = useMemo(() => {
    if (!filteredDates || filteredDates.length === 0) return [];
    return filteredDates.filter((date) => date.waitlist_count > 0);
  }, [filteredDates]);

  // Get blocked dates
  const blockedDates = useMemo(() => {
    if (!filteredDates || filteredDates.length === 0) return [];
    return filteredDates.filter((date) => date.is_blocked);
  }, [filteredDates]);

  // Status counts for bulk toolbar
  const statusCounts = useMemo(() => {
    const counts = {
      all: 0,
      available: 0,
      limited: 0,
      sold_out: 0,
      closed: 0,
      blocked: 0,
    };

    if (!availabilityData?.dates) return counts;

    availabilityData.dates.forEach((date) => {
      counts.all++;
      if (date.status === "available") counts.available++;
      else if (date.status === "limited") counts.limited++;
      else if (date.status === "sold_out") counts.sold_out++;
      else if (date.status === "closed") counts.closed++;
      else if (date.status === "blocked") counts.blocked++;
    });

    return counts;
  }, [availabilityData]);

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => apiClient.delete(`/availability/${id}`)),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      showToast(
        __("Selected availability dates deleted successfully", "yatra"),
        "success",
      );
      setSelectedIds([]);
      setBulkAction("");
    },
    onError: (error: any) => {
      showToast(
        error?.message ||
          __("Failed to delete selected availability dates", "yatra"),
        "error",
      );
    },
  });

  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(__("Select a bulk action first.", "yatra"), "warning");
      return;
    }

    if (selectedIds.length === 0) {
      showToast(
        __("Select at least one availability date.", "yatra"),
        "warning",
      );
      return;
    }

    if (bulkAction === "delete") {
      bulkDeleteMutation.mutate(selectedIds);
    } else {
      showToast(
        __("Unsupported bulk action for availability.", "yatra"),
        "warning",
      );
    }
  };

  const bulkStatusOptions = [
    { value: "delete", label: __("Delete Permanently", "yatra") },
  ];

  const totalFiltered = filteredDates.length;

  // Single delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    date: AvailabilityDate | null;
  }>({
    isOpen: false,
    date: null,
  });

  const [duplicateConfirm, setDuplicateConfirm] = useState<{
    isOpen: boolean;
    date: AvailabilityDate | null;
  }>({
    isOpen: false,
    date: null,
  });

  const [duplicateDepartureDate, setDuplicateDepartureDate] =
    useState<string>("");
  const [duplicateDepartureTime, setDuplicateDepartureTime] =
    useState<string>("");

  const duplicateMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      departure_date: string;
      departure_time?: string | null;
    }) => {
      return await apiClient.post(`/availability/${payload.id}/duplicate`, {
        departure_date: payload.departure_date,
        departure_time: payload.departure_time ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      showToast(
        __("Availability date duplicated successfully", "yatra"),
        "success",
      );
      setDuplicateConfirm({ isOpen: false, date: null });
      setDuplicateDepartureDate("");
      setDuplicateDepartureTime("");
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to duplicate availability date", "yatra"),
        "error",
      );
    },
  });

  // Table columns and actions for shared Table
  const tableColumns = useMemo(() => {
    const cols: {
      key: string;
      label: string;
      visible?: boolean;
      render?: (date: AvailabilityDate, index: number) => React.ReactNode;
    }[] = [];

    // Departure
    cols.push({
      key: "departure",
      label:
        selectedTrip?.trip_type === "single_day"
          ? __("Departure Time", "yatra")
          : __("Departure", "yatra"),
      visible: visibleColumns.departure,
      render: (date) =>
        selectedTrip?.trip_type === "single_day" ? (
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-sm font-medium">
                {formatDate(date.departure_date)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {date.departure_time ? formatTime(date.departure_time) : ""}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">
              {formatDate(date.departure_date)}
            </span>
          </div>
        ),
    });

    // Arrival
    cols.push({
      key: "arrival",
      label:
        selectedTrip?.trip_type === "single_day"
          ? __("Arrival Time", "yatra")
          : __("Arrival", "yatra"),
      visible: visibleColumns.arrival,
      render: (date) =>
        selectedTrip?.trip_type === "single_day" ? (
          <div>
            <div className="text-sm font-medium">
              {formatDate(date.arrival_date)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {date.arrival_time ? formatTime(date.arrival_time) : ""}
            </div>
          </div>
        ) : (
          <span className="text-sm">{formatDate(date.arrival_date)}</span>
        ),
    });

    // From/To
    cols.push({
      key: "locations",
      label: __("From/To", "yatra"),
      visible: visibleColumns.locations,
      render: (date) => (
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-3 h-3" />
          <span>{date.from_location || selectedTrip?.starting_location}</span>
          <span>→</span>
          <span>{date.to_location || selectedTrip?.ending_location}</span>
        </div>
      ),
    });

    // Capacity
    cols.push({
      key: "capacity",
      label: __("Capacity", "yatra"),
      visible: visibleColumns.capacity,
      render: (date) => (
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {date.total_seats || 0}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {__("total", "yatra")}
          </span>
        </div>
      ),
    });

    // Booked
    cols.push({
      key: "booked",
      label: __("Booked", "yatra"),
      visible: visibleColumns.booked,
      render: (date) => (
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
            {date.booked_seats || 0}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {__("booked", "yatra")}
          </span>
        </div>
      ),
    });

    // Available
    cols.push({
      key: "available",
      label: __("Available", "yatra"),
      visible: visibleColumns.available,
      render: (date) => (
        <div className="flex flex-col items-center">
          <span
            className={`text-sm font-semibold ${
              date.available_seats === 0
                ? "text-red-600 dark:text-red-400"
                : date.available_seats <= (date.alert_threshold || 5)
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-green-600 dark:text-green-400"
            }`}
          >
            {date.available_seats || 0}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {__("available", "yatra")}
          </span>
          {date.available_seats <= (date.alert_threshold || 5) &&
            date.available_seats > 0 && (
              <Bell className="w-3 h-3 text-yellow-500 mt-0.5" />
            )}
        </div>
      ),
    });

    // Waitlist
    cols.push({
      key: "waitlist",
      label: __("Waitlist", "yatra"),
      visible: visibleColumns.waitlist,
      render: (date) =>
        date.waitlist_count > 0 ? (
          <div className="flex flex-col items-center">
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-xs">
              {date.waitlist_count}
            </Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {__("people", "yatra")}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
        ),
    });

    // Price
    cols.push({
      key: "price",
      label: __("Price", "yatra"),
      visible: visibleColumns.price,
      render: (date) => (
        <div className="flex flex-col gap-1">
          {date.discounted_price &&
          parseFloat(date.discounted_price) <
            parseFloat(date.original_price) ? (
            <>
              <span className="text-sm line-through text-gray-400">
                {getCurrencySymbol(selectedTrip?.currency || "USD")}
                {parseFloat(date.original_price).toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {getCurrencySymbol(selectedTrip?.currency || "USD")}
                  {parseFloat(date.discounted_price).toLocaleString()}
                </span>
                {date.discount_percentage &&
                  parseFloat(date.discount_percentage) > 0 && (
                    <Badge variant="error" className="text-xs">
                      {date.discount_percentage}% {__("OFF", "yatra")}
                    </Badge>
                  )}
              </div>
            </>
          ) : (
            <span className="text-sm font-semibold">
              {getCurrencySymbol(selectedTrip?.currency || "USD")}
              {parseFloat(date.original_price).toLocaleString()}
            </span>
          )}
        </div>
      ),
    });

    // Status
    cols.push({
      key: "status",
      label: __("Status", "yatra"),
      visible: visibleColumns.status,
      render: (date) => (
        <div className="flex flex-col gap-1">
          {getStatusBadge(date.status, date.is_blocked)}
          {date.is_blocked && date.block_reason && (
            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
              {date.block_reason}
            </span>
          )}
          {date.last_synced_at && (
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{new Date(date.last_synced_at).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      ),
    });

    return cols;
  }, [
    selectedTrip,
    visibleColumns,
    getCurrencySymbol,
    formatDate,
    formatTime,
    getStatusBadge,
  ]);

  const tableActions = [
    {
      key: "edit",
      label: __("Edit", "yatra"),
      icon: <Edit className="w-4 h-4" />,
      onClick: (date: AvailabilityDate) =>
        navigate({
          subpage: "trips",
          tab: "availability",
          action: "edit",
          id: date.id,
        }),
    },
    {
      key: "duplicate",
      label: __("Duplicate", "yatra"),
      icon: <Copy className="w-4 h-4" />,
      onClick: (date: AvailabilityDate) => {
        setDuplicateConfirm({ isOpen: true, date });
        setDuplicateDepartureDate(date.departure_date || "");
        setDuplicateDepartureTime(date.departure_time || "");
      },
    },
    {
      key: "delete",
      label: __("Delete", "yatra"),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (date: AvailabilityDate) =>
        setDeleteConfirm({ isOpen: true, date }),
      variant: "destructive" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, date: null })}
        onConfirm={() => {
          if (deleteConfirm.date) {
            deleteMutation.mutate(deleteConfirm.date.id);
          }
        }}
        title={__("Delete Availability Date", "yatra")}
        message={
          deleteConfirm.date
            ? __(
                "Are you sure you want to delete this availability date on {date}? This action cannot be undone.",
                "yatra",
              ).replace("{date}", formatDate(deleteConfirm.date.departure_date))
            : __(
                "Are you sure you want to delete this availability date? This action cannot be undone.",
                "yatra",
              )
        }
        confirmText={__("Delete", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {duplicateConfirm.isOpen && duplicateConfirm.date && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ marginTop: "-32px" }}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!duplicateMutation.isPending) {
                setDuplicateConfirm({ isOpen: false, date: null });
              }
            }}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("Duplicate Availability Date", "yatra")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {__(
                  "Select the new departure date. Arrival/return will be shifted automatically.",
                  "yatra",
                )}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {__("Departure Date", "yatra")}
                </label>
                <DatePicker
                  value={duplicateDepartureDate}
                  onChange={(value: string) => setDuplicateDepartureDate(value)}
                  placeholder={__("Select date", "yatra")}
                />
              </div>

              {selectedTrip?.trip_type === "single_day" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__("Departure Time", "yatra")}
                  </label>
                  <TimePicker
                    value={duplicateDepartureTime}
                    onChange={(value: string) =>
                      setDuplicateDepartureTime(value)
                    }
                    placeholder={__("Select departure time", "yatra")}
                  />
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setDuplicateConfirm({ isOpen: false, date: null })
                }
                disabled={duplicateMutation.isPending}
              >
                {__("Cancel", "yatra")}
              </Button>
              <Button
                onClick={() => {
                  if (!duplicateConfirm.date) return;
                  if (!duplicateDepartureDate) {
                    showToast(
                      __("Please select a departure date", "yatra"),
                      "warning",
                    );
                    return;
                  }
                  duplicateMutation.mutate({
                    id: duplicateConfirm.date.id,
                    departure_date: duplicateDepartureDate,
                    departure_time:
                      selectedTrip?.trip_type === "single_day"
                        ? duplicateDepartureTime || null
                        : null,
                  });
                }}
                disabled={duplicateMutation.isPending}
              >
                {duplicateMutation.isPending
                  ? __("Duplicating...", "yatra")
                  : __("Duplicate", "yatra")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title={__("Availability Management", "yatra")}
        description={__(
          "Manage departure dates and availability for your trips. Add dates for this month or plan ahead for the entire year.",
          "yatra",
        )}
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
                "Choose a trip to manage its availability dates and departure schedules",
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
                ...(tripsData?.trips.map((trip) => ({
                  value: trip.id.toString(),
                  label: `${trip.title}${trip.trip_type === "single_day" ? " (Single Day)" : trip.trip_type === "multi_day" ? " (Multi-Day)" : ""}`,
                })) || []),
              ]}
              placeholder={__("Search or select a trip...", "yatra")}
              searchPlaceholder={__("Search by trip name or ID...", "yatra")}
              className="w-full"
              required
            />
          </div>

          {selectedTrip && (
            <div className="flex items-center gap-4 pt-2 border-t border-blue-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium">
                  {selectedTrip.starting_location}
                </span>
                <span className="text-gray-400">→</span>
                <span className="font-medium">
                  {selectedTrip.ending_location}
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
          )}

          {!selectedTripId && (
            <div className="mt-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200/50 dark:border-gray-700/50">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {__("Get Started", "yatra")}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {__(
                      "Select a trip from the dropdown above to view and manage its availability dates, pricing, and booking status.",
                      "yatra",
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedTripId && (
        <>
          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setTabMode("specific")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    tabMode === "specific"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <CalendarDays className="w-4 h-4 inline mr-2" />
                  {__("Specific Dates", "yatra")}
                </button>
                <button
                  onClick={() => setTabMode("recurring")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    tabMode === "recurring"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  {__("Recurring Rules", "yatra")}
                </button>
              </div>
            </div>
          </div>

          {/* Recurring Rules Tab Content */}
          {tabMode === "recurring" && (
            <RecurringRules
              tripId={selectedTripId}
              tripName={selectedTrip?.title}
              tripType={selectedTrip?.trip_type}
              onAddRule={() =>
                navigate({
                  subpage: "trips",
                  tab: "availability",
                  action: "create-rule",
                  trip_id: selectedTripId.toString(),
                })
              }
              onEditRule={(id: number) =>
                navigate({
                  subpage: "trips",
                  tab: "availability",
                  action: "edit-rule",
                  id: id.toString(),
                })
              }
            />
          )}

          {/* Specific Dates Tab Content */}
          {tabMode === "specific" && (
            <>
              {/* Action Buttons - Right Aligned */}
              {selectedTripId && (
                <div className="flex items-center justify-end gap-2 mb-4">
                  {/* View Toggle */}
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-none border-0"
                    >
                      <List className="w-4 h-4 mr-1" />
                      {__("List", "yatra")}
                    </Button>
                    <Button
                      variant={viewMode === "calendar" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("calendar")}
                      className="rounded-none border-0"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      {__("Calendar", "yatra")}
                    </Button>
                  </div>

                  {/* Sync Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                    title={
                      lastSyncTime
                        ? `Last synced: ${lastSyncTime.toLocaleTimeString()}`
                        : __("Sync availability", "yatra")
                    }
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
                    />
                    {__("Sync", "yatra")}
                  </Button>

                  {/* Add Availability Button */}
                  <Button
                    onClick={() =>
                      navigate({
                        subpage: "trips",
                        tab: "availability",
                        action: "create",
                        trip_id: selectedTripId.toString(),
                      })
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {__("Add Availability Date", "yatra")}
                  </Button>
                </div>
              )}

              {/* Inventory Alerts */}
              {showAlerts && inventoryAlerts.length > 0 && (
                <Alert
                  variant="warning"
                  className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10"
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start gap-3 flex-1">
                      <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-yellow-900 dark:text-yellow-200">
                            {__("Inventory Alerts", "yatra")}
                          </h4>
                          <Badge className="bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                            {inventoryAlerts.length}
                          </Badge>
                        </div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                          {__(
                            "The following dates have low availability (below threshold).",
                            "yatra",
                          )}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {inventoryAlerts.slice(0, 5).map((alert) => (
                            <Button
                              key={alert.id}
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate({
                                  subpage: "trips",
                                  tab: "availability",
                                  action: "edit",
                                  id: alert.id,
                                })
                              }
                              className="text-xs border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300"
                            >
                              {formatDate(alert.departure_date)}
                              {alert.departure_time &&
                                ` ${formatTime(alert.departure_time)}`}
                              <span className="ml-1 font-semibold">
                                ({alert.available_seats} {__("seats", "yatra")})
                              </span>
                            </Button>
                          ))}
                          {inventoryAlerts.length > 5 && (
                            <span className="text-xs text-yellow-700 dark:text-yellow-400 self-center">
                              +{inventoryAlerts.length - 5}{" "}
                              {__("more", "yatra")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAlerts(false)}
                      className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </Alert>
              )}

              {/* Waitlist Summary */}
              {waitlistEntries.length > 0 && (
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <CardTitle className="text-base">
                          {__("Waitlist", "yatra")}
                        </CardTitle>
                        <Badge className="bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                          {waitlistEntries.reduce(
                            (sum, entry) => sum + entry.waitlist_count,
                            0,
                          )}{" "}
                          {__("people", "yatra")}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate({
                            subpage: "trips",
                            tab: "availability",
                            action: "waitlist",
                            trip_id: selectedTripId.toString(),
                          })
                        }
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {__("View All", "yatra")}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {waitlistEntries.slice(0, 3).map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-800"
                        >
                          <div className="flex items-center gap-3">
                            <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatDate(entry.departure_date)}
                                {entry.departure_time &&
                                  ` ${formatTime(entry.departure_time)}`}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {entry.booked_seats}/{entry.total_seats}{" "}
                                {__("booked", "yatra")}
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                            {entry.waitlist_count} {__("on waitlist", "yatra")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Blocked Dates Summary */}
              {blockedDates.length > 0 && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <CardTitle className="text-base">
                          {__("Blocked Dates", "yatra")}
                        </CardTitle>
                        <Badge className="bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200">
                          {blockedDates.length}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {blockedDates.slice(0, 3).map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-800"
                        >
                          <div className="flex items-center gap-3">
                            <Ban className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatDate(entry.departure_date)}
                                {entry.departure_time &&
                                  ` ${formatTime(entry.departure_time)}`}
                              </div>
                              {entry.block_reason && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {__("Reason", "yatra")}: {entry.block_reason}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate({
                                subpage: "trips",
                                tab: "availability",
                                action: "edit",
                                id: entry.id,
                              })
                            }
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div
                    className={`grid grid-cols-1 ${selectedTrip?.trip_type === "single_day" ? "md:grid-cols-3" : "md:grid-cols-4"} gap-4`}
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__("Search", "yatra")}
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder={__(
                            "Search dates, locations...",
                            "yatra",
                          )}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__("Status", "yatra")}
                      </label>
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">{__("All Status", "yatra")}</option>
                        <option value="available">
                          {__("Available", "yatra")}
                        </option>
                        <option value="limited">
                          {__("Limited", "yatra")}
                        </option>
                        <option value="sold_out">
                          {__("Sold Out", "yatra")}
                        </option>
                        <option value="closed">{__("Closed", "yatra")}</option>
                        <option value="blocked">
                          {__("Blocked", "yatra")}
                        </option>
                      </Select>
                    </div>
                    {selectedTrip?.trip_type !== "single_day" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {__("Month", "yatra")}
                        </label>
                        <Select
                          value={monthFilter}
                          onChange={(e) => setMonthFilter(e.target.value)}
                        >
                          <option value="all">
                            {__("All Months", "yatra")}
                          </option>
                          {availableMonths.map((month) => {
                            const [year, monthNum] = month.split("-");
                            const date = new Date(
                              parseInt(year),
                              parseInt(monthNum) - 1,
                            );
                            return (
                              <option key={month} value={month}>
                                {date.toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                })}
                              </option>
                            );
                          })}
                        </Select>
                      </div>
                    )}
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("all");
                          setMonthFilter("all");
                        }}
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {__("Clear Filters", "yatra")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bulk actions toolbar for availability list (directly above table, no extra card background) */}
              <BulkActionToolbar
                selectedIds={selectedIds}
                bulkAction={bulkAction}
                setBulkAction={setBulkAction}
                onApply={handleBulkApply}
                onClearSelection={() => setSelectedIds([])}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                statusOptions={[
                  {
                    key: "all",
                    label: __("All", "yatra"),
                    count: statusCounts.all,
                  },
                  {
                    key: "available",
                    label: __("Available", "yatra"),
                    count: statusCounts.available,
                  },
                  {
                    key: "limited",
                    label: __("Limited", "yatra"),
                    count: statusCounts.limited,
                  },
                  {
                    key: "sold_out",
                    label: __("Sold Out", "yatra"),
                    count: statusCounts.sold_out,
                  },
                  {
                    key: "closed",
                    label: __("Closed", "yatra"),
                    count: statusCounts.closed,
                  },
                  {
                    key: "blocked",
                    label: __("Blocked", "yatra"),
                    count: statusCounts.blocked,
                  },
                ]}
                showColumnsDropdown={showColumnsDropdown}
                setShowColumnsDropdown={setShowColumnsDropdown}
                columnOptions={[
                  {
                    key: "departure",
                    label: __("Departure", "yatra"),
                    visible: visibleColumns.departure,
                  },
                  {
                    key: "arrival",
                    label: __("Arrival", "yatra"),
                    visible: visibleColumns.arrival,
                  },
                  {
                    key: "locations",
                    label: __("From/To", "yatra"),
                    visible: visibleColumns.locations,
                  },
                  {
                    key: "capacity",
                    label: __("Capacity", "yatra"),
                    visible: visibleColumns.capacity,
                  },
                  {
                    key: "booked",
                    label: __("Booked", "yatra"),
                    visible: visibleColumns.booked,
                  },
                  {
                    key: "available",
                    label: __("Available", "yatra"),
                    visible: visibleColumns.available,
                  },
                  {
                    key: "waitlist",
                    label: __("Waitlist", "yatra"),
                    visible: visibleColumns.waitlist,
                  },
                  {
                    key: "price",
                    label: __("Price", "yatra"),
                    visible: visibleColumns.price,
                  },
                  {
                    key: "status",
                    label: __("Status", "yatra"),
                    visible: visibleColumns.status,
                  },
                ]}
                onToggleColumn={(key) =>
                  toggleColumn(key as keyof typeof visibleColumns)
                }
                bulkMutationPending={bulkDeleteMutation.isPending}
                totalItems={totalFiltered}
                bulkActionOptions={bulkStatusOptions}
              />

              {/* Availability Dates List */}
              <Card>
                <CardHeader>
                  <CardTitle>{__("Availability Dates", "yatra")}</CardTitle>
                  <CardDescription>
                    {selectedTrip && (
                      <>
                        {__("Managing availability for", "yatra")}{" "}
                        <strong>{selectedTrip.title}</strong>
                        {filteredDates.length > 0 && (
                          <span className="ml-2">
                            ({filteredDates.length}{" "}
                            {selectedTrip?.trip_type === "single_day"
                              ? __("time slots", "yatra")
                              : __("dates", "yatra")}
                            )
                          </span>
                        )}
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {viewMode === "calendar" ? (
                    filteredDates.length === 0 ? (
                      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                        <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                        <p className="text-sm font-medium mb-1">
                          {__(
                            "No availability dates found for this trip.",
                            "yatra",
                          )}
                        </p>
                        <p className="text-xs">
                          {__(
                            "Try adjusting your filters or add a new availability date.",
                            "yatra",
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <AvailabilityCalendar
                          dates={filteredDates}
                          tripType={selectedTrip?.trip_type}
                          currency={selectedTrip?.currency || "USD"}
                          onDateClick={(date) => {
                            navigate({
                              subpage: "trips",
                              tab: "availability",
                              action: "edit",
                              id: date.id,
                            });
                          }}
                        />
                      </div>
                    )
                  ) : (
                    <SharedTable
                      data={filteredDates}
                      columns={tableColumns}
                      actions={tableActions}
                      isLoading={isLoading}
                      isError={!!availabilityError}
                      errorText={__("Error loading availability", "yatra")}
                      errorDescription={__(
                        "We couldn’t connect to the availability service. Please refresh or try again shortly.",
                        "We couldn’t connect to the availability service. Please refresh or try again shortly.",
                      )}
                      errorDetails={availabilityErrorContext?.details || ""}
                      errorRequestInfo={availabilityErrorContext?.requestInfo}
                      onRetry={() =>
                        queryClient.invalidateQueries({
                          queryKey: ["availability"],
                        })
                      }
                      emptyText={__(
                        "No availability dates found for this trip.",
                        "yatra",
                      )}
                      emptyDescription={__(
                        "Try adjusting your filters or add a new availability date.",
                        "yatra",
                      )}
                      selectedItemIds={selectedIds}
                      onSelectItem={(id, checked) => {
                        if (checked) {
                          setSelectedIds((prev) =>
                            Array.from(new Set([...prev, id as string])),
                          );
                        } else {
                          setSelectedIds((prev) =>
                            prev.filter((existingId) => existingId !== id),
                          );
                        }
                      }}
                      onSelectAll={(checked) => {
                        if (checked) {
                          setSelectedIds(filteredDates.map((d) => d.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      isAllSelected={
                        filteredDates.length > 0 &&
                        selectedIds.length === filteredDates.length
                      }
                      getItemId={(date: AvailabilityDate) => date.id}
                      getItemStatus={(date: AvailabilityDate) => date.status}
                      statusFilter={statusFilter}
                      skeletonRows={5}
                      capability="yatra_view_trips"
                    />
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Availability;
