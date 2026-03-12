/**
 * Custom hook for ItineraryForm validation logic
 */

import { __ } from "../lib/i18n";

export interface ItineraryFormData {
  trip_id: string;
  day: string;
  day_title?: string;
  day_description?: string;
  item_type_id: string;
  item_id: string;
  title: string;
  description: string;
  location: string;
  location_latitude: string;
  location_longitude: string;
  duration: string;
  start_time: string;
  end_time: string;
  time_type: string;
  cost: string;
  cost_per_person: boolean;
  notes: string;
  included_items: string[];
  excluded_items: string[];
  gallery: any[];
  video_url: string;
  status: string;
}

export interface ActivityForm {
  id: string;
  entryId?: number | null; // The actual entry ID from database (for updates)
  data: Partial<ItineraryFormData>;
  isExpanded: boolean;
}

export const useItineraryFormValidation = () => {
  const validateForm = (
    formData: ItineraryFormData,
    isAddDayMode: boolean,
    activityForms: ActivityForm[],
  ): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    if (!formData.trip_id) {
      newErrors.trip_id = __("Trip is required", "yatra");
    }

    if (!formData.day || parseInt(formData.day) < 1) {
      newErrors.day = __("Day must be at least 1", "yatra");
    }

    // For day mode, validate trip and day, and all activity fields
    if (isAddDayMode) {
      // Validate all activity forms
      activityForms.forEach((activityForm, index) => {
        if (!activityForm.data.item_type_id) {
          newErrors[`activity_${activityForm.id}_item_type_id`] =
            __("Item type is required for Activity", "yatra") + ` ${index + 1}`;
        }
        if (!activityForm.data.item_id) {
          newErrors[`activity_${activityForm.id}_item_id`] =
            __("Item is required for Activity", "yatra") + ` ${index + 1}`;
        }
        if (!activityForm.data.title?.trim()) {
          newErrors[`activity_${activityForm.id}_title`] =
            __("Title is required for Activity", "yatra") + ` ${index + 1}`;
        }
      });
      return {
        isValid: Object.keys(newErrors).length === 0,
        errors: newErrors,
      };
    }

    // For activity mode, validate activity fields
    if (!formData.item_type_id) {
      newErrors.item_type_id = __("Item type is required", "yatra");
    }

    if (!formData.item_id) {
      newErrors.item_id = __("Item is required", "yatra");
    }

    if (!formData.title.trim()) {
      newErrors.title = __("Title is required", "yatra");
    }

    if (
      formData.time_type === "exact" &&
      formData.start_time &&
      formData.end_time
    ) {
      const [startHour, startMin] = formData.start_time.split(":").map(Number);
      const [endHour, endMin] = formData.end_time.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      if (endMinutes <= startMinutes && endMinutes < startMinutes + 60) {
        newErrors.end_time = __("End time must be after start time", "yatra");
      }
    }

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  return { validateForm };
};
