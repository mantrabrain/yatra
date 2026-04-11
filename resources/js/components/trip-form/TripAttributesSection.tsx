/**
 * Trip Attributes Section Component
 * Handles attribute selection and value assignment for trips
 */

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, X, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { __ } from "../../lib/i18n";
import { apiClient } from "../../lib/api-client";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { TimePicker } from "../../components/ui/time-picker";

interface Attribute {
  id: number;
  name: string;
  slug: string;
  field_type: string;
  field_options: string;
  default_value: string;
  placeholder: string;
  required: boolean;
  description?: string;
  validation_rules: string;
  display_order: number;
  show_on_frontend: boolean;
  show_in_filters: boolean;
  filter_type: string;
  searchable: boolean;
  status: string;
}

interface TripAttributesSectionProps {
  formData: any;
  handleFieldChange: (field: "attributes", value: any) => void;
  tripId?: number;
  isEditMode?: boolean;
  tripAttributesData?: any; // Add this prop
  /** False while parent is loading GET /trips/:id/attributes in edit mode; avoids init effect locking empty before data arrives */
  tripAttributesReady?: boolean;
}

function parseAttributeFieldOptions(
  field_options: string | unknown,
): Array<{ label: string; value: string }> {
  if (Array.isArray(field_options)) {
    return field_options
      .filter((o) => o && typeof o === "object")
      .map((o: { label?: string; value?: string }) => ({
        label: String(o?.label ?? ""),
        value: String(o?.value ?? ""),
      }))
      .filter((o) => o.label !== "" || o.value !== "");
  }
  if (typeof field_options === "string" && field_options.trim()) {
    try {
      const p = JSON.parse(field_options) as unknown;
      if (Array.isArray(p)) {
        return p
          .filter((o) => o && typeof o === "object")
          .map((o: { label?: string; value?: string }) => ({
            label: String(o?.label ?? ""),
            value: String(o?.value ?? ""),
          }))
          .filter((o) => o.label !== "" || o.value !== "");
      }
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeAttributeStoredValue(
  fieldType: string,
  raw: unknown,
): string | string[] {
  if (fieldType === "checkbox") {
    if (Array.isArray(raw)) {
      return raw.map((v) => String(v));
    }
    if (typeof raw === "string") {
      const t = raw.trim();
      if (t.startsWith("[")) {
        try {
          const p = JSON.parse(t) as unknown;
          if (Array.isArray(p)) {
            return p.map((v) => String(v));
          }
        } catch {
          /* fall through */
        }
      }
      return t ? [t] : [];
    }
    if (typeof raw === "boolean") {
      return raw ? ["1"] : [];
    }
    return [];
  }
  if (raw === null || raw === undefined) {
    return "";
  }
  return typeof raw === "string" ? raw : String(raw);
}

const TripAttributesSection: React.FC<TripAttributesSectionProps> = ({
  formData,
  handleFieldChange,
  tripId,
  isEditMode = false,
  tripAttributesData = {}, // Add this prop
  tripAttributesReady = true,
}) => {
  const [selectedAttributes, setSelectedAttributes] = useState<number[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<number, any>>(
    {},
  );
  const [showAttributeDropdown, setShowAttributeDropdown] = useState(false);
  const isInitializing = useRef(true);

  // Fetch available attributes
  const { data: attributesData, isLoading: isLoadingAttributes } = useQuery({
    queryKey: ["attributes"],
    queryFn: async () => {
      const response = await apiClient.get("/attributes?status=publish");
      const rawData = response?.data ?? [];
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
          ? rawData.data
          : [];

      // Normalize attribute shape (ids sometimes arrive as strings)
      return list.map((item: any) => ({
        ...item,
        id: Number(item?.id) || 0,
      }));
    },
  });

  // Initialize from formData when component mounts or when trip attributes are loaded
  useEffect(() => {
    // Only run initialization logic, not when user is typing or deleting
    if (!isInitializing.current) return;

    // Edit mode: wait for GET /trips/:id/attributes — otherwise we mark initialized empty and never hydrate when data arrives
    if (isEditMode && tripId && !tripAttributesReady) {
      return;
    }

    // In edit mode, prioritize trip attributes from prop (from main form)
    if (
      isEditMode &&
      tripAttributesData &&
      Object.keys(tripAttributesData).length > 0
    ) {
      const attributeIds = Object.keys(tripAttributesData).map((id) =>
        Number(id),
      );
      setSelectedAttributes(attributeIds);
      setAttributeValues(tripAttributesData);
      // Set initialization to false only after successful initialization
      isInitializing.current = false;
    }
    // Fallback to formData attributes (only for initial load)
    else if (
      formData.attributes &&
      Object.keys(formData.attributes).length > 0 &&
      isInitializing.current
    ) {
      const attributeIds = Object.keys(formData.attributes).map((id) =>
        Number(id),
      );
      setSelectedAttributes(attributeIds);
      setAttributeValues(formData.attributes);
      isInitializing.current = false;
    } else {
      isInitializing.current = false;
    }
  }, [
    tripAttributesData,
    formData.attributes,
    isEditMode,
    tripId,
    tripAttributesReady,
  ]);

  // Add attribute to selected list
  const handleAddAttribute = (attributeId: number) => {
    if (!selectedAttributes.includes(attributeId)) {
      const newSelectedAttributes = [...selectedAttributes, attributeId];
      setSelectedAttributes(newSelectedAttributes);

      // Initialize with default value if not exists
      if (!attributeValues[attributeId]) {
        const newAttributeValues = { ...attributeValues, [attributeId]: "" };
        setAttributeValues(newAttributeValues);
        handleFieldChange("attributes", newAttributeValues);
      }

      setShowAttributeDropdown(false);
    }
  };

  // Remove attribute from selected list
  const handleRemoveAttribute = (attributeId: number) => {
    const newSelectedAttributes = selectedAttributes.filter(
      (id) => id !== attributeId,
    );
    const newAttributeValues = { ...attributeValues };
    delete newAttributeValues[attributeId];

    setSelectedAttributes(newSelectedAttributes);
    setAttributeValues(newAttributeValues);
    handleFieldChange("attributes", newAttributeValues);
  };

  // Handle attribute value change
  const handleAttributeValueChange = (attributeId: number, value: any) => {
    const newAttributeValues = { ...attributeValues, [attributeId]: value };
    setAttributeValues(newAttributeValues);
    handleFieldChange("attributes", newAttributeValues);
  };

  // Render attribute input based on field type
  const renderAttributeInput = (attribute: Attribute) => {
    const raw = attributeValues[attribute.id];
    const value = normalizeAttributeStoredValue(attribute.field_type, raw);

    switch (attribute.field_type) {
      case "text_field":
      case "email":
      case "url":
        return (
          <Input
            type={
              attribute.field_type === "email"
                ? "email"
                : attribute.field_type === "url"
                  ? "url"
                  : "text"
            }
            value={value}
            onChange={(e) =>
              handleAttributeValueChange(attribute.id, e.target.value)
            }
            placeholder={attribute.placeholder || __("Enter value", "yatra")}
            className="mt-2"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) =>
              handleAttributeValueChange(attribute.id, e.target.value)
            }
            placeholder={attribute.placeholder || __("Enter number", "yatra")}
            className="mt-2"
          />
        );

      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) =>
              handleAttributeValueChange(attribute.id, e.target.value)
            }
            placeholder={attribute.placeholder || __("Enter text", "yatra")}
            rows={3}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none mt-2"
          />
        );

      case "select": {
        const options = parseAttributeFieldOptions(attribute.field_options);
        const strVal = typeof value === "string" ? value : "";
        if (options.length === 0) {
          return (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-500">
              {__(
                "This attribute has no options configured. Edit the attribute to add choices.",
                "yatra",
              )}
            </p>
          );
        }
        return (
          <Select
            value={strVal}
            onChange={(e) =>
              handleAttributeValueChange(attribute.id, e.target.value)
            }
            className="mt-2"
          >
            <option value="">{__("Select an option", "yatra")}</option>
            {options.map((option, index) => (
              <option key={`${option.value}-${index}`} value={option.value}>
                {option.label || option.value}
              </option>
            ))}
          </Select>
        );
      }

      case "radio": {
        const options = parseAttributeFieldOptions(attribute.field_options);
        const strVal = typeof value === "string" ? value : "";
        if (options.length === 0) {
          return (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-500">
              {__(
                "This attribute has no options configured. Edit the attribute to add choices.",
                "yatra",
              )}
            </p>
          );
        }
        return (
          <div className="mt-2 space-y-2" role="radiogroup" aria-label={attribute.name}>
            {options.map((option, index) => (
              <label
                key={`${option.value}-${index}`}
                className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
              >
                <input
                  type="radio"
                  name={`yatra-attr-${attribute.id}`}
                  value={option.value}
                  checked={String(strVal) === String(option.value)}
                  onChange={() =>
                    handleAttributeValueChange(attribute.id, option.value)
                  }
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{option.label || option.value}</span>
              </label>
            ))}
          </div>
        );
      }

      case "checkbox": {
        const options = parseAttributeFieldOptions(attribute.field_options);
        const selected = Array.isArray(value) ? value.map(String) : [];
        if (options.length === 0) {
          return (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-500">
              {__(
                "This attribute has no options configured. Edit the attribute to add choices.",
                "yatra",
              )}
            </p>
          );
        }
        const toggle = (optValue: string, checked: boolean) => {
          const next = checked
            ? [...selected.filter((v) => v !== optValue), optValue]
            : selected.filter((v) => v !== optValue);
          handleAttributeValueChange(attribute.id, next);
        };
        return (
          <div className="mt-2 space-y-2">
            {options.map((option, index) => (
              <label
                key={`${option.value}-${index}`}
                className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(String(option.value))}
                  onChange={(e) => toggle(String(option.value), e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{option.label || option.value}</span>
              </label>
            ))}
          </div>
        );
      }

      case "file":
        return (
          <Input
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(e) =>
              handleAttributeValueChange(attribute.id, e.target.value)
            }
            placeholder={
              attribute.placeholder ||
              __("File URL or attachment path", "yatra")
            }
            className="mt-2"
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) =>
              handleAttributeValueChange(attribute.id, e.target.value)
            }
            className="mt-2"
          />
        );

      case "time":
        return (
          <TimePicker
            value={value}
            onChange={(newValue) =>
              handleAttributeValueChange(attribute.id, newValue)
            }
            placeholder="Select time"
            className="mt-2 w-full"
          />
        );

      case "color":
        return (
          <Input
            type="color"
            value={value}
            onChange={(e) =>
              handleAttributeValueChange(attribute.id, e.target.value)
            }
            className="mt-2 h-10 w-20"
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) =>
              handleAttributeValueChange(attribute.id, e.target.value)
            }
            placeholder={attribute.placeholder || __("Enter value", "yatra")}
            className="mt-2"
          />
        );
    }
  };

  const availableAttributes =
    attributesData?.filter(
      (attr: Attribute) =>
        attr.status === "publish" && !selectedAttributes.includes(attr.id),
    ) || [];

  if (isEditMode && tripId && !tripAttributesReady) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isLoadingAttributes) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Show message when no attributes exist at all */}
      {!attributesData || attributesData.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <Tag className="w-12 h-12 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {__("No Attributes Found", "yatra")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {__(
                "Attributes allow you to add custom fields to your trips that are not included in the main plugin features. You can create any type of custom attribute you need.",
                "yatra",
              )}
            </p>
            <a
              href="/wp-admin/admin.php?page=yatra&subpage=trips&tab=attributes&action=create"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {__("Create Your First Attribute", "yatra")}
            </a>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Add Attribute Button/Card */}
          <Card>
            <CardContent className="p-4">
              <Button
                type="button"
                onClick={() => setShowAttributeDropdown(!showAttributeDropdown)}
                className="w-full justify-between h-auto py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                variant="outline"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>{__("Add Attribute", "yatra")}</span>
                </div>
                {showAttributeDropdown ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>

              {/* Attribute Dropdown */}
              {showAttributeDropdown && availableAttributes.length > 0 && (
                <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
                  <div className="max-h-60 overflow-y-auto">
                    {availableAttributes.map((attribute: Attribute) => (
                      <button
                        key={attribute.id}
                        type="button"
                        onClick={() => handleAddAttribute(attribute.id)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {attribute.name}
                            </div>
                            {attribute.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {attribute.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {attribute.field_type.replace("_", " ")}
                            </Badge>
                            {attribute.required && (
                              <Badge variant="error" className="text-xs">
                                {__("Required", "yatra")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showAttributeDropdown && availableAttributes.length === 0 && (
                <div className="mt-3 p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {__("No attributes available to add", "yatra")}
                  </p>
                  <a
                    href="/wp-admin/admin.php?page=yatra&subpage=trips&tab=attributes&action=create"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {__("Create New Attribute", "yatra")}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Attributes */}
          {selectedAttributes.length > 0 && (
            <div className="space-y-4">
              {selectedAttributes.map((attributeId) => {
                const attribute = attributesData?.find(
                  (attr: Attribute) => attr.id === attributeId,
                );

                if (!attribute) {
                  return (
                    <Card
                      key={attributeId}
                      className="border-orange-200 bg-orange-50 dark:bg-orange-900/20"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-orange-900 dark:text-orange-100">
                              Attribute ID {attributeId} (Not Found)
                            </h4>
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                              Value:{" "}
                              {JSON.stringify(attributeValues[attributeId])}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAttribute(attributeId)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <Card key={attribute.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-blue-500" />
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {attribute.name}
                          </h4>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttribute(attribute.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {attribute.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {attribute.description}
                        </p>
                      )}

                      {renderAttributeInput(attribute)}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TripAttributesSection;
