/**
 * Dynamic Pricing Rule Form Page
 *
 * Create and edit dynamic pricing rules with sidebar layout
 *
 * @package Yatra
 * @since 3.0.0
 */

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { DatePicker } from "../components/ui/date-picker";
import { PageHeader } from "../components/common/PageHeader";
import { RuleTypeSelectionModal } from "../components/modals/RuleTypeSelectionModal";
import { useToast } from "../components/ui/toast";
import { apiClient } from "../lib/api-client";
import { __ } from "../lib/i18n";
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  Clock,
  TrendingUp,
  Package,
  Sun,
  Target,
  Check,
} from "lucide-react";

interface RuleFormData {
  name: string;
  rule_type: string;
  adjustment_type: string;
  adjustment_value: number;
  min_days_before: number;
  max_days_before: number;
  min_inventory: number;
  max_inventory: number;
  start_date: string;
  end_date: string;
  applicable_trips: string;
  trip_ids: number[];
  status: string;
  priority: number;
  // Demand-based conditions
  demand_threshold_high?: number;
  demand_threshold_low?: number;
  // Time-based conditions. `weekend_days` is the source of truth — the engine
  // evaluates the rule only on those weekdays. The `apply_on_weekends` /
  // `apply_on_weekdays` columns still exist in the DB schema for legacy reasons
  // but the engine never reads them, so we don't surface them in the form to
  // avoid the impression they do anything.
  weekend_days?: string[];
}

const RULE_TYPES = [
  {
    id: "early_bird",
    name: __("Early Bird Discount"),
    description: __(
      "Reward customers who book well in advance. Always behaves as a discount.",
    ),
    icon: Calendar,
    color: "blue",
    example: __(
      "10% off when departure is at least 30 days away (set Min Days Before = 30).",
    ),
  },
  {
    id: "last_minute",
    name: __("Last Minute Deals"),
    description: __(
      "Discount close to departure to fill remaining seats. Always behaves as a discount.",
    ),
    icon: Clock,
    color: "orange",
    example: __(
      "15% off when departure is within 7 days (set Max Days Before = 7).",
    ),
  },
  {
    id: "demand",
    name: __("Demand-Based Pricing"),
    description: __(
      "Adjusts price by booking velocity score (recomputed by cron / on each booking).",
    ),
    icon: TrendingUp,
    color: "green",
    example: __(
      "Score above 70 → markup; below 30 → discount. Magnitude scales with how far the score is outside the band.",
    ),
  },
  {
    id: "inventory",
    name: __("Inventory-Based"),
    description: __(
      "Reacts to seats remaining on the chosen departure (works with time slots too).",
    ),
    icon: Package,
    color: "purple",
    example: __(
      "Seats ≤ 5 → +10% scarcity markup; seats ≥ 20 → 50% of magnitude as discount.",
    ),
  },
  {
    id: "seasonal",
    name: __("Seasonal Pricing"),
    description: __(
      "Applies when the DEPARTURE date falls within the season window.",
    ),
    icon: Sun,
    color: "yellow",
    example: __(
      "+25% on departures between Jul 1 – Aug 31. Use a negative value for off-peak discounts.",
    ),
  },
  {
    id: "time_based",
    name: __("Time-Based (Weekday/Weekend)"),
    description: __(
      "Applies on selected weekdays of the DEPARTURE date, optionally limited to a date window.",
    ),
    icon: Target,
    color: "indigo",
    example: __(
      "+15% premium on Saturday & Sunday departures. Add a date range to make it effective only for that period.",
    ),
  },
];

