/**
 * Shared Itinerary Entry Fields Component
 * Reusable form fields for itinerary entries - used by both ItineraryForm and ItinerarySection
 */

import React, { useState, useEffect } from "react";
import { MapPin, Clock, X, Plus, Info } from "lucide-react";
import { __ } from "../../../lib/i18n";
import { ItineraryEntry } from "../types";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { HelpText } from "../../ui/help-text";
import { Card, CardContent } from "../../ui/card";
import { TimePicker } from "../../ui/time-picker";
import { Modal } from "../../ui/modal";
import { getCurrencySymbol } from "../../../data/currencies";

interface ItineraryEntryFieldsProps {
  entry: Partial<ItineraryEntry>;
  errors?: Record<string, string>;
  itemTypes: Array<{ id: number; name: string; icon?: string }>;
  items: Array<{ id: number; name: string; type_id: number }>;
  newIncludedItem?: string;
  newExcludedItem?: string;
  onFieldChange: (field: keyof ItineraryEntry, value: any) => void;
  onIncludedItemChange?: (value: string) => void;
  onExcludedItemChange?: (value: string) => void;
  onAddIncludedItem?: () => void;
  onAddExcludedItem?: () => void;
  onRemoveIncludedItem?: (index: number) => void;
  onRemoveExcludedItem?: (index: number) => void;
  calculateDuration?: (
    startTime: string,
    endTime: string,
    timeType: string,
  ) => string;
  size?: "default" | "compact";
  showCardWrapper?: boolean;
  onRefreshData?: () => void; // Callback to refresh item types and items after creation
}

