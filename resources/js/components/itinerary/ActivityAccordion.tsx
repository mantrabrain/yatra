/**
 * Activity Accordion Component
 * Displays multiple activities in an accordion format for day mode.
 *
 * Reorder: each Card carries a drag-handle (GripVertical) that flips the parent
 * <Card> into draggable=true. Drag/drop uses HTML5's native dataTransfer API —
 * no extra library — and bubbles a fromIndex→toIndex change up via
 * onReorderActivities. The persistence is handled in the save flow by writing
 * the array index into the `order` smallint column on
 * yatra_new_trip_itinerary_day_entry; no new DB column is added.
 */

import React, { useState } from "react";
import { ChevronUp, ChevronDown, X, Plus, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ItineraryEntryFields } from "../trip-form/shared/ItineraryEntryFields";
import { __ } from "../../lib/i18n";
import { ActivityForm } from "../../hooks/useItineraryFormValidation";

interface ActivityAccordionProps {
  activityForms: ActivityForm[];
  errors: Record<string, string>;
  itemTypes: any[];
  items: any[];
  activityIncludedItems: Record<string, string>;
  activityExcludedItems: Record<string, string>;
  onToggleExpand: (activityId: string) => void;
  onRemoveActivity: (activityId: string) => void;
  onAddActivity: () => void;
  /**
   * Reorder activities. Optional so existing call sites that don't yet wire it
   * compile cleanly; without it the drag handle is hidden.
   */
  onReorderActivities?: (fromIndex: number, toIndex: number) => void;
  onFieldChange: (activityId: string, field: string, value: any) => void;
  onIncludedItemChange: (activityId: string, value: string) => void;
  onExcludedItemChange: (activityId: string, value: string) => void;
  onAddIncludedItem: (activityId: string) => void;
  onAddExcludedItem: (activityId: string) => void;
  onRemoveIncludedItem: (activityId: string, index: number) => void;
  onRemoveExcludedItem: (activityId: string, index: number) => void;
  calculateDuration: (
    startTime?: string,
    endTime?: string,
    timeType?: string,
  ) => string;
  onRefreshData?: () => void;
}

