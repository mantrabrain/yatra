/**
 * Discount Form Page
 * Add/Edit Discount Coupon form
 */

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  Loader2,
  Info,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { __ } from "../lib/i18n";
import { usePermissions } from "../hooks/usePermissions";
import { useToast } from "../components/ui/toast";
import { apiClient } from "../lib/api-client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { PageHeader } from "../components/common/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ConditionalRender } from "../components/ui/conditional-render";
import { HelpText } from "../components/ui/help-text";
import { DatePicker } from "../components/ui/date-picker";
import { ApplicableTripSelector } from "../components/shared/ApplicableTripSelector";
import { PremiumUpgradeDialog } from "../components/modules/PremiumUpgradeDialog";

interface DiscountFormData {
  code: string;
  description: string;
  type: "percentage" | "fixed";
  amount: string;
  max_discount_amount: string; // Maximum discount amount for percentage discounts
  usage_limit: string; // Total usage limit
  usage_limit_per_customer: string; // Usage limit per customer
  valid_from: string; // Start date
  expiry_date: string; // End date
  status: "draft" | "publish" | "trash";
  applicable_to: "all" | "specific_trips";
  trip_ids: number[];
  min_amount: string; // Minimum booking amount
  first_time_customer_only: boolean; // Only for first-time customers
  is_group_discount: boolean;
  discount_mode: "promo" | "group" | "both"; // Type of discount: promo code only, group only, or both
  group_discount_mode: "total" | "category_based";
  group_discount_ranges: Array<{
    id: string;
    min_group_size: string;
    max_group_size: string; // empty = unlimited
    discount_type: "percentage" | "fixed";
    discount_amount: string;
    categories: Array<{
      id: string;
      traveler_category_id: string;
      discount_type: "percentage" | "fixed";
      discount_amount: string;
    }>;
  }>;
  category_discounts: Array<{
    traveler_category_id: string;
    traveler_category_label: string;
    isSelecting?: boolean;
    ranges: Array<{
      id: string;
      min_group_size: string;
      max_group_size: string; // empty = unlimited
      discount_type: "percentage" | "fixed";
      discount_amount: string;
    }>;
  }>;
}

const DiscountForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can, permissions, isPro } = usePermissions();
  const { showToast } = useToast();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  // Get initial discount_mode from URL at initialization time
  const getInitialState = (): DiscountFormData => {
    const params = new URLSearchParams(window.location.search);
    const urlDiscountMode = (params.get("discount_mode") || "both") as
      | "promo"
      | "group"
      | "both";
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
          categories: [],
        },
      ],
      category_discounts: [],
    };
  };

  const [formData, setFormData] = useState<DiscountFormData>(getInitialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") || "create";
  }, []);

  const discountId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") ? parseInt(params.get("id") || "0") : null;
  }, []);

  const duplicateId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("duplicate")
      ? parseInt(params.get("duplicate") || "0")
      : null;
  }, []);

  // Get discount_mode from URL (promo, group, or both) - compute once at module level
  const discountMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("discount_mode") || "both") as
      | "promo"
      | "group"
      | "both";
  }, []);

  const isEditMode = action === "edit" && discountId !== null;
  const isDuplicateMode = action === "create" && duplicateId !== null;

  // For new discounts, use URL param; for edit mode, we'll use formData.discount_mode after it's loaded
  const isGroupOnlyMode = discountMode === "group";
  const isPromoOnlyMode = discountMode === "promo";

  // Computed mode that works for both create and edit - use formData when available
  const effectiveDiscountMode = isEditMode
    ? formData.discount_mode
    : discountMode;
  const isEffectiveGroupOnly = effectiveDiscountMode === "group";
  const isEffectivePromoOnly = effectiveDiscountMode === "promo";

  // Fetch discount data if editing or duplicating
  const { data: discountData, isLoading: isLoadingDiscount } = useQuery({
    queryKey: ["discount", discountId || duplicateId],
    queryFn: async () => {
      const id = discountId || duplicateId;
      if (!id) return null;
      try {
        const response = await apiClient.get(`/discounts/${id}`);
        return response;
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to load discount", "yatra"),
          "error",
        );
        throw error;
      }
    },
    enabled: (isEditMode || isDuplicateMode) && can("yatra_view_bookings"),
  });

  // Load discount data into form when editing or duplicating
  useEffect(() => {
    if (discountData && (isEditMode || isDuplicateMode)) {
      setFormData({
        code: isDuplicateMode
          ? `${discountData.code}_COPY`
          : discountData.code || "",
        description: discountData.description || "",
        type: (discountData.type || "percentage") as "percentage" | "fixed",
        amount: discountData.amount?.toString() || "",
        max_discount_amount: discountData.max_discount_amount?.toString() || "",
        usage_limit: discountData.usage_limit?.toString() || "0",
        usage_limit_per_customer:
          discountData.usage_limit_per_customer?.toString() || "0",
        valid_from: discountData.valid_from || "",
        expiry_date: discountData.expiry_date || "",
        status: (isDuplicateMode ? "draft" : discountData.status || "draft") as
          | "draft"
          | "publish"
          | "trash",
        applicable_to: (discountData.applicable_to || "all") as
          | "all"
          | "specific_trips",
        trip_ids: discountData.trip_ids || [],
        min_amount: discountData.min_amount?.toString() || "",
        first_time_customer_only:
          discountData.first_time_customer_only || false,
        is_group_discount: discountData.is_group_discount || false,
        discount_mode: (discountData.discount_mode || "both") as
          | "promo"
          | "group"
          | "both",
        group_discount_mode: (discountData.group_discount_mode || "total") as
          | "total"
          | "category_based",
        group_discount_ranges:
          Array.isArray(discountData.group_discount_ranges) &&
          discountData.group_discount_ranges.length
            ? discountData.group_discount_ranges
            : [
                {
                  id: String(Date.now()),
                  min_group_size: discountData.min_group_size?.toString() || "",
                  max_group_size: discountData.max_group_size?.toString() || "",
                  discount_type: (discountData.group_discount_type ||
                    "percentage") as "percentage" | "fixed",
                  discount_amount:
                    discountData.group_discount_amount?.toString() || "",
                  categories: [],
                },
              ],
        category_discounts:
          Array.isArray(discountData.category_discounts) &&
          discountData.category_discounts?.length
            ? discountData.category_discounts
            : [],
      });
    }
  }, [discountData, isEditMode, isDuplicateMode]);

  // Set initial form state based on discount mode (only for new discounts)
  useEffect(() => {
    if (!isEditMode && !isDuplicateMode && !discountData) {
      if (isGroupOnlyMode) {
        // Group discount only - auto-enable group discount, set amount to 0
        setFormData((prev) => ({
          ...prev,
          is_group_discount: true,
          discount_mode: "group",
          amount: "0",
          type: "percentage",
        }));
      } else if (isPromoOnlyMode) {
        // Promo code only - disable group discount
        setFormData((prev) => ({
          ...prev,
          is_group_discount: false,
          discount_mode: "promo",
        }));
      } else {
        // Both - default
        setFormData((prev) => ({
          ...prev,
          discount_mode: "both",
        }));
      }
    }
  }, [
    isGroupOnlyMode,
    isPromoOnlyMode,
    isEditMode,
    isDuplicateMode,
    discountData,
  ]);

  const handleFieldChange = (field: keyof DiscountFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Clear ranges when switching discount modes
    if (field === "group_discount_mode") {
      if (value === "category_based") {
        // Switch to category-based - clear regular ranges and start with empty categories
        setFormData((prev) => ({
          ...prev,
          group_discount_mode: "category_based",
          group_discount_ranges: [],
          category_discounts: [], // Ensure empty categories array
        }));
      } else {
        // Switch to total - clear category discounts and start with one empty range
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
              categories: [],
            },
          ],
          category_discounts: [], // Ensure empty categories array
        }));
      }
    }
  };

  const handleGroupDiscountToggle = (checked: boolean) => {
    handleFieldChange("is_group_discount", checked);
  };

  const travelerCategoriesQuery = useQuery({
    queryKey: ["traveler-categories"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/traveler-categories", {
          params: {
            per_page: 100,
            status: "publish",
          },
        });
        const categories =
          response?.data?.data || response?.data || response || [];
        return Array.isArray(categories) ? categories : [];
      } catch (error: any) {
        console.error("Failed to load traveler categories:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const travelerCategoryOptions = useMemo(() => {
    const items = travelerCategoriesQuery.data || [];
    return items
      .filter(
        (c: any) =>
          !!c &&
          (typeof c.id === "number" || typeof c.id === "string") &&
          (c.status === "publish" || c.status === "active"),
      )
      .map((c: any) => ({
        value: String(c.id),
        label: c.label || c.slug || String(c.id),
        description: c.description || "",
        age_min: c.age_min,
        age_max: c.age_max,
        pricing_mode: c.pricing_mode || "per_person",
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
          categories: [],
        },
      ],
    }));
  };

  const removeRange = (rangeId: string) => {
    setFormData((prev) => ({
      ...prev,
      group_discount_ranges: prev.group_discount_ranges.filter(
        (r) => r.id !== rangeId,
      ),
    }));
  };

  const updateRange = (
    rangeId: string,
    patch: Partial<DiscountFormData["group_discount_ranges"][number]>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      group_discount_ranges: prev.group_discount_ranges.map((r) =>
        r.id === rangeId ? { ...r, ...patch } : r,
      ),
    }));
  };

  // Category-based discount functions
  const addTravelerCategory = () => {
    // Toggle category selection dropdown
    setShowCategoryDropdown((prev) => !prev);
  };

  const selectCategory = (categoryId: string, categoryLabel: string) => {
    // Add selected category and close dropdown
    setFormData((prev) => ({
      ...prev,
      category_discounts: [
        ...prev.category_discounts,
        {
          traveler_category_id: categoryId,
          traveler_category_label: categoryLabel,
          ranges: [],
          isSelecting: false,
        },
      ],
    }));
    setShowCategoryDropdown(false);
  };

  const removeTravelerCategory = (categoryIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      category_discounts: prev.category_discounts.filter(
        (_, idx) => idx !== categoryIndex,
      ),
    }));
  };

  const updateTravelerCategory = (
    categoryIndex: number,
    patch: Partial<DiscountFormData["category_discounts"][number]>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      category_discounts: prev.category_discounts.map((cat, idx) =>
        idx === categoryIndex ? { ...cat, ...patch } : cat,
      ),
    }));
  };

  const addRangeToCategory = (categoryIndex: number) => {
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
              discount_amount: "",
            },
          ],
        };
      }),
    }));
  };

  const removeRangeFromCategory = (categoryIndex: number, rangeId: string) => {
    setFormData((prev) => ({
      ...prev,
      category_discounts: prev.category_discounts.map((cat, idx) => {
        if (idx !== categoryIndex) return cat;
        return { ...cat, ranges: cat.ranges.filter((r) => r.id !== rangeId) };
      }),
    }));
  };

  const updateRangeInCategory = (
    categoryIndex: number,
    rangeId: string,
    patch: Partial<
      DiscountFormData["category_discounts"][number]["ranges"][number]
    >,
  ) => {
    setFormData((prev) => ({
      ...prev,
      category_discounts: prev.category_discounts.map((cat, idx) => {
        if (idx !== categoryIndex) return cat;
        const ranges = cat.ranges.map((r) =>
          r.id === rangeId ? { ...r, ...patch } : r,
        );
        return { ...cat, ranges };
      }),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Internal name/code is always required
    if (!formData.code.trim()) {
      newErrors.code = isEffectiveGroupOnly
        ? __("Internal name is required", "yatra")
        : __("Coupon code is required", "yatra");
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = __(
        "Only uppercase letters, numbers, hyphens, and underscores are allowed",
        "yatra",
      );
    }

    // Discount amount validation - skip for group-only mode
    if (!isEffectiveGroupOnly) {
      if (!formData.amount.trim()) {
        newErrors.amount = __("Discount amount is required", "yatra");
      } else {
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount < 0) {
          newErrors.amount = __(
            "Discount amount must be a positive number",
            "yatra",
          );
        } else if (formData.type === "percentage" && amount > 100) {
          newErrors.amount = __(
            "Percentage discount cannot exceed 100%",
            "yatra",
          );
        }
      }

      // Maximum discount amount validation (for percentage discounts)
      if (
        formData.type === "percentage" &&
        formData.max_discount_amount &&
        formData.max_discount_amount.trim()
      ) {
        const maxAmount = parseFloat(formData.max_discount_amount);
        if (isNaN(maxAmount) || maxAmount <= 0) {
          newErrors.max_discount_amount = __(
            "Maximum discount amount must be a positive number",
            "yatra",
          );
        }
      }
    }

    if (formData.usage_limit && formData.usage_limit !== "0") {
      const limit = parseInt(formData.usage_limit);
      if (isNaN(limit) || limit < 0) {
        newErrors.usage_limit = __(
          "Usage limit must be a positive number or 0 for unlimited",
          "yatra",
        );
      }
    }

    if (
      formData.usage_limit_per_customer &&
      formData.usage_limit_per_customer !== "0"
    ) {
      const limit = parseInt(formData.usage_limit_per_customer);
      if (isNaN(limit) || limit < 0) {
        newErrors.usage_limit_per_customer = __(
          "Per-customer usage limit must be a positive number or 0 for unlimited",
          "yatra",
        );
      }
    }

    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Valid from date can be in the past (backdating allowed)
    // No validation needed for valid_from date

    if (formData.expiry_date) {
      const expiryDate = new Date(formData.expiry_date);
      if (expiryDate < today) {
        newErrors.expiry_date = __(
          "Expiry date cannot be in the past",
          "yatra",
        );
      }
    }

    // Check if expiry date is after valid from date
    if (formData.valid_from && formData.expiry_date) {
      const validFrom = new Date(formData.valid_from);
      const expiryDate = new Date(formData.expiry_date);
      if (expiryDate < validFrom) {
        newErrors.expiry_date = __(
          "Expiry date must be after the valid from date",
          "yatra",
        );
      }
    }

    if (formData.min_amount && formData.min_amount.trim()) {
      const minAmount = parseFloat(formData.min_amount);
      if (isNaN(minAmount) || minAmount < 0) {
        newErrors.min_amount = __(
          "Minimum amount must be a positive number",
          "yatra",
        );
      }
    }

    // Group discount validation (multiple ranges) - only for 'total' mode
    if (
      formData.is_group_discount &&
      formData.group_discount_mode === "total"
    ) {
      if (
        !formData.group_discount_ranges ||
        formData.group_discount_ranges.length === 0
      ) {
        newErrors.group_discount_ranges = __(
          "At least one group discount range is required",
          "yatra",
        );
      } else {
        formData.group_discount_ranges.forEach((range, idx) => {
          const prefix = `group_discount_ranges_${idx}`;
          const min = parseInt(range.min_group_size);
          const max = range.max_group_size
            ? parseInt(range.max_group_size)
            : null;

          if (Number.isNaN(min) || min < 1) {
            newErrors[`${prefix}_min`] = __(
              "Minimum group size must be at least 1",
              "yatra",
            );
          }

          if (max !== null) {
            if (Number.isNaN(max) || max < 1) {
              newErrors[`${prefix}_max`] = __(
                "Maximum group size must be a positive number",
                "yatra",
              );
            } else if (!Number.isNaN(min) && max <= min) {
              newErrors[`${prefix}_max`] = __(
                "Maximum group size must be greater than minimum group size",
                "yatra",
              );
            }
          }

          const amount = range.discount_amount
            ? parseFloat(range.discount_amount)
            : NaN;
          if (!range.discount_type) {
            newErrors[`${prefix}_type`] = __(
              "Discount type is required",
              "yatra",
            );
          }
          if (Number.isNaN(amount) || amount <= 0) {
            newErrors[`${prefix}_amount`] = __(
              "Discount amount must be a positive number",
              "yatra",
            );
          } else if (range.discount_type === "percentage" && amount > 100) {
            newErrors[`${prefix}_amount`] = __(
              "Percentage discount cannot exceed 100%",
              "yatra",
            );
          }
        });
      }
    }

    // Category-based discounts validation
    if (
      formData.is_group_discount &&
      formData.group_discount_mode === "category_based"
    ) {
      if (
        !formData.category_discounts ||
        formData.category_discounts.length === 0
      ) {
        newErrors.category_discounts = __(
          "Add at least one traveler category",
          "yatra",
        );
      } else {
        formData.category_discounts.forEach((cat, catIdx) => {
          const catPrefix = `category_discounts_${catIdx}`;
          if (!cat.traveler_category_id) {
            newErrors[`${catPrefix}_id`] = __(
              "Traveler category is required",
              "yatra",
            );
          }
          if (!cat.ranges || cat.ranges.length === 0) {
            newErrors[`${catPrefix}_ranges`] = __(
              "Add at least one discount range",
              "yatra",
            );
          } else {
            cat.ranges.forEach((range, rIdx) => {
              const rangePrefix = `${catPrefix}_ranges_${rIdx}`;
              const min = parseInt(range.min_group_size);
              const max = range.max_group_size
                ? parseInt(range.max_group_size)
                : null;

              if (Number.isNaN(min) || min < 1) {
                newErrors[`${rangePrefix}_min`] = __(
                  "Minimum group size must be at least 1",
                  "yatra",
                );
              }

              if (max !== null) {
                if (Number.isNaN(max) || max < 1) {
                  newErrors[`${rangePrefix}_max`] = __(
                    "Maximum group size must be a positive number",
                    "yatra",
                  );
                } else if (!Number.isNaN(min) && max <= min) {
                  newErrors[`${rangePrefix}_max`] = __(
                    "Maximum group size must be greater than minimum group size",
                    "yatra",
                  );
                }
              }

              const amount = range.discount_amount
                ? parseFloat(range.discount_amount)
                : NaN;
              if (!range.discount_type) {
                newErrors[`${rangePrefix}_type`] = __(
                  "Discount type is required",
                  "yatra",
                );
              }
              if (Number.isNaN(amount) || amount <= 0) {
                newErrors[`${rangePrefix}_amount`] = __(
                  "Discount amount must be a positive number",
                  "yatra",
                );
              } else if (range.discount_type === "percentage" && amount > 100) {
                newErrors[`${rangePrefix}_amount`] = __(
                  "Percentage discount cannot exceed 100%",
                  "yatra",
                );
              }
            });
          }
        });
      }
    }

    setErrors(newErrors);

    // Scroll to first error field
    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      // Try to find the element by name or id
      const errorElement = document.querySelector(
        `[name="${firstErrorKey}"], #${firstErrorKey}, [data-field="${firstErrorKey}"]`,
      );
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // Focus the element if it's an input
        if (
          errorElement instanceof HTMLInputElement ||
          errorElement instanceof HTMLSelectElement ||
          errorElement instanceof HTMLTextAreaElement
        ) {
          setTimeout(() => errorElement.focus(), 300);
        }
      } else {
        // Fallback: scroll to the first error message
        const errorMessage = document.querySelector(
          ".text-red-500, .text-red-600",
        );
        if (errorMessage) {
          errorMessage.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: DiscountFormData) => {
      const payload: any = {
        code: data.code.trim().toUpperCase(),
        description: data.description.trim(),
        type: data.type,
        amount: parseFloat(data.amount) || 0,
        max_discount_amount: data.max_discount_amount
          ? parseFloat(data.max_discount_amount)
          : null,
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
        group_discount_mode: data.is_group_discount
          ? data.group_discount_mode
          : null,
        group_discount_ranges: data.is_group_discount
          ? data.group_discount_ranges
          : [],
        category_discounts:
          data.is_group_discount &&
          data.group_discount_mode === "category_based"
            ? data.category_discounts.map((cat) => ({
                traveler_category_id: cat.traveler_category_id,
                traveler_category_label: cat.traveler_category_label,
                ranges: cat.ranges.map((range) => ({
                  id: range.id,
                  min_group_size: range.min_group_size,
                  max_group_size: range.max_group_size,
                  discount_type: range.discount_type,
                  discount_amount: range.discount_amount,
                })),
              }))
            : [],
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
        queryKey: ["discount", discountId || duplicateId],
      });
      showToast(
        isEditMode
          ? __("Discount updated successfully", "yatra")
          : __("Discount created successfully", "yatra"),
        "success",
      );
      // Only redirect to listing page on create, not on update
      if (!isEditMode) {
        setTimeout(() => {
          window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=discounts`;
        }, 1000);
      }
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message ||
        __("An error occurred while saving the discount", "yatra");
      showToast(errorMessage, "error");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await saveMutation.mutateAsync(formData);
    } catch (error) {
      // Error handled in mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=discounts`;
  };

  if (isLoadingDiscount) {
    return (
      <div className="space-y-3">
        {/* Skeleton Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Skeleton Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-200 dark:bg-blue-700 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-blue-200 dark:bg-blue-700 rounded animate-pulse" />
                <div className="space-y-1">
                  <div className="h-3 w-full bg-blue-100 dark:bg-blue-800 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-blue-100 dark:bg-blue-800 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Form Skeleton */}
          <div className="lg:col-span-2 space-y-3">
            {/* Basic Information Card Skeleton */}
            <Card>
              <CardHeader className="pb-2">
                <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Coupon Code */}
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                {/* Description */}
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                {/* Type and Amount */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Limits Card Skeleton */}
            <Card>
              <CardHeader className="pb-2">
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Group Discount Card Skeleton */}
            <Card>
              <CardHeader className="pb-2">
                <div className="h-5 w-44 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-3">
            {/* Status Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Card>
              <CardContent className="p-3">
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={
          isEditMode
            ? __("Edit Discount Coupon", "yatra")
            : __("Add New Discount Coupon", "yatra")
        }
        description={
          isEditMode
            ? __("Update discount coupon details", "yatra")
            : __("Create a new discount coupon for your trips", "yatra")
        }
        actions={
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {__("Back", "yatra")}
          </Button>
        }
      />

      <ConditionalRender capability="yatra_edit_bookings">
        {/* Discount Information Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {__("How Discounts Work", "yatra")}
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5">
                  <li>
                    • <strong>{__("Regular Discount", "yatra")}:</strong>{" "}
                    {__(
                      "Applied first to the booking total (trip price × travelers)",
                      "yatra",
                    )}
                  </li>
                  <li>
                    • <strong>{__("Group Discount", "yatra")}:</strong>{" "}
                    {__(
                      "Additional discount applied AFTER regular discount when group size requirement is met",
                      "yatra",
                    )}
                  </li>
                  <li>
                    • <strong>{__("Maximum Cap", "yatra")}:</strong>{" "}
                    {__(
                      "For percentage discounts, you can set a maximum dollar amount to cap the discount",
                      "yatra",
                    )}
                  </li>
                  <li>
                    • <strong>{__("Example", "yatra")}:</strong>{" "}
                    {__(
                      "$1000 booking, 15% regular discount ($150 off), then 10% group discount on $850 = $85 more off. Final: $765",
                      "yatra",
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Main Form Fields */}
            <div className="lg:col-span-2 space-y-3">
              {/* Discount Mode Indicator - Show on both Create and Edit */}
              {(() => {
                // Determine mode: use URL param for new discounts, formData for existing
                const currentMode = isEditMode
                  ? formData.discount_mode
                  : discountMode;
                const isGroupOnly = currentMode === "group";
                const isPromoOnly = currentMode === "promo";

                return (
                  <div
                    className={`p-3 rounded-lg border-2 mb-3 ${
                      isGroupOnly
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : isPromoOnly
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                          : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isGroupOnly ? (
                        <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : isPromoOnly ? (
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Info className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      )}
                      <span
                        className={`font-medium ${
                          isGroupOnly
                            ? "text-green-700 dark:text-green-300"
                            : isPromoOnly
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-purple-700 dark:text-purple-300"
                        }`}
                      >
                        {isGroupOnly
                          ? isEditMode
                            ? __(
                                "Group Discount (Auto-applies, no code needed)",
                                "yatra",
                              )
                            : __(
                                "Creating Group Discount (Auto-applies, no code needed)",
                                "yatra",
                              )
                          : isPromoOnly
                            ? isEditMode
                              ? __("Promo Code Discount", "yatra")
                              : __("Creating Promo Code Discount", "yatra")
                            : isEditMode
                              ? __("Promo Code + Group Discount", "yatra")
                              : __(
                                  "Creating Promo Code + Group Discount",
                                  "yatra",
                                )}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Basic Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {isEffectiveGroupOnly
                      ? __("Group Discount Information", "yatra")
                      : __("Basic Information", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Coupon Code - Only show for promo modes */}
                  {!isEffectiveGroupOnly && (
                    <div>
                      <label
                        htmlFor="code"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Coupon Code", "yatra")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <HelpText
                        text={__(
                          "Enter a unique coupon code. Only uppercase letters, numbers, hyphens, and underscores are allowed.",
                          "yatra",
                        )}
                        className="mb-2"
                      />
                      <Input
                        id="code"
                        name="code"
                        type="text"
                        value={formData.code}
                        onChange={(e) =>
                          handleFieldChange(
                            "code",
                            e.target.value.toUpperCase(),
                          )
                        }
                        placeholder={__("e.g., SUMMER2024", "yatra")}
                        className={errors.code ? "border-red-500" : ""}
                        required
                      />
                      {errors.code && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.code}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Internal Name for Group Discount Only */}
                  {isEffectiveGroupOnly && (
                    <div>
                      <label
                        htmlFor="code"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Internal Name", "yatra")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <HelpText
                        text={__(
                          "Enter a unique internal name for this group discount. This is for your reference only and won't be shown to customers.",
                          "Enter a unique internal name for this group discount. This is for your reference only and won't be shown to customers.",
                        )}
                        className="mb-2"
                      />
                      <Input
                        id="code"
                        name="code"
                        type="text"
                        value={formData.code}
                        onChange={(e) =>
                          handleFieldChange(
                            "code",
                            e.target.value.toUpperCase().replace(/\s+/g, "_"),
                          )
                        }
                        placeholder={__("e.g., GROUP_DISCOUNT_2024", "yatra")}
                        className={errors.code ? "border-red-500" : ""}
                        required
                      />
                      {errors.code && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.code}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Description", "yatra")}
                    </label>
                    <HelpText
                      text={__(
                        "Optional description for this discount coupon. This helps you identify the purpose of the coupon.",
                        "yatra",
                      )}
                      className="mb-2"
                    />
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleFieldChange("description", e.target.value)
                      }
                      placeholder={__(
                        "e.g., Summer discount for all trips",
                        "yatra",
                      )}
                      rows={3}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>

                  {/* Discount Type and Amount - Only show for promo modes */}
                  {!isEffectiveGroupOnly && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Discount Type */}
                      <div>
                        <label
                          htmlFor="type"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          {__("Discount Type", "yatra")}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <Select
                          id="type"
                          name="type"
                          value={formData.type}
                          onChange={(e) =>
                            handleFieldChange(
                              "type",
                              e.target.value as "percentage" | "fixed",
                            )
                          }
                          className={errors.type ? "border-red-500" : ""}
                          required
                        >
                          <option value="percentage">
                            {__("Percentage", "yatra")}
                          </option>
                          <option value="fixed">
                            {__("Fixed Amount", "yatra")}
                          </option>
                        </Select>
                        {errors.type && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <Info className="w-4 h-4" />
                            {errors.type}
                          </p>
                        )}
                      </div>

                      {/* Discount Amount */}
                      <div>
                        <label
                          htmlFor="amount"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          {__("Discount Amount", "yatra")}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          {formData.type === "percentage" ? (
                            <Input
                              id="amount"
                              name="amount"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={formData.amount}
                              onChange={(e) =>
                                handleFieldChange("amount", e.target.value)
                              }
                              placeholder={__("e.g., 15", "yatra")}
                              className={errors.amount ? "border-red-500" : ""}
                              required
                            />
                          ) : (
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                $
                              </span>
                              <Input
                                id="amount"
                                name="amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) =>
                                  handleFieldChange("amount", e.target.value)
                                }
                                placeholder={__("e.g., 50", "yatra")}
                                className={`pl-7 ${errors.amount ? "border-red-500" : ""}`}
                                required
                              />
                            </div>
                          )}
                          {formData.type === "percentage" && (
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                              %
                            </span>
                          )}
                        </div>
                        {errors.amount && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <Info className="w-4 h-4" />
                            {errors.amount}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Maximum Discount Amount (for percentage discounts) - Only show for promo modes */}
                  {!isEffectiveGroupOnly && formData.type === "percentage" && (
                    <div>
                      <label
                        htmlFor="max_discount_amount"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Maximum Discount Amount", "yatra")}
                      </label>
                      <HelpText
                        text={__(
                          "Optional maximum discount cap. For example, if discount is 20% with max $500, a $5000 booking gets $500 off (not $1000).",
                          "yatra",
                        )}
                        className="mb-2"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          $
                        </span>
                        <Input
                          id="max_discount_amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.max_discount_amount}
                          onChange={(e) =>
                            handleFieldChange(
                              "max_discount_amount",
                              e.target.value,
                            )
                          }
                          placeholder={__("e.g., 500 (optional)", "yatra")}
                          className={`pl-7 ${errors.max_discount_amount ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.max_discount_amount && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.max_discount_amount}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Usage & Restrictions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Usage & Restrictions", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Usage Limit (Total) */}
                  <div>
                    <label
                      htmlFor="usage_limit"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Total Usage Limit", "yatra")}
                    </label>
                    <HelpText
                      text={__(
                        "Maximum number of times this coupon can be used across all customers. Enter 0 for unlimited usage.",
                        "yatra",
                      )}
                      className="mb-2"
                    />
                    <Input
                      id="usage_limit"
                      type="number"
                      min="0"
                      value={formData.usage_limit}
                      onChange={(e) =>
                        handleFieldChange("usage_limit", e.target.value)
                      }
                      placeholder={__("0 for unlimited", "yatra")}
                      className={errors.usage_limit ? "border-red-500" : ""}
                    />
                    {errors.usage_limit && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.usage_limit}
                      </p>
                    )}
                  </div>

                  {/* Usage Limit Per Customer */}
                  <div>
                    <label
                      htmlFor="usage_limit_per_customer"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Usage Limit Per Customer", "yatra")}
                    </label>
                    <HelpText
                      text={__(
                        "Maximum number of times a single customer can use this coupon. Enter 0 for unlimited usage per customer.",
                        "yatra",
                      )}
                      className="mb-2"
                    />
                    <Input
                      id="usage_limit_per_customer"
                      type="number"
                      min="0"
                      value={formData.usage_limit_per_customer}
                      onChange={(e) =>
                        handleFieldChange(
                          "usage_limit_per_customer",
                          e.target.value,
                        )
                      }
                      placeholder={__("0 for unlimited", "yatra")}
                      className={
                        errors.usage_limit_per_customer ? "border-red-500" : ""
                      }
                    />
                    {errors.usage_limit_per_customer && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.usage_limit_per_customer}
                      </p>
                    )}
                  </div>

                  {/* First-Time Customer Only */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.first_time_customer_only}
                        onChange={(e) =>
                          handleFieldChange(
                            "first_time_customer_only",
                            e.target.checked,
                          )
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {__("First-Time Customers Only", "yatra")}
                      </span>
                    </label>
                    <HelpText
                      text={__(
                        "If enabled, only customers who have never made a booking before can use this coupon.",
                        "yatra",
                      )}
                      className="mb-2 mt-1"
                    />
                  </div>

                  {/* Minimum Amount */}
                  <div>
                    <label
                      htmlFor="min_amount"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Minimum Booking Amount", "yatra")}
                    </label>
                    <HelpText
                      text={__(
                        "Minimum total booking amount required to use this coupon. This applies to the total booking value (trip price × number of travelers).",
                        "yatra",
                      )}
                      className="mb-2"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        $
                      </span>
                      <Input
                        id="min_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.min_amount}
                        onChange={(e) =>
                          handleFieldChange("min_amount", e.target.value)
                        }
                        placeholder={__("e.g., 100", "yatra")}
                        className={`pl-7 ${errors.min_amount ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.min_amount && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.min_amount}
                      </p>
                    )}
                  </div>

                  {/* Valid From Date and Expiry Date - Same Line */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Valid From Date */}
                    <div>
                      <label
                        htmlFor="valid_from"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Valid From", "yatra")}
                      </label>
                      <DatePicker
                        value={formData.valid_from}
                        onChange={(value) =>
                          handleFieldChange("valid_from", value)
                        }
                        placeholder={__("Select start date", "yatra")}
                        error={!!errors.valid_from}
                        className={errors.valid_from ? "border-red-500" : ""}
                      />
                      {errors.valid_from && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.valid_from}
                        </p>
                      )}
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label
                        htmlFor="expiry_date"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Expiry Date", "yatra")}
                      </label>
                      <DatePicker
                        value={formData.expiry_date}
                        onChange={(value) =>
                          handleFieldChange("expiry_date", value)
                        }
                        placeholder={__("Select expiry date", "yatra")}
                        minDate={
                          formData.valid_from
                            ? new Date(formData.valid_from)
                            : new Date()
                        }
                        error={!!errors.expiry_date}
                        className={errors.expiry_date ? "border-red-500" : ""}
                      />
                      {errors.expiry_date && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.expiry_date}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Group Discount - Hide for promo-only mode */}
              {!isEffectivePromoOnly && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {__("Group Discount Settings", "yatra")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Enable Group Discount - Hide checkbox for group-only mode (already enabled) */}
                    {!isEffectiveGroupOnly && (
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.is_group_discount}
                            onChange={(e) =>
                              handleGroupDiscountToggle(e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {__("Enable Group Discount", "yatra")}
                          </span>
                        </label>
                        <HelpText
                          text={__(
                            "Apply discounts for group bookings based on traveler count.",
                            "yatra",
                          )}
                          className="mb-2 mt-1"
                        />
                      </div>
                    )}

                    {formData.is_group_discount && (
                      <>
                        {/* Group Discount Mode */}
                        <div>
                          <label
                            htmlFor="group_discount_mode"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                          >
                            {__("Discount Mode", "yatra")}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <HelpText
                            text={__(
                              "Choose how to apply the group discount: Total discount on entire booking, or category-based rates per traveler type.",
                              "yatra",
                            )}
                            className="mb-2"
                          />
                          <Select
                            id="group_discount_mode"
                            value={formData.group_discount_mode}
                            onChange={(e) =>
                              handleFieldChange(
                                "group_discount_mode",
                                e.target.value as "total" | "category_based",
                              )
                            }
                            className={
                              errors.group_discount_mode ? "border-red-500" : ""
                            }
                            required={formData.is_group_discount}
                          >
                            <option value="total">
                              {__("Total Discount", "yatra")}
                            </option>
                            <option value="category_based">
                              {__("Category-Based Discount", "yatra")}
                            </option>
                          </Select>
                          {errors.group_discount_mode && (
                            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                              <Info className="w-4 h-4" />
                              {errors.group_discount_mode}
                            </p>
                          )}
                        </div>

                        {/* Ranges - Only show for Total Discount mode */}
                        {formData.group_discount_mode === "total" && (
                          <>
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {__("Group Size Ranges", "yatra")}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {__(
                                    "Add one or more ranges (e.g., 1-10, 10-12, 12-15, 15+). The first matching range will be applied.",
                                    "yatra",
                                  )}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={addRange}
                                className="flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                {__("Add Range", "yatra")}
                              </Button>
                            </div>

                            <div className="space-y-3">
                              {formData.group_discount_ranges.map(
                                (range, idx) => (
                                  <Card
                                    key={range.id}
                                    className="border border-gray-200 dark:border-gray-700"
                                  >
                                    <CardContent className="p-4 space-y-3">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                          {__("Range", "yatra")} #{idx + 1}
                                        </div>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() => removeRange(range.id)}
                                          disabled={
                                            formData.group_discount_ranges
                                              .length === 1
                                          }
                                          className="flex items-center gap-2"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          {__("Remove", "yatra")}
                                        </Button>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            {__("Minimum Group Size", "yatra")}{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </label>
                                          <Input
                                            type="number"
                                            min="1"
                                            value={range.min_group_size}
                                            onChange={(e) =>
                                              updateRange(range.id, {
                                                min_group_size: e.target.value,
                                              })
                                            }
                                            placeholder={__(
                                              "e.g., 10",
                                              "yatra",
                                            )}
                                            className={
                                              errors[
                                                `group_discount_ranges_${idx}_min`
                                              ]
                                                ? "border-red-500"
                                                : ""
                                            }
                                          />
                                          {errors[
                                            `group_discount_ranges_${idx}_min`
                                          ] && (
                                            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                              <Info className="w-4 h-4" />
                                              {
                                                errors[
                                                  `group_discount_ranges_${idx}_min`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            {__("Maximum Group Size", "yatra")}
                                          </label>
                                          <Input
                                            type="number"
                                            min={
                                              range.min_group_size
                                                ? parseInt(
                                                    range.min_group_size,
                                                    10,
                                                  ) + 1
                                                : 2
                                            }
                                            value={range.max_group_size}
                                            onChange={(e) =>
                                              updateRange(range.id, {
                                                max_group_size: e.target.value,
                                              })
                                            }
                                            placeholder={__(
                                              "Leave empty for unlimited",
                                              "yatra",
                                            )}
                                            className={
                                              errors[
                                                `group_discount_ranges_${idx}_max`
                                              ]
                                                ? "border-red-500"
                                                : ""
                                            }
                                          />
                                          {errors[
                                            `group_discount_ranges_${idx}_max`
                                          ] && (
                                            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                              <Info className="w-4 h-4" />
                                              {
                                                errors[
                                                  `group_discount_ranges_${idx}_max`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {formData.group_discount_mode ===
                                        "total" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                              {__("Discount Type", "yatra")}{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </label>
                                            <Select
                                              value={
                                                range.discount_type ||
                                                "percentage"
                                              }
                                              onChange={(e) =>
                                                updateRange(range.id, {
                                                  discount_type: e.target
                                                    .value as
                                                    | "percentage"
                                                    | "fixed",
                                                })
                                              }
                                              className={
                                                errors[
                                                  `group_discount_ranges_${idx}_type`
                                                ]
                                                  ? "border-red-500"
                                                  : ""
                                              }
                                            >
                                              <option value="percentage">
                                                {__("Percentage", "yatra")}
                                              </option>
                                              <option value="fixed">
                                                {__("Fixed Amount", "yatra")}
                                              </option>
                                              <option value="percentage_of_total">
                                                {__(
                                                  "Percentage of Total",
                                                  "yatra",
                                                )}
                                              </option>
                                            </Select>
                                            {errors[
                                              `group_discount_ranges_${idx}_type`
                                            ] && (
                                              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                                <Info className="w-4 h-4" />
                                                {
                                                  errors[
                                                    `group_discount_ranges_${idx}_type`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>

                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                              {__("Discount Amount", "yatra")}{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </label>
                                            <div className="relative">
                                              {range.discount_type ===
                                                "fixed" && (
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                                  $
                                                </span>
                                              )}
                                              <Input
                                                type="number"
                                                min="0"
                                                max={
                                                  range.discount_type ===
                                                  "percentage"
                                                    ? 100
                                                    : undefined
                                                }
                                                step="0.01"
                                                value={
                                                  range.discount_amount || ""
                                                }
                                                onChange={(e) =>
                                                  updateRange(range.id, {
                                                    discount_amount:
                                                      e.target.value,
                                                  })
                                                }
                                                placeholder={
                                                  range.discount_type ===
                                                  "percentage"
                                                    ? __("e.g., 10", "yatra")
                                                    : __("e.g., 50", "yatra")
                                                }
                                                className={`${range.discount_type === "fixed" ? "pl-7" : ""} ${errors[`group_discount_ranges_${idx}_amount`] ? "border-red-500" : ""}`}
                                              />
                                              {range.discount_type ===
                                                "percentage" && (
                                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                                  %
                                                </span>
                                              )}
                                            </div>
                                            {errors[
                                              `group_discount_ranges_${idx}_amount`
                                            ] && (
                                              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                                <Info className="w-4 h-4" />
                                                {
                                                  errors[
                                                    `group_discount_ranges_${idx}_amount`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ),
                              )}
                            </div>
                          </>
                        )}

                        {formData.group_discount_mode === "category_based" && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {__("Traveler Categories", "yatra")}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {__(
                                    "Add traveler categories and define discount ranges for each category.",
                                    "yatra",
                                  )}
                                </p>
                              </div>
                              <div className="relative">
                                <Button
                                  type="button"
                                  onClick={addTravelerCategory}
                                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  {__("Add Category", "yatra")}
                                </Button>

                                {/* Category Selection Dropdown */}
                                {showCategoryDropdown && (
                                  <div className="absolute right-0 top-full mt-2 z-50 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-lg min-w-[320px]">
                                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {__(
                                          "Select a category to add pricing",
                                          "yatra",
                                        )}
                                      </p>
                                    </div>

                                    {travelerCategoryOptions.length > 0 ? (
                                      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[300px] overflow-y-auto">
                                        {travelerCategoryOptions.map((cat) => (
                                          <div
                                            key={cat.value}
                                            onClick={() =>
                                              selectCategory(
                                                cat.value,
                                                cat.label,
                                              )
                                            }
                                            className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                          >
                                            <div className="flex flex-col">
                                              <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                  {cat.label}
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                  ({cat.age_min || "null"}-
                                                  {cat.age_max || "null"}{" "}
                                                  {__("years", "yatra")})
                                                </span>
                                              </div>
                                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {cat.description && (
                                                  <span>
                                                    {cat.description} •{" "}
                                                  </span>
                                                )}
                                                <span className="capitalize">
                                                  {cat.pricing_mode?.replace(
                                                    "_",
                                                    " ",
                                                  ) || "Per person"}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        {__(
                                          "No traveler categories available. Please create categories first.",
                                          "yatra",
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {errors.category_discounts && (
                              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                <Info className="w-4 h-4" />
                                {errors.category_discounts}
                              </p>
                            )}

                            {formData.category_discounts.length === 0 ? (
                              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex flex-col items-center space-y-4">
                                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                    <Users className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    <div className="text-lg font-medium mb-2">
                                      {__(
                                        "No traveler categories added yet",
                                        "yatra",
                                      )}
                                    </div>
                                    <div className="text-sm mb-4">
                                      {__(
                                        "Select traveler categories to apply group-specific discounts",
                                        "yatra",
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={addTravelerCategory}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                    {__("Add Your First Category", "yatra")}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {formData.category_discounts.map(
                                  (category, catIdx) => (
                                    <Card
                                      key={catIdx}
                                      className="border border-gray-200 dark:border-gray-700"
                                    >
                                      <CardContent className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                              {__("Traveler Category", "yatra")}{" "}
                                              #{catIdx + 1}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              {__(
                                                "Configure discount ranges for this traveler category.",
                                                "yatra",
                                              )}
                                            </div>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                              removeTravelerCategory(catIdx)
                                            }
                                            disabled={
                                              formData.category_discounts
                                                .length === 1
                                            }
                                            className="flex items-center gap-2"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                            {__("Remove", "yatra")}
                                          </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                              {__(
                                                "Select Traveler Category",
                                                "yatra",
                                              )}{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </label>
                                            <Select
                                              value={
                                                category.traveler_category_id
                                              }
                                              onChange={(e) => {
                                                const selected =
                                                  travelerCategoryOptions.find(
                                                    (opt) =>
                                                      opt.value ===
                                                      e.target.value,
                                                  );
                                                updateTravelerCategory(catIdx, {
                                                  traveler_category_id:
                                                    e.target.value,
                                                  traveler_category_label:
                                                    selected?.label || "",
                                                });
                                              }}
                                              className={
                                                errors[
                                                  `category_discounts_${catIdx}_id`
                                                ]
                                                  ? "border-red-500"
                                                  : ""
                                              }
                                            >
                                              {travelerCategoryOptions.map(
                                                (opt) => (
                                                  <option
                                                    key={opt.value}
                                                    value={opt.value}
                                                  >
                                                    {opt.label}
                                                  </option>
                                                ),
                                              )}
                                            </Select>
                                            {errors[
                                              `category_discounts_${catIdx}_id`
                                            ] && (
                                              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                                <Info className="w-4 h-4" />
                                                {
                                                  errors[
                                                    `category_discounts_${catIdx}_id`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                              {__("Discount Ranges", "yatra")}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              {__(
                                                "Add multiple group size ranges for this category (e.g., 1-10, 10-12, 12-15, 15+).",
                                                "yatra",
                                              )}
                                            </div>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                              addRangeToCategory(catIdx)
                                            }
                                            className="flex items-center gap-2"
                                          >
                                            <Plus className="w-4 h-4" />
                                            {__("Add Range", "yatra")}
                                          </Button>
                                        </div>

                                        {errors[
                                          `category_discounts_${catIdx}_ranges`
                                        ] && (
                                          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                            <Info className="w-4 h-4" />
                                            {
                                              errors[
                                                `category_discounts_${catIdx}_ranges`
                                              ]
                                            }
                                          </p>
                                        )}

                                        {category.ranges.length === 0 ? (
                                          <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
                                            <div className="text-gray-500 dark:text-gray-400">
                                              <div className="text-sm font-medium mb-1">
                                                {__(
                                                  "No discount ranges added yet",
                                                  "yatra",
                                                )}
                                              </div>
                                              <div className="text-xs">
                                                {__(
                                                  'Click "Add Range" to create discount tiers',
                                                  "yatra",
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="space-y-3">
                                            {category.ranges.map(
                                              (range, rIdx) => (
                                                <div
                                                  key={range.id}
                                                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-800"
                                                >
                                                  <div className="flex items-start justify-between gap-3">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                      {__("Range", "yatra")} #
                                                      {rIdx + 1}
                                                    </div>
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() =>
                                                        removeRangeFromCategory(
                                                          catIdx,
                                                          range.id,
                                                        )
                                                      }
                                                      disabled={
                                                        category.ranges
                                                          .length === 1
                                                      }
                                                      className="flex items-center gap-1"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                      {__("Remove", "yatra")}
                                                    </Button>
                                                  </div>

                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                        {__(
                                                          "Minimum Group Size",
                                                          "yatra",
                                                        )}{" "}
                                                        <span className="text-red-500">
                                                          *
                                                        </span>
                                                      </label>
                                                      <Input
                                                        type="number"
                                                        min="1"
                                                        value={
                                                          range.min_group_size
                                                        }
                                                        onChange={(e) =>
                                                          updateRangeInCategory(
                                                            catIdx,
                                                            range.id,
                                                            {
                                                              min_group_size:
                                                                e.target.value,
                                                            },
                                                          )
                                                        }
                                                        placeholder={__(
                                                          "e.g., 10",
                                                          "yatra",
                                                        )}
                                                        className={
                                                          errors[
                                                            `category_discounts_${catIdx}_ranges_${rIdx}_min`
                                                          ]
                                                            ? "border-red-500"
                                                            : ""
                                                        }
                                                      />
                                                      {errors[
                                                        `category_discounts_${catIdx}_ranges_${rIdx}_min`
                                                      ] && (
                                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                                          <Info className="w-4 h-4" />
                                                          {
                                                            errors[
                                                              `category_discounts_${catIdx}_ranges_${rIdx}_min`
                                                            ]
                                                          }
                                                        </p>
                                                      )}
                                                    </div>

                                                    <div>
                                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                        {__(
                                                          "Maximum Group Size",
                                                          "yatra",
                                                        )}
                                                      </label>
                                                      <Input
                                                        type="number"
                                                        min={
                                                          range.min_group_size
                                                            ? parseInt(
                                                                range.min_group_size,
                                                                10,
                                                              ) + 1
                                                            : 2
                                                        }
                                                        value={
                                                          range.max_group_size
                                                        }
                                                        onChange={(e) =>
                                                          updateRangeInCategory(
                                                            catIdx,
                                                            range.id,
                                                            {
                                                              max_group_size:
                                                                e.target.value,
                                                            },
                                                          )
                                                        }
                                                        placeholder={__(
                                                          "Leave empty for unlimited",
                                                          "yatra",
                                                        )}
                                                        className={
                                                          errors[
                                                            `category_discounts_${catIdx}_ranges_${rIdx}_max`
                                                          ]
                                                            ? "border-red-500"
                                                            : ""
                                                        }
                                                      />
                                                      {errors[
                                                        `category_discounts_${catIdx}_ranges_${rIdx}_max`
                                                      ] && (
                                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                                          <Info className="w-4 h-4" />
                                                          {
                                                            errors[
                                                              `category_discounts_${catIdx}_ranges_${rIdx}_max`
                                                            ]
                                                          }
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>

                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                        {__(
                                                          "Discount Type",
                                                          "yatra",
                                                        )}{" "}
                                                        <span className="text-red-500">
                                                          *
                                                        </span>
                                                      </label>
                                                      <Select
                                                        value={
                                                          range.discount_type ||
                                                          "percentage"
                                                        }
                                                        onChange={(e) =>
                                                          updateRangeInCategory(
                                                            catIdx,
                                                            range.id,
                                                            {
                                                              discount_type: e
                                                                .target
                                                                .value as
                                                                | "percentage"
                                                                | "fixed",
                                                            },
                                                          )
                                                        }
                                                        className={
                                                          errors[
                                                            `category_discounts_${catIdx}_ranges_${rIdx}_type`
                                                          ]
                                                            ? "border-red-500"
                                                            : ""
                                                        }
                                                      >
                                                        <option value="percentage">
                                                          {__(
                                                            "Percentage",
                                                            "yatra",
                                                          )}
                                                        </option>
                                                        <option value="fixed">
                                                          {__(
                                                            "Fixed Amount",
                                                            "yatra",
                                                          )}
                                                        </option>
                                                      </Select>
                                                      {errors[
                                                        `category_discounts_${catIdx}_ranges_${rIdx}_type`
                                                      ] && (
                                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                                          <Info className="w-4 h-4" />
                                                          {
                                                            errors[
                                                              `category_discounts_${catIdx}_ranges_${rIdx}_type`
                                                            ]
                                                          }
                                                        </p>
                                                      )}
                                                    </div>

                                                    <div>
                                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                        {__(
                                                          "Discount Amount",
                                                          "yatra",
                                                        )}{" "}
                                                        <span className="text-red-500">
                                                          *
                                                        </span>
                                                      </label>
                                                      <div className="relative">
                                                        {range.discount_type ===
                                                          "fixed" && (
                                                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                                            $
                                                          </span>
                                                        )}
                                                        <Input
                                                          type="number"
                                                          min="0"
                                                          max={
                                                            range.discount_type ===
                                                            "percentage"
                                                              ? 100
                                                              : undefined
                                                          }
                                                          step="0.01"
                                                          value={
                                                            range.discount_amount ||
                                                            ""
                                                          }
                                                          onChange={(e) =>
                                                            updateRangeInCategory(
                                                              catIdx,
                                                              range.id,
                                                              {
                                                                discount_amount:
                                                                  e.target
                                                                    .value,
                                                              },
                                                            )
                                                          }
                                                          placeholder={
                                                            range.discount_type ===
                                                            "percentage"
                                                              ? __(
                                                                  "e.g., 10",
                                                                  "yatra",
                                                                )
                                                              : __(
                                                                  "e.g., 50",
                                                                  "yatra",
                                                                )
                                                          }
                                                          className={`${range.discount_type === "fixed" ? "pl-7" : ""} ${errors[`category_discounts_${catIdx}_ranges_${rIdx}_amount`] ? "border-red-500" : ""}`}
                                                        />
                                                        {range.discount_type ===
                                                          "percentage" && (
                                                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                                            %
                                                          </span>
                                                        )}
                                                      </div>
                                                      {errors[
                                                        `category_discounts_${catIdx}_ranges_${rIdx}_amount`
                                                      ] && (
                                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                                          <Info className="w-4 h-4" />
                                                          {
                                                            errors[
                                                              `category_discounts_${catIdx}_ranges_${rIdx}_amount`
                                                            ]
                                                          }
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Status", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={formData.status}
                    onChange={(e) =>
                      handleFieldChange(
                        "status",
                        e.target.value as "draft" | "publish" | "trash",
                      )
                    }
                  >
                    <option value="draft">{__("Draft", "yatra")}</option>
                    <option value="publish">{__("Publish", "yatra")}</option>
                    <option value="trash">{__("Trash", "yatra")}</option>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {__(
                      "Only published coupons can be used by customers.",
                      "yatra",
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* Applicable To */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Applicable To", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ApplicableTripSelector
                    value={formData.applicable_to}
                    onValueChange={(val) =>
                      handleFieldChange("applicable_to", val)
                    }
                    selectedTripIds={formData.trip_ids}
                    onTripIdsChange={(ids) =>
                      handleFieldChange("trip_ids", ids)
                    }
                    description={__(
                      "Choose whether this discount applies to all trips or specific ones.",
                    )}
                    helperText={__(
                      "Trips shown with ID for quick identification.",
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Actions */}
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {errors.submit && (
                      <div className="p-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                        {errors.submit}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {__("Saving...", "yatra")}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {isEditMode
                              ? __("Update Coupon", "yatra")
                              : __("Create Coupon", "yatra")}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={isSubmitting}
                      >
                        {__("Cancel", "yatra")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </ConditionalRender>

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeDialog
        open={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        moduleName={__("Group Discounts", "yatra")}
        purchaseUrl="https://wpyatra.com/pricing?module=group-discounts"
        moduleDescription={__(
          "Unlock powerful group discount features to automatically apply discounts based on group size and traveler categories.",
          "yatra",
        )}
      />
    </div>
  );
};

export default DiscountForm;
