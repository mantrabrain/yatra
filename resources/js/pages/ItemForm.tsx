/**
 * Item Form Page (Item Subtype)
 * Add/Edit Item form
 */

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Edit2, X } from "lucide-react";
import { __ } from "../lib/i18n";
import { usePermissions } from "../hooks/usePermissions";
import { useToast } from "../components/ui/toast";
import { apiClient } from "../lib/api-client";
import { generateSlug } from "../lib/slug";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { SearchableSelect } from "../components/ui/searchable-select";
import { PageHeader } from "../components/common/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ConditionalRender } from "../components/ui/conditional-render";

interface ItemFormData {
  name: string;
  slug: string;
  description: string;
  type_id: string;
  status: string;
}

const ItemForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<ItemFormData>({
    name: "",
    slug: "",
    description: "",
    type_id: "",
    status: "publish",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugEditable, setIsSlugEditable] = useState(false);

  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") || "create";
  }, []);

  const itemId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") ? parseInt(params.get("id") || "0") : null;
  }, []);

  const isEditMode = action === "edit" && itemId !== null;

  // Fetch item types - only published ones are usable
  const { data: typesData } = useQuery({
    queryKey: ["item-types-published"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/item-types", {
          params: {
            per_page: 100,
            status: "publish", // Only get published item types
          },
        });
        return response.data || [];
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to load item types", "yatra"),
          "error",
        );
        return [];
      }
    },
    enabled: can("yatra_view_trips"),
  });

  const { data: itemData, isLoading: isLoadingItem } = useQuery({
    queryKey: ["item", itemId],
    queryFn: async () => {
      if (!itemId) return null;
      try {
        const response = await apiClient.get(`/items/${itemId}`);
        return response;
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to load item", "yatra"),
          "error",
        );
        throw error;
      }
    },
    enabled: isEditMode && can("yatra_view_trips"),
  });

  useEffect(() => {
    if (itemData && isEditMode) {
      setFormData({
        name: itemData.name || "",
        slug: itemData.slug || "",
        description: itemData.description || "",
        type_id: itemData.type_id?.toString() || "",
        status: itemData.status || "publish",
      });
    }
  }, [itemData, isEditMode]);

  const handleNameChange = (value: string) => {
    // Auto-generate slug from name only in ADD mode (not in EDIT mode)
    // In EDIT mode, slug only changes if user explicitly edits it
    if (!isEditMode && !isSlugEditable) {
      const newSlug = generateSlug(value);
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: newSlug,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        name: value,
      }));
    }
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const handleSlugChange = (value: string) => {
    // Only allow manual slug editing if edit mode is enabled
    if (isSlugEditable) {
      setFormData((prev) => ({ ...prev, slug: value }));
      if (errors.slug) {
        setErrors((prev) => ({ ...prev, slug: "" }));
      }
    }
  };

  const handleToggleSlugEdit = () => {
    if (isSlugEditable) {
      // If disabling edit, regenerate slug from name
      const newSlug = generateSlug(formData.name);
      setFormData((prev) => ({ ...prev, slug: newSlug }));
    }
    setIsSlugEditable(!isSlugEditable);
  };

  const handleFieldChange = (field: keyof ItemFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = __("Name is required", "yatra");
    }

    if (!formData.slug.trim()) {
      newErrors.slug = __("Slug is required", "yatra");
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = __(
        "Slug can only contain lowercase letters, numbers, and hyphens",
        "yatra",
      );
    }

    if (!formData.type_id) {
      newErrors.type_id = __("Item type is required", "yatra");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      const payload: any = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        type_id: parseInt(data.type_id),
        status: data.status,
      };

      // If slug was manually edited, add flag to preserve it
      if (isEditMode && isSlugEditable) {
        payload.preserve_slug = true;
      }

      if (isEditMode && itemId) {
        return await apiClient.put(`/items/${itemId}`, payload);
      } else {
        return await apiClient.post("/items", payload);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["item", itemId] });
      showToast(
        isEditMode
          ? __("Item updated successfully", "yatra")
          : __("Item created successfully", "yatra"),
        "success",
      );

      // Handle redirect based on backend response
      if (response?.redirect) {
        setTimeout(() => {
          window.location.href = response.redirect_to;
        }, 1000);
      } else if (response?.stay_on_page) {
        // Stay on current page for updates
        setIsSubmitting(false);
      } else {
        // Default fallback - redirect to items list
        setTimeout(() => {
          window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=items`;
        }, 1000);
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message ||
        __("An error occurred while saving the item", "yatra");
      showToast(errorMessage, "error");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast(__("Please fix the form errors", "yatra"), "warning");
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=items`;
  };

  if (isEditMode && isLoadingItem) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          {__("Loading...", "yatra")}
        </span>
      </div>
    );
  }

  const types = typesData || [];

  return (
    <div className="space-y-3">
      <PageHeader
        title={
          isEditMode ? __("Edit Item", "yatra") : __("Add New Item", "yatra")
        }
        description={
          isEditMode
            ? __("Update item information", "yatra")
            : __(
                "Create a specific item under an item type. Examples: Hiking (under Activity), Lunch (under Meal).",
                "yatra",
              )
        }
        actions={
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {__("Back", "yatra")}
          </Button>
        }
      />

      <ConditionalRender capability="yatra_edit_trips">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Basic Information", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label
                      htmlFor="type_id"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Item Type", "yatra")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      value={formData.type_id}
                      onChange={(value) => handleFieldChange("type_id", value)}
                      options={types.map((type: any) => ({
                        value: type.id.toString(),
                        label: type.name,
                        icon: type.icon,
                      }))}
                      placeholder={__("Select a type...", "yatra")}
                      searchPlaceholder={__("Search item types...", "yatra")}
                      className={errors.type_id ? "border-red-500" : ""}
                      error={!!errors.type_id}
                    />
                    {errors.type_id && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.type_id}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Item Name", "yatra")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder={__("e.g., Hiking", "yatra")}
                      className={errors.name ? "border-red-500" : ""}
                      required
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="slug"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Slug", "yatra")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="slug"
                        type="text"
                        value={formData.slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder={__("item-slug", "yatra")}
                        className={`pr-10 ${errors.slug ? "border-red-500" : ""} ${!isSlugEditable ? "bg-gray-50 dark:bg-gray-800 cursor-not-allowed" : ""}`}
                        disabled={!isSlugEditable}
                        required
                      />
                      <button
                        type="button"
                        onClick={handleToggleSlugEdit}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded"
                        aria-label={
                          isSlugEditable
                            ? __("Cancel editing slug", "yatra")
                            : __("Edit slug", "yatra")
                        }
                      >
                        {isSlugEditable ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Edit2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.slug && (
                      <p className="mt-1 text-sm text-red-500">{errors.slug}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {isSlugEditable
                        ? __(
                            "Manually editing slug. Click X to cancel and regenerate from name.",
                            "yatra",
                          )
                        : __(
                            "Auto-generated from name. Click edit icon to customize.",
                            "yatra",
                          )}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Description", "yatra")}
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleFieldChange("description", e.target.value)
                      }
                      placeholder={__("Describe this item...", "yatra")}
                      rows={4}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Status", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Item Status", "yatra")}
                    </label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        handleFieldChange("status", e.target.value)
                      }
                    >
                      <option value="publish">{__("Publish", "yatra")}</option>
                      <option value="draft">{__("Draft", "yatra")}</option>
                      <option value="trash">{__("Trash", "yatra")}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
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
                              ? __("Update Item", "yatra")
                              : __("Create Item", "yatra")}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
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
    </div>
  );
};

export default ItemForm;
