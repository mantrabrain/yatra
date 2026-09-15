import React, { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import type { BookingFormType, FormFieldConfig } from "./booking-form-types";

/**
 * The booking-form field builder: draggable field list, inline editor, and
 * the Add New Field form. Used by Settings → Booking Form for each section's
 * global fields, and by the per-trip Conditions popup for each condition's
 * fields — the same component, so both are identical.
 *
 * Controlled: renders `fields`, reports every change through `onChange`.
 */

export interface FieldOption {
  value: string;
  label: string;
}

interface BookingFormFieldsEditorProps {
  formType: BookingFormType;
  fields: FormFieldConfig[];
  onChange: (fields: FormFieldConfig[]) => void;
  fieldTypes: FieldOption[];
  widthOptions: FieldOption[];
  appliesToOptions: FieldOption[];
  /** Extra controls rendered in the card header next to "Add Field". */
  headerExtra?: React.ReactNode;
}

const withOrder = (fields: FormFieldConfig[]): FormFieldConfig[] =>
  fields.map((field, i) => ({ ...field, order: i + 1 }));

export const BookingFormFieldsEditor: React.FC<
  BookingFormFieldsEditorProps
> = ({
  formType,
  fields,
  onChange,
  fieldTypes,
  widthOptions,
  appliesToOptions,
  headerExtra,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  // Draft for the Field ID input while editing an existing field. The field's
  // `id` is its React key AND the value `editingField` tracks, so mutating it on
  // every keystroke remounts the row (focus loss) and breaks the open-editor
  // match (editor closes). We edit a local draft and commit once on blur/Enter.
  const [fieldIdDraft, setFieldIdDraft] = useState<string | null>(null);
  // Clear any pending Field ID draft whenever the edited field changes
  // (open / close / switch) so a draft can never leak onto another field.
  useEffect(() => {
    setFieldIdDraft(null);
  }, [editingField]);
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState<Partial<FormFieldConfig>>({
    id: "",
    type: "text",
    label: "",
    placeholder: "",
    required: false,
    enabled: true,
    width: "full",
    options: [],
    applies_to: "all",
  });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    fieldId: string | null;
    fieldLabel: string;
  }>({
    isOpen: false,
    fieldId: null,
    fieldLabel: "",
  });

  // Drag and drop state
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null);

  // Helper to generate ID from label
  const generateIdFromLabel = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  };

  // Helper to sanitize ID input
  const sanitizeId = (id: string): string => {
    return id
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  };

  // Handle label change with auto ID generation
  const handleNewFieldLabelChange = (label: string) => {
    const autoId = generateIdFromLabel(label);
    setNewField((prev) => ({
      ...prev,
      label,
      // Only auto-generate ID if it hasn't been manually edited
      id:
        prev.id === "" || prev.id === generateIdFromLabel(prev.label || "")
          ? autoId
          : prev.id,
    }));
  };

  const updateField = (fieldId: string, updates: Partial<FormFieldConfig>) => {
    onChange(
      fields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field,
      ),
    );
  };

  const toggleFieldEnabled = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    // Locked fields cannot be disabled
    if (field && !field.locked) {
      updateField(fieldId, { enabled: !field.enabled });
    }
  };

  const toggleFieldRequired = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (field) {
      updateField(fieldId, { required: !field.required });
    }
  };

  const moveField = (fieldId: string, direction: "up" | "down") => {
    const next = [...fields];
    const index = next.findIndex((f) => f.id === fieldId);

    if (direction === "up" && index > 0) {
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
    } else if (direction === "down" && index < next.length - 1) {
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
    }

    onChange(withOrder(next));
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedFieldId(fieldId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (fieldId !== draggedFieldId) {
      setDragOverFieldId(fieldId);
    }
  };

  const handleDragLeave = () => {
    setDragOverFieldId(null);
  };

  const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault();
    if (!draggedFieldId || draggedFieldId === targetFieldId) {
      setDraggedFieldId(null);
      setDragOverFieldId(null);
      return;
    }

    const next = [...fields];
    const draggedIndex = next.findIndex((f) => f.id === draggedFieldId);
    const targetIndex = next.findIndex((f) => f.id === targetFieldId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedField] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, draggedField);
      onChange(withOrder(next));
    }

    setDraggedFieldId(null);
    setDragOverFieldId(null);
  };

  const handleDragEnd = () => {
    setDraggedFieldId(null);
    setDragOverFieldId(null);
  };

  const deleteField = (fieldId: string) => {
    onChange(withOrder(fields.filter((f) => f.id !== fieldId)));
    setDeleteConfirm({ isOpen: false, fieldId: null, fieldLabel: "" });
  };

  const addNewField = () => {
    const isTextBlock = newField.type === "text_block";

    let fieldId: string;
    if (isTextBlock) {
      // Display-only block: the admin supplies only content — no label or id.
      // Generate a unique internal id so it can be ordered/stored like any field.
      if (!newField.content || !newField.content.trim()) return;
      let n = 1;
      while (fields.some((f) => f.id === `text_block_${n}`)) n++;
      fieldId = `text_block_${n}`;
    } else {
      if (!newField.label || !newField.id) return;
      fieldId = sanitizeId(newField.id);
    }

    // Check if ID already exists
    if (fields.some((f) => f.id === fieldId)) {
      // TODO: Replace with toast notification when refactoring this nested component
      window.alert(
        "A field with this ID already exists. Please use a different ID.",
      );
      return;
    }

    const newFieldConfig: FormFieldConfig = {
      id: fieldId,
      type: (newField.type as FormFieldConfig["type"]) || "text",
      label: newField.label || "",
      placeholder: newField.placeholder || "",
      required: newField.required || false,
      enabled: true,
      order: fields.length + 1,
      width: (newField.width as FormFieldConfig["width"]) || "full",
      // Per-traveler targeting only applies to the Traveler section.
      ...(formType === "traveler_form"
        ? { applies_to: newField.applies_to || "all" }
        : {}),
      // Phone fields carry the country-code toggle (default on).
      ...(newField.type === "tel"
        ? { show_country_code: newField.show_country_code !== false }
        : {}),
    };

    // Add options if field type is select
    if (
      newField.type === "select" &&
      newField.options &&
      newField.options.length > 0
    ) {
      newFieldConfig.options = newField.options.filter(
        (opt) => opt.value && opt.label,
      );
    }

    // Text block: keep its display content; it can never be a required input.
    if (isTextBlock) {
      newFieldConfig.content = newField.content || "";
      newFieldConfig.required = false;
    }

    onChange([...fields, newFieldConfig]);
    setNewField({
      id: "",
      type: "text",
      label: "",
      placeholder: "",
      required: false,
      enabled: true,
      width: "full",
      options: [],
      content: "",
    });
    setShowAddField(false);
  };

  return (
    <>
      {/* Form Fields */}
      <Card>
        <CardHeader>
          {/* Explicit row wrapper: CardHeader's own column layout must not
              stack the title above the buttons (it did inside the Conditions
              popup). */}
          <div className="flex flex-row flex-wrap items-center justify-between gap-2 w-full">
            <CardTitle className="text-base">
              {__("Form Fields", "yatra")}
            </CardTitle>
            <div className="flex items-center gap-2">
              {headerExtra}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddField(!showAddField)}
                className="flex items-center gap-2"
                data-testid="add-field-toggle"
              >
                <Plus className="w-4 h-4" />
                {__("Add Field", "yatra")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add New Field Form */}
          {showAddField && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
              <h4 className="font-medium text-sm mb-3">
                {__("Add New Field", "yatra")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <Label className="text-xs">{__("Field Type", "yatra")}</Label>
                  <Select
                    value={newField.type || "text"}
                    onChange={(e) =>
                      setNewField((prev) => ({
                        ...prev,
                        type: e.target.value as FormFieldConfig["type"],
                      }))
                    }
                    className="mt-1"
                  >
                    {fieldTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                </div>
                {newField.type !== "text_block" && (
                  <div>
                    <Label className="text-xs">{__("Label", "yatra")} *</Label>
                    <Input
                      value={newField.label || ""}
                      onChange={(e) =>
                        handleNewFieldLabelChange(e.target.value)
                      }
                      placeholder="Field label"
                      className="mt-1"
                    />
                  </div>
                )}
                {newField.type !== "text_block" && (
                  <div>
                    <Label className="text-xs">
                      {__("Field ID", "yatra")} *
                    </Label>
                    <Input
                      value={newField.id || ""}
                      onChange={(e) =>
                        setNewField((prev) => ({
                          ...prev,
                          id: sanitizeId(e.target.value),
                        }))
                      }
                      placeholder="field_id"
                      className="mt-1 font-mono text-xs"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {__("Lowercase, no spaces", "yatra")}
                    </p>
                  </div>
                )}
                {newField.type !== "text_block" && (
                  <div>
                    <Label className="text-xs">
                      {__("Placeholder", "yatra")}
                    </Label>
                    <Input
                      value={newField.placeholder || ""}
                      onChange={(e) =>
                        setNewField((prev) => ({
                          ...prev,
                          placeholder: e.target.value,
                        }))
                      }
                      placeholder="Placeholder text"
                      className="mt-1"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-xs">{__("Width", "yatra")}</Label>
                  <Select
                    value={newField.width || "full"}
                    onChange={(e) =>
                      setNewField((prev) => ({
                        ...prev,
                        width: e.target.value as FormFieldConfig["width"],
                      }))
                    }
                    className="mt-1"
                  >
                    {widthOptions.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </Select>
                </div>
                {formType === "traveler_form" && (
                  <div>
                    <Label className="text-xs">
                      {__("Applies to", "yatra")}
                    </Label>
                    <Select
                      value={newField.applies_to || "all"}
                      onChange={(e) =>
                        setNewField((prev) => ({
                          ...prev,
                          applies_to: e.target
                            .value as FormFieldConfig["applies_to"],
                        }))
                      }
                      className="mt-1"
                    >
                      {appliesToOptions.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
              {/* Content editor for text blocks (display-only) */}
              {newField.type === "text_block" && (
                <div className="mt-3">
                  <Label className="text-xs font-medium">
                    {__("Content", "yatra")}
                  </Label>
                  <textarea
                    value={newField.content || ""}
                    onChange={(e) =>
                      setNewField((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    rows={4}
                    placeholder={__(
                      "Text shown to customers between fields. Basic HTML (bold, links, lists) is allowed.",
                      "yatra",
                    )}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {__(
                      "Display only — this is not an input and is not submitted by the customer.",
                      "yatra",
                    )}
                  </p>
                </div>
              )}

              {/* Options editor for select fields */}
              {newField.type === "select" && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-900">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium">
                      {__("Dropdown Options", "yatra")}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentOptions = newField.options || [];
                        setNewField((prev) => ({
                          ...prev,
                          options: [
                            ...currentOptions,
                            { value: "", label: "" },
                          ],
                        }));
                      }}
                      className="h-6 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {__("Add Option", "yatra")}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(newField.options || []).map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <Input
                          value={option.value}
                          onChange={(e) => {
                            const newOptions = [...(newField.options || [])];
                            newOptions[optIndex] = {
                              ...newOptions[optIndex],
                              value: e.target.value,
                            };
                            setNewField((prev) => ({
                              ...prev,
                              options: newOptions,
                            }));
                          }}
                          placeholder="Value (e.g., option1)"
                          className="text-xs flex-1"
                        />
                        <Input
                          value={option.label}
                          onChange={(e) => {
                            const newOptions = [...(newField.options || [])];
                            newOptions[optIndex] = {
                              ...newOptions[optIndex],
                              label: e.target.value,
                            };
                            setNewField((prev) => ({
                              ...prev,
                              options: newOptions,
                            }));
                          }}
                          placeholder="Label (e.g., Option 1)"
                          className="text-xs flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = (newField.options || []).filter(
                              (_, i) => i !== optIndex,
                            );
                            setNewField((prev) => ({
                              ...prev,
                              options: newOptions,
                            }));
                          }}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {(!newField.options || newField.options.length === 0) && (
                      <p className="text-xs text-gray-400 italic">
                        {__(
                          'Click "Add Option" to add dropdown choices.',
                          "yatra",
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mt-3">
                {newField.type !== "text_block" && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newField.required || false}
                      onChange={(e) =>
                        setNewField((prev) => ({
                          ...prev,
                          required: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    {__("Required", "yatra")}
                  </label>
                )}
                {newField.type === "tel" && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newField.show_country_code !== false}
                      onChange={(e) =>
                        setNewField((prev) => ({
                          ...prev,
                          show_country_code: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    {__("Show country code", "yatra")}
                  </label>
                )}
                <div className="flex-1"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddField(false)}
                >
                  {__("Cancel", "yatra")}
                </Button>
                <Button
                  size="sm"
                  onClick={addNewField}
                  disabled={
                    newField.type === "text_block"
                      ? !newField.content || !newField.content.trim()
                      : !newField.id || !newField.label
                  }
                >
                  {__("Add Field", "yatra")}
                </Button>
              </div>
            </div>
          )}

          {/* Field List */}
          {fields?.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>
                {__(
                  'No fields configured. Click "Add Field" to get started.',
                  "yatra",
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {fields?.map((field, index) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, field.id)}
                  onDragOver={(e) => handleDragOver(e, field.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, field.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                    draggedFieldId === field.id
                      ? "opacity-50 border-dashed"
                      : ""
                  } ${
                    dragOverFieldId === field.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  } ${
                    field.enabled
                      ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60"
                  }`}
                >
                  {/* Drag Handle & Order */}
                  <div className="flex items-center gap-1">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveField(field.id, "up")}
                        disabled={index === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(field.id, "down")}
                        disabled={index === fields.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Field Info */}
                  <div className="flex-1 min-w-0">
                    {editingField === field.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-2">
                          {field.type !== "text_block" && (
                            <>
                              <Input
                                value={field.label}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    label: e.target.value,
                                  })
                                }
                                placeholder="Label"
                                className="text-sm"
                              />
                              <Input
                                value={field.placeholder}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    placeholder: e.target.value,
                                  })
                                }
                                placeholder="Placeholder"
                                className="text-sm"
                              />
                            </>
                          )}
                          <Select
                            value={field.type}
                            onChange={(e) =>
                              !field.locked &&
                              updateField(field.id, {
                                type: e.target.value as FormFieldConfig["type"],
                              })
                            }
                            disabled={field.locked}
                            title={
                              field.locked
                                ? "Locked fields cannot change type"
                                : undefined
                            }
                            className="text-sm"
                          >
                            {fieldTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </Select>
                          <Select
                            value={field.width}
                            onChange={(e) =>
                              updateField(field.id, {
                                width: e.target
                                  .value as FormFieldConfig["width"],
                              })
                            }
                            className="text-sm"
                          >
                            {widthOptions.map((w) => (
                              <option key={w.value} value={w.value}>
                                {w.label}
                              </option>
                            ))}
                          </Select>
                          {formType === "traveler_form" && (
                            <Select
                              value={field.applies_to || "all"}
                              onChange={(e) =>
                                updateField(field.id, {
                                  applies_to: e.target
                                    .value as FormFieldConfig["applies_to"],
                                })
                              }
                              className="text-sm"
                              title={__(
                                "Which travelers see this field",
                                "yatra",
                              )}
                            >
                              {appliesToOptions.map((a) => (
                                <option key={a.value} value={a.value}>
                                  {a.label}
                                </option>
                              ))}
                            </Select>
                          )}
                          {field.type === "tel" && (
                            <label
                              className="flex items-center gap-2 text-sm whitespace-nowrap px-1"
                              title={__(
                                "Show the international country flag + dial code selector on this phone field",
                                "yatra",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={field.show_country_code !== false}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    show_country_code: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 rounded border-gray-300 text-blue-600"
                              />
                              {__("Show country code", "yatra")}
                            </label>
                          )}
                        </div>

                        {/* Content editor for text blocks (display-only) */}
                        {field.type === "text_block" && (
                          <div>
                            <Label className="text-xs font-medium">
                              {__("Content", "yatra")}
                            </Label>
                            <textarea
                              value={field.content || ""}
                              onChange={(e) =>
                                updateField(field.id, {
                                  content: e.target.value,
                                })
                              }
                              rows={4}
                              placeholder={__(
                                "Text shown to customers between fields. Basic HTML (bold, links, lists) is allowed.",
                                "yatra",
                              )}
                              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                            />
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {__(
                                "Display only — this is not an input and is not submitted by the customer.",
                                "yatra",
                              )}
                            </p>
                          </div>
                        )}

                        {/* Field ID - Below other fields (input fields only) */}
                        {field.type !== "text_block" && (
                          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                            <Label className="text-xs text-gray-500 whitespace-nowrap">
                              {__("Field ID:", "yatra")}
                            </Label>
                            <Input
                              value={
                                fieldIdDraft !== null ? fieldIdDraft : field.id
                              }
                              onChange={(e) => {
                                if (!field.locked) {
                                  // Local draft only — do NOT mutate field.id
                                  // here, or the row remounts (focus loss) and
                                  // the editor closes on every keystroke.
                                  setFieldIdDraft(sanitizeId(e.target.value));
                                }
                              }}
                              onBlur={() => {
                                if (fieldIdDraft === null) return;
                                const next = fieldIdDraft;
                                setFieldIdDraft(null);
                                if (
                                  !field.locked &&
                                  next !== "" &&
                                  next !== field.id
                                ) {
                                  updateField(field.id, { id: next });
                                  // Keep the editor open on the renamed field.
                                  setEditingField((cur) =>
                                    cur === field.id ? next : cur,
                                  );
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  (e.currentTarget as HTMLInputElement).blur();
                                }
                              }}
                              placeholder="field_id"
                              className="text-sm font-mono flex-1 max-w-xs"
                              disabled={field.locked}
                              title={
                                field.locked
                                  ? "Locked fields cannot change ID"
                                  : "Field ID (lowercase, no spaces)"
                              }
                            />
                            {field.locked && (
                              <span className="text-xs text-amber-600">
                                {__("(locked)", "yatra")}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Dropdown Options Editor */}
                        {field.type === "select" && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs font-medium">
                                {__("Dropdown Options", "yatra")}
                              </Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newOptions = [
                                    ...(field.options || []),
                                    { value: "", label: "" },
                                  ];
                                  updateField(field.id, {
                                    options: newOptions,
                                  });
                                }}
                                className="h-6 text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                {__("Add Option", "yatra")}
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {(field.options || []).map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center gap-2"
                                >
                                  <Input
                                    value={option.value}
                                    onChange={(e) => {
                                      const newOptions = [
                                        ...(field.options || []),
                                      ];
                                      newOptions[optIndex] = {
                                        ...newOptions[optIndex],
                                        value: e.target.value,
                                      };
                                      updateField(field.id, {
                                        options: newOptions,
                                      });
                                    }}
                                    placeholder="Value (e.g., spouse)"
                                    className="text-xs flex-1"
                                  />
                                  <Input
                                    value={option.label}
                                    onChange={(e) => {
                                      const newOptions = [
                                        ...(field.options || []),
                                      ];
                                      newOptions[optIndex] = {
                                        ...newOptions[optIndex],
                                        label: e.target.value,
                                      };
                                      updateField(field.id, {
                                        options: newOptions,
                                      });
                                    }}
                                    placeholder="Label (e.g., Spouse/Partner)"
                                    className="text-xs flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptions = (
                                        field.options || []
                                      ).filter((_, i) => i !== optIndex);
                                      updateField(field.id, {
                                        options: newOptions,
                                      });
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {(!field.options ||
                                field.options.length === 0) && (
                                <p className="text-xs text-gray-400 italic">
                                  {__(
                                    'No options. Click "Add Option" to add dropdown choices.',
                                    "yatra",
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-sm">
                          {field.type === "text_block"
                            ? __("Text Block", "yatra")
                            : field.label}
                        </span>
                        {field.type !== "text_block" && (
                          <code className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                            {field.id}
                          </code>
                        )}
                        <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                          {fieldTypes.find((t) => t.value === field.type)
                            ?.label || field.type}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {widthOptions.find((w) => w.value === field.width)
                            ?.label || "Full"}
                        </span>
                        {field.type === "text_block" && field.content && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic truncate max-w-[16rem]">
                            "
                            {field.content.replace(/<[^>]*>/g, "").slice(0, 60)}
                            "
                          </span>
                        )}
                        {field.type === "select" &&
                          field.options &&
                          field.options.length > 0 && (
                            <span className="text-xs text-blue-500 dark:text-blue-400">
                              ({field.options.length}{" "}
                              {field.options.length === 1
                                ? "option"
                                : "options"}
                              )
                            </span>
                          )}
                        {field.required && (
                          <span className="text-xs text-red-500 font-medium">
                            {__("Required", "yatra")}
                          </span>
                        )}
                        {formType === "traveler_form" &&
                          field.applies_to === "lead" && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                              {__("Lead only", "yatra")}
                            </span>
                          )}
                        {field.locked && (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded"
                            title="This field is protected and cannot be deleted"
                          >
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {field.type !== "text_block" && (
                      <button
                        type="button"
                        onClick={() =>
                          !field.locked && toggleFieldRequired(field.id)
                        }
                        disabled={field.locked}
                        className={`p-1.5 rounded ${field.locked ? "cursor-not-allowed opacity-50" : ""} ${field.required ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-gray-400 hover:text-gray-600"}`}
                        title={
                          field.locked
                            ? "This field is required and cannot be changed"
                            : field.required
                              ? "Make optional"
                              : "Make required"
                        }
                      >
                        <Star
                          className="w-4 h-4"
                          fill={field.required ? "currentColor" : "none"}
                        />
                      </button>
                    )}
                    {/* Show enable/disable toggle only for non-locked fields */}
                    {!field.locked && (
                      <button
                        type="button"
                        onClick={() => toggleFieldEnabled(field.id)}
                        className={`p-1.5 rounded ${field.enabled ? "text-green-500" : "text-gray-400"}`}
                        title={field.enabled ? "Disable field" : "Enable field"}
                      >
                        {field.enabled ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setEditingField(
                          editingField === field.id ? null : field.id,
                        )
                      }
                      className="p-1.5 rounded text-gray-400 hover:text-blue-500"
                      title="Edit field"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {/* Show delete button only for non-locked fields */}
                    {!field.locked && (
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirm({
                            isOpen: true,
                            fieldId: field.id,
                            fieldLabel: field.label,
                          })
                        }
                        className="p-1.5 rounded text-gray-400 hover:text-red-500"
                        title="Delete field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, fieldId: null, fieldLabel: "" })
        }
        onConfirm={() => {
          if (deleteConfirm.fieldId) {
            deleteField(deleteConfirm.fieldId);
          }
        }}
        title={__("Delete Field", "yatra")}
        message={`Are you sure you want to delete the field "${deleteConfirm.fieldLabel}"? This action cannot be undone.`}
        confirmText={__("Delete", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="danger"
      />
    </>
  );
};

export default BookingFormFieldsEditor;
