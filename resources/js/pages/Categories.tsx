/**
 * Categories Page
 * Clean, minimal SaaS-style categories management page with subcategory support
 */

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import {
  SearchFilterToolbar,
  Table as SharedTable,
  BulkActionToolbar,
  Pagination,
} from "../components/shared";
import { getDefaultBulkStatusOptions } from "../components/shared/bulkStatusOptions";
import { __ } from "../lib/i18n";
import { usePermissions } from "../hooks/usePermissions";
import { useToast } from "../components/ui/toast";
import { apiClient } from "../lib/api-client";
import { getErrorContext } from "../lib/errors";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { PageHeader } from "../components/common/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { IconSelector } from "../components/ui/icon-selector";
import type { IconPickerValue } from "../components/ui/icon-picker";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: IconPickerValue | null;
  trip_count?: number;
  parent_id?: number | null;
  parent_name?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  created_by_name?: string;
  updated_by_name?: string;
  subcategories?: Category[];
  __subOnly?: boolean;
}

export const Categories: React.FC = () => {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [parentFilter, setParentFilter] = useState<
    "all" | "top-level" | "subcategories"
  >("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set(),
  );
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({
    isOpen: false,
    category: null,
  });
  // Bulk action state
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const defaultColumns = {
      name: true,
      description: true,
      trips: true,
      status: true,
      created_at: true,
    };
    const saved = localStorage.getItem("yatra_categories_columns");
    return saved ? { ...defaultColumns, ...JSON.parse(saved) } : defaultColumns;
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: 50, // Get more items to handle hierarchical display
      orderby: sortBy,
      order: sortOrder,
      hierarchical: true, // Request hierarchical data
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (statusFilter !== "all") {
      params.status = statusFilter;
    }

    if (parentFilter === "top-level") {
      params.parent_id = null;
    } else if (parentFilter === "subcategories") {
      // We'll filter client-side for subcategories
    }

    return params;
  }, [searchTerm, statusFilter, parentFilter, sortBy, sortOrder, page]);

  // Fetch categories from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["trip-categories", queryParams],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/trip-categories", {
          params: queryParams,
        });
        return response;
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to load categories", "yatra"),
          "error",
        );
        throw error;
      }
    },
    enabled: can("yatra_view_trips"),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/trip-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-categories"] });
      showToast(__("Category deleted successfully", "yatra"), "success");
      setDeleteConfirm({ isOpen: false, category: null });
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to delete category", "yatra"),
        "error",
      );
    },
  });

  const categories = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 50);
  const errorContext = getErrorContext(error);
  
  
  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey],
    };
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem(
      "yatra_categories_columns",
      JSON.stringify(newVisibleColumns),
    );
  };

  // Status counts for bulk toolbar - count both parents and children
  const statusCounts = useMemo(() => {
    const counts = {
      all: 0,
      publish: 0,
      draft: 0,
      trash: 0,
    };

    const countCategory = (cat: Category) => {
      counts.all++;
      if (cat.status === "publish") counts.publish++;
      else if (cat.status === "draft") counts.draft++;
      else if (cat.status === "trash") counts.trash++;
    };

    categories.forEach((cat: Category) => {
      // Count parent category
      countCategory(cat);

      // Count subcategories
      if (cat.subcategories && Array.isArray(cat.subcategories)) {
        cat.subcategories.forEach((sub: Category) => {
          countCategory(sub);
        });
      }
    });

    return counts;
  }, [categories]);

  // Bulk mutation for status changes and deletes
  const bulkMutation = useMutation({
    mutationFn: async ({
      action,
      ids,
    }: {
      action: string;
      ids: (string | number)[];
    }) => {
      if (action === "delete") {
        await Promise.all(
          ids.map((id) => apiClient.delete(`/trip-categories/${id}`)),
        );
      } else {
        // Status change - fetch each category and update with full payload
        await Promise.all(
          ids.map(async (id) => {
            try {
              const categoryResponse = await apiClient.get(
                `/trip-categories/${id}`,
              );
              const category = categoryResponse;
              if (!category || !category.name) {
                return;
              }

              await apiClient.put(`/trip-categories/${id}`, {
                name: category.name,
                slug: category.slug,
                description: category.description,
                icon: category.icon,
                parent_id: category.parent_id,
                status: action,
              });
            } catch {
              throw new Error("bulk_item_failed");
            }
          }),
        );
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trip-categories"] });
      const msgMap: Record<string, string> = {
        delete: __("Selected categories deleted successfully", "yatra"),
        trash: __("Selected categories moved to trash", "yatra"),
        draft: __("Selected categories marked as draft", "yatra"),
        publish: __("Selected categories published", "yatra"),
      };
      showToast(
        msgMap[variables.action] || __("Bulk action completed", "yatra"),
        "success",
      );
      setSelectedIds([]);
      setBulkAction("");
    },
    onError: (error: any, variables) => {
      const msgMapError: Record<string, string> = {
        delete: __("Failed to delete selected categories", "yatra"),
        trash: __("Failed to move categories to trash", "yatra"),
        draft: __("Failed to mark categories as draft", "yatra"),
        publish: __("Failed to publish categories", "yatra"),
      };
      showToast(
        error?.message ||
          msgMapError[variables.action] ||
          __("Bulk action failed", "yatra"),
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
      showToast(__("Select at least one category.", "yatra"), "warning");
      return;
    }

    bulkMutation.mutate({ action: bulkAction, ids: selectedIds });
  };

  // Process categories for hierarchical display
  const processedCategories = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return [];
    }

    const normalized = categories.map((cat: Category) => ({
      ...cat,
      subcategories: Array.isArray(cat.subcategories) ? cat.subcategories : [],
    }));

    const term = searchTerm.trim().toLowerCase();

    const matchesSearch = (cat: Category): boolean => {
      if (!term) return true;
      const name = cat.name?.toLowerCase() || "";
      const slug = cat.slug?.toLowerCase() || "";
      const desc = cat.description?.toLowerCase() || "";
      return name.includes(term) || slug.includes(term) || desc.includes(term);
    };

    // Apply status + search filtering to both parents and children
    const filterByStatusAndSearch = (items: Category[]): Category[] => {
      return items
        .map((cat: Category) => {
          // Filter subcategories by status + search
          const filteredSubcategories = cat.subcategories
            ? cat.subcategories.filter((sub: Category) => {
                const statusOk =
                  statusFilter === "all" || sub.status === statusFilter;
                const searchOk = matchesSearch(sub);
                return statusOk && searchOk;
              })
            : [];

          return {
            ...cat,
            subcategories: filteredSubcategories,
          };
        })
        .filter((cat: Category) => {
          // When no status/search filters, keep all
          if (statusFilter === "all" && !term) return true;

          const statusOk =
            statusFilter === "all" || cat.status === statusFilter;
          const searchOk = matchesSearch(cat);
          const hasMatchingChildren =
            cat.subcategories && cat.subcategories.length > 0;

          // Show parent if it itself matches filters OR has children that match
          return (statusOk && searchOk) || hasMatchingChildren;
        });
    };

    const filtered = filterByStatusAndSearch(normalized);

    if (parentFilter === "subcategories") {
      const onlySubs: Category[] = filtered.flatMap((cat: Category) =>
        (cat.subcategories || []).map((sub) => ({
          ...sub,
          parent_name: cat.name,
          __subOnly: true,
          subcategories: [],
        })),
      );
      return onlySubs;
    }

    if (parentFilter === "top-level") {
      return filtered.map((cat) => ({
        ...cat,
        subcategories: [], // Don't show subcategories when filtering for top-level only
      }));
    }

    return filtered;
  }, [categories, parentFilter, statusFilter, searchTerm]);

  // Fetch settings for permalink handling
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/settings");
        return response;
      } catch (error) {
        return null;
      }
    },
    enabled: can("manage_yatra"),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Expand all parent categories that have subcategories by default
  useEffect(() => {
    if (expandedCategories.size > 0) return;

    const initialExpanded = new Set<number>();
    processedCategories.forEach((cat: Category) => {
      if (!cat.__subOnly && cat.subcategories && cat.subcategories.length > 0) {
        initialExpanded.add(cat.id);
      }
    });

    if (initialExpanded.size > 0) {
      setExpandedCategories(initialExpanded);
    }
  }, [processedCategories, expandedCategories.size]);

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

  const renderIcon = (icon: IconPickerValue | null | undefined) => {
    if (!icon) {
      return (
        <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
        </div>
      );
    }

    if (icon.type === "image") {
      return (
        <img
          src={icon.value}
          alt=""
          className="w-8 h-8 rounded object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            if (target.parentElement) {
              target.parentElement.innerHTML =
                '<div class="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><span class="text-xs text-gray-400 dark:text-gray-500">—</span></div>';
            }
          }}
        />
      );
    }

    return (
      <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <IconSelector
          iconName={icon.value}
          className="w-5 h-5 text-gray-600 dark:text-gray-400"
        />
      </div>
    );
  };

  const toggleExpand = (categoryId: string | number) => {
    const id =
      typeof categoryId === "string" ? parseInt(categoryId, 10) : categoryId;
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleEdit = (category: Category) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=categories&action=edit&id=${category.id}`;
  };

  const handleView = async (category: Category) => {
    const siteUrl = (window as any)?.yatraAdmin?.siteUrl || "";
    const categoryBase = settings?.trip_category_base || "trip-categories";
    const categorySlug = category.slug || "";
    let apiPermalink = (category as any)?.permalink || (category as any)?.url;
    // permalinkStructure is optional in yatraAdmin; default to unknown => fall back to pretty
    const permalinkStructure = (window as any)?.yatraAdmin?.permalinkStructure;
    const isPlainPermalink = permalinkStructure === "plain";

    if (!categorySlug && !apiPermalink) {
      showToast(__("Category slug is missing", "yatra"), "error");
      return;
    }

    // If permalink is missing, try fetching the single category to get the backend-computed permalink
    if (!apiPermalink && category.id) {
      try {
        const detail = await apiClient.get(`/trip-categories/${category.id}`);
        apiPermalink =
          (detail as any)?.permalink || (detail as any)?.url || apiPermalink;
      } catch (e) {
        // Ignore and fall back to pretty URL
      }
    }

    // Prefer server-provided permalink when available (respects current permalink structure)
    if (apiPermalink) {
      window.open(apiPermalink, "_blank", "noopener,noreferrer");
      return;
    }

    // Fallback: Pretty permalink path
    const baseSite = siteUrl.replace(/\/$/, "");
    const prettyUrl = `${baseSite}/${categoryBase}/${categorySlug}`;
    const plainUrl = `${baseSite}/?${categoryBase}=${encodeURIComponent(categorySlug)}`;

    // Honor site permalink structure (default to plain when unknown)
    const targetUrl = isPlainPermalink ? plainUrl : prettyUrl;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const confirmDelete = () => {
    if (deleteConfirm.category) {
      deleteMutation.mutate(deleteConfirm.category.id);
    }
  };

  const handleCreateCategory = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=categories&action=create`;
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setParentFilter("all");
    setSortBy("name");
    setSortOrder("asc");
    setPage(1);
  };

  const hasFilters =
    searchTerm ||
    statusFilter !== "all" ||
    parentFilter !== "all" ||
    sortBy !== "name" ||
    sortOrder !== "asc";

  // Define columns for the shared table
  const columns = [
    {
      key: "name",
      label: __("Name", "yatra"),
      sortable: true,
      visible: visibleColumns.name,
      render: (category: Category) => {
        const editUrl = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=categories&action=edit&id=${category.id}`;
        return (
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <a
                  href={editUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEdit(category);
                  }}
                  className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-2 hover:underline truncate"
                >
                  {category.name}
                </a>
                {can("yatra_view_trips") && category.status !== "trash" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(category);
                    }}
                    className="ml-1 inline-flex items-center justify-center rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                    title={__("View category in new tab", "yatra")}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {category.slug}
                <span className="ml-1 text-[11px] text-gray-400 dark:text-gray-500">
                  (ID: {category.id})
                </span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "trips",
      label: __("Trips", "yatra"),
      visible: visibleColumns.trips,
      render: (category: Category) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {typeof category.trip_count === "number" ? category.trip_count : 0}
        </span>
      ),
    },
    {
      key: "description",
      label: __("Description", "yatra"),
      visible: visibleColumns.description,
    },
    {
      key: "status",
      label: __("Status", "yatra"),
      sortable: true,
      visible: visibleColumns.status,
    },
    {
      key: "created_at",
      label: __("Created", "yatra"),
      sortable: true,
      visible: visibleColumns.created_at,
    },
  ];

  // Status mutation for individual actions
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const categoryResponse = await apiClient.get(`/trip-categories/${id}`);
      const category = categoryResponse as Category;

      return apiClient.put(`/trip-categories/${id}`, {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        parent_id: category.parent_id,
        status,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trip-categories"] });
      const msgMap: Record<string, string> = {
        trash: __("Category moved to trash", "yatra"),
        draft: __("Category marked as draft", "yatra"),
        publish: __("Category published", "yatra"),
      };
      const msg =
        msgMap[variables.status] ||
        __("Category updated successfully", "yatra");
      showToast(msg, "success");
    },
    onError: (error: any, variables) => {
      const msgMapError: Record<string, string> = {
        trash: __("Failed to move category to trash", "yatra"),
        draft: __("Failed to mark category as draft", "yatra"),
        publish: __("Failed to publish category", "yatra"),
      };
      const fallback =
        msgMapError[variables.status] ||
        __("Failed to update category", "yatra");
      showToast(error?.message || fallback, "error");
    },
  });

  // Define actions for the shared table - dynamic based on item status
  const actions = [
    {
      key: "view",
      label: __("View (frontend)", "yatra"),
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: (category: Category) => {
        // Open category in new tab
        const categoryUrl = `${window.yatraAdmin?.siteUrl || ""}/trip-category/${category.slug}`;
        window.open(categoryUrl, '_blank');
      },
      condition: (category: Category) => category.status !== "trash", // Hide for trash categories
    },
    {
      key: "edit",
      label: __("Edit", "yatra"),
      icon: <Edit className="w-4 h-4" />,
      onClick: (category: Category) => handleEdit(category),
      condition: () => can("yatra_edit_trips"),
    },
    {
      key: "publish",
      label: __("Make Published", "yatra"),
      icon: <Edit className="w-4 h-4" />,
      onClick: (category: Category) =>
        statusMutation.mutate({ id: category.id, status: "publish" }),
      condition: (category: Category) =>
        can("yatra_edit_trips") && category.status !== "publish",
    },
    {
      key: "draft",
      label: __("Make Draft", "yatra"),
      icon: <Edit className="w-4 h-4" />,
      onClick: (category: Category) =>
        statusMutation.mutate({ id: category.id, status: "draft" }),
      condition: (category: Category) =>
        can("yatra_edit_trips") && category.status !== "draft",
    },
    {
      key: "trash",
      label: __("Move to Trash", "yatra"),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (category: Category) =>
        statusMutation.mutate({ id: category.id, status: "trash" }),
      variant: "destructive" as const,
      condition: (category: Category) =>
        can("yatra_edit_trips") && category.status !== "trash",
    },
    {
      key: "delete",
      label: __("Delete Permanently", "yatra"),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (category: Category) =>
        setDeleteConfirm({ isOpen: true, category }),
      variant: "destructive" as const,
      condition: (category: Category) =>
        can("yatra_edit_trips") && category.status === "trash",
    },
  ];

  // Custom row content renderer for hierarchical display
  const renderRowContent = (
    category: Category,
    _index: number,
    isChild = false,
  ): React.ReactNode[] => {
    return [
      // Name column with icon and hierarchy indicator
      <div className="flex items-center gap-2">
        {renderIcon(category.icon)}
        <div>
          <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
            {isChild && <span className="text-gray-400 mr-1">└─</span>}
            <a
              href={`${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=categories&action=edit&id=${category.id}`}
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer"
            >
              {category.name}
            </a>
            {can("yatra_view_trips") && category.status !== "trash" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleView(category);
                }}
                className="ml-1 inline-flex items-center justify-center rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                title={__("View category in new tab", "yatra")}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span>{category.slug}</span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              ({__("ID:", "yatra")} {category.id})
            </span>
          </div>
          {category.parent_name && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {__("Parent:", "yatra")} {category.parent_name}
            </div>
          )}
        </div>
      </div>,
      // Trips column
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
        {typeof category.trip_count === "number" ? category.trip_count : 0}
      </span>,
      // Description column
      <div className="max-w-xs truncate text-sm text-gray-600 dark:text-gray-400">
        {category.description || "—"}
      </div>,
      // Status column
      getStatusBadge(category.status),
      // Created date column
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {formatDate(category.created_at)}
      </span>,
    ];
  };

  return (
    <div className="space-y-3">
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, category: null })}
        onConfirm={confirmDelete}
        title={__("Delete Category", "yatra")}
        message={
          deleteConfirm.category
            ? __(
                'Are you sure you want to delete "{name}"? This action cannot be undone.',
                "yatra",
              ).replace("{name}", deleteConfirm.category.name)
            : __(
                "Are you sure you want to delete this category? This action cannot be undone.",
                "yatra",
              )
        }
        confirmText={__("Delete Permanently", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <PageHeader
        title={__("Categories", "yatra")}
        description={__("Manage trip categories and subcategories", "yatra")}
        actionCapability="yatra_edit_trips"
        actions={
          <Button
            onClick={handleCreateCategory}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {__("Add New Category", "yatra")}
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Shared search + status + sort toolbar - give it more space on large screens */}
            <div className="min-w-0 w-full lg:flex-[4]">
              <SearchFilterToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                statusOptions={[
                  { value: "all", label: __("All Status", "yatra") },
                  { value: "publish", label: __("Publish", "yatra") },
                  { value: "draft", label: __("Draft", "yatra") },
                  { value: "trash", label: __("Trash", "yatra") },
                ]}
                sortBy={sortBy}
                onSortByChange={(value) => {
                  setSortBy(value);
                  setSortOrder("asc");
                  setPage(1);
                }}
                sortOrder={sortOrder}
                onSortOrderChange={(order) => {
                  setSortOrder(order);
                  setPage(1);
                }}
                sortOptions={[
                  { value: "name", label: __("Name", "yatra") },
                  { value: "status", label: __("Status", "yatra") },
                  { value: "created_at", label: __("Created", "yatra") },
                ]}
                onResetFilters={handleResetFilters}
                hasFilters={!!hasFilters}
                placeholder={__("Search categories", "yatra")}
              />
            </div>

            {/* Parent filter - constrained width on large screens */}
            <div className="w-full lg:w-48 xl:w-56 lg:flex-none">
              <Select
                value={parentFilter}
                onChange={(e) =>
                  setParentFilter(
                    e.target.value as "all" | "top-level" | "subcategories",
                  )
                }
                className="w-full text-sm truncate"
              >
                <option value="all">{__("All Categories", "yatra")}</option>
                <option value="top-level">
                  {__("Top Level Only", "yatra")}
                </option>
                <option value="subcategories">
                  {__("Subcategories Only", "yatra")}
                </option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
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
        statusOptions={[
          { key: "all", label: __("All", "yatra"), count: statusCounts.all },
          {
            key: "publish",
            label: __("Published", "yatra"),
            count: statusCounts.publish,
          },
          {
            key: "draft",
            label: __("Draft", "yatra"),
            count: statusCounts.draft,
          },
          {
            key: "trash",
            label: __("Trash", "yatra"),
            count: statusCounts.trash,
          },
        ]}
        showColumnsDropdown={showColumnsDropdown}
        setShowColumnsDropdown={setShowColumnsDropdown}
        columnOptions={[
          {
            key: "name",
            label: __("Category", "yatra"),
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
            key: "status",
            label: __("Status", "yatra"),
            visible: visibleColumns.status,
          },
          {
            key: "created_at",
            label: __("Created Date", "yatra"),
            visible: visibleColumns.created_at,
          },
        ]}
        onToggleColumn={toggleColumn}
        bulkMutationPending={bulkMutation.isPending}
        totalItems={processedCategories.length}
        bulkActionOptions={getDefaultBulkStatusOptions(statusFilter)}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <SharedTable
            data={processedCategories}
            columns={columns}
            actions={actions}
            isLoading={isLoading}
            isError={!!error}
            errorText={__("Error loading categories", "yatra")}
            errorDescription={__(
              "We couldn’t connect to the categories service. Please refresh or try again shortly.",
              "We couldn’t connect to the categories service. Please refresh or try again shortly.",
            )}
            onRetry={() =>
              queryClient.invalidateQueries({ queryKey: ["trip-categories"] })
            }
            errorDetails={errorContext.details}
            errorRequestInfo={errorContext.requestInfo}
            emptyText={__("No categories found", "yatra")}
            emptyDescription={__(
              "Organize trips into categories to help travelers find the perfect fit.",
              "Organize trips into categories to help travelers find the perfect fit.",
            )}
            onCreateClick={handleCreateCategory}
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
                setSelectedIds(
                  processedCategories.map((cat: Category) => cat.id),
                );
              } else {
                setSelectedIds([]);
              }
            }}
            isAllSelected={
              processedCategories.length > 0 &&
              selectedIds.length === processedCategories.length
            }
            getItemId={(category: Category) => category.id}
            getItemStatus={(category: Category) => category.status}
            statusFilter={statusFilter}
            skeletonRows={5}
            capability="yatra_view_trips"
            // Hierarchical props
            isHierarchical={true}
            expandedIds={expandedCategories}
            onToggleExpand={toggleExpand}
            getChildren={(category: Category) => category.subcategories || []}
            renderRowContent={renderRowContent}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={10}
            onPageChange={(newPage) => setPage(newPage)}
            itemName={__("categories", "yatra")}
          />
        </div>
      )}
    </div>
  );
};

export default Categories;
