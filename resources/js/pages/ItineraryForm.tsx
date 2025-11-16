/**
 * Itinerary Form Page - Enhanced with Industry-Standard Features
 * Add/Edit Itinerary Entry form with location, duration, cost, notes, etc.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Info, Plus, ChevronUp, ChevronDown, X } from 'lucide-react';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { SearchableSelect } from '../components/ui/searchable-select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { HelpText } from '../components/ui/help-text';
import { Alert } from '../components/ui/alert';
import { ItineraryEntryFields } from '../components/trip-form/shared/ItineraryEntryFields';
import { apiClient } from '../lib/api';
import { useToast } from '../components/ui/toast';

interface ItineraryFormData {
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
  time_type: string; // 'exact', 'approximate', 'all_day', 'flexible'
  cost: string;
  cost_per_person: boolean;
  notes: string;
  included_items: string[];
  excluded_items: string[];
  status: string;
}

const ItineraryForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const isAddDayModeInitial = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || 'activity';
    const action = params.get('action') || 'create';
    const entryId = params.get('id');
    return action !== 'edit' && !entryId && mode === 'day';
  }, []);

  const [formData, setFormData] = useState<ItineraryFormData>({
    trip_id: '',
    day: '', // Will be auto-populated when trip is selected in day mode
    day_title: '',
    item_type_id: '',
    item_id: '',
    title: '',
    description: '',
    location: '',
    duration: '',
    start_time: '08:00',
    end_time: '17:00',
    time_type: 'exact',
    cost: '',
    cost_per_person: true,
    notes: '',
    included_items: [],
    excluded_items: [],
    status: isAddDayModeInitial ? 'publish' : 'draft', // Default to 'publish' for day creation, 'draft' for activities
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newIncludedItem, setNewIncludedItem] = useState('');
  const [newExcludedItem, setNewExcludedItem] = useState('');
  // Removed unused state: showActivityForm, daySaved (no longer needed with new flow)
  const [activityForms, setActivityForms] = useState<Array<{
    id: string;
    data: Partial<ItineraryFormData>;
    isExpanded: boolean;
  }>>([]); // Array of activity forms for day mode
  const [activityIncludedItems, setActivityIncludedItems] = useState<Record<string, string>>({});
  const [activityExcludedItems, setActivityExcludedItems] = useState<Record<string, string>>({});
  const [showDayConflictDialog, setShowDayConflictDialog] = useState(false);
  const [conflictDayNumber, setConflictDayNumber] = useState<number | null>(null);
  const [suggestedDayNumber, setSuggestedDayNumber] = useState<number | null>(null);
  // Track if user has manually edited the day field (to prevent auto-population from overriding user input)
  const dayManuallyEditedRef = useRef(false);
  const lastTripIdRef = useRef<string | null>(null);
  // Track which day's activities we've already loaded to prevent infinite loops
  const loadedDayActivitiesRef = useRef<string | null>(null);
  // Track which entry we've already loaded to prevent infinite loops
  const loadedEntryRef = useRef<number | null>(null);

  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const entryId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  const tripIdParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('trip_id');
  }, []);

  const dayParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('day');
  }, []);

  const typeParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('type');
  }, []);

  const typeIdParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('type_id');
  }, []);

  const itemParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('item');
  }, []);

  const modeParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') || 'activity'; // 'day' or 'activity'
  }, []);

  const isEditMode = action === 'edit' && entryId !== null;
  const isAddDayMode = modeParam === 'day'; // Day mode for both create and edit
  const isEditDayMode = isEditMode && modeParam === 'day';

  // Reset loaded refs when entry ID changes
  useEffect(() => {
    if (entryId) {
      // Reset both refs when entry ID changes
      if (loadedEntryRef.current !== entryId) {
        loadedEntryRef.current = null;
        loadedDayActivitiesRef.current = null;
      }
    }
  }, [entryId]);

  // Initialize from URL params
  useEffect(() => {
    if (tripIdParam) {
      setFormData(prev => ({ ...prev, trip_id: tripIdParam }));
      lastTripIdRef.current = tripIdParam; // Track initial trip ID
    }
    // Only set day from URL param if it's provided and not in day mode
    // In day mode, we'll auto-populate with next available day
    if (dayParam && !isAddDayMode) {
      setFormData(prev => ({ ...prev, day: dayParam }));
      dayManuallyEditedRef.current = true; // Day from URL is considered manual
    }
    // Handle type_id parameter (preferred - direct ID)
    if (typeIdParam) {
      setFormData(prev => ({ ...prev, item_type_id: typeIdParam }));
    } else if (typeParam) {
      // Fallback: Find type ID from name (for backward compatibility)
      const typeMap: Record<string, string> = {
        'Meal': '2',
        'Activity': '1',
        'Accommodation': '3',
        'Transportation': '4',
        'Rest': '5',
      };
      if (typeMap[typeParam]) {
        setFormData(prev => ({ ...prev, item_type_id: typeMap[typeParam] }));
      }
    }
    if (itemParam) {
      // This will be set after item_type_id is set and items are loaded
    }
  }, [tripIdParam, dayParam, typeParam, typeIdParam, itemParam]);

  // Fetch trips
  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ['trips-simple'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/trips', {
          params: {
            per_page: 100,
            status: 'all' // Get all trips for selection
          }
        });
        const trips = response?.data?.data || response?.data || response || [];
        return Array.isArray(trips) ? trips : [];
      } catch (error: any) {
        console.error('Failed to load trips:', error);
        return [];
      }
    },
    enabled: can('yatra_view_trips'),
  });

  // Fetch item types - only published ones are usable
  // Fetch item types - always fetch all published types
  const { data: typesData } = useQuery({
    queryKey: ['item-types-published'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/item-types', { 
          params: { 
            per_page: 100,
            status: 'publish' // Only get published item types
          } 
        });
        // Handle different response structures
        const types = response?.data?.data || response?.data || response || [];
        return Array.isArray(types) ? types : [];
      } catch (error: any) {
        console.error('Failed to load item types:', error);
        return [];
      }
    },
    enabled: can('yatra_view_trips'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Fetch items - in day mode fetch all items, in activity mode fetch by type
  // For day mode, we need all items to support multiple activities with different types
  const { data: itemsData } = useQuery({
    queryKey: isAddDayMode 
      ? ['items-all-published'] // Separate key for day mode to avoid refetch issues
      : ['items-by-type', formData.item_type_id],
    queryFn: async () => {
      try {
        // In day mode, fetch all items to support multiple activities
        if (isAddDayMode) {
          const response = await apiClient.get('/items', { 
            params: { 
              per_page: 1000, // Get all items for day mode
              status: 'publish' // Only get published items
            } 
          });
          // Handle different response structures
          const items = response?.data?.data || response?.data || response || [];
          return Array.isArray(items) ? items : [];
        }
        
        // In activity mode, fetch items for the selected type only
        if (!formData.item_type_id) return [];
        
        const response = await apiClient.get('/items', { 
          params: { 
            per_page: 1000,
            type_id: formData.item_type_id,
            status: 'publish' // Only get published items
          } 
        });
        // Handle different response structures
        const items = response?.data?.data || response?.data || response || [];
        return Array.isArray(items) ? items : [];
      } catch (error: any) {
        console.error('Failed to load items:', error);
        return [];
      }
    },
    enabled: can('yatra_view_trips'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Auto-select item from URL param
  useEffect(() => {
    if (itemParam && itemsData && itemsData.length > 0) {
      const item = itemsData.find((i: any) => i.name.toLowerCase() === itemParam.toLowerCase());
      if (item) {
        setFormData(prev => ({ ...prev, item_id: item.id.toString() }));
      }
    }
  }, [itemParam, itemsData]);

  // Fetch existing entry for edit mode
  const { data: entryData, isLoading: isLoadingEntry } = useQuery({
    queryKey: ['itinerary-entry', entryId],
    queryFn: async () => {
      if (!entryId) return null;
      try {
        const response = await apiClient.get(`/itinerary/${entryId}`);
        const data = response?.data?.data || response?.data || response;
        return data;
      } catch (error: any) {
        console.error('Failed to load itinerary entry:', error);
        showToast(error?.message || __('Failed to load itinerary entry', 'Failed to load itinerary entry'), 'error');
        return null;
      }
    },
    enabled: isEditMode && can('yatra_view_trips'),
  });

  // Extract stable primitive values from entryData to prevent infinite loops
  const entryTripId = useMemo(() => entryData?.trip_id, [entryData?.trip_id]);
  const entryDay = useMemo(() => entryData?.day, [entryData?.day]);

  // Fetch trip data for day editing to get all activities
  const { data: dayTripData } = useQuery({
    queryKey: ['trip-for-day-edit', entryTripId, entryDay],
    queryFn: async () => {
      if (!entryTripId || !isEditDayMode) return null;
      try {
        const response = await apiClient.get(`/trips/${entryTripId}`);
        return response?.data || response;
      } catch (error: any) {
        console.error('Failed to load trip data for day edit:', error);
        return null;
      }
    },
    enabled: isEditDayMode && !!entryTripId && !!entryDay && can('yatra_view_trips'),
  });

  // Load entry data into form when editing - with ref guard to prevent infinite loops
  useEffect(() => {
    if (!entryData || !isEditMode || !entryData.id) return;
    
    // Prevent re-loading the same entry
    if (loadedEntryRef.current === entryData.id) return;
    
    // Mark as loaded immediately
    loadedEntryRef.current = entryData.id;
    
    if (!isEditDayMode) {
      // For activity editing, load directly into formData
      setFormData({
        trip_id: entryData.trip_id?.toString() || '',
        day: entryData.day?.toString() || '',
        day_title: entryData.day_title || '',
        item_type_id: entryData.item_type_id?.toString() || '',
        item_id: entryData.item_id?.toString() || '',
        title: entryData.title || '',
        description: entryData.description || '',
        location: entryData.location || '',
        duration: entryData.duration || '',
        start_time: entryData.start_time || '08:00',
        end_time: entryData.end_time || '17:00',
        time_type: entryData.time_type || 'exact',
        cost: entryData.cost || '',
        cost_per_person: entryData.cost_per_person !== false,
        notes: entryData.notes || '',
        included_items: entryData.included_items || [],
        excluded_items: entryData.excluded_items || [],
        status: entryData.status || 'draft',
      });
    } else if (isEditDayMode) {
      // For day editing, load day info into formData
      setFormData(prev => ({
        ...prev,
        trip_id: entryData.trip_id?.toString() || prev.trip_id,
        day: entryData.day?.toString() || prev.day,
        day_title: entryData.day_title || prev.day_title,
        status: entryData.status || prev.status,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryData?.id, isEditMode, isEditDayMode]); // Use only entryData.id to prevent object reference changes

  // Load activities for day editing - run only once when all data is ready
  useEffect(() => {
    if (!isEditDayMode) return;
    if (!entryTripId || !entryDay) return;
    if (!dayTripData) return;
    
    // Create a unique key for this day
    const dayKey = `${entryTripId}-${entryDay}`;
    
    // Prevent re-loading if we've already loaded this day
    if (loadedDayActivitiesRef.current === dayKey) return;
    
    // Mark as loaded immediately (before any async operations)
    loadedDayActivitiesRef.current = dayKey;
    
    // Extract day number
    const dayNumber = typeof entryDay === 'string' ? parseInt(entryDay) : entryDay;
    if (isNaN(dayNumber as number)) return;
    
    // Find the day in trip data
    const itineraryDays = dayTripData.itinerary_days || [];
    const dayData = itineraryDays.find((d: any) => 
      (d.day_number || d.day) === dayNumber
    );
    
    if (!dayData || !dayData.entries) return;
    
    // Populate activity forms with all entries for this day
    const activities = dayData.entries
      .filter((e: any) => e.item_type_id && e.item_id) // Only entries with item_type_id and item_id
      .map((entry: any, index: number) => ({
        id: `activity-${entry.id || index}`,
        data: {
          item_type_id: entry.item_type_id?.toString() || '',
          item_id: entry.item_id?.toString() || '',
          title: entry.title || '',
          description: entry.description || '',
          location: entry.location || '',
          duration: entry.duration || '',
          start_time: entry.start_time || '08:00',
          end_time: entry.end_time || '17:00',
          time_type: entry.time_type || 'exact',
          cost: entry.cost || '',
          cost_per_person: entry.cost_per_person !== false,
          notes: entry.notes || '',
          included_items: entry.included_items || [],
          excluded_items: entry.excluded_items || [],
          status: entry.status || 'draft',
        },
        isExpanded: index === 0, // Expand first activity by default
      }));
    
    // Set state only once
    setActivityForms(activities);
    
    // Set included/excluded items for each activity
    const includedItems: Record<string, string> = {};
    const excludedItems: Record<string, string> = {};
    activities.forEach((activity: { id: string }) => {
      includedItems[activity.id] = '';
      excludedItems[activity.id] = '';
    });
    setActivityIncludedItems(includedItems);
    setActivityExcludedItems(excludedItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditDayMode, entryTripId, entryDay]); // dayTripData checked inside but not in deps to prevent infinite loops

  // Reset item_id when type changes
  useEffect(() => {
    if (formData.item_type_id) {
      setFormData(prev => ({ ...prev, item_id: '' }));
    }
  }, [formData.item_type_id]);

  const handleFieldChange = (field: keyof ItineraryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Track manual edits to day field
    if (field === 'day' && isAddDayMode) {
      dayManuallyEditedRef.current = true;
    }
    
    // When trip changes in day mode, reset day field and allow auto-population
    if (field === 'trip_id' && isAddDayMode) {
      setFormData(prev => ({ ...prev, day: '' }));
      dayManuallyEditedRef.current = false; // Allow auto-population for new trip
      lastTripIdRef.current = value; // Track the new trip ID
    }
  };

  const handleAddIncludedItem = () => {
    if (newIncludedItem.trim()) {
      setFormData(prev => ({
        ...prev,
        included_items: [...prev.included_items, newIncludedItem.trim()],
      }));
      setNewIncludedItem('');
    }
  };

  const handleRemoveIncludedItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      included_items: prev.included_items.filter((_, i) => i !== index),
    }));
  };

  const handleAddExcludedItem = () => {
    if (newExcludedItem.trim()) {
      setFormData(prev => ({
        ...prev,
        excluded_items: [...prev.excluded_items, newExcludedItem.trim()],
      }));
      setNewExcludedItem('');
    }
  };

  const handleRemoveExcludedItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      excluded_items: prev.excluded_items.filter((_, i) => i !== index),
    }));
  };

  const calculateDuration = (startTime?: string, endTime?: string, timeType?: string) => {
    const st = startTime || formData.start_time;
    const et = endTime || formData.end_time;
    const tt = timeType || formData.time_type;
    if (st && et && tt === 'exact') {
      const [startHour, startMin] = st.split(':').map(Number);
      const [endHour, endMin] = et.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      let diffMinutes = endMinutes - startMinutes;
      if (diffMinutes < 0) diffMinutes += 24 * 60; // Handle next day
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      if (hours > 0 && minutes > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
      } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
    }
    return '';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.trip_id) {
      newErrors.trip_id = __('Trip is required', 'Trip is required');
    }

    if (!formData.day || parseInt(formData.day) < 1) {
      newErrors.day = __('Day must be at least 1', 'Day must be at least 1');
    }

    // Don't check for duplicate day numbers here - we'll handle it in handleSubmit with a popup
    // The conflict check will be done in handleSubmit before calling validateForm

    // For day mode, validate trip and day, and all activity fields
    if (isAddDayMode) {
      // Validate all activity forms
      activityForms.forEach((activityForm, index) => {
        if (!activityForm.data.item_type_id) {
          newErrors[`activity_${activityForm.id}_item_type_id`] = __('Item type is required for Activity', 'Item type is required for Activity') + ` ${index + 1}`;
        }
        if (!activityForm.data.item_id) {
          newErrors[`activity_${activityForm.id}_item_id`] = __('Item is required for Activity', 'Item is required for Activity') + ` ${index + 1}`;
        }
        if (!activityForm.data.title?.trim()) {
          newErrors[`activity_${activityForm.id}_title`] = __('Title is required for Activity', 'Title is required for Activity') + ` ${index + 1}`;
        }
      });
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ItineraryFormData) => {
      // For day mode, create day and all activities
      if (isAddDayMode) {
        const tripId = parseInt(data.trip_id);
        const day = parseInt(data.day);
        const dayTitle = data.day_title?.trim() || null;
        
        // If no activities, create a minimal day entry first to ensure day is created
        if (activityForms.length === 0) {
          const payload = {
            trip_id: tripId,
            day: day,
            day_title: dayTitle,
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
            status: 'draft',
          };
          
          const response = await apiClient.post('/itinerary', payload);
          return response.data || response;
        }
        
        // Save all activities sequentially to ensure proper ordering and day creation
        const responses = [];
        for (let index = 0; index < activityForms.length; index++) {
          const activityForm = activityForms[index];
          const activityData = activityForm.data;
          
          // Validate required fields
          if (!activityData.item_type_id || !activityData.item_id || !activityData.title?.trim()) {
            throw new Error(`Activity ${index + 1} is missing required fields (item type, item, or title)`);
          }
          
          const payload = {
            trip_id: tripId,
            day: day,
            day_title: dayTitle, // Pass day_title with each activity to ensure day is created/updated
            item_type_id: parseInt(activityData.item_type_id),
            item_id: parseInt(activityData.item_id),
            title: activityData.title.trim(),
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
            console.error(`Error saving activity ${index + 1}:`, error);
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
        status: data.status,
      };

      if (isEditMode && entryId) {
        const response = await apiClient.put(`/itinerary/${entryId}`, payload);
        return response.data || response;
      } else {
        const response = await apiClient.post('/itinerary', payload);
        // If in day mode and adding activity, reset form for next activity (not used in current flow)
        if (false) {
          setFormData(prev => ({
            ...prev,
            item_type_id: '',
            item_id: '',
            title: '',
            description: '',
            location: '',
            duration: '',
            start_time: '08:00',
            end_time: '17:00',
            time_type: 'exact',
            cost: '',
            cost_per_person: true,
            notes: '',
            included_items: [],
            excluded_items: [],
          }));
          setNewIncludedItem('');
          setNewExcludedItem('');
          setErrors({});
        }
        return response.data || response;
      }
    },
    onSuccess: () => {
      // For day mode, show success message and navigate
      if (isAddDayMode) {
        const activityCount = activityForms.length;
        if (activityCount === 0) {
          showToast(__('Day created successfully!', 'Day created successfully!'), 'success');
        } else {
          showToast(
            __('Day and activities created successfully!', 'Day and activities created successfully!').replace('activities', `${activityCount} ${activityCount === 1 ? 'activity' : 'activities'}`),
            'success'
          );
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
        
        // Navigate back to itinerary page
        setTimeout(() => {
          window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary`;
        }, 1500);
        return;
      }
      
      // For activity mode or edit mode
      showToast(
        isEditMode 
          ? __('Itinerary entry updated successfully!', 'Itinerary entry updated successfully!')
          : __('Itinerary entry created successfully!', 'Itinerary entry created successfully!'),
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
      
      // Redirect after toast is shown (small delay to ensure toast is visible and cache is cleared)
      setTimeout(() => {
        const tripIdParam = formData.trip_id ? `&trip_id=${formData.trip_id}` : '';
        // Force a hard reload to ensure fresh data
        window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary${tripIdParam}`;
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving', 'An error occurred while saving');
      showToast(errorMessage, 'error');
      setErrors({ submit: errorMessage });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for day conflict in day mode before validation
    if (isAddDayMode && formData.trip_id && formData.day) {
      const dayNumber = parseInt(formData.day);
      if (!isNaN(dayNumber) && existingDayNumbers.includes(dayNumber)) {
        // Day number already exists - show confirmation dialog
        setConflictDayNumber(dayNumber);
        setSuggestedDayNumber(nextAvailableDayNumber);
        setShowDayConflictDialog(true);
        return; // Don't submit yet, wait for user confirmation
      }
    }
    
    // Proceed with normal validation and submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary`;
  };

  if (isEditMode && isLoadingEntry) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{__('Loading...', 'Loading...')}</span>
      </div>
    );
  }

  const types = typesData || [];
  const items = itemsData || [];

  // Fetch trip data to get day title when in activity mode, and to check existing days in day mode
  const { data: tripDataForDay } = useQuery({
    queryKey: ['trip-for-day', tripIdParam || formData.trip_id, dayParam],
    queryFn: async () => {
      const tripId = tripIdParam || formData.trip_id;
      if (!tripId) return null;
      try {
        const response = await apiClient.get(`/trips/${tripId}`);
        return response?.data || response;
      } catch (error) {
        console.error('Failed to fetch trip data:', error);
        return null;
      }
    },
    enabled: (!!tripIdParam || !!formData.trip_id) && (!isAddDayMode || !!formData.trip_id),
  });

  // Get day title from trip data
  const dayTitle = useMemo(() => {
    if (!tripDataForDay || !dayParam) return null;
    const itineraryDays = tripDataForDay.itinerary_days || [];
    const dayNumber = parseInt(dayParam);
    const day = itineraryDays.find((d: any) => 
      (d.day_number || d.day) === dayNumber
    );
    return day?.title || day?.day_title || null;
  }, [tripDataForDay, dayParam]);

  // Get existing day numbers for the trip (for day mode)
  const existingDayNumbers = useMemo(() => {
    if (!tripDataForDay || !isAddDayMode) return [];
    const itineraryDays = tripDataForDay.itinerary_days || [];
    const days = itineraryDays
      .map((d: any) => d.day_number || d.day)
      .filter((day: any) => day !== null && day !== undefined && !isNaN(Number(day)))
      .map((day: any) => Number(day))
      .sort((a: number, b: number) => a - b);
    return days;
  }, [tripDataForDay, isAddDayMode]);

  // Calculate next available day number
  const nextAvailableDayNumber = useMemo(() => {
    if (existingDayNumbers.length === 0) return 1;
    return Math.max(...existingDayNumbers) + 1;
  }, [existingDayNumbers]);

  // Auto-fill day number when trip is selected or changes in day mode
  useEffect(() => {
    if (isAddDayMode && formData.trip_id) {
      // Check if trip has changed (to allow auto-population on trip change)
      const tripChanged = lastTripIdRef.current !== formData.trip_id;
      if (tripChanged) {
        lastTripIdRef.current = formData.trip_id;
        dayManuallyEditedRef.current = false; // Reset manual edit flag when trip changes
      }
      
      // Wait for trip data to load before calculating next day
      // tripDataForDay will be undefined while loading, null if error, or an object if loaded
      // React Query ensures tripDataForDay matches the current trip_id via the query key
      if (tripDataForDay !== undefined && tripDataForDay !== null) {
        // Only auto-populate if:
        // 1. User hasn't manually edited the day field, AND
        // 2. Day field is empty or conflicts with existing days
        if (!dayManuallyEditedRef.current) {
          const currentDay = parseInt(formData.day) || 0;
          // Auto-populate if:
          // 1. Day field is empty, OR
          // 2. Current day number conflicts with existing days
          const shouldUpdate = !formData.day || 
                              formData.day === '' ||
                              existingDayNumbers.includes(currentDay);
          
          if (shouldUpdate && nextAvailableDayNumber) {
            setFormData(prev => ({ ...prev, day: nextAvailableDayNumber.toString() }));
          }
        }
      }
    } else if (isAddDayMode && !formData.trip_id) {
      // If trip is cleared, clear day field and reset flags
      setFormData(prev => ({ ...prev, day: '' }));
      dayManuallyEditedRef.current = false;
      lastTripIdRef.current = null;
    }
  }, [isAddDayMode, formData.trip_id, tripDataForDay, nextAvailableDayNumber, existingDayNumbers]);

  return (
    <div className="space-y-3">
      <PageHeader
        title={
          isEditMode 
            ? __('Edit Itinerary Entry', 'Edit Itinerary Entry') 
            : isAddDayMode
            ? __('Add New Day', 'Add New Day')
            : __('Add New Activity', 'Add New Activity')
        }
        description={
          isEditMode 
            ? __('Update itinerary entry information', 'Update itinerary entry information') 
            : isAddDayMode
            ? __('Create a new day entry for your trip itinerary. This will be the first activity of the new day.', 'Create a new day entry for your trip itinerary. This will be the first activity of the new day.')
            : __('Add a new activity, meal, or accommodation to this day of the trip itinerary.', 'Add a new activity, meal, or accommodation to this day of the trip itinerary.')
        }
        actions={
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {__('Back', 'Back')}
          </Button>
        }
      />

      <ConditionalRender capability="yatra_edit_trips">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 space-y-3">
              {/* Day Form - Show in day mode */}
              {isAddDayMode && (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{__('Day Information', 'Day Information')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="trip_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {__('Trip', 'Trip')} <span className="text-red-500">*</span>
                          </label>
                          <HelpText 
                            text={__('Select the trip this day belongs to.', 'Select the trip this day belongs to.')}
                            className="mb-2"
                          />
                          <SearchableSelect
                            value={formData.trip_id}
                            onChange={(value) => handleFieldChange('trip_id', value)}
                            options={[
                              { value: '', label: __('-- Select a Trip --', '-- Select a Trip --') },
                              ...((Array.isArray(tripsData) ? tripsData : []).map((trip: any) => ({
                                value: trip.id.toString(),
                                label: `${trip.title || trip.name || ''}${trip.trip_type === 'single_day' ? ' (Single Day)' : trip.trip_type === 'multi_day' ? ' (Multi-Day)' : ''}`,
                              })) || [])
                            ]}
                            placeholder={__('Search or select a trip...', 'Search or select a trip...')}
                            searchPlaceholder={__('Search by trip name or ID...', 'Search by trip name or ID...')}
                            className={errors.trip_id ? 'border-red-500' : ''}
                            error={!!errors.trip_id}
                            required
                            disabled={isLoadingTrips}
                          />
                          {errors.trip_id && (
                            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                              <Info className="w-4 h-4" />
                              {errors.trip_id}
                            </p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="day" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {__('Day Number', 'Day Number')} <span className="text-red-500">*</span>
                          </label>
                          <HelpText 
                            text={__('Which day number is this?', 'Which day number is this?')}
                            className="mb-2"
                          />
                          <Input
                            id="day"
                            type="number"
                            min="1"
                            value={formData.day}
                            onChange={(e) => handleFieldChange('day', e.target.value)}
                            className={errors.day ? 'border-red-500' : ''}
                            required
                          />
                          {errors.day && (
                            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                              <Info className="w-4 h-4" />
                              {errors.day}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="day_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {__('Day Title (Optional)', 'Day Title (Optional)')}
                        </label>
                        <HelpText 
                          text={__('A descriptive title for this day (e.g., "Arrival & Welcome to Paradise").', 'A descriptive title for this day (e.g., "Arrival & Welcome to Paradise").')}
                          className="mb-2"
                        />
                        <Input
                          id="day_title"
                          type="text"
                          value={formData.day_title}
                          onChange={(e) => handleFieldChange('day_title', e.target.value)}
                          placeholder={__('e.g., Arrival & Welcome to Paradise', 'e.g., Arrival & Welcome to Paradise')}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Multiple Activity Forms - Accordion style in day mode */}
                  {activityForms.length > 0 && (
                    <div className="space-y-3">
                      {activityForms.map((activityForm, index) => (
                        <Card key={activityForm.id} className="mt-3">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                {__('Activity', 'Activity')} {index + 1}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setActivityForms(prev => prev.map(af => 
                                      af.id === activityForm.id 
                                        ? { ...af, isExpanded: !af.isExpanded }
                                        : af
                                    ));
                                  }}
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
                                  onClick={() => {
                                    setActivityForms(prev => prev.filter(af => af.id !== activityForm.id));
                                    // Also clean up included/excluded items for this activity
                                    setActivityIncludedItems(prev => {
                                      const updated = { ...prev };
                                      delete updated[activityForm.id];
                                      return updated;
                                    });
                                    setActivityExcludedItems(prev => {
                                      const updated = { ...prev };
                                      delete updated[activityForm.id];
                                      return updated;
                                    });
                                  }}
                                  className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400"
                                  title={__('Remove Activity', 'Remove Activity')}
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
                                  item_type_id: activityForm.data.item_type_id || '',
                                  item_id: activityForm.data.item_id || '',
                                  title: activityForm.data.title || '',
                                  description: activityForm.data.description || '',
                                  location: activityForm.data.location || '',
                                  duration: activityForm.data.duration || '',
                                  start_time: activityForm.data.start_time || '08:00',
                                  end_time: activityForm.data.end_time || '17:00',
                                  time_type: (activityForm.data.time_type || 'exact') as 'exact' | 'approximate' | 'all_day' | 'flexible',
                                  cost: activityForm.data.cost || '',
                                  cost_per_person: activityForm.data.cost_per_person !== false,
                                  notes: activityForm.data.notes || '',
                                  included_items: activityForm.data.included_items || [],
                                  excluded_items: activityForm.data.excluded_items || [],
                                }}
                                errors={errors}
                                itemTypes={types}
                                items={items}
                                newIncludedItem={activityIncludedItems[activityForm.id] || ''}
                                newExcludedItem={activityExcludedItems[activityForm.id] || ''}
                                onFieldChange={(field, value) => {
                                  setActivityForms(prev => prev.map(af => 
                                    af.id === activityForm.id
                                      ? { ...af, data: { ...af.data, [field]: value } }
                                      : af
                                  ));
                                }}
                                onIncludedItemChange={(value) => {
                                  setActivityIncludedItems(prev => ({ ...prev, [activityForm.id]: value }));
                                }}
                                onExcludedItemChange={(value) => {
                                  setActivityExcludedItems(prev => ({ ...prev, [activityForm.id]: value }));
                                }}
                                onAddIncludedItem={() => {
                                  const item = activityIncludedItems[activityForm.id]?.trim();
                                  if (item) {
                                    setActivityForms(prev => prev.map(af => 
                                      af.id === activityForm.id
                                        ? { 
                                            ...af, 
                                            data: { 
                                              ...af.data, 
                                              included_items: [...(af.data.included_items || []), item]
                                            } 
                                          }
                                        : af
                                    ));
                                    setActivityIncludedItems(prev => ({ ...prev, [activityForm.id]: '' }));
                                  }
                                }}
                                onAddExcludedItem={() => {
                                  const item = activityExcludedItems[activityForm.id]?.trim();
                                  if (item) {
                                    setActivityForms(prev => prev.map(af => 
                                      af.id === activityForm.id
                                        ? { 
                                            ...af, 
                                            data: { 
                                              ...af.data, 
                                              excluded_items: [...(af.data.excluded_items || []), item]
                                            } 
                                          }
                                        : af
                                    ));
                                    setActivityExcludedItems(prev => ({ ...prev, [activityForm.id]: '' }));
                                  }
                                }}
                                onRemoveIncludedItem={(idx: number) => {
                                  setActivityForms(prev => prev.map(af => 
                                    af.id === activityForm.id
                                      ? { 
                                          ...af, 
                                          data: { 
                                            ...af.data, 
                                            included_items: (af.data.included_items || []).filter((_: any, i: number) => i !== idx)
                                          } 
                                        }
                                      : af
                                  ));
                                }}
                                onRemoveExcludedItem={(idx: number) => {
                                  setActivityForms(prev => prev.map(af => 
                                    af.id === activityForm.id
                                      ? { 
                                          ...af, 
                                          data: { 
                                            ...af.data, 
                                            excluded_items: (af.data.excluded_items || []).filter((_: any, i: number) => i !== idx)
                                          } 
                                        }
                                      : af
                                  ));
                                }}
                                calculateDuration={calculateDuration}
                                size="default"
                                showCardWrapper={false}
                              />
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Add Activity Button - Below all activities */}
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newActivityId = `activity_${Date.now()}`;
                        setActivityForms(prev => [...prev, {
                          id: newActivityId,
                          data: {
                            item_type_id: '',
                            item_id: '',
                            title: '',
                            description: '',
                            location: '',
                            duration: '',
                            start_time: '08:00',
                            end_time: '17:00',
                            time_type: 'exact',
                            cost: '',
                            cost_per_person: true,
                            notes: '',
                            included_items: [],
                            excluded_items: [],
                          },
                          isExpanded: true,
                        }]);
                      }}
                      className="w-full flex items-center justify-center gap-2 border-dashed"
                    >
                      <Plus className="w-4 h-4" />
                      {__('Add Activity', 'Add Activity')}
                    </Button>
                  </div>
                </>
              )}

              {/* Activity Form - Show in activity mode (standalone, not in day mode accordion) */}
              {!isAddDayMode && (
                <>
                  {/* Show trip/day info as read-only for activity mode when coming from itinerary page */}
                  {!isAddDayMode && tripIdParam && dayParam && (
                    <Card>
                      <CardContent className="p-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">{__('Trip:', 'Trip:')}</span>
                            <span className="ml-2 font-medium">
                              {tripsData?.find((t: any) => t.id.toString() === tripIdParam)?.title || tripIdParam}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">{__('Day:', 'Day:')}</span>
                            <span className="ml-2 font-medium">{dayParam}</span>
                          </div>
                          {dayTitle && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">{__('Day Title:', 'Day Title:')}</span>
                              <span className="ml-2 font-medium">{dayTitle}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <ItineraryEntryFields
                    entry={{
                      item_type_id: formData.item_type_id,
                      item_id: formData.item_id,
                      title: formData.title,
                      description: formData.description,
                      location: formData.location,
                      duration: formData.duration,
                      start_time: formData.start_time,
                      end_time: formData.end_time,
                      time_type: formData.time_type as 'exact' | 'approximate' | 'all_day' | 'flexible',
                      cost: formData.cost,
                      cost_per_person: formData.cost_per_person,
                      notes: formData.notes,
                      included_items: formData.included_items,
                      excluded_items: formData.excluded_items,
                    }}
                    errors={errors}
                    itemTypes={types}
                    items={items}
                    newIncludedItem={newIncludedItem}
                    newExcludedItem={newExcludedItem}
                    onFieldChange={(field, value) => handleFieldChange(field as keyof ItineraryFormData, value)}
                    onIncludedItemChange={setNewIncludedItem}
                    onExcludedItemChange={setNewExcludedItem}
                    onAddIncludedItem={handleAddIncludedItem}
                    onAddExcludedItem={handleAddExcludedItem}
                    onRemoveIncludedItem={handleRemoveIncludedItem}
                    onRemoveExcludedItem={handleRemoveExcludedItem}
                    calculateDuration={calculateDuration}
                    size="default"
                    showCardWrapper={true}
                  />
                </>
              )}
            </div>

            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Status', 'Status')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Entry Status', 'Entry Status')}
                    </label>
                    <HelpText 
                      text={__('Published entries are visible in trip schedules. Draft entries are saved but not visible. Trashed entries are deleted.', 'Published entries are visible in trip schedules. Draft entries are saved but not visible. Trashed entries are deleted.')}
                      className="mb-2"
                    />
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                      className="w-full"
                    >
                      <option value="draft">{__('Draft', 'Draft')}</option>
                      <option value="publish">{__('Publish', 'Publish')}</option>
                      <option value="trash">{__('Trash', 'Trash')}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {errors.submit && (
                      <Alert variant="error" title={__('Error', 'Error')}>
                        {errors.submit}
                      </Alert>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {__('Saving...', 'Saving...')}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {isEditMode 
                              ? __('Update Entry', 'Update Entry') 
                              : isAddDayMode
                              ? __('Create Day', 'Create Day')
                              : __('Create Activity', 'Create Activity')
                            }
                          </>
                        )}
                      </Button>
                      {!isAddDayMode && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isSubmitting}
                        >
                          {__('Cancel', 'Cancel')}
                        </Button>
                      )}
                    </div>
                    
                    {/* Add Activity Button - Show after day is saved in day mode */}
                    {false && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // After saving activity, reset form to add another activity
                          setFormData(prev => ({
                            ...prev,
                            item_type_id: '',
                            item_id: '',
                            title: '',
                            description: '',
                            location: '',
                            duration: '',
                            start_time: '08:00',
                            end_time: '17:00',
                            time_type: 'exact',
                            cost: '',
                            cost_per_person: true,
                            notes: '',
                            included_items: [],
                            excluded_items: [],
                          }));
                          setNewIncludedItem('');
                          setNewExcludedItem('');
                          setErrors({});
                        }}
                        className="w-full mt-2 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        {__('Add Another Activity', 'Add Another Activity')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </ConditionalRender>

      {/* Day Conflict Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDayConflictDialog}
        onClose={() => {
          setShowDayConflictDialog(false);
          setConflictDayNumber(null);
          setSuggestedDayNumber(null);
        }}
        onConfirm={() => {
          if (suggestedDayNumber !== null) {
            // Update day number with suggested day
            const updatedFormData = { ...formData, day: suggestedDayNumber.toString() };
            
            // Close dialog
            setShowDayConflictDialog(false);
            setConflictDayNumber(null);
            setSuggestedDayNumber(null);
            
            // Update form data with suggested day number
            setFormData(updatedFormData);
            
            // Validate and automatically save with the suggested day number
            // Create a validation function that uses the updated data
            const tempErrors: Record<string, string> = {};
            
            if (!updatedFormData.trip_id) {
              tempErrors.trip_id = __('Trip is required', 'Trip is required');
            }

            if (!updatedFormData.day || updatedFormData.day.trim() === '') {
              tempErrors.day = __('Day number is required', 'Day number is required');
            } else {
              const dayNumber = parseInt(updatedFormData.day);
              if (isNaN(dayNumber) || dayNumber < 1) {
                tempErrors.day = __('Day number must be a positive number', 'Day number must be a positive number');
              }
            }

            // Validate activities if any
            if (activityForms.length > 0) {
              activityForms.forEach((activityForm, index) => {
                if (!activityForm.data.item_type_id) {
                  tempErrors[`activity_${activityForm.id}_item_type_id`] = __('Item type is required for Activity', 'Item type is required for Activity') + ` ${index + 1}`;
                }
                if (!activityForm.data.item_id) {
                  tempErrors[`activity_${activityForm.id}_item_id`] = __('Item is required for Activity', 'Item is required for Activity') + ` ${index + 1}`;
                }
                if (!activityForm.data.title?.trim()) {
                  tempErrors[`activity_${activityForm.id}_title`] = __('Title is required for Activity', 'Title is required for Activity') + ` ${index + 1}`;
                }
              });
            }

            // If validation passes, save immediately
            if (Object.keys(tempErrors).length === 0) {
              setIsSubmitting(true);
              setErrors({});
              saveMutation.mutate(updatedFormData);
            } else {
              // Show validation errors
              setErrors(tempErrors);
              setIsSubmitting(false);
            }
          } else {
            setShowDayConflictDialog(false);
            setConflictDayNumber(null);
            setSuggestedDayNumber(null);
          }
        }}
        title={__('Day Number Already Exists', 'Day Number Already Exists')}
        message={
          conflictDayNumber !== null && suggestedDayNumber !== null && existingDayNumbers.length > 0
            ? (() => {
                // Format existing days list (e.g., "1, 2" or "1, 2, 3")
                const existingDaysList = existingDayNumbers.join(', ');
                return __('Day', 'Day') + ` ${existingDaysList} ` + __('already exists for this trip. Do you want to use day', 'already exists for this trip. Do you want to use day') + ` ${suggestedDayNumber} ` + __('instead?', 'instead?');
              })()
            : __('This day number already exists.', 'This day number already exists.')
        }
        confirmText={suggestedDayNumber !== null ? __('Use Day', 'Use Day') + ` ${suggestedDayNumber}` : __('OK', 'OK')}
        cancelText={__('Cancel', 'Cancel')}
        variant="warning"
      />
    </div>
  );
};

export default ItineraryForm;
