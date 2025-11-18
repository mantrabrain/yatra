/**
 * Itinerary Section Component
 * Handles: Itinerary builder - matches ItineraryForm.tsx structure
 * 
 * This component follows the same structure as ItineraryForm.tsx
 * but adapted for the trip form context (multiple days with multiple entries)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Copy,
  Clock,
  UtensilsCrossed,
  Footprints,
  Hotel,
  Car,
  Moon,
  CheckCircle2,
  X,
  ExternalLink,
  MapPin,
  DollarSign,
  Pencil
} from 'lucide-react';
import { __ } from '../../../lib/i18n';
import { TripFormSectionProps, ItineraryEntry, ItineraryDay } from '../types';
import { SectionHeader, ItineraryEntryFields } from '../shared';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { HelpText } from '../../ui/help-text';
import { apiClient } from '../../../lib/api';
import { useToast } from '../../ui/toast';
import { Badge } from '../../ui/badge';
import { IconSelector } from '../../ui/icon-selector';

interface ItinerarySectionProps extends TripFormSectionProps {
  handleItineraryDayAdd: (dayData?: Partial<ItineraryDay>) => void;
  handleItineraryDayRemove: (day: number) => void;
  handleItineraryDayTitleChange: (day: number, title: string) => void;
  handleItineraryEntryRemove: (day: number, entryId: string) => void;
  handleItineraryEntryDuplicate: (day: number, entryId: string) => void;
  handleItineraryEntryUpsert?: (day: number, entry: ItineraryEntry) => void;
  handleFieldChange: (field: keyof TripFormSectionProps['formData'], value: any) => void;
  isSingleDayTrip: boolean;
  isEditMode: boolean;
  tripId: number | null;
}

export const ItinerarySection: React.FC<ItinerarySectionProps> = ({
  formData,
  handleItineraryDayAdd,
  handleItineraryDayRemove,
  handleItineraryDayTitleChange,
  handleItineraryEntryRemove,
  handleItineraryEntryDuplicate,
  handleItineraryEntryUpsert,
  handleFieldChange,
  isSingleDayTrip,
  isEditMode,
  tripId,
}) => {
  const [newTripIncludedItem, setNewTripIncludedItem] = useState({ title: '', description: '' });
  const [newTripExcludedItem, setNewTripExcludedItem] = useState({ title: '', description: '' });
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [dayModalState, setDayModalState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    day: number;
    day_title: string;
  }>({
    open: false,
    mode: 'create',
    day: 1,
    day_title: '',
  });
  const [activityModalState, setActivityModalState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    day: number;
    entryId: string | null;
    entryData: ItineraryEntry;
  }>({
    open: false,
    mode: 'create',
    day: 1,
    entryId: null,
    entryData: {
      id: `entry_${Date.now()}`,
      day: 1,
      item_type_id: '1',
      item_id: '',
      title: '',
      description: '',
      start_time: '08:00',
      end_time: '09:00',
      time_type: 'exact',
      cost: '',
      cost_per_person: true,
      notes: '',
      included_items: [],
      excluded_items: [],
      images: [],
      status: 'active',
    },
  });
  const [activityModalIncludedInput, setActivityModalIncludedInput] = useState('');
  const [activityModalExcludedInput, setActivityModalExcludedInput] = useState('');
  const [activityModalErrors, setActivityModalErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const toggleEntryExpanded = (entryId: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const handleToggleSelectEntry = (entryId: string) => {
    setSelectedEntries(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const handleSelectAllEntriesForDay = (dayEntries: ItineraryEntry[]) => {
    setSelectedEntries(prev => {
      const next = new Set(prev);
      const allSelected = dayEntries.every(entry => next.has(entry.id));
      if (allSelected) {
        dayEntries.forEach(entry => next.delete(entry.id));
      } else {
        dayEntries.forEach(entry => next.add(entry.id));
      }
      return next;
    });
  };

  const isDayFullySelected = (dayEntries: ItineraryEntry[]) => {
    if (dayEntries.length === 0) return false;
    return dayEntries.every(entry => selectedEntries.has(entry.id));
  };

  const closeDayModal = () => {
    setDayModalState({
      open: false,
      mode: 'create',
      day: 1,
      day_title: '',
    });
  };

  const openCreateDayModal = () => {
    const nextDay = formData.itinerary_days.length > 0
      ? Math.max(...formData.itinerary_days.map(d => d.day)) + 1
      : 1;
    setDayModalState({
      open: true,
      mode: 'create',
      day: nextDay,
      day_title: '',
    });
  };

  const openEditDayModal = (day: number, title?: string) => {
    setDayModalState({
      open: true,
      mode: 'edit',
      day,
      day_title: title || '',
    });
  };

  const closeActivityModal = () => {
    setActivityModalState(prev => ({
      ...prev,
      open: false,
    }));
    setActivityModalErrors({});
  };

  const openActivityModal = (
    mode: 'create' | 'edit',
    day: number,
    entry?: ItineraryEntry | null,
    overrides?: Partial<ItineraryEntry>
  ) => {
    const baseEntry: ItineraryEntry = entry
      ? { ...entry }
      : {
          id: `entry_${Date.now()}`,
          day,
          item_type_id: overrides?.item_type_id || '1',
          item_id: overrides?.item_id || '',
          item_type: overrides?.item_type || 'Activity',
          item_name: overrides?.item_name || 'Activity',
          item_icon: overrides?.item_icon || 'footprints',
          title: overrides?.title || '',
          description: overrides?.description || '',
          location: overrides?.location,
          duration: overrides?.duration,
          start_time: overrides?.start_time || '08:00',
          end_time: overrides?.end_time || '10:00',
          time_type: overrides?.time_type || 'exact',
          cost: overrides?.cost || '',
          cost_per_person: overrides?.cost_per_person !== undefined ? overrides.cost_per_person : true,
          notes: overrides?.notes || '',
          included_items: overrides?.included_items ? [...overrides.included_items] : [],
          excluded_items: overrides?.excluded_items ? [...overrides.excluded_items] : [],
          images: overrides?.images ? [...overrides.images] : [],
          status: overrides?.status || 'active',
        };

    setActivityModalState({
      open: true,
      mode,
      day,
      entryId: entry?.id || null,
      entryData: baseEntry,
    });
    setActivityModalIncludedInput('');
    setActivityModalExcludedInput('');
    setActivityModalErrors({});
  };

  const handleActivityModalFieldChange = (field: keyof ItineraryEntry, value: any) => {
    setActivityModalState(prev => ({
      ...prev,
      entryData: {
        ...prev.entryData,
        [field]: value,
      },
    }));
  };

  const handleActivityModalAddIncluded = () => {
    const value = activityModalIncludedInput.trim();
    if (!value) return;
    setActivityModalState(prev => ({
      ...prev,
      entryData: {
        ...prev.entryData,
        included_items: [...(prev.entryData.included_items || []), value],
      },
    }));
    setActivityModalIncludedInput('');
  };

  const handleActivityModalAddExcluded = () => {
    const value = activityModalExcludedInput.trim();
    if (!value) return;
    setActivityModalState(prev => ({
      ...prev,
      entryData: {
        ...prev.entryData,
        excluded_items: [...(prev.entryData.excluded_items || []), value],
      },
    }));
    setActivityModalExcludedInput('');
  };

  const handleActivityModalRemoveIncluded = (index: number) => {
    setActivityModalState(prev => ({
      ...prev,
      entryData: {
        ...prev.entryData,
        included_items: prev.entryData.included_items.filter((_, i) => i !== index),
      },
    }));
  };

  const handleActivityModalRemoveExcluded = (index: number) => {
    setActivityModalState(prev => ({
      ...prev,
      entryData: {
        ...prev.entryData,
        excluded_items: prev.entryData.excluded_items.filter((_, i) => i !== index),
      },
    }));
  };

  const handleDayModalSave = () => {
    if (!dayModalState.day_title.trim() && dayModalState.mode === 'create') {
      // Allow empty title for consistency, but we can show a helper if needed
    }

    if (dayModalState.mode === 'create') {
      handleItineraryDayAdd({
        day: dayModalState.day,
        day_title: dayModalState.day_title.trim(),
      });
    } else {
      handleItineraryDayTitleChange(dayModalState.day, dayModalState.day_title.trim());
    }
    closeDayModal();
  };

  const handleActivityModalSave = () => {
    const entry = activityModalState.entryData;
    const errors: Record<string, string> = {};
    if (!entry.item_type_id) {
      errors.item_type_id = __('Item type is required', 'Item type is required');
    }
    if (!entry.item_id) {
      errors.item_id = __('Item is required', 'Item is required');
    }
    if (!entry.title?.trim()) {
      errors.title = __('Title is required', 'Title is required');
    }

    if (Object.keys(errors).length > 0) {
      setActivityModalErrors(errors);
      return;
    }

    const entryToSave: ItineraryEntry = {
      ...entry,
      id: activityModalState.mode === 'edit' && activityModalState.entryId ? activityModalState.entryId : entry.id || `entry_${Date.now()}`,
      day: activityModalState.day,
    };

    if (handleItineraryEntryUpsert) {
      handleItineraryEntryUpsert(activityModalState.day, entryToSave);
    } else {
      console.warn('handleItineraryEntryUpsert prop not provided to ItinerarySection');
    }
    closeActivityModal();
  };

  // Fetch item types (matching ItineraryForm.tsx)
  const { data: itemTypesData } = useQuery({
    queryKey: ['item-types', 'trip-form'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/item-types', {
          params: {
            per_page: 100,
            status: 'publish',
          },
        });
        const payload = response?.data?.data || response?.data || response || [];
        return Array.isArray(payload) ? payload : [];
      } catch (error: any) {
        showToast(error?.message || __('Failed to load item types', 'Failed to load item types'), 'error');
        return [];
      }
    },
  });

  // Fetch items (matching ItineraryForm.tsx)
  const { data: itemsData } = useQuery({
    queryKey: ['items', 'trip-form'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/items', {
          params: {
            per_page: 1000,
            status: 'publish',
          },
        });
        const payload = response?.data?.data || response?.data || response || [];
        return Array.isArray(payload) ? payload : [];
      } catch (error: any) {
        showToast(error?.message || __('Failed to load itinerary items', 'Failed to load itinerary items'), 'error');
        return [];
      }
    },
  });

  const itemTypesLookup = useMemo(() => {
    const map = new Map<string, any>();
    (itemTypesData || []).forEach((type: any) => {
      if (type?.id !== undefined && type?.id !== null) {
        map.set(type.id.toString(), type);
      }
    });
    return map;
  }, [itemTypesData]);

  const itemsLookup = useMemo(() => {
    const map = new Map<string, any>();
    (itemsData || []).forEach((item: any) => {
      if (item?.id !== undefined && item?.id !== null) {
        map.set(item.id.toString(), item);
      }
    });
    return map;
  }, [itemsData]);

  const normalizeIconName = (icon: any) => {
    if (!icon) return 'footprints';
    if (typeof icon === 'string') return icon;
    if (typeof icon === 'object' && icon.value) {
      if (icon.type === 'image') return 'image';
      return icon.value;
    }
    return 'footprints';
  };

  const quickAddOptions = useMemo(() => {
    const itemTypes = Array.isArray(itemTypesData) ? itemTypesData : [];
    return itemTypes
      .map((itemType: any) => {
        const iconName = normalizeIconName(itemType.icon);
        const color = itemType.color || 'blue';
        return {
          typeId: itemType.id,
          typeName: itemType.name || '',
          typeIcon: iconName,
          typeIconData: itemType.icon,
          typeColor: color,
        };
      })
      .filter((option: any) => option.typeName);
  }, [itemTypesData]);

  // Get items for a specific entry's item_type_id
  const formatTime = (time?: string) => (time && time.trim() ? time : '—');

  const getEntryTypeName = (entry: ItineraryEntry) => {
    if (entry.item_type) return entry.item_type;
    const type = entry.item_type_id ? itemTypesLookup.get(entry.item_type_id.toString()) : null;
    return type?.name || __('Activity', 'Activity');
  };

  const getEntryTypeCategory = (entry: ItineraryEntry) => {
    const typeName = getEntryTypeName(entry).toLowerCase();
    if (typeName.includes('meal') || typeName.includes('food') || typeName.includes('dining')) return 'meal';
    if (typeName.includes('accom') || typeName.includes('stay') || typeName.includes('hotel')) return 'accommodation';
    if (typeName.includes('transport') || typeName.includes('transfer')) return 'transport';
    if (typeName.includes('rest')) return 'rest';
    return 'activity';
  };

  const getItemCounts = (entries: ItineraryEntry[]) => {
    return entries.reduce(
      (acc, entry) => {
        const category = getEntryTypeCategory(entry);
        if (category === 'meal') acc.meals += 1;
        else if (category === 'accommodation') acc.accommodations += 1;
        else if (category === 'transport') acc.transportations += 1;
        else if (category === 'rest') acc.rest += 1;
        else acc.activities += 1;
        acc.total += 1;
        return acc;
      },
      { total: 0, meals: 0, accommodations: 0, transportations: 0, rest: 0, activities: 0 }
    );
  };

  const displayDayGroups = useMemo(() => {
    return formData.itinerary_days.map((day) => {
      const derivedEntries = (day.entries || []).map((entry) => {
        const type = entry.item_type_id ? itemTypesLookup.get(entry.item_type_id.toString()) : null;
        const item = entry.item_id ? itemsLookup.get(entry.item_id.toString()) : null;
        return {
          ...entry,
          item_type: type?.name || entry.item_type || __('Activity', 'Activity'),
          item_name: item?.name || entry.item_name || __('Activity', 'Activity'),
          item_icon: normalizeIconName(type?.icon) || entry.item_icon || 'footprints',
          start_time: entry.start_time || '08:00',
          end_time: entry.end_time || '10:00',
        };
      });
      return {
        raw: day,
        derivedEntries,
      };
    });
  }, [formData.itinerary_days, itemTypesLookup, itemsLookup]);

  useEffect(() => {
    setExpandedDays(prev => {
      const next = new Set<number>();
      const existingDays = new Set(formData.itinerary_days.map(d => d.day));

      prev.forEach(day => {
        if (existingDays.has(day)) {
          next.add(day);
        }
      });

      formData.itinerary_days.forEach(day => {
        if (day.entries.length === 0) {
          next.add(day.day);
        }
      });

      return next;
    });
  }, [formData.itinerary_days]);

  useEffect(() => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      formData.itinerary_days.forEach(day => {
        day.entries.forEach(entry => {
          if (!next.has(entry.id)) {
            next.add(entry.id);
          }
        });
      });
      return next;
    });
  }, [formData.itinerary_days]);

  const toggleDay = (dayNumber: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayNumber)) {
        next.delete(dayNumber);
      } else {
        next.add(dayNumber);
      }
      return next;
    });
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

  const types = itemTypesData || [];
  const items = itemsData || [];
  const dayLabel = isSingleDayTrip ? __('Entry', 'Entry') : __('Day', 'Day');
  const addDayButtonLabel = isSingleDayTrip ? __('Add Entry', 'Add Entry') : __('Add Day', 'Add Day');
  const emptyStateButtonLabel = isSingleDayTrip ? __('Add First Entry', 'Add First Entry') : __('Add First Day', 'Add First Day');
  const addActivityButtonLabel = __('Add Itinerary Activity', 'Add Itinerary Activity');
  const itineraryLink = useMemo(() => {
    if (!isEditMode || !tripId) return null;
    return `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&trip_id=${tripId}`;
  }, [isEditMode, tripId]);
  const canAddAnotherDay = !(isSingleDayTrip && formData.itinerary_days.length >= 1);

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <SectionHeader
          icon={Calendar}
          title="Itinerary Builder"
          description="Build your trip itinerary day by day, or use a simple included/excluded list. You can skip detailed itinerary if you prefer."
        />
        <div className="flex items-center gap-2">
          {itineraryLink && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(itineraryLink, '_blank', 'noopener,noreferrer')}
              className="text-sm"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              {__('Open Trip Itinerary', 'Open Trip Itinerary')}
            </Button>
          )}
          <Button
            type="button"
            onClick={openCreateDayModal}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!canAddAnotherDay}
          >
            <Plus className="w-4 h-4 mr-2" />
            {addDayButtonLabel}
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-400 p-3 rounded-r-md">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
          {__('Map out your trip day by day, or add quick included/excluded lists if you\'re still planning the details.', 'Map out your trip day by day, or add quick included/excluded lists if you\'re still planning the details.')}
        </p>
        <p className="text-xs text-amber-800 dark:text-amber-200">
          {__('Optional but highly recommended—complete itineraries help travelers understand the flow of the experience.', 'Optional but highly recommended—complete itineraries help travelers understand the flow of the experience.')}
        </p>
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
            {isSingleDayTrip
              ? __('No itinerary entries added yet', 'No itinerary entries added yet')
              : __('No itinerary days added yet', 'No itinerary days added yet')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
            {isSingleDayTrip
              ? __('Start by adding your first itinerary entry', 'Start by adding your first itinerary entry')
              : __('Start by adding your first day', 'Start by adding your first day')}
          </p>
          <Button
            type="button"
            onClick={openCreateDayModal}
            variant="outline"
            disabled={!canAddAnotherDay}
          >
            <Plus className="w-4 h-4 mr-2" />
            {emptyStateButtonLabel}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayDayGroups.map(({ raw: dayData, derivedEntries }) => {
            const isExpanded = expandedDays.has(dayData.day);
            const summaryEntries = derivedEntries.slice(0, 3);
            const remainingSummary = derivedEntries.length - summaryEntries.length;
            const counts = getItemCounts(derivedEntries);

            return (
              <Card key={dayData.day} className="overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col flex-1 gap-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isDayFullySelected(dayData.entries)}
                          onChange={() => handleSelectAllEntriesForDay(dayData.entries)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => toggleDay(dayData.day)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          aria-label={__('Toggle day visibility', 'Toggle day visibility')}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {dayLabel} {dayData.day}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {dayData.day_title || __('Untitled itinerary entry', 'Untitled itinerary entry')}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{counts.total} {__('items', 'items')}</span>
                            {counts.meals > 0 && (
                              <span className="flex items-center gap-1">
                                <UtensilsCrossed className="w-3 h-3" />
                                {counts.meals}
                              </span>
                            )}
                            {counts.activities > 0 && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {counts.activities}
                              </span>
                            )}
                            {counts.accommodations > 0 && (
                              <span className="flex items-center gap-1">
                                <Hotel className="w-3 h-3" />
                                {counts.accommodations}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {!isExpanded && dayData.entries.length > 0 && (
                        <div className="ml-8 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                          {summaryEntries.map((entry) => (
                            <span
                              key={entry.id}
                              className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                            >
                              {entry.title?.trim() || __('Untitled activity', 'Untitled activity')}
                            </span>
                          ))}
                          {remainingSummary > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-500">
                              +{remainingSummary} {__('more', 'more')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDayModal(dayData.day, dayData.day_title)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        {__('Edit', 'Edit')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openActivityModal('create', dayData.day)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {addActivityButtonLabel}
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
                {isExpanded && (
                  <CardContent className="p-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/30 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg mb-4">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        {__('Quick Add', 'Quick Add')}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {quickAddOptions.length > 0 ? (
                          quickAddOptions.map((option: any) => {
                            const isImageIcon = option.typeIconData &&
                              typeof option.typeIconData === 'object' &&
                              option.typeIconData.type === 'image';
                            return (
                              <Button
                                key={option.typeId}
                                variant="outline"
                                size="sm"
                                onClick={() => openActivityModal('create', dayData.day, null, {
                                  item_type_id: option.typeId?.toString(),
                                  item_type: option.typeName,
                                  item_icon: option.typeIcon,
                                })}
                                className="flex items-center gap-2 border-blue-500 text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                              >
                                {isImageIcon && option.typeIconData?.value ? (
                                  <img
                                    src={option.typeIconData.value}
                                    alt={option.typeName}
                                    className="w-4 h-4 object-contain"
                                  />
                                ) : (
                                  <IconSelector iconName={option.typeIcon as any} className="w-4 h-4" />
                                )}
                                {option.typeName}
                              </Button>
                            );
                          })
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {__('No item types available. Add item types first.', 'No item types available. Add item types first.')}
                          </p>
                        )}
                      </div>
                    </div>
                    {derivedEntries.length === 0 ? (
                      <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {__('No itinerary activities for this entry yet', 'No itinerary activities for this entry yet')}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openActivityModal('create', dayData.day)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {addActivityButtonLabel}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {derivedEntries
                          .slice()
                          .sort((a, b) => {
                            const [ah, am] = a.start_time.split(':').map(Number);
                            const [bh, bm] = b.start_time.split(':').map(Number);
                            return ah * 60 + am - (bh * 60 + bm);
                          })
                          .map(entry => {
                            const Icon = getIconForType(entry.item_type_id || '1');
                            const isEntryExpanded = expandedEntries.has(entry.id);

                            return (
                              <div
                                key={entry.id}
                                className="flex items-start gap-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedEntries.has(entry.id)}
                                  onChange={() => handleToggleSelectEntry(entry.id)}
                                  className="mt-2 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <div className="flex flex-col items-center min-w-[70px]">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {formatTime(entry.start_time)}
                                  </div>
                                  <div className="mt-1 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                  </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge className="text-xs font-medium px-2 py-0.5">
                                          {getEntryTypeName(entry)}
                                        </Badge>
                                        <button
                                          type="button"
                                          onClick={() => toggleEntryExpanded(entry.id)}
                                          className="text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                          {isEntryExpanded ? __('Hide details', 'Hide details') : __('Show details', 'Show details')}
                                        </button>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Icon className="w-4 h-4 text-gray-500" />
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                          {entry.title?.trim() || __('Untitled activity', 'Untitled activity')}
                                        </h4>
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {entry.location || entry.item_name}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openActivityModal('edit', dayData.day, entry)}
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                      >
                                        <Pencil className="w-4 h-4 mr-1" />
                                        {__('Edit', 'Edit')}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleItineraryEntryDuplicate(dayData.day, entry.id)}
                                        className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                                      >
                                        <Copy className="w-4 h-4 mr-1" />
                                        {__('Duplicate', 'Duplicate')}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleItineraryEntryRemove(dayData.day, entry.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  {isEntryExpanded && (
                                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                      {entry.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{entry.description}</p>
                                      )}
                                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                                        </span>
                                        {entry.duration && (
                                          <span className="flex items-center gap-1">
                                            <Moon className="w-3 h-3" />
                                            {entry.duration}
                                          </span>
                                        )}
                                        {entry.cost && (
                                          <span className="flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" />
                                            {entry.cost}
                                          </span>
                                        )}
                                      </div>
                                      {(entry.included_items?.length || entry.excluded_items?.length) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {entry.included_items?.length ? (
                                            <div>
                                              <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                                                {__('Included', 'Included')}
                                              </p>
                                              <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-0.5">
                                                {entry.included_items.map((item, idx) => (
                                                  <li key={idx}>{item}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          ) : null}
                                          {entry.excluded_items?.length ? (
                                            <div>
                                              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                                                {__('Excluded', 'Excluded')}
                                              </p>
                                              <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-0.5">
                                                {entry.excluded_items.map((item, idx) => (
                                                  <li key={idx}>{item}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          ) : null}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                    </div>
                  )}
                </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>

    {dayModalState.open && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={closeDayModal}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {dayModalState.mode === 'create' ? __('Add Day / Entry', 'Add Day / Entry') : __('Edit Day / Entry', 'Edit Day / Entry')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {__('Provide a title to help identify this itinerary section.', 'Provide a title to help identify this itinerary section.')}
              </p>
            </div>
            <button onClick={closeDayModal} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {dayLabel} #
              </label>
              <Input value={dayModalState.day} readOnly className="mt-1 bg-gray-100 dark:bg-gray-800" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {__('Display Title', 'Display Title')}
              </label>
              <Input
                value={dayModalState.day_title}
                onChange={(e) => setDayModalState(prev => ({ ...prev, day_title: e.target.value }))}
                placeholder={__('e.g., Arrival & Welcome', 'e.g., Arrival & Welcome')}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={closeDayModal}>
              {__('Cancel', 'Cancel')}
            </Button>
            <Button onClick={handleDayModalSave}>
              {dayModalState.mode === 'create' ? __('Add', 'Add') : __('Save', 'Save')}
            </Button>
          </div>
        </div>
      </div>
    )}

    {activityModalState.open && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={closeActivityModal}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activityModalState.mode === 'create'
                  ? __('Add Itinerary Activity', 'Add Itinerary Activity')
                  : __('Edit Itinerary Activity', 'Edit Itinerary Activity')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {__('Configure the activity details, timing, and notes.', 'Configure the activity details, timing, and notes.')}
              </p>
            </div>
            <button onClick={closeActivityModal} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <ItineraryEntryFields
            entry={activityModalState.entryData}
            errors={activityModalErrors}
            itemTypes={types}
            items={items}
            newIncludedItem={activityModalIncludedInput}
            newExcludedItem={activityModalExcludedInput}
            onFieldChange={(field, value) => handleActivityModalFieldChange(field as keyof ItineraryEntry, value)}
            onIncludedItemChange={(value) => setActivityModalIncludedInput(value)}
            onExcludedItemChange={(value) => setActivityModalExcludedInput(value)}
            onAddIncludedItem={handleActivityModalAddIncluded}
            onAddExcludedItem={handleActivityModalAddExcluded}
            onRemoveIncludedItem={handleActivityModalRemoveIncluded}
            onRemoveExcludedItem={handleActivityModalRemoveExcluded}
            calculateDuration={(start, end, type) => calculateDuration(start || '', end || '', type || 'exact')}
            size="default"
            showCardWrapper={true}
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={closeActivityModal}>
              {__('Cancel', 'Cancel')}
            </Button>
            <Button onClick={handleActivityModalSave}>
              {activityModalState.mode === 'create' ? __('Add Activity', 'Add Activity') : __('Save Changes', 'Save Changes')}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
