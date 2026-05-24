import { t as useQueryClient, r as reactExports, u as useQuery, v as useMutation, j as jsxRuntimeExports, p as Calendar, ar as Clock, T as TrendingUp, h as Package, E as Sun, c0 as Target, a5 as React, aA as Check, D as Loader2, aV as Save, z as ArrowLeft } from "./react-vendor-CqkbFEvK.js";
import { P as PageHeader, C as Card, d as CardContent, B as Button, Q as Skeleton, f as CardHeader, g as CardTitle, h as CardDescription, w as Label, I as Input, S as Select, D as DatePicker } from "../../admin/dist/js/app.js";
import { R as RuleTypeSelectionModal } from "./RuleTypeSelectionModal-BpEgGbfR.js";
import { u as useToast, _ as __, a as apiClient } from "./index-fqW8jODk.js";
const RULE_TYPES = [
  {
    id: "early_bird",
    name: __("Early Bird Discount"),
    description: __(
      "Reward customers who book well in advance. Always behaves as a discount."
    ),
    icon: Calendar,
    color: "blue",
    example: __(
      "10% off when departure is at least 30 days away (set Min Days Before = 30)."
    )
  },
  {
    id: "last_minute",
    name: __("Last Minute Deals"),
    description: __(
      "Discount close to departure to fill remaining seats. Always behaves as a discount."
    ),
    icon: Clock,
    color: "orange",
    example: __(
      "15% off when departure is within 7 days (set Max Days Before = 7)."
    )
  },
  {
    id: "demand",
    name: __("Demand-Based Pricing"),
    description: __(
      "Adjusts price by booking velocity score (recomputed by cron / on each booking)."
    ),
    icon: TrendingUp,
    color: "green",
    example: __(
      "Score above 70 → markup; below 30 → discount. Magnitude scales with how far the score is outside the band."
    )
  },
  {
    id: "inventory",
    name: __("Inventory-Based"),
    description: __(
      "Reacts to seats remaining on the chosen departure (works with time slots too)."
    ),
    icon: Package,
    color: "purple",
    example: __(
      "Seats ≤ 5 → +10% scarcity markup; seats ≥ 20 → 50% of magnitude as discount."
    )
  },
  {
    id: "seasonal",
    name: __("Seasonal Pricing"),
    description: __(
      "Applies when the DEPARTURE date falls within the season window."
    ),
    icon: Sun,
    color: "yellow",
    example: __(
      "+25% on departures between Jul 1 – Aug 31. Use a negative value for off-peak discounts."
    )
  },
  {
    id: "time_based",
    name: __("Time-Based (Weekday/Weekend)"),
    description: __(
      "Applies on selected weekdays of the DEPARTURE date, optionally limited to a date window."
    ),
    icon: Target,
    color: "indigo",
    example: __(
      "+15% premium on Saturday & Sunday departures. Add a date range to make it effective only for that period."
    )
  }
];
const DynamicPricingRuleForm = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const ruleId = urlParams.get("id");
  const ruleTypeFromUrl = urlParams.get("rule_type") || "";
  const isEdit = !!ruleId;
  const [formData, setFormData] = reactExports.useState({
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
    weekend_days: []
  });
  const [showTripDropdown, setShowTripDropdown] = reactExports.useState(false);
  const [tripSearchQuery, setTripSearchQuery] = reactExports.useState("");
  const [debouncedTripSearch, setDebouncedTripSearch] = reactExports.useState("");
  const [showRuleTypeModal, setShowRuleTypeModal] = reactExports.useState(false);
  const [previewBasePrice, setPreviewBasePrice] = reactExports.useState(100);
  const [previewLoading, setPreviewLoading] = reactExports.useState(false);
  const [previewError, setPreviewError] = reactExports.useState(null);
  const [previewResult, setPreviewResult] = reactExports.useState(null);
  const handleSelectRuleType = (ruleType) => {
    handleChange("rule_type", ruleType);
    setShowRuleTypeModal(false);
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
          base_price: previewBasePrice > 0 ? previewBasePrice : 100
        }
      );
      const envelope = response;
      if ((envelope == null ? void 0 : envelope.success) === false) {
        throw new Error((envelope == null ? void 0 : envelope.message) || __("Simulation failed."));
      }
      const result = (envelope == null ? void 0 : envelope.data) ?? envelope;
      if (!result || !Array.isArray(result.scenarios)) {
        throw new Error(__("Simulation returned an unexpected response."));
      }
      setPreviewResult(result);
    } catch (e) {
      setPreviewError((e == null ? void 0 : e.message) || __("Simulation failed."));
    } finally {
      setPreviewLoading(false);
    }
  };
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTripSearch(tripSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [tripSearchQuery]);
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
    }
  });
  const tripOptions = (tripsData || []).map((trip) => ({
    value: trip.id,
    label: trip.title || `Trip #${trip.id}`
  }));
  const {
    data: ruleData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["dynamic-pricing-rule", ruleId],
    queryFn: async () => {
      if (!ruleId) return null;
      const response = await apiClient.get(`/dynamic-pricing/rules/${ruleId}`);
      return response;
    },
    enabled: isEdit,
    retry: 1
  });
  reactExports.useEffect(() => {
    if (ruleData == null ? void 0 : ruleData.data) {
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
        trip_ids: Array.isArray(ruleDetails.trip_ids) ? ruleDetails.trip_ids : ruleDetails.trip_ids ? JSON.parse(ruleDetails.trip_ids) : [],
        status: ruleDetails.status || "active",
        priority: Number(ruleDetails.priority) || 1,
        demand_threshold_high: ruleDetails.demand_threshold_high ? Number(ruleDetails.demand_threshold_high) : 80,
        demand_threshold_low: ruleDetails.demand_threshold_low ? Number(ruleDetails.demand_threshold_low) : 30,
        weekend_days: Array.isArray(ruleDetails.weekend_days) ? ruleDetails.weekend_days : ruleDetails.weekend_days ? JSON.parse(ruleDetails.weekend_days) : []
      });
    }
  }, [ruleData]);
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return await apiClient.put(`/dynamic-pricing/rules/${ruleId}`, data);
      } else {
        return await apiClient.post("/dynamic-pricing/rules", data);
      }
    },
    onSuccess: (response) => {
      var _a;
      showToast(
        isEdit ? __("Pricing rule updated successfully") : __("Pricing rule created successfully"),
        "success"
      );
      queryClient.invalidateQueries({ queryKey: ["dynamic-pricing-rules"] });
      if (!isEdit && ((_a = response == null ? void 0 : response.data) == null ? void 0 : _a.id)) {
        const baseUrl = window.location.href.split("&action=")[0];
        const editUrl = `${baseUrl}&action=edit-pricing-rule&id=${response.data.id}`;
        window.location.href = editUrl;
      }
    },
    onError: (error2) => {
      showToast((error2 == null ? void 0 : error2.message) || __("Failed to save pricing rule"), "error");
    }
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };
  const handleCancel = () => {
    window.location.href = window.location.href.split("&action=")[0];
  };
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  if (isError) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        PageHeader,
        {
          title: __("Edit Pricing Rule"),
          description: __(
            "Configure dynamic pricing rules to automatically adjust trip prices"
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-600 dark:text-red-400 mb-4", children: __("Failed to load pricing rule") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-4", children: (error == null ? void 0 : error.message) || __("An error occurred while fetching the rule data") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: () => window.location.href = window.location.href.split("&action=")[0],
            children: __("Back to Rules")
          }
        )
      ] }) }) })
    ] });
  }
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        PageHeader,
        {
          title: __("Edit Pricing Rule"),
          description: __(
            "Configure dynamic pricing rules to automatically adjust trip prices"
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-5 h-5 rounded" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-16 mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-48 mb-1" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-64" })
            ] })
          ] }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-32 mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-64" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24 mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-40 mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-48" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-32 mb-2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24 mb-2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-32 mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-56" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-32 mb-2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-32 mb-2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-40 mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-64" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-32 mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-32 mb-2" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-16 mb-2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-16 mb-2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
          ] }) })
        ] })
      ] })
    ] });
  }
  const selectedRuleType = RULE_TYPES.find(
    (rt) => rt.id === formData.rule_type
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        title: isEdit ? __("Edit Pricing Rule") : __("Create Pricing Rule"),
        description: __(
          "Configure dynamic pricing rules to automatically adjust trip prices"
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
          !isEdit && !formData.rule_type && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Step 1: Select Rule Type") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
                "Choose the type of dynamic pricing rule you want to create"
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: RULE_TYPES.map((ruleType) => {
              const Icon = ruleType.icon;
              const colorClasses = {
                blue: "border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 bg-blue-50 dark:bg-blue-900/20",
                orange: "border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 bg-orange-50 dark:bg-orange-900/20",
                green: "border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 bg-green-50 dark:bg-green-900/20",
                purple: "border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 bg-purple-50 dark:bg-purple-900/20",
                yellow: "border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
                indigo: "border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
              };
              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleChange("rule_type", ruleType.id),
                  className: `p-4 border-2 rounded-lg text-left transition-all cursor-pointer ${colorClasses[ruleType.color]}`,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-6 h-6 text-gray-700 dark:text-gray-300" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-gray-900 dark:text-white mb-1", children: ruleType.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-2", children: ruleType.description }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-500 italic", children: [
                        __("Example:"),
                        " ",
                        ruleType.example
                      ] })
                    ] })
                  ] })
                },
                ruleType.id
              );
            }) }) })
          ] }),
          (isEdit || formData.rule_type) && selectedRuleType && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              React.createElement(selectedRuleType.icon, {
                className: "w-5 h-5 text-gray-600 dark:text-gray-400"
              }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Rule Type") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: selectedRuleType.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: selectedRuleType.description })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => setShowRuleTypeModal(true),
                children: __("Change")
              }
            )
          ] }) }) }),
          formData.rule_type && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Rule Details") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
                  "Internal name for this pricing rule (visible to admins only)."
                ) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "name", children: [
                  __("Rule Name"),
                  " *"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "name",
                    value: formData.name,
                    onChange: (e) => handleChange("name", e.target.value),
                    placeholder: __("e.g., Summer Early Bird Discount"),
                    required: true
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
                  "Used in admin lists, analytics, and price-history exports. Customers never see this name."
                ) })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Price Adjustment") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("How much to adjust the price") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "adjustment_type", children: [
                    __("Adjustment Type"),
                    " *"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      id: "adjustment_type",
                      value: formData.adjustment_type,
                      onChange: (e) => handleChange("adjustment_type", e.target.value),
                      required: true,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "percentage", children: __("Percentage") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fixed", children: __("Fixed Amount") })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "adjustment_value", children: [
                    __("Adjustment Value"),
                    " *"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "adjustment_value",
                      type: "number",
                      step: "0.01",
                      value: formData.adjustment_value,
                      onChange: (e) => handleChange(
                        "adjustment_value",
                        parseFloat(e.target.value)
                      ),
                      placeholder: formData.adjustment_type === "percentage" ? "10" : "100",
                      required: true
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: (() => {
                    const rt = formData.rule_type;
                    if (rt === "early_bird" || rt === "last_minute") {
                      return formData.adjustment_type === "percentage" ? __(
                        "Enter the discount magnitude as a positive number (e.g. 10 = 10% off). The rule always applies as a discount."
                      ) : __(
                        "Enter the discount magnitude as a positive number (e.g. 100 = 100 off). The rule always applies as a discount."
                      );
                    }
                    if (rt === "inventory" || rt === "demand") {
                      return formData.adjustment_type === "percentage" ? __(
                        "Enter the magnitude (positive). Direction is derived automatically: scarce inventory / high demand → markup, plenty / low demand → discount."
                      ) : __(
                        "Enter the magnitude (positive). Direction is derived automatically: scarce inventory / high demand → markup, plenty / low demand → discount."
                      );
                    }
                    return formData.adjustment_type === "percentage" ? __(
                      "Use a positive value to increase price (e.g. 10 = +10%) and a negative value to discount (e.g. -10 = 10% off)."
                    ) : __(
                      "Use a positive value to increase price (e.g. 100 = +100) and a negative value to discount (e.g. -100 = 100 off)."
                    );
                  })() })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Conditions") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("When this rule should apply") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
                (formData.rule_type === "early_bird" || formData.rule_type === "last_minute") && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "min_days_before", children: __("Minimum Days Before Departure") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "min_days_before",
                        type: "number",
                        value: formData.min_days_before,
                        onChange: (e) => handleChange(
                          "min_days_before",
                          parseInt(e.target.value)
                        ),
                        min: "0"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
                      "Apply only when the selected departure date is at least this many days away from today. Example: 30 means 30+ days before departure."
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "max_days_before", children: __("Maximum Days Before Departure") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "max_days_before",
                        type: "number",
                        value: formData.max_days_before,
                        onChange: (e) => handleChange(
                          "max_days_before",
                          parseInt(e.target.value)
                        ),
                        min: "0"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
                      "Apply only when the selected departure date is within this many days from today. Example: 7 means 0–7 days before departure."
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-700 dark:text-gray-300", children: __(
                    "If you set both Minimum and Maximum, the rule applies only inside that window (Minimum ≤ days before departure ≤ Maximum)."
                  ) }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "start_date", children: __("Start Date (Optional)") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      DatePicker,
                      {
                        value: formData.start_date,
                        onChange: (value) => handleChange("start_date", value),
                        placeholder: __("Select start date")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
                      "Optional lifetime limit. If set, this rule will run only on or after this date. Leave empty for no restriction."
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "end_date", children: __("End Date (Optional)") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      DatePicker,
                      {
                        value: formData.end_date,
                        onChange: (value) => handleChange("end_date", value),
                        placeholder: __("Select end date")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
                      "Optional lifetime limit. If set, this rule will run only on or before this date. Leave empty for no restriction."
                    ) })
                  ] })
                ] }),
                formData.rule_type === "inventory" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "min_inventory", children: __("Low-inventory threshold (seats)") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "min_inventory",
                        type: "number",
                        value: formData.min_inventory,
                        onChange: (e) => handleChange(
                          "min_inventory",
                          parseInt(e.target.value)
                        ),
                        min: "0"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
                      "When seats remaining ≤ this number, the rule applies a markup (scarcity)."
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "max_inventory", children: __("High-inventory threshold (seats)") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "max_inventory",
                        type: "number",
                        value: formData.max_inventory,
                        onChange: (e) => handleChange(
                          "max_inventory",
                          parseInt(e.target.value)
                        ),
                        min: "0"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
                      "When seats remaining ≥ this number, the rule applies a partial discount (50% of the magnitude)."
                    ) })
                  ] })
                ] }),
                formData.rule_type === "seasonal" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "start_date", children: __("Season Start (Departure Date)") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      DatePicker,
                      {
                        value: formData.start_date,
                        onChange: (value) => handleChange("start_date", value),
                        placeholder: __("Select start date")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
                      "Earliest departure date this seasonal rule applies to."
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "end_date", children: __("Season End (Departure Date)") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      DatePicker,
                      {
                        value: formData.end_date,
                        onChange: (value) => handleChange("end_date", value),
                        placeholder: __("Select end date")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
                      "Latest departure date this seasonal rule applies to. The rule matches whenever the booking's departure date falls between these two dates (inclusive)."
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-yellow-700 dark:text-yellow-300", children: __(
                    "💡 Tip: Use a positive Adjustment Value for peak-season markup (e.g. 25% during summer) or a negative value for an off-peak discount."
                  ) }) })
                ] }),
                formData.rule_type === "demand" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "demand_threshold_high", children: __("High Demand Threshold (%)") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "demand_threshold_high",
                        type: "number",
                        value: formData.demand_threshold_high,
                        onChange: (e) => handleChange(
                          "demand_threshold_high",
                          parseInt(e.target.value)
                        ),
                        min: "0",
                        max: "100"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
                      "Apply pricing when booking velocity exceeds this percentage (e.g., 80 = high demand)"
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "demand_threshold_low", children: __("Low Demand Threshold (%)") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "demand_threshold_low",
                        type: "number",
                        value: formData.demand_threshold_low,
                        onChange: (e) => handleChange(
                          "demand_threshold_low",
                          parseInt(e.target.value)
                        ),
                        min: "0",
                        max: "100"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
                      "Apply pricing when booking velocity falls below this percentage (e.g., 30 = low demand)"
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-blue-700 dark:text-blue-300", children: __(
                    "💡 Demand scores are calculated automatically via cron job based on booking velocity."
                  ) }) })
                ] }),
                formData.rule_type === "time_based" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: __("Apply Pricing On") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2 mt-2", children: [
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday",
                      "sunday"
                    ].map((day) => {
                      var _a;
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "div",
                        {
                          className: "flex items-center gap-2",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "input",
                              {
                                type: "checkbox",
                                id: `day_${day}`,
                                checked: (_a = formData.weekend_days) == null ? void 0 : _a.includes(day),
                                onChange: (e) => {
                                  const current = formData.weekend_days || [];
                                  if (e.target.checked) {
                                    handleChange("weekend_days", [
                                      ...current,
                                      day
                                    ]);
                                  } else {
                                    handleChange(
                                      "weekend_days",
                                      current.filter((d) => d !== day)
                                    );
                                  }
                                },
                                className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Label,
                              {
                                htmlFor: `day_${day}`,
                                className: "mb-0 capitalize",
                                children: __(day)
                              }
                            )
                          ]
                        },
                        day
                      );
                    }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-2", children: __(
                      "Selected days are matched against the booking's DEPARTURE date — e.g. tick Saturday + Sunday to apply a weekend premium to Saturday/Sunday departures, regardless of when the customer books."
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "start_date", children: __("Start Date (Optional)") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      DatePicker,
                      {
                        value: formData.start_date,
                        onChange: (value) => handleChange("start_date", value),
                        placeholder: __("Select start date")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
                      "Limits the rule to departures on or after this date. Leave empty for no restriction."
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "end_date", children: __("End Date (Optional)") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      DatePicker,
                      {
                        value: formData.end_date,
                        onChange: (value) => handleChange("end_date", value),
                        placeholder: __("Select end date")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
                      "Limits the rule to departures on or before this date. Leave empty for no restriction."
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-indigo-700 dark:text-indigo-300", children: __(
                    "💡 Sign matters: a positive Adjustment Value adds a premium on the selected days; a negative value gives a discount."
                  ) }) })
                ] })
              ] })
            ] })
          ] })
        ] }),
        formData.rule_type && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Status") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: formData.status,
                  onChange: (e) => handleChange("status", e.target.value),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: __("Active") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "inactive", children: __("Inactive") })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __("Only active rules will be applied to trips.") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Priority") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: formData.priority,
                  onChange: (e) => handleChange("priority", parseInt(e.target.value)),
                  min: "1",
                  max: "100"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
                "A higher number = higher priority (1–100). When more than one rule matches, the global Rule Priority Mode in Settings decides whether the highest-priority rule wins, every rule stacks, or the customer gets the best price."
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Applicable To") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: formData.applicable_trips,
                  onChange: (e) => handleChange("applicable_trips", e.target.value),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: __("All Trips") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "specific", children: __("Specific Trips") })
                  ]
                }
              ),
              formData.applicable_trips === "specific" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-2 relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "border border-gray-300 dark:border-gray-600 rounded-lg p-2 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800",
                    onClick: () => setShowTripDropdown(!showTripDropdown),
                    children: formData.trip_ids.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
                      formData.trip_ids.slice(0, 2).map((tripId) => {
                        const trip = tripOptions.find(
                          (t) => t.value === tripId
                        );
                        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "span",
                          {
                            className: "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded",
                            children: [
                              (trip == null ? void 0 : trip.label) || `Trip #${tripId}`,
                              " ",
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-blue-600 dark:text-blue-400", children: [
                                "#",
                                tripId
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "button",
                                {
                                  type: "button",
                                  onClick: (e) => {
                                    e.stopPropagation();
                                    handleChange(
                                      "trip_ids",
                                      formData.trip_ids.filter(
                                        (id) => id !== tripId
                                      )
                                    );
                                  },
                                  className: "hover:text-blue-600 dark:hover:text-blue-200",
                                  children: "×"
                                }
                              )
                            ]
                          },
                          tripId
                        );
                      }),
                      formData.trip_ids.length > 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded", children: [
                        "+",
                        formData.trip_ids.length - 2,
                        " ",
                        __("more")
                      ] })
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Click to select trips...") })
                  }
                ),
                showTripDropdown && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-hidden", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "text",
                      placeholder: __("Search trips..."),
                      value: tripSearchQuery,
                      onChange: (e) => setTripSearchQuery(e.target.value),
                      className: "w-full text-sm",
                      onClick: (e) => e.stopPropagation()
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-48 overflow-y-auto", children: tripOptions.map((trip) => {
                    const isSelected = formData.trip_ids.includes(
                      trip.value
                    );
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2",
                        onClick: (e) => {
                          e.stopPropagation();
                          if (isSelected) {
                            handleChange(
                              "trip_ids",
                              formData.trip_ids.filter(
                                (id) => id !== trip.value
                              )
                            );
                          } else {
                            handleChange("trip_ids", [
                              ...formData.trip_ids,
                              trip.value
                            ]);
                          }
                        },
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              className: `w-4 h-4 border-2 rounded flex items-center justify-center ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 dark:border-gray-600"}`,
                              children: isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-3 h-3 text-white" })
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm text-gray-900 dark:text-white", children: trip.label }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
                            "#",
                            trip.value
                          ] })
                        ]
                      },
                      trip.value
                    );
                  }) })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("When will this rule apply?") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
                "Run a simulation with the current settings to see which scenarios trigger the discount/markup. Nothing is saved."
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end gap-3 mb-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "preview-base-price", children: __("Sample base price") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "preview-base-price",
                      type: "number",
                      min: 1,
                      step: "0.01",
                      value: previewBasePrice,
                      onChange: (e) => setPreviewBasePrice(Number(e.target.value) || 0)
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    onClick: handleRunSimulation,
                    disabled: previewLoading || !formData.rule_type,
                    children: previewLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                      __("Running...")
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "w-4 h-4 mr-2" }),
                      __("Run Preview")
                    ] })
                  }
                )
              ] }),
              previewError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600 dark:text-red-400 mb-2", children: previewError }),
              previewResult && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50 dark:bg-gray-900", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-left", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 font-medium", children: __("Scenario") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 font-medium", children: __("Final Price") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 font-medium", children: __("Change") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 font-medium", children: __("Rule") })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: previewResult.scenarios.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "tr",
                  {
                    className: "border-t border-gray-200 dark:border-gray-700",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: s.label }),
                        s.departure_date && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: s.departure_date })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 font-medium", children: previewResult.base_price > 0 ? `$${s.final_price.toFixed(2)}` : "—" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: s.applies ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "span",
                        {
                          className: s.adjustment < 0 ? "text-green-700 dark:text-green-400" : "text-orange-700 dark:text-orange-400",
                          children: [
                            s.adjustment > 0 ? "+" : "",
                            "$",
                            s.adjustment.toFixed(2),
                            " (",
                            s.adjustment_percent > 0 ? "+" : "",
                            s.adjustment_percent.toFixed(2),
                            "%)"
                          ]
                        }
                      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "—" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: s.applies ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-green-700 dark:text-green-400", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-3.5 h-3.5" }),
                        __("Fires")
                      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500 dark:text-gray-400", children: __("Skipped") }) })
                    ]
                  },
                  i
                )) })
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: saveMutation.isPending,
                className: "w-full",
                children: saveMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                  __("Saving...")
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4 mr-2" }),
                  isEdit ? __("Update Rule") : __("Create Rule")
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: handleCancel,
                className: "w-full",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
                  __("Cancel")
                ]
              }
            )
          ] })
        ] })
      ] }),
      false
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      RuleTypeSelectionModal,
      {
        isOpen: showRuleTypeModal,
        onClose: () => setShowRuleTypeModal(false),
        onSelectType: handleSelectRuleType
      }
    )
  ] });
};
export {
  DynamicPricingRuleForm as default
};
//# sourceMappingURL=DynamicPricingRuleForm-9WgVSTPH.js.map
