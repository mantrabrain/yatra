/**
 * Destinations Page
 * Clean, minimal SaaS-style destinations management page
 */

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
} from "lucide-react";
import {
  Pagination,
  SearchFilterToolbar,
  BulkActionToolbar,
  Table as SharedTable,
} from "../components/shared";
import { getDefaultBulkStatusOptions } from "../components/shared/bulkStatusOptions";
import { __ } from "../lib/i18n";
import { usePermissions } from "../hooks/usePermissions";
import { useToast } from "../components/ui/toast";
import { fetchSettings } from "../api/settings-api";
import { apiClient } from "../lib/api-client";
import { getErrorContext } from "../lib/errors";
import {
  buildYatraSinglePublicUrls,
  isWordPressPlainPermalink,
} from "../lib/frontend-permalink-urls";
import { Button } from "../components/ui/button";
import { PageHeader } from "../components/common/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { ConditionalRender } from "../components/ui/conditional-render";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { IconSelector } from "../components/ui/icon-selector";
import type { IconPickerValue } from "../components/ui/icon-picker";

interface Destination {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  icon?: IconPickerValue | null;
  status: string;
  trip_count?: number;
  metadata?: {
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  created_by_name?: string;
  updated_by_name?: string;
}

const Destinations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const defaultColumns = {
      name: true,
      description: true,
      trips: true,
      status: true,
      seo_title: false,
      seo_description: false,
      seo_keywords: false,
      created_at: false,
      updated_at: false,
      created_by_name: false,
      updated_by_name: false,
    };
    const saved = localStorage.getItem("yatra_destinations_visible_columns_v2");
    return saved ? { ...defaultColumns, ...JSON.parse(saved) } : defaultColumns;
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    destination: Destination | null;
  }>({
    isOpen: false,
    destination: null,
  });
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest("[data-columns-trigger]") &&
        !target.closest("[data-columns-content]")
      ) {
        setShowColumnsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Fetch status counts from API
  const { data: statsData } = useQuery({
    queryKey: ["destinations-stats"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/destinations/stats");
        return response;
      } catch (error: any) {
        return { all: 0, publish: 0, draft: 0, trash: 0 };
      }
    },
    enabled: can("yatra_view_trips"),
  });

  // Fetch destinations from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["destinations", queryParams],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/destinations", {
          params: queryParams,
        });
        return response;
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to load destinations", "yatra"),
          "error",
        );
        throw error;
      }
    },
    enabled: can("yatra_view_trips"),
  });

  // Fetch settings for permalink handling
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return await apiClient.delete(`/destinations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      queryClient.invalidateQueries({ queryKey: ["destinations-stats"] });
      showToast(__("Destination deleted successfully", "yatra"), "success");
      setDeleteConfirm({ isOpen: false, destination: null });
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to delete destination", "yatra"),
        "error",
      );
    },
  });

  const destinations = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);
  const errorContext = getErrorContext(error);

  const handleEdit = (destination: Destination) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=destinations&action=edit&id=${destination.id}`;
  };

  const handleView = async (destination: Destination) => {
    const destinationSlug = destination.slug || "";
    const { plainUrl, prettyUrl } = buildYatraSinglePublicUrls({
      entity: "destination",
      slug: destinationSlug,
      bases: settings as Record<string, unknown> | null,
    });

    if (isWordPressPlainPermalink()) {
      if (!destinationSlug) {
        showToast(__("Destination slug is missing", "yatra"), "error");
        return;
      }
      window.open(plainUrl, "_blank", "noopener,noreferrer");
      return;
    }

    let apiPermalink =
      (destination as any)?.permalink || (destination as any)?.url;

    if (!apiPermalink && destination.id) {
      try {
        const detail = await apiClient.get(`/destinations/${destination.id}`);
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

    if (!destinationSlug) {
      showToast(__("Destination slug is missing", "yatra"), "error");
      return;
    }

    window.open(prettyUrl, "_blank", "noopener,noreferrer");
  };

  const handleDelete = (destination: Destination) => {
    setDeleteConfirm({ isOpen: true, destination });
  };

  const confirmDelete = () => {
    if (deleteConfirm.destination) {
      deleteMutation.mutate(deleteConfirm.destination.id);
    }
  };

  const handleCreateDestination = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=destinations&action=create`;
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
      setSortOrder(field === "id" ? "desc" : "asc");
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

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey as keyof typeof visibleColumns],
    };
    
    // DEBUG: Log column visibility changes
    console.log('YATRA DEBUG: Destinations Column toggle -', columnKey, 'from', visibleColumns[columnKey], 'to', newVisibleColumns[columnKey]);
    
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem(
      "yatra_destinations_visible_columns_v2",
      JSON.stringify(newVisibleColumns),
    );
  };

  // Status counts from stats API
  const statusCounts = useMemo(() => {
    if (statsData) {
      return {
        all: statsData.all ?? 0,
        publish: statsData.publish ?? 0,
        draft: statsData.draft ?? 0,
        trash: statsData.trash ?? 0,
      };
    }
    return {
      all: 0,
      publish: 0,
      draft: 0,
      trash: 0,
    };
  }, [statsData]);

  // Bulk actions mutation
  const bulkMutation = useMutation({
    mutationFn: async ({
      action,
      ids,
    }: {
      action: string;
      ids: (string | number)[];
    }) => {
      return await apiClient.post("/destinations/bulk", { action, ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      queryClient.invalidateQueries({ queryKey: ["destinations-stats"] });
      showToast(__("Bulk action completed successfully", "yatra"), "success");
      setSelectedIds([]);
      setBulkAction("");
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to perform bulk action", "yatra"),
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
      showToast(__("Select at least one destination.", "yatra"), "warning");
      return;
    }

    // Execute bulk action (confirmation is now handled in BulkActionToolbar)
    bulkMutation.mutate({ action: bulkAction, ids: selectedIds });
  };

  const viewFilters = [
    { key: "all", label: __("All", "yatra"), count: statusCounts.all ?? 0 },
    {
      key: "publish",
      label: __("Published", "yatra"),
      count: statusCounts.publish ?? 0,
    },
    {
      key: "draft",
      label: __("Draft", "yatra"),
      count: statusCounts.draft ?? 0,
    },
    {
      key: "trash",
      label: __("Trash", "yatra"),
      count: statusCounts.trash ?? 0,
    },
  ];

  const hasFilters =
    searchTerm ||
    statusFilter !== "all" ||
    sortBy !== "id" ||
    sortOrder !== "desc";

  return (
    <div className="space-y-3">
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, destination: null })}
        onConfirm={confirmDelete}
        title={__("Delete Destination", "yatra")}
        message={
          deleteConfirm.destination
            ? __(
                'Are you sure you want to delete "{name}"? This action cannot be undone.',
                "yatra",
              ).replace("{name}", deleteConfirm.destination.name)
            : __(
                "Are you sure you want to delete this destination? This action cannot be undone.",
                "yatra",
              )
        }
        confirmText={__("Delete", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <PageHeader
        title={__("Destinations", "yatra")}
        description={__("Manage your travel destinations", "yatra")}
        actionCapability="yatra_edit_trips"
        actions={
          <Button
            onClick={handleCreateDestination}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {__("Add New Destination", "yatra")}
          </Button>
        }
      />

      {/* Filters, Search, and Sorting - Always Visible */}
      <Card>
        <CardContent className="p-3">
          <SearchFilterToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setPage(1);
              setSelectedIds([]);
              setBulkAction("");
            }}
            statusOptions={[
              { value: "all", label: __("All Status", "yatra") },
              { value: "publish", label: __("Published", "yatra") },
              { value: "draft", label: __("Draft", "yatra") },
              { value: "trash", label: __("Trash", "yatra") },
            ]}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            sortOptions={[
              { value: "name", label: __("Name", "yatra") },
              { value: "status", label: __("Status", "yatra") },
              { value: "created_at", label: __("Created At", "yatra") },
              { value: "updated_at", label: __("Updated At", "yatra") },
            ]}
            onResetFilters={handleResetFilters}
            hasFilters={!!hasFilters}
            placeholder={__("Search destinations...", "yatra")}
          />
        </CardContent>
      </Card>

      {!error && (
        <BulkActionToolbar
          selectedIds={selectedIds}
          bulkAction={bulkAction}
          setBulkAction={setBulkAction}
          onApply={handleBulkApply}
          onClearSelection={() => setSelectedIds([])}
          statusFilter={statusFilter}
          setStatusFilter={(value) => {
            setStatusFilter(value);
            setPage(1);
            setSelectedIds([]);
            setBulkAction("");
          }}
          statusOptions={viewFilters}
          showColumnsDropdown={showColumnsDropdown}
          setShowColumnsDropdown={setShowColumnsDropdown}
          columnOptions={[
            {
              key: "name",
              label: __("Destination", "yatra"),
              visible: visibleColumns.name,
            },
            {
              key: "description",
              label: __("Description", "yatra"),
              visible: visibleColumns.description,
            },
            {
              key: "trips",
              label: __("Trips", "yatra"),
              visible: visibleColumns.trips,
            },
            {
              key: "seo_title",
              label: __("SEO Title", "yatra"),
              visible: visibleColumns.seo_title,
            },
            {
              key: "seo_description",
              label: __("SEO Description", "yatra"),
              visible: visibleColumns.seo_description,
            },
            {
              key: "seo_keywords",
              label: __("SEO Keywords", "yatra"),
              visible: visibleColumns.seo_keywords,
            },
            {
              key: "status",
              label: __("Status", "yatra"),
              visible: visibleColumns.status,
            },
            {
              key: "created_at",
              label: __("Created Date", "yatra"),
              visible: visibleColumns.created_at,
            },
            {
              key: "updated_at",
              label: __("Updated Date", "yatra"),
              visible: visibleColumns.updated_at,
            },
            {
              key: "created_by_name",
              label: __("Created By", "yatra"),
              visible: visibleColumns.created_by_name,
            },
            {
              key: "updated_by_name",
              label: __("Updated By", "yatra"),
              visible: visibleColumns.updated_by_name,
            },
          ]}
          onToggleColumn={toggleColumn}
          bulkMutationPending={bulkMutation.isPending}
          totalItems={destinations.length}
          bulkActionOptions={getDefaultBulkStatusOptions(statusFilter)}
        />
      )}

      <ConditionalRender capability="yatra_view_trips">
        <>
          <Card className="overflow-visible">
            <CardContent className="p-0 overflow-visible">
              <SharedTable
                key={`destinations-table-${JSON.stringify(visibleColumns)}`}
                data={destinations}
                columns={useMemo(() => [
                  {
                    key: "name",
                    label: __("Destination", "yatra"),
                    sortable: true,
                    visible: visibleColumns.name,
                    render: (destination: Destination) => (
                      <div className="flex items-center gap-3">
                        {/* Icon/Image */}
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          {destination.icon ? (
                            destination.icon.type === "image" ? (
                              <img
                                src={destination.icon.value}
                                alt={destination.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <IconSelector
                                iconName={destination.icon.value}
                                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                              />
                            )
                          ) : (
                            <div className="w-5 h-5 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-semibold">
                              {destination.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {/* Text */}
                        <div>
                          <div className="flex items-center gap-1">
                            <a
                              href={`${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=destinations&action=edit&id=${destination.id}`}
                              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer"
                            >
                              {destination.name}
                            </a>
                            {can("yatra_view_trips") &&
                              destination.status !== "trash" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleView(destination);
                                  }}
                                  className="ml-1 inline-flex items-center justify-center rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                                  title={__(
                                    "View destination in new tab",
                                    "yatra",
                                  )}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <span>{destination.slug}</span>
                            <span className="text-[11px] text-gray-400 dark:text-gray-500">
                              ({__("ID:", "yatra")} {destination.id})
                            </span>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "trips",
                    label: __("Trips", "yatra"),
                    sortable: false,
                    visible: visibleColumns.trips,
                    render: (destination: Destination) => (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {typeof destination.trip_count === "number"
                          ? destination.trip_count
                          : 0}
                      </span>
                    ),
                  },
                  {
                    key: "description",
                    label: __("Description", "yatra"),
                    visible: visibleColumns.description,
                    render: (destination: Destination) => (
                      <span
                        className={`block max-w-[300px] truncate ${
                          destination.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                        title={destination.description || ""}
                      >
                        {destination.description ||
                          __("No description", "yatra")}
                      </span>
                    ),
                  },
                  {
                    key: "seo_title",
                    label: __("SEO Title", "yatra"),
                    visible: visibleColumns.seo_title,
                    render: (destination: Destination) => (
                      <span
                        className={
                          destination.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }
                      >
                        {destination.metadata?.seo_title || __("Not set", "yatra")}
                      </span>
                    ),
                  },
                  {
                    key: "seo_description",
                    label: __("SEO Description", "yatra"),
                    visible: visibleColumns.seo_description,
                    render: (destination: Destination) => (
                      <span
                        className={
                          destination.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }
                        title={destination.metadata?.seo_description || ""}
                      >
                        {destination.metadata?.seo_description 
                          ? (destination.metadata.seo_description.length > 50 
                              ? destination.metadata.seo_description.substring(0, 50) + "..."
                              : destination.metadata.seo_description)
                          : __("Not set", "yatra")}
                      </span>
                    ),
                  },
                  {
                    key: "seo_keywords",
                    label: __("SEO Keywords", "yatra"),
                    visible: visibleColumns.seo_keywords,
                    render: (destination: Destination) => (
                      <span
                        className={
                          destination.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }
                        title={destination.metadata?.seo_keywords || ""}
                      >
                        {destination.metadata?.seo_keywords 
                          ? (destination.metadata.seo_keywords.length > 30 
                              ? destination.metadata.seo_keywords.substring(0, 30) + "..."
                              : destination.metadata.seo_keywords)
                          : __("Not set", "yatra")}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    label: __("Status", "yatra"),
                    sortable: true,
                    visible: visibleColumns.status,
                    render: (destination: Destination) => (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          destination.status === "trash" ||
                          statusFilter === "trash"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : destination.status === "publish"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {destination.status === "trash" ||
                        statusFilter === "trash"
                          ? __("Trash", "yatra")
                          : destination.status === "publish"
                            ? __("Published", "yatra")
                            : __("Draft", "yatra")}
                      </span>
                    ),
                  },
                  {
                    key: "created_at",
                    label: __("Created Date", "yatra"),
                    sortable: true,
                    visible: visibleColumns.created_at,
                    render: (destination: Destination) => (
                      <span
                        className={
                          destination.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }
                      >
                        {new Date(destination.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    ),
                  },
                  {
                    key: "updated_at",
                    label: __("Updated Date", "yatra"),
                    sortable: true,
                    visible: visibleColumns.updated_at,
                    render: (destination: Destination) => (
                      <span
                        className={
                          destination.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }
                      >
                        {new Date(destination.updated_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    ),
                  },
                  {
                    key: "created_by_name",
                    label: __("Created By", "yatra"),
                    visible: visibleColumns.created_by_name,
                    render: (destination: Destination) => (
                      <span
                        className={
                          destination.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }
                      >
                        {destination.created_by_name || __("Unknown", "yatra")}
                      </span>
                    ),
                  },
                  {
                    key: "updated_by_name",
                    label: __("Updated By", "yatra"),
                    visible: visibleColumns.updated_by_name,
                    render: (destination: Destination) => (
                      <span
                        className={
                          destination.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }
                      >
                        {destination.updated_by_name || __("Unknown", "yatra")}
                      </span>
                    ),
                  },
                ], [visibleColumns])}
                actions={[
                  {
                    key: "view",
                    label: __("View", "yatra"),
                    icon: <Eye className="w-4 h-4" />,
                    onClick: (destination: Destination) => {
                      // Open destination in new tab
                      const destinationUrl = `${window.yatraAdmin?.siteUrl || ""}/destination/${destination.slug}`;
                      window.open(destinationUrl, "_blank");
                    },
                    condition: () => true, // Always show view action
                  },
                  {
                    key: "edit",
                    label: __("Edit", "yatra"),
                    icon: <Edit className="w-4 h-4" />,
                    onClick: handleEdit,
                    condition: () => can("yatra_edit_trips"),
                  },
                  {
                    key: "restore",
                    label: __("Restore", "yatra"),
                    icon: <RotateCcw className="w-4 h-4" />,
                    onClick: (destination: Destination) => {
                      // Handle restore action
                      bulkMutation.mutate({
                        action: "restore",
                        ids: [destination.id],
                      });
                    },
                    condition: (destination: Destination) =>
                      (destination.status === "trash" ||
                        statusFilter === "trash") &&
                      can("yatra_edit_trips"),
                  },
                  {
                    key: "trash",
                    label: __("Move to Trash", "yatra"),
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: (destination: Destination) => {
                      bulkMutation.mutate({
                        action: "trash",
                        ids: [destination.id],
                      });
                    },
                    condition: (destination: Destination) =>
                      destination.status !== "trash" &&
                      statusFilter !== "trash" &&
                      can("yatra_edit_trips"),
                  },
                  {
                    key: "delete",
                    label: __("Delete Permanently", "yatra"),
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: handleDelete,
                    condition: (destination: Destination) =>
                      (destination.status === "trash" ||
                        statusFilter === "trash") &&
                      can("yatra_delete_trips"),
                    variant: "destructive",
                  },
                ]}
                isLoading={isLoading}
                isError={!!error}
                errorText={__("Error loading destinations", "yatra")}
                errorDescription={__(
                  "We couldn’t connect to the destinations service. Please refresh or try again shortly.",
                  "yatra",
                )}
                onRetry={() =>
                  queryClient.invalidateQueries({ queryKey: ["destinations"] })
                }
                errorDetails={errorContext.details}
                errorRequestInfo={errorContext.requestInfo}
                emptyText={__("No destinations found", "yatra")}
                emptyDescription={
                  hasFilters
                    ? __(
                        "Try adjusting your filters to see more results.",
                        "yatra",
                      )
                    : __(
                        "Get started by creating your first destination.",
                        "yatra",
                      )
                }
                onCreateClick={
                  can("yatra_edit_trips") ? handleCreateDestination : undefined
                }
                onSort={handleSort}
                getSortIcon={getSortIcon}
                selectedItemIds={selectedIds}
                onSelectItem={(id: string | number, checked: boolean) => {
                  if (checked) {
                    setSelectedIds([...selectedIds, id]);
                  } else {
                    setSelectedIds(
                      selectedIds.filter((selectedId) => selectedId !== id),
                    );
                  }
                }}
                onSelectAll={(checked: boolean) => {
                  if (checked) {
                    setSelectedIds(destinations.map((d: Destination) => d.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
                isAllSelected={
                  destinations.length > 0 &&
                  selectedIds.length === destinations.length
                }
                getItemId={(destination: Destination) => destination.id}
                getItemStatus={(destination: Destination) => destination.status}
                statusFilter={statusFilter}
                skeletonRows={5}
              />
            </CardContent>
          </Card>
        </>
      </ConditionalRender>

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={10}
            onPageChange={(newPage) => setPage(newPage)}
            itemName={__("destinations", "yatra")}
          />
        </div>
      )}
    </div>
  );
};

export default Destinations;
