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
  Clock,
  UtensilsCrossed,
  Footprints,
  Hotel,
  Car,
  Moon,
  CheckCircle2,
  X
} from 'lucide-react';
import { __ } from '../../../lib/i18n';
import { TripFormSectionProps, ItineraryEntry } from '../types';
import { SectionHeader, ItineraryEntryFields } from '../shared';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
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
  handleFieldChange: (field: keyof TripFormSectionProps['formData'], value: any) => void;
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
  handleFieldChange,
}) => {
  const [newIncludedItems, setNewIncludedItems] = useState<Record<string, string>>({});
  const [newExcludedItems, setNewExcludedItems] = useState<Record<string, string>>({});
  const [newTripIncludedItem, setNewTripIncludedItem] = useState({ title: '', description: '' });
  const [newTripExcludedItem, setNewTripExcludedItem] = useState({ title: '', description: '' });

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
    }
  };

  // Handle trip-level included/excluded items
  const handleAddTripIncludedItem = () => {
    if (newTripIncludedItem.title.trim()) {
      handleFieldChange('included_items', [
        ...formData.included_items,
        { title: newTripIncludedItem.title.trim(), description: newTripIncludedItem.description.trim() },
      ]);
      setNewTripIncludedItem({ title: '', description: '' });
    }
  };

  const handleUpdateTripIncludedItem = (index: number, field: 'title' | 'description', value: string) => {
    const updated = formData.included_items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    handleFieldChange('included_items', updated);
  };

  const handleRemoveTripIncludedItem = (index: number) => {
    handleFieldChange('included_items', formData.included_items.filter((_, i) => i !== index));
  };

  const handleAddTripExcludedItem = () => {
    if (newTripExcludedItem.title.trim()) {
      handleFieldChange('excluded_items', [
        ...formData.excluded_items,
        { title: newTripExcludedItem.title.trim(), description: newTripExcludedItem.description.trim() },
      ]);
      setNewTripExcludedItem({ title: '', description: '' });
    }
  };

  const handleUpdateTripExcludedItem = (index: number, field: 'title' | 'description', value: string) => {
    const updated = formData.excluded_items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    handleFieldChange('excluded_items', updated);
  };

  const handleRemoveTripExcludedItem = (index: number) => {
    handleFieldChange('excluded_items', formData.excluded_items.filter((_, i) => i !== index));
  };

  const types = typesData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader
          icon={Calendar}
          title="Itinerary Builder"
          description="Build your trip itinerary day by day, or use a simple included/excluded list. You can skip detailed itinerary if you prefer."
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

      {/* Trip-Level Included/Excluded Section */}
      <div className="space-y-4">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{__('What\'s Included & Excluded', 'What\'s Included & Excluded')}</h3>
          <HelpText
            text={__('💡 Tip: If you\'re not building a detailed day-by-day itinerary, you can simply list what\'s included and excluded in your trip package here.', '💡 Tip: If you\'re not building a detailed day-by-day itinerary, you can simply list what\'s included and excluded in your trip package here.')}
            className="mb-4"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Included Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{__('Included Items', 'Included Items')}</CardTitle>
                <CardDescription className="text-xs">
                  {__('List everything included in the trip price', 'List everything included in the trip price')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.included_items.length > 0 ? (
                  <div className="space-y-3">
                    {formData.included_items.map((item, index) => (
                      <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <Input
                              value={item.title}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateTripIncludedItem(index, 'title', e.target.value)}
                              placeholder={__('Item title', 'Item title')}
                              className="text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTripIncludedItem(index)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <textarea
                          value={item.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdateTripIncludedItem(index, 'description', e.target.value)}
                          placeholder={__('Short description (optional)', 'Short description (optional)')}
                          rows={2}
                          className="text-xs w-full rounded-md border border-green-200 dark:border-green-800 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                    <CheckCircle2 className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {__('No included items yet', 'No included items yet')}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={newTripIncludedItem.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTripIncludedItem(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={__('e.g., Accommodation', 'e.g., Accommodation')}
                    className="text-sm"
                  />
                  <textarea
                    value={newTripIncludedItem.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTripIncludedItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={__('Describe what is included', 'Describe what is included')}
                    rows={2}
                    className="text-xs w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100"
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleAddTripIncludedItem();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTripIncludedItem}
                    disabled={!newTripIncludedItem.title.trim()}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {__('Add Included Item', 'Add Included Item')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Excluded Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{__('Excluded Items', 'Excluded Items')}</CardTitle>
                <CardDescription className="text-xs">
                  {__('List what is NOT included', 'List what is NOT included')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.excluded_items.length > 0 ? (
                  <div className="space-y-3">
                    {formData.excluded_items.map((item, index) => (
                      <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <Input
                              value={item.title}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateTripExcludedItem(index, 'title', e.target.value)}
                              placeholder={__('Item title', 'Item title')}
                              className="text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTripExcludedItem(index)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <textarea
                          value={item.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdateTripExcludedItem(index, 'description', e.target.value)}
                          placeholder={__('Short description (optional)', 'Short description (optional)')}
                          rows={2}
                          className="text-xs w-full rounded-md border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                    <X className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {__('No excluded items yet', 'No excluded items yet')}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={newTripExcludedItem.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTripExcludedItem(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={__('e.g., Flights', 'e.g., Flights')}
                    className="text-sm"
                  />
                  <textarea
                    value={newTripExcludedItem.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTripExcludedItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={__('Describe what is not included', 'Describe what is not included')}
                    rows={2}
                    className="text-xs w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100"
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleAddTripExcludedItem();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTripExcludedItem}
                    disabled={!newTripExcludedItem.title.trim()}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {__('Add Excluded Item', 'Add Excluded Item')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
                        const entryKey = `${dayData.day}_${entry.id}`;

                        return (
                          <Card key={entry.id} className="border border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                {/* Entry Header */}
                                <div className="flex items-center gap-2 mb-2">
                                  <GripVertical className="w-4 h-4 text-gray-400" />
                                  <Icon className="w-5 h-5 text-gray-500" />
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {__('Entry', 'Entry')} {entryIndex + 1}
                                  </h4>
                                </div>

                                {/* Shared Itinerary Entry Fields Component */}
                                <ItineraryEntryFields
                                  entry={entry}
                                  errors={{}}
                                  itemTypes={types}
                                  items={items}
                                  newIncludedItem={newIncludedItems[entryKey] || ''}
                                  newExcludedItem={newExcludedItems[entryKey] || ''}
                                  onFieldChange={(field, value) => {
                                    handleItineraryEntryChange(dayData.day, entry.id, field, value);
                                  }}
                                  onIncludedItemChange={(value) => setNewIncludedItems(prev => ({ ...prev, [entryKey]: value }))}
                                  onExcludedItemChange={(value) => setNewExcludedItems(prev => ({ ...prev, [entryKey]: value }))}
                                  onAddIncludedItem={() => handleAddIncludedItem(dayData.day, entry.id)}
                                  onAddExcludedItem={() => handleAddExcludedItem(dayData.day, entry.id)}
                                  onRemoveIncludedItem={(index) => handleRemoveIncludedItem(dayData.day, entry.id, index)}
                                  onRemoveExcludedItem={(index) => handleRemoveExcludedItem(dayData.day, entry.id, index)}
                                  calculateDuration={calculateDuration}
                                  size="compact"
                                  showCardWrapper={false}
                                />

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
