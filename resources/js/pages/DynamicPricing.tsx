/**
 * Dynamic Pricing Page
 *
 * Premium module for intelligent price adjustments.
 * This page only loads when Yatra Pro is active and module is enabled.
 * Premium upgrade content is handled by premium-pages/DynamicPricing.tsx
 *
 * @package Yatra
 * @since 3.0.0
 */

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { PageHeader } from "../components/common/PageHeader";
import { RuleTypeSelectionModal } from "../components/modals/RuleTypeSelectionModal";
import { Toggle } from "../components/ui/toggle";
import { useToast } from "../components/ui/toast";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { Table as SharedTable } from "../components/shared/Table";
import { SearchFilterToolbar, BulkActionToolbar } from "../components/shared";
import { apiClient } from "../lib/api-client";
import { __ } from "../lib/i18n";
import { formatYatraMoney } from "../lib/currency-display";
import PremiumUpgradeCard from "./premium-pages/DynamicPricing";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Clock,
  Target,
  Check,
  Package,
  BarChart,
  Settings,
  Plus,
  AlertCircle,
  Edit,
  Trash2,
  DollarSign,
  CheckCircle,
  Save,
} from "lucide-react";

// Check if module is available (Pro active)
const isModuleAvailable = (): boolean => {
  const yatraAdmin = (window as any)?.yatraAdmin;
  return Boolean(yatraAdmin?.isPro);
};

