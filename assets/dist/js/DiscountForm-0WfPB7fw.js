import { t as useQueryClient, r as reactExports, u as useQuery, v as useMutation, j as jsxRuntimeExports, z as ArrowLeft, aF as Info, U as Users, aw as Plus, aN as Trash2, D as Loader2, aV as Save } from "./react-vendor-zODANjVp.js";
import { u as useToast, _ as __, a as apiClient } from "./index-CG-QHfTA.js";
import { u as usePermissions, C as Card, d as CardContent, f as CardHeader, P as PageHeader, B as Button, s as ConditionalRender, g as CardTitle, H as HelpText, I as Input, S as Select, D as DatePicker, v as PremiumUpgradeDialog } from "../../admin/dist/js/app.js";
import { A as ApplicableTripSelector } from "./ApplicableTripSelector-DUM9NsLJ.js";
const DiscountForm = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const [showPremiumModal, setShowPremiumModal] = reactExports.useState(false);
  const getInitialState = () => {
    const params = new URLSearchParams(window.location.search);
    const urlDiscountMode = params.get("discount_mode") || "both";
    const isGroupOnly = urlDiscountMode === "group";
    return {
      code: "",
      description: "",
      type: "percentage",
      amount: isGroupOnly ? "0" : "",
      max_discount_amount: "",
      usage_limit: "0",
      usage_limit_per_customer: "0",
      valid_from: "",
      expiry_date: "",
      status: "draft",
      applicable_to: "all",
      trip_ids: [],
      min_amount: "",
      first_time_customer_only: false,
      is_group_discount: isGroupOnly,
      discount_mode: urlDiscountMode,
      group_discount_mode: "total",
      group_discount_ranges: [
        {
          id: String(Date.now()),
          min_group_size: "",
          max_group_size: "",
          discount_type: "percentage",
          discount_amount: "",
          categories: []
        }
      ],
      category_discounts: []
    };
  };
  const [formData, setFormData] = reactExports.useState(getInitialState);
  const [errors, setErrors] = reactExports.useState({});
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = reactExports.useState(false);
  const action = reactExports.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") || "create";
  }, []);
  const discountId = reactExports.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") ? parseInt(params.get("id") || "0") : null;
  }, []);
  const duplicateId = reactExports.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("duplicate") ? parseInt(params.get("duplicate") || "0") : null;
  }, []);
  const discountMode = reactExports.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("discount_mode") || "both";
  }, []);
  const isEditMode = action === "edit" && discountId !== null;
  const isDuplicateMode = action === "create" && duplicateId !== null;
  const isGroupOnlyMode = discountMode === "group";
  const isPromoOnlyMode = discountMode === "promo";
  const effectiveDiscountMode = isEditMode ? formData.discount_mode : discountMode;
  const isEffectiveGroupOnly = effectiveDiscountMode === "group";
  const isEffectivePromoOnly = effectiveDiscountMode === "promo";
  const { data: discountData, isLoading: isLoadingDiscount } = useQuery({
    queryKey: ["discount", discountId || duplicateId],
    queryFn: async () => {
      const id = discountId || duplicateId;
      if (!id) return null;
      try {
        const response = await apiClient.get(`/discounts/${id}`);
        return response;
      } catch (error) {
        showToast(
          (error == null ? void 0 : error.message) || __("Failed to load discount", "yatra"),
          "error"
        );
        throw error;
      }
    },
    enabled: (isEditMode || isDuplicateMode) && can("yatra_manage_discounts")
  });
  reactExports.useEffect(() => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    if (discountData && (isEditMode || isDuplicateMode)) {
      setFormData({
        code: isDuplicateMode ? `${discountData.code}_COPY` : discountData.code || "",
        description: discountData.description || "",
        type: discountData.type || "percentage",
        amount: ((_a = discountData.amount) == null ? void 0 : _a.toString()) || "",
        max_discount_amount: ((_b = discountData.max_discount_amount) == null ? void 0 : _b.toString()) || "",
        usage_limit: ((_c = discountData.usage_limit) == null ? void 0 : _c.toString()) || "0",
        usage_limit_per_customer: ((_d = discountData.usage_limit_per_customer) == null ? void 0 : _d.toString()) || "0",
        valid_from: discountData.valid_from || "",
        expiry_date: discountData.expiry_date || "",
        status: isDuplicateMode ? "draft" : discountData.status || "draft",
        applicable_to: discountData.applicable_to || "all",
        trip_ids: discountData.trip_ids || [],
        min_amount: ((_e = discountData.min_amount) == null ? void 0 : _e.toString()) || "",
        first_time_customer_only: discountData.first_time_customer_only || false,
        is_group_discount: discountData.is_group_discount || false,
        discount_mode: discountData.discount_mode || "both",
        group_discount_mode: discountData.group_discount_mode || "total",
        group_discount_ranges: Array.isArray(discountData.group_discount_ranges) && discountData.group_discount_ranges.length ? discountData.group_discount_ranges : [
          {
            id: String(Date.now()),
            min_group_size: ((_f = discountData.min_group_size) == null ? void 0 : _f.toString()) || "",
            max_group_size: ((_g = discountData.max_group_size) == null ? void 0 : _g.toString()) || "",
            discount_type: discountData.group_discount_type || "percentage",
            discount_amount: ((_h = discountData.group_discount_amount) == null ? void 0 : _h.toString()) || "",
            categories: []
          }
        ],
        category_discounts: Array.isArray(discountData.category_discounts) && ((_i = discountData.category_discounts) == null ? void 0 : _i.length) ? discountData.category_discounts : []
      });
    }
  }, [discountData, isEditMode, isDuplicateMode]);
  reactExports.useEffect(() => {
    if (!isEditMode && !isDuplicateMode && !discountData) {
      if (isGroupOnlyMode) {
        setFormData((prev) => ({
          ...prev,
          is_group_discount: true,
          discount_mode: "group",
          amount: "0",
          type: "percentage"
        }));
      } else if (isPromoOnlyMode) {
        setFormData((prev) => ({
          ...prev,
          is_group_discount: false,
          discount_mode: "promo"
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          discount_mode: "both"
        }));
      }
    }
  }, [
    isGroupOnlyMode,
    isPromoOnlyMode,
    isEditMode,
    isDuplicateMode,
    discountData
  ]);
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (field === "group_discount_mode") {
      if (value === "category_based") {
        setFormData((prev) => ({
          ...prev,
          group_discount_mode: "category_based",
          group_discount_ranges: [],
          category_discounts: []
          // Ensure empty categories array
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          group_discount_mode: "total",
          group_discount_ranges: [
            {
              id: String(Date.now()),
              min_group_size: "",
              max_group_size: "",
              discount_type: "percentage",
              discount_amount: "",
              categories: []
            }
          ],
          category_discounts: []
          // Ensure empty categories array
        }));
      }
    }
  };
  const handleGroupDiscountToggle = (checked) => {
    handleFieldChange("is_group_discount", checked);
  };
  const travelerCategoriesQuery = useQuery({
    queryKey: ["traveler-categories"],
    queryFn: async () => {
      var _a;
      try {
        const response = await apiClient.get("/traveler-categories", {
          params: {
            per_page: 100,
            status: "publish"
          }
        });
        const categories = ((_a = response == null ? void 0 : response.data) == null ? void 0 : _a.data) || (response == null ? void 0 : response.data) || response || [];
        return Array.isArray(categories) ? categories : [];
      } catch (error) {
        console.error("Failed to load traveler categories:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1e3
  });
  const travelerCategoryOptions = reactExports.useMemo(() => {
    const items = travelerCategoriesQuery.data || [];
    return items.filter(
      (c) => !!c && (typeof c.id === "number" || typeof c.id === "string") && (c.status === "publish" || c.status === "active")
    ).map((c) => ({
      value: String(c.id),
      label: c.label || c.slug || String(c.id),
      description: c.description || "",
      age_min: c.age_min,
      age_max: c.age_max,
      pricing_mode: c.pricing_mode || "per_person"
    }));
  }, [travelerCategoriesQuery.data]);
  const addRange = () => {
    setFormData((prev) => ({
      ...prev,
      group_discount_ranges: [
        ...prev.group_discount_ranges,
        {
          id: String(Date.now() + Math.random()),
          min_group_size: "",
          max_group_size: "",
          discount_type: "percentage",
          discount_amount: "",
          categories: []
        }
      ]
    }));
  };
  const removeRange = (rangeId) => {
    setFormData((prev) => ({
      ...prev,
      group_discount_ranges: prev.group_discount_ranges.filter(
        (r) => r.id !== rangeId
      )
    }));
  };
  const updateRange = (rangeId, patch) => {
    setFormData((prev) => ({
      ...prev,
      group_discount_ranges: prev.group_discount_ranges.map(
        (r) => r.id === rangeId ? { ...r, ...patch } : r
      )
    }));
  };
  const addTravelerCategory = () => {
    setShowCategoryDropdown((prev) => !prev);
  };
  const selectCategory = (categoryId, categoryLabel) => {
    setFormData((prev) => ({
      ...prev,
      category_discounts: [
        ...prev.category_discounts,
        {
          traveler_category_id: categoryId,
          traveler_category_label: categoryLabel,
          ranges: [],
          isSelecting: false
        }
      ]
    }));
    setShowCategoryDropdown(false);
  };
  const removeTravelerCategory = (categoryIndex) => {
    setFormData((prev) => ({
      ...prev,
      category_discounts: prev.category_discounts.filter(
        (_, idx) => idx !== categoryIndex
      )
    }));
  };
  const updateTravelerCategory = (categoryIndex, patch) => {
    setFormData((prev) => ({
      ...prev,
      category_discounts: prev.category_discounts.map(
        (cat, idx) => idx === categoryIndex ? { ...cat, ...patch } : cat
      )
    }));
  };
  const addRangeToCategory = (categoryIndex) => {
    setFormData((prev) => ({
      ...prev,
      category_discounts: prev.category_discounts.map((cat, idx) => {
        if (idx !== categoryIndex) return cat;
        return {
          ...cat,
          ranges: [
            ...cat.ranges,
            {
              id: String(Date.now() + Math.random()),
              min_group_size: "",
              max_group_size: "",
              discount_type: "percentage",
              discount_amount: ""
            }
          ]
        };
      })
    }));
  };
  const removeRangeFromCategory = (categoryIndex, rangeId) => {
    setFormData((prev) => ({
      ...prev,
      category_discounts: prev.category_discounts.map((cat, idx) => {
        if (idx !== categoryIndex) return cat;
        return { ...cat, ranges: cat.ranges.filter((r) => r.id !== rangeId) };
      })
    }));
  };
  const updateRangeInCategory = (categoryIndex, rangeId, patch) => {
    setFormData((prev) => ({
      ...prev,
      category_discounts: prev.category_discounts.map((cat, idx) => {
        if (idx !== categoryIndex) return cat;
        const ranges = cat.ranges.map(
          (r) => r.id === rangeId ? { ...r, ...patch } : r
        );
        return { ...cat, ranges };
      })
    }));
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.code.trim()) {
      newErrors.code = isEffectiveGroupOnly ? __("Internal name is required", "yatra") : __("Coupon code is required", "yatra");
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = __(
        "Only uppercase letters, numbers, hyphens, and underscores are allowed",
        "yatra"
      );
    }
    if (!isEffectiveGroupOnly) {
      if (!formData.amount.trim()) {
        newErrors.amount = __("Discount amount is required", "yatra");
      } else {
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount < 0) {
          newErrors.amount = __(
            "Discount amount must be a positive number",
            "yatra"
          );
        } else if (formData.type === "percentage" && amount > 100) {
          newErrors.amount = __(
            "Percentage discount cannot exceed 100%",
            "yatra"
          );
        }
      }
      if (formData.type === "percentage" && formData.max_discount_amount && formData.max_discount_amount.trim()) {
        const maxAmount = parseFloat(formData.max_discount_amount);
        if (isNaN(maxAmount) || maxAmount <= 0) {
          newErrors.max_discount_amount = __(
            "Maximum discount amount must be a positive number",
            "yatra"
          );
        }
      }
    }
    if (formData.usage_limit && formData.usage_limit !== "0") {
      const limit = parseInt(formData.usage_limit);
      if (isNaN(limit) || limit < 0) {
        newErrors.usage_limit = __(
          "Usage limit must be a positive number or 0 for unlimited",
          "yatra"
        );
      }
    }
    if (formData.usage_limit_per_customer && formData.usage_limit_per_customer !== "0") {
      const limit = parseInt(formData.usage_limit_per_customer);
      if (isNaN(limit) || limit < 0) {
        newErrors.usage_limit_per_customer = __(
          "Per-customer usage limit must be a positive number or 0 for unlimited",
          "yatra"
        );
      }
    }
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.expiry_date) {
      const expiryDate = new Date(formData.expiry_date);
      if (expiryDate < today) {
        newErrors.expiry_date = __(
          "Expiry date cannot be in the past",
          "yatra"
        );
      }
    }
    if (formData.valid_from && formData.expiry_date) {
      const validFrom = new Date(formData.valid_from);
      const expiryDate = new Date(formData.expiry_date);
      if (expiryDate < validFrom) {
        newErrors.expiry_date = __(
          "Expiry date must be after the valid from date",
          "yatra"
        );
      }
    }
    if (formData.min_amount && formData.min_amount.trim()) {
      const minAmount = parseFloat(formData.min_amount);
      if (isNaN(minAmount) || minAmount < 0) {
        newErrors.min_amount = __(
          "Minimum amount must be a positive number",
          "yatra"
        );
      }
    }
    if (formData.is_group_discount && formData.group_discount_mode === "total") {
      if (!formData.group_discount_ranges || formData.group_discount_ranges.length === 0) {
        newErrors.group_discount_ranges = __(
          "At least one group discount range is required",
          "yatra"
        );
      } else {
        formData.group_discount_ranges.forEach((range, idx) => {
          const prefix = `group_discount_ranges_${idx}`;
          const min = parseInt(range.min_group_size);
          const max = range.max_group_size ? parseInt(range.max_group_size) : null;
          if (Number.isNaN(min) || min < 1) {
            newErrors[`${prefix}_min`] = __(
              "Minimum group size must be at least 1",
              "yatra"
            );
          }
          if (max !== null) {
            if (Number.isNaN(max) || max < 1) {
              newErrors[`${prefix}_max`] = __(
                "Maximum group size must be a positive number",
                "yatra"
              );
            } else if (!Number.isNaN(min) && max <= min) {
              newErrors[`${prefix}_max`] = __(
                "Maximum group size must be greater than minimum group size",
                "yatra"
              );
            }
          }
          const amount = range.discount_amount ? parseFloat(range.discount_amount) : NaN;
          if (!range.discount_type) {
            newErrors[`${prefix}_type`] = __(
              "Discount type is required",
              "yatra"
            );
          }
          if (Number.isNaN(amount) || amount <= 0) {
            newErrors[`${prefix}_amount`] = __(
              "Discount amount must be a positive number",
              "yatra"
            );
          } else if (range.discount_type === "percentage" && amount > 100) {
            newErrors[`${prefix}_amount`] = __(
              "Percentage discount cannot exceed 100%",
              "yatra"
            );
          }
        });
      }
    }
    if (formData.is_group_discount && formData.group_discount_mode === "category_based") {
      if (!formData.category_discounts || formData.category_discounts.length === 0) {
        newErrors.category_discounts = __(
          "Add at least one traveler category",
          "yatra"
        );
      } else {
        formData.category_discounts.forEach((cat, catIdx) => {
          const catPrefix = `category_discounts_${catIdx}`;
          if (!cat.traveler_category_id) {
            newErrors[`${catPrefix}_id`] = __(
              "Traveler category is required",
              "yatra"
            );
          }
          if (!cat.ranges || cat.ranges.length === 0) {
            newErrors[`${catPrefix}_ranges`] = __(
              "Add at least one discount range",
              "yatra"
            );
          } else {
            cat.ranges.forEach((range, rIdx) => {
              const rangePrefix = `${catPrefix}_ranges_${rIdx}`;
              const min = parseInt(range.min_group_size);
              const max = range.max_group_size ? parseInt(range.max_group_size) : null;
              if (Number.isNaN(min) || min < 1) {
                newErrors[`${rangePrefix}_min`] = __(
                  "Minimum group size must be at least 1",
                  "yatra"
                );
              }
              if (max !== null) {
                if (Number.isNaN(max) || max < 1) {
                  newErrors[`${rangePrefix}_max`] = __(
                    "Maximum group size must be a positive number",
                    "yatra"
                  );
                } else if (!Number.isNaN(min) && max <= min) {
                  newErrors[`${rangePrefix}_max`] = __(
                    "Maximum group size must be greater than minimum group size",
                    "yatra"
                  );
                }
              }
              const amount = range.discount_amount ? parseFloat(range.discount_amount) : NaN;
              if (!range.discount_type) {
                newErrors[`${rangePrefix}_type`] = __(
                  "Discount type is required",
                  "yatra"
                );
              }
              if (Number.isNaN(amount) || amount <= 0) {
                newErrors[`${rangePrefix}_amount`] = __(
                  "Discount amount must be a positive number",
                  "yatra"
                );
              } else if (range.discount_type === "percentage" && amount > 100) {
                newErrors[`${rangePrefix}_amount`] = __(
                  "Percentage discount cannot exceed 100%",
                  "yatra"
                );
              }
            });
          }
        });
      }
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const errorElement = document.querySelector(
        `[name="${firstErrorKey}"], #${firstErrorKey}, [data-field="${firstErrorKey}"]`
      );
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        if (errorElement instanceof HTMLInputElement || errorElement instanceof HTMLSelectElement || errorElement instanceof HTMLTextAreaElement) {
          setTimeout(() => errorElement.focus(), 300);
        }
      } else {
        const errorMessage = document.querySelector(
          ".text-red-500, .text-red-600"
        );
        if (errorMessage) {
          errorMessage.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
    return Object.keys(newErrors).length === 0;
  };
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        code: data.code.trim().toUpperCase(),
        description: data.description.trim(),
        type: data.type,
        amount: parseFloat(data.amount) || 0,
        max_discount_amount: data.max_discount_amount ? parseFloat(data.max_discount_amount) : null,
        usage_limit: parseInt(data.usage_limit) || 0,
        usage_limit_per_customer: parseInt(data.usage_limit_per_customer) || 0,
        valid_from: data.valid_from || null,
        expiry_date: data.expiry_date || null,
        status: data.status,
        applicable_to: data.applicable_to,
        trip_ids: data.applicable_to === "specific_trips" ? data.trip_ids : [],
        min_amount: data.min_amount ? parseFloat(data.min_amount) : null,
        first_time_customer_only: data.first_time_customer_only,
        is_group_discount: data.is_group_discount,
        discount_mode: data.discount_mode,
        group_discount_mode: data.is_group_discount ? data.group_discount_mode : null,
        group_discount_ranges: data.is_group_discount ? data.group_discount_ranges : [],
        category_discounts: data.is_group_discount && data.group_discount_mode === "category_based" ? data.category_discounts.map((cat) => ({
          traveler_category_id: cat.traveler_category_id,
          traveler_category_label: cat.traveler_category_label,
          ranges: cat.ranges.map((range) => ({
            id: range.id,
            min_group_size: range.min_group_size,
            max_group_size: range.max_group_size,
            discount_type: range.discount_type,
            discount_amount: range.discount_amount
          }))
        })) : []
      };
      if (isEditMode && discountId) {
        return await apiClient.put(`/discounts/${discountId}`, payload);
      } else {
        return await apiClient.post("/discounts", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      queryClient.invalidateQueries({
        queryKey: ["discount", discountId || duplicateId]
      });
      showToast(
        isEditMode ? __("Discount updated successfully", "yatra") : __("Discount created successfully", "yatra"),
        "success"
      );
      if (!isEditMode) {
        setTimeout(() => {
          var _a;
          window.location.href = `${((_a = window.yatraAdmin) == null ? void 0 : _a.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=discounts`;
        }, 1e3);
      }
      setIsSubmitting(false);
    },
    onError: (error) => {
      const errorMessage = (error == null ? void 0 : error.message) || __("An error occurred while saving the discount", "yatra");
      showToast(errorMessage, "error");
      setIsSubmitting(false);
    }
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await saveMutation.mutateAsync(formData);
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleBack = () => {
    var _a;
    window.location.href = `${((_a = window.yatraAdmin) == null ? void 0 : _a.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=discounts`;
  };
  if (isLoadingDiscount) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-5 h-5 bg-blue-200 dark:bg-blue-700 rounded animate-pulse" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-40 bg-blue-200 dark:bg-blue-700 rounded animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-full bg-blue-100 dark:bg-blue-800 rounded animate-pulse" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-3/4 bg-blue-100 dark:bg-blue-800 rounded animate-pulse" })
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-44 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }) }) })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        title: isEditMode ? __("Edit Discount Coupon", "yatra") : __("Add New Discount Coupon", "yatra"),
        description: isEditMode ? __("Update discount coupon details", "yatra") : __("Create a new discount coupon for your trips", "yatra"),
        actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            onClick: handleBack,
            className: "flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" }),
              __("Back", "yatra")
            ]
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(ConditionalRender, { capability: "yatra_manage_discounts", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2", children: __("How Discounts Work", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-xs text-blue-800 dark:text-blue-200 space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "• ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                __("Regular Discount", "yatra"),
                ":"
              ] }),
              " ",
              __(
                "Applied first to the booking total (trip price × travelers)",
                "yatra"
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "• ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                __("Group Discount", "yatra"),
                ":"
              ] }),
              " ",
              __(
                "Additional discount applied AFTER regular discount when group size requirement is met",
                "yatra"
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "• ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                __("Maximum Cap", "yatra"),
                ":"
              ] }),
              " ",
              __(
                "For percentage discounts, you can set a maximum dollar amount to cap the discount",
                "yatra"
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "• ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                __("Example", "yatra"),
                ":"
              ] }),
              " ",
              __(
                "$1000 booking, 15% regular discount ($150 off), then 10% group discount on $850 = $85 more off. Final: $765",
                "yatra"
              )
            ] })
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("form", { onSubmit: handleSubmit, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-3", children: [
          (() => {
            const currentMode = isEditMode ? formData.discount_mode : discountMode;
            const isGroupOnly = currentMode === "group";
            const isPromoOnly = currentMode === "promo";
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `p-3 rounded-lg border-2 mb-3 ${isGroupOnly ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : isPromoOnly ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"}`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  isGroupOnly ? /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-5 h-5 text-green-600 dark:text-green-400" }) : isPromoOnly ? /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: `font-medium ${isGroupOnly ? "text-green-700 dark:text-green-300" : isPromoOnly ? "text-blue-700 dark:text-blue-300" : "text-purple-700 dark:text-purple-300"}`,
                      children: isGroupOnly ? isEditMode ? __(
                        "Group Discount (Auto-applies, no code needed)",
                        "yatra"
                      ) : __(
                        "Creating Group Discount (Auto-applies, no code needed)",
                        "yatra"
                      ) : isPromoOnly ? isEditMode ? __("Promo Code Discount", "yatra") : __("Creating Promo Code Discount", "yatra") : isEditMode ? __("Promo Code + Group Discount", "yatra") : __(
                        "Creating Promo Code + Group Discount",
                        "yatra"
                      )
                    }
                  )
                ] })
              }
            );
          })(),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: isEffectiveGroupOnly ? __("Group Discount Information", "yatra") : __("Basic Information", "yatra") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              !isEffectiveGroupOnly && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "label",
                  {
                    htmlFor: "code",
                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                    children: [
                      __("Coupon Code", "yatra"),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __(
                      "Enter a unique coupon code. Only uppercase letters, numbers, hyphens, and underscores are allowed.",
                      "yatra"
                    ),
                    className: "mb-2"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "code",
                    name: "code",
                    type: "text",
                    value: formData.code,
                    onChange: (e) => handleFieldChange(
                      "code",
                      e.target.value.toUpperCase()
                    ),
                    placeholder: __("e.g., SUMMER2024", "yatra"),
                    className: errors.code ? "border-red-500" : "",
                    required: true
                  }
                ),
                errors.code && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                  errors.code
                ] })
              ] }),
              isEffectiveGroupOnly && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "label",
                  {
                    htmlFor: "code",
                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                    children: [
                      __("Internal Name", "yatra"),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __(
                      "Enter a unique internal name for this group discount. This is for your reference only and won't be shown to customers.",
                      "Enter a unique internal name for this group discount. This is for your reference only and won't be shown to customers."
                    ),
                    className: "mb-2"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "code",
                    name: "code",
                    type: "text",
                    value: formData.code,
                    onChange: (e) => handleFieldChange(
                      "code",
                      e.target.value.toUpperCase().replace(/\s+/g, "_")
                    ),
                    placeholder: __("e.g., GROUP_DISCOUNT_2024", "yatra"),
                    className: errors.code ? "border-red-500" : "",
                    required: true
                  }
                ),
                errors.code && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                  errors.code
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "label",
                  {
                    htmlFor: "description",
                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                    children: __("Description", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __(
                      "Optional description for this discount coupon. This helps you identify the purpose of the coupon.",
                      "yatra"
                    ),
                    className: "mb-2"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "textarea",
                  {
                    id: "description",
                    value: formData.description,
                    onChange: (e) => handleFieldChange("description", e.target.value),
                    placeholder: __(
                      "e.g., Summer discount for all trips",
                      "yatra"
                    ),
                    rows: 3,
                    className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                  }
                )
              ] }),
              !isEffectiveGroupOnly && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "label",
                    {
                      htmlFor: "type",
                      className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                      children: [
                        __("Discount Type", "yatra"),
                        " ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      id: "type",
                      name: "type",
                      value: formData.type,
                      onChange: (e) => handleFieldChange(
                        "type",
                        e.target.value
                      ),
                      className: errors.type ? "border-red-500" : "",
                      required: true,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "percentage", children: __("Percentage", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fixed", children: __("Fixed Amount", "yatra") })
                      ]
                    }
                  ),
                  errors.type && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                    errors.type
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "label",
                    {
                      htmlFor: "amount",
                      className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                      children: [
                        __("Discount Amount", "yatra"),
                        " ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                    formData.type === "percentage" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "amount",
                        name: "amount",
                        type: "number",
                        min: "0",
                        max: "100",
                        step: "0.01",
                        value: formData.amount,
                        onChange: (e) => handleFieldChange("amount", e.target.value),
                        placeholder: __("e.g., 15", "yatra"),
                        className: errors.amount ? "border-red-500" : "",
                        required: true
                      }
                    ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: "$" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          id: "amount",
                          name: "amount",
                          type: "number",
                          min: "0",
                          step: "0.01",
                          value: formData.amount,
                          onChange: (e) => handleFieldChange("amount", e.target.value),
                          placeholder: __("e.g., 50", "yatra"),
                          className: `pl-7 ${errors.amount ? "border-red-500" : ""}`,
                          required: true
                        }
                      )
                    ] }),
                    formData.type === "percentage" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: "%" })
                  ] }),
                  errors.amount && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                    errors.amount
                  ] })
                ] })
              ] }),
              !isEffectiveGroupOnly && formData.type === "percentage" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "label",
                  {
                    htmlFor: "max_discount_amount",
                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                    children: __("Maximum Discount Amount", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __(
                      "Optional maximum discount cap. For example, if discount is 20% with max $500, a $5000 booking gets $500 off (not $1000).",
                      "yatra"
                    ),
                    className: "mb-2"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: "$" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "max_discount_amount",
                      type: "number",
                      min: "0",
                      step: "0.01",
                      value: formData.max_discount_amount,
                      onChange: (e) => handleFieldChange(
                        "max_discount_amount",
                        e.target.value
                      ),
                      placeholder: __("e.g., 500 (optional)", "yatra"),
                      className: `pl-7 ${errors.max_discount_amount ? "border-red-500" : ""}`
                    }
                  )
                ] }),
                errors.max_discount_amount && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                  errors.max_discount_amount
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Usage & Restrictions", "yatra") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "label",
                  {
                    htmlFor: "usage_limit",
                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                    children: __("Total Usage Limit", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __(
                      "Maximum number of times this coupon can be used across all customers. Enter 0 for unlimited usage.",
                      "yatra"
                    ),
                    className: "mb-2"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "usage_limit",
                    type: "number",
                    min: "0",
                    value: formData.usage_limit,
                    onChange: (e) => handleFieldChange("usage_limit", e.target.value),
                    placeholder: __("0 for unlimited", "yatra"),
                    className: errors.usage_limit ? "border-red-500" : ""
                  }
                ),
                errors.usage_limit && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                  errors.usage_limit
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "label",
                  {
                    htmlFor: "usage_limit_per_customer",
                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                    children: __("Usage Limit Per Customer", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __(
                      "Maximum number of times a single customer can use this coupon. Enter 0 for unlimited usage per customer.",
                      "yatra"
                    ),
                    className: "mb-2"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "usage_limit_per_customer",
                    type: "number",
                    min: "0",
                    value: formData.usage_limit_per_customer,
                    onChange: (e) => handleFieldChange(
                      "usage_limit_per_customer",
                      e.target.value
                    ),
                    placeholder: __("0 for unlimited", "yatra"),
                    className: errors.usage_limit_per_customer ? "border-red-500" : ""
                  }
                ),
                errors.usage_limit_per_customer && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                  errors.usage_limit_per_customer
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: formData.first_time_customer_only,
                      onChange: (e) => handleFieldChange(
                        "first_time_customer_only",
                        e.target.checked
                      ),
                      className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: __("First-Time Customers Only", "yatra") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __(
                      "If enabled, only customers who have never made a booking before can use this coupon.",
                      "yatra"
                    ),
                    className: "mb-2 mt-1"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "label",
                  {
                    htmlFor: "min_amount",
                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                    children: __("Minimum Booking Amount", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __(
                      "Minimum total booking amount required to use this coupon. This applies to the total booking value (trip price × number of travelers).",
                      "yatra"
                    ),
                    className: "mb-2"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: "$" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "min_amount",
                      type: "number",
                      min: "0",
                      step: "0.01",
                      value: formData.min_amount,
                      onChange: (e) => handleFieldChange("min_amount", e.target.value),
                      placeholder: __("e.g., 100", "yatra"),
                      className: `pl-7 ${errors.min_amount ? "border-red-500" : ""}`
                    }
                  )
                ] }),
                errors.min_amount && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                  errors.min_amount
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      htmlFor: "valid_from",
                      className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                      children: __("Valid From", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    DatePicker,
                    {
                      value: formData.valid_from,
                      onChange: (value) => handleFieldChange("valid_from", value),
                      placeholder: __("Select start date", "yatra"),
                      error: !!errors.valid_from,
                      className: errors.valid_from ? "border-red-500" : ""
                    }
                  ),
                  errors.valid_from && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                    errors.valid_from
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      htmlFor: "expiry_date",
                      className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                      children: __("Expiry Date", "yatra")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    DatePicker,
                    {
                      value: formData.expiry_date,
                      onChange: (value) => handleFieldChange("expiry_date", value),
                      placeholder: __("Select expiry date", "yatra"),
                      minDate: formData.valid_from ? new Date(formData.valid_from) : /* @__PURE__ */ new Date(),
                      error: !!errors.expiry_date,
                      className: errors.expiry_date ? "border-red-500" : ""
                    }
                  ),
                  errors.expiry_date && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                    errors.expiry_date
                  ] })
                ] })
              ] })
            ] })
          ] }),
          !isEffectivePromoOnly && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Group Discount Settings", "yatra") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              !isEffectiveGroupOnly && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: formData.is_group_discount,
                      onChange: (e) => handleGroupDiscountToggle(e.target.checked),
                      className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: __("Enable Group Discount", "yatra") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __(
                      "Apply discounts for group bookings based on traveler count.",
                      "yatra"
                    ),
                    className: "mb-2 mt-1"
                  }
                )
              ] }),
              formData.is_group_discount && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "label",
                    {
                      htmlFor: "group_discount_mode",
                      className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                      children: [
                        __("Discount Mode", "yatra"),
                        " ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HelpText,
                    {
                      text: __(
                        "Choose how to apply the group discount: Total discount on entire booking, or category-based rates per traveler type.",
                        "yatra"
                      ),
                      className: "mb-2"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      id: "group_discount_mode",
                      value: formData.group_discount_mode,
                      onChange: (e) => handleFieldChange(
                        "group_discount_mode",
                        e.target.value
                      ),
                      className: errors.group_discount_mode ? "border-red-500" : "",
                      required: formData.is_group_discount,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "total", children: __("Total Discount", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "category_based", children: __("Category-Based Discount", "yatra") })
                      ]
                    }
                  ),
                  errors.group_discount_mode && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                    errors.group_discount_mode
                  ] })
                ] }),
                formData.group_discount_mode === "total" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: __("Group Size Ranges", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
                        "Add one or more ranges (e.g., 1-10, 10-12, 12-15, 15+). The first matching range will be applied.",
                        "yatra"
                      ) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        type: "button",
                        variant: "outline",
                        onClick: addRange,
                        className: "flex items-center gap-2",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                          __("Add Range", "yatra")
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: formData.group_discount_ranges.map(
                    (range, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Card,
                      {
                        className: "border border-gray-200 dark:border-gray-700",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 space-y-3", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: [
                              __("Range", "yatra"),
                              " #",
                              idx + 1
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Button,
                              {
                                type: "button",
                                variant: "outline",
                                onClick: () => removeRange(range.id),
                                disabled: formData.group_discount_ranges.length === 1,
                                className: "flex items-center gap-2",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }),
                                  __("Remove", "yatra")
                                ]
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                                __("Minimum Group Size", "yatra"),
                                " ",
                                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Input,
                                {
                                  type: "number",
                                  min: "1",
                                  value: range.min_group_size,
                                  onChange: (e) => updateRange(range.id, {
                                    min_group_size: e.target.value
                                  }),
                                  placeholder: __(
                                    "e.g., 10",
                                    "yatra"
                                  ),
                                  className: errors[`group_discount_ranges_${idx}_min`] ? "border-red-500" : ""
                                }
                              ),
                              errors[`group_discount_ranges_${idx}_min`] && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                                errors[`group_discount_ranges_${idx}_min`]
                              ] })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: __("Maximum Group Size", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Input,
                                {
                                  type: "number",
                                  min: range.min_group_size ? parseInt(
                                    range.min_group_size,
                                    10
                                  ) + 1 : 2,
                                  value: range.max_group_size,
                                  onChange: (e) => updateRange(range.id, {
                                    max_group_size: e.target.value
                                  }),
                                  placeholder: __(
                                    "Leave empty for unlimited",
                                    "yatra"
                                  ),
                                  className: errors[`group_discount_ranges_${idx}_max`] ? "border-red-500" : ""
                                }
                              ),
                              errors[`group_discount_ranges_${idx}_max`] && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                                errors[`group_discount_ranges_${idx}_max`]
                              ] })
                            ] })
                          ] }),
                          formData.group_discount_mode === "total" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                                __("Discount Type", "yatra"),
                                " ",
                                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                Select,
                                {
                                  value: range.discount_type || "percentage",
                                  onChange: (e) => updateRange(range.id, {
                                    discount_type: e.target.value
                                  }),
                                  className: errors[`group_discount_ranges_${idx}_type`] ? "border-red-500" : "",
                                  children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "percentage", children: __("Percentage", "yatra") }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fixed", children: __("Fixed Amount", "yatra") }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "percentage_of_total", children: __(
                                      "Percentage of Total",
                                      "yatra"
                                    ) })
                                  ]
                                }
                              ),
                              errors[`group_discount_ranges_${idx}_type`] && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                                errors[`group_discount_ranges_${idx}_type`]
                              ] })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                                __("Discount Amount", "yatra"),
                                " ",
                                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                                range.discount_type === "fixed" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: "$" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Input,
                                  {
                                    type: "number",
                                    min: "0",
                                    max: range.discount_type === "percentage" ? 100 : void 0,
                                    step: "0.01",
                                    value: range.discount_amount || "",
                                    onChange: (e) => updateRange(range.id, {
                                      discount_amount: e.target.value
                                    }),
                                    placeholder: range.discount_type === "percentage" ? __("e.g., 10", "yatra") : __("e.g., 50", "yatra"),
                                    className: `${range.discount_type === "fixed" ? "pl-7" : ""} ${errors[`group_discount_ranges_${idx}_amount`] ? "border-red-500" : ""}`
                                  }
                                ),
                                range.discount_type === "percentage" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: "%" })
                              ] }),
                              errors[`group_discount_ranges_${idx}_amount`] && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                                errors[`group_discount_ranges_${idx}_amount`]
                              ] })
                            ] })
                          ] })
                        ] })
                      },
                      range.id
                    )
                  ) })
                ] }),
                formData.group_discount_mode === "category_based" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: __("Traveler Categories", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
                        "Add traveler categories and define discount ranges for each category.",
                        "yatra"
                      ) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          type: "button",
                          onClick: addTravelerCategory,
                          className: "flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                            __("Add Category", "yatra")
                          ]
                        }
                      ),
                      showCategoryDropdown && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 top-full mt-2 z-50 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-lg min-w-[320px]", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __(
                          "Select a category to add pricing",
                          "yatra"
                        ) }) }),
                        travelerCategoryOptions.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-gray-100 dark:divide-gray-700 max-h-[300px] overflow-y-auto", children: travelerCategoryOptions.map((cat) => {
                          var _a;
                          return /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              onClick: () => selectCategory(
                                cat.value,
                                cat.label
                              ),
                              className: "px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: cat.label }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: [
                                    "(",
                                    cat.age_min || "null",
                                    "-",
                                    cat.age_max || "null",
                                    " ",
                                    __("years", "yatra"),
                                    ")"
                                  ] })
                                ] }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-gray-500 dark:text-gray-400", children: [
                                  cat.description && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                                    cat.description,
                                    " •",
                                    " "
                                  ] }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "capitalize", children: ((_a = cat.pricing_mode) == null ? void 0 : _a.replace(
                                    "_",
                                    " "
                                  )) || "Per person" })
                                ] })
                              ] })
                            },
                            cat.value
                          );
                        }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 text-center text-sm text-gray-500 dark:text-gray-400", children: __(
                          "No traveler categories available. Please create categories first.",
                          "yatra"
                        ) })
                      ] })
                    ] })
                  ] }),
                  errors.category_discounts && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                    errors.category_discounts
                  ] }),
                  formData.category_discounts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-8 h-8 text-gray-500 dark:text-gray-400" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-gray-500 dark:text-gray-400", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-medium mb-2", children: __(
                        "No traveler categories added yet",
                        "yatra"
                      ) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm mb-4", children: __(
                        "Select traveler categories to apply group-specific discounts",
                        "yatra"
                      ) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        type: "button",
                        onClick: addTravelerCategory,
                        className: "flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                          __("Add Your First Category", "yatra")
                        ]
                      }
                    )
                  ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: formData.category_discounts.map(
                    (category, catIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Card,
                      {
                        className: "border border-gray-200 dark:border-gray-700",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 space-y-3", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: [
                                __("Traveler Category", "yatra"),
                                " ",
                                "#",
                                catIdx + 1
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
                                "Configure discount ranges for this traveler category.",
                                "yatra"
                              ) })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Button,
                              {
                                type: "button",
                                variant: "outline",
                                onClick: () => removeTravelerCategory(catIdx),
                                disabled: formData.category_discounts.length === 1,
                                className: "flex items-center gap-2",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }),
                                  __("Remove", "yatra")
                                ]
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                              __(
                                "Select Traveler Category",
                                "yatra"
                              ),
                              " ",
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Select,
                              {
                                value: category.traveler_category_id,
                                onChange: (e) => {
                                  const selected = travelerCategoryOptions.find(
                                    (opt) => opt.value === e.target.value
                                  );
                                  updateTravelerCategory(catIdx, {
                                    traveler_category_id: e.target.value,
                                    traveler_category_label: (selected == null ? void 0 : selected.label) || ""
                                  });
                                },
                                className: errors[`category_discounts_${catIdx}_id`] ? "border-red-500" : "",
                                children: travelerCategoryOptions.map(
                                  (opt) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    "option",
                                    {
                                      value: opt.value,
                                      children: opt.label
                                    },
                                    opt.value
                                  )
                                )
                              }
                            ),
                            errors[`category_discounts_${catIdx}_id`] && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                              errors[`category_discounts_${catIdx}_id`]
                            ] })
                          ] }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: __("Discount Ranges", "yatra") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
                                "Add multiple group size ranges for this category (e.g., 1-10, 10-12, 12-15, 15+).",
                                "yatra"
                              ) })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Button,
                              {
                                type: "button",
                                variant: "outline",
                                onClick: () => addRangeToCategory(catIdx),
                                className: "flex items-center gap-2",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                                  __("Add Range", "yatra")
                                ]
                              }
                            )
                          ] }),
                          errors[`category_discounts_${catIdx}_ranges`] && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                            errors[`category_discounts_${catIdx}_ranges`]
                          ] }),
                          category.ranges.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-gray-500 dark:text-gray-400", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium mb-1", children: __(
                              "No discount ranges added yet",
                              "yatra"
                            ) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs", children: __(
                              'Click "Add Range" to create discount tiers',
                              "yatra"
                            ) })
                          ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: category.ranges.map(
                            (range, rIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              "div",
                              {
                                className: "border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-800",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: [
                                      __("Range", "yatra"),
                                      " #",
                                      rIdx + 1
                                    ] }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                      Button,
                                      {
                                        type: "button",
                                        variant: "outline",
                                        size: "sm",
                                        onClick: () => removeRangeFromCategory(
                                          catIdx,
                                          range.id
                                        ),
                                        disabled: category.ranges.length === 1,
                                        className: "flex items-center gap-1",
                                        children: [
                                          /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" }),
                                          __("Remove", "yatra")
                                        ]
                                      }
                                    )
                                  ] }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                                        __(
                                          "Minimum Group Size",
                                          "yatra"
                                        ),
                                        " ",
                                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                                      ] }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                                        Input,
                                        {
                                          type: "number",
                                          min: "1",
                                          value: range.min_group_size,
                                          onChange: (e) => updateRangeInCategory(
                                            catIdx,
                                            range.id,
                                            {
                                              min_group_size: e.target.value
                                            }
                                          ),
                                          placeholder: __(
                                            "e.g., 10",
                                            "yatra"
                                          ),
                                          className: errors[`category_discounts_${catIdx}_ranges_${rIdx}_min`] ? "border-red-500" : ""
                                        }
                                      ),
                                      errors[`category_discounts_${catIdx}_ranges_${rIdx}_min`] && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                                        errors[`category_discounts_${catIdx}_ranges_${rIdx}_min`]
                                      ] })
                                    ] }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: __(
                                        "Maximum Group Size",
                                        "yatra"
                                      ) }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                                        Input,
                                        {
                                          type: "number",
                                          min: range.min_group_size ? parseInt(
                                            range.min_group_size,
                                            10
                                          ) + 1 : 2,
                                          value: range.max_group_size,
                                          onChange: (e) => updateRangeInCategory(
                                            catIdx,
                                            range.id,
                                            {
                                              max_group_size: e.target.value
                                            }
                                          ),
                                          placeholder: __(
                                            "Leave empty for unlimited",
                                            "yatra"
                                          ),
                                          className: errors[`category_discounts_${catIdx}_ranges_${rIdx}_max`] ? "border-red-500" : ""
                                        }
                                      ),
                                      errors[`category_discounts_${catIdx}_ranges_${rIdx}_max`] && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                                        errors[`category_discounts_${catIdx}_ranges_${rIdx}_max`]
                                      ] })
                                    ] })
                                  ] }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                                        __(
                                          "Discount Type",
                                          "yatra"
                                        ),
                                        " ",
                                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                                      ] }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                        Select,
                                        {
                                          value: range.discount_type || "percentage",
                                          onChange: (e) => updateRangeInCategory(
                                            catIdx,
                                            range.id,
                                            {
                                              discount_type: e.target.value
                                            }
                                          ),
                                          className: errors[`category_discounts_${catIdx}_ranges_${rIdx}_type`] ? "border-red-500" : "",
                                          children: [
                                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "percentage", children: __(
                                              "Percentage",
                                              "yatra"
                                            ) }),
                                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fixed", children: __(
                                              "Fixed Amount",
                                              "yatra"
                                            ) })
                                          ]
                                        }
                                      ),
                                      errors[`category_discounts_${catIdx}_ranges_${rIdx}_type`] && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                                        errors[`category_discounts_${catIdx}_ranges_${rIdx}_type`]
                                      ] })
                                    ] }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                                        __(
                                          "Discount Amount",
                                          "yatra"
                                        ),
                                        " ",
                                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                                      ] }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                                        range.discount_type === "fixed" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: "$" }),
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                                          Input,
                                          {
                                            type: "number",
                                            min: "0",
                                            max: range.discount_type === "percentage" ? 100 : void 0,
                                            step: "0.01",
                                            value: range.discount_amount || "",
                                            onChange: (e) => updateRangeInCategory(
                                              catIdx,
                                              range.id,
                                              {
                                                discount_amount: e.target.value
                                              }
                                            ),
                                            placeholder: range.discount_type === "percentage" ? __(
                                              "e.g., 10",
                                              "yatra"
                                            ) : __(
                                              "e.g., 50",
                                              "yatra"
                                            ),
                                            className: `${range.discount_type === "fixed" ? "pl-7" : ""} ${errors[`category_discounts_${catIdx}_ranges_${rIdx}_amount`] ? "border-red-500" : ""}`
                                          }
                                        ),
                                        range.discount_type === "percentage" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: "%" })
                                      ] }),
                                      errors[`category_discounts_${catIdx}_ranges_${rIdx}_amount`] && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1", children: [
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4" }),
                                        errors[`category_discounts_${catIdx}_ranges_${rIdx}_amount`]
                                      ] })
                                    ] })
                                  ] })
                                ]
                              },
                              range.id
                            )
                          ) })
                        ] })
                      },
                      catIdx
                    )
                  ) })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Status", "yatra") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: formData.status,
                  onChange: (e) => handleFieldChange(
                    "status",
                    e.target.value
                  ),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "draft", children: __("Draft", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "publish", children: __("Publish", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "trash", children: __("Trash", "yatra") })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
                "Only published coupons can be used by customers.",
                "yatra"
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Applicable To", "yatra") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              ApplicableTripSelector,
              {
                value: formData.applicable_to,
                onValueChange: (val) => handleFieldChange("applicable_to", val),
                selectedTripIds: formData.trip_ids,
                onTripIdsChange: (ids) => handleFieldChange("trip_ids", ids),
                description: __(
                  "Choose whether this discount applies to all trips or specific ones."
                ),
                helperText: __(
                  "Trips shown with ID for quick identification."
                )
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            errors.submit && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md", children: errors.submit }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "submit",
                  disabled: isSubmitting,
                  className: "flex-1 flex items-center justify-center gap-2",
                  children: isSubmitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
                    __("Saving...", "yatra")
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4" }),
                    isEditMode ? __("Update Coupon", "yatra") : __("Create Coupon", "yatra")
                  ] })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: handleBack,
                  disabled: isSubmitting,
                  children: __("Cancel", "yatra")
                }
              )
            ] })
          ] }) }) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PremiumUpgradeDialog,
      {
        open: showPremiumModal,
        onClose: () => setShowPremiumModal(false),
        moduleName: __("Group Discounts", "yatra"),
        purchaseUrl: "https://wpyatra.com/pricing?module=group-discounts",
        moduleDescription: __(
          "Unlock powerful group discount features to automatically apply discounts based on group size and traveler categories.",
          "yatra"
        )
      }
    )
  ] });
};
export {
  DiscountForm as default
};
//# sourceMappingURL=DiscountForm-0WfPB7fw.js.map
