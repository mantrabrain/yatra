/**
 * Recurring Availability Rules Component
 * Manage recurring patterns for trip availability
 * Uses the same UI structure as Specific Dates table
 */

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { apiClient } from "../../lib/api-client";
import { useToast } from "../ui/toast";
import { BulkActionToolbar, Table as SharedTable } from "../shared";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import { formatYatraMoney } from "../../lib/currency-display";

interface RecurringRule {
  id: number;
  trip_id: number;
  name: string;
  rule_type: "weekly" | "monthly" | "interval";
  days_of_week?: string;
  days_of_week_array?: number[];
  week_of_month?: "first" | "second" | "third" | "fourth" | "last";
  day_of_week?: number;
  interval_days?: number;
  start_date: string;
  end_date?: string;
  excluded_dates: string[];
  original_price?: number;
  sale_price?: number;
  seats_total: number;
  departure_time?: string;
  arrival_time?: string;
  from_location?: string;
  to_location?: string;
  cutoff_hours: number;
  status: "active" | "inactive";
  generated_count?: number;
  pricing_type?: "regular" | "traveler_based";
  traveler_pricing?: Array<{
    category_id: number;
    category_name?: string;
    original_price: number;
    sale_price?: number;
  }>;
}

interface RecurringRulesProps {
  tripId: number;
  tripName?: string;
  tripType?: "single_day" | "multi_day";
  pricingType?: "regular" | "traveler_based";
  onAddRule: () => void;
  onEditRule: (id: number) => void;
}