export const ItineraryEntryFields: React.FC<ItineraryEntryFieldsProps> = ({
  entry,
  errors = {},
  itemTypes,
  items,
  newIncludedItem = "",
  newExcludedItem = "",
  onFieldChange,
  onIncludedItemChange,
  onExcludedItemChange,
  onAddIncludedItem,
  onAddExcludedItem,
  onRemoveIncludedItem,
  onRemoveExcludedItem,
  calculateDuration,
  size = "default",
  showCardWrapper = true,
  onRefreshData,
}) => {
  // Modal states
  const [isItemTypeModalOpen, setIsItemTypeModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const isCompact = size === "compact";
  const textSize = isCompact ? "text-xs" : "text-sm";
  const labelSize = isCompact ? "text-xs" : "text-sm";
  const autoDuration = calculateDuration
    ? calculateDuration(
        entry.start_time || "",
        entry.end_time || "",
        entry.time_type || "exact",
      )
    : "";

  // Global currency symbol (same logic as other admin pages)
  const globalCurrency = (window as any).yatraAdmin?.currency || "USD";
  const currencySymbol = getCurrencySymbol(globalCurrency) || "";

  const renderField = (content: React.ReactNode) => {
    if (showCardWrapper) {
      return (
        <Card>
          <CardContent className="space-y-3">{content}</CardContent>
        </Card>
      );
    }
    return <div className="space-y-3">{content}</div>;
  };

  const content = (
    <>
      {/* Basic Information */}
      <div className="space-y-3">
        {!isCompact && (
          <h5
            className={`${labelSize} font-semibold text-gray-900 dark:text-white`}
          >
            {__("Basic Information", "yatra")}
          </h5>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label
              className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}
            >
              {__("Item Type", "yatra")} <span className="text-red-500">*</span>
            </label>
            <HelpText
              text={__(
                "Select the type of item (Activity, Meal, Accommodation, etc.).",
                "yatra",
              )}
              className="mb-2"
            />
            <div className="flex gap-2">
              <Select
                value={
                  entry.item_type_id && Number(entry.item_type_id) !== 0
                    ? entry.item_type_id
                    : ""
                }
                onChange={(e) => {
                  onFieldChange("item_type_id", e.target.value);
                  // Reset item_id when type changes
                  onFieldChange("item_id", "");
                }}
                className={`${errors.item_type_id ? "border-red-500" : ""} ${textSize} text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 flex-1`}
                style={{
                  color: "rgb(17, 24, 39)",
                  backgroundColor: "rgb(255, 255, 255)",
                }}
                required
              >
                <option value="">{__("Select a type...", "yatra")}</option>
                {itemTypes.map((type: any) => (
                  <option key={type.id} value={String(type.id)}>
                    {type.name}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsItemTypeModalOpen(true)}
                className="flex items-center gap-1 whitespace-nowrap"
                title={__("Add new item type", "yatra")}
              >
                <Plus className="w-4 h-4" />
                {isCompact ? "" : __("Add Type", "yatra")}
              </Button>
            </div>
            {errors.item_type_id && (
              <p
                className={`mt-1.5 ${textSize} text-red-600 dark:text-red-400 flex items-center gap-1`}
              >
                <Info className="w-4 h-4" />
                {errors.item_type_id}
              </p>
            )}
          </div>

          <div>
            <label
              className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}
            >
              {__("Item", "yatra")} <span className="text-red-500">*</span>
            </label>
            <HelpText
              text={__(
                "Select the specific item (Hiking, Lunch, Bus, etc.).",
                "yatra",
              )}
              className="mb-2"
            />
            <div className="flex gap-2">
              <Select
                value={
                  entry.item_id && Number(entry.item_id) !== 0
                    ? entry.item_id
                    : ""
                }
                onChange={(e) => onFieldChange("item_id", e.target.value)}
                disabled={
                  !entry.item_type_id ||
                  items.filter((item: any) => {
                    const itemTypeId = entry.item_type_id
                      ? String(entry.item_type_id)
                      : "";
                    const itemTypeIdNum = item.type_id || item.item_type_id;
                    return String(itemTypeIdNum) === itemTypeId;
                  }).length === 0
                }
                className={`${errors.item_id ? "border-red-500" : ""} ${textSize} text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 flex-1`}
                style={{
                  color: "rgb(17, 24, 39)",
                  backgroundColor: "rgb(255, 255, 255)",
                }}
                required
              >
                <option value="">
                  {!entry.item_type_id
                    ? __("Select type first...", "yatra")
                    : items.filter((item: any) => {
                          // Filter items by the entry's item_type_id
                          const itemTypeId = entry.item_type_id
                            ? String(entry.item_type_id)
                            : "";
                          const itemTypeIdNum =
                            item.type_id || item.item_type_id;
                          return String(itemTypeIdNum) === itemTypeId;
                        }).length === 0
                      ? __("No items available", "yatra")
                      : __("Select an item...", "yatra")}
                </option>
                {items
                  .filter((item: any) => {
                    // Filter items by the entry's item_type_id
                    if (!entry.item_type_id) return false;
                    const itemTypeId = String(entry.item_type_id);
                    const itemTypeIdNum = item.type_id || item.item_type_id;
                    return String(itemTypeIdNum) === itemTypeId;
                  })
                  .map((item: any) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.name}
                    </option>
                  ))}
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsItemModalOpen(true)}
                disabled={!entry.item_type_id}
                className="flex items-center gap-1 whitespace-nowrap"
                title={__("Add new item", "yatra")}
              >
                <Plus className="w-4 h-4" />
                {isCompact ? "" : __("Add Item", "yatra")}
              </Button>
            </div>
            {errors.item_id && (
              <p
                className={`mt-1.5 ${textSize} text-red-600 dark:text-red-400 flex items-center gap-1`}
              >
                <Info className="w-4 h-4" />
                {errors.item_id}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}
          >
            {__("Itinerary Activity Title", "yatra")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <HelpText
            text={__(
              'A descriptive title for this itinerary activity. Examples: "Arrival in Kathmandu", "Trek to Base Camp".',
              "yatra",
            )}
            className="mb-2"
          />
          <Input
            type="text"
            value={entry.title || ""}
            onChange={(e) => onFieldChange("title", e.target.value)}
            placeholder={__("e.g., Arrival in Kathmandu", "yatra")}
            className={`${errors.title ? "border-red-500" : ""} ${textSize}`}
            required
          />
          {errors.title && (
            <p
              className={`mt-1.5 ${textSize} text-red-600 dark:text-red-400 flex items-center gap-1`}
            >
              <Info className="w-4 h-4" />
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label
            className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}
          >
            {__("Description", "yatra")}
          </label>
          <HelpText
            text={__(
              "Detailed description of what happens during this itinerary entry.",
              "yatra",
            )}
            className="mb-2"
          />
          <textarea
            value={entry.description || ""}
            onChange={(e) => onFieldChange("description", e.target.value)}
            placeholder={__(
              "Describe what happens during this entry...",
              "yatra",
            )}
            rows={isCompact ? 2 : 4}
            className={`flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 ${textSize} ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none`}
          />
        </div>
      </div>

      {/* Location & Time */}
      <div
        className={`space-y-3 ${!isCompact ? "pt-3 border-t border-gray-200 dark:border-gray-700" : ""}`}
      >
        {!isCompact && (
          <h5
            className={`${labelSize} font-semibold text-gray-900 dark:text-white`}
          >
            {__("Location & Time", "yatra")}
          </h5>
        )}

        <div>
          <label
            className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}
          >
            {__("Location", "yatra")}
          </label>
          <HelpText
            text={__(
              'Where does this activity take place? (e.g., "Resort restaurant", "Private beach")',
              "yatra",
            )}
            className="mb-2"
          />
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              value={entry.location || ""}
              onChange={(e) => onFieldChange("location", e.target.value)}
              placeholder={__("e.g., Resort restaurant", "yatra")}
              className={`pl-9 ${textSize}`}
            />
          </div>
        </div>

        <div>
          <label
            className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}
          >
            {__("Time Type", "yatra")}
          </label>
          <HelpText
            text={__("How should the time be displayed?", "yatra")}
            className="mb-2"
          />
          <Select
            value={entry.time_type || "exact"}
            onChange={(e) => onFieldChange("time_type", e.target.value)}
            className={textSize}
          >
            <option value="exact">{__("Exact Time", "yatra")}</option>
            <option value="approximate">
              {__("Approximate Time", "yatra")}
            </option>
            <option value="all_day">{__("All Day", "yatra")}</option>
            <option value="flexible">{__("Flexible", "yatra")}</option>
          </Select>
        </div>

        {entry.time_type !== "all_day" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label
                className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}
              >
                {__("Start Time", "yatra")}
              </label>
              <HelpText
                text={__("When does this activity start?", "yatra")}
                className="mb-2"
              />
              <TimePicker
                  value={entry.start_time || ""}
                  onChange={(value) => {
                    onFieldChange("start_time", value);
                    // Auto-calculate duration if function provided
                    if (calculateDuration && entry.end_time) {
                      const newDuration = calculateDuration(
                        value,
                        entry.end_time,
                        entry.time_type || "exact",
                      );
                      if (newDuration && !entry.duration) {
                        onFieldChange("duration", newDuration);
                      }
                    }
                  }}
                  placeholder="08:00"
                  className="w-full"
                  error={!!errors?.start_time}
                />
              {errors.start_time && (
                <p
                  className={`mt-1.5 ${textSize} text-red-600 dark:text-red-400 flex items-center gap-1`}
                >
                  <Info className="w-4 h-4" />
                  {errors.start_time}
                </p>
              )}
            </div>

            <div>
              <label
                className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}
              >
                {__("End Time", "yatra")}
              </label>
              <HelpText
                text={__("When does this activity end?", "yatra")}
                className="mb-2"
              />
              <TimePicker
                value={entry.end_time || ""}
                onChange={(value) => {
                  onFieldChange("end_time", value);
                  // Auto-calculate duration if function provided
                  if (calculateDuration && entry.start_time) {
                    const newDuration = calculateDuration(
                      entry.start_time,
                      value,
                      entry.time_type || "exact",
                    );
                    if (newDuration && !entry.duration) {
                      onFieldChange("duration", newDuration);
                    }
                  }
                }}
                placeholder="17:00"
                className="w-full"
                error={!!errors?.end_time}
              />
              {errors.end_time && (
                <p
                  className={`mt-1.5 ${textSize} text-red-600 dark:text-red-400 flex items-center gap-1`}
                >
                  <Info className="w-4 h-4" />
                  {errors.end_time}
                </p>
              )}
            </div>
          </div>
        )}

        <div>
          <label
            className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}
          >
            {__("Duration", "yatra")}
          </label>
          <HelpText
            text={__(
              'How long does this activity take? (e.g., "3 hours", "1 hour 30 minutes"). Leave empty to auto-calculate from times.',
              "yatra",
            )}
            className="mb-2"
          />
          <div className="relative">
            <Clock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              value={entry.duration || ""}
              onChange={(e) => onFieldChange("duration", e.target.value)}
              placeholder={autoDuration || __("e.g., 3 hours", "yatra")}
              className={`pl-9 ${textSize}`}
            />
          </div>
          {autoDuration && entry.time_type === "exact" && !entry.duration && (
            <p
              className={`mt-1.5 ${isCompact ? "text-xs" : "text-xs"} text-gray-500 dark:text-gray-400`}
            >
              {__("Auto-calculated:", "yatra")} {autoDuration}
            </p>
          )}
        </div>
      </div>

      {/* Cost & Additional Information */}
      <div
        className={`space-y-3 ${!isCompact ? "pt-3 border-t border-gray-200 dark:border-gray-700" : ""}`}
      >
        {!isCompact && (
          <h5
            className={`${labelSize} font-semibold text-gray-900 dark:text-white`}
          >
            {__("Cost and Additional Information", "yatra")}
          </h5>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label
              className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}
            >
              {__("Cost", "yatra")}
            </label>
            <HelpText
              text={__(
                "Optional cost for this activity. Leave empty if included in trip price.",
                "yatra",
              )}
              className="mb-2"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                {currencySymbol}
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={entry.cost || ""}
                onChange={(e) => onFieldChange("cost", e.target.value)}
                placeholder="0.00"
                className={`pl-8 ${textSize}`}
              />
            </div>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={entry.cost_per_person !== false}
                onChange={(e) =>
                  onFieldChange("cost_per_person", e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`${textSize} text-gray-700 dark:text-gray-300`}>
                {__("Cost per person", "yatra")}
              </span>
            </label>
          </div>
        </div>

        <div>
          <label
            className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}
          >
            {__("Notes / Instructions", "yatra")}
          </label>
          <HelpText
            text={__(
              "Additional notes or special instructions for this activity.",
              "yatra",
            )}
            className="mb-2"
          />
          <textarea
            value={entry.notes || ""}
            onChange={(e) => onFieldChange("notes", e.target.value)}
            placeholder={__(
              "e.g., Please arrive 15 minutes early, Bring comfortable shoes...",
              "yatra",
            )}
            rows={isCompact ? 2 : 3}
            className={`flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 ${textSize} ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none`}
          />
        </div>

        {/* Included/Excluded Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label
              className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-2`}
            >
              {__("Included Items", "yatra")}
            </label>
            <HelpText
              text={__("Items or services included in this activity.", "yatra")}
              className="mb-2"
            />
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newIncludedItem}
                  onChange={(e) => onIncludedItemChange?.(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onAddIncludedItem?.();
                    }
                  }}
                  placeholder={__("Add included item...", "yatra")}
                  className={`flex-1 ${textSize}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (newIncludedItem.trim()) {
                      onAddIncludedItem?.();
                    }
                  }}
                  disabled={!newIncludedItem.trim()}
                  className={`flex-shrink-0 ${isCompact ? "h-9 w-9" : ""}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(entry.included_items || []).map((item, index) => (
                  <Badge
                    key={index}
                    variant="info"
                    className={`flex items-center gap-1.5 ${textSize}`}
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => onRemoveIncludedItem?.(index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label
              className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-2`}
            >
              {__("Excluded Items", "yatra")}
            </label>
            <HelpText
              text={__(
                "Items or services NOT included in this activity.",
                "yatra",
              )}
              className="mb-2"
            />
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newExcludedItem}
                  onChange={(e) => onExcludedItemChange?.(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onAddExcludedItem?.();
                    }
                  }}
                  placeholder={__("Add excluded item...", "yatra")}
                  className={`flex-1 ${textSize}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (newExcludedItem.trim()) {
                      onAddExcludedItem?.();
                    }
                  }}
                  disabled={!newExcludedItem.trim()}
                  className={`flex-shrink-0 ${isCompact ? "h-9 w-9" : ""}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(entry.excluded_items || []).map((item, index) => (
                  <Badge
                    key={index}
                    variant="default"
                    className={`flex items-center gap-1.5 ${textSize} border border-gray-300 dark:border-gray-600`}
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => onRemoveExcludedItem?.(index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Item Type Creation Modal */}
      <Modal
        isOpen={isItemTypeModalOpen}
        onClose={() => setIsItemTypeModalOpen(false)}
        title={__("Add New Item Type", "yatra")}
        description={__(
          "Create a new category for organizing itinerary items",
          "yatra",
        )}
        size="xl"
      >
        <ItemTypeFormContent
          onSuccess={(newItemType) => {
            setIsItemTypeModalOpen(false);

            // Select the newly created item type
            const itemTypeId = newItemType?.data?.id || newItemType?.id;
            if (itemTypeId) {
              onFieldChange("item_type_id", itemTypeId.toString());
            }

            // Reset item selection
            onFieldChange("item_id", "");
            // Refresh data to update dropdowns
            onRefreshData?.();
          }}
          onCancel={() => setIsItemTypeModalOpen(false)}
        />
      </Modal>

      {/* Item Creation Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={__("Add New Item", "yatra")}
        description={__(
          "Create a new item for the selected item type",
          "yatra",
        )}
        size="xl"
      >
        <ItemFormContent
          selectedTypeId={entry.item_type_id}
          onSuccess={(newItem) => {
            setIsItemModalOpen(false);

            // Select the newly created item
            const itemId = newItem?.data?.id || newItem?.id;
            if (itemId) {
              onFieldChange("item_id", itemId.toString());
            }

            // Refresh data to update dropdowns
            onRefreshData?.();
          }}
          onCancel={() => setIsItemModalOpen(false)}
        />
      </Modal>
    </>
  );

  return renderField(content);
};

// Minimal Item Type Form - Uses exact same API as main ItemTypeForm
interface ItemTypeFormContentProps {
  onSuccess: (itemType: any) => void;
  onCancel: () => void;
}

const ItemTypeFormContent: React.FC<ItemTypeFormContentProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: null,
    color: "blue",
    status: "publish",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate slug from name (same as main form)
  const handleNameChange = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: slug,
    }));
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use exact same API endpoint and structure as main ItemTypeForm
      const response = await fetch("/wp-json/yatra/v1/item-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": (window as any).wpApiSettings?.nonce || "",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newItemType = await response.json();
        onSuccess(newItemType);
      } else {
        const errorData = await response.json();
        setErrors(
          errorData.errors || { general: "Failed to create item type" },
        );
      }
    } catch (error) {
      setErrors({ general: "An error occurred while creating the item type" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {__("Type Name", "yatra")} <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={__("e.g., Activity, Meal, Accommodation", "yatra")}
          className={errors.name ? "border-red-500" : ""}
          required
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.name}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {__(
            "Slug will be auto-generated. You can edit icon, color, and other options later in Item Types page",
            "yatra",
          )}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {__("Description", "yatra")}
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder={__("Brief description of this item type...", "yatra")}
          rows={3}
          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:text-white resize-none"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {__("Cancel", "yatra")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? __("Creating...", "yatra")
            : __("Create Item Type", "yatra")}
        </Button>
      </div>
    </form>
  );
};

// Minimal Item Form - Uses exact same API as main ItemForm
interface ItemFormContentProps {
  selectedTypeId?: string;
  onSuccess: (item: any) => void;
  onCancel: () => void;
}

const ItemFormContent: React.FC<ItemFormContentProps> = ({
  selectedTypeId,
  onSuccess,
  onCancel,
}) => {
  // Check if item type is selected
  if (!selectedTypeId) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4">
          <Info className="w-12 h-12 text-yellow-500 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {__("Item Type Required", "yatra")}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {__(
            "Please select an Item Type first before creating an Item.",
            "yatra",
          )}
        </p>
        <Button type="button" variant="outline" onClick={onCancel}>
          {__("Close", "yatra")}
        </Button>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    type_id: "",
    status: "publish",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update formData when selectedTypeId changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      type_id: selectedTypeId || "",
    }));
  }, [selectedTypeId]);

  // Auto-generate slug from name (same as main form)
  const handleNameChange = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: slug,
    }));
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use exact same API endpoint and structure as main ItemForm
      const response = await fetch("/wp-json/yatra/v1/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": (window as any).wpApiSettings?.nonce || "",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newItem = await response.json();
        onSuccess(newItem);
      } else {
        const errorData = await response.json();
        setErrors(errorData.errors || { general: "Failed to create item" });
      }
    } catch (error) {
      setErrors({ general: "An error occurred while creating the item" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {__("Item Name", "yatra")} <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={__("e.g., Hiking, Lunch, Hotel", "yatra")}
          className={errors.name ? "border-red-500" : ""}
          required
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.name}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {__(
            "Slug will be auto-generated. You can edit additional details later in Items page",
            "yatra",
          )}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {__("Description", "yatra")}
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder={__("Brief description of this item...", "yatra")}
          rows={3}
          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:text-white resize-none"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {__("Cancel", "yatra")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? __("Creating...", "yatra")
            : __("Create Item", "yatra")}
        </Button>
      </div>
    </form>
  );
};