const DynamicPricingRuleForm: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const ruleId = urlParams.get("id");
  const ruleTypeFromUrl = urlParams.get("rule_type") || "";
  const isEdit = !!ruleId;

  const [formData, setFormData] = useState<RuleFormData>({
    name: "",
    rule_type: ruleTypeFromUrl,
    adjustment_type: "percentage",
    adjustment_value: 0,
    min_days_before: 0,
    max_days_before: 0,
    min_inventory: 0,
    max_inventory: 0,
    start_date: "",
    end_date: "",
    applicable_trips: "all",
    trip_ids: [],
    status: "active",
    priority: 1,
    demand_threshold_high: 80,
    demand_threshold_low: 30,
    weekend_days: [],
  });

  const [showTripDropdown, setShowTripDropdown] = useState(false);
  const [tripSearchQuery, setTripSearchQuery] = useState("");
  const [debouncedTripSearch, setDebouncedTripSearch] = useState("");
  const [showRuleTypeModal, setShowRuleTypeModal] = useState(false);

  // Rule simulation state — drives the "When will this apply?" panel.
  // We keep a small base price input so admins can see absolute dollar amounts
  // for the discount/markup rather than just percentages.
  const [previewBasePrice, setPreviewBasePrice] = useState<number>(100);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<{
    rule_type: string;
    base_price: number;
    current_date: string;
    scenarios: Array<{
      label: string;
      departure_date: string | null;
      spots_remaining: number | null;
      applies: boolean;
      base_price: number;
      final_price: number;
      adjustment: number;
      adjustment_percent: number;
    }>;
  } | null>(null);

  const handleSelectRuleType = (ruleType: string) => {
    handleChange("rule_type", ruleType);
    setShowRuleTypeModal(false);
    // A new rule type changes which scenarios are meaningful — drop the old
    // preview so stale results don't mislead the admin.
    setPreviewResult(null);
    setPreviewError(null);
  };

  const handleRunSimulation = async () => {
    if (!formData.rule_type) {
      setPreviewError(__("Pick a rule type first."));
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const response = await apiClient.post(
        "/dynamic-pricing/simulate-rule",
        {
          rule_type: formData.rule_type,
          adjustment_type: formData.adjustment_type,
          adjustment_value: formData.adjustment_value,
          min_days_before: formData.min_days_before,
          max_days_before: formData.max_days_before,
          min_inventory: formData.min_inventory,
          max_inventory: formData.max_inventory,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          weekend_days: formData.weekend_days || [],
          demand_threshold_low: formData.demand_threshold_low,
          demand_threshold_high: formData.demand_threshold_high,
          base_price: previewBasePrice > 0 ? previewBasePrice : 100,
        },
      );
      // Controller returns { success: true, data: {...scenarios...} } — checking
      // .success on .data would always be undefined and throw a false negative.
      const envelope = response as any;
      if (envelope?.success === false) {
        throw new Error(envelope?.message || __("Simulation failed."));
      }
      const result = envelope?.data ?? envelope;
      if (!result || !Array.isArray(result.scenarios)) {
        throw new Error(__("Simulation returned an unexpected response."));
      }
      setPreviewResult(result);
    } catch (e: any) {
      setPreviewError(e?.message || __("Simulation failed."));
    } finally {
      setPreviewLoading(false);
    }
  };

  // Debounce trip search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTripSearch(tripSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [tripSearchQuery]);

  // Fetch trips for selection
  const { data: tripsData } = useQuery({
    queryKey: ["trips-list", debouncedTripSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedTripSearch) {
        params.append("search", debouncedTripSearch);
      }
      params.append("per_page", "50");
      const response = await apiClient.get(`/trips?${params.toString()}`);
      return response.data || [];
    },
  });

  const tripOptions = (tripsData || []).map((trip: any) => ({
    value: trip.id,
    label: trip.title || `Trip #${trip.id}`,
  }));

  // Fetch existing rule if editing
  const {
    data: ruleData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["dynamic-pricing-rule", ruleId],
    queryFn: async () => {
      if (!ruleId) return null;
      const response = await apiClient.get(`/dynamic-pricing/rules/${ruleId}`);

      return response;
    },
    enabled: isEdit,
    retry: 1,
  });

  // Log loading state

  // Populate form with existing data
  useEffect(() => {
    if (ruleData?.data) {
      const ruleDetails = ruleData.data;

      setFormData({
        name: ruleDetails.name || "",
        rule_type: ruleDetails.rule_type || "",
        adjustment_type: ruleDetails.adjustment_type || "percentage",
        adjustment_value: Number(ruleDetails.adjustment_value) || 0,
        min_days_before: Number(ruleDetails.min_days_before) || 0,
        max_days_before: Number(ruleDetails.max_days_before) || 0,
        min_inventory: Number(ruleDetails.min_inventory) || 0,
        max_inventory: Number(ruleDetails.max_inventory) || 0,
        start_date: ruleDetails.start_date || "",
        end_date: ruleDetails.end_date || "",
        applicable_trips: ruleDetails.applicable_trips || "all",
        trip_ids: Array.isArray(ruleDetails.trip_ids)
          ? ruleDetails.trip_ids
          : ruleDetails.trip_ids
            ? JSON.parse(ruleDetails.trip_ids)
            : [],
        status: ruleDetails.status || "active",
        priority: Number(ruleDetails.priority) || 1,
        demand_threshold_high: ruleDetails.demand_threshold_high
          ? Number(ruleDetails.demand_threshold_high)
          : 80,
        demand_threshold_low: ruleDetails.demand_threshold_low
          ? Number(ruleDetails.demand_threshold_low)
          : 30,
        weekend_days: Array.isArray(ruleDetails.weekend_days)
          ? ruleDetails.weekend_days
          : ruleDetails.weekend_days
            ? JSON.parse(ruleDetails.weekend_days)
            : [],
      });
    }
  }, [ruleData]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: RuleFormData) => {
      if (isEdit) {
        return await apiClient.put(`/dynamic-pricing/rules/${ruleId}`, data);
      } else {
        return await apiClient.post("/dynamic-pricing/rules", data);
      }
    },
    onSuccess: (response) => {
      showToast(
        isEdit
          ? __("Pricing rule updated successfully")
          : __("Pricing rule created successfully"),
        "success",
      );
      queryClient.invalidateQueries({ queryKey: ["dynamic-pricing-rules"] });

      if (!isEdit && response?.data?.id) {
        // For new rules, redirect to edit page
        const baseUrl = window.location.href.split("&action=")[0];
        const editUrl = `${baseUrl}&action=edit-pricing-rule&id=${response.data.id}`;
        window.location.href = editUrl;
      }
      // For updates, stay on the same page (no redirect)
    },
    onError: (error: any) => {
      showToast(error?.message || __("Failed to save pricing rule"), "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    window.location.href = window.location.href.split("&action=")[0];
  };

  const handleChange = (field: keyof RuleFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Show error state if API call fails
  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={__("Edit Pricing Rule")}
          description={__(
            "Configure dynamic pricing rules to automatically adjust trip prices",
          )}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">
                {__("Failed to load pricing rule")}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {error?.message ||
                  __("An error occurred while fetching the rule data")}
              </p>
              <Button
                onClick={() =>
                  (window.location.href =
                    window.location.href.split("&action=")[0])
                }
              >
                {__("Back to Rules")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={__("Edit Pricing Rule")}
          description={__(
            "Configure dynamic pricing rules to automatically adjust trip prices",
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Skeleton - Left Side (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rule Type Badge Skeleton */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-5 w-48 mb-1" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rule Details Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Price Adjustment Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conditions Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applicable Trips Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton - Right Side (1/3) */}
          <div className="space-y-6">
            {/* Status & Priority Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Actions Skeleton */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const selectedRuleType = RULE_TYPES.find(
    (rt) => rt.id === formData.rule_type,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? __("Edit Pricing Rule") : __("Create Pricing Rule")}
        description={__(
          "Configure dynamic pricing rules to automatically adjust trip prices",
        )}
      />

      <form onSubmit={handleSubmit}>
        {/* Two Column Layout: Main Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Select Rule Type (Card-Based Selection) */}
            {!isEdit && !formData.rule_type && (
              <Card>
                <CardHeader>
                  <CardTitle>{__("Step 1: Select Rule Type")}</CardTitle>
                  <CardDescription>
                    {__(
                      "Choose the type of dynamic pricing rule you want to create",
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {RULE_TYPES.map((ruleType) => {
                      const Icon = ruleType.icon;
                      const colorClasses = {
                        blue: "border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 bg-blue-50 dark:bg-blue-900/20",
                        orange:
                          "border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 bg-orange-50 dark:bg-orange-900/20",
                        green:
                          "border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 bg-green-50 dark:bg-green-900/20",
                        purple:
                          "border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 bg-purple-50 dark:bg-purple-900/20",
                        yellow:
                          "border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
                        indigo:
                          "border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
                      };
                      return (
                        <button
                          key={ruleType.id}
                          type="button"
                          onClick={() => handleChange("rule_type", ruleType.id)}
                          className={`p-4 border-2 rounded-lg text-left transition-all cursor-pointer ${colorClasses[ruleType.color as keyof typeof colorClasses]}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {ruleType.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {ruleType.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                                {__("Example:")} {ruleType.example}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show selected rule type badge if editing or type selected */}
            {(isEdit || formData.rule_type) && selectedRuleType && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {React.createElement(selectedRuleType.icon, {
                        className: "w-5 h-5 text-gray-600 dark:text-gray-400",
                      })}
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {__("Rule Type")}
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {selectedRuleType.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {selectedRuleType.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRuleTypeModal(true)}
                    >
                      {__("Change")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Basic Information (Only show after rule type selected) */}
            {formData.rule_type && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{__("Rule Details")}</CardTitle>
                    <CardDescription>
                      {__(
                        "Internal name for this pricing rule (visible to admins only).",
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">{__("Rule Name")} *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder={__("e.g., Summer Early Bird Discount")}
                        required
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {__(
                          "Used in admin lists, analytics, and price-history exports. Customers never see this name.",
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{__("Price Adjustment")}</CardTitle>
                    <CardDescription>
                      {__("How much to adjust the price")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="adjustment_type">
                        {__("Adjustment Type")} *
                      </Label>
                      <Select
                        id="adjustment_type"
                        value={formData.adjustment_type}
                        onChange={(e) =>
                          handleChange("adjustment_type", e.target.value)
                        }
                        required
                      >
                        <option value="percentage">{__("Percentage")}</option>
                        <option value="fixed">{__("Fixed Amount")}</option>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="adjustment_value">
                        {__("Adjustment Value")} *
                      </Label>
                      <Input
                        id="adjustment_value"
                        type="number"
                        step="0.01"
                        value={formData.adjustment_value}
                        onChange={(e) =>
                          handleChange(
                            "adjustment_value",
                            parseFloat(e.target.value),
                          )
                        }
                        placeholder={
                          formData.adjustment_type === "percentage"
                            ? "10"
                            : "100"
                        }
                        required
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {(() => {
                          const rt = formData.rule_type;
                          // Early bird & last minute always behave as discounts:
                          // enter a positive magnitude.
                          if (rt === "early_bird" || rt === "last_minute") {
                            return formData.adjustment_type === "percentage"
                              ? __(
                                  "Enter the discount magnitude as a positive number (e.g. 10 = 10% off). The rule always applies as a discount.",
                                )
                              : __(
                                  "Enter the discount magnitude as a positive number (e.g. 100 = 100 off). The rule always applies as a discount.",
                                );
                          }
                          // Inventory & demand auto-derive direction from
                          // capacity / demand score; admins enter only the
                          // magnitude.
                          if (rt === "inventory" || rt === "demand") {
                            return formData.adjustment_type === "percentage"
                              ? __(
                                  "Enter the magnitude (positive). Direction is derived automatically: scarce inventory / high demand → markup, plenty / low demand → discount.",
                                )
                              : __(
                                  "Enter the magnitude (positive). Direction is derived automatically: scarce inventory / high demand → markup, plenty / low demand → discount.",
                                );
                          }
                          // Seasonal & time-based use the sign as entered.
                          return formData.adjustment_type === "percentage"
                            ? __(
                                "Use a positive value to increase price (e.g. 10 = +10%) and a negative value to discount (e.g. -10 = 10% off).",
                              )
                            : __(
                                "Use a positive value to increase price (e.g. 100 = +100) and a negative value to discount (e.g. -100 = 100 off).",
                              );
                        })()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{__("Conditions")}</CardTitle>
                    <CardDescription>
                      {__("When this rule should apply")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Early Bird & Last Minute - Days before departure */}
                    {(formData.rule_type === "early_bird" ||
                      formData.rule_type === "last_minute") && (
                      <>
                        <div>
                          <Label htmlFor="min_days_before">
                            {__("Minimum Days Before Departure")}
                          </Label>
                          <Input
                            id="min_days_before"
                            type="number"
                            value={formData.min_days_before}
                            onChange={(e) =>
                              handleChange(
                                "min_days_before",
                                parseInt(e.target.value),
                              )
                            }
                            min="0"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {__(
                              "Apply only when the selected departure date is at least this many days away from today. Example: 30 means 30+ days before departure.",
                            )}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="max_days_before">
                            {__("Maximum Days Before Departure")}
                          </Label>
                          <Input
                            id="max_days_before"
                            type="number"
                            value={formData.max_days_before}
                            onChange={(e) =>
                              handleChange(
                                "max_days_before",
                                parseInt(e.target.value),
                              )
                            }
                            min="0"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {__(
                              "Apply only when the selected departure date is within this many days from today. Example: 7 means 0–7 days before departure.",
                            )}
                          </p>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg">
                          <p className="text-xs text-gray-700 dark:text-gray-300">
                            {__(
                              "If you set both Minimum and Maximum, the rule applies only inside that window (Minimum ≤ days before departure ≤ Maximum).",
                            )}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="start_date">
                            {__("Start Date (Optional)")}
                          </Label>
                          <DatePicker
                            value={formData.start_date}
                            onChange={(value) =>
                              handleChange("start_date", value)
                            }
                            placeholder={__("Select start date")}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {__(
                              "Optional lifetime limit. If set, this rule will run only on or after this date. Leave empty for no restriction.",
                            )}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="end_date">
                            {__("End Date (Optional)")}
                          </Label>
                          <DatePicker
                            value={formData.end_date}
                            onChange={(value) =>
                              handleChange("end_date", value)
                            }
                            placeholder={__("Select end date")}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {__(
                              "Optional lifetime limit. If set, this rule will run only on or before this date. Leave empty for no restriction.",
                            )}
                          </p>
                        </div>
                      </>
                    )}

                    {formData.rule_type === "inventory" && (
                      <>
                        <div>
                          <Label htmlFor="min_inventory">
                            {__("Low-inventory threshold (seats)")}
                          </Label>
                          <Input
                            id="min_inventory"
                            type="number"
                            value={formData.min_inventory}
                            onChange={(e) =>
                              handleChange(
                                "min_inventory",
                                parseInt(e.target.value),
                              )
                            }
                            min="0"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {__(
                              "When seats remaining ≤ this number, the rule applies a markup (scarcity).",
                            )}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="max_inventory">
                            {__("High-inventory threshold (seats)")}
                          </Label>
                          <Input
                            id="max_inventory"
                            type="number"
                            value={formData.max_inventory}
                            onChange={(e) =>
                              handleChange(
                                "max_inventory",
                                parseInt(e.target.value),
                              )
                            }
                            min="0"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {__(
                              "When seats remaining ≥ this number, the rule applies a partial discount (50% of the magnitude).",
                            )}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Seasonal - Departure window */}
                    {formData.rule_type === "seasonal" && (
                      <>
                        <div>
                          <Label htmlFor="start_date">
                            {__("Season Start (Departure Date)")}
                          </Label>
                          <DatePicker
                            value={formData.start_date}
                            onChange={(value) =>
                              handleChange("start_date", value)
                            }
                            placeholder={__("Select start date")}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {__(
                              "Earliest departure date this seasonal rule applies to.",
                            )}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="end_date">
                            {__("Season End (Departure Date)")}
                          </Label>
                          <DatePicker
                            value={formData.end_date}
                            onChange={(value) =>
                              handleChange("end_date", value)
                            }
                            placeholder={__("Select end date")}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {__(
                              "Latest departure date this seasonal rule applies to. The rule matches whenever the booking's departure date falls between these two dates (inclusive).",
                            )}
                          </p>
                        </div>

                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            {__(
                              "💡 Tip: Use a positive Adjustment Value for peak-season markup (e.g. 25% during summer) or a negative value for an off-peak discount.",
                            )}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Demand-Based - Booking velocity thresholds */}
                    {formData.rule_type === "demand" && (
                      <>
                        <div>
                          <Label htmlFor="demand_threshold_high">
                            {__("High Demand Threshold (%)")}
                          </Label>
                          <Input
                            id="demand_threshold_high"
                            type="number"
                            value={formData.demand_threshold_high}
                            onChange={(e) =>
                              handleChange(
                                "demand_threshold_high",
                                parseInt(e.target.value),
                              )
                            }
                            min="0"
                            max="100"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {__(
                              "Apply pricing when booking velocity exceeds this percentage (e.g., 80 = high demand)",
                            )}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="demand_threshold_low">
                            {__("Low Demand Threshold (%)")}
                          </Label>
                          <Input
                            id="demand_threshold_low"
                            type="number"
                            value={formData.demand_threshold_low}
                            onChange={(e) =>
                              handleChange(
                                "demand_threshold_low",
                                parseInt(e.target.value),
                              )
                            }
                            min="0"
                            max="100"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {__(
                              "Apply pricing when booking velocity falls below this percentage (e.g., 30 = low demand)",
                            )}
                          </p>
                        </div>

                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {__(
                              "💡 Demand scores are calculated automatically via cron job based on booking velocity.",
                            )}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Time-Based - Day of week selection */}
                    {formData.rule_type === "time_based" && (
                      <>
                        <div>
                          <Label>{__("Apply Pricing On")}</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {[
                              "monday",
                              "tuesday",
                              "wednesday",
                              "thursday",
                              "friday",
                              "saturday",
                              "sunday",
                            ].map((day) => (
                              <div
                                key={day}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="checkbox"
                                  id={`day_${day}`}
                                  checked={formData.weekend_days?.includes(day)}
                                  onChange={(e) => {
                                    const current = formData.weekend_days || [];
                                    if (e.target.checked) {
                                      handleChange("weekend_days", [
                                        ...current,
                                        day,
                                      ]);
                                    } else {
                                      handleChange(
                                        "weekend_days",
                                        current.filter((d) => d !== day),
                                      );
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <Label
                                  htmlFor={`day_${day}`}
                                  className="mb-0 capitalize"
                                >
                                  {__(day)}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {__(
                              "Selected days are matched against the booking's DEPARTURE date — e.g. tick Saturday + Sunday to apply a weekend premium to Saturday/Sunday departures, regardless of when the customer books.",
                            )}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="start_date">
                            {__("Start Date (Optional)")}
                          </Label>
                          <DatePicker
                            value={formData.start_date}
                            onChange={(value) =>
                              handleChange("start_date", value)
                            }
                            placeholder={__("Select start date")}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {__(
                              "Limits the rule to departures on or after this date. Leave empty for no restriction.",
                            )}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="end_date">
                            {__("End Date (Optional)")}
                          </Label>
                          <DatePicker
                            value={formData.end_date}
                            onChange={(value) =>
                              handleChange("end_date", value)
                            }
                            placeholder={__("Select end date")}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {__(
                              "Limits the rule to departures on or before this date. Leave empty for no restriction.",
                            )}
                          </p>
                        </div>

                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                          <p className="text-xs text-indigo-700 dark:text-indigo-300">
                            {__(
                              "💡 Sign matters: a positive Adjustment Value adds a premium on the selected days; a negative value gives a discount.",
                            )}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Sidebar - Right Side (1/3) */}
          {formData.rule_type && (
            <div className="space-y-4">
              {/* Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{__("Status")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={formData.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                  >
                    <option value="active">{__("Active")}</option>
                    <option value="inactive">{__("Inactive")}</option>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {__("Only active rules will be applied to trips.")}
                  </p>
                </CardContent>
              </Card>

              {/* Priority */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{__("Priority")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      handleChange("priority", parseInt(e.target.value))
                    }
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {__(
                      "A higher number = higher priority (1–100). When more than one rule matches, the global Rule Priority Mode in Settings decides whether the highest-priority rule wins, every rule stacks, or the customer gets the best price.",
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* Applicable Trips */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {__("Applicable To")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={formData.applicable_trips}
                    onChange={(e) =>
                      handleChange("applicable_trips", e.target.value)
                    }
                  >
                    <option value="all">{__("All Trips")}</option>
                    <option value="specific">{__("Specific Trips")}</option>
                  </Select>

                  {formData.applicable_trips === "specific" && (
                    <div className="mt-3 space-y-2 relative">
                      <div
                        className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
                        onClick={() => setShowTripDropdown(!showTripDropdown)}
                      >
                        {formData.trip_ids.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {formData.trip_ids.slice(0, 2).map((tripId) => {
                              const trip = tripOptions.find(
                                (t: any) => t.value === tripId,
                              );
                              return (
                                <span
                                  key={tripId}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                                >
                                  {trip?.label || `Trip #${tripId}`}{" "}
                                  <span className="text-blue-600 dark:text-blue-400">
                                    #{tripId}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleChange(
                                        "trip_ids",
                                        formData.trip_ids.filter(
                                          (id) => id !== tripId,
                                        ),
                                      );
                                    }}
                                    className="hover:text-blue-600 dark:hover:text-blue-200"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                            {formData.trip_ids.length > 2 && (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                +{formData.trip_ids.length - 2} {__("more")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {__("Click to select trips...")}
                          </span>
                        )}
                      </div>

                      {showTripDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-hidden">
                          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                            <Input
                              type="text"
                              placeholder={__("Search trips...")}
                              value={tripSearchQuery}
                              onChange={(e) =>
                                setTripSearchQuery(e.target.value)
                              }
                              className="w-full text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {tripOptions.map((trip: any) => {
                              const isSelected = formData.trip_ids.includes(
                                trip.value,
                              );
                              return (
                                <div
                                  key={trip.value}
                                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      handleChange(
                                        "trip_ids",
                                        formData.trip_ids.filter(
                                          (id) => id !== trip.value,
                                        ),
                                      );
                                    } else {
                                      handleChange("trip_ids", [
                                        ...formData.trip_ids,
                                        trip.value,
                                      ]);
                                    }
                                  }}
                                >
                                  <div
                                    className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                      isSelected
                                        ? "bg-blue-600 border-blue-600"
                                        : "border-gray-300 dark:border-gray-600"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                  <span className="flex-1 text-sm text-gray-900 dark:text-white">
                                    {trip.label}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    #{trip.value}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* "When will this apply?" preview panel.
                  Runs the current (unsaved) form data through the engine
                  against rule-type-appropriate sample scenarios so admins can
                  see exactly when their rule fires, before saving. */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {__("When will this rule apply?")}
                  </CardTitle>
                  <CardDescription>
                    {__(
                      "Run a simulation with the current settings to see which scenarios trigger the discount/markup. Nothing is saved.",
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3 mb-3">
                    <div className="flex-1">
                      <Label htmlFor="preview-base-price">
                        {__("Sample base price")}
                      </Label>
                      <Input
                        id="preview-base-price"
                        type="number"
                        min={1}
                        step="0.01"
                        value={previewBasePrice}
                        onChange={(e) =>
                          setPreviewBasePrice(Number(e.target.value) || 0)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleRunSimulation}
                      disabled={previewLoading || !formData.rule_type}
                    >
                      {previewLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {__("Running...")}
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4 mr-2" />
                          {__("Run Preview")}
                        </>
                      )}
                    </Button>
                  </div>

                  {previewError && (
                    <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                      {previewError}
                    </p>
                  )}

                  {previewResult && (
                    <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr className="text-left">
                            <th className="px-3 py-2 font-medium">
                              {__("Scenario")}
                            </th>
                            <th className="px-3 py-2 font-medium">
                              {__("Final Price")}
                            </th>
                            <th className="px-3 py-2 font-medium">
                              {__("Change")}
                            </th>
                            <th className="px-3 py-2 font-medium">
                              {__("Rule")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewResult.scenarios.map((s, i) => (
                            <tr
                              key={i}
                              className="border-t border-gray-200 dark:border-gray-700"
                            >
                              <td className="px-3 py-2">
                                <div>{s.label}</div>
                                {s.departure_date && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {s.departure_date}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 font-medium">
                                {previewResult.base_price > 0
                                  ? `$${s.final_price.toFixed(2)}`
                                  : "—"}
                              </td>
                              <td className="px-3 py-2">
                                {s.applies ? (
                                  <span
                                    className={
                                      s.adjustment < 0
                                        ? "text-green-700 dark:text-green-400"
                                        : "text-orange-700 dark:text-orange-400"
                                    }
                                  >
                                    {s.adjustment > 0 ? "+" : ""}
                                    ${s.adjustment.toFixed(2)} (
                                    {s.adjustment_percent > 0 ? "+" : ""}
                                    {s.adjustment_percent.toFixed(2)}%)
                                  </span>
                                ) : (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {s.applies ? (
                                  <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                                    <Check className="w-3.5 h-3.5" />
                                    {__("Fires")}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {__("Skipped")}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Create Rule Button - Below Applicable To */}
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="w-full"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {__("Saving...")}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEdit ? __("Update Rule") : __("Create Rule")}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {__("Cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Remove old actions section */}
        {false && formData.rule_type && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={handleCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {__("Cancel")}
            </Button>

            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {__("Saving...")}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEdit ? __("Update Rule") : __("Create Rule")}
                </>
              )}
            </Button>
          </div>
        )}
      </form>

      {/* Rule Type Selection Modal */}
      <RuleTypeSelectionModal
        isOpen={showRuleTypeModal}
        onClose={() => setShowRuleTypeModal(false)}
        onSelectType={handleSelectRuleType}
      />
    </div>
  );
};

export default DynamicPricingRuleForm;
