/**
 * Shared Itinerary Entry Fields Component
 * Reusable form fields for itinerary entries - used by both ItineraryForm and ItinerarySection
 */

import React, { useState, useEffect } from "react";
import { Clock, X, Plus, Info } from "lucide-react";
import { __ } from "../../../lib/i18n";
import { ItineraryEntry, MediaItem } from "../types";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { HelpText } from "../../ui/help-text";
import { Card, CardContent } from "../../ui/card";
import { TimePicker } from "../../ui/time-picker";
import { MediaUpload } from "../../ui/media-upload";
import { Modal } from "../../ui/modal";
import { getCurrencySymbol } from "../../../data/currencies";
import { LocationPicker } from "../LocationPicker";

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
  showCardWrapper = false,
  onRefreshData,
}) => {
  // Local state for gallery (workaround for parent state issue)
  const [localGallery, setLocalGallery] = React.useState<MediaItem[]>([]);

  // Local state for video_url (workaround for parent state issue)
  const [localVideoUrl, setLocalVideoUrl] = React.useState<string>("");

  // Sync local state with entry.gallery changes (including initial load)
  React.useEffect(() => {
    if (entry.gallery && Array.isArray(entry.gallery)) {
      setLocalGallery(entry.gallery);
    } else {
      setLocalGallery([]);
    }
  }, [entry.gallery]);

  // Sync local state with entry.video_url changes (including initial load)
  React.useEffect(() => {
    if (entry.video_url !== undefined && entry.video_url !== null) {
      setLocalVideoUrl(entry.video_url);
    } else {
      setLocalVideoUrl("");
    }
  }, [entry.video_url]);

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
            {__("Activity Location", "yatra")}
          </label>
          <HelpText
            text={__(
              "Where does this activity take place? You can search for a location or enter coordinates manually.",
              "yatra",
            )}
            className="mb-2"
          />
          <LocationPicker
            value={{
              name: entry.location || "",
              latitude: entry.location_latitude || "",
              longitude: entry.location_longitude || "",
            }}
            onChange={(locationData) => {
              onFieldChange("location", locationData.name);
              onFieldChange("location_latitude", locationData.latitude);
              onFieldChange("location_longitude", locationData.longitude);
            }}
            label=""
            placeholder={__("Search for location...", "yatra")}
            helpText=""
            required={false}
            defaultMapCenter={
              entry.location_latitude && entry.location_longitude
                ? [
                    parseFloat(entry.location_latitude),
                    parseFloat(entry.location_longitude),
                  ]
                : [20, 0]
            }
            defaultZoom={
              entry.location_latitude && entry.location_longitude ? 13 : 2
            }
            mapHeight="300px"
            showMapButton={false}
            searchLimit={8}
            __={__}
            className=""
            mapClassName="rounded-lg"
          />
        </div>

        {/* GPS Coordinates - Manual Override */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2`}
            >
              <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  2
                </span>
              </div>
              {__("GPS Coordinates", "yatra")}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({__("Manual override", "yatra")})
              </span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        onFieldChange(
                          "location_latitude",
                          position.coords.latitude.toString(),
                        );
                        onFieldChange(
                          "location_longitude",
                          position.coords.longitude.toString(),
                        );
                        // Also update location name with coordinates
                        onFieldChange(
                          "location",
                          `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
                        );
                      },
                      (error) => {
                        let message = __(
                          "Unable to get your location",
                          "yatra",
                        );
                        let showHttpsNotice = false;

                        switch (error.code) {
                          case 1: // PERMISSION_DENIED
                            if (error.message.includes("secure origins")) {
                              message = __(
                                "Location access requires HTTPS. This feature will work on your live HTTPS site.",
                                "yatra",
                              );
                              showHttpsNotice = true;
                            } else {
                              message = __(
                                "Location access denied. Please allow location access in your browser.",
                                "yatra",
                              );
                            }
                            break;
                          case 2: // POSITION_UNAVAILABLE
                            message = __(
                              "Location information is unavailable. Please try again.",
                              "yatra",
                            );
                            break;
                          case 3: // TIMEOUT
                            message = __(
                              "Location request timed out. Please try again.",
                              "yatra",
                            );
                            break;
                        }

                        if (showHttpsNotice) {
                          alert(
                            message +
                              "\n\n" +
                              __(
                                "For local development, you can:\n1. Use a browser extension that allows geolocation on HTTP\n2. Set up a local HTTPS certificate\n3. Test on your live HTTPS site",
                                "yatra",
                              ),
                          );
                        } else {
                          alert(message);
                        }
                      },
                    );
                  } else {
                    alert(
                      __(
                        "Geolocation is not supported by your browser",
                        "yatra",
                      ),
                    );
                  }
                }}
                className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
              >
                <div className="w-3 h-3">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                {__("Use Current Location", "yatra")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label
                className={`text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1`}
              >
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                {__("Latitude", "yatra")}
              </label>
              <Input
                type="text"
                value={entry.location_latitude || ""}
                onChange={(e) =>
                  onFieldChange("location_latitude", e.target.value)
                }
                placeholder={__("e.g., -8.3405", "yatra")}
                className={`w-full text-sm`}
              />
            </div>
            <div className="space-y-2">
              <label
                className={`text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1`}
              >
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                {__("Longitude", "yatra")}
              </label>
              <Input
                type="text"
                value={entry.location_longitude || ""}
                onChange={(e) =>
                  onFieldChange("location_longitude", e.target.value)
                }
                placeholder={__("e.g., 115.0920", "yatra")}
                className={`w-full text-sm`}
              />
            </div>
          </div>
          <p className={`text-xs text-gray-500 dark:text-gray-400`}>
            {__(
              "Manual coordinate entry. These will be auto-filled when you select a location from the map above.",
              "yatra",
            )}
          </p>
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
            <option value="duration">{__("Duration Only", "yatra")}</option>
            <option value="flexible">{__("Flexible", "yatra")}</option>
          </Select>
        </div>

        {entry.time_type === "exact" && (
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

          {/* Gallery Section */}
          <div className="space-y-4">
            <div>
              <label
                className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}
              >
                {__("Photo Gallery", "yatra")}
              </label>
              <HelpText
                text={__("Add photos to showcase this activity", "yatra")}
                className="mb-2"
              />
              <MediaUpload
                items={localGallery}
                onChange={(mediaItems) => {
                  setLocalGallery(mediaItems); // Update local state immediately
                  onFieldChange("gallery", mediaItems); // Still call parent for data persistence
                }}
                maxItems={6}
                acceptTypes="images"
                title={__("Activity Photos", "yatra")}
                description={__(
                  "Upload photos to showcase this activity",
                  "yatra",
                )}
                className="w-full"
              />
            </div>
          </div>

          {/* Video Section */}
          <div className="space-y-4">
            <div>
              <label
                className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}
              >
                {__("Video URL", "yatra")}
              </label>
              <HelpText
                text={__(
                  "Add a video URL to showcase this activity (YouTube, Vimeo, etc.)",
                  "yatra",
                )}
                className="mb-2"
              />
              <input
                type="text"
                value={localVideoUrl}
                onChange={(e) => {
                  setLocalVideoUrl(e.target.value); // Update local state immediately
                  onFieldChange("video_url", e.target.value); // Still call parent for data persistence
                }}
                placeholder={__("https://youtube.com/watch?v=...", "yatra")}
                className={`flex h-11 w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-normal text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:ring-offset-gray-900 dark:placeholder:text-gray-500 dark:focus-visible:ring-blue-400 transition-colors ${textSize}`}
              />
              {errors.video_url && (
                <p
                  className={`mt-1.5 ${textSize} text-red-600 dark:text-red-400 flex items-center gap-1`}
                >
                  <Info className="w-4 h-4" />
                  {errors.video_url}
                </p>
              )}
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
    // Unicode-aware so Cyrillic / CJK / Devanagari names produce real slugs
    // instead of empty strings. \p{L}=letter, \p{N}=digit with the `u` flag.
    const slug = value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}-]+/gu, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
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
  // Hooks must run unconditionally on every render. The
  // "Item Type Required" gate that used to sit above these was
  // moved below so React's hook-order invariant holds even when
  // the gate flips between renders (e.g. parent selects a type
  // after the modal has mounted with no selection).
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

  // Check if item type is selected (moved here from before the hook
  // calls above — see rules-of-hooks. The "Item Type Required" empty
  // state still renders the same UI).
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

  // Auto-generate slug from name (same as main form)
  const handleNameChange = (value: string) => {
    // Unicode-aware so Cyrillic / CJK / Devanagari names produce real slugs
    // instead of empty strings. \p{L}=letter, \p{N}=digit with the `u` flag.
    const slug = value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}-]+/gu, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
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
