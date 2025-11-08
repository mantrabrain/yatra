/**
 * Itinerary Form Page - Enhanced with Industry-Standard Features
 * Add/Edit Itinerary Entry form with location, duration, cost, notes, etc.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Info, MapPin, Clock, DollarSign, X, Plus } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ConditionalRender } from '../components/ui/conditional-render';
import { HelpText } from '../components/ui/help-text';
import { Alert } from '../components/ui/alert';

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
    status: 'active',
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

  const isEditMode = action === 'edit' && entryId !== null;

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
  const { data: tripsData } = useQuery({
    queryKey: ['trips-simple'],
    queryFn: async () => {
      return [
        { id: 1, title: 'Everest Base Camp Trek' },
        { id: 2, title: 'Annapurna Circuit Adventure' },
        { id: 3, title: 'Golden Triangle Tour' },
      ];
    },
  });

  // Fetch item types
  const { data: typesData } = useQuery({
    queryKey: ['item-types-simple'],
    queryFn: async () => {
      return [
        { id: 1, name: 'Activity', icon: 'activity' },
        { id: 2, name: 'Meal', icon: 'utensils' },
        { id: 3, name: 'Accommodation', icon: 'hotel' },
        { id: 4, name: 'Transportation', icon: 'bus' },
        { id: 5, name: 'Rest', icon: 'moon' },
      ];
    },
  });

  // Fetch items based on selected type
  const { data: itemsData } = useQuery({
    queryKey: ['items-by-type', formData.item_type_id],
    queryFn: async () => {
      if (!formData.item_type_id) return [];
      
      const allItems: any[] = [
        { id: 1, name: 'Hiking', type_id: 1 },
        { id: 2, name: 'Sightseeing', type_id: 1 },
        { id: 3, name: 'Breakfast', type_id: 2 },
        { id: 4, name: 'Lunch', type_id: 2 },
        { id: 5, name: 'Dinner', type_id: 2 },
        { id: 6, name: 'Hotel', type_id: 3 },
        { id: 7, name: 'Lodge', type_id: 3 },
        { id: 8, name: 'Bus', type_id: 4 },
        { id: 9, name: 'Flight', type_id: 4 },
        { id: 10, name: 'Free Time', type_id: 5 },
      ];

      return allItems.filter(item => item.type_id === parseInt(formData.item_type_id));
    },
    enabled: !!formData.item_type_id,
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
      return {
        id: entryId,
        trip_id: 1,
        day: 1,
        day_title: 'Arrival & Welcome',
        item_type_id: 1,
        item_id: 1,
        title: 'Arrival in Kathmandu',
        description: 'Arrive at airport and transfer to hotel',
        location: 'Tribhuvan International Airport',
        duration: '4 hours',
        start_time: '08:00',
        end_time: '12:00',
        time_type: 'exact',
        cost: '0',
        cost_per_person: true,
        notes: 'Please arrive 2 hours before flight',
        included_items: ['Airport transfer', 'Welcome drink'],
        excluded_items: ['Lunch', 'Tips'],
        status: 'active',
      };
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
        status: entryData.status || 'active',
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
        console.log('Updating itinerary entry:', entryId, payload);
        return { success: true, id: entryId };
      } else {
        console.log('Creating itinerary entry:', payload);
        return { success: true, id: Math.floor(Math.random() * 1000) };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary'] });
      window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary`;
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving', 'An error occurred while saving');
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

  const trips = tripsData || [];
  const types = typesData || [];
  const items = itemsData || [];
  const autoDuration = calculateDuration();

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Itinerary Entry', 'Edit Itinerary Entry') : __('Add New Itinerary Entry', 'Add New Itinerary Entry')}
        description={isEditMode ? __('Update itinerary entry information', 'Update itinerary entry information') : __('Create a new itinerary entry for a trip. Each entry belongs to a specific trip, day, item type, and item.', 'Create a new itinerary entry for a trip. Each entry belongs to a specific trip, day, item type, and item.')}
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
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Basic Information', 'Basic Information')}</CardTitle>
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
                      <Select
                        id="trip_id"
                        value={formData.trip_id}
                        onChange={(e) => handleFieldChange('trip_id', e.target.value)}
                        className={errors.trip_id ? 'border-red-500' : ''}
                        required
                      >
                        <option value="">{__('Select a trip...', 'Select a trip...')}</option>
                        {trips.map((trip: any) => (
                          <option key={trip.id} value={trip.id}>
                            {trip.title}
                          </option>
                        ))}
                      </Select>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="item_type_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Item Type', 'Item Type')} <span className="text-red-500">*</span>
                      </label>
                      <HelpText 
                        text={__('Select the type of item (Activity, Meal, Accommodation, etc.).', 'Select the type of item (Activity, Meal, Accommodation, etc.).')}
                        className="mb-2"
                      />
                      <Select
                        id="item_type_id"
                        value={formData.item_type_id}
                        onChange={(e) => handleFieldChange('item_type_id', e.target.value)}
                        className={errors.item_type_id ? 'border-red-500' : ''}
                        required
                      >
                        <option value="">{__('Select a type...', 'Select a type...')}</option>
                        {types.map((type: any) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </Select>
                      {errors.item_type_id && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.item_type_id}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="item_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Item', 'Item')} <span className="text-red-500">*</span>
                      </label>
                      <HelpText 
                        text={__('Select the specific item (Hiking, Lunch, Bus, etc.).', 'Select the specific item (Hiking, Lunch, Bus, etc.).')}
                        className="mb-2"
                      />
                      <Select
                        id="item_id"
                        value={formData.item_id}
                        onChange={(e) => handleFieldChange('item_id', e.target.value)}
                        disabled={!formData.item_type_id || items.length === 0}
                        className={errors.item_id ? 'border-red-500' : ''}
                        required
                      >
                        <option value="">
                          {!formData.item_type_id 
                            ? __('Select type first...', 'Select type first...')
                            : items.length === 0
                            ? __('No items available', 'No items available')
                            : __('Select an item...', 'Select an item...')}
                        </option>
                        {items.map((item: any) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Select>
                      {errors.item_id && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.item_id}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Entry Title', 'Entry Title')} <span className="text-red-500">*</span>
                    </label>
                    <HelpText 
                      text={__('A descriptive title for this itinerary entry. Examples: "Arrival in Kathmandu", "Trek to Base Camp".', 'A descriptive title for this itinerary entry. Examples: "Arrival in Kathmandu", "Trek to Base Camp".')}
                      className="mb-2"
                    />
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      placeholder={__('e.g., Arrival in Kathmandu', 'e.g., Arrival in Kathmandu')}
                      className={errors.title ? 'border-red-500' : ''}
                      required
                    />
                    {errors.title && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Description', 'Description')}
                    </label>
                    <HelpText 
                      text={__('Detailed description of what happens during this itinerary entry.', 'Detailed description of what happens during this itinerary entry.')}
                      className="mb-2"
                    />
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder={__('Describe what happens during this entry...', 'Describe what happens during this entry...')}
                      rows={4}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Location & Time', 'Location & Time')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Location', 'Location')}
                    </label>
                    <HelpText 
                      text={__('Where does this activity take place? (e.g., "Resort restaurant", "Private beach")', 'Where does this activity take place? (e.g., "Resort restaurant", "Private beach")')}
                      className="mb-2"
                    />
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="location"
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleFieldChange('location', e.target.value)}
                        placeholder={__('e.g., Resort restaurant', 'e.g., Resort restaurant')}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="time_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Time Type', 'Time Type')}
                    </label>
                    <HelpText 
                      text={__('How should the time be displayed?', 'How should the time be displayed?')}
                      className="mb-2"
                    />
                    <Select
                      id="time_type"
                      value={formData.time_type}
                      onChange={(e) => handleFieldChange('time_type', e.target.value)}
                    >
                      <option value="exact">{__('Exact Time', 'Exact Time')}</option>
                      <option value="approximate">{__('Approximate Time', 'Approximate Time')}</option>
                      <option value="all_day">{__('All Day', 'All Day')}</option>
                      <option value="flexible">{__('Flexible', 'Flexible')}</option>
                    </Select>
                  </div>

                  {formData.time_type !== 'all_day' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {__('Start Time', 'Start Time')}
                        </label>
                        <HelpText 
                          text={__('When does this activity start?', 'When does this activity start?')}
                          className="mb-2"
                        />
                        <div className="relative">
                          <Clock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="start_time"
                            type="time"
                            value={formData.start_time}
                            onChange={(e) => handleFieldChange('start_time', e.target.value)}
                            className={errors.start_time ? 'border-red-500 pl-9' : 'pl-9'}
                          />
                        </div>
                        {errors.start_time && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <Info className="w-4 h-4" />
                            {errors.start_time}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {__('End Time', 'End Time')}
                        </label>
                        <HelpText 
                          text={__('When does this activity end?', 'When does this activity end?')}
                          className="mb-2"
                        />
                        <div className="relative">
                          <Clock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="end_time"
                            type="time"
                            value={formData.end_time}
                            onChange={(e) => handleFieldChange('end_time', e.target.value)}
                            className={errors.end_time ? 'border-red-500 pl-9' : 'pl-9'}
                          />
                        </div>
                        {errors.end_time && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <Info className="w-4 h-4" />
                            {errors.end_time}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Duration', 'Duration')}
                    </label>
                    <HelpText 
                      text={__('How long does this activity take? (e.g., "3 hours", "1 hour 30 minutes"). Leave empty to auto-calculate from times.', 'How long does this activity take? (e.g., "3 hours", "1 hour 30 minutes"). Leave empty to auto-calculate from times.')}
                      className="mb-2"
                    />
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="duration"
                        type="text"
                        value={formData.duration}
                        onChange={(e) => handleFieldChange('duration', e.target.value)}
                        placeholder={autoDuration || __('e.g., 3 hours', 'e.g., 3 hours')}
                        className="pl-9"
                      />
                    </div>
                    {autoDuration && formData.time_type === 'exact' && !formData.duration && (
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {__('Auto-calculated:', 'Auto-calculated:')} {autoDuration}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Cost & Additional Information', 'Cost & Additional Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Cost', 'Cost')}
                      </label>
                      <HelpText 
                        text={__('Optional cost for this activity. Leave empty if included in trip price.', 'Optional cost for this activity. Leave empty if included in trip price.')}
                        className="mb-2"
                      />
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="cost"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.cost}
                          onChange={(e) => handleFieldChange('cost', e.target.value)}
                          placeholder="0.00"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.cost_per_person}
                          onChange={(e) => handleFieldChange('cost_per_person', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {__('Cost per person', 'Cost per person')}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Notes / Instructions', 'Notes / Instructions')}
                    </label>
                    <HelpText 
                      text={__('Additional notes or special instructions for this activity.', 'Additional notes or special instructions for this activity.')}
                      className="mb-2"
                    />
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      placeholder={__('e.g., Please arrive 15 minutes early, Bring comfortable shoes...', 'e.g., Please arrive 15 minutes early, Bring comfortable shoes...')}
                      rows={3}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__('Included Items', 'Included Items')}
                      </label>
                      <HelpText 
                        text={__('Items or services included in this activity.', 'Items or services included in this activity.')}
                        className="mb-2"
                      />
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={newIncludedItem}
                            onChange={(e) => setNewIncludedItem(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddIncludedItem();
                              }
                            }}
                            placeholder={__('Add included item...', 'Add included item...')}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleAddIncludedItem}
                            className="flex-shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.included_items.map((item, index) => (
                            <Badge key={index} variant="info" className="flex items-center gap-1.5">
                              {item}
                              <button
                                type="button"
                                onClick={() => handleRemoveIncludedItem(index)}
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__('Excluded Items', 'Excluded Items')}
                      </label>
                      <HelpText 
                        text={__('Items or services NOT included in this activity.', 'Items or services NOT included in this activity.')}
                        className="mb-2"
                      />
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={newExcludedItem}
                            onChange={(e) => setNewExcludedItem(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddExcludedItem();
                              }
                            }}
                            placeholder={__('Add excluded item...', 'Add excluded item...')}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleAddExcludedItem}
                            className="flex-shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.excluded_items.map((item, index) => (
                            <Badge key={index} variant="default" className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-600">
                              {item}
                              <button
                                type="button"
                                onClick={() => handleRemoveExcludedItem(index)}
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
                </CardContent>
              </Card>
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
                      text={__('Active entries are visible in trip schedules. Inactive entries are hidden.', 'Active entries are visible in trip schedules. Inactive entries are hidden.')}
                      className="mb-2"
                    />
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                    >
                      <option value="active">{__('Active', 'Active')}</option>
                      <option value="inactive">{__('Inactive', 'Inactive')}</option>
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
