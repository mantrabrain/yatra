/**
 * Itinerary Section Component
 * Handles: Itinerary builder - matches ItineraryForm.tsx structure
 * 
 * This component follows the same structure as ItineraryForm.tsx
 * but adapted for the trip form context (multiple days with multiple entries)
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  GripVertical, 
  ChevronUp, 
  ChevronDown, 
  Copy,
  MapPin,
  Clock,
  DollarSign,
  X,
  UtensilsCrossed,
  Footprints,
  Hotel,
  Car,
  Moon
} from 'lucide-react';
import { __ } from '../../../lib/i18n';
import { TripFormSectionProps, ItineraryEntry } from '../types';
import { SectionHeader } from '../shared/SectionHeader';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select } from '../../ui/select';
import { Card, CardContent, CardHeader } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { HelpText } from '../../ui/help-text';

interface ItinerarySectionProps extends TripFormSectionProps {
  handleItineraryDayAdd: () => void;
  handleItineraryDayRemove: (day: number) => void;
  handleItineraryDayTitleChange: (day: number, title: string) => void;
  handleItineraryEntryAdd: (day: number) => void;
  handleItineraryEntryRemove: (day: number, entryId: string) => void;
  handleItineraryEntryChange: (day: number, entryId: string, field: keyof ItineraryEntry, value: any) => void;
  handleItineraryEntryMove: (day: number, entryId: string, direction: 'up' | 'down') => void;
  handleItineraryEntryDuplicate: (day: number, entryId: string) => void;
  autoSave?: () => void;
}

export const ItinerarySection: React.FC<ItinerarySectionProps> = ({
  formData,
  handleItineraryDayAdd,
  handleItineraryDayRemove,
  handleItineraryDayTitleChange,
  handleItineraryEntryAdd,
  handleItineraryEntryRemove,
  handleItineraryEntryChange,
  handleItineraryEntryMove,
  handleItineraryEntryDuplicate,
  autoSave,
}) => {
  const [newIncludedItems, setNewIncludedItems] = useState<Record<string, string>>({});
  const [newExcludedItems, setNewExcludedItems] = useState<Record<string, string>>({});

  // Fetch item types (matching ItineraryForm.tsx)
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

  // Get items for a specific entry's item_type_id
  const getItemsForType = (itemTypeId: string) => {
    if (!itemTypeId) return [];
    
    const allItems: any[] = [
      { id: 1, name: 'Hiking', type_id: 1 },
      { id: 2, name: 'Sightseeing', type_id: 1 },
      { id: 3, name: 'Photography', type_id: 1 },
      { id: 4, name: 'Wildlife Viewing', type_id: 1 },
      { id: 5, name: 'Breakfast', type_id: 2 },
      { id: 6, name: 'Lunch', type_id: 2 },
      { id: 7, name: 'Dinner', type_id: 2 },
      { id: 8, name: 'Hotel', type_id: 3 },
      { id: 9, name: 'Lodge', type_id: 3 },
      { id: 10, name: 'Resort', type_id: 3 },
      { id: 11, name: 'Bus', type_id: 4 },
      { id: 12, name: 'Flight', type_id: 4 },
      { id: 13, name: 'Car', type_id: 4 },
      { id: 14, name: 'Free Time', type_id: 5 },
      { id: 15, name: 'Rest Day', type_id: 5 },
    ];

    return allItems.filter(item => item.type_id === parseInt(itemTypeId));
  };

  // Calculate duration from start and end time (matching ItineraryForm.tsx)
  const calculateDuration = (startTime: string, endTime: string, timeType: string): string => {
    if (!startTime || !endTime || timeType !== 'exact') return '';
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
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
  };

  // Get icon for item type
  const getIconForType = (itemTypeId: string) => {
    const typeMap: Record<number, any> = {
      1: Footprints, // Activity
      2: UtensilsCrossed, // Meal
      3: Hotel, // Accommodation
      4: Car, // Transportation
      5: Moon, // Rest
    };
    return typeMap[parseInt(itemTypeId)] || Clock;
  };

  // Handle adding included item for a specific entry
  const handleAddIncludedItem = (day: number, entryId: string) => {
    const key = `${day}_${entryId}`;
    const item = newIncludedItems[key]?.trim();
    if (item) {
      const entry = formData.itinerary_days
        .find(d => d.day === day)
        ?.entries.find(e => e.id === entryId);
      
      if (entry) {
        handleItineraryEntryChange(day, entryId, 'included_items', [...entry.included_items, item]);
        setNewIncludedItems(prev => ({ ...prev, [key]: '' }));
        autoSave?.();
      }
    }
  };

  // Handle removing included item
  const handleRemoveIncludedItem = (day: number, entryId: string, index: number) => {
    const entry = formData.itinerary_days
      .find(d => d.day === day)
      ?.entries.find(e => e.id === entryId);
    
    if (entry) {
      handleItineraryEntryChange(day, entryId, 'included_items', 
        entry.included_items.filter((_, i) => i !== index));
      autoSave?.();
    }
  };

  // Handle adding excluded item for a specific entry
  const handleAddExcludedItem = (day: number, entryId: string) => {
    const key = `${day}_${entryId}`;
    const item = newExcludedItems[key]?.trim();
    if (item) {
      const entry = formData.itinerary_days
        .find(d => d.day === day)
        ?.entries.find(e => e.id === entryId);
      
      if (entry) {
        handleItineraryEntryChange(day, entryId, 'excluded_items', [...entry.excluded_items, item]);
        setNewExcludedItems(prev => ({ ...prev, [key]: '' }));
        autoSave?.();
      }
    }
  };

  // Handle removing excluded item
  const handleRemoveExcludedItem = (day: number, entryId: string, index: number) => {
    const entry = formData.itinerary_days
      .find(d => d.day === day)
      ?.entries.find(e => e.id === entryId);
    
    if (entry) {
      handleItineraryEntryChange(day, entryId, 'excluded_items', 
        entry.excluded_items.filter((_, i) => i !== index));
      autoSave?.();
    }
  };

  const types = typesData || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader
          icon={Calendar}
          title="Itinerary Builder"
          description="Build your trip itinerary day by day. Add activities, meals, accommodation, and transportation for each day."
        />
        <Button
          type="button"
          onClick={handleItineraryDayAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {__('Add Day', 'Add Day')}
        </Button>
      </div>

      {formData.itinerary_days.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
          <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {__('No itinerary days added yet', 'No itinerary days added yet')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
            {__('Start by adding your first day', 'Start by adding your first day')}
          </p>
          <Button
            type="button"
            onClick={handleItineraryDayAdd}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            {__('Add First Day', 'Add First Day')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.itinerary_days.map((dayData) => {
            return (
              <Card key={dayData.day} className="overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {__('Day', 'Day')} {dayData.day}
                        </span>
                      </div>
                      <Input
                        type="text"
                        value={dayData.day_title || ''}
                        onChange={(e) => {
                          handleItineraryDayTitleChange(dayData.day, e.target.value);
                          autoSave?.();
                        }}
                        placeholder={__('e.g., Arrival & Welcome', 'e.g., Arrival & Welcome')}
                        className="flex-1 max-w-md text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleItineraryEntryAdd(dayData.day)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {__('Add Entry', 'Add Entry')}
                      </Button>
                      {formData.itinerary_days.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleItineraryDayRemove(dayData.day)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {dayData.entries.length === 0 ? (
                    <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {__('No entries for this day yet', 'No entries for this day yet')}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleItineraryEntryAdd(dayData.day)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {__('Add Entry', 'Add Entry')}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dayData.entries.map((entry, entryIndex) => {
                        const items = getItemsForType(entry.item_type_id || '');
                        const Icon = getIconForType(entry.item_type_id || '1');
                        const autoDuration = calculateDuration(entry.start_time, entry.end_time, entry.time_type);
                        const entryKey = `${dayData.day}_${entry.id}`;

                        return (
                          <Card key={entry.id} className="border border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                {/* Basic Information - Matching ItineraryForm structure */}
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                    <Icon className="w-5 h-5 text-gray-500" />
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {__('Entry', 'Entry')} {entryIndex + 1}
                                    </h4>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {__('Item Type', 'Item Type')} <span className="text-red-500">*</span>
                                      </label>
                                      <HelpText 
                                        text={__('Select the type of item (Activity, Meal, Accommodation, etc.).', 'Select the type of item (Activity, Meal, Accommodation, etc.).')}
                                        className="mb-2"
                                      />
                                      <Select
                                        value={entry.item_type_id || ''}
                                        onChange={(e) => {
                                          handleItineraryEntryChange(dayData.day, entry.id, 'item_type_id', e.target.value);
                                          // Reset item_id when type changes
                                          handleItineraryEntryChange(dayData.day, entry.id, 'item_id', '');
                                          autoSave?.();
                                        }}
                                        className="text-sm"
                                      >
                                        <option value="">{__('Select a type...', 'Select a type...')}</option>
                                        {types.map((type: any) => (
                                          <option key={type.id} value={type.id}>
                                            {type.name}
                                          </option>
                                        ))}
                                      </Select>
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {__('Item', 'Item')} <span className="text-red-500">*</span>
                                      </label>
                                      <HelpText 
                                        text={__('Select the specific item (Hiking, Lunch, Bus, etc.).', 'Select the specific item (Hiking, Lunch, Bus, etc.).')}
                                        className="mb-2"
                                      />
                                      <Select
                                        value={entry.item_id || ''}
                                        onChange={(e) => {
                                          handleItineraryEntryChange(dayData.day, entry.id, 'item_id', e.target.value);
                                          autoSave?.();
                                        }}
                                        disabled={!entry.item_type_id || items.length === 0}
                                        className="text-sm"
                                      >
                                        <option value="">
                                          {!entry.item_type_id 
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
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                      {__('Entry Title', 'Entry Title')} <span className="text-red-500">*</span>
                                    </label>
                                    <HelpText 
                                      text={__('A descriptive title for this itinerary entry. Examples: "Arrival in Kathmandu", "Trek to Base Camp".', 'A descriptive title for this itinerary entry. Examples: "Arrival in Kathmandu", "Trek to Base Camp".')}
                                      className="mb-2"
                                    />
                                    <Input
                                      type="text"
                                      value={entry.title}
                                      onChange={(e) => {
                                        handleItineraryEntryChange(dayData.day, entry.id, 'title', e.target.value);
                                        autoSave?.();
                                      }}
                                      placeholder={__('e.g., Arrival in Kathmandu', 'e.g., Arrival in Kathmandu')}
                                      className="text-sm"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                      {__('Description', 'Description')}
                                    </label>
                                    <HelpText 
                                      text={__('Detailed description of what happens during this itinerary entry.', 'Detailed description of what happens during this itinerary entry.')}
                                      className="mb-2"
                                    />
                                    <textarea
                                      value={entry.description}
                                      onChange={(e) => {
                                        handleItineraryEntryChange(dayData.day, entry.id, 'description', e.target.value);
                                        autoSave?.();
                                      }}
                                      placeholder={__('Describe what happens during this entry...', 'Describe what happens during this entry...')}
                                      rows={3}
                                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                                    />
                                  </div>
                                </div>

                                {/* Location & Time - Matching ItineraryForm structure */}
                                <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <h5 className="text-xs font-semibold text-gray-900 dark:text-white">
                                    {__('Location & Time', 'Location & Time')}
                                  </h5>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                      {__('Location', 'Location')}
                                    </label>
                                    <HelpText 
                                      text={__('Where does this activity take place? (e.g., "Resort restaurant", "Private beach")', 'Where does this activity take place? (e.g., "Resort restaurant", "Private beach")')}
                                      className="mb-2"
                                    />
                                    <div className="relative">
                                      <MapPin className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <Input
                                        type="text"
                                        value={entry.location || ''}
                                        onChange={(e) => {
                                          handleItineraryEntryChange(dayData.day, entry.id, 'location', e.target.value);
                                          autoSave?.();
                                        }}
                                        placeholder={__('e.g., Resort restaurant', 'e.g., Resort restaurant')}
                                        className="pl-9 text-sm"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                      {__('Time Type', 'Time Type')}
                                    </label>
                                    <HelpText 
                                      text={__('How should the time be displayed?', 'How should the time be displayed?')}
                                      className="mb-2"
                                    />
                                    <Select
                                      value={entry.time_type}
                                      onChange={(e) => {
                                        handleItineraryEntryChange(dayData.day, entry.id, 'time_type', e.target.value);
                                        autoSave?.();
                                      }}
                                      className="text-sm"
                                    >
                                      <option value="exact">{__('Exact Time', 'Exact Time')}</option>
                                      <option value="approximate">{__('Approximate Time', 'Approximate Time')}</option>
                                      <option value="all_day">{__('All Day', 'All Day')}</option>
                                      <option value="flexible">{__('Flexible', 'Flexible')}</option>
                                    </Select>
                                  </div>

                                  {entry.time_type !== 'all_day' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                          {__('Start Time', 'Start Time')}
                                        </label>
                                        <HelpText 
                                          text={__('When does this activity start?', 'When does this activity start?')}
                                          className="mb-2"
                                        />
                                        <div className="relative">
                                          <Clock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                          <Input
                                            type="time"
                                            value={entry.start_time}
                                            onChange={(e) => {
                                              handleItineraryEntryChange(dayData.day, entry.id, 'start_time', e.target.value);
                                              // Auto-calculate duration
                                              const newDuration = calculateDuration(e.target.value, entry.end_time, entry.time_type);
                                              if (newDuration && !entry.duration) {
                                                handleItineraryEntryChange(dayData.day, entry.id, 'duration', newDuration);
                                              }
                                              autoSave?.();
                                            }}
                                            className="pl-9 text-sm"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                          {__('End Time', 'End Time')}
                                        </label>
                                        <HelpText 
                                          text={__('When does this activity end?', 'When does this activity end?')}
                                          className="mb-2"
                                        />
                                        <div className="relative">
                                          <Clock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                          <Input
                                            type="time"
                                            value={entry.end_time}
                                            onChange={(e) => {
                                              handleItineraryEntryChange(dayData.day, entry.id, 'end_time', e.target.value);
                                              // Auto-calculate duration
                                              const newDuration = calculateDuration(entry.start_time, e.target.value, entry.time_type);
                                              if (newDuration && !entry.duration) {
                                                handleItineraryEntryChange(dayData.day, entry.id, 'duration', newDuration);
                                              }
                                              autoSave?.();
                                            }}
                                            className="pl-9 text-sm"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                      {__('Duration', 'Duration')}
                                    </label>
                                    <HelpText 
                                      text={__('How long does this activity take? (e.g., "3 hours", "1 hour 30 minutes"). Leave empty to auto-calculate from times.', 'How long does this activity take? (e.g., "3 hours", "1 hour 30 minutes"). Leave empty to auto-calculate from times.')}
                                      className="mb-2"
                                    />
                                    <div className="relative">
                                      <Clock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <Input
                                        type="text"
                                        value={entry.duration || ''}
                                        onChange={(e) => {
                                          handleItineraryEntryChange(dayData.day, entry.id, 'duration', e.target.value);
                                          autoSave?.();
                                        }}
                                        placeholder={autoDuration || __('e.g., 3 hours', 'e.g., 3 hours')}
                                        className="pl-9 text-sm"
                                      />
                                    </div>
                                    {autoDuration && entry.time_type === 'exact' && !entry.duration && (
                                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        {__('Auto-calculated:', 'Auto-calculated:')} {autoDuration}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Cost & Additional Information - Matching ItineraryForm structure */}
                                <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <h5 className="text-xs font-semibold text-gray-900 dark:text-white">
                                    {__('Cost & Additional Information', 'Cost & Additional Information')}
                                  </h5>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {__('Cost', 'Cost')}
                                      </label>
                                      <HelpText 
                                        text={__('Optional cost for this activity. Leave empty if included in trip price.', 'Optional cost for this activity. Leave empty if included in trip price.')}
                                        className="mb-2"
                                      />
                                      <div className="relative">
                                        <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={entry.cost || ''}
                                          onChange={(e) => {
                                            handleItineraryEntryChange(dayData.day, entry.id, 'cost', e.target.value);
                                            autoSave?.();
                                          }}
                                          placeholder="0.00"
                                          className="pl-9 text-sm"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-end">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={entry.cost_per_person}
                                          onChange={(e) => {
                                            handleItineraryEntryChange(dayData.day, entry.id, 'cost_per_person', e.target.checked);
                                            autoSave?.();
                                          }}
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-xs text-gray-700 dark:text-gray-300">
                                          {__('Cost per person', 'Cost per person')}
                                        </span>
                                      </label>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                      {__('Notes / Instructions', 'Notes / Instructions')}
                                    </label>
                                    <HelpText 
                                      text={__('Additional notes or special instructions for this activity.', 'Additional notes or special instructions for this activity.')}
                                      className="mb-2"
                                    />
                                    <textarea
                                      value={entry.notes || ''}
                                      onChange={(e) => {
                                        handleItineraryEntryChange(dayData.day, entry.id, 'notes', e.target.value);
                                        autoSave?.();
                                      }}
                                      placeholder={__('e.g., Please arrive 15 minutes early, Bring comfortable shoes...', 'e.g., Please arrive 15 minutes early, Bring comfortable shoes...')}
                                      rows={2}
                                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                                    />
                                  </div>

                                  {/* Included/Excluded Items - Matching ItineraryForm structure */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                            value={newIncludedItems[entryKey] || ''}
                                            onChange={(e) => setNewIncludedItems(prev => ({ ...prev, [entryKey]: e.target.value }))}
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddIncludedItem(dayData.day, entry.id);
                                              }
                                            }}
                                            placeholder={__('Add included item...', 'Add included item...')}
                                            className="flex-1 text-sm"
                                          />
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleAddIncludedItem(dayData.day, entry.id)}
                                            className="flex-shrink-0 h-9 w-9"
                                          >
                                            <Plus className="w-4 h-4" />
                                          </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {entry.included_items.map((item, index) => (
                                            <Badge key={index} variant="info" className="flex items-center gap-1.5 text-xs">
                                              {item}
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveIncludedItem(dayData.day, entry.id, index)}
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
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                            value={newExcludedItems[entryKey] || ''}
                                            onChange={(e) => setNewExcludedItems(prev => ({ ...prev, [entryKey]: e.target.value }))}
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddExcludedItem(dayData.day, entry.id);
                                              }
                                            }}
                                            placeholder={__('Add excluded item...', 'Add excluded item...')}
                                            className="flex-1 text-sm"
                                          />
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleAddExcludedItem(dayData.day, entry.id)}
                                            className="flex-shrink-0 h-9 w-9"
                                          >
                                            <Plus className="w-4 h-4" />
                                          </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {entry.excluded_items.map((item, index) => (
                                            <Badge key={index} variant="default" className="flex items-center gap-1.5 text-xs border border-gray-300 dark:border-gray-600">
                                              {item}
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveExcludedItem(dayData.day, entry.id, index)}
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

                                {/* Entry Actions */}
                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleItineraryEntryMove(dayData.day, entry.id, 'up')}
                                    disabled={entryIndex === 0}
                                    className="h-7 w-7 p-0"
                                    title={__('Move up', 'Move up')}
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleItineraryEntryMove(dayData.day, entry.id, 'down')}
                                    disabled={entryIndex === dayData.entries.length - 1}
                                    className="h-7 w-7 p-0"
                                    title={__('Move down', 'Move down')}
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleItineraryEntryDuplicate(dayData.day, entry.id)}
                                    className="h-7 w-7 p-0"
                                    title={__('Duplicate', 'Duplicate')}
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleItineraryEntryRemove(dayData.day, entry.id)}
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title={__('Delete', 'Delete')}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