const dayNames = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export const RecurringRules: React.FC<RecurringRulesProps> = ({
  tripId,
  tripName,
  tripType = "multi_day",
  pricingType = "regular",
  onAddRule,
  onEditRule,
}) => {
  const isSingleDayTrip = tripType === "single_day";
  const isTravelerBased = pricingType === "traveler_based";
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const adminCurrency =
    (typeof window !== "undefined" &&
      (window as unknown as { yatraAdmin?: { currency?: string } }).yatraAdmin
        ?.currency) ||
    "USD";

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    pattern: true,
    start_date: true,
    end_date: true,
    capacity: true,
    generated: true,
    price: true,
    status: true,
  });

  // Confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    rule: RecurringRule | null;
  }>({
    isOpen: false,
    rule: null,
  });
  const [duplicateConfirm, setDuplicateConfirm] = useState<{
    isOpen: boolean;
    rule: RecurringRule | null;
  }>({
    isOpen: false,
    rule: null,
  });

  // Format rule pattern for display
  const formatRulePattern = (rule: RecurringRule): string => {
    switch (rule.rule_type) {
      case "weekly":
        const days = (rule.days_of_week_array || [])
          .map((d) => dayNames.find((dn) => dn.value === d)?.label.slice(0, 3))
          .filter(Boolean)
          .join(", ");
        return `Every ${days}`;
      case "monthly":
        return `${rule.week_of_month || ""} ${dayNames.find((d) => d.value === rule.day_of_week)?.label || ""} of month`;
      case "interval":
        return `Every ${rule.interval_days} days`;
      default:
        return "Unknown pattern";
    }
  };

  // Fetch status counts from API endpoint.
  // Key is nested under ["recurring-availability", ...] so a single
  // invalidateQueries({ queryKey: ["recurring-availability"] }) refreshes
  // both the list AND the status badge counts (All / Active / Inactive).
  // Otherwise, after deleting the last rule, the list correctly went to 0
  // while the badges remained stale at 1, which looked like "no data but
  // 1 on All and Active" for the trip.
  const { data: countsData } = useQuery({
    queryKey: ["recurring-availability", "counts", tripId],
    queryFn: async () => {
      const response = await apiClient.get("/recurring-availability/counts", {
        params: {
          trip_id: tripId,
        },
      });
      return response || { all: 0, active: 0, inactive: 0 };
    },
    enabled: !!tripId,
    staleTime: 0,
    gcTime: 0,
  });

  const statusCounts = countsData || { all: 0, active: 0, inactive: 0 };

  // Fetch recurring rules (no caching, always fresh data)
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ["recurring-availability", tripId],
    queryFn: async () => {
      const response = await apiClient.get("/recurring-availability", {
        params: {
          trip_id: tripId,
        },
      });
      return {
        rules: (response?.data || []) as RecurringRule[],
        total: response?.total || 0,
      };
    },
    enabled: !!tripId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache the data (replaces cacheTime in newer versions)
  });

  const allRules = rulesData?.rules || [];

  // Filter rules based on status and search
  const rules = useMemo(() => {
    let filtered = allRules;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (r: RecurringRule) => r.status === statusFilter,
      );
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r: RecurringRule) =>
          (r.name && r.name.toLowerCase().includes(search)) ||
          formatRulePattern(r).toLowerCase().includes(search),
      );
    }

    return filtered;
  }, [allRules, statusFilter, searchTerm]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/recurring-availability/${id}`);
    },
    onSuccess: () => {
      // Invalidate list AND badge counts. Both keys share the
      // ["recurring-availability", ...] prefix so a single call refreshes
      // both, but we keep the list key around in case a future refactor
      // narrows the prefix.
      queryClient.invalidateQueries({ queryKey: ["recurring-availability"] });
      showToast(__("Recurring rule deleted successfully", "yatra"), "success");
      setDeleteConfirm({ isOpen: false, rule: null });
      setSelectedIds([]);
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to delete rule", "yatra"),
        "error",
      );
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => apiClient.delete(`/recurring-availability/${id}`)),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-availability"] });
      showToast(__("Rules deleted successfully", "yatra"), "success");
      setSelectedIds([]);
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to delete rules", "yatra"),
        "error",
      );
    },
  });

  // Duplicate rule mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(
        `/recurring-availability/${id}/duplicate`,
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-availability"] });
      showToast(__("Rule duplicated successfully", "yatra"), "success");
      setDuplicateConfirm({ isOpen: false, rule: null });
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to duplicate rule", "yatra"),
        "error",
      );
    },
  });

  // Handle bulk actions
  const handleBulkApply = () => {
    if (!bulkAction || selectedIds.length === 0) {
      showToast(__("Please select rules and an action", "yatra"), "warning");
      return;
    }

    switch (bulkAction) {
      case "delete":
        if (
          confirm(
            __(
              "Are you sure you want to delete {count} rule(s)?",
              "yatra",
            ).replace("{count}", selectedIds.length.toString()),
          )
        ) {
          bulkDeleteMutation.mutate(selectedIds.map((id) => id.toString()));
        }
        break;
    }

    setBulkAction("");
  };

  // Toggle column visibility
  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Format date
  const formatDate = (dateString: string | null | undefined): string => {
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string; icon: React.ReactNode }
    > = {
      active: {
        label: __("Active", "yatra"),
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      inactive: {
        label: __("Inactive", "yatra"),
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
        icon: <XCircle className="w-3 h-3" />,
      },
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Define table columns (matching Specific Dates structure)
  const tableColumns = useMemo(() => {
    const cols = [];

    if (visibleColumns.name) {
      cols.push({
        key: "name",
        label: __("Rule Name", "yatra"),
        visible: visibleColumns.name,
        render: (rule: RecurringRule) => (
          <div className="flex flex-col">
            <button
              onClick={() => onEditRule(rule.id)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-left hover:underline"
            >
              {rule.name || formatRulePattern(rule)}
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {rule.rule_type === "weekly"
                ? __("Weekly", "yatra")
                : rule.rule_type === "monthly"
                  ? __("Monthly", "yatra")
                  : __("Interval", "yatra")}
            </span>
          </div>
        ),
      });
    }

    if (visibleColumns.pattern) {
      cols.push({
        key: "pattern",
        label: __("Pattern", "yatra"),
        visible: visibleColumns.pattern,
        render: (rule: RecurringRule) => (
          <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
            <RefreshCw className="w-3 h-3" />
            <span>{formatRulePattern(rule)}</span>
          </div>
        ),
      });
    }

    if (visibleColumns.start_date) {
      cols.push({
        key: "start_date",
        label: __("Start Date", "yatra"),
        visible: visibleColumns.start_date,
        render: (rule: RecurringRule) => (
          <div className="text-sm text-gray-900 dark:text-white">
            {formatDate(rule.start_date)}
          </div>
        ),
      });
    }

    if (visibleColumns.end_date) {
      cols.push({
        key: "end_date",
        label: __("End Date", "yatra"),
        visible: visibleColumns.end_date,
        render: (rule: RecurringRule) => (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {rule.end_date ? formatDate(rule.end_date) : __("Ongoing", "yatra")}
          </div>
        ),
      });
    }

    if (visibleColumns.capacity) {
      cols.push({
        key: "capacity",
        label: __("Capacity", "yatra"),
        visible: visibleColumns.capacity,
        render: (rule: RecurringRule) => (
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {rule.seats_total || 0}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {__("total", "yatra")}
            </span>
          </div>
        ),
      });
    }

    if (visibleColumns.generated) {
      cols.push({
        key: "generated",
        label: __("Generated", "yatra"),
        visible: visibleColumns.generated,
        render: (rule: RecurringRule) => (
          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {rule.generated_count || 0}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {__("dates", "yatra")}
            </span>
          </div>
        ),
      });
    }

    if (visibleColumns.price) {
      cols.push({
        key: "price",
        label: __("Price", "yatra"),
        visible: visibleColumns.price,
        render: (rule: RecurringRule) => (
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {rule.sale_price
              ? formatYatraMoney(Number(rule.sale_price) || 0, adminCurrency, {
                  zeroAsUnknown: false,
                })
              : rule.original_price
                ? formatYatraMoney(
                    Number(rule.original_price) || 0,
                    adminCurrency,
                    { zeroAsUnknown: false },
                  )
                : formatYatraMoney(0, adminCurrency, { zeroAsUnknown: false })}
          </div>
        ),
      });
    }

    if (visibleColumns.status) {
      cols.push({
        key: "status",
        label: __("Status", "yatra"),
        visible: visibleColumns.status,
        render: (rule: RecurringRule) => getStatusBadge(rule.status),
      });
    }

    return cols;
  }, [
    visibleColumns,
    formatRulePattern,
    formatDate,
    getStatusBadge,
    adminCurrency,
  ]);

  // Status toggle mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: "active" | "inactive";
    }) => {
      return await apiClient.put(`/recurring-availability/${id}`, { status });
    },
    onSuccess: () => {
      // Single prefix invalidation refreshes both the rules list
      // and the status badge counts (now keyed under the same prefix).
      queryClient.invalidateQueries({ queryKey: ["recurring-availability"] });
      showToast(__("Rule status updated successfully", "yatra"), "success");
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to update rule status", "yatra"),
        "error",
      );
    },
  });

  // Table actions (matching Specific Dates structure)
  const tableActions = useMemo(
    () => [
      {
        key: "edit",
        label: __("Edit", "yatra"),
        icon: <Edit className="w-4 h-4" />,
        onClick: (rule: RecurringRule) => onEditRule(rule.id),
      },
      {
        key: "set-inactive",
        label: __("Set Inactive", "yatra"),
        icon: <XCircle className="w-4 h-4" />,
        onClick: (rule: RecurringRule) => {
          toggleStatusMutation.mutate({ id: rule.id, status: "inactive" });
        },
        condition: (rule: RecurringRule) => rule.status === "active",
      },
      {
        key: "set-active",
        label: __("Set Active", "yatra"),
        icon: <CheckCircle className="w-4 h-4" />,
        onClick: (rule: RecurringRule) => {
          toggleStatusMutation.mutate({ id: rule.id, status: "active" });
        },
        condition: (rule: RecurringRule) => rule.status === "inactive",
      },
      {
        key: "duplicate",
        label: __("Duplicate", "yatra"),
        icon: <Copy className="w-4 h-4" />,
        onClick: (rule: RecurringRule) =>
          setDuplicateConfirm({ isOpen: true, rule }),
      },
      {
        key: "delete",
        label: __("Delete", "yatra"),
        icon: <Trash2 className="w-4 h-4" />,
        onClick: (rule: RecurringRule) =>
          setDeleteConfirm({ isOpen: true, rule }),
        variant: "destructive" as const,
      },
    ],
    [toggleStatusMutation, onEditRule],
  );

  return (
    <div className="space-y-6">
      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, rule: null })}
        onConfirm={() => {
          if (deleteConfirm.rule) {
            deleteMutation.mutate(deleteConfirm.rule.id);
          }
        }}
        title={__("Delete Recurring Rule", "yatra")}
        message={
          deleteConfirm.rule
            ? __(
                'Are you sure you want to delete the rule "{name}"? This action cannot be undone.',
                "yatra",
              ).replace(
                "{name}",
                deleteConfirm.rule.name ||
                  formatRulePattern(deleteConfirm.rule),
              )
            : __(
                "Are you sure you want to delete this rule? This action cannot be undone.",
                "yatra",
              )
        }
        confirmText={__("Delete", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={duplicateConfirm.isOpen}
        onClose={() => setDuplicateConfirm({ isOpen: false, rule: null })}
        onConfirm={() => {
          if (duplicateConfirm.rule) {
            duplicateMutation.mutate(duplicateConfirm.rule.id);
          }
        }}
        title={__("Duplicate Recurring Rule", "yatra")}
        message={__(
          "This will create a copy of this rule. You can edit it after creation.",
          "yatra",
        )}
        confirmText={__("Duplicate", "yatra")}
        cancelText={__("Cancel", "yatra")}
        isLoading={duplicateMutation.isPending}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {__("Recurring Rules", "yatra")}
          </h3>
          <Badge
            className={
              isSingleDayTrip
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
            }
          >
            {isSingleDayTrip
              ? __("Single-Day Trip", "yatra")
              : __("Multi-Day Trip", "yatra")}
          </Badge>
          <Badge
            className={
              isTravelerBased
                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
            }
          >
            {isTravelerBased
              ? __("Traveler-Based Pricing", "yatra")
              : __("Regular Pricing", "yatra")}
          </Badge>
        </div>
        <Button variant="outline" onClick={onAddRule}>
          <Plus className="w-4 h-4 mr-2" />
          {isSingleDayTrip
            ? __("Add Time Slots Rule", "yatra")
            : __("Add Recurring Rule", "yatra")}
        </Button>
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        {isSingleDayTrip
          ? __(
              "Create recurring time slots for your single-day trip (supports multiple time slots per day)",
              "yatra",
            )
          : __(
              "Automatically generate availability dates based on patterns",
              "yatra",
            )}
      </div>

      {/* Filters - Matching Specific Dates */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  placeholder={__("Search rules...", "yatra")}
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
                <option value="active">{__("Active", "yatra")}</option>
                <option value="inactive">{__("Inactive", "yatra")}</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
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

      {/* Bulk Action Toolbar - Matching Specific Dates */}
      <BulkActionToolbar
        selectedIds={selectedIds}
        bulkAction={bulkAction}
        setBulkAction={setBulkAction}
        onApply={handleBulkApply}
        onClearSelection={() => setSelectedIds([])}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusOptions={[
          { key: "all", label: __("All", "yatra"), count: statusCounts.all },
          {
            key: "active",
            label: __("Active", "yatra"),
            count: statusCounts.active,
          },
          {
            key: "inactive",
            label: __("Inactive", "yatra"),
            count: statusCounts.inactive,
          },
        ]}
        showColumnsDropdown={showColumnsDropdown}
        setShowColumnsDropdown={setShowColumnsDropdown}
        columnOptions={[
          {
            key: "name",
            label: __("Rule Name", "yatra"),
            visible: visibleColumns.name,
          },
          {
            key: "pattern",
            label: __("Pattern", "yatra"),
            visible: visibleColumns.pattern,
          },
          {
            key: "start_date",
            label: __("Start Date", "yatra"),
            visible: visibleColumns.start_date,
          },
          {
            key: "end_date",
            label: __("End Date", "yatra"),
            visible: visibleColumns.end_date,
          },
          {
            key: "capacity",
            label: __("Capacity", "yatra"),
            visible: visibleColumns.capacity,
          },
          {
            key: "generated",
            label: __("Generated", "yatra"),
            visible: visibleColumns.generated,
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
        onToggleColumn={(columnKey: string) =>
          toggleColumn(columnKey as keyof typeof visibleColumns)
        }
        bulkMutationPending={bulkDeleteMutation.isPending}
        totalItems={rules.length}
        bulkActionOptions={[{ value: "delete", label: __("Delete", "yatra") }]}
      />

      {/* Recurring Rules Section - Matching Specific Dates */}
      <Card>
        <CardContent className="pt-6">
          {/* Section Header */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {__("Recurring Rules", "yatra")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {tripName && (
                <>
                  {__("Managing availability for", "yatra")}{" "}
                  <strong>{tripName}</strong>
                  {rules.length > 0 && (
                    <span className="ml-2">
                      ({rules.length}{" "}
                      {rules.length === 1
                        ? __("rule", "yatra")
                        : __("rules", "yatra")}
                      )
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          <SharedTable
            data={rules}
            columns={tableColumns}
            actions={tableActions}
            isLoading={isLoading}
            isError={false}
            selectedItemIds={selectedIds}
            onSelectItem={(id, checked) => {
              if (checked) {
                setSelectedIds([...selectedIds, id]);
              } else {
                setSelectedIds(selectedIds.filter((sid) => sid !== id));
              }
            }}
            onSelectAll={(checked) => {
              if (checked) {
                setSelectedIds(rules.map((r: RecurringRule) => r.id));
              } else {
                setSelectedIds([]);
              }
            }}
            isAllSelected={
              selectedIds.length === rules.length && rules.length > 0
            }
            getItemId={(rule) => rule.id}
            emptyText={__("No recurring rules found", "yatra")}
            emptyDescription={__(
              "Create your first recurring rule to get started",
              "yatra",
            )}
            onCreateClick={onAddRule}
            skeletonRows={5}
            capability="yatra_view_trips"
          />
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                {__("How Recurring Rules Work", "yatra")}
              </h5>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>
                  •{" "}
                  {__(
                    "Dates are generated automatically based on your patterns",
                    "yatra",
                  )}
                </li>
                <li>
                  •{" "}
                  {__(
                    "Specific dates (added manually) take priority over generated dates",
                    "yatra",
                  )}
                </li>
                <li>
                  •{" "}
                  {__(
                    "Use excluded dates to skip holidays or special occasions",
                    "yatra",
                  )}
                </li>
                <li>
                  •{" "}
                  {__(
                    "Bookings for generated dates create specific availability entries",
                    "yatra",
                  )}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecurringRules;
