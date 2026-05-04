/**
 * Attributes Page
 * Clean, minimal SaaS-style attributes management page
 */

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RotateCcw, Edit, Trash2 } from "lucide-react";
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
import { apiClient } from "../lib/api-client";
import { getErrorContext } from "../lib/errors";
import { Button } from "../components/ui/button";
import { PageHeader } from "../components/common/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { ConditionalRender } from "../components/ui/conditional-render";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { Badge } from "../components/ui/badge";
import {
  IconSelector,
  type IconSelectorProvider,
} from "../components/ui/icon-selector";

interface Attribute {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: {
    type: "icon" | "image";
    value: string;
    provider?: IconSelectorProvider;
  } | null;
  field_type: string;
  field_options: any;
  default_value: string;
  placeholder: string;
  required: boolean | string | number;
  validation_rules: any;
  display_order: number;
  show_on_frontend: boolean | string | number;
  show_in_filters: boolean | string | number;
  filter_type: string;
  searchable: boolean | string | number;
  status: string;
  created_at: string;
  updated_at: string;
}

const fieldTypeOptions = [
  { value: "text_field", label: "Text Field" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select Dropdown" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "color", label: "Color" },
];

const Attributes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem("yatra-attributes-columns");
    return saved
      ? JSON.parse(saved)
      : {
          name: true,
          field_type: true,
          required: true,
          show_on_frontend: true,
          show_in_filters: true,
          searchable: true,
          status: true,
          created_at: false,
          updated_at: false,
          description: false,
          display_order: false,
        };
  });

  const [permanentDeleteConfirm, setPermanentDeleteConfirm] = useState<{
    isOpen: boolean;
    attribute: Attribute | null;
  }>({
    isOpen: false,
    attribute: null,
  });
  const [individualActionConfirm, setIndividualActionConfirm] = useState<{
    isOpen: boolean;
    action: string;
    attribute: Attribute | null;
  }>({
    isOpen: false,
    action: "",
    attribute: null,
  });

  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest("[data-columns-trigger]") ||
        target.closest("[data-columns-content]")
      )
        return;
      setShowColumnsDropdown(false);
    };
    if (showColumnsDropdown) {
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [showColumnsDropdown]);

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: 10,
      orderby: sortBy,
      order: sortOrder,
    };
    if (searchTerm) params.search = searchTerm;
    if (statusFilter !== "all") params.status = statusFilter;
    return params;
  }, [page, sortBy, sortOrder, searchTerm, statusFilter]);

  const { data: statsData } = useQuery({
    queryKey: ["attributes-stats", searchTerm, statusFilter, page],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/attributes/stats");
        return response || { all: 0, publish: 0, draft: 0, trash: 0 };
      } catch {
        return { all: 0, publish: 0, draft: 0, trash: 0 };
      }
    },
    enabled: can("yatra_view_trips"),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  const {
    data: attributesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["attributes", searchTerm, statusFilter, sortBy, sortOrder, page],
    queryFn: async () => {
      const response = await apiClient.get("/attributes", {
        params: queryParams,
      });
      return response;
    },
    enabled: can("yatra_view_trips"),
  });

  const attributes = attributesData?.data || [];
  const total = attributesData?.total || 0;
  const totalPages = Math.ceil(total / 10);
  const errorContext = getErrorContext(error);
  const apiErrorMessage =
    (attributesData as any)?.error || (attributesData as any)?.message;
  const isAttributesError = !!error || !!apiErrorMessage;

  const statusCounts = useMemo(() => {
    if (statsData) {
      return {
        all: statsData?.all ?? 0,
        publish: statsData?.publish ?? 0,
        draft: statsData?.draft ?? 0,
        trash: statsData?.trash ?? 0,
      };
    }
    return { all: 0, publish: 0, draft: 0, trash: 0 };
  }, [statsData]);

  const bulkMutation = useMutation({
    mutationFn: async ({
      action,
      ids,
    }: {
      action: string;
      ids: (string | number)[];
    }) => {
      return await apiClient.post("/attributes/bulk", { action, ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      queryClient.invalidateQueries({ queryKey: ["attributes-stats"] });
      showToast(__("Bulk action completed successfully", "yatra"), "success");
      setSelectedIds([]);
      setBulkAction("");
    },
    onError: (err: any) => {
      showToast(
        err?.message || __("Failed to perform bulk action", "yatra"),
        "error",
      );
    },
  });

  const handleEdit = (attribute: Attribute) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=attributes&action=edit&id=${attribute.id}`;
  };

  const handleCreateAttribute = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=attributes&action=create`;
  };

  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(__("Select a bulk action first.", "yatra"), "warning");
      return;
    }
    if (selectedIds.length === 0) {
      showToast(__("Select at least one attribute.", "yatra"), "warning");
      return;
    }
    bulkMutation.mutate({ action: bulkAction, ids: selectedIds });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("id");
    setSortOrder("desc");
    setPage(1);
    setSelectedIds([]);
    setBulkAction("");
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => attributes.some((a: Attribute) => a.id === id)),
    );
  }, [attributes]);

  const attributeColumns = useMemo(() => {
    const formatBoolean = (value: boolean | string | number) =>
      value === true || value === "1" || value === 1;

    return [
      {
        key: "name",
        label: __("Attribute", "yatra"),
        sortable: true,
        visible: visibleColumns.name,
        render: (attribute: Attribute) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              {attribute.icon ? (
                attribute.icon.type === "image" ? (
                  <img
                    src={attribute.icon.value}
                    alt={attribute.name}
                    className="w-6 h-6 object-cover rounded"
                  />
                ) : (
                  <IconSelector
                    iconName={attribute.icon.value}
                    provider={attribute.icon.provider ?? "yatra"}
                    size={16}
                    className="text-purple-600 dark:text-purple-400"
                  />
                )
              ) : (
                <div className="w-5 h-5 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-semibold">
                  {attribute.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <a
                href={`${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=attributes&action=edit&id=${attribute.id}`}
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer"
              >
                {attribute.name}
              </a>
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span>{attribute.slug}</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  ({__("ID:", "yatra")} {attribute.id})
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "field_type",
        label: __("Field Type", "yatra"),
        sortable: true,
        visible: visibleColumns.field_type,
        render: (attribute: Attribute) => (
          <Badge variant="outline">
            {fieldTypeOptions.find((opt) => opt.value === attribute.field_type)
              ?.label || attribute.field_type}
          </Badge>
        ),
      },
      {
        key: "required",
        label: __("Required", "yatra"),
        sortable: true,
        visible: visibleColumns.required,
        render: (attribute: Attribute) => (
          <Badge
            variant={formatBoolean(attribute.required) ? "default" : "outline"}
          >
            {formatBoolean(attribute.required) ? "Yes" : "No"}
          </Badge>
        ),
      },
      {
        key: "show_on_frontend",
        label: __("Frontend", "yatra"),
        sortable: true,
        visible: visibleColumns.show_on_frontend,
        render: (attribute: Attribute) => (
          <Badge
            variant={
              formatBoolean(attribute.show_on_frontend) ? "default" : "outline"
            }
          >
            {formatBoolean(attribute.show_on_frontend) ? "Yes" : "No"}
          </Badge>
        ),
      },
      {
        key: "show_in_filters",
        label: __("Filters", "yatra"),
        sortable: true,
        visible: visibleColumns.show_in_filters,
        render: (attribute: Attribute) => (
          <Badge
            variant={
              formatBoolean(attribute.show_in_filters) ? "default" : "outline"
            }
          >
            {formatBoolean(attribute.show_in_filters) ? "Yes" : "No"}
          </Badge>
        ),
      },
      {
        key: "searchable",
        label: __("Searchable", "yatra"),
        sortable: true,
        visible: visibleColumns.searchable,
        render: (attribute: Attribute) => (
          <Badge
            variant={
              formatBoolean(attribute.searchable) ? "default" : "outline"
            }
          >
            {formatBoolean(attribute.searchable) ? "Yes" : "No"}
          </Badge>
        ),
      },
      {
        key: "status",
        label: __("Status", "yatra"),
        sortable: true,
        visible: visibleColumns.status,
        render: (attribute: Attribute) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              attribute.status === "trash" || statusFilter === "trash"
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                : attribute.status === "publish"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            }`}
          >
            {attribute.status === "trash" || statusFilter === "trash"
              ? __("Trash", "yatra")
              : attribute.status === "publish"
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
        render: (attribute: Attribute) => (
          <span
            className={
              attribute.status === "trash" || statusFilter === "trash"
                ? "text-gray-400 dark:text-gray-600"
                : "text-gray-600 dark:text-gray-400"
            }
          >
            {new Date(attribute.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
      {
        key: "updated_at",
        label: __("Updated Date", "yatra"),
        sortable: true,
        visible: visibleColumns.updated_at,
        render: (attribute: Attribute) => (
          <span
            className={
              attribute.status === "trash" || statusFilter === "trash"
                ? "text-gray-400 dark:text-gray-600"
                : "text-gray-600 dark:text-gray-400"
            }
          >
            {new Date(attribute.updated_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
      {
        key: "description",
        label: __("Description", "yatra"),
        visible: visibleColumns.description,
        render: (attribute: Attribute) => (
          <span
            className={
              attribute.status === "trash" || statusFilter === "trash"
                ? "text-gray-400 dark:text-gray-600"
                : "text-gray-600 dark:text-gray-400"
            }
          >
            {attribute.description || __("No description", "yatra")}
          </span>
        ),
      },
      {
        key: "display_order",
        label: __("Order", "yatra"),
        sortable: true,
        visible: visibleColumns.display_order,
        render: (attribute: Attribute) => (
          <span
            className={
              attribute.status === "trash" || statusFilter === "trash"
                ? "text-gray-400 dark:text-gray-600"
                : "text-gray-600 dark:text-gray-400"
            }
          >
            {attribute.display_order}
          </span>
        ),
      },
    ];
  }, [visibleColumns, statusFilter]);

  const hasFilters = !!(
    searchTerm ||
    statusFilter !== "all" ||
    sortBy !== "id" ||
    sortOrder !== "desc"
  );

  const toggleColumn = (columnKey: string) => {
    const next = { ...visibleColumns, [columnKey]: !visibleColumns[columnKey] };
    setVisibleColumns(next);
    localStorage.setItem("yatra-attributes-columns", JSON.stringify(next));
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

  const handlePermanentDelete = (attribute: Attribute) => {
    setPermanentDeleteConfirm({ isOpen: true, attribute });
  };

  const confirmPermanentDelete = () => {
    if (permanentDeleteConfirm.attribute) {
      bulkMutation.mutate({
        action: "delete",
        ids: [permanentDeleteConfirm.attribute.id],
      });
      setPermanentDeleteConfirm({ isOpen: false, attribute: null });
    }
  };

  const confirmIndividualAction = () => {
    if (individualActionConfirm.attribute) {
      const action =
        individualActionConfirm.action === "restore" ? "restore" : "trash";
      bulkMutation.mutate({
        action,
        ids: [individualActionConfirm.attribute.id],
      });
      setIndividualActionConfirm({
        isOpen: false,
        action: "",
        attribute: null,
      });
    }
  };

  return (
    <div className="space-y-3">
      <ConfirmationDialog
        isOpen={permanentDeleteConfirm.isOpen}
        onClose={() =>
          setPermanentDeleteConfirm({ isOpen: false, attribute: null })
        }
        onConfirm={confirmPermanentDelete}
        title={__("Delete Attribute Permanently", "yatra")}
        message={
          permanentDeleteConfirm.attribute
            ? __(
                'Are you sure you want to permanently delete "{name}"? This action cannot be undone.',
                "yatra",
              ).replace("{name}", permanentDeleteConfirm.attribute.name)
            : __(
                "Are you sure you want to permanently delete this attribute? This action cannot be undone.",
                "yatra",
              )
        }
        confirmText={__("Delete Permanently", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={bulkMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={individualActionConfirm.isOpen}
        onClose={() =>
          setIndividualActionConfirm({
            isOpen: false,
            action: "",
            attribute: null,
          })
        }
        onConfirm={confirmIndividualAction}
        title={
          individualActionConfirm.action === "trash"
            ? __("Move to Trash", "yatra")
            : __("Restore Attribute", "yatra")
        }
        message={
          individualActionConfirm.attribute
            ? individualActionConfirm.action === "trash"
              ? __(
                  'Are you sure you want to move "{name}" to trash?',
                  "yatra",
                ).replace("{name}", individualActionConfirm.attribute.name)
              : __(
                  'Are you sure you want to restore "{name}"?',
                  "yatra",
                ).replace("{name}", individualActionConfirm.attribute.name)
            : individualActionConfirm.action === "trash"
              ? __(
                  "Are you sure you want to move this attribute to trash?",
                  "yatra",
                )
              : __("Are you sure you want to restore this attribute?", "yatra")
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
        title={__("Attributes", "yatra")}
        description={__(
          "Manage your travel attributes and their properties",
          "yatra",
        )}
        actionCapability="yatra_edit_trips"
        actions={
          <Button
            onClick={handleCreateAttribute}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {__("Add New Attribute", "yatra")}
          </Button>
        }
      />

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
              { value: "id", label: __("ID", "yatra") },
              { value: "name", label: __("Name", "yatra") },
              { value: "field_type", label: __("Field Type", "yatra") },
              { value: "status", label: __("Status", "yatra") },
              { value: "created_at", label: __("Created At", "yatra") },
              { value: "updated_at", label: __("Updated At", "yatra") },
            ]}
            onResetFilters={handleResetFilters}
            hasFilters={hasFilters}
            placeholder={__("Search attributes...", "yatra")}
          />
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_trips">
        <>
          {!isAttributesError && (
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
                  label: __("Attribute", "yatra"),
                  visible: visibleColumns.name,
                },
                {
                  key: "field_type",
                  label: __("Field Type", "yatra"),
                  visible: visibleColumns.field_type,
                },
                {
                  key: "required",
                  label: __("Required", "yatra"),
                  visible: visibleColumns.required,
                },
                {
                  key: "show_on_frontend",
                  label: __("Frontend", "yatra"),
                  visible: visibleColumns.show_on_frontend,
                },
                {
                  key: "show_in_filters",
                  label: __("Filters", "yatra"),
                  visible: visibleColumns.show_in_filters,
                },
                {
                  key: "searchable",
                  label: __("Searchable", "yatra"),
                  visible: visibleColumns.searchable,
                },
                {
                  key: "status",
                  label: __("Status", "yatra"),
                  visible: visibleColumns.status,
                },
                {
                  key: "created_at",
                  label: __("Created", "yatra"),
                  visible: visibleColumns.created_at,
                },
                {
                  key: "updated_at",
                  label: __("Updated", "yatra"),
                  visible: visibleColumns.updated_at,
                },
                {
                  key: "description",
                  label: __("Description", "yatra"),
                  visible: visibleColumns.description,
                },
                {
                  key: "display_order",
                  label: __("Display Order", "yatra"),
                  visible: visibleColumns.display_order,
                },
              ]}
              onToggleColumn={toggleColumn}
              bulkMutationPending={bulkMutation.isPending}
              totalItems={total}
              bulkActionOptions={getDefaultBulkStatusOptions(statusFilter)}
            />
          )}

          <Card className="overflow-visible">
            <CardContent className="p-0 overflow-visible">
              <SharedTable
                data={attributes}
                columns={attributeColumns}
                actions={[
                  {
                    key: "edit",
                    label: __("Edit", "yatra"),
                    icon: <Edit className="w-4 h-4" />,
                    onClick: handleEdit,
                    condition: () => can("yatra_view_trips"),
                  },
                  {
                    key: "restore",
                    label: __("Restore", "yatra"),
                    icon: <RotateCcw className="w-4 h-4" />,
                    onClick: (attribute: Attribute) =>
                      bulkMutation.mutate({
                        action: "restore",
                        ids: [attribute.id],
                      }),
                    condition: (attribute: Attribute) =>
                      (attribute.status === "trash" ||
                        statusFilter === "trash") &&
                      can("yatra_view_trips"),
                  },
                  {
                    key: "trash",
                    label: __("Move to Trash", "yatra"),
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: (attribute: Attribute) =>
                      bulkMutation.mutate({
                        action: "trash",
                        ids: [attribute.id],
                      }),
                    condition: (attribute: Attribute) =>
                      attribute.status !== "trash" &&
                      statusFilter !== "trash" &&
                      can("yatra_view_trips"),
                  },
                  {
                    key: "delete",
                    label: __("Delete Permanently", "yatra"),
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: handlePermanentDelete,
                    condition: (attribute: Attribute) =>
                      (attribute.status === "trash" ||
                        statusFilter === "trash") &&
                      can("yatra_view_trips"),
                    variant: "destructive",
                  },
                ]}
                isLoading={isLoading}
                isError={isAttributesError}
                errorText={__("Failed to load attributes", "yatra")}
                errorDescription={__(
                  "We couldn’t connect to the attributes service. Please refresh or try again shortly.",
                  "We couldn’t connect to the attributes service. Please refresh or try again shortly.",
                )}
                errorDetails={errorContext.details || apiErrorMessage}
                errorRequestInfo={errorContext.requestInfo}
                onRetry={() =>
                  queryClient.invalidateQueries({ queryKey: ["attributes"] })
                }
                emptyText={__("No attributes found", "yatra")}
                emptyDescription={
                  hasFilters
                    ? __(
                        "Try adjusting your filters to see more results.",
                        "yatra",
                      )
                    : __(
                        "Get started by creating your first attribute.",
                        "yatra",
                      )
                }
                onCreateClick={
                  can("yatra_view_trips") ? handleCreateAttribute : undefined
                }
                onSort={handleSort}
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
                    setSelectedIds(attributes.map((a: Attribute) => a.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
                isAllSelected={
                  attributes.length > 0 &&
                  selectedIds.length === attributes.length
                }
                getItemId={(attribute: Attribute) => attribute.id}
                getItemStatus={(attribute: Attribute) => attribute.status}
                statusFilter={statusFilter}
                skeletonRows={5}
                capability="yatra_view_trips"
              />
            </CardContent>
          </Card>
        </>
      </ConditionalRender>

      {total > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={10}
            onPageChange={(newPage) => setPage(newPage)}
            itemName={__("attributes", "yatra")}
          />
        </div>
      )}
    </div>
  );
};

export default Attributes;
