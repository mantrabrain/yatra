/**
 * Activities Page
 * Clean, minimal SaaS-style activities management page
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

interface Activity {
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

const Activities: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [permanentDeleteConfirm, setPermanentDeleteConfirm] = useState<{
    isOpen: boolean;
    activity: Activity | null;
  }>({
    isOpen: false,
    activity: null,
  });
  const [individualActionConfirm, setIndividualActionConfirm] = useState<{
    isOpen: boolean;
    action: string;
    activity: Activity | null;
  }>({
    isOpen: false,
    action: "",
    activity: null,
  });
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | number | null>(
    null,
  );
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);

  // Column visibility state with localStorage
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
    const saved = localStorage.getItem("yatra-activities-columns-v2");
    return saved ? { ...defaultColumns, ...JSON.parse(saved) } : defaultColumns;
  });

  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();

  // Define columns for the shared table
  const columns = useMemo(
    () => [
      {
        Header: __("Name", "yatra"),
        accessor: "name",
        Cell: ({ row }: any) => (
          <div className="flex items-center">
            <div className="text-sm font-medium text-gray-900">
              {row.original.name}
            </div>
          </div>
        ),
      },
      {
        Header: __("Description", "yatra"),
        accessor: "description",
        Cell: ({ row }: any) => (
          <div className="text-sm text-gray-500">
            {row.original.description}
          </div>
        ),
      },
      {
        Header: __("Trips", "yatra"),
        accessor: "trip_count",
        Cell: ({ row }: any) => (
          <div className="text-sm text-gray-500">
            {row.original.trip_count || 0}
          </div>
        ),
      },
      {
        Header: __("Status", "yatra"),
        accessor: "status",
        Cell: ({ row }: any) => (
          <div className="text-sm text-gray-500">{row.original.status}</div>
        ),
      },
      {
        Header: __("SEO Title", "yatra"),
        accessor: "metadata.seo_title",
        Cell: ({ row }: any) => (
          <div className="text-sm text-gray-500">
            {row.original.metadata?.seo_title || ""}
          </div>
        ),
      },
      {
        Header: __("SEO Description", "yatra"),
        accessor: "metadata.seo_description",
        Cell: ({ row }: any) => (
          <div className="text-sm text-gray-500">
            {row.original.metadata?.seo_description || ""}
          </div>
        ),
      },
      {
        Header: __("SEO Keywords", "yatra"),
        accessor: "metadata.seo_keywords",
        Cell: ({ row }: any) => (
          <div className="text-sm text-gray-500">
            {row.original.metadata?.seo_keywords || ""}
          </div>
        ),
      },
      {
        Header: __("Created At", "yatra"),
        accessor: "created_at",
        Cell: ({ row }: any) => (
          <div className="text-sm text-gray-500">{row.original.created_at}</div>
        ),
      },
      {
        Header: __("Updated At", "yatra"),
        accessor: "updated_at",
        Cell: ({ row }: any) => (
          <div className="text-sm text-gray-500">{row.original.updated_at}</div>
        ),
      },
      {
        Header: __("Created By", "yatra"),
        accessor: "created_by_name",
        Cell: ({ row }: any) => (
          <div className="text-sm text-gray-500">
            {row.original.created_by_name || ""}
          </div>
        ),
      },
      {
        Header: __("Updated By", "yatra"),
        accessor: "updated_by_name",
        Cell: ({ row }: any) => (
          <div className="text-sm text-gray-500">
            {row.original.updated_by_name || ""}
          </div>
        ),
      },
    ],
    [visibleColumns],
  );

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey],
    };

    setVisibleColumns(newVisibleColumns);
    localStorage.setItem(
      "yatra-activities-columns-v2",
      JSON.stringify(newVisibleColumns),
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking on dropdown button or dropdown content
      if (
        target.closest("[data-dropdown-trigger]") ||
        target.closest("[data-dropdown-content]") ||
        target.closest("[data-columns-trigger]") ||
        target.closest("[data-columns-content]")
      ) {
        return;
      }
      setOpenDropdown(null);
      setShowColumnsDropdown(false);
    };

    if (openDropdown !== null || showColumnsDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openDropdown, showColumnsDropdown]);

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
    queryKey: ["activities-stats"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/activities/stats");
        return response;
      } catch (error: any) {
        return { all: 0, publish: 0, draft: 0, trash: 0 };
      }
    },
    enabled: can("yatra_view_trips"),
  });

  // Fetch activities from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["activities", queryParams],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/activities", {
          params: queryParams,
        });
        return response;
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to load activities", "yatra"),
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

  const activities = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);
  const errorContext = getErrorContext(error);

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
      return await apiClient.post("/activities/bulk", { action, ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["activities-stats"] });
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

  const handleEdit = (activity: Activity) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=activities&action=edit&id=${activity.id}`;
  };

  const handleView = async (activity: Activity) => {
    const activitySlug = activity.slug || "";
    const { plainUrl, prettyUrl } = buildYatraSinglePublicUrls({
      entity: "activity",
      slug: activitySlug,
      bases: settings as Record<string, unknown> | null,
    });

    if (isWordPressPlainPermalink()) {
      if (!activitySlug) {
        showToast(__("Activity slug is missing", "yatra"), "error");
        return;
      }
      window.open(plainUrl, "_blank", "noopener,noreferrer");
      return;
    }

    let apiPermalink = (activity as any)?.permalink || (activity as any)?.url;

    if (!apiPermalink && activity.id) {
      try {
        const detail = await apiClient.get(`/activities/${activity.id}`);
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

    if (!activitySlug) {
      showToast(__("Activity slug is missing", "yatra"), "error");
      return;
    }

    window.open(prettyUrl, "_blank", "noopener,noreferrer");
  };

  const handlePermanentDelete = (activity: Activity) => {
    setPermanentDeleteConfirm({ isOpen: true, activity });
  };

  const confirmPermanentDelete = () => {
    if (permanentDeleteConfirm.activity) {
      bulkMutation.mutate({
        action: "delete",
        ids: [permanentDeleteConfirm.activity.id],
      });
      setPermanentDeleteConfirm({ isOpen: false, activity: null });
    }
  };

  const confirmIndividualAction = () => {
    if (individualActionConfirm.activity) {
      const action =
        individualActionConfirm.action === "restore" ? "restore" : "trash";
      bulkMutation.mutate({
        action,
        ids: [individualActionConfirm.activity.id],
      });
      setIndividualActionConfirm({ isOpen: false, action: "", activity: null });
    }
  };

  const handleCreateActivity = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=activities&action=create`;
  };

  // Keep selection in sync with current page data
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) =>
        activities.some((activity: Activity) => activity.id === id),
      ),
    );
  }, [activities]);

  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(__("Select a bulk action first.", "yatra"), "warning");
      return;
    }

    if (selectedIds.length === 0) {
      showToast(__("Select at least one activity.", "yatra"), "warning");
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

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("name");
    setSortOrder("asc");
    setPage(1);
    setSelectedIds([]);
    setBulkAction("");
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

  const hasFilters =
    searchTerm ||
    statusFilter !== "all" ||
    sortBy !== "id" ||
    sortOrder !== "desc";

  return (
    <div className="space-y-3">
      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={permanentDeleteConfirm.isOpen}
        onClose={() =>
          setPermanentDeleteConfirm({ isOpen: false, activity: null })
        }
        onConfirm={confirmPermanentDelete}
        title={__("Delete Activity Permanently", "yatra")}
        message={
          permanentDeleteConfirm.activity
            ? __(
                'Are you sure you want to permanently delete "{name}"? This action cannot be undone.',
                "yatra",
              ).replace("{name}", permanentDeleteConfirm.activity.name)
            : __(
                "Are you sure you want to permanently delete this activity? This action cannot be undone.",
                "yatra",
              )
        }
        confirmText={__("Delete Permanently", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={bulkMutation.isPending}
      />

      {/* Individual Action Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={individualActionConfirm.isOpen}
        onClose={() =>
          setIndividualActionConfirm({
            isOpen: false,
            action: "",
            activity: null,
          })
        }
        onConfirm={confirmIndividualAction}
        title={
          individualActionConfirm.action === "trash"
            ? __("Move to Trash", "yatra")
            : __("Restore Activity", "yatra")
        }
        message={
          individualActionConfirm.activity
            ? individualActionConfirm.action === "trash"
              ? __(
                  'Are you sure you want to move "{name}" to trash?',
                  "yatra",
                ).replace("{name}", individualActionConfirm.activity.name)
              : __(
                  'Are you sure you want to restore "{name}"?',
                  "yatra",
                ).replace("{name}", individualActionConfirm.activity.name)
            : individualActionConfirm.action === "trash"
              ? __(
                  "Are you sure you want to move this activity to trash?",
                  "yatra",
                )
              : __("Are you sure you want to restore this activity?", "yatra")
        }
        confirmText={
          individualActionConfirm.action === "trash"
            ? __("Move to Trash", "yatra")
            : __("Restore", "yatra")
        }
        cancelText={__("Cancel", "yatra")}
        variant="warning"
        isLoading={bulkMutation.isPending}
      />

      <PageHeader
        title={__("Activities", "yatra")}
        description={__(
          "Manage your travel activities and experiences",
          "yatra",
        )}
        actionCapability="yatra_edit_trips"
        actions={
          <Button
            onClick={handleCreateActivity}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {__("Add New Activity", "yatra")}
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
            placeholder={__("Search activities...", "yatra")}
          />
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_trips">
        <>
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
                  label: __("Activity", "yatra"),
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
              totalItems={activities.length}
              bulkActionOptions={getDefaultBulkStatusOptions(statusFilter)}
            />
          )}

          <Card className="overflow-visible">
            <CardContent className="p-0 overflow-visible">
              <SharedTable
                key={`activities-table-${JSON.stringify(visibleColumns)}`}
                data={activities}
                columns={[
                  {
                    key: "name",
                    label: __("Activity", "yatra"),
                    sortable: true,
                    visible: visibleColumns.name,
                    render: (activity: Activity) => (
                      <div className="flex items-center gap-3">
                        {/* Icon/Image */}
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          {activity.icon ? (
                            activity.icon.type === "image" ? (
                              <img
                                src={activity.icon.value}
                                alt={activity.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <IconSelector
                                iconName={activity.icon.value}
                                provider={activity.icon.provider ?? "yatra"}
                                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                              />
                            )
                          ) : (
                            <div className="w-5 h-5 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-semibold">
                              {activity.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {/* Text */}
                        <div>
                          <div className="flex items-center gap-1">
                            <a
                              href={`${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=activities&action=edit&id=${activity.id}`}
                              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer"
                            >
                              {activity.name}
                            </a>
                            {can("yatra_view_trips") &&
                              activity.status !== "trash" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleView(activity);
                                  }}
                                  className="ml-1 inline-flex items-center justify-center rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                                  title={__(
                                    "View activity in new tab",
                                    "yatra",
                                  )}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <span>{activity.slug}</span>
                            <span className="text-[11px] text-gray-400 dark:text-gray-500">
                              ({__("ID:", "yatra")} {activity.id})
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
                    render: (activity: Activity) => (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {typeof activity.trip_count === "number"
                          ? activity.trip_count
                          : 0}
                      </span>
                    ),
                  },
                  {
                    key: "description",
                    label: __("Description", "yatra"),
                    visible: visibleColumns.description,
                    render: (activity: Activity) => (
                      <span
                        className={`block max-w-[300px] truncate ${
                          activity.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                        title={activity.description || ""}
                      >
                        {activity.description || __("No description", "yatra")}
                      </span>
                    ),
                  },
                  {
                    key: "seo_title",
                    label: __("SEO Title", "yatra"),
                    visible: visibleColumns.seo_title,
                    render: (activity: Activity) => (
                      <span
                        className={
                          activity.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }
                      >
                        {activity.metadata?.seo_title || __("Not set", "yatra")}
                      </span>
                    ),
                  },
                  {
                    key: "seo_description",
                    label: __("SEO Description", "yatra"),
                    visible: visibleColumns.seo_description,
                    render: (activity: Activity) => (
                      <span
                        className={
                          activity.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }
                        title={activity.metadata?.seo_description || ""}
                      >
                        {activity.metadata?.seo_description
                          ? activity.metadata.seo_description.length > 50
                            ? activity.metadata.seo_description.substring(
                                0,
                                50,
                              ) + "..."
                            : activity.metadata.seo_description
                          : __("Not set", "yatra")}
                      </span>
                    ),
                  },
                  {
                    key: "seo_keywords",
                    label: __("SEO Keywords", "yatra"),
                    visible: visibleColumns.seo_keywords,
                    render: (activity: Activity) => (
                      <span
                        className={
                          activity.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }
                        title={activity.metadata?.seo_keywords || ""}
                      >
                        {activity.metadata?.seo_keywords
                          ? activity.metadata.seo_keywords.length > 30
                            ? activity.metadata.seo_keywords.substring(0, 30) +
                              "..."
                            : activity.metadata.seo_keywords
                          : __("Not set", "yatra")}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    label: __("Status", "yatra"),
                    sortable: true,
                    visible: visibleColumns.status,
                    render: (activity: Activity) => (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.status === "trash" ||
                          statusFilter === "trash"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : activity.status === "publish"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {activity.status === "trash" || statusFilter === "trash"
                          ? __("Trash", "yatra")
                          : activity.status === "publish"
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
                    render: (activity: Activity) => (
                      <span
                        className={
                          activity.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }
                      >
                        {new Date(activity.created_at).toLocaleDateString(
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
                    render: (activity: Activity) => (
                      <span
                        className={
                          activity.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }
                      >
                        {new Date(activity.updated_at).toLocaleDateString(
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
                    render: (activity: Activity) => (
                      <span
                        className={
                          activity.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }
                      >
                        {activity.created_by_name || __("Unknown", "yatra")}
                      </span>
                    ),
                  },
                  {
                    key: "updated_by_name",
                    label: __("Updated By", "yatra"),
                    visible: visibleColumns.updated_by_name,
                    render: (activity: Activity) => (
                      <span
                        className={
                          activity.status === "trash" ||
                          statusFilter === "trash"
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-600 dark:text-gray-400"
                        }
                      >
                        {activity.updated_by_name || __("Unknown", "yatra")}
                      </span>
                    ),
                  },
                ]}
                actions={[
                  {
                    key: "view",
                    label: __("View", "yatra"),
                    icon: <Eye className="w-4 h-4" />,
                    onClick: (activity: Activity) => {
                      // Open activity in new tab
                      const activityUrl = `${window.yatraAdmin?.siteUrl || ""}/activity/${activity.slug}`;
                      window.open(activityUrl, "_blank");
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
                    onClick: (activity: Activity) => {
                      bulkMutation.mutate({
                        action: "restore",
                        ids: [activity.id],
                      });
                    },
                    condition: (activity: Activity) =>
                      (activity.status === "trash" ||
                        statusFilter === "trash") &&
                      can("yatra_edit_trips"),
                  },
                  {
                    key: "trash",
                    label: __("Move to Trash", "yatra"),
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: (activity: Activity) => {
                      bulkMutation.mutate({
                        action: "trash",
                        ids: [activity.id],
                      });
                    },
                    condition: (activity: Activity) =>
                      activity.status !== "trash" &&
                      statusFilter !== "trash" &&
                      can("yatra_edit_trips"),
                  },
                  {
                    key: "delete",
                    label: __("Delete Permanently", "yatra"),
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: handlePermanentDelete,
                    condition: (activity: Activity) =>
                      (activity.status === "trash" ||
                        statusFilter === "trash") &&
                      can("yatra_delete_trips"),
                    variant: "destructive",
                  },
                ]}
                isLoading={isLoading}
                isError={!!error}
                errorText={__("Error loading activities", "yatra")}
                errorDescription={__(
                  "We couldn’t connect to the activities service. Please refresh or try again shortly.",
                  "We couldn’t connect to the activities service. Please refresh or try again shortly.",
                )}
                onRetry={() =>
                  queryClient.invalidateQueries({ queryKey: ["activities"] })
                }
                errorDetails={errorContext.details}
                errorRequestInfo={errorContext.requestInfo}
                emptyText={__("No activities found", "yatra")}
                emptyDescription={
                  hasFilters
                    ? __(
                        "Try adjusting your filters to see more results.",
                        "yatra",
                      )
                    : __(
                        "Get started by creating your first activity.",
                        "yatra",
                      )
                }
                onCreateClick={
                  can("yatra_edit_trips") ? handleCreateActivity : undefined
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
                    setSelectedIds(activities.map((a: Activity) => a.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
                isAllSelected={
                  activities.length > 0 &&
                  selectedIds.length === activities.length
                }
                getItemId={(activity: Activity) => activity.id}
                getItemStatus={(activity: Activity) => activity.status}
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
            itemName={__("activities", "yatra")}
          />
        </div>
      )}
    </div>
  );
};

export default Activities;
