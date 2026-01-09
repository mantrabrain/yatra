/**
 * Custom hook for ItineraryForm save/mutation logic
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { useToast } from '../components/ui/toast';
import { __ } from '../lib/i18n';
import { ItineraryFormData, ActivityForm } from './useItineraryFormValidation';

interface UseItineraryFormSaveParams {
  isAddDayMode: boolean;
  isEditMode: boolean;
  entryId: number | null;
  activityForms: ActivityForm[];
  formData: ItineraryFormData;
  calculateDuration: (startTime?: string, endTime?: string, timeType?: string) => string;
  entryData?: any; // Entry data to check if it's a day entry
  dayTripData?: any; // Trip data to find day entry
  tripsData?: any[]; // Trips data to check trip type
}

export const useItineraryFormSave = ({
  isAddDayMode,
  isEditMode,
  entryId,
  activityForms,
  formData,
  calculateDuration,
  entryData,
  dayTripData,
  tripsData,
}: UseItineraryFormSaveParams) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async (data: ItineraryFormData) => {
      // For day mode, create day and all activities
      if (isAddDayMode) {
        const tripId = parseInt(data.trip_id);
        const day = parseInt(data.day);
        const dayTitle = data.day_title?.trim() || null;
        
        // In edit mode, update the day entry itself first (only day info, not activities)
        if (isEditMode && entryId) {
          // Only send day-specific fields to avoid updating activity titles
          // The backend requires 'title' field, so we set it to day_title
          const dayPayload: any = {
            trip_id: tripId,
            day: day,
            day_title: dayTitle,
            day_description: data.day_description?.trim() || null,
            title: dayTitle || `Day ${day}`, // Backend requires title field
            item_type_id: null,
            item_id: null,
            status: data.status || 'draft',
          };
          
          // When editing, we MUST find the day entry ID - never use POST for updates
          // Find the day entry ID from the data we already have
          // IMPORTANT: Use the ORIGINAL day number from entryData, not the new day from formData
          let dayEntryId: number | null = null;
          
          // First, check if entryData is a day entry (has null item_type_id and item_id)
          if (entryData && 
              (entryData.item_type_id === null || entryData.item_type_id === undefined) &&
              (entryData.item_id === null || entryData.item_id === undefined)) {
            dayEntryId = entryData.id ? parseInt(entryData.id.toString()) : null;
          }
          
          // If entryData has day_id, query the backend to get the day entry ID
          // This is the most reliable way when entryData is an activity
          if (!dayEntryId && entryData && entryData.day_id) {
            try {
              const dayEntryResponse = await apiClient.get(`/itinerary/day-entry-by-day-id/${entryData.day_id}`);
              const dayEntryData = dayEntryResponse?.data || dayEntryResponse;
              if (dayEntryData && dayEntryData.day_entry_id) {
                dayEntryId = parseInt(dayEntryData.day_entry_id.toString());
              }
            } catch (error) {
              // Silently fail and try other methods
              // Error is logged by the API client if needed
            }
          }
          
          // If still not found and we have dayTripData, try to find from dayTripData
          if (!dayEntryId && entryData && entryData.day_id && dayTripData) {
            const itineraryDays = dayTripData.itinerary_days || [];
            // Find the day that matches entryData.day_id
            for (const dayData of itineraryDays) {
              // Check if this day's id matches entryData.day_id
              if (dayData.id === entryData.day_id || dayData.day_id === entryData.day_id) {
                if (dayData.entries) {
                  // Find entry with null item_type_id/item_id (the day entry)
                  const dayEntry = dayData.entries.find((e: any) => 
                    (e.item_type_id === null || e.item_type_id === undefined) &&
                    (e.item_id === null || e.item_id === undefined)
                  );
                  if (dayEntry && dayEntry.id) {
                    dayEntryId = parseInt(dayEntry.id.toString());
                    break;
                  }
                }
              }
            }
          }
          
          // If still not found, try to find from dayTripData using ORIGINAL day number
          // Use entryData.day (original) to find the day entry, not formData.day (new)
          const originalDay = entryData?.day ? parseInt(entryData.day.toString()) : null;
          if (!dayEntryId && dayTripData && originalDay) {
            const itineraryDays = dayTripData.itinerary_days || [];
            const dayData = itineraryDays.find((d: any) => 
              (d.day_number || d.day) === originalDay
            );
            if (dayData && dayData.entries) {
              const dayEntry = dayData.entries.find((e: any) => 
                (e.item_type_id === null || e.item_type_id === undefined) &&
                (e.item_id === null || e.item_id === undefined)
              );
              if (dayEntry && dayEntry.id) {
                dayEntryId = parseInt(dayEntry.id.toString());
              }
            }
          }
          
          // In edit mode, we MUST have a day entry ID - never use POST
          // If day entry doesn't exist, it's an error (should have been created when day was created)
          if (!dayEntryId) {
            throw new Error('Day entry not found. The day entry should exist when editing. Please refresh the page and try again, or contact support if the issue persists.');
          }
          
          // In edit mode, ALWAYS use PUT - never POST
          const dayResponse = await apiClient.put(`/itinerary/${dayEntryId}`, dayPayload);

          const buildActivityPayload = (activityData: ActivityForm['data']) => ({
            trip_id: tripId,
            day: day,
            day_title: dayTitle,
            item_type_id: parseInt(activityData.item_type_id!),
            item_id: parseInt(activityData.item_id!),
            title: activityData.title!.trim(),
            description: (activityData.description || '').trim(),
            location: (activityData.location || '').trim(),
            duration:
              (activityData.duration || '').trim() ||
              (activityData.start_time &&
              activityData.end_time &&
              activityData.time_type === 'exact'
                ? calculateDuration(activityData.start_time, activityData.end_time, activityData.time_type)
                : null),
            start_time: activityData.start_time || '08:00',
            end_time: activityData.end_time || '17:00',
            time_type: activityData.time_type || 'exact',
            cost: activityData.cost ? parseFloat(activityData.cost) : null,
            cost_per_person: activityData.cost_per_person !== false,
            notes: (activityData.notes || '').trim(),
            included_items: Array.isArray(activityData.included_items) ? activityData.included_items : [],
            excluded_items: Array.isArray(activityData.excluded_items) ? activityData.excluded_items : [],
            status: activityData.status || 'draft',
          });

          const existingActivities = activityForms.filter(af => af.entryId);
          for (let index = 0; index < existingActivities.length; index++) {
            const activityForm = existingActivities[index];
            const activityData = activityForm.data;

            if (!activityData.item_type_id || !activityData.item_id || !activityData.title?.trim()) {
              throw new Error(`Activity ${index + 1} is missing required fields (item type, item, or title)`);
            }

            const payload = buildActivityPayload(activityData);
            const activityEntryId = typeof activityForm.entryId === 'string'
              ? parseInt(activityForm.entryId, 10)
              : activityForm.entryId;

            if (!activityEntryId) {
              throw new Error(`Activity ${index + 1} is missing an entry ID for update.`);
            }

            try {
              await apiClient.put(`/itinerary/${activityEntryId}`, payload);
            } catch (error: any) {
              throw new Error(`Failed to update activity ${index + 1}: ${error?.message || 'Unknown error'}`);
            }
          }
          
          const newActivities = activityForms.filter(af => !af.entryId);
          
          if (newActivities.length > 0) {
            const responses = [dayResponse.data || dayResponse];
            for (let index = 0; index < newActivities.length; index++) {
              const activityForm = newActivities[index];
              const activityData = activityForm.data;
              
              if (!activityData.item_type_id || !activityData.item_id || !activityData.title?.trim()) {
                throw new Error(`Activity ${index + 1} is missing required fields (item type, item, or title)`);
              }
              
              const payload = buildActivityPayload(activityData);
              
              try {
                const response = await apiClient.post('/itinerary', payload);
                responses.push(response.data || response);
              } catch (error: any) {
                throw new Error(`Failed to save activity ${index + 1}: ${error?.message || 'Unknown error'}`);
              }
            }
            return responses[0];
          }
          
          return dayResponse.data || dayResponse;
        }
        
        // Create mode: create day and all activities
        // Filter out empty/invalid activities (those missing required fields)
        const validActivities = activityForms.filter(af => {
          const activityData = af.data;
          return activityData.item_type_id && 
                 activityData.item_id && 
                 activityData.title?.trim();
        });
        
        // If no valid activities, create only the day entry
        if (validActivities.length === 0) {
          const payload = {
            trip_id: tripId,
            day: day,
            day_title: dayTitle,
            day_description: data.day_description?.trim() || null,
            item_type_id: null,
            item_id: null,
            title: dayTitle || `Day ${day}`,
            description: '',
            location: null,
            duration: null,
            start_time: null,
            end_time: null,
            time_type: 'exact',
            cost: null,
            cost_per_person: false,
            notes: null,
            included_items: [],
            excluded_items: [],
            status: data.status || 'draft',
          };
          
          const response = await apiClient.post('/itinerary', payload);
          return response.data || response;
        }
        
        // Save all valid activities sequentially to ensure proper ordering and day creation
        const responses = [];
        for (let index = 0; index < validActivities.length; index++) {
          const activityForm = validActivities[index];
          const activityData = activityForm.data;
          
          const payload = {
            trip_id: tripId,
            day: day,
            day_title: dayTitle,
            item_type_id: parseInt(activityData.item_type_id!),
            item_id: parseInt(activityData.item_id!),
            title: activityData.title!.trim(),
            description: (activityData.description || '').trim(),
            location: (activityData.location || '').trim(),
            duration: (activityData.duration || '').trim() || (activityData.start_time && activityData.end_time && activityData.time_type === 'exact' ? calculateDuration(activityData.start_time, activityData.end_time, activityData.time_type) : null),
            start_time: activityData.start_time || '08:00',
            end_time: activityData.end_time || '17:00',
            time_type: activityData.time_type || 'exact',
            cost: activityData.cost ? parseFloat(activityData.cost) : null,
            cost_per_person: activityData.cost_per_person !== false,
            notes: (activityData.notes || '').trim(),
            included_items: Array.isArray(activityData.included_items) ? activityData.included_items : [],
            excluded_items: Array.isArray(activityData.excluded_items) ? activityData.excluded_items : [],
            status: activityData.status || 'draft',
          };
          
          try {
            const response = await apiClient.post('/itinerary', payload);
            responses.push(response.data || response);
          } catch (error: any) {
            throw new Error(`Failed to save activity ${index + 1}: ${error?.message || 'Unknown error'}`);
          }
        }
        
        // Return the first response (contains day info)
        return responses[0] || responses;
      }
      
      // For activity mode, use all fields
      const payload = {
        trip_id: parseInt(data.trip_id),
        day: parseInt(data.day),
        day_title: data.day_title?.trim() || null,
        item_type_id: parseInt(data.item_type_id),
        item_id: parseInt(data.item_id),
        title: data.title.trim(),
        description: data.description.trim(),
        location: data.location.trim(),
        duration: data.duration.trim() || calculateDuration(),
        start_time: data.start_time,
        end_time: data.end_time,
        time_type: data.time_type,
        cost: data.cost ? parseFloat(data.cost) : null,
        cost_per_person: data.cost_per_person,
        notes: data.notes.trim(),
        included_items: data.included_items,
        excluded_items: data.excluded_items,
        status: data.status || 'draft', // Ensure status is always included
      };

      if (isEditMode && entryId) {
        // Ensure status is explicitly included in update payload
        const updatePayload = {
          ...payload,
          status: data.status || 'draft', // Explicitly include status for updates
        };
        const response = await apiClient.put(`/itinerary/${entryId}`, updatePayload);
        return response.data || response;
      } else {
        const response = await apiClient.post('/itinerary', payload);
        return response.data || response;
      }
    },
    onSuccess: () => {
      // For day mode, show success message and navigate
      if (isAddDayMode) {
        // Count only valid activities (those with required fields filled)
        const validActivitiesCount = activityForms.filter(af => {
          const activityData = af.data;
          return activityData.item_type_id && 
                 activityData.item_id && 
                 activityData.title?.trim();
        }).length;
        
        // Check if it's a single-day trip for dynamic messages
        const selectedTrip = tripsData?.find((t: any) => t.id.toString() === formData.trip_id);
        const isSingleDay = selectedTrip?.trip_type === 'single_day';
        
        if (isEditMode) {
          // Edit mode messages - dynamic based on trip type
          if (validActivitiesCount === 0) {
            const message = isSingleDay 
              ? __('Entry updated successfully!', 'yatra')
              : __('Day updated successfully!', 'yatra');
            showToast(message, 'success');
          } else {
            const message = isSingleDay
              ? __('Entry and activities updated successfully!', 'yatra').replace('activities', `${validActivitiesCount} ${validActivitiesCount === 1 ? 'activity' : 'activities'}`)
              : __('Day and activities updated successfully!', 'yatra').replace('activities', `${validActivitiesCount} ${validActivitiesCount === 1 ? 'activity' : 'activities'}`);
            showToast(message, 'success');
          }
        } else {
          // Create mode messages - dynamic based on trip type
          if (validActivitiesCount === 0) {
            const message = isSingleDay 
              ? __('Entry created successfully!', 'yatra')
              : __('Day created successfully!', 'yatra');
            showToast(message, 'success');
          } else {
            const message = isSingleDay
              ? __('Entry and activities created successfully!', 'yatra').replace('activities', `${validActivitiesCount} ${validActivitiesCount === 1 ? 'activity' : 'activities'}`)
              : __('Day and activities created successfully!', 'yatra').replace('activities', `${validActivitiesCount} ${validActivitiesCount === 1 ? 'activity' : 'activities'}`);
            showToast(message, 'success');
          }
        }
        
        // Invalidate all itinerary-related queries
        queryClient.invalidateQueries({ queryKey: ['itinerary'] });
        queryClient.invalidateQueries({ queryKey: ['itinerary-entries'] });
        queryClient.invalidateQueries({ queryKey: ['trips'] });
        queryClient.invalidateQueries({ queryKey: ['trips-simple'] });
        
        // Also invalidate the specific trip query if we have trip_id
        if (formData.trip_id) {
          queryClient.invalidateQueries({ 
            queryKey: ['trips', parseInt(formData.trip_id)] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['trip', parseInt(formData.trip_id)] 
          });
        }
        
        // Navigate back to itinerary page with trip_id and day parameters for auto-selection
        const day = parseInt(formData.day);
        const tripId = formData.trip_id;
        setTimeout(() => {
          const params = new URLSearchParams({
            trip_id: tripId,
            day: day.toString(),
          });
          window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&${params.toString()}`;
        }, 1500);
        return;
      }
      
      // For activity mode or edit mode
      showToast(
        isEditMode 
          ? __('Itinerary entry updated successfully!', 'yatra')
          : __('Itinerary entry created successfully!', 'yatra'),
        'success'
      );
      
      // Invalidate all itinerary-related queries
      queryClient.invalidateQueries({ queryKey: ['itinerary'] });
      queryClient.invalidateQueries({ queryKey: ['itinerary-entries'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trips-simple'] });
      
      // Also invalidate the specific trip query if we have trip_id
      if (formData.trip_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['trips', parseInt(formData.trip_id)] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['trip', parseInt(formData.trip_id)] 
        });
        // Force refetch the trip data
        queryClient.refetchQueries({ 
          queryKey: ['trips', parseInt(formData.trip_id)] 
        });
      }
      
      // Force refetch all trips to ensure fresh data
      queryClient.refetchQueries({ queryKey: ['trips'] });
      queryClient.refetchQueries({ queryKey: ['trips-simple'] });
      
      // Redirect after toast is shown
      setTimeout(() => {
        const tripIdParam = formData.trip_id ? `&trip_id=${formData.trip_id}` : '';
        window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary${tripIdParam}`;
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving', 'yatra');
      showToast(errorMessage, 'error');
    },
  });

  return { saveMutation };
};

