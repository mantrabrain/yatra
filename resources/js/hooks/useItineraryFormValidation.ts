/**
 * Custom hook for ItineraryForm validation logic
 */

import { __ } from '../lib/i18n';

export interface ItineraryFormData {
  trip_id: string;
  day: string;
  day_title?: string;
  item_type_id: string;
  item_id: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  start_time: string;
  end_time: string;
  time_type: string;
  cost: string;
  cost_per_person: boolean;
  notes: string;
  included_items: string[];
  excluded_items: string[];
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
    activityForms: ActivityForm[]
  ): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    if (!formData.trip_id) {
      newErrors.trip_id = __('Trip is required', 'Trip is required');
    }

    if (!formData.day || parseInt(formData.day) < 1) {
      newErrors.day = __('Day must be at least 1', 'Day must be at least 1');
    }

    // For day mode, validate trip and day, and only validate activities that have been started
    if (isAddDayMode) {
      // Only validate activity forms that have at least one field filled (user started filling it)
      // Empty activity forms will be skipped during save
      activityForms.forEach((activityForm, index) => {
        const hasAnyField = activityForm.data.item_type_id || 
                           activityForm.data.item_id || 
                           activityForm.data.title?.trim() ||
                           activityForm.data.description?.trim() ||
                           activityForm.data.location?.trim();
        
        // Only validate if user has started filling this activity
        if (hasAnyField) {
          if (!activityForm.data.item_type_id) {
            newErrors[`activity_${activityForm.id}_item_type_id`] = __('Item type is required for Activity', 'Item type is required for Activity') + ` ${index + 1}`;
          }
          if (!activityForm.data.item_id) {
            newErrors[`activity_${activityForm.id}_item_id`] = __('Item is required for Activity', 'Item is required for Activity') + ` ${index + 1}`;
          }
          if (!activityForm.data.title?.trim()) {
            newErrors[`activity_${activityForm.id}_title`] = __('Title is required for Activity', 'Title is required for Activity') + ` ${index + 1}`;
          }
        }
        // If activity form is completely empty, skip validation (it won't be saved)
      });
      return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
    }

    // For activity mode, validate activity fields
    if (!formData.item_type_id) {
      newErrors.item_type_id = __('Item type is required', 'Item type is required');
    }

    if (!formData.item_id) {
      newErrors.item_id = __('Item is required', 'Item is required');
    }

    if (!formData.title.trim()) {
      newErrors.title = __('Title is required', 'Title is required');
    }

    if (formData.time_type === 'exact' && formData.start_time && formData.end_time) {
      const [startHour, startMin] = formData.start_time.split(':').map(Number);
      const [endHour, endMin] = formData.end_time.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      if (endMinutes <= startMinutes && endMinutes < startMinutes + 60) {
        newErrors.end_time = __('End time must be after start time', 'End time must be after start time');
      }
    }

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  return { validateForm };
};