export const ActivityAccordion: React.FC<ActivityAccordionProps> = ({
  activityForms,
  errors,
  itemTypes,
  items,
  activityIncludedItems,
  activityExcludedItems,
  onToggleExpand,
  onRemoveActivity,
  onAddActivity,
  onReorderActivities,
  onFieldChange,
  onIncludedItemChange,
  onExcludedItemChange,
  onAddIncludedItem,
  onAddExcludedItem,
  onRemoveIncludedItem,
  onRemoveExcludedItem,
  calculateDuration,
  onRefreshData,
}) => {
  const reorderEnabled = typeof onReorderActivities === "function";

  // Indices used while a drag is in flight. Reset on drop / dragend / dragleave-of-list.
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    if (!reorderEnabled) return;
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Some browsers ignore drag events without dataTransfer.setData
    try {
      e.dataTransfer.setData("text/plain", String(index));
    } catch {
      // older Safari quirks — safe to ignore
    }
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    if (!reorderEnabled || draggingIndex === null) return;
    e.preventDefault(); // required to allow drop
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    if (!reorderEnabled || draggingIndex === null) return;
    e.preventDefault();
    if (draggingIndex !== index) {
      onReorderActivities?.(draggingIndex, index);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  return (
    <>
      {activityForms.length > 0 && (
        <div className="space-y-3">
          {activityForms.map((activityForm, index) => {
            const isDragging = draggingIndex === index;
            const isDropTarget =
              dragOverIndex === index && draggingIndex !== index;
            return (
              <Card
                key={activityForm.id}
                className={`mt-3 transition-shadow ${
                  isDragging ? "opacity-60" : ""
                } ${
                  isDropTarget ? "ring-2 ring-blue-400 dark:ring-blue-500" : ""
                }`}
                draggable={reorderEnabled}
                onDragStart={handleDragStart(index)}
                onDragOver={handleDragOver(index)}
                onDrop={handleDrop(index)}
                onDragEnd={handleDragEnd}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    {/*
                      Card header reads the activity's own title. Falls back to
                      "Activity #N" when the title is still blank (e.g. a
                      newly-added card). Truncated with min-w-0 + truncate so
                      long titles don't push the chevron / delete buttons off
                      the right edge of the card.
                    */}
                    <CardTitle className="text-base flex items-center gap-2 min-w-0 flex-1">
                      {reorderEnabled && (
                        // The drag-handle shows the row is draggable AND gives
                        // keyboard / mouse users an obvious target. The whole
                        // card is the drop zone; this is just the affordance.
                        <span
                          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                          title={__("Drag to reorder this activity", "yatra")}
                          aria-label={__(
                            "Drag to reorder this activity",
                            "yatra",
                          )}
                        >
                          <GripVertical className="w-4 h-4" />
                        </span>
                      )}
                      <span
                        className="truncate"
                        title={(activityForm.data.title || "").trim()}
                      >
                        {(activityForm.data.title || "").trim() ||
                          `${__("Activity", "yatra")} #${index + 1}`}
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleExpand(activityForm.id)}
                        className="h-8 w-8"
                      >
                        {activityForm.isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveActivity(activityForm.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400"
                        title={__("Remove Activity", "yatra")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {activityForm.isExpanded && (
                  <CardContent>
                    <ItineraryEntryFields
                      entry={{
                        item_type_id: activityForm.data.item_type_id || "",
                        item_id: activityForm.data.item_id || "",
                        title: activityForm.data.title || "",
                        description: activityForm.data.description || "",
                        location: activityForm.data.location || "",
                        location_latitude:
                          activityForm.data.location_latitude || "",
                        location_longitude:
                          activityForm.data.location_longitude || "",
                        duration: activityForm.data.duration || "",
                        start_time: activityForm.data.start_time || "",
                        end_time: activityForm.data.end_time || "",
                        time_type: (activityForm.data.time_type || "exact") as
                          | "exact"
                          | "duration"
                          | "flexible",
                        cost: activityForm.data.cost || "",
                        cost_per_person:
                          activityForm.data.cost_per_person !== false,
                        notes: activityForm.data.notes || "",
                        included_items: activityForm.data.included_items || [],
                        excluded_items: activityForm.data.excluded_items || [],
                      }}
                      errors={errors}
                      itemTypes={itemTypes}
                      items={items}
                      newIncludedItem={
                        activityIncludedItems[activityForm.id] || ""
                      }
                      newExcludedItem={
                        activityExcludedItems[activityForm.id] || ""
                      }
                      onFieldChange={(field: string, value: any) =>
                        onFieldChange(activityForm.id, field, value)
                      }
                      onIncludedItemChange={(value: string) =>
                        onIncludedItemChange(activityForm.id, value)
                      }
                      onExcludedItemChange={(value: string) =>
                        onExcludedItemChange(activityForm.id, value)
                      }
                      onAddIncludedItem={() =>
                        onAddIncludedItem(activityForm.id)
                      }
                      onAddExcludedItem={() =>
                        onAddExcludedItem(activityForm.id)
                      }
                      onRemoveIncludedItem={(idx: number) =>
                        onRemoveIncludedItem(activityForm.id, idx)
                      }
                      onRemoveExcludedItem={(idx: number) =>
                        onRemoveExcludedItem(activityForm.id, idx)
                      }
                      calculateDuration={calculateDuration}
                      size="default"
                      showCardWrapper={false}
                      onRefreshData={onRefreshData}
                    />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Activity Button - Below all activities */}
      <div className="mt-3">
        <Button
          type="button"
          variant="outline"
          onClick={onAddActivity}
          className="w-full flex items-center justify-center gap-2 border-dashed"
        >
          <Plus className="w-4 h-4" />
          {__("Add Activity", "yatra")}
        </Button>
      </div>
    </>
  );
};
