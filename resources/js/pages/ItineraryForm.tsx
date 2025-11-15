/**
 * Itinerary Form Page - Enhanced with Industry-Standard Features
 * Add/Edit Itinerary Entry form with location, duration, cost, notes, etc.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
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
  const [formData, setFormData] = useState<ItineraryFormData>({
    trip_id: '',
    day: '1',
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
    status: 'draft',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newIncludedItem, setNewIncludedItem] = useState('');
  const [newExcludedItem, setNewExcludedItem] = useState('');

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

  const itemParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('item');
  }, []);

  const modeParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') || 'activity'; // 'day' or 'activity'
  }, []);

  const isEditMode = action === 'edit' && entryId !== null;
  const isAddDayMode = !isEditMode && modeParam === 'day';

  // Initialize from URL params
  useEffect(() => {
    if (tripIdParam) {
      setFormData(prev => ({ ...prev, trip_id: tripIdParam }));
    }
    if (dayParam) {
      setFormData(prev => ({ ...prev, day: dayParam }));
    }
    if (typeParam) {
      // Find type ID from name
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
  }, [tripIdParam, dayParam, typeParam, itemParam]);

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
        return response.data || [];
      } catch (error: any) {
        console.error('Failed to load item types:', error);
        return [];
      }
    },
    enabled: can('yatra_view_trips'),
  });

  // Fetch items based on selected type - only published ones are usable
  const { data: itemsData } = useQuery({
    queryKey: ['items-by-type', formData.item_type_id],
    queryFn: async () => {
      if (!formData.item_type_id) return [];
      
      try {
        const response = await apiClient.get('/items', { 
          params: { 
            per_page: 100,
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
    enabled: !!formData.item_type_id && can('yatra_view_trips'),
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

  useEffect(() => {
    if (entryData && isEditMode) {
      setFormData({
        trip_id: entryData.trip_id?.toString() || '',
        day: entryData.day?.toString() || '1',
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
    }
  }, [entryData, isEditMode]);

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

  const calculateDuration = () => {
    if (formData.start_time && formData.end_time && formData.time_type === 'exact') {
      const [startHour, startMin] = formData.start_time.split(':').map(Number);
      const [endHour, endMin] = formData.end_time.split(':').map(Number);
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
        return response.data || response;
      }
    },
    onSuccess: () => {
      // Invalidate all itinerary-related queries
      queryClient.invalidateQueries({ queryKey: ['itinerary'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trips-simple'] });
      
      // Also invalidate the specific trip query if we have trip_id
      if (formData.trip_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['trips', parseInt(formData.trip_id)] 
        });
        // Force refetch the trip data
        queryClient.refetchQueries({ 
          queryKey: ['trips', parseInt(formData.trip_id)] 
        });
      }
      
      // Force refetch all trips to ensure fresh data
      queryClient.refetchQueries({ queryKey: ['trips'] });
      queryClient.refetchQueries({ queryKey: ['trips-simple'] });
      
      // Show success toast first
      showToast(
        isEditMode 
          ? __('Itinerary entry updated successfully', 'Itinerary entry updated successfully')
          : __('Itinerary entry created successfully', 'Itinerary entry created successfully'),
        'success'
      );
      
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
              {/* Trip and Day Selection - Specific to ItineraryForm */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Trip & Day Selection', 'Trip & Day Selection')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="trip_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Trip', 'Trip')} <span className="text-red-500">*</span>
                      </label>
                      <HelpText 
                        text={__('Select the trip this entry belongs to.', 'Select the trip this entry belongs to.')}
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
                        text={__('Which day of the trip is this entry for?', 'Which day of the trip is this entry for?')}
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
                      text={__('A descriptive title for this day (e.g., "Arrival & Welcome to Paradise"). This appears in the day header.', 'A descriptive title for this day (e.g., "Arrival & Welcome to Paradise"). This appears in the day header.')}
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

              {/* Shared Itinerary Entry Fields Component */}
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
                      className="h-9 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                      style={{
                        color: 'rgb(17, 24, 39)',
                        backgroundColor: 'rgb(255, 255, 255)',
                      }}
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
                            {isEditMode ? __('Update Entry', 'Update Entry') : __('Create Entry', 'Create Entry')}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                      >
                        {__('Cancel', 'Cancel')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </ConditionalRender>
    </div>
  );
};

export default ItineraryForm;
