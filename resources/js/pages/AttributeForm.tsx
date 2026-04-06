/**
 * Attribute Form Page
 * Add/Edit Attribute form with clean, minimal SaaS-style design matching ActivityForm
 */

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Edit2, Plus, Trash2 } from "lucide-react";
import { __ } from "../lib/i18n";
import { useToast } from "../components/ui/toast";
import { generateSlug } from "../lib/slug";
import { apiClient } from "../lib/api-client";
import { ajaxService } from "../lib/api-client";
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
import { Switch } from "../components/ui/switch";
import { IconPicker } from "../components/ui/icon-picker";

type FieldOptionRow = { label: string; value: string };

function parseFieldOptionRows(raw: unknown): FieldOptionRow[] {
  if (Array.isArray(raw)) {
    return raw.map((o: { label?: string; value?: string }) => ({
      label: String(o?.label ?? ""),
      value: String(o?.value ?? ""),
    }));
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) {
        return p.map((o: { label?: string; value?: string }) => ({
          label: String(o?.label ?? ""),
          value: String(o?.value ?? ""),
        }));
      }
    } catch {
      return [];
    }
  }
  return [];
}

/** REST may return the entity at the root or nested under `data`. */
function unwrapAttributePayload(raw: unknown): Record<string, unknown> {
  if (raw == null || typeof raw !== "object") {
    return {};
  }
  const o = raw as Record<string, unknown>;
  if ("id" in o) {
    return o;
  }
  const inner = o.data;
  if (
    inner &&
    typeof inner === "object" &&
    !Array.isArray(inner) &&
    "id" in (inner as object)
  ) {
    return inner as Record<string, unknown>;
  }
  return {};
}

type AttributeStatusUi = "publish" | "draft" | "trash";

function normalizeAttributeStatusForForm(raw: unknown): AttributeStatusUi {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (s === "publish" || s === "draft" || s === "trash") {
    return s;
  }
  return "publish";
}

interface AttributeFormData {
  name: string;
  slug: string;
  description: string;
  icon: {
    type: "icon" | "image";
    value: string;
  } | null;
  field_type: string;
  field_option_rows: FieldOptionRow[];
  default_value: string;
  placeholder: string;
  required: boolean;
  validation_rules: string;
  display_order: number;
  show_on_frontend: boolean;
  show_in_filters: boolean;
  filter_type: string;
  searchable: boolean;
  status: string;
}

const AttributeForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<AttributeFormData>({
    name: "",
    slug: "",
    description: "",
    icon: null,
    field_type: "text_field",
    field_option_rows: [],
    default_value: "",
    placeholder: "",
    required: false,
    validation_rules: "",
    display_order: 0,
    show_on_frontend: true,
    show_in_filters: false,
    filter_type: "dropdown",
    searchable: false,
    status: "publish",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugEditable, setIsSlugEditable] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") || "create";
  }, []);

  const attributeId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }, []);

  const isEditMode = action === "edit" && attributeId;

  const fieldTypeOptions = [
    { value: "text_field", label: "Text Field" },
    { value: "textarea", label: "Textarea" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
    { value: "url", label: "URL" },
    { value: "date", label: "Date" },
    { value: "time", label: "Time" },
    { value: "color", label: "Color" },
    { value: "select", label: "Select Dropdown" },
    { value: "radio", label: "Radio Buttons" },
    { value: "checkbox", label: "Checkbox" },
    { value: "file", label: "File Upload" },
  ];

  // Handle field changes
  const handleFieldChange = (field: keyof AttributeFormData, value: any) => {
    if (field === "field_type") {
      setFormData((prev) => {
        const nextNeeds =
          value === "select" || value === "radio" || value === "checkbox";
        const wasNeeds =
          prev.field_type === "select" ||
          prev.field_type === "radio" ||
          prev.field_type === "checkbox";
        let rows = prev.field_option_rows;
        if (nextNeeds && !wasNeeds && rows.length === 0) {
          rows = [{ label: "", value: "" }];
        }
        return { ...prev, field_type: value, field_option_rows: rows };
      });
      if (errors.field_type) {
        setErrors((prev) => ({ ...prev, field_type: "" }));
      }
      if (errors.field_options) {
        setErrors((prev) => ({ ...prev, field_options: "" }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from name only in ADD mode (not in EDIT mode)
    // In EDIT mode, slug only changes if user explicitly edits it
    if (field === "name" && !isEditMode && !isSlugEditable) {
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: generateSlug(value),
      }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateOptionRow = (
    index: number,
    key: "label" | "value",
    val: string,
  ) => {
    setFormData((prev) => {
      const next = [...prev.field_option_rows];
      next[index] = { ...next[index], [key]: val };
      return { ...prev, field_option_rows: next };
    });
    if (errors.field_options) {
      setErrors((prev) => ({ ...prev, field_options: "" }));
    }
  };

  const addOptionRow = () => {
    setFormData((prev) => ({
      ...prev,
      field_option_rows: [
        ...prev.field_option_rows,
        { label: "", value: "" },
      ],
    }));
  };

  const removeOptionRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      field_option_rows: prev.field_option_rows.filter((_, i) => i !== index),
    }));
  };

  // Generate unique slug with numeric suffix if needed
  const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
    try {
      // Check if base slug exists
      const response = await apiClient.get(
        `/attributes/check-slug?slug=${encodeURIComponent(baseSlug)}${isEditMode && attributeId ? `&exclude_id=${attributeId}` : ""}`,
      );

      if (response.data.exists && response.data.suggested_slug) {
        return response.data.suggested_slug;
      }

      return baseSlug;
    } catch (error) {
      // If API fails, fallback to client-side generation
      let slug = baseSlug;
      let counter = 1;

      while (counter <= 100) {
        // Prevent infinite loop
        const testSlug = counter === 1 ? baseSlug : `${baseSlug}-${counter}`;

        // For now, just return the testSlug (in a real implementation, you'd check against existing slugs)
        // This is a fallback when the API is unavailable
        if (counter === 1) {
          return testSlug; // Return base slug on first attempt
        }

        slug = testSlug;
        counter++;
      }

      return slug;
    }
  };

  // Toggle slug editability
  const toggleSlugEdit = () => {
    if (isSlugEditable) {
      // If disabling edit, regenerate slug from name
      const newSlug = generateSlug(formData.name);
      setFormData((prev) => ({ ...prev, slug: newSlug }));
    }
    setIsSlugEditable(!isSlugEditable);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = __("Name is required", "yatra");
    }

    if (!formData.field_type) {
      newErrors.field_type = __("Field type is required", "yatra");
    }

    // Validate field options for select/radio/checkbox (repeater rows)
    if (
      formData.field_type === "select" ||
      formData.field_type === "radio" ||
      formData.field_type === "checkbox"
    ) {
      const built = formData.field_option_rows
        .map((r) => {
          const label = r.label.trim();
          const value =
            r.value.trim() || (label ? generateSlug(label) : "");
          return { label, value };
        })
        .filter((r) => r.label !== "" && r.value !== "");

      if (built.length === 0) {
        newErrors.field_options = __(
          "Add at least one option with a label (value can be left blank to auto-generate from the label).",
          "yatra",
        );
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Load attribute data for editing
  const {
    data: attribute,
    isLoading: isLoadingAttribute,
    error: attributeError,
  } = useQuery({
    queryKey: ["attribute", attributeId],
    queryFn: async () => {
      if (!attributeId) return null;
      const response = await apiClient.get(`/attributes/${attributeId}`);
      return response;
    },
    enabled: Boolean(isEditMode),
    retry: 2,
    retryDelay: 1000,
  });

  // Direct database query to bypass caching issues (fallback only)
  const fetchDirectDatabaseValues = async (attributeId: number) => {
    try {
      const data = await ajaxService.post("yatra_get_attribute_direct", {
        attribute_id: attributeId,
        nonce: window.yatraAdmin?.nonce || "",
      });
      if (data?.success && data?.data) {
        return data.data;
      }
    } catch (error) {
      console.warn("Direct database query failed", { error, attributeId });
    }
    return null;
  };

  useEffect(() => {
    if (!attribute || !attributeId) {
      return;
    }
    const fromRest = unwrapAttributePayload(attribute);

    fetchDirectDatabaseValues(Number(attributeId) || 0).then((directData) => {
      const direct =
        directData && typeof directData === "object"
          ? (directData as Record<string, unknown>)
          : {};
      const finalAttribute = { ...fromRest, ...direct };

      const convertedData: AttributeFormData = {
        name: String(finalAttribute.name ?? ""),
        slug: String(finalAttribute.slug ?? ""),
        description: String(finalAttribute.description ?? ""),
        icon: (() => {
          const ic = finalAttribute.icon;
          if (!ic || typeof ic !== "object" || Array.isArray(ic)) {
            return null;
          }
          const io = ic as { type?: string; value?: string };
          return {
            type: io.type === "image" ? "image" : "icon",
            value: String(io.value ?? ""),
          };
        })(),
        field_type: String(finalAttribute.field_type ?? "text_field"),
        field_option_rows: (() => {
          const rows = parseFieldOptionRows(finalAttribute.field_options);
          return rows.length > 0
            ? rows
            : ["select", "radio", "checkbox"].includes(
                  String(finalAttribute.field_type ?? ""),
                )
              ? [{ label: "", value: "" }]
              : [];
        })(),
        default_value: String(finalAttribute.default_value ?? ""),
        placeholder: String(finalAttribute.placeholder ?? ""),
        required:
          finalAttribute.required === "1" ||
          finalAttribute.required === 1 ||
          finalAttribute.required === true,
        validation_rules: String(finalAttribute.validation_rules ?? ""),
        display_order: Number(finalAttribute.display_order) || 0,
        show_on_frontend:
          finalAttribute.show_on_frontend === "1" ||
          finalAttribute.show_on_frontend === 1 ||
          finalAttribute.show_on_frontend === true,
        show_in_filters:
          finalAttribute.show_in_filters === "1" ||
          finalAttribute.show_in_filters === 1 ||
          finalAttribute.show_in_filters === true,
        filter_type: String(finalAttribute.filter_type ?? "dropdown"),
        searchable:
          finalAttribute.searchable === "1" ||
          finalAttribute.searchable === 1 ||
          finalAttribute.searchable === true,
        status: normalizeAttributeStatusForForm(finalAttribute.status),
      };

      setFormData(convertedData);
    });
  }, [attribute, attributeId]);

  // Handle attribute loading error
  useEffect(() => {
    if (attributeError) {
      showToast(__("Failed to load attribute data", "yatra"), "error");
    }
  }, [attributeError, showToast]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: AttributeFormData) => {
      let slug = data.slug.trim();

      // For new attributes, ensure slug is unique
      if (!isEditMode) {
        slug = await generateUniqueSlug(slug);
      }

      const needsOptionRows =
        data.field_type === "select" ||
        data.field_type === "radio" ||
        data.field_type === "checkbox";

      const fieldOptionsPayload = needsOptionRows
        ? data.field_option_rows
            .map((r) => {
              const label = r.label.trim();
              const value =
                r.value.trim() || (label ? generateSlug(label) : "");
              return { label, value };
            })
            .filter((r) => r.label !== "" && r.value !== "")
        : [];

      const payload: any = {
        name: data.name.trim(),
        slug: slug,
        description: data.description.trim(),
        icon: data.icon,
        field_type: data.field_type,
        default_value: data.default_value.trim(),
        placeholder: data.placeholder.trim(),
        required: Boolean(data.required),
        validation_rules: data.validation_rules.trim(),
        display_order: Number(data.display_order),
        show_on_frontend: Boolean(data.show_on_frontend),
        show_in_filters: Boolean(data.show_in_filters),
        filter_type: data.filter_type,
        searchable: Boolean(data.searchable),
        status: normalizeAttributeStatusForForm(data.status),
      };

      if (needsOptionRows) {
        payload.field_options = fieldOptionsPayload;
      }

      // Debug: Log the payload being sent

      // If slug was manually edited, add flag to preserve it
      if (isEditMode && isSlugEditable) {
        payload.preserve_slug = true;
      }

      try {
        if (isEditMode && attributeId) {
          const response = await apiClient.put(
            `/attributes/${attributeId}`,
            payload,
          );

          return response;
        } else {
          const response = await apiClient.post("/attributes", payload);

          return response;
        }
      } catch (error: any) {
        // Handle specific API errors
        throw error;
      }
    },
    onSuccess: (response) => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      queryClient.invalidateQueries({ queryKey: ["attributes-stats"] });
      if (attributeId) {
        queryClient.invalidateQueries({ queryKey: ["attribute", attributeId] });
      }
      showToast(
        isEditMode
          ? __("Attribute updated successfully", "yatra")
          : __("Attribute created successfully", "yatra"),
        "success",
      );

      // Redirect logic
      if (!isEditMode) {
        // Redirect to edit page after creation

        // Try different possible response structures
        const newId =
          response?.data?.id || response?.id || response?.data?.data?.id;

        if (newId) {
          setTimeout(() => {
            window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=attributes&action=edit&id=${newId}`;
          }, 1000);
        } else {
          console.error(
            "AttributeForm - Could not extract ID from response for redirect",
          );
        }
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message ||
        __("An error occurred while saving the attribute", "yatra");
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
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=attributes`;
  };

  // Show loading skeleton
  if (isLoadingAttribute) {
    return (
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-3">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if attribute loading failed
  if (attributeError && isEditMode) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__("Error Loading Attribute", "yatra")}
          description={__(
            "Unable to load attribute data. Please try again.",
            "yatra",
          )}
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
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              {__(
                "Failed to load attribute data. The attribute may not exist or there might be a server error.",
                "yatra",
              )}
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              {__("Try Again", "yatra")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={
          isEditMode
            ? __("Edit Attribute", "yatra")
            : __("Add New Attribute", "yatra")
        }
        description={
          isEditMode
            ? __("Update attribute information", "yatra")
            : __("Create a new trip attribute", "yatra")
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
                      value={formData.name}
                      onChange={(e) =>
                        handleFieldChange("name", e.target.value)
                      }
                      placeholder={__("Enter attribute name", "yatra")}
                      className={errors.name ? "border-red-500" : ""}
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
                      {__("Slug", "yatra")}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) =>
                          handleFieldChange("slug", e.target.value)
                        }
                        placeholder={__("attribute-slug", "yatra")}
                        disabled={!isSlugEditable}
                        className={`flex-1 ${errors.slug ? "border-red-500" : ""}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleSlugEdit}
                        className="px-3 py-2"
                      >
                        {isSlugEditable ? (
                          <Save className="w-4 h-4" />
                        ) : (
                          <Edit2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {isSlugEditable ? (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {__(
                          "Click the save icon to preserve your custom slug.",
                          "yatra",
                        )}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {__(
                          "Auto-generated from name. Click edit icon to customize.",
                          "yatra",
                        )}
                      </p>
                    )}
                  </div>

                  {/* Description */}
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
                      placeholder={__("Enter attribute description", "yatra")}
                      rows={6}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Field Configuration */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Field Configuration", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Field Type */}
                    <div>
                      <label
                        htmlFor="field_type"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Field Type", "yatra")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Select
                        id="field_type"
                        value={formData.field_type}
                        onChange={(e) =>
                          handleFieldChange("field_type", e.target.value)
                        }
                        className={errors.field_type ? "border-red-500" : ""}
                      >
                        {fieldTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                      {errors.field_type && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.field_type}
                        </p>
                      )}
                    </div>

                    {/* Display Order */}
                    <div>
                      <label
                        htmlFor="display_order"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Display Order", "yatra")}
                      </label>
                      <Input
                        id="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) =>
                          handleFieldChange(
                            "display_order",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Field Options for select/radio/checkbox — repeater (label / value) */}
                  {(formData.field_type === "select" ||
                    formData.field_type === "radio" ||
                    formData.field_type === "checkbox") && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {__("Field Options", "yatra")}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1 h-8"
                          onClick={addOptionRow}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {__("Add option", "yatra")}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {__(
                          "Each row is one choice. Leave value empty to auto-generate a slug from the label.",
                          "yatra",
                        )}
                      </p>
                      <div
                        className={`space-y-2 rounded-md border p-3 ${errors.field_options ? "border-red-500" : "border-gray-200 dark:border-gray-600"}`}
                      >
                        {(formData.field_option_rows.length > 0
                          ? formData.field_option_rows
                          : [{ label: "", value: "" }]
                        ).map((row, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row gap-2 sm:items-end"
                          >
                            <div className="flex-1 min-w-0">
                              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                {__("Label", "yatra")}
                              </label>
                              <Input
                                value={row.label}
                                onChange={(e) => {
                                  if (formData.field_option_rows.length === 0) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      field_option_rows: [
                                        {
                                          label: e.target.value,
                                          value: "",
                                        },
                                      ],
                                    }));
                                  } else {
                                    updateOptionRow(index, "label", e.target.value);
                                  }
                                }}
                                placeholder={__(
                                  "Display name",
                                  "yatra",
                                )}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                {__("Value", "yatra")}
                              </label>
                              <Input
                                value={row.value}
                                onChange={(e) => {
                                  if (formData.field_option_rows.length === 0) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      field_option_rows: [
                                        {
                                          label: "",
                                          value: e.target.value,
                                        },
                                      ],
                                    }));
                                  } else {
                                    updateOptionRow(index, "value", e.target.value);
                                  }
                                }}
                                placeholder={__(
                                  "Stored value (optional)",
                                  "yatra",
                                )}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 shrink-0"
                              onClick={() => removeOptionRow(index)}
                              disabled={formData.field_option_rows.length <= 1}
                              aria-label={__("Remove option", "yatra")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      {errors.field_options && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.field_options}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Default Value */}
                  <div>
                    <label
                      htmlFor="default_value"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Default Value", "yatra")}
                    </label>
                    <Input
                      id="default_value"
                      value={formData.default_value}
                      onChange={(e) =>
                        handleFieldChange("default_value", e.target.value)
                      }
                      placeholder={__("Default value for the field", "yatra")}
                    />
                  </div>

                  {/* Placeholder */}
                  <div>
                    <label
                      htmlFor="placeholder"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Placeholder", "yatra")}
                    </label>
                    <Input
                      id="placeholder"
                      value={formData.placeholder}
                      onChange={(e) =>
                        handleFieldChange("placeholder", e.target.value)
                      }
                      placeholder={__(
                        "Placeholder text for input field",
                        "yatra",
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
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
                    >
                      <option value="draft">{__("Draft", "yatra")}</option>
                      <option value="publish">{__("Publish", "yatra")}</option>
                      <option value="trash">{__("Trash", "yatra")}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Field Options */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Field Options", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="show_on_frontend"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {__("Show on Frontend", "yatra")}
                    </label>
                    <Switch
                      checked={formData.show_on_frontend}
                      onCheckedChange={(checked) =>
                        handleFieldChange("show_on_frontend", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="show_in_filters"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {__("Show in Filters", "yatra")}
                    </label>
                    <Switch
                      checked={formData.show_in_filters}
                      onCheckedChange={(checked) =>
                        handleFieldChange("show_in_filters", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="searchable"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {__("Searchable", "yatra")}
                    </label>
                    <Switch
                      checked={formData.searchable}
                      onCheckedChange={(checked) =>
                        handleFieldChange("searchable", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="required"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {__("Required Field", "yatra")}
                    </label>
                    <Switch
                      checked={formData.required}
                      onCheckedChange={(checked) =>
                        handleFieldChange("required", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Icon/Image Picker */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Attribute Icon", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <IconPicker
                    value={formData.icon}
                    onChange={(value) => handleFieldChange("icon", value)}
                    label={__("Icon or Image", "yatra")}
                    helpText={__(
                      "Select an icon from the library or upload a custom image for this attribute.",
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
                              ? __("Update Attribute", "yatra")
                              : __("Create Attribute", "yatra")}
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

export default AttributeForm;