// Main Component
const DynamicPricingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("rules");
  const [showRuleTypeModal, setShowRuleTypeModal] = useState(false);
  const [settings, setSettings] = useState({
    rule_priority_mode: "highest",
    maximum_markup_percent: 50,
    maximum_discount_percent: 30,
    calculation_period: 7,
    update_frequency: "hourly",
    show_original_price: true,
    show_savings_badge: true,
    show_urgency_messages: false,
    /** discounted = rules use sale/effective price; regular = rules use list price when known */
    calculation_base: "discounted" as "discounted" | "regular",
  });
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    rule: any | null;
    title?: string;
    message?: string;
    confirmText?: string;
    variant?: "danger" | "warning" | "info";
    isLoading?: boolean;
    onConfirm?: () => void | Promise<void>;
  }>({
    isOpen: false,
    rule: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  const closeConfirmDialog = () =>
    setConfirmDialog({
      isOpen: false,
      rule: null,
      title: "",
      message: "",
      confirmText: "",
      variant: "danger",
      isLoading: false,
      onConfirm: () => {},
    });

  const invalidateRules = () => {
    queryClient.invalidateQueries({ queryKey: ["dynamic-pricing-rules"] });
    queryClient.invalidateQueries({
      queryKey: ["dynamic-pricing-statistics"],
    });
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await apiClient.post("/dynamic-pricing/settings", settings);
      showToast(__("Settings saved successfully"), "success");
    } catch (error) {
      console.error("Failed to save settings:", error);
      showToast(__("Failed to save settings. Please try again."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectRuleType = (ruleType: string) => {
    const baseUrl = window.location.href.split("&action=")[0];
    window.location.href = `${baseUrl}&action=create-pricing-rule&rule_type=${ruleType}`;
  };

  // Show premium upgrade content if module is not available
  if (!isModuleAvailable()) return <PremiumUpgradeCard />;

  // Fetch settings from backend
  const { data: settingsData } = useQuery({
    queryKey: ["dynamic-pricing-settings"],
    queryFn: async () => {
      const response = await apiClient.get("/dynamic-pricing/settings");
      const body = (response as any)?.data ?? response;
      const payload = (body as any)?.data ?? body;
      return payload && typeof payload === "object" ? payload : {};
    },
  });

  // Update settings state when data is loaded
  React.useEffect(() => {
    if (settingsData && typeof settingsData === "object") {
      setSettings((prev) => ({
        ...prev,
        ...settingsData,
        calculation_base:
          (settingsData as any).calculation_base === "regular"
            ? "regular"
            : "discounted",
      }));
    }
  }, [settingsData]);

  // Fetch pricing rules
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ["dynamic-pricing-rules"],
    queryFn: async () => {
      const response = await apiClient.get("/dynamic-pricing/rules");

      return response;
    },
  });

  // Fetch statistics
  const {
    data: statsData,
    isLoading: isStatsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["dynamic-pricing-statistics"],
    queryFn: async () => {
      const response = await apiClient.get("/dynamic-pricing/statistics");

      return response;
    },
  });

  // The API client returns the decoded JSON body.
  // Some endpoints return { data: {...} } while others might return { data: { data: {...} } }.
  const rulesPayload =
    (rulesData as any)?.data?.data ?? (rulesData as any)?.data ?? [];
  const statsPayload =
    (statsData as any)?.data?.data ?? (statsData as any)?.data ?? {};

  const rules = rulesPayload || [];
  const stats = statsPayload || {};

  const globalCurrency = (window as any)?.yatraAdmin?.currency || "USD";
  const formatCurrencyAmount = (amount: number) =>
    formatYatraMoney(Number(amount) || 0, globalCurrency, {
      zeroAsUnknown: false,
    });

  const trendData = Array.isArray(
    (stats as any)?.pricing_history_trend_last_30_days,
  )
    ? (stats as any).pricing_history_trend_last_30_days.map((row: any) => {
        const day = String(row.day || "");
        const dateLabel = day ? new Date(day).toLocaleDateString() : "";
        return {
          day,
          dateLabel,
          events: Number(row.events) || 0,
          totalAdjustmentAmount: Number(row.total_adjustment_amount) || 0,
          avgAdjustmentPercentage: Number(row.avg_adjustment_percentage) || 0,
        };
      })
    : [];

  const ruleImpact = Array.isArray(
    (stats as any)?.pricing_history_rule_impact_last_30_days,
  )
    ? (stats as any).pricing_history_rule_impact_last_30_days
    : [];

  const analyticsLoading = isLoading || isStatsLoading;
  const statsErrorMessage = statsError
    ? (statsError as any)?.message || String(statsError)
    : "";

  // Filter and sort rules
  const filteredRules = useMemo(() => {
    let filtered = [...rules];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (rule: any) =>
          rule.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rule.rule_type?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply status filter. The "All" view excludes Trash by WordPress
    // convention — trashed rules are only visible from the Trash filter.
    if (statusFilter === "all") {
      filtered = filtered.filter((rule: any) => rule.status !== "trash");
    } else {
      filtered = filtered.filter((rule: any) => rule.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "created_at" || sortBy === "updated_at") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [rules, searchTerm, statusFilter, sortBy, sortOrder]);

  // Bulk action mutation. Uses Promise.allSettled so a single failed row does
  // not throw away the work that succeeded; the toast reports partial state.
  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: number[] }) => {
      const requests = ids.map((id) => {
        if (action === "delete") {
          return apiClient.delete(`/dynamic-pricing/rules/${id}`);
        } else if (action === "restore") {
          return apiClient.put(`/dynamic-pricing/rules/${id}`, {
            status: "active",
          });
        } else if (action === "trash") {
          return apiClient.put(`/dynamic-pricing/rules/${id}`, {
            status: "trash",
          });
        } else if (action === "active" || action === "inactive") {
          return apiClient.put(`/dynamic-pricing/rules/${id}`, {
            status: action,
          });
        }
        return Promise.resolve();
      });

      const results = await Promise.allSettled(requests);
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - succeeded;
      return { succeeded, failed, total: results.length };
    },
    onSuccess: (result) => {
      invalidateRules();
      setSelectedIds([]);
      setBulkAction("");

      if (result.failed === 0) {
        showToast(__("Bulk action completed successfully"), "success");
      } else if (result.succeeded === 0) {
        showToast(__("Failed to complete bulk action"), "error");
      } else {
        showToast(
          `${result.succeeded}/${result.total} ${__("rules updated; some failed")}`,
          "warning",
        );
      }
    },
    onError: () => {
      showToast(__("Failed to complete bulk action"), "error");
    },
  });

  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(__("Select a bulk action first"), "warning");
      return;
    }
    if (selectedIds.length === 0) {
      showToast(__("Select at least one rule"), "warning");
      return;
    }
    bulkMutation.mutate({ action: bulkAction, ids: selectedIds });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={__("Dynamic Pricing")}
        description={__(
          "Intelligent price adjustments based on demand, seasonality, and booking patterns",
        )}
      />

      {/* Tabs with Create Button */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("rules")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "rules"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <Target className="w-5 h-5 inline-block mr-2" />
              {__("Pricing Rules")}
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "analytics"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <BarChart className="w-5 h-5 inline-block mr-2" />
              {__("Analytics")}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "settings"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <Settings className="w-5 h-5 inline-block mr-2" />
              {__("Settings")}
            </button>
          </nav>

          {activeTab === "rules" && (
            <Button onClick={() => setShowRuleTypeModal(true)} className="mb-4">
              <Plus className="w-4 h-4 mr-2" />
              {__("Create Rule")}
            </Button>
          )}
        </div>
      </div>

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                      </div>
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Total Rules")}
                      </p>
                      <p className="text-3xl font-bold">
                        {stats.total_rules || 0}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Active Rules")}
                      </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {stats.active_rules || 0}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Inactive Rules")}
                      </p>
                      <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                        {stats.inactive_rules || 0}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Rule Types")}
                      </p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {stats.rule_types_used || 0}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filter Toolbar */}
          <Card>
            <CardContent className="pt-6">
              <SearchFilterToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                statusOptions={[
                  { value: "all", label: __("All Status") },
                  { value: "active", label: __("Active") },
                  { value: "inactive", label: __("Inactive") },
                  { value: "trash", label: __("Trash") },
                ]}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                sortOptions={[
                  { value: "name", label: __("Name") },
                  { value: "priority", label: __("Priority") },
                  { value: "created_at", label: __("Created Date") },
                  { value: "updated_at", label: __("Updated Date") },
                ]}
                onResetFilters={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSortBy("name");
                  setSortOrder("asc");
                }}
                hasFilters={
                  !!searchTerm ||
                  statusFilter !== "all" ||
                  sortBy !== "name" ||
                  sortOrder !== "asc"
                }
                placeholder={__("Search rules...")}
              />
            </CardContent>
          </Card>

          {/* Bulk Action Toolbar */}
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
                label: __("All"),
                count:
                  stats.total_rules ??
                  rules.filter((r: any) => r.status !== "trash").length,
              },
              {
                key: "active",
                label: __("Active"),
                count: stats.active_rules || 0,
              },
              {
                key: "inactive",
                label: __("Inactive"),
                count: stats.inactive_rules || 0,
              },
              {
                key: "trash",
                label: __("Trash"),
                count: stats.trash_rules || 0,
              },
            ]}
            showColumnsDropdown={showColumnsDropdown}
            setShowColumnsDropdown={setShowColumnsDropdown}
            columnOptions={[
              { key: "name", label: __("Rule Name"), visible: true },
              { key: "adjustment", label: __("Adjustment"), visible: true },
              {
                key: "applicable_trips",
                label: __("Applicable To"),
                visible: true,
              },
              { key: "priority", label: __("Priority"), visible: true },
              { key: "status", label: __("Status"), visible: true },
              { key: "created_at", label: __("Created"), visible: true },
            ]}
            onToggleColumn={() => {}}
            bulkMutationPending={bulkMutation.isPending}
            totalItems={filteredRules.length}
            bulkActionOptions={
              statusFilter === "trash"
                ? [
                    { value: "restore", label: __("Restore") },
                    { value: "delete", label: __("Delete Permanently") },
                  ]
                : [
                    { value: "active", label: __("Mark as Active") },
                    { value: "inactive", label: __("Mark as Inactive") },
                    { value: "trash", label: __("Move to Trash") },
                  ]
            }
          />

          {/* Rules List */}
          <Card>
            <CardHeader>
              <CardTitle>{__("Pricing Rules")}</CardTitle>
              <CardDescription>
                {__("Manage your dynamic pricing rules")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <SharedTable
                data={filteredRules}
                columns={[
                  {
                    key: "name",
                    label: __("Rule Name"),
                    sortable: true,
                    visible: true,
                    render: (rule: any) => (
                      <div>
                        <a
                          href={`${window.location.href.split("&action=")[0]}&action=edit-pricing-rule&id=${rule.id}`}
                          className={`font-medium hover:underline transition-colors cursor-pointer ${
                            rule.status === "trash" || statusFilter === "trash"
                              ? "text-gray-400 dark:text-gray-600"
                              : "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          }`}
                        >
                          {rule.name}
                        </a>
                        <div
                          className={`text-sm ${
                            rule.status === "trash" || statusFilter === "trash"
                              ? "text-gray-400 dark:text-gray-600"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {rule.rule_type?.replace("_", " ")}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "adjustment",
                    label: __("Adjustment"),
                    visible: true,
                    render: (rule: any) => (
                      <span className="font-medium text-gray-900 dark:text-white">
                        {rule.adjustment_type === "percentage"
                          ? `${rule.adjustment_value > 0 ? "+" : ""}${rule.adjustment_value}%`
                          : formatYatraMoney(
                              Number(rule.adjustment_value) || 0,
                              globalCurrency,
                              { zeroAsUnknown: false },
                            )}
                      </span>
                    ),
                  },
                  {
                    key: "applicable_trips",
                    label: __("Applicable To"),
                    visible: true,
                    render: (rule: any) => (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {rule.applicable_trips === "all"
                          ? __("All Trips")
                          : __("Specific Trips")}
                      </span>
                    ),
                  },
                  {
                    key: "priority",
                    label: __("Priority"),
                    sortable: true,
                    visible: true,
                    render: (rule: any) => (
                      <Badge variant="outline">{rule.priority}</Badge>
                    ),
                  },
                  {
                    key: "status",
                    label: __("Status"),
                    sortable: true,
                    visible: true,
                    render: (rule: any) => (
                      <Badge
                        variant={
                          rule.status === "active" ? "success" : "outline"
                        }
                      >
                        {rule.status}
                      </Badge>
                    ),
                  },
                  {
                    key: "created_at",
                    label: __("Created"),
                    sortable: true,
                    visible: true,
                    render: (rule: any) => (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(rule.created_at).toLocaleDateString()}
                      </span>
                    ),
                  },
                ]}
                actions={[
                  {
                    key: "edit",
                    label: __("Edit"),
                    icon: <Edit className="w-4 h-4" />,
                    onClick: (rule: any) => {
                      const baseUrl = window.location.href.split("&action=")[0];
                      window.location.href = `${baseUrl}&action=edit-pricing-rule&id=${rule.id}`;
                    },
                  },
                  {
                    key: "active",
                    label: __("Mark as Active"),
                    icon: <Check className="w-4 h-4" />,
                    onClick: (rule: any) => {
                      setConfirmDialog({
                        isOpen: true,
                        rule,
                        title: __("Mark as Active"),
                        message: __(
                          "Are you sure you want to mark this pricing rule as active? It will start applying to trip pricing.",
                        ),
                        onConfirm: async () => {
                          try {
                            await apiClient.put(
                              `/dynamic-pricing/rules/${rule.id}`,
                              {
                                status: "active",
                              },
                            );
                            showToast(
                              __("Pricing rule marked as active successfully"),
                              "success",
                            );
                            queryClient.invalidateQueries({
                              queryKey: ["dynamic-pricing-rules"],
                            });
                            queryClient.invalidateQueries({
                              queryKey: ["dynamic-pricing-statistics"],
                            });
                            setConfirmDialog({
                              isOpen: false,
                              rule: null,
                              title: "",
                              message: "",
                              onConfirm: () => {},
                            });
                          } catch (error) {
                            showToast(
                              __("Failed to update pricing rule status"),
                              "error",
                            );
                          }
                        },
                      });
                    },
                    condition: (rule: any) =>
                      rule.status !== "active" && rule.status !== "trash",
                  },
                  {
                    key: "inactive",
                    label: __("Mark as Inactive"),
                    icon: <AlertCircle className="w-4 h-4" />,
                    onClick: (rule: any) => {
                      setConfirmDialog({
                        isOpen: true,
                        rule,
                        title: __("Mark as Inactive"),
                        message: __(
                          "Are you sure you want to mark this pricing rule as inactive? It will no longer apply to trip pricing.",
                        ),
                        onConfirm: async () => {
                          try {
                            await apiClient.put(
                              `/dynamic-pricing/rules/${rule.id}`,
                              {
                                status: "inactive",
                              },
                            );
                            showToast(
                              __(
                                "Pricing rule marked as inactive successfully",
                              ),
                              "success",
                            );
                            queryClient.invalidateQueries({
                              queryKey: ["dynamic-pricing-rules"],
                            });
                            queryClient.invalidateQueries({
                              queryKey: ["dynamic-pricing-statistics"],
                            });
                            setConfirmDialog({
                              isOpen: false,
                              rule: null,
                              title: "",
                              message: "",
                              onConfirm: () => {},
                            });
                          } catch (error) {
                            showToast(
                              __("Failed to update pricing rule status"),
                              "error",
                            );
                          }
                        },
                      });
                    },
                    condition: (rule: any) => rule.status === "active",
                  },
                  {
                    key: "restore",
                    label: __("Restore"),
                    icon: <Check className="w-4 h-4" />,
                    onClick: (rule: any) => {
                      setConfirmDialog({
                        isOpen: true,
                        rule,
                        title: __("Restore Rule"),
                        message: __(
                          "Are you sure you want to restore this pricing rule? It will be moved back to active status.",
                        ),
                        onConfirm: async () => {
                          try {
                            await apiClient.put(
                              `/dynamic-pricing/rules/${rule.id}`,
                              {
                                status: "active",
                              },
                            );
                            showToast(
                              __("Pricing rule restored successfully"),
                              "success",
                            );
                            queryClient.invalidateQueries({
                              queryKey: ["dynamic-pricing-rules"],
                            });
                            queryClient.invalidateQueries({
                              queryKey: ["dynamic-pricing-statistics"],
                            });
                            setConfirmDialog({
                              isOpen: false,
                              rule: null,
                              title: "",
                              message: "",
                              onConfirm: () => {},
                            });
                          } catch (error) {
                            showToast(
                              __("Failed to restore pricing rule"),
                              "error",
                            );
                          }
                        },
                      });
                    },
                    condition: (rule: any) =>
                      rule.status === "trash" || statusFilter === "trash",
                  },
                  {
                    key: "trash",
                    label: __("Move to Trash"),
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: (rule: any) => {
                      setConfirmDialog({
                        isOpen: true,
                        rule,
                        title: __("Move Rule to Trash"),
                        message: __(
                          "Are you sure you want to move this pricing rule to Trash? It will stop applying to trip pricing immediately. You can restore it from the Trash filter.",
                        ),
                        confirmText: __("Move to Trash"),
                        variant: "warning",
                        onConfirm: async () => {
                          setConfirmDialog((prev) => ({
                            ...prev,
                            isLoading: true,
                          }));
                          try {
                            await apiClient.put(
                              `/dynamic-pricing/rules/${rule.id}`,
                              { status: "trash" },
                            );
                            showToast(
                              __("Pricing rule moved to Trash"),
                              "success",
                            );
                            invalidateRules();
                            closeConfirmDialog();
                          } catch (error) {
                            setConfirmDialog((prev) => ({
                              ...prev,
                              isLoading: false,
                            }));
                            showToast(
                              __("Failed to move rule to Trash"),
                              "error",
                            );
                          }
                        },
                      });
                    },
                    condition: (rule: any) =>
                      rule.status !== "trash" && statusFilter !== "trash",
                  },
                  {
                    key: "delete",
                    label: __("Delete Permanently"),
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: (rule: any) => {
                      setConfirmDialog({
                        isOpen: true,
                        rule,
                        title: __("Delete Pricing Rule Permanently"),
                        message: __(
                          "This will permanently delete the pricing rule. This action cannot be undone. Continue?",
                        ),
                        confirmText: __("Delete Permanently"),
                        variant: "danger",
                        onConfirm: async () => {
                          setConfirmDialog((prev) => ({
                            ...prev,
                            isLoading: true,
                          }));
                          try {
                            await apiClient.delete(
                              `/dynamic-pricing/rules/${rule.id}`,
                            );
                            showToast(
                              __("Pricing rule deleted permanently"),
                              "success",
                            );
                            invalidateRules();
                            closeConfirmDialog();
                          } catch (error) {
                            setConfirmDialog((prev) => ({
                              ...prev,
                              isLoading: false,
                            }));
                            showToast(
                              __("Failed to delete rule"),
                              "error",
                            );
                          }
                        },
                      });
                    },
                    condition: (rule: any) =>
                      rule.status === "trash" || statusFilter === "trash",
                    variant: "destructive",
                  },
                ]}
                selectedItemIds={selectedIds}
                onSelectItem={(id, checked) => {
                  if (checked) {
                    setSelectedIds([...selectedIds, id as number]);
                  } else {
                    setSelectedIds(
                      selectedIds.filter((selectedId) => selectedId !== id),
                    );
                  }
                }}
                onSelectAll={(checked) => {
                  if (checked) {
                    setSelectedIds(filteredRules.map((rule: any) => rule.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
                isAllSelected={
                  selectedIds.length === filteredRules.length &&
                  filteredRules.length > 0
                }
                getItemId={(rule: any) => rule.id}
                isLoading={isLoading}
                emptyText={__("No pricing rules found")}
                emptyDescription={__(
                  'Click "Create Rule" button above to get started',
                )}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Total Rules")}
                      </p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.total_rules || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {__("All pricing rules")}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Active Rules")}
                      </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {stats.active_rules || 0}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {__("Currently active")}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Inactive Rules")}
                      </p>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {stats.inactive_rules || 0}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        {__("Paused rules")}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Rule Types Used")}
                      </p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {stats.rule_types_used || 0}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        {__("Different types")}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pricing History Metrics (what powers analytics) */}
          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-2 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Pricing Events")}
                      </p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.pricing_history_total || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {__("Recorded price adjustments")}
                      </p>
                    </div>
                    <BarChart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Trips Affected")}
                      </p>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {stats.pricing_history_trips_affected || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {__("Unique trips with adjustments")}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Avg Adjustment")}
                      </p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {typeof stats.pricing_history_avg_adjustment_percentage ===
                        "number"
                          ? `${stats.pricing_history_avg_adjustment_percentage.toFixed(2)}%`
                          : "0%"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {__("Average % change")}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__("Last 30 Days")}
                      </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {stats.pricing_history_last_30_days || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {__("Recent pricing events")}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rule Performance */}
          <Card>
            <CardHeader>
              <CardTitle>{__("Rule Performance")}</CardTitle>
              <CardDescription>
                {__("How each pricing rule is performing")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                      </div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {ruleImpact.length > 0 ? (
                    ruleImpact.map((ri: any) => (
                      <div
                        key={ri.rule_id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {ri.name || `${__("Rule")} #${ri.rule_id}`}
                            </h4>
                            <Badge
                              variant="default"
                              className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                            >
                              {(ri.rule_type || "").replace("_", " ")}
                            </Badge>
                            <Badge variant="outline">
                              {ri.adjustment_type || ""}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>
                              {__("Events")}: {ri.events || 0}
                            </span>
                            <span>•</span>
                            <span>
                              {__("Avg Adjustment")}:{" "}
                              {typeof ri.avg_adjustment_value === "number"
                                ? ri.avg_adjustment_value.toFixed(2)
                                : Number(ri.avg_adjustment_value || 0).toFixed(
                                    2,
                                  )}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {__("Impact (30d)")}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrencyAmount(
                              Number(ri.total_adjustment_amount) || 0,
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      {rules.length > 0 ? (
                        <>
                          <p>
                            {__(
                              "No rule-level impact recorded in the last 30 days",
                            )}
                          </p>
                          <p className="text-sm mt-2 max-w-lg mx-auto">
                            {__(
                              "Charts use dynamic pricing history when a booking applies an adjusted price. Complete a checkout (or recalculate pricing) after rules are active to populate metrics.",
                            )}
                          </p>
                        </>
                      ) : (
                        <>
                          <p>{__("No pricing rules created yet")}</p>
                          <p className="text-sm mt-2">
                            {__(
                              "Create your first rule to see performance metrics",
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{__("Revenue Impact Trend")}</CardTitle>
              <CardDescription>
                {__(
                  "30-day revenue comparison with and without dynamic pricing",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!analyticsLoading && statsErrorMessage ? (
                <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                  {__("Failed to load statistics:")} {statsErrorMessage}
                </div>
              ) : null}

              {analyticsLoading ? (
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : trendData.length > 0 ? (
                <div className="space-y-4">
                  <div className="w-full" style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendData}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v: any) =>
                            v ? new Date(String(v)).toLocaleDateString() : ""
                          }
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v: any) =>
                            formatCurrencyAmount(Number(v) || 0)
                          }
                        />
                        <Tooltip
                          formatter={(value: any, name: any) => {
                            if (name === "totalAdjustmentAmount") {
                              return [
                                formatCurrencyAmount(Number(value) || 0),
                                __("Revenue Impact"),
                              ];
                            }
                            if (name === "events") {
                              return [Number(value) || 0, __("Events")];
                            }
                            if (name === "avgAdjustmentPercentage") {
                              return [
                                `${Number(value || 0).toFixed(2)}%`,
                                __("Avg Adjustment"),
                              ];
                            }
                            return [value, name];
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalAdjustmentAmount"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full overflow-x-auto">
                    <div className="max-h-[420px] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full table-fixed border-collapse text-sm">
                        <thead className="sticky top-0 bg-white dark:bg-gray-900">
                          <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <th className="py-3 px-4 w-1/4">{__("Date")}</th>
                            <th className="py-3 px-4 w-1/6 text-right">
                              {__("Events")}
                            </th>
                            <th className="py-3 px-4 w-1/3 text-right">
                              {__("Revenue Impact")}
                            </th>
                            <th className="py-3 px-4 w-1/4 text-right">
                              {__("Avg Adjustment")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {trendData.map((row: any) => (
                            <tr
                              key={row.day}
                              className="border-b border-gray-100 dark:border-gray-800"
                            >
                              <td className="py-3 px-4 text-gray-900 dark:text-white">
                                {row.day
                                  ? new Date(
                                      String(row.day),
                                    ).toLocaleDateString()
                                  : ""}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                                {row.events ?? 0}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-900 dark:text-white tabular-nums">
                                {formatCurrencyAmount(
                                  Number(row.totalAdjustmentAmount) || 0,
                                )}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-900 dark:text-white tabular-nums">{`${Number(row.avgAdjustmentPercentage || 0).toFixed(2)}%`}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="text-center px-4">
                    <p className="text-gray-500 dark:text-gray-400">
                      {Number(stats.pricing_history_total) > 0 &&
                      Number(stats.pricing_history_last_30_days) === 0
                        ? __(
                            "No pricing events in the last 30 days (older history exists).",
                          )
                        : __("No pricing history in the last 30 days")}
                    </p>
                    {rules.length > 0 &&
                    Number(stats.pricing_history_total) === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
                        {__(
                          "Revenue impact is recorded when a booking uses a trip price adjusted by your rules. Place a test booking to see this chart fill in.",
                        )}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{__("General Settings")}</CardTitle>
              <CardDescription>
                {__("Configure global dynamic pricing behavior")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__("Rule calculation base")}
                    </label>
                    <select
                      value={settings.calculation_base || "discounted"}
                      onChange={(e) =>
                        handleSettingChange(
                          "calculation_base",
                          e.target.value === "regular"
                            ? "regular"
                            : "discounted",
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="discounted">
                        {__(
                          "Promotional / sale price (stack dynamic pricing on the price customers already see after trip discounts)",
                        )}
                      </option>
                      <option value="regular">
                        {__(
                          "Regular list price (compute adjustments from catalog price; requires original price in context)",
                        )}
                      </option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__(
                        "Choose whether percentage and fixed rules use the discounted trip price or the regular list price as their starting point. Bookings and availability pass both values when possible.",
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__("Rule Priority Mode")}
                    </label>
                    <select
                      value={settings.rule_priority_mode}
                      onChange={(e) =>
                        handleSettingChange(
                          "rule_priority_mode",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="highest">
                        {__(
                          "Apply Largest Adjustment Only (one rule wins by magnitude)",
                        )}
                      </option>
                      <option value="cumulative">
                        {__("Apply All Matching Rules (Cumulative / Stack)")}
                      </option>
                      <option value="best">
                        {__("Apply Best Price for Customer (Lowest Final)")}
                      </option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__(
                        "How to combine matching rules. Caps below still apply afterwards. Per-rule numeric Priority is used as a tie-breaker when multiple rules tie for largest / best.",
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__("Maximum Price Increase (%)")}
                    </label>
                    <input
                      type="number"
                      value={settings.maximum_markup_percent}
                      onChange={(e) =>
                        handleSettingChange(
                          "maximum_markup_percent",
                          parseInt(e.target.value),
                        )
                      }
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__(
                        "Hard cap on upward adjustments (markup) across all matched rules to avoid surprising customers with sudden surges.",
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__("Maximum Price Decrease (%)")}
                    </label>
                    <input
                      type="number"
                      value={settings.maximum_discount_percent}
                      onChange={(e) =>
                        handleSettingChange(
                          "maximum_discount_percent",
                          parseInt(e.target.value),
                        )
                      }
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__(
                        "Hard cap on downward adjustments (discount) so dynamic pricing can never push a trip below this fraction of its base price.",
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Demand Calculation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{__("Demand Calculation")}</CardTitle>
              <CardDescription>
                {__("Configure how booking demand is calculated")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__("Calculation Period (Days)")}
                    </label>
                    <input
                      type="number"
                      value={settings.calculation_period}
                      onChange={(e) =>
                        handleSettingChange(
                          "calculation_period",
                          parseInt(e.target.value),
                        )
                      }
                      min="1"
                      max="30"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__("Number of days to analyze for demand trends")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__("Update Frequency")}
                    </label>
                    <select
                      value={settings.update_frequency}
                      onChange={(e) =>
                        handleSettingChange("update_frequency", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="hourly">{__("Every Hour")}</option>
                      <option value="daily">{__("Once Daily")}</option>
                      <option value="realtime">
                        {__("Real-time (On Each Booking)")}
                      </option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__("How often to recalculate demand scores")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{__("Display Settings")}</CardTitle>
              <CardDescription>
                {__("How dynamic pricing is shown to customers")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {__("Show Original Price")}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {__(
                          "Display crossed-out original price when discount applied",
                        )}
                      </p>
                    </div>
                    <Toggle
                      checked={settings.show_original_price}
                      onChange={(checked) =>
                        handleSettingChange("show_original_price", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {__("Show Savings Badge")}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {__('Display "Save X%" badge on discounted trips')}
                      </p>
                    </div>
                    <Toggle
                      checked={settings.show_savings_badge}
                      onChange={(checked) =>
                        handleSettingChange("show_savings_badge", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {__("Show Urgency Messages")}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {__(
                          'Display messages like "Price increases soon" for demand-based rules',
                        )}
                      </p>
                    </div>
                    <Toggle
                      checked={settings.show_urgency_messages}
                      onChange={(checked) =>
                        handleSettingChange("show_urgency_messages", checked)
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          {!isLoading && (
            <div className="flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6"
              >
                {isSaving ? (
                  <>
                    <Save className="w-4 h-4 mr-2 animate-spin" />
                    {__("Saving...")}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {__("Save Settings")}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Rule Type Selection Modal */}
      <RuleTypeSelectionModal
        isOpen={showRuleTypeModal}
        onClose={() => setShowRuleTypeModal(false)}
        onSelectType={handleSelectRuleType}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={() => confirmDialog.onConfirm?.()}
        title={confirmDialog.title || ""}
        message={confirmDialog.message || ""}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant ?? "danger"}
        isLoading={confirmDialog.isLoading ?? false}
      />
    </div>
  );
};

export default DynamicPricingPage;
