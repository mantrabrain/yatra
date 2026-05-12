/**
 * Destination Form Page
 * Add/Edit Destination form with clean, minimal SaaS-style design
 */

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Edit2, X, Eye } from "lucide-react";
import { __ } from "../lib/i18n";
import { usePermissions } from "../hooks/usePermissions";
import { useToast } from "../components/ui/toast";
import { fetchSettings } from "../api/settings-api";
import { apiClient } from "../lib/api-client";
import { generateSlug } from "../lib/slug";
import { buildYatraSinglePreviewUrl } from "../lib/frontend-permalink-urls";
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
import { IconPicker, IconPickerValue } from "../components/ui/icon-picker";
import { RichTextEditor } from "../components/ui/rich-text-editor";
import {
  ClassificationLandingPageField,
  fetchPublishedPagePermalink,
  parseLandingPageIdFromMetadata,
} from "../components/classifications/ClassificationLandingPageField";

interface DestinationFormData {
  name: string;
  slug: string;
  description: string;
  icon: {
    type: "icon" | "image";
    value: string;
  } | null;
  status: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  landing_page_id: number | null;
}

const DestinationForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<DestinationFormData>({
    name: "",
    slug: "",
    description: "",
    icon: null,
    status: "publish",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    landing_page_id: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugEditable, setIsSlugEditable] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") || "create";
  }, []);

  const destinationId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") ? parseInt(params.get("id") || "0") : null;
  }, []);

  const isEditMode = action === "edit" && destinationId !== null;

  // Fetch destination data if editing
  const { data: destinationData, isLoading: isLoadingDestination } = useQuery({
    queryKey: ["destination", destinationId],
    queryFn: async () => {
      if (!destinationId) return null;
      try {
        const response = await apiClient.get(`/destinations/${destinationId}`);
        return response;
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to load destination", "yatra"),
          "error",
        );
        throw error;
      }
    },
    enabled: isEditMode && can("yatra_view_trips"),
  });

  // Fetch settings for permalink handling
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        const response = await fetchSettings();
        return response?.data || response;
      } catch (error) {
        return {};
      }
    },
  });

  // Load destination data into form when editing
  useEffect(() => {
    if (destinationData && isEditMode) {
      setFormData({
        name: destinationData.name || "",
        slug: destinationData.slug || "",
        description: destinationData.description || "",
        icon: (destinationData.icon as IconPickerValue) || null,
        status: destinationData.status || "draft",
        seo_title: destinationData.metadata?.seo_title || "",
        seo_description: destinationData.metadata?.seo_description || "",
        seo_keywords: destinationData.metadata?.seo_keywords || "",
        landing_page_id: parseLandingPageIdFromMetadata(
          destinationData.metadata as { landing_page_id?: unknown },
        ),
      });
    }
  }, [destinationData, isEditMode]);

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

  const handleFieldChange = (
    field: keyof DestinationFormData,
    value: string | IconPickerValue | null,
  ) => {
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
    } else if (!/^[\p{L}\p{N}-]+$/u.test(formData.slug)) {
      newErrors.slug = __(
        "Slug can only contain letters, numbers, and hyphens",
        "yatra",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: DestinationFormData) => {
      const payload: any = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        icon: data.icon,
        status: data.status,
        seo_title: data.seo_title.trim(),
        seo_description: data.seo_description.trim(),
        seo_keywords: data.seo_keywords.trim(),
        landing_page_id: data.landing_page_id ?? null,
      };

      // If slug was manually edited, add flag to preserve it
      if (isEditMode && isSlugEditable) {
        payload.preserve_slug = true;
      }

      if (isEditMode && destinationId) {
        return await apiClient.put(`/destinations/${destinationId}`, payload);
      } else {
        return await apiClient.post("/destinations", payload);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      queryClient.invalidateQueries({
        queryKey: ["destination", destinationId],
      });
      showToast(
        isEditMode
          ? __("Destination updated successfully", "yatra")
          : __("Destination created successfully", "yatra"),
        "success",
      );
      setIsSubmitting(false);

      if (!isEditMode) {
        const newId = response?.id;
        if (newId) {
          window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=destinations&action=edit&id=${newId}`;
        } else {
          // Fallback to list if ID missing
          window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=destinations`;
        }
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message ||
        __("An error occurred while saving the destination", "yatra");
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
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=destinations`;
  };

  if (isEditMode && isLoadingDestination) {
    return (
      <div className="space-y-3">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
        </div>

        {/* Form Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Fields */}
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* Name field */}
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                {/* Slug field */}
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                {/* Description field */}
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
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
            ? __("Edit Destination", "yatra")
            : __("Add New Destination", "yatra")
        }
        description={
          isEditMode
            ? __("Update destination information", "yatra")
            : __("Create a new travel destination", "yatra")
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__("Back", "yatra")}
            </Button>
            {formData.slug && (
              <Button
                variant="outline"
                onClick={async () => {
                  if (
                    formData.landing_page_id &&
                    window.yatraAdmin?.customLandingPagesModuleEnabled
                  ) {
                    const link = await fetchPublishedPagePermalink(
                      formData.landing_page_id,
                    );
                    if (link) {
                      window.open(link, "_blank", "noopener,noreferrer");
                      return;
                    }
                  }
                  const targetUrl = buildYatraSinglePreviewUrl({
                    entity: "destination",
                    slug: formData.slug || "",
                    bases: settings as Record<string, unknown> | null,
                  });
                  window.open(targetUrl, "_blank", "noopener,noreferrer");
                }}
                className="flex items-center gap-2"
                title={__("Preview destination in new tab", "yatra")}
              >
                <Eye className="w-4 h-4" />
                {__("Preview", "yatra")}
              </Button>
            )}
          </div>
        }
      />

      <ConditionalRender capability="yatra_edit_trips">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Main Form Fields */}
            <div className="lg:col-span-2 space-y-3">
              {/* Basic Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Basic Information", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Name", "yatra")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder={__("Enter destination name", "yatra")}
                      className={errors.name ? "border-red-500" : ""}
                      required
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  {/* Slug */}
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
                        placeholder={__("destination-slug", "yatra")}
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

                  {/* Description */}
                  <RichTextEditor
                    label={__("Description", "yatra")}
                    value={formData.description || ""}
                    onChange={(value) =>
                      handleFieldChange("description", value)
                    }
                    placeholder={__(
                      "Write a rich description (supports formatting, lists, links...)",
                      "yatra",
                    )}
                    helperText={__(
                      "Use formatting, bullet lists, and links to create a compelling description. HTML is supported.",
                      "yatra",
                    )}
                    minHeight={360}
                    maxHeight={720}
                  />
                </CardContent>
              </Card>

              <ClassificationLandingPageField
                selectId="yatra-destination-landing-page"
                value={formData.landing_page_id}
                onChange={(id) =>
                  setFormData((prev) => ({ ...prev, landing_page_id: id }))
                }
              />
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
                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Status", "yatra")}
                    </label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        handleFieldChange("status", e.target.value)
                      }
                      className="w-full h-10"
                    >
                      <option value="draft">{__("Draft", "yatra")}</option>
                      <option value="publish">{__("Publish", "yatra")}</option>
                      <option value="trash">{__("Trash", "yatra")}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* SEO Settings */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("SEO Settings", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label
                      htmlFor="seo_title"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      {__("Meta Title", "yatra")}
                    </label>
                    <Input
                      id="seo_title"
                      type="text"
                      value={formData.seo_title}
                      onChange={(e) =>
                        handleFieldChange("seo_title", e.target.value)
                      }
                      placeholder={__(
                        "e.g., {name} Destinations | Your Travel Agency",
                        "yatra",
                      )}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__(
                        "Custom title for search engines. Use {name} as placeholder.",
                        "yatra",
                      )}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="seo_description"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      {__("Meta Description", "yatra")}
                    </label>
                    <textarea
                      id="seo_description"
                      value={formData.seo_description}
                      onChange={(e) =>
                        handleFieldChange("seo_description", e.target.value)
                      }
                      placeholder={__(
                        "e.g., Discover amazing destinations in {name}. Plan your perfect trip today!",
                        "yatra",
                      )}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__(
                        "Description for search engines (150-160 characters). Use {name} as placeholder.",
                        "yatra",
                      )}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="seo_keywords"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      {__("Meta Keywords", "yatra")}
                    </label>
                    <Input
                      id="seo_keywords"
                      type="text"
                      value={formData.seo_keywords}
                      onChange={(e) =>
                        handleFieldChange("seo_keywords", e.target.value)
                      }
                      placeholder={__(
                        "e.g., destinations, travel, {name}, tourism, trips",
                        "yatra",
                      )}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__(
                        "Comma-separated keywords. Use {name} as placeholder.",
                        "yatra",
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Icon/Image Picker */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Destination Icon or Image", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <IconPicker
                    value={formData.icon}
                    onChange={(value) => handleFieldChange("icon", value)}
                    label={__("Select Icon or Upload Image", "yatra")}
                    helpText={__(
                      "Choose a library icon or upload a custom image to visually represent this destination.",
                      "yatra",
                    )}
                    allowImageUpload={true}
                    allowIconSelection={true}
                    size="md"
                  />
                </CardContent>
              </Card>

              {/* Submit Actions */}
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
                              ? __("Update Destination", "yatra")
                              : __("Create Destination", "yatra")}
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

export default DestinationForm;
