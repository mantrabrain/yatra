/**
 * Itinerary Form Page - Refactored with separated concerns
 * Add/Edit Itinerary Entry form with location, duration, cost, notes, etc.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { HelpText } from '../components/ui/help-text';
import { Alert } from '../components/ui/alert';
import { ItineraryEntryFields } from '../components/trip-form/shared/ItineraryEntryFields';
import { useItineraryFormData } from '../hooks/useItineraryFormData';
import { useItineraryFormValidation, ItineraryFormData, ActivityForm } from '../hooks/useItineraryFormValidation';
import { useItineraryFormSave } from '../hooks/useItineraryFormSave';
import { DayFormFields } from '../components/itinerary/DayFormFields';
import { ActivityAccordion } from '../components/itinerary/ActivityAccordion';
import { DayConflictDialog } from '../components/itinerary/DayConflictDialog';
import { ItineraryFormSkeleton } from '../components/itinerary/ItineraryFormSkeleton';

const ItineraryForm: React.FC = () => {
  
  // URL Parameters
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
    return params.get('mode') || 'activity';
  }, []);

  const isEditMode = action === 'edit' && entryId !== null;
  const isAddDayMode = modeParam === 'day';
  const isEditDayMode = isEditMode && modeParam === 'day';
  const isAddDayModeInitial = useMemo(() => {
    return action !== 'edit' && !entryId && modeParam === 'day';
  }, [action, entryId, modeParam]);

  // Form State
  const [formData, setFormData] = useState<ItineraryFormData>({
    trip_id: '',
    day: '',
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
    status: isAddDayModeInitial ? 'publish' : 'draft',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newIncludedItem, setNewIncludedItem] = useState('');
  const [newExcludedItem, setNewExcludedItem] = useState('');
  const [activityForms, setActivityForms] = useState<ActivityForm[]>([]);
  const [activityIncludedItems, setActivityIncludedItems] = useState<Record<string, string>>({});
  const [activityExcludedItems, setActivityExcludedItems] = useState<Record<string, string>>({});
  const [showDayConflictDialog, setShowDayConflictDialog] = useState(false);
  const [conflictDayNumber, setConflictDayNumber] = useState<number | null>(null);
  const [suggestedDayNumber, setSuggestedDayNumber] = useState<number | null>(null);
  const [originalDayNumber, setOriginalDayNumber] = useState<number | null>(null); // Track original day number when editing

  // Refs for preventing infinite loops
  const dayManuallyEditedRef = useRef(false);
  const lastTripIdRef = useRef<string | null>(null);
  const loadedDayActivitiesRef = useRef<string | null>(null);
  const initializedEntryIdRef = useRef<number | null>(null);

  // Fetch all data using custom hook
  const {
    tripsData,
    isLoadingTrips,
    typesData,
    itemsData,
    entryData,
    isLoadingEntry,
    dayTripData,
    effectiveTripData,
    entryTripId,
    entryDay,
  } = useItineraryFormData({
    entryId,
    isEditMode,
    isEditDayMode,
    isAddDayMode,
    tripIdParam,
    dayParam,
    formDataItemTypeId: formData.item_type_id,
    formDataTripId: formData.trip_id || undefined,
  });

  // Validation hook
  const { validateForm } = useItineraryFormValidation();

  // Calculate duration helper
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
      if (diffMinutes < 0) diffMinutes += 24 * 60;
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

  // Save hook
  const { saveMutation } = useItineraryFormSave({
    isAddDayMode,
    isEditMode,
    entryId,
    activityForms,
    formData,
    calculateDuration,
    entryData,
    dayTripData,
    tripsData,
  });

  // Reset refs when entry ID changes
  useEffect(() => {
    if (entryId !== initializedEntryIdRef.current) {
      initializedEntryIdRef.current = null;
      loadedDayActivitiesRef.current = null;
      isLoadingInitialDataRef.current = false;
    }
  }, [entryId]);

  // Initialize from URL params
  useEffect(() => {
    if (tripIdParam) {
      setFormData(prev => ({ ...prev, trip_id: tripIdParam }));
      lastTripIdRef.current = tripIdParam;
    }
    if (dayParam && !isAddDayMode) {
      setFormData(prev => ({ ...prev, day: dayParam }));
      dayManuallyEditedRef.current = true;
    }
    if (typeIdParam) {
      setFormData(prev => ({ ...prev, item_type_id: typeIdParam }));
    }
  }, [tripIdParam, dayParam, typeIdParam, isAddDayMode]);

  // Auto-select item from URL param
  useEffect(() => {
    if (itemParam && itemsData && itemsData.length > 0) {
      const item = itemsData.find((i: any) => i.name.toLowerCase() === itemParam.toLowerCase());
      if (item) {
        setFormData(prev => ({ ...prev, item_id: item.id.toString() }));
      }
    }
  }, [itemParam, itemsData]);

  // Load entry data into form when editing
  useEffect(() => {
    if (!isEditMode) return;
    if (!entryData || !entryData.id) return;
    
    // In edit day mode, if entryData is an activity (has item_type_id and item_id), 
    // we should wait for the day entry to be loaded (effectiveEntryData will be the day entry)
    if (isEditDayMode) {
      const isActivityEntry = entryData.item_type_id !== null && 
                             entryData.item_type_id !== undefined && 
                             entryData.item_id !== null && 
                             entryData.item_id !== undefined;
      // If it's an activity, wait - the hook will fetch the day entry and update entryData
      if (isActivityEntry) {
        // Check if this is the same activity we've already processed
        if (initializedEntryIdRef.current === entryData.id) return;
        // Otherwise, wait for day entry to load
        return;
      }
    }
    
    // Prevent re-loading the same entry
    if (initializedEntryIdRef.current === entryData.id) return;
    
    // Mark as loading initial data
    isLoadingInitialDataRef.current = true;
    
    // Mark as initialized immediately (before any state updates)
    initializedEntryIdRef.current = entryData.id;
    
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
      // For day editing, entryData should now be the day entry (thanks to effectiveEntryData in useItineraryFormData)
      // Load all day info into formData
      const dayNumber = entryData.day ? parseInt(entryData.day.toString()) : null;
      setOriginalDayNumber(dayNumber);
      
      setFormData(prev => ({
        ...prev,
        trip_id: entryData.trip_id?.toString() || tripIdParam || prev.trip_id,
        day: entryData.day?.toString() || dayParam || prev.day,
        day_title: entryData.day_title || prev.day_title,
        status: entryData.status || prev.status,
      }));
    }
    
    // Clear loading flag after form data is set
    setTimeout(() => {
      isLoadingInitialDataRef.current = false;
    }, 100);
  }, [entryId, isEditMode, isEditDayMode, entryData, tripIdParam, dayParam, dayTripData]); // Include entryData to trigger when data arrives

  // Load activities for day editing
  useEffect(() => {
    if (!isEditDayMode) return;
    if (!entryTripId || !entryDay) return;
    if (!dayTripData) return;
    
    const dayKey = `${entryTripId}-${entryDay}`;
    if (loadedDayActivitiesRef.current === dayKey) return;
    
    loadedDayActivitiesRef.current = dayKey;
    
    const dayNumber = typeof entryDay === 'string' ? parseInt(entryDay) : entryDay;
    if (isNaN(dayNumber as number)) return;
    
    const itineraryDays = dayTripData.itinerary_days || [];
    const dayData = itineraryDays.find((d: any) => 
      (d.day_number || d.day) === dayNumber
    );
    
    if (!dayData || !dayData.entries) return;
    
    const activities = dayData.entries
      .filter((e: any) => e.item_type_id && e.item_id)
      .map((entry: any, index: number) => ({
        id: `activity-${entry.id || index}`,
        entryId: entry.id ? parseInt(entry.id.toString()) : null, // Store actual entry ID for updates
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
        isExpanded: index === 0,
      }));
    
    setActivityForms(activities);
    
    const includedItems: Record<string, string> = {};
    const excludedItems: Record<string, string> = {};
    activities.forEach((activity: { id: string }) => {
      includedItems[activity.id] = '';
      excludedItems[activity.id] = '';
    });
    setActivityIncludedItems(includedItems);
    setActivityExcludedItems(excludedItems);
  }, [isEditDayMode, entryTripId, entryDay, dayTripData]);

  // Track if we're loading initial data to prevent item_id reset during load
  const isLoadingInitialDataRef = useRef(false);
  
  // Reset item_id when type changes (but not during initial data load)
  useEffect(() => {
    // Don't reset during initial data load
    if (isLoadingInitialDataRef.current) return;
    
    // Only reset if item_type_id changes and item_id is set
    // This allows users to change item type and forces them to select a new item
    if (formData.item_type_id && formData.item_id) {
      // Check if we need to reset - this will be handled by user interaction
      // We don't auto-reset here to allow the form to work properly
    }
  }, [formData.item_type_id]);

  // Get day title from trip data
  const dayTitle = useMemo(() => {
    if (!effectiveTripData || !dayParam) return null;
    const itineraryDays = effectiveTripData.itinerary_days || [];
    const dayNumber = parseInt(dayParam);
    const day = itineraryDays.find((d: any) => 
      (d.day_number || d.day) === dayNumber
    );
    return day?.title || day?.day_title || null;
  }, [effectiveTripData, dayParam]);

  // Get trip type (single_day or multi_day)
  const selectedTripType = useMemo(() => {
    if (!formData.trip_id) return null;
    const trip = tripsData?.find((t: any) => t.id.toString() === formData.trip_id);
    return trip?.trip_type || null;
  }, [formData.trip_id, tripsData]);

  const isSingleDayTrip = selectedTripType === 'single_day';

  const submitButtonLabel = useMemo(() => {
    if (isEditMode) {
      if (isAddDayMode) {
        return isSingleDayTrip
          ? __('Update Entry', 'Update Entry')
          : __('Update Day', 'Update Day');
      }
      return __('Update Itinerary Activity', 'Update Itinerary Activity');
    }

    if (isAddDayMode) {
      return isSingleDayTrip
        ? __('Create Entry', 'Create Entry')
        : __('Create Day', 'Create Day');
    }

    return __('Create Itinerary Activity', 'Create Itinerary Activity');
  }, [isEditMode, isAddDayMode, isSingleDayTrip]);

  // Get existing day numbers for the trip
  const existingDayNumbers = useMemo(() => {
    if (!effectiveTripData || !isAddDayMode) return [];
    const itineraryDays = effectiveTripData.itinerary_days || [];
    const days = itineraryDays
      .map((d: any) => d.day_number || d.day)
      .filter((day: any) => day !== null && day !== undefined && !isNaN(Number(day)))
      .map((day: any) => Number(day))
      .sort((a: number, b: number) => a - b);
    return days;
  }, [effectiveTripData, isAddDayMode]);

  // Calculate next available day number
  const nextAvailableDayNumber = useMemo(() => {
    if (existingDayNumbers.length === 0) return 1;
    return Math.max(...existingDayNumbers) + 1;
  }, [existingDayNumbers]);

  // Auto-fill day number when trip is selected or changes in day mode
  const currentTripId = formData.trip_id || '';
  const tripIdChanged = lastTripIdRef.current !== currentTripId;
  
  useEffect(() => {
    // Only auto-fill when creating a new day/entry, not when editing
    if (!isAddDayMode || isEditMode) return;
    
    if (currentTripId) {
      if (tripIdChanged) {
        lastTripIdRef.current = currentTripId;
        dayManuallyEditedRef.current = false;
      }
      
      // For single-day trips, auto-fill entry number if empty
      if (isSingleDayTrip) {
        if (!formData.day || formData.day === '') {
          // Auto-fill with next available entry number for single-day trips
          const currentDay = parseInt(formData.day) || 0;
          const shouldUpdate = !formData.day || 
                              formData.day === '' ||
                              existingDayNumbers.includes(currentDay);
          
          if (shouldUpdate && nextAvailableDayNumber) {
            setFormData(prev => ({ ...prev, day: nextAvailableDayNumber.toString() }));
          } else if (!formData.day || formData.day === '') {
            // Default to 1 if no existing entries
            setFormData(prev => ({ ...prev, day: '1' }));
          }
        }
        // Allow manual editing for single-day trips, so don't return early
      }
      
      // For multi-day trips, auto-fill day number when trip data is loaded
      if (effectiveTripData !== undefined && effectiveTripData !== null) {
        if (!dayManuallyEditedRef.current) {
          const currentDay = parseInt(formData.day) || 0;
          const shouldUpdate = !formData.day || 
                              formData.day === '' ||
                              existingDayNumbers.includes(currentDay);
          
          if (shouldUpdate && nextAvailableDayNumber) {
            setFormData(prev => ({ ...prev, day: nextAvailableDayNumber.toString() }));
          }
        }
      }
    } else {
      setFormData(prev => ({ ...prev, day: '' }));
      dayManuallyEditedRef.current = false;
      lastTripIdRef.current = null;
    }
  }, [isAddDayMode, isEditMode, currentTripId, effectiveTripData, nextAvailableDayNumber, existingDayNumbers.length, formData.day, isSingleDayTrip]);

  // Handlers
  const handleFieldChange = (field: keyof ItineraryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    if (field === 'day' && isAddDayMode) {
      dayManuallyEditedRef.current = true;
    }
    
    if (field === 'trip_id' && isAddDayMode) {
      setFormData(prev => ({ ...prev, day: '' }));
      dayManuallyEditedRef.current = false;
      lastTripIdRef.current = value;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for day conflict in day mode before validation
    if (isAddDayMode && formData.trip_id && formData.day) {
      const dayNumber = parseInt(formData.day);
      
      if (!isNaN(dayNumber)) {
        // In edit mode, only check conflict if day number has changed
        if (isEditMode && originalDayNumber !== null) {
          // If day number hasn't changed, no conflict check needed
          if (dayNumber === originalDayNumber) {
            // Day number unchanged, proceed with validation
          } else if (existingDayNumbers.includes(dayNumber)) {
            // Day number changed to an existing day - show replace confirmation
            setConflictDayNumber(dayNumber);
            setSuggestedDayNumber(null); // No suggestion for replace mode
            setShowDayConflictDialog(true);
            return;
          }
        } else if (!isEditMode && existingDayNumbers.includes(dayNumber)) {
          // In create mode, show conflict with suggestion
          setConflictDayNumber(dayNumber);
          setSuggestedDayNumber(nextAvailableDayNumber);
          setShowDayConflictDialog(true);
          return;
        }
      }
    }
    
    const { isValid, errors: validationErrors } = validateForm(formData, isAddDayMode, activityForms);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary`;
  };

  // Activity form handlers
  const handleToggleExpand = (activityId: string) => {
    setActivityForms(prev => prev.map(af => 
      af.id === activityId 
        ? { ...af, isExpanded: !af.isExpanded }
        : af
    ));
  };

  const handleRemoveActivity = (activityId: string) => {
    setActivityForms(prev => prev.filter(af => af.id !== activityId));
    setActivityIncludedItems(prev => {
      const updated = { ...prev };
      delete updated[activityId];
      return updated;
    });
    setActivityExcludedItems(prev => {
      const updated = { ...prev };
      delete updated[activityId];
      return updated;
    });
  };

  const handleAddActivity = () => {
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
  };

  const handleActivityFieldChange = (activityId: string, field: string, value: any) => {
    setActivityForms(prev => prev.map(af => 
      af.id === activityId
        ? { ...af, data: { ...af.data, [field]: value } }
        : af
    ));
  };

  const handleActivityIncludedItemChange = (activityId: string, value: string) => {
    setActivityIncludedItems(prev => ({ ...prev, [activityId]: value }));
  };

  const handleActivityExcludedItemChange = (activityId: string, value: string) => {
    setActivityExcludedItems(prev => ({ ...prev, [activityId]: value }));
  };

  const handleActivityAddIncludedItem = (activityId: string) => {
    const item = activityIncludedItems[activityId]?.trim();
    if (item) {
      setActivityForms(prev => prev.map(af => 
        af.id === activityId
          ? { 
              ...af, 
              data: { 
                ...af.data, 
                included_items: [...(af.data.included_items || []), item]
              } 
            }
          : af
      ));
      setActivityIncludedItems(prev => ({ ...prev, [activityId]: '' }));
    }
  };

  const handleActivityAddExcludedItem = (activityId: string) => {
    const item = activityExcludedItems[activityId]?.trim();
    if (item) {
      setActivityForms(prev => prev.map(af => 
        af.id === activityId
          ? { 
              ...af, 
              data: { 
                ...af.data, 
                excluded_items: [...(af.data.excluded_items || []), item]
              } 
            }
          : af
      ));
      setActivityExcludedItems(prev => ({ ...prev, [activityId]: '' }));
    }
  };

  const handleActivityRemoveIncludedItem = (activityId: string, index: number) => {
    setActivityForms(prev => prev.map(af => 
      af.id === activityId
        ? { 
            ...af, 
            data: { 
              ...af.data, 
              included_items: (af.data.included_items || []).filter((_: any, i: number) => i !== index)
            } 
          }
        : af
    ));
  };

  const handleActivityRemoveExcludedItem = (activityId: string, index: number) => {
    setActivityForms(prev => prev.map(af => 
      af.id === activityId
        ? { 
            ...af, 
            data: { 
              ...af.data, 
              excluded_items: (af.data.excluded_items || []).filter((_: any, i: number) => i !== index)
            } 
          }
        : af
    ));
  };

  const handleDayConflictConfirm = () => {
    if (suggestedDayNumber !== null) {
      const updatedFormData = { ...formData, day: suggestedDayNumber.toString() };
      
      setShowDayConflictDialog(false);
      setConflictDayNumber(null);
      setSuggestedDayNumber(null);
      
      setFormData(updatedFormData);
      
      const { isValid, errors: validationErrors } = validateForm(updatedFormData, isAddDayMode, activityForms);
      
      if (isValid) {
        setIsSubmitting(true);
        setErrors({});
        saveMutation.mutate(updatedFormData);
      } else {
        setErrors(validationErrors);
        setIsSubmitting(false);
      }
    } else {
      setShowDayConflictDialog(false);
      setConflictDayNumber(null);
      setSuggestedDayNumber(null);
    }
  };

  if (isEditMode && isLoadingEntry) {
    return <ItineraryFormSkeleton />;
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={
          isEditMode 
            ? __('Edit Itinerary Entry', 'Edit Itinerary Entry') 
            : isAddDayMode
            ? (isSingleDayTrip ? __('Add New Entry', 'Add New Entry') : __('Add New Day', 'Add New Day'))
            : __('Add New Activity', 'Add New Activity')
        }
        description={
          isEditMode 
            ? __('Update itinerary entry information', 'Update itinerary entry information') 
            : isAddDayMode
            ? (isSingleDayTrip 
                ? __('Create a new entry for your single-day trip itinerary.', 'Create a new entry for your single-day trip itinerary.')
                : __('Create a new day entry for your trip itinerary. This will be the first activity of the new day.', 'Create a new day entry for your trip itinerary. This will be the first activity of the new day.'))
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
                  <DayFormFields
                    formData={{
                      trip_id: formData.trip_id,
                      day: formData.day,
                      day_title: formData.day_title || '',
                    }}
                    errors={errors}
                    tripsData={tripsData}
                    isLoadingTrips={isLoadingTrips}
                    isEditMode={isEditMode && isAddDayMode}
                    isSingleDayTrip={isSingleDayTrip}
                    onFieldChange={handleFieldChange}
                  />

                  <ActivityAccordion
                    activityForms={activityForms}
                    errors={errors}
                    itemTypes={typesData}
                    items={itemsData}
                    activityIncludedItems={activityIncludedItems}
                    activityExcludedItems={activityExcludedItems}
                    onToggleExpand={handleToggleExpand}
                    onRemoveActivity={handleRemoveActivity}
                    onAddActivity={handleAddActivity}
                    onFieldChange={handleActivityFieldChange}
                    onIncludedItemChange={handleActivityIncludedItemChange}
                    onExcludedItemChange={handleActivityExcludedItemChange}
                    onAddIncludedItem={handleActivityAddIncludedItem}
                    onAddExcludedItem={handleActivityAddExcludedItem}
                    onRemoveIncludedItem={handleActivityRemoveIncludedItem}
                    onRemoveExcludedItem={handleActivityRemoveExcludedItem}
                    calculateDuration={calculateDuration}
                  />
                </>
              )}

              {/* Activity Form - Show in activity mode */}
              {!isAddDayMode && (
                <>
                  {/* Show trip/day info as read-only for activity mode */}
                  {tripIdParam && dayParam && (
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
                    itemTypes={typesData}
                    items={itemsData}
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
                            {submitButtonLabel}
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
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </ConditionalRender>

      {/* Day Conflict Confirmation Dialog */}
      <DayConflictDialog
        isOpen={showDayConflictDialog}
        conflictDayNumber={conflictDayNumber}
        suggestedDayNumber={suggestedDayNumber}
        existingDayNumbers={existingDayNumbers}
        isUpdateMode={isEditMode && isAddDayMode}
        onClose={() => {
          setShowDayConflictDialog(false);
          setConflictDayNumber(null);
          setSuggestedDayNumber(null);
        }}
        onConfirm={handleDayConflictConfirm}
      />
    </div>
  );
};

export default ItineraryForm;
