/**
 * Item Types Page
 * Manage itinerary item types (Activity, Meal, Accommodation, etc.)
 */

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
} from "lucide-react";
import { __ } from "../lib/i18n";
import { usePermissions } from "../hooks/usePermissions";
import { useToast } from "../components/ui/toast";
import { apiClient } from "../lib/api-client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { PageHeader } from "../components/common/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { ConditionalRender } from "../components/ui/conditional-render";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { IconSelector } from "../components/ui/icon-selector";
import { Badge } from "../components/ui/badge";
import { Table as SharedTable } from "../components/shared/Table";
import { Pagination } from "../components/shared/Pagination";
import { BulkActionToolbar } from "../components/shared/BulkActionToolbar";
import { getErrorContext } from "../lib/errors";
import type { IconPickerValue } from "../components/ui/icon-picker";

interface ItemType {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string | IconPickerValue | null; // Can be string (old format) or IconPickerValue (new format)
  color: string;
  status: "draft" | "publish" | "trash";
  items_count?: number;
  created_at: string;
  updated_at: string;
  created_by: number; // user_id
  updated_by: number; // user_id
  created_by_name?: string; // Optional: user name from API
  updated_by_name?: string; // Optional: user name from API
}

const ItemTypes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [bulkMutationPending, setBulkMutationPending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    itemType: ItemType | null;
  }>({
    isOpen: false,
    itemType: null,
  });
  const [statusActionConfirm, setStatusActionConfirm] = useState<{
    isOpen: boolean;
    itemType: ItemType | null;
    action: "publish" | "draft" | "trash" | "restore" | null;
  }>({
    isOpen: false,
    itemType: null,
    action: null,
  });

  const updateItemTypeStatus = async (
    itemType: ItemType,
    status: "draft" | "publish" | "trash",
  ) => {
    await apiClient.put(`/item-types/${itemType.id}`, {
      // Required for validation
      name: itemType.name,
      // Preserve current slug and other fields so a status change doesn't mutate core data
      slug: itemType.slug,
      description: itemType.description,
      color: itemType.color,
      status,
      preserve_slug: true,
    });
  };
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();

  const baseAdminUrl = (window as any).yatraAdmin?.adminUrl || "";

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

  // Fetch stable status counts from API (independent of filters)
  const { data: statsData } = useQuery({
    queryKey: ["item-types-stats"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/item-types/stats");
        return response;
      } catch (error: any) {
        return { all: 0, publish: 0, draft: 0, trash: 0 };
      }
    },
    enabled: can("yatra_view_trips"),
  });

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["item-types", queryParams],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/item-types", {
          params: queryParams,
        });
        return response;
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to load item types", "yatra"),
          "error",
        );
        throw error;
      }
    },
    enabled: can("yatra_view_trips"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/item-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-types"] });
      queryClient.invalidateQueries({ queryKey: ["item-types-stats"] });
      showToast(__("Item type deleted successfully", "yatra"), "success");
      setDeleteConfirm({ isOpen: false, itemType: null });
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to delete item type", "yatra"),
        "error",
      );
    },
  });

  const itemTypes = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);
  const errorContext = getErrorContext(error);
  const apiErrorMessage = (data as any)?.error || (data as any)?.message;
  const derivedErrorDetails =
    errorContext.details ||
    (apiErrorMessage ? String(apiErrorMessage) : undefined) ||
    (error ? String(error?.message || error) : undefined);
  const isItemTypesError = !!error || !!apiErrorMessage;

  const formatDate = (dateString: string) => {
    if (!dateString) return __("N/A", "yatra");
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      publish: {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Publish", "yatra"),
      },
      draft: {
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
        label: __("Draft", "yatra"),
      },
      trash: {
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
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

  const formatUser = (userId: number, userName?: string) => {
    if (userName) {
      return userName;
    }
    return `User #${userId}`;
  };

  const renderIcon = (icon: IconPickerValue | string | null | undefined) => {
    if (!icon) {
      return (
        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
        </div>
      );
    }

    // New format: IconPickerValue object
    if (typeof icon === "object" && icon !== null) {
      const iconValue = icon as IconPickerValue;
      if (iconValue.type === "image") {
        return (
          <img
            src={iconValue.value}
            alt=""
            className="w-10 h-10 rounded-lg object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              if (target.parentElement) {
                target.parentElement.innerHTML =
                  '<div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><span class="text-xs text-gray-400 dark:text-gray-500">—</span></div>';
              }
            }}
          />
        );
      } else {
        // Icon type
        return (
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <IconSelector
              iconName={iconValue.value as any}
              className="w-5 h-5 text-gray-700 dark:text-gray-300"
            />
          </div>
        );
      }
    }

    // Old format: string icon name
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <IconSelector
          iconName={icon as any}
          className="w-5 h-5 text-gray-700 dark:text-gray-300"
        />
      </div>
    );
  };

  const handleCreate = () => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=itinerary&tab=item-types&action=create`;
  };

  const handleEdit = (itemType: ItemType) => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=itinerary&tab=item-types&action=edit&id=${itemType.id}`;
  };

  const handleDelete = (itemType: ItemType) => {
    setDeleteConfirm({ isOpen: true, itemType });
  };

  const confirmDelete = () => {
    if (deleteConfirm.itemType) {
      deleteMutation.mutate(deleteConfirm.itemType.id);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("name");
    setSortOrder("asc");
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
    sortBy !== "name" ||
    sortOrder !== "asc";

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {
      type: true,
      description: true,
      status: true,
      items: true,
      date: true,
      author: true,
    },
  );

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const columnOptions = [
    { key: "type", label: __("Type", "yatra"), visible: visibleColumns.type },
    {
      key: "description",
      label: __("Description", "yatra"),
      visible: visibleColumns.description,
    },
    {
      key: "status",
      label: __("Status", "yatra"),
      visible: visibleColumns.status,
    },
    {
      key: "items",
      label: __("Items", "yatra"),
      visible: visibleColumns.items,
    },
    { key: "date", label: __("Date", "yatra"), visible: visibleColumns.date },
    {
      key: "author",
      label: __("Author", "yatra"),
      visible: visibleColumns.author,
    },
  ];

  const isAllSelected =
    itemTypes.length > 0 && selectedIds.length === itemTypes.length;

  const handleSelectItem = (id: string | number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((existingId) => existingId !== id),
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(itemTypes.map((itemType: ItemType) => itemType.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Status counts from stats API (stable across filters)
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

  const statusOptions = [
    { key: "all", label: __("All", "yatra"), count: statusCounts.all },
    { key: "draft", label: __("Draft", "yatra"), count: statusCounts.draft },
    {
      key: "publish",
      label: __("Publish", "yatra"),
      count: statusCounts.publish,
    },
    { key: "trash", label: __("Trash", "yatra"), count: statusCounts.trash },
  ];

  const bulkActionOptions = useMemo(() => {
    if (statusFilter === "trash") {
      return [
        { value: "restore", label: __("Restore to Draft", "yatra") },
        { value: "delete", label: __("Delete Permanently", "yatra") },
      ];
    }

    return [
      { value: "publish", label: __("Mark as Published", "yatra") },
      { value: "draft", label: __("Mark as Draft", "yatra") },
      { value: "trash", label: __("Move to Trash", "yatra") },
      { value: "delete", label: __("Delete Permanently", "yatra") },
    ];
  }, [statusFilter]);

  const handleBulkApply = async () => {
    if (!bulkAction || selectedIds.length === 0) {
      showToast(
        __("Please select item types and a bulk action first.", "yatra"),
        "error",
      );
      return;
    }

    try {
      setBulkMutationPending(true);

      const selectedItemTypes = itemTypes.filter((itemType: ItemType) =>
        selectedIds.includes(itemType.id),
      );

      if (bulkAction === "delete") {
        await Promise.all(
          selectedIds.map((id) => apiClient.delete(`/item-types/${id}`)),
        );
        showToast(__("Item types deleted successfully", "yatra"), "success");
      } else if (bulkAction === "publish") {
        await Promise.all(
          selectedItemTypes.map((itemType: ItemType) =>
            updateItemTypeStatus(itemType, "publish"),
          ),
        );
        showToast(__("Item types marked as published", "yatra"), "success");
      } else if (bulkAction === "draft") {
        const targetStatus: "draft" = "draft";
        await Promise.all(
          selectedItemTypes.map((itemType: ItemType) =>
            updateItemTypeStatus(itemType, targetStatus),
          ),
        );
        showToast(
          statusFilter === "trash"
            ? __("Item types restored to draft", "yatra")
            : __("Item types marked as draft", "yatra"),
          "success",
        );
      } else if (bulkAction === "trash") {
        await Promise.all(
          selectedItemTypes.map((itemType: ItemType) =>
            updateItemTypeStatus(itemType, "trash"),
          ),
        );
        showToast(__("Item types moved to trash", "yatra"), "success");
      } else if (bulkAction === "restore") {
        await Promise.all(
          selectedItemTypes.map((itemType: ItemType) =>
            updateItemTypeStatus(itemType, "draft"),
          ),
        );
        showToast(__("Item types restored to draft", "yatra"), "success");
      }

      await queryClient.invalidateQueries({ queryKey: ["item-types"] });
      await queryClient.invalidateQueries({ queryKey: ["item-types-stats"] });
      setSelectedIds([]);
      setBulkAction("");
    } catch (error) {
      showToast(__("Bulk action failed", "yatra"), "error");
    } finally {
      setBulkMutationPending(false);
    }
  };

  const columns = [
    {
      key: "type",
      label: __("Type", "yatra"),
      sortable: true,
      width: "w-[200px]",
      visible: visibleColumns.type,
      render: (itemType: ItemType) => (
        <div className="flex items-center gap-3">
          {renderIcon(itemType.icon)}
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              <a
                href={`${baseAdminUrl}?page=yatra&subpage=itinerary&tab=item-types&action=edit&id=${itemType.id}`}
                className="hover:underline underline-offset-2 text-blue-600 dark:text-blue-400"
              >
                {itemType.name}
              </a>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {itemType.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      label: __("Description", "yatra"),
      sortable: false,
      width: "w-[200px]",
      render: (itemType: ItemType) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
          {itemType.description || __("No description", "yatra")}
        </span>
      ),
    },
    {
      key: "status",
      label: __("Status", "yatra"),
      sortable: true,
      width: "w-[100px]",
      visible: visibleColumns.status,
      render: (itemType: ItemType) => getStatusBadge(itemType.status),
    },
    {
      key: "items",
      label: __("Items", "yatra"),
      sortable: false,
      width: "w-[100px]",
      visible: visibleColumns.items,
      render: (itemType: ItemType) => (
        <div className="text-center">
          <Badge variant="outline" className="font-medium">
            {itemType.items_count ?? 0}
          </Badge>
        </div>
      ),
    },
    {
      key: "date",
      label: __("Date", "yatra"),
      sortable: true,
      width: "w-[150px]",
      visible: visibleColumns.date,
      render: (itemType: ItemType) => (
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          <div>{formatDate(itemType.created_at)}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {__("Updated", "yatra")}: {formatDate(itemType.updated_at)}
          </div>
        </div>
      ),
    },
    {
      key: "author",
      label: __("Author", "yatra"),
      sortable: false,
      width: "w-[150px]",
      visible: visibleColumns.author,
      render: (itemType: ItemType) => (
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          <div>{formatUser(itemType.created_by, itemType.created_by_name)}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {__("Updated by", "yatra")}:{" "}
            {formatUser(itemType.updated_by, itemType.updated_by_name)}
          </div>
        </div>
      ),
    },
  ];

  const tableActions = useMemo(() => {
    const actions: any[] = [];

    if (can("yatra_edit_trips")) {
      actions.push({
        key: "edit",
        label: __("Edit", "yatra"),
        icon: <Edit className="w-4 h-4" />,
        onClick: (itemType: ItemType) => handleEdit(itemType),
      });

      actions.push({
        key: "publish",
        label: __("Mark as Published", "yatra"),
        icon: <ArrowUp className="w-4 h-4" />,
        onClick: (itemType: ItemType) => {
          setStatusActionConfirm({ isOpen: true, itemType, action: "publish" });
        },
        condition: (itemType: ItemType) =>
          itemType.status !== "publish" && itemType.status !== "trash",
      });

      actions.push({
        key: "draft",
        label: __("Mark as Draft", "yatra"),
        icon: <ArrowDown className="w-4 h-4" />,
        onClick: (itemType: ItemType) => {
          setStatusActionConfirm({ isOpen: true, itemType, action: "draft" });
        },
        condition: (itemType: ItemType) =>
          itemType.status !== "draft" && itemType.status !== "trash",
      });

      actions.push({
        key: "trash",
        label: __("Move to Trash", "yatra"),
        icon: <Trash2 className="w-4 h-4" />,
        onClick: (itemType: ItemType) => {
          setStatusActionConfirm({ isOpen: true, itemType, action: "trash" });
        },
        condition: (itemType: ItemType) => itemType.status !== "trash",
      });

      actions.push({
        key: "restore",
        label: __("Restore to Draft", "yatra"),
        icon: <ArrowUp className="w-4 h-4" />,
        onClick: (itemType: ItemType) => {
          setStatusActionConfirm({ isOpen: true, itemType, action: "restore" });
        },
        condition: (itemType: ItemType) => itemType.status === "trash",
      });
    }

    if (can("yatra_delete_trips")) {
      actions.push({
        key: "delete",
        label: __("Delete Permanently", "yatra"),
        icon: <Trash2 className="w-4 h-4" />,
        onClick: (itemType: ItemType) => handleDelete(itemType),
        variant: "destructive" as const,
        condition: (itemType: ItemType) => itemType.status === "trash",
      });
    }

    return actions;
  }, [can, queryClient, showToast]);

  return (
    <div className="space-y-3">
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, itemType: null })}
        onConfirm={confirmDelete}
        title={__("Delete Item Type", "yatra")}
        message={
          deleteConfirm.itemType
            ? __(
                'Are you sure you want to delete "{name}"? This action cannot be undone.',
                "yatra",
              ).replace("{name}", deleteConfirm.itemType.name)
            : __(
                "Are you sure you want to delete this item type? This action cannot be undone.",
                "yatra",
              )
        }
        confirmText={__("Delete", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={statusActionConfirm.isOpen}
        onClose={() =>
          setStatusActionConfirm({
            isOpen: false,
            itemType: null,
            action: null,
          })
        }
        onConfirm={async () => {
          const { itemType, action } = statusActionConfirm;
          if (!itemType || !action) {
            return;
          }

          const targetStatus = action === "restore" ? "draft" : action;

          await updateItemTypeStatus(
            itemType,
            targetStatus as "draft" | "publish" | "trash",
          );

          const successMessage =
            action === "publish"
              ? __("Item type marked as published.", "yatra")
              : action === "draft" || action === "restore"
                ? __("Item type marked as draft.", "yatra")
                : __("Item type moved to trash.", "yatra");

          showToast(successMessage, "success");
          queryClient.invalidateQueries({ queryKey: ["item-types"] });
          queryClient.invalidateQueries({ queryKey: ["item-types-stats"] });
          setStatusActionConfirm({
            isOpen: false,
            itemType: null,
            action: null,
          });
        }}
        title={(() => {
          switch (statusActionConfirm.action) {
            case "publish":
              return __("Publish Item Type", "yatra");
            case "draft":
              return __("Mark as Draft", "yatra");
            case "trash":
              return __("Move to Trash", "yatra");
            case "restore":
              return __("Restore Item Type", "yatra");
            default:
              return __("Confirm Action", "yatra");
          }
        })()}
        message={(() => {
          const name = statusActionConfirm.itemType?.name || "";
          switch (statusActionConfirm.action) {
            case "publish":
              return __(
                'Are you sure you want to publish "{name}"?',
                "yatra",
              ).replace("{name}", name);
            case "draft":
              return __(
                'Are you sure you want to mark "{name}" as draft?',
                "yatra",
              ).replace("{name}", name);
            case "trash":
              return __(
                'Are you sure you want to move "{name}" to trash?',
                "yatra",
              ).replace("{name}", name);
            case "restore":
              return __(
                'Are you sure you want to restore "{name}" to draft?',
                "yatra",
              ).replace("{name}", name);
            default:
              return __(
                "Are you sure you want to perform this action?",
                "yatra",
              );
          }
        })()}
        confirmText={(() => {
          switch (statusActionConfirm.action) {
            case "publish":
              return __("Publish", "yatra");
            case "draft":
            case "restore":
              return __("Mark as Draft", "yatra");
            case "trash":
              return __("Move to Trash", "yatra");
            default:
              return __("Confirm", "yatra");
          }
        })()}
        cancelText={__("Cancel", "yatra")}
        variant="warning"
        isLoading={false}
      />

      <PageHeader
        title={__("Item Types", "yatra")}
        description={__(
          "Manage categories for itinerary items like Activity, Meal, Accommodation, etc.",
          "yatra",
        )}
        actionCapability="yatra_edit_trips"
        actions={
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__("Add New Type", "yatra")}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__("Search item types...", "yatra")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40"
            >
              <option value="all">{__("All", "yatra")}</option>
              <option value="draft">{__("Draft", "yatra")}</option>
              <option value="publish">{__("Published", "yatra")}</option>
              <option value="trash">{__("Trash", "yatra")}</option>
            </Select>

            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-40"
            >
              <option value="name">{__("Name", "yatra")}</option>
              <option value="status">{__("Status", "yatra")}</option>
              <option value="created_at">{__("Created At", "yatra")}</option>
              <option value="updated_at">{__("Updated At", "yatra")}</option>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 flex items-center gap-1.5"
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
              <span className="text-xs">
                {sortOrder === "asc" ? __("Asc", "yatra") : __("Desc", "yatra")}
              </span>
            </Button>

            {hasFilters && (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {__("Reset", "yatra")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_trips">
        <>
          {!isItemTypesError && (
            <BulkActionToolbar
              selectedIds={selectedIds}
              bulkAction={bulkAction}
              setBulkAction={setBulkAction}
              onApply={handleBulkApply}
              onClearSelection={handleClearSelection}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              statusOptions={statusOptions}
              showColumnsDropdown={showColumnsDropdown}
              setShowColumnsDropdown={setShowColumnsDropdown}
              columnOptions={columnOptions}
              onToggleColumn={toggleColumn}
              bulkMutationPending={bulkMutationPending}
              totalItems={total}
              bulkActionOptions={bulkActionOptions}
            />
          )}

          <Card>
            <CardContent className="p-0">
              <SharedTable
                data={itemTypes}
                columns={columns}
                actions={tableActions}
                isLoading={isLoading}
                isError={isItemTypesError}
                errorText={__("Error loading item types", "yatra")}
                errorDescription={__(
                  "We couldn’t connect to the item types service. Please refresh or try again shortly.",
                  "We couldn’t connect to the item types service. Please refresh or try again shortly.",
                )}
                errorDetails={derivedErrorDetails}
                errorRequestInfo={errorContext.requestInfo}
                onRetry={() =>
                  queryClient.invalidateQueries({ queryKey: ["item-types"] })
                }
                onSort={handleSort}
                getSortIcon={getSortIcon}
                selectedItemIds={selectedIds}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                isAllSelected={isAllSelected}
                getItemId={(itemType: ItemType) => itemType.id}
                getItemStatus={(itemType: ItemType) => itemType.status}
                statusFilter={statusFilter}
                capability="yatra_view_trips"
              />
            </CardContent>
          </Card>

          {total > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={10}
                onPageChange={setPage}
                itemName={__("item types", "yatra")}
              />
            </div>
          )}
        </>
      </ConditionalRender>
    </div>
  );
};

export default ItemTypes;
