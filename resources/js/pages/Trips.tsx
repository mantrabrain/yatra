/**
 * All Trips Page
 * Clean, minimal SaaS-style trips management page
 */

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Archive,
  Copy,
  ExternalLink,
  Calendar,
  Users,
  Activity,
  Route,
  FolderTree,
  TrendingUp,
  Plus,
  Search,
  X,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { __ } from "../lib/i18n";
import { usePermissions } from "../hooks/usePermissions";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { PageHeader } from "../components/common/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ConditionalRender } from "../components/ui/conditional-render";
import { Edit, Trash2 } from "lucide-react";
import { HelpText } from "../components/ui/help-text";
import { fetchSettings } from "../api/settings-api";
import { apiClient } from "../lib/api-client";
import { getErrorContext } from "../lib/errors";
import {
  buildYatraSinglePublicUrls,
  isWordPressPlainPermalink,
} from "../lib/frontend-permalink-urls";
import { useToast } from "../components/ui/toast";
import { generateSlug } from "../lib/slug";
import { getCurrencySymbol, getCurrency } from "../data/currencies";
import { Pagination } from "../components/shared/Pagination";
import { Table as SharedTable } from "../components/shared/Table";
import { BulkActionToolbar } from "../components/shared/BulkActionToolbar";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { Modal } from "../components/ui/modal";
import { useNavigate } from "../hooks/useNavigate";

interface Trip {
  id: number;
  title: string;
  slug: string;
  original_price?: number;
  discounted_price?: number;
  sale_price?: number;
  pricing_type?: "regular" | "traveler_based" | string;
  status: string;
  created_at: string;
  updated_at?: string;
  bookings_count?: number;
  featured?: boolean;
  trip_type?: "single_day" | "multi_day" | "flexible";
  featured_priority?: string;
  duration_days?: number;
  duration_nights?: number;
  min_travelers?: number;
  max_travelers?: number;
  countries?: string[];
  regions?: string[];
  featured_image_url?: string;
  availability_dates?: Array<{
    id: number;
    departure_date: string;
    seats_remaining?: number;
    status?: string;
  }>;
  attributes?: Record<number, any>;
  trip_category?: Array<{
    id: number;
    name: string;
    slug?: string;
    is_primary?: boolean;
    order?: number;
  }>;
  activity_types?: Array<{
    id: number;
    name: string;
    slug?: string;
    is_primary?: boolean;
    order?: number;
  }>;
  difficulty_level?: string;
  destinations?: Array<{
    id: number;
    name: string;
    slug?: string;
    is_primary?: boolean;
  }>;
  price_types?: Array<{
    id?: number;
    category_id: number;
    category_label?: string;
    category_slug?: string;
    original_price: number;
    discounted_price?: number | null;
    sale_price?: number | null;
    is_default?: boolean;
    min_quantity?: number;
    max_quantity?: number | null;
  }>;
  traveler_min_price?: number | null;
  traveler_max_price?: number | null;
}

const Trips: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState("");
  const [createTripError, setCreateTripError] = useState<string | null>(null);
  const [newTripSlug, setNewTripSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const queryClient = useQueryClient();
  const { can, isPro } = usePermissions();
  const { showToast } = useToast();
  const { navigate } = useNavigate();

  // Fetch global status counts (stable across filters)
  const { data: statsData } = useQuery({
    queryKey: ["trips-stats"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/trips/stats");
        return response;
      } catch (error) {
        return {
          all: 0,
          published: 0,
          draft: 0,
          review: 0,
          approved: 0,
          archived: 0,
          trash: 0,
        };
      }
    },
    enabled: can("yatra_view_trips"),
  });

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: 10,
      orderby: sortBy,
      order: sortOrder,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (statusFilter !== "all") {
      params.status = statusFilter;
    }

    return params;
  }, [searchTerm, statusFilter, sortBy, sortOrder, page]);

  // Fetch trips from API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["trips", queryParams],
    queryFn: async () => {
      const response = await apiClient.get("/trips", { params: queryParams });

      return response;
    },
    enabled: can("yatra_view_trips"),
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache (new name for cacheTime)
  });

  // Delete mutation (permanent delete)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/trips/${id}/permanent-delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips-stats"] });
      setIsDeleteDialogOpen(false);
      setTripToDelete(null);
      showToast(__("Trip deleted permanently.", "yatra"), "success");
    },
    onError: () => {
      showToast(
        __("Failed to delete trip. Please try again.", "yatra"),
        "error",
      );
    },
  });

  const createTripMutation = useMutation({
    mutationFn: async ({ title, slug }: { title: string; slug: string }) => {
      const trimmedTitle = title.trim();
      const trimmedSlug = slug.trim();
      const payload = {
        title: trimmedTitle,
        slug: trimmedSlug,
        status: "draft",
        trip_type: "multi_day",
      };
      const response = await apiClient.post("/trips", payload);
      return response?.data || response;
    },
    onSuccess: (data) => {
      showToast(
        __("Trip created as draft. Redirecting to builder...", "yatra"),
        "success",
      );
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips-stats"] });
      setIsCreateModalOpen(false);
      setNewTripTitle("");
      setNewTripSlug("");
      setIsSlugManuallyEdited(false);
      setCreateTripError(null);
      if (data?.id) {
        setTimeout(() => {
          window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&action=edit&id=${data.id}`;
        }, 600);
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        __("Failed to create trip. Please try again.", "yatra");
      setCreateTripError(message);
      showToast(message, "error");
    },
  });

  // List endpoint returns { data: Trip[], total, per_page }; meta.total / meta.per_page used by some collections.
  const r = data as Record<string, any> | undefined;
  const trips: Trip[] = Array.isArray(r?.data)
    ? r.data
    : Array.isArray(r?.data?.data)
      ? r.data.data
      : [];
  const total = Number(r?.meta?.total ?? r?.total ?? 0);
  const itemsPerPage = Number(r?.meta?.per_page ?? r?.per_page ?? 10) || 10;
  const totalPages = Math.ceil(total / itemsPerPage);
  const errorContext = getErrorContext(error);

  // Get difficulty level data for lookup
  const { data: difficultyLevelsData } = useQuery({
    queryKey: ["difficulty-levels-lookup"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/difficulty-levels", {
          params: { per_page: 100 },
        });
        return response.data || [];
      } catch (error) {
        console.error("Failed to load difficulty levels", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const difficultyLevels = useMemo(() => {
    return (difficultyLevelsData || []).reduce(
      (acc: Record<string, string>, level: any) => {
        if (level && level.id && level.name) {
          acc[level.id.toString()] = level.name;
        }
        return acc;
      },
      {},
    );
  }, [difficultyLevelsData]);

  const formatLabel = (value?: string | null) => {
    if (!value) return "";

    // Only show difficulty if it's a numeric ID that exists in the difficulty levels data
    if (value && /^\d+$/.test(value) && difficultyLevels[value]) {
      return difficultyLevels[value];
    }

    // Don't show anything for non-numeric or invalid values
    return "";
  };

  const summarizeDestinations = (trip: Trip) => {
    const names = (trip.destinations || [])
      .map((dest) => dest.name)
      .filter(Boolean);
    if (!names.length) return null;
    const summary = names.slice(0, 2).join(", ");
    const remaining = names.length - 2;
    return remaining > 0 ? `${summary} +${remaining}` : summary;
  };

  const summarizeActivities = (trip: Trip) => {
    const names = (trip.activity_types || [])
      .map((act) => act.name)
      .filter(Boolean);
    if (!names.length) return null;
    const summary = names.slice(0, 2).join(", ");
    const remaining = names.length - 2;
    return remaining > 0 ? `${summary} +${remaining}` : summary;
  };

  const summarizeCategories = (trip: Trip) => {
    const names = (trip.trip_category || [])
      .map((cat) => cat.name)
      .filter(Boolean);
    if (!names.length) return null;
    const summary = names.slice(0, 2).join(", ");
    const remaining = names.length - 2;
    return remaining > 0 ? `${summary} +${remaining}` : summary;
  };

  const summarizeTravelers = (trip: Trip) => {
    const { min_travelers, max_travelers } = trip;
    if (min_travelers && max_travelers) {
      return `${min_travelers}-${max_travelers} ${__("pax", "yatra")}`;
    }
    if (min_travelers) {
      return `${__("Min", "yatra")} ${min_travelers} ${__("pax", "yatra")}`;
    }
    if (max_travelers) {
      return `${__("Up to", "yatra")} ${max_travelers} ${__("pax", "yatra")}`;
    }
    return null;
  };

  const handleNewTripTitleChange = (value: string) => {
    setNewTripTitle(value);
    if (!isSlugManuallyEdited) {
      setNewTripSlug(generateSlug(value));
    }
  };

  const handleNewTripSlugChange = (value: string) => {
    if (!isSlugManuallyEdited) {
      setIsSlugManuallyEdited(true);
    }
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setNewTripSlug(sanitized);
  };

  const enableSlugEditing = () => {
    if (!isSlugManuallyEdited) {
      if (!newTripSlug.trim()) {
        setNewTripSlug(generateSlug(newTripTitle || "new-trip"));
      }
      setIsSlugManuallyEdited(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (trip: Trip) => {
    const currencyCode = defaultCurrency;
    const symbol = getCurrencySymbol(currencyCode);
    const currencyData = getCurrency(currencyCode);
    const decimals = currencyData?.decimalDigits ?? 2;

    const formatNumber = (value: number) =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);

    // Traveler-based pricing: show min - max range
    if (trip.pricing_type === "traveler_based") {
      let minPrice: number | null = null;
      let maxPrice: number | null = null;

      if (Array.isArray(trip.price_types) && trip.price_types.length > 0) {
        const pricesFromTypes = trip.price_types
          .map(
            (pt) =>
              pt.sale_price || pt.discounted_price || pt.original_price || 0,
          )
          .filter((val) => typeof val === "number" && val > 0);

        if (pricesFromTypes.length > 0) {
          minPrice = Math.min(...pricesFromTypes);
          maxPrice = Math.max(...pricesFromTypes);
        }
      } else {
        // List endpoint does not hydrate price_types; use backend-computed fields
        if (
          typeof trip.traveler_min_price === "number" &&
          trip.traveler_min_price > 0
        ) {
          minPrice = trip.traveler_min_price;
        }
        if (
          typeof trip.traveler_max_price === "number" &&
          trip.traveler_max_price > 0
        ) {
          maxPrice = trip.traveler_max_price;
        }
      }

      if (minPrice !== null && maxPrice !== null) {
        if (minPrice === maxPrice) {
          return `${symbol}${formatNumber(minPrice)} \n`;
        }
        return `${symbol}${formatNumber(minPrice)} - ${symbol}${formatNumber(maxPrice)}`;
      }
    }

    // Fallback / regular pricing: use sale_price, then discounted_price, then original_price
    const price =
      trip.sale_price || trip.discounted_price || trip.original_price || 0;

    if (!price) {
      return "-";
    }

    return `${symbol}${formatNumber(price)}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      publish: {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Published", "yatra"),
      },
      draft: {
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
        label: __("Draft", "yatra"),
      },
      archived: {
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        label: __("Archived", "yatra"),
      },
      review: {
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        label: __("Review", "yatra"),
      },
      approved: {
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        label: __("Approved", "yatra"),
      },
      trash: {
        className:
          "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        label: __("Trash", "yatra"),
      },
    };

    const statusInfo = statusMap[status] || {
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  const getTripTypeBadge = (
    tripType?: "single_day" | "multi_day" | "flexible",
  ) => {
    if (!tripType) return null;

    const typeMap: Record<string, { className: string; label: string }> = {
      single_day: {
        className:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
        label: __("Single Day", "yatra"),
      },
      multi_day: {
        className:
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
        label: __("Multi-Day", "yatra"),
      },
      flexible: {
        className:
          "bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400",
        label: __("Flexible", "yatra"),
      },
    };

    const typeInfo = typeMap[tripType] || {
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
      label: tripType,
    };

    return (
      <Badge className={`text-xs ${typeInfo.className}`}>
        {typeInfo.label}
      </Badge>
    );
  };

  const handleEdit = (trip: Trip) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&action=edit&id=${trip.id}`;
  };

  const handleDelete = (trip: Trip) => {
    setTripToDelete(trip);
    setIsDeleteDialogOpen(true);
  };

  // Fetch trip_base setting for permalink
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        const response = await fetchSettings();
        return response;
      } catch (error) {
        return null;
      }
    },
    enabled: can("manage_yatra"),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Global/default currency (fallbacks: window.yatraAdmin, settings, then USD)
  const defaultCurrency =
    (window as any)?.yatraAdmin?.currency ||
    (settings as any)?.default_currency ||
    "USD";

  const handleView = async (trip: Trip) => {
    const tripSlug = trip.slug || "";
    const { plainUrl, prettyUrl } = buildYatraSinglePublicUrls({
      entity: "trip",
      slug: tripSlug,
      bases: settings as Record<string, unknown> | null,
    });

    if (isWordPressPlainPermalink()) {
      if (!tripSlug) {
        showToast(__("Trip slug is missing", "yatra"), "error");
        return;
      }
      window.open(plainUrl, "_blank", "noopener,noreferrer");
      return;
    }

    let apiPermalink = (trip as any)?.permalink || (trip as any)?.url;

    if (!apiPermalink && trip.id) {
      try {
        const detail = await apiClient.get(`/trips/${trip.id}`);
        apiPermalink =
          (detail as any)?.permalink || (detail as any)?.url || apiPermalink;
      } catch (e) {
        // fall through to prettyUrl
      }
    }

    if (apiPermalink) {
      window.open(apiPermalink, "_blank", "noopener,noreferrer");
      return;
    }

    if (!tripSlug) {
      showToast(__("Trip slug is missing", "yatra"), "error");
      return;
    }

    window.open(prettyUrl, "_blank", "noopener,noreferrer");
  };

  const handleCreateTrip = () => {
    setIsCreateModalOpen(true);
    setCreateTripError(null);
    setNewTripTitle("");
    setNewTripSlug("");
    setIsSlugManuallyEdited(false);
  };

  const handleCreateTripConfirm = () => {
    const title = newTripTitle.trim();
    if (!title) {
      setCreateTripError(__("Trip title is required", "yatra"));
      return;
    }
    const slugBase = isSlugManuallyEdited ? newTripSlug : generateSlug(title);
    const slug = slugBase.trim();
    if (!slug) {
      setCreateTripError(__("Trip slug is required", "yatra"));
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setCreateTripError(
        __(
          "Slug can only contain lowercase letters, numbers, and hyphens",
          "yatra",
        ),
      );
      return;
    }
    setNewTripSlug(slug);
    createTripMutation.mutate({ title, slug });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("id");
    setSortOrder("desc");
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1 text-gray-600 dark:text-gray-300" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1 text-gray-600 dark:text-gray-300" />
    );
  };

  const hasFilters =
    searchTerm ||
    statusFilter !== "all" ||
    sortBy !== "id" ||
    sortOrder !== "desc";

  // Helper: update trip status, including required fields for backend validation
  const updateTripStatus = async (trip: Trip, status: string) => {
    await apiClient.put(`/trips/${trip.id}`, {
      status,
      title: trip.title,
      slug: trip.slug,
    });
    // After a status change, refresh both list and stats
    queryClient.invalidateQueries({ queryKey: ["trips"] });
    queryClient.invalidateQueries({ queryKey: ["trips-stats"] });
  };

  // Column visibility state with localStorage persistence
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    () => {
      const defaults = {
        trip: true,
        price: true,
        status: true,
        trip_type: true,
        duration: false,
        availability: true, // Availability status (has dates, seats)
        capacity: false, // Min/Max travelers
        countries: false,
        difficulty: false,
        attributes: false, // Custom attributes count
        // Control chips inside Trip column
        destinations: true,
        activities: true,
        categories: true,
        bookings: true,
        created: true,
        modified: false, // Last modified date
      };

      if (typeof window === "undefined") {
        return defaults;
      }

      const stored = window.localStorage.getItem("yatra-trips-visible-columns");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Record<string, boolean>;
          // Merge stored config with defaults so new columns (duration, countries, difficulty) default to true
          return { ...defaults, ...parsed };
        } catch {
          return defaults;
        }
      }
      return defaults;
    },
  );

  const toggleColumn = (columnKey: string) => {
    const updated = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey],
    };
    setVisibleColumns(updated);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "yatra-trips-visible-columns",
        JSON.stringify(updated),
      );
    }
  };

  const columnOptions = [
    { key: "trip", label: __("Trip", "yatra"), visible: visibleColumns.trip },
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
    {
      key: "trip_type",
      label: __("Trip Type", "yatra"),
      visible: visibleColumns.trip_type,
    },
    {
      key: "duration",
      label: __("Duration", "yatra"),
      visible: visibleColumns.duration,
    },
    {
      key: "countries",
      label: __("Countries", "yatra"),
      visible: visibleColumns.countries,
    },
    {
      key: "difficulty",
      label: __("Difficulty", "yatra"),
      visible: visibleColumns.difficulty,
    },
    {
      key: "availability",
      label: __("Availability", "yatra"),
      visible: visibleColumns.availability,
    },
    {
      key: "capacity",
      label: __("Capacity", "yatra"),
      visible: visibleColumns.capacity,
    },
    {
      key: "attributes",
      label: __("Attributes", "yatra"),
      visible: visibleColumns.attributes,
    },
    // These control which chips are shown inside the Trip column
    {
      key: "destinations",
      label: __("Destinations (chips)", "yatra"),
      visible: visibleColumns.destinations,
    },
    {
      key: "activities",
      label: __("Activities (chips)", "yatra"),
      visible: visibleColumns.activities,
    },
    {
      key: "categories",
      label: __("Categories (chips)", "yatra"),
      visible: visibleColumns.categories,
    },
    ...(isPro
      ? [
          {
            key: "bookings",
            label: __("Bookings", "yatra"),
            visible: visibleColumns.bookings,
          },
        ]
      : []),
    {
      key: "created",
      label: __("Created", "yatra"),
      visible: visibleColumns.created,
    },
    {
      key: "modified",
      label: __("Modified", "yatra"),
      visible: visibleColumns.modified,
    },
  ];

  // Selection helpers for shared table
  const isAllSelected = trips.length > 0 && selectedIds.length === trips.length;

  const handleSelectItem = (id: string | number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((existingId) => existingId !== id),
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(trips.map((trip: Trip) => trip.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Status counts for filter tabs (stable, from stats API)
  const statusCounts = useMemo(() => {
    if (statsData) {
      return {
        all: statsData.all ?? 0,
        publish: statsData.published ?? 0,
        draft: statsData.draft ?? 0,
        review: statsData.review ?? 0,
        approved: statsData.approved ?? 0,
        archived: statsData.archived ?? 0,
        trash: statsData.trash ?? 0,
      };
    }

    return {
      all: 0,
      publish: 0,
      draft: 0,
      review: 0,
      approved: 0,
      archived: 0,
      trash: 0,
    };
  }, [statsData]);

  const statusOptions = [
    { key: "all", label: __("All", "yatra"), count: statusCounts.all },
    {
      key: "publish",
      label: __("Published", "yatra"),
      count: statusCounts.publish,
    },
    { key: "draft", label: __("Draft", "yatra"), count: statusCounts.draft },
    { key: "review", label: __("Review", "yatra"), count: statusCounts.review },
    {
      key: "approved",
      label: __("Approved", "yatra"),
      count: statusCounts.approved,
    },
    {
      key: "archived",
      label: __("Archived", "yatra"),
      count: statusCounts.archived,
    },
    { key: "trash", label: __("Trash", "yatra"), count: statusCounts.trash },
  ];

  // Bulk action options (status + delete)
  const bulkActionOptions = useMemo(() => {
    // In Trash view: allow restore to Draft and permanent delete only
    if (statusFilter === "trash") {
      return [
        { value: "mark_draft", label: __("Restore to Draft", "yatra") },
        { value: "delete", label: __("Delete Permanently", "yatra") },
      ];
    }

    // Other views: normal status changes + move to trash + delete
    return [
      { value: "mark_publish", label: __("Mark as Published", "yatra") },
      { value: "mark_draft", label: __("Mark as Draft", "yatra") },
      { value: "mark_archived", label: __("Archive", "yatra") },
      { value: "mark_trash", label: __("Move to Trash", "yatra") },
      { value: "delete", label: __("Delete Permanently", "yatra") },
    ];
  }, [statusFilter]);

  // Bulk apply handler
  const handleBulkApply = async () => {
    if (!bulkAction || selectedIds.length === 0) return;

    const confirmMessages: Record<string, string> = {
      delete: __(
        "Are you sure you want to permanently delete {count} trip(s)? This cannot be undone.",
        "yatra",
      ).replace("{count}", selectedIds.length.toString()),
      mark_published: __("Mark {count} trip(s) as Published?", "yatra").replace(
        "{count}",
        selectedIds.length.toString(),
      ),
      mark_draft:
        statusFilter === "trash"
          ? __("Restore {count} trip(s) to Draft?", "yatra").replace(
              "{count}",
              selectedIds.length.toString(),
            )
          : __("Mark {count} trip(s) as Draft?", "yatra").replace(
              "{count}",
              selectedIds.length.toString(),
            ),
      mark_archived: __("Archive {count} trip(s)?", "yatra").replace(
        "{count}",
        selectedIds.length.toString(),
      ),
      mark_trash: __("Move {count} trip(s) to Trash?", "yatra").replace(
        "{count}",
        selectedIds.length.toString(),
      ),
    };

    const message = confirmMessages[bulkAction];
    if (message && !window.confirm(message)) return;

    try {
      if (bulkAction === "delete") {
        await Promise.all(
          selectedIds.map((id) =>
            apiClient.delete(`/trips/${id}/permanent-delete`),
          ),
        );
        showToast(__("Trips deleted permanently", "yatra"), "success");
      } else if (bulkAction.startsWith("mark_")) {
        const status = bulkAction.replace("mark_", "");
        // Only update trips that are currently loaded in this page
        const selectedTrips = trips.filter((trip: Trip) =>
          selectedIds.includes(trip.id),
        );
        await Promise.all(
          selectedTrips.map((trip: Trip) => updateTripStatus(trip, status)),
        );
        showToast(__("Trip status updated successfully", "yatra"), "success");
      }
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips-stats"] });
      setSelectedIds([]);
      setBulkAction("");
    } catch (error) {
      showToast(__("Bulk action failed", "yatra"), "error");
    }
  };

  // Columns configuration for shared table
  const columns = useMemo(() => {
    const cols: {
      key: string;
      label: string;
      sortable?: boolean;
      visible?: boolean;
      width?: string;
      render?: (trip: Trip, index: number) => React.ReactNode;
    }[] = [];

    cols.push({
      key: "title",
      label: __("Trip", "yatra"),
      sortable: true,
      visible: visibleColumns.trip,
      width: "w-[300px]",
      render: (trip: Trip) => {
        const editUrl = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&action=edit&id=${trip.id}`;
        return (
          <div className="flex items-start gap-3">
            {/* Featured Image Thumbnail */}
            {trip.featured_image_url ? (
              <img
                src={trip.featured_image_url}
                alt={trip.title}
                className="w-12 h-12 object-cover rounded flex-shrink-0"
              />
            ) : (
              <img
                src={`${(window as any).yatraAdmin?.siteUrl || ""}/wp-content/plugins/yatra/assets/images/trip-placeholder.svg`}
                alt={trip.title}
                className="w-12 h-12 object-cover rounded flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <a
                  href={editUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEdit(trip);
                  }}
                  className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-2 hover:underline truncate"
                >
                  {trip.title}
                </a>
                {can("yatra_view_trips") && trip.status !== "trash" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(trip);
                    }}
                    className="ml-1 inline-flex items-center justify-center rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                    title={__("View trip in new tab", "yatra")}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {trip.slug}
                <span className="ml-1 text-[11px] text-gray-400 dark:text-gray-500">
                  (ID: {trip.id})
                </span>
              </div>
              {(() => {
                const destinationLabel = summarizeDestinations(trip);
                const durationLabel = trip.duration_days
                  ? `${trip.duration_days}${__("d", "yatra")}${trip.duration_nights ? ` / ${trip.duration_nights}${__("n", "yatra")}` : ""}`
                  : null;
                const travelerLabel = summarizeTravelers(trip);
                const categoryLabel = summarizeCategories(trip);
                const activityLabel = summarizeActivities(trip);
                const difficultyLabel = formatLabel(trip.difficulty_level);
                const chips = [
                  destinationLabel &&
                    visibleColumns.destinations && {
                      key: "dest",
                      label: destinationLabel,
                      icon: Route,
                    },
                  durationLabel && {
                    key: "duration",
                    label: durationLabel,
                    icon: Calendar,
                  },
                  travelerLabel && {
                    key: "traveler",
                    label: travelerLabel,
                    icon: Users,
                  },
                  activityLabel &&
                    visibleColumns.activities && {
                      key: "activity",
                      label: activityLabel,
                      icon: Activity,
                    },
                  categoryLabel &&
                    visibleColumns.categories && {
                      key: "category",
                      label: categoryLabel,
                      icon: FolderTree,
                    },
                  difficultyLabel && {
                    key: "difficulty",
                    label: difficultyLabel,
                    icon: TrendingUp,
                  },
                ].filter(Boolean) as Array<{
                  key: string;
                  label: string;
                  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
                }>;
                if (!chips.length) return null;
                return (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {chips.map(({ key, label, icon: Icon }) => (
                      <span
                        key={`${trip.id}-${key}`}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 text-[11px]"
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
            {trip.featured_priority &&
              trip.featured_priority !== "none" &&
              isPro && (
                <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  {trip.featured_priority === "featured"
                    ? __("Featured", "yatra")
                    : trip.featured_priority === "new"
                      ? __("New", "yatra")
                      : trip.featured_priority === "limited"
                        ? __("Limited", "yatra")
                        : trip.featured_priority === "bestseller"
                          ? __("Bestseller", "yatra")
                          : trip.featured_priority}
                </Badge>
              )}
          </div>
        );
      },
    });

    cols.push({
      key: "price",
      label: __("Price", "yatra"),
      sortable: true,
      visible: visibleColumns.price,
      render: (trip: Trip) => (
        <span className="font-medium">{formatPrice(trip)}</span>
      ),
    });

    cols.push({
      key: "status",
      label: __("Status", "yatra"),
      sortable: true,
      visible: visibleColumns.status,
      render: (trip: Trip) => getStatusBadge(trip.status),
    });

    cols.push({
      key: "trip_type",
      label: __("Trip Type", "yatra"),
      sortable: true,
      visible: visibleColumns.trip_type,
      render: (trip: Trip) => getTripTypeBadge(trip.trip_type),
    });

    // Duration column (days / nights)
    cols.push({
      key: "duration",
      label: __("Duration", "yatra"),
      sortable: false,
      visible: visibleColumns.duration,
      render: (trip: Trip) => {
        if (!trip.duration_days && !trip.duration_nights) return null;
        const days = trip.duration_days
          ? `${trip.duration_days} ${__("days", "yatra")}`
          : "";
        const nights = trip.duration_nights
          ? `${trip.duration_nights} ${__("nights", "yatra")}`
          : "";
        const label = [days, nights].filter(Boolean).join(" / ");
        return (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {label}
          </span>
        );
      },
    });

    // Countries column
    cols.push({
      key: "countries",
      label: __("Countries", "yatra"),
      sortable: false,
      visible: visibleColumns.countries,
      render: (trip: Trip) => {
        const list = (trip.countries || []).filter(Boolean);
        if (!list.length) return null;
        return (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {list.join(", ")}
          </span>
        );
      },
    });

    // Difficulty column (from difficulty_level)
    cols.push({
      key: "difficulty",
      label: __("Difficulty", "yatra"),
      sortable: false,
      visible: visibleColumns.difficulty,
      render: (trip: Trip) => {
        // Only show difficulty if it's set and is a valid positive number
        const difficultyValue = trip.difficulty_level;
        if (
          !difficultyValue ||
          difficultyValue === "0" ||
          Number(difficultyValue) === 0
        )
          return null;
        const difficultyText = formatLabel(String(difficultyValue));
        if (!difficultyText) return null;
        return (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {difficultyText}
          </span>
        );
      },
    });

    // Availability column
    cols.push({
      key: "availability",
      label: __("Availability", "yatra"),
      sortable: false,
      visible: visibleColumns.availability,
      render: (trip: Trip) => {
        const dates = trip.availability_dates || [];
        if (!dates.length) {
          return (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {__("No dates", "yatra")}
            </span>
          );
        }
        const availableCount = dates.filter(d => d.status === 'available').length;
        return (
          <div className="text-sm">
            <div className="text-gray-700 dark:text-gray-300">
              {dates.length} {__("dates", "yatra")}
            </div>
            {availableCount > 0 && (
              <div className="text-xs text-green-600 dark:text-green-400">
                {availableCount} {__("available", "yatra")}
              </div>
            )}
          </div>
        );
      },
    });

    // Capacity column
    cols.push({
      key: "capacity",
      label: __("Capacity", "yatra"),
      sortable: false,
      visible: visibleColumns.capacity,
      render: (trip: Trip) => {
        if (!trip.min_travelers && !trip.max_travelers) return null;
        const min = trip.min_travelers || 0;
        const max = trip.max_travelers || 0;
        return (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {min}-{max} {__("travelers", "yatra")}
          </span>
        );
      },
    });

    // Attributes column
    cols.push({
      key: "attributes",
      label: __("Attributes", "yatra"),
      sortable: false,
      visible: visibleColumns.attributes,
      render: (trip: Trip) => {
        const attrCount = trip.attributes ? Object.keys(trip.attributes).length : 0;
        if (!attrCount) {
          return (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {__("None", "yatra")}
            </span>
          );
        }
        return (
          <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
            {attrCount} {__("attributes", "yatra")}
          </Badge>
        );
      },
    });

    if (isPro) {
      cols.push({
        key: "bookings",
        label: __("Bookings", "yatra"),
        sortable: false,
        visible: visibleColumns.bookings,
        render: (trip: Trip) => (
          <span className="text-gray-600 dark:text-gray-400">
            {trip.bookings_count || 0}
          </span>
        ),
      });
    }

    cols.push({
      key: "date",
      label: __("Created", "yatra"),
      sortable: true,
      visible: visibleColumns.created,
      render: (trip: Trip) => (
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {formatDate(trip.created_at)}
        </span>
      ),
    });

    // Modified column
    cols.push({
      key: "modified",
      label: __("Modified", "yatra"),
      sortable: true,
      visible: visibleColumns.modified,
      render: (trip: Trip) => {
        if (!trip.updated_at) return null;
        return (
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {formatDate(trip.updated_at)}
          </span>
        );
      },
    });

    return cols;
  }, [
    isPro,
    visibleColumns,
    summarizeDestinations,
    summarizeTravelers,
    summarizeCategories,
    formatLabel,
    formatPrice,
    getStatusBadge,
    getTripTypeBadge,
  ]);

  const navigateToAvailability = (trip: Trip) => {
    navigate({
      subpage: "trips",
      tab: "availability",
      trip_id: trip.id.toString(),
    });
  };

  const navigateToRecurringRules = (trip: Trip) => {
    navigate({
      subpage: "trips",
      tab: "availability",
      trip_id: trip.id.toString(),
      tab_mode: "recurring",
    });
  };

  // Row actions for shared table (3-dot menu)
  const tableActions = useMemo(() => {
    const actions: any[] = [];

    // View is available except for trash trips
    if (can("yatra_view_trips")) {
      actions.push({
        key: "view",
        label: __("View (frontend)", "yatra"),
        icon: <ExternalLink className="w-4 h-4" />,
        onClick: (trip: Trip) => handleView(trip),
        condition: (trip: Trip) => trip.status !== "trash", // Hide for trash trips
      });
    }

    // Availability / recurring quick links
    actions.push({
      key: "view-availability",
      label: __("View Availability", "yatra"),
      icon: <Calendar className="w-4 h-4" />,
      onClick: (trip: Trip) => navigateToAvailability(trip),
    });

    actions.push({
      key: "view-recurring",
      label: __("View Recurring Rules", "yatra"),
      icon: <RefreshCw className="w-4 h-4" />,
      onClick: (trip: Trip) => navigateToRecurringRules(trip),
    });

    // Edit available for all statuses
    if (can("yatra_edit_trips")) {
      actions.push({
        key: "edit",
        label: __("Edit", "yatra"),
        icon: <Edit className="w-4 h-4" />,
        onClick: (trip: Trip) => handleEdit(trip),
      });

      // Duplicate trip as draft
      actions.push({
        key: "duplicate",
        label: __("Duplicate", "yatra"),
        icon: <Copy className="w-4 h-4" />,
        onClick: async (trip: Trip) => {
          try {
            await apiClient.post(`/trips/${trip.id}/duplicate`);
            showToast(__("Trip duplicated as draft.", "yatra"), "success");
            queryClient.invalidateQueries({ queryKey: ["trips"] });
          } catch (error) {
            console.error("Failed to duplicate trip", error);
            showToast(__("Failed to duplicate trip.", "yatra"), "error");
          }
        },
      });

      // Status-based actions
      actions.push({
        key: "publish",
        label: __("Mark as Published", "yatra"),
        icon: <ArrowUp className="w-4 h-4" />,
        onClick: async (trip: Trip) => {
          await updateTripStatus(trip, "publish");
          showToast(__("Trip marked as published.", "yatra"), "success");
          queryClient.invalidateQueries({ queryKey: ["trips"] });
        },
        condition: (trip: Trip) =>
          trip.status !== "publish" && trip.status !== "trash",
      });

      actions.push({
        key: "draft",
        label: __("Mark as Draft", "yatra"),
        icon: <ArrowDown className="w-4 h-4" />,
        onClick: async (trip: Trip) => {
          await updateTripStatus(trip, "draft");
          showToast(__("Trip marked as draft.", "yatra"), "success");
          queryClient.invalidateQueries({ queryKey: ["trips"] });
        },
        condition: (trip: Trip) =>
          trip.status !== "draft" && trip.status !== "trash",
      });

      actions.push({
        key: "archive",
        label: __("Archive", "yatra"),
        icon: <Archive className="w-4 h-4" />,
        onClick: async (trip: Trip) => {
          await updateTripStatus(trip, "archived");
          showToast(__("Trip archived.", "yatra"), "success");
          queryClient.invalidateQueries({ queryKey: ["trips"] });
        },
        condition: (trip: Trip) =>
          trip.status !== "archived" && trip.status !== "trash",
      });

      actions.push({
        key: "trash",
        label: __("Move to Trash", "yatra"),
        icon: <Trash2 className="w-4 h-4" />,
        onClick: async (trip: Trip) => {
          await updateTripStatus(trip, "trash");
          showToast(__("Trip moved to trash.", "yatra"), "success");
          queryClient.invalidateQueries({ queryKey: ["trips"] });
        },
        condition: (trip: Trip) => trip.status !== "trash",
      });

      actions.push({
        key: "restore",
        label: __("Restore to Draft", "yatra"),
        icon: <ArrowUp className="w-4 h-4" />,
        onClick: async (trip: Trip) => {
          await updateTripStatus(trip, "draft");
          showToast(__("Trip restored to draft.", "yatra"), "success");
          queryClient.invalidateQueries({ queryKey: ["trips"] });
        },
        condition: (trip: Trip) => trip.status === "trash",
      });
    }

    // Permanent delete for all trips (admin should be able to delete any trip)
    if (can("yatra_delete_trips")) {
      actions.push({
        key: "delete",
        label: __("Delete Permanently", "yatra"),
        icon: <Trash2 className="w-4 h-4" />,
        onClick: (trip: Trip) => handleDelete(trip),
        variant: "destructive" as const,
        condition: () => true, // Show for all trips
      });
    }

    return actions;
  }, [can, queryClient, showToast]);

  return (
    <>
      <div className="space-y-3">
        <PageHeader
          title={__("All Trips", "yatra")}
          description={__(
            "Manage your travel packages and tours. Create, edit, and organize all your trips in one place.",
            "yatra",
          )}
          actionCapability="yatra_edit_trips"
          actions={
            <div className="flex items-center gap-2">
              {/* DEBUG: Refresh button */}
              {(window as any).WP_DEBUG && (
                <Button
                  onClick={() => {
                    refetch();
                  }}
                  variant="outline"
                  className="text-xs"
                >
                  {__("Refresh Data", "yatra")}
                </Button>
              )}
              <Button
                onClick={handleCreateTrip}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {__("Add New Trip", "yatra")}
              </Button>
            </div>
          }
        />

        {/* Filters, Search, and Sorting - Always Visible */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-3">
              <HelpText
                text={__(
                  "Use the search box to find trips by name. Use filters to show only published, draft, or other status trips. Click column headers to sort.",
                  "yatra",
                )}
              />
            </div>
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center w-full">
              {/* Search */}
              <div className="flex-1 min-w-0 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder={__("Search by trip name...", "yatra")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                  title={__("Type to search for trips by name", "yatra")}
                />
              </div>

              {/* Status Filter */}
              <div className="w-full lg:w-auto lg:min-w-[160px]">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full"
                >
                  <option value="all">{__("All Status", "yatra")}</option>
                  <option value="publish">{__("Published", "yatra")}</option>
                  <option value="draft">{__("Draft", "yatra")}</option>
                  <option value="review">{__("Review", "yatra")}</option>
                  <option value="approved">{__("Approved", "yatra")}</option>
                  <option value="archived">{__("Archived", "yatra")}</option>
                  <option value="trash">{__("Trash", "yatra")}</option>
                </Select>
              </div>

              {/* Sort By */}
              <div className="w-full lg:w-auto lg:min-w-[140px]">
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full"
                >
                  <option value="title">{__("Title", "yatra")}</option>
                  <option value="price">{__("Price", "yatra")}</option>
                  <option value="date">{__("Date", "yatra")}</option>
                  <option value="status">{__("Status", "yatra")}</option>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="w-full lg:w-auto lg:flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-4 flex items-center gap-2 w-full lg:w-auto"
                  title={
                    sortOrder === "asc"
                      ? __("Ascending", "yatra")
                      : __("Descending", "yatra")
                  }
                >
                  {sortOrder === "asc" ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                  <span className="text-sm whitespace-nowrap">
                    {sortOrder === "asc"
                      ? __("Asc", "yatra")
                      : __("Desc", "yatra")}
                  </span>
                </Button>
              </div>

              {/* Reset Button */}
              {hasFilters && (
                <div className="w-full lg:w-auto lg:flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="flex items-center gap-2 w-full lg:w-auto"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-sm">{__("Reset", "yatra")}</span>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <ConditionalRender capability="yatra_view_trips">
          {/* Bulk Actions & Column Visibility */}
          {!error && (
            <BulkActionToolbar
              selectedIds={selectedIds}
              bulkAction={bulkAction}
              setBulkAction={setBulkAction}
              onApply={handleBulkApply}
              onClearSelection={() => setSelectedIds([])}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              statusOptions={statusOptions}
              showColumnsDropdown={showColumnsDropdown}
              setShowColumnsDropdown={setShowColumnsDropdown}
              columnOptions={columnOptions}
              onToggleColumn={toggleColumn}
              bulkMutationPending={false}
              totalItems={total}
              bulkActionOptions={bulkActionOptions}
            />
          )}

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <SharedTable
                data={trips}
                columns={columns}
                actions={tableActions}
                isLoading={isLoading}
                isError={!!error}
                errorText={__("Error Loading Trips", "yatra")}
                errorDescription={__(
                  "We couldn’t connect to the trips service. Please refresh or try again shortly.",
                  "We couldn’t connect to the trips service. Please refresh or try again shortly.",
                )}
                onRetry={() =>
                  queryClient.invalidateQueries({ queryKey: ["trips"] })
                }
                errorDetails={errorContext.details}
                errorRequestInfo={errorContext.requestInfo}
                emptyText={
                  searchTerm || statusFilter !== "all"
                    ? __("No trips match your search", "yatra")
                    : __("No trips yet", "yatra")
                }
                emptyDescription={
                  searchTerm || statusFilter !== "all"
                    ? __(
                        "Try adjusting your search or filters to see more results.",
                        "yatra",
                      )
                    : __(
                        "Get started by creating your first travel package. Click the button above to add a new trip.",
                        "yatra",
                      )
                }
                onCreateClick={
                  !searchTerm && statusFilter === "all"
                    ? handleCreateTrip
                    : undefined
                }
                onSort={handleSort}
                getSortIcon={getSortIcon}
                selectedItemIds={selectedIds}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                isAllSelected={isAllSelected}
                getItemId={(trip: Trip) => trip.id}
              />
            </CardContent>
          </Card>

          {/* Pagination - Always Visible */}
          {total > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
                itemName={__("trips", "yatra")}
              />
            </div>
          )}
        </ConditionalRender>
      </div>

      {/* Create Trip Modal - Using same Modal component as Discounts */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!createTripMutation.isPending) {
            setIsCreateModalOpen(false);
            setCreateTripError(null);
          }
        }}
        title={__("Create New Trip", "yatra")}
        description={__(
          "Give your trip a name and URL. We'll create a draft and take you to the trip builder.",
          "yatra",
        )}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!createTripMutation.isPending) {
                  setIsCreateModalOpen(false);
                  setCreateTripError(null);
                }
              }}
              disabled={createTripMutation.isPending}
            >
              {__("Cancel", "yatra")}
            </Button>
            <Button
              onClick={handleCreateTripConfirm}
              className="flex items-center gap-2"
              disabled={createTripMutation.isPending}
            >
              {createTripMutation.isPending && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {createTripMutation.isPending
                ? __("Creating…", "yatra")
                : __("Create & Continue", "yatra")}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              {__("Trip Title", "yatra")}
              <span className="text-red-500">*</span>
            </label>
            <Input
              value={newTripTitle}
              onChange={(e) => handleNewTripTitleChange(e.target.value)}
              placeholder={__("e.g., Bali Beach Retreat", "yatra")}
              disabled={createTripMutation.isPending}
              className="text-base"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {__(
                "A catchy title that describes your trip. Recommended: 50-60 characters for best SEO results.",
                "yatra",
              )}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                {__("Trip URL", "yatra")}
                <span className="text-red-500">*</span>
                <span className="text-[10px] font-normal text-gray-400">
                  {__("(URL friendly)", "yatra")}
                </span>
              </label>
              {!isSlugManuallyEdited && (
                <button
                  type="button"
                  onClick={enableSlugEditing}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {__("Customize URL", "yatra")}
                </button>
              )}
            </div>
            <Input
              value={newTripSlug}
              onChange={(e) => handleNewTripSlugChange(e.target.value)}
              placeholder={__("bali-beach-retreat", "yatra")}
              disabled={createTripMutation.isPending}
              readOnly={!isSlugManuallyEdited}
              className={`font-mono text-sm ${!isSlugManuallyEdited ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed" : ""}`}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isSlugManuallyEdited
                ? __(
                    "Editing slug manually. Keep it short, lowercase, and hyphen-separated.",
                    "yatra",
                  )
                : __(
                    'Auto-generated from the title. Click "Customize URL" if you need a custom slug.',
                    "yatra",
                  )}
            </p>
            {(newTripSlug || newTripTitle) && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {__("Preview:", "yatra")}
                </p>
                <p className="text-xs text-gray-900 dark:text-white font-mono break-all">
                  {(window as any).yatraAdmin?.siteUrl || "https://example.com"}
                  /trips/{newTripSlug || generateSlug(newTripTitle)}
                </p>
              </div>
            )}
          </div>

          {createTripError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {createTripError}
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Permanent Delete Confirmation (for Trash only) */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen && !!tripToDelete}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setIsDeleteDialogOpen(false);
            setTripToDelete(null);
          }
        }}
        onConfirm={() => {
          if (tripToDelete && !deleteMutation.isPending) {
            deleteMutation.mutate(tripToDelete.id);
          }
        }}
        title={__("Delete Trip Permanently", "yatra")}
        message={
          tripToDelete
            ? __(
                'Are you sure you want to permanently delete "{title}"? This cannot be undone and will remove all associated bookings.',
                "yatra",
              ).replace("{title}", tripToDelete.title)
            : ""
        }
        confirmText={__("Delete Permanently", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};

export default Trips;
