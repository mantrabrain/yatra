/**
 * Itinerary Page - Day-by-Day Schedule Builder
 * Manage itinerary entries organized by days with expandable cards
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  MoreVertical, 
  Trash2, 
  MapPin, 
  Clock, 
  UtensilsCrossed,
  Hotel,
  Calendar,
  CalendarDays,
  AlertCircle,
  Pencil
} from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { apiClient } from '../lib/api';
import { useToast } from '../components/ui/toast';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { SearchableSelect } from '../components/ui/searchable-select';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Alert } from '../components/ui/alert';
import { IconSelector } from '../components/ui/icon-selector';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';

interface ItineraryEntry {
  id: number;
  trip_id: number;
  trip_title: string;
  day: number;
  day_title?: string;
  item_type: string;
  item_name: string;
  item_icon: string;
  item_color?: string;
  item_type_id: number | null;
  item_id: number | null;
  title: string;
  description: string;
  location?: string;
  duration?: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

interface DayGroup {
  trip_id: number;
  trip_title: string;
  day: number;
  day_title?: string;
  entries: ItineraryEntry[];
}

const Itinerary: React.FC = () => {
  // Get trip_id from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const tripIdParam = urlParams.get('trip_id');
  
  const [tripFilter, setTripFilter] = useState(tripIdParam || '');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<{ tripId: number; day: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; entry: ItineraryEntry | null }>({
    isOpen: false,
    entry: null,
  });
  const [dayMenuOpen, setDayMenuOpen] = useState<{ tripId: number; day: number } | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<{ isOpen: boolean; entryIds: number[] }>({
    isOpen: false,
    entryIds: [],
  });
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();

  // Update trip filter when URL param changes
  useEffect(() => {
    if (tripIdParam) {
      setTripFilter(tripIdParam);
    }
  }, [tripIdParam]);

  // Fetch trips for filter
  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ['trips-simple'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/trips', {
          params: {
            per_page: 100,
            status: 'all' // Get all trips for filter
          }
        });
        const trips = response?.data?.data || response?.data || response || [];
        return Array.isArray(trips) ? trips : [];
      } catch (error: any) {
        showToast(error?.message || __('Failed to load trips', 'Failed to load trips'), 'error');
        return [];
      }
    },
    enabled: can('yatra_view_trips'),
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
  });

  // Fetch item types and items for mapping
  const { data: itemTypesData } = useQuery({
    queryKey: ['item-types'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/item-types', {
          params: { per_page: 100, status: 'publish' }
        });
        return response?.data?.data || response?.data || response || [];
      } catch (error: any) {
        return [];
      }
    },
    enabled: can('yatra_view_trips'),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchOnReconnect: true, // Only refetch on network reconnect
  });

  const { data: itemsData } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/items', {
          params: { per_page: 1000, status: 'publish' }
        });
        // Handle different response structures
        let items = [];
        if (response?.data?.data) {
          items = response.data.data;
        } else if (response?.data) {
          items = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          items = response;
        }
        
        // Ensure items is an array
        const itemsArray = Array.isArray(items) ? items : [];
        
        return itemsArray;
      } catch (error: any) {
        console.error('Error fetching items:', error);
        return [];
      }
    },
    enabled: can('yatra_view_trips'),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchOnReconnect: true, // Only refetch on network reconnect
  });

  // Helper function to map item_type_id and item_id to item_type/item_name/item_icon/item_color
  const mapItemIds = (itemTypeId: number | null | undefined, itemId: number | null | undefined) => {
    const itemTypes = Array.isArray(itemTypesData) ? itemTypesData : [];
    const items = Array.isArray(itemsData) ? itemsData : [];

    // Find item type
    const itemType = itemTypeId ? itemTypes.find((type: any) => type.id === itemTypeId || type.id?.toString() === itemTypeId?.toString()) : null;
    
    // Find item
    const item = itemId ? items.find((it: any) => it.id === itemId || it.id?.toString() === itemId?.toString()) : null;

    // Extract icon and color from item type
    let iconName = 'footprints'; // default
    let itemColor = 'gray'; // default
    if (itemType) {
      // Extract icon
      if (itemType.icon) {
        if (typeof itemType.icon === 'string') {
          iconName = itemType.icon;
        } else if (typeof itemType.icon === 'object' && itemType.icon.value) {
          iconName = itemType.icon.value;
        }
      }
      // Extract color
      if (itemType.color) {
        itemColor = itemType.color;
      }
    }

    if (itemType && item) {
      return {
        item_type: itemType.name || 'Activity',
        item_name: item.name || 'Activity',
        item_icon: iconName,
        item_color: itemColor,
      };
    }

    if (itemType) {
      // Only item type found
      return {
        item_type: itemType.name || 'Activity',
        item_name: itemType.name || 'Activity',
        item_icon: iconName,
        item_color: itemColor,
      };
    }

    // Fallback
    return { item_type: 'Activity', item_name: 'Activity', item_icon: 'footprints', item_color: 'gray' };
  };

  // Helper to parse time field to start_time and end_time
  const parseTime = (time: string | null | undefined): { start_time: string; end_time: string } => {
    if (!time) return { start_time: '08:00', end_time: '17:00' };
    
    // Try to parse formats like "08:00-17:00" or "08:00 to 17:00"
    const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(?:-|to|–)\s*(\d{1,2}):(\d{2})/i);
    if (timeMatch) {
      return {
        start_time: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`,
        end_time: `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`,
      };
    }

    // Try single time format
    const singleTime = time.match(/(\d{1,2}):(\d{2})/);
    if (singleTime) {
      const hour = parseInt(singleTime[1]);
      return {
        start_time: `${singleTime[1].padStart(2, '0')}:${singleTime[2]}`,
        end_time: `${((hour + 1) % 24).toString().padStart(2, '0')}:${singleTime[2]}`,
      };
    }

    return { start_time: '08:00', end_time: '17:00' };
  };

  const { data, isLoading, error, refetch } = useQuery<DayGroup[]>({
    queryKey: ['itinerary', tripFilter, tripsData],
    queryFn: async (): Promise<DayGroup[]> => {
      try {
        const trips = Array.isArray(tripsData) ? tripsData : [];
        const allEntries: ItineraryEntry[] = [];
        const allDays = new Map<string, { trip_id: number; trip_title: string; day: number; day_title: string }>();

        // Fetch itinerary data for the selected trip
        if (!tripFilter) {
          return [];
        }
        const tripsToFetch = trips.filter((t: any) => t.id === parseInt(tripFilter));

        for (const trip of tripsToFetch) {
          try {
            // Add timestamp to prevent caching
            const tripResponse = await apiClient.get(`/trips/${trip.id}`, {
              params: {
                _t: Date.now(), // Cache buster
              }
            });
            const tripData = tripResponse?.data || tripResponse;
            const itineraryDays = tripData.itinerary_days || [];

            // Process each day
            for (const day of itineraryDays) {
              const dayNumber = day.day_number || day.day || 1;
              const dayTitle = day.title || day.day_title || '';
              const entries = day.entries || [];

              // Process each entry (only activities, not day entries)
              for (const entry of entries) {
                // Ensure entry has required fields from database
                if (!entry || !entry.id) {
                  continue;
                }

                // Skip day entries (entries where item_type_id and item_id are null)
                // Day entries should not be displayed as activities
                if ((entry.item_type_id === null || entry.item_type_id === undefined || entry.item_type_id === 0) &&
                    (entry.item_id === null || entry.item_id === undefined || entry.item_id === 0)) {
                  continue;
                }

                const mapped = mapItemIds(entry.item_type_id, entry.item_id);
                const times = parseTime(entry.time);

                const processedEntry = {
                  id: entry.id || 0,
                  trip_id: trip.id,
                  trip_title: trip.title || trip.name || '',
                  day: dayNumber,
                  day_title: dayTitle,
                  item_type: mapped.item_type,
                  item_name: mapped.item_name,
                  item_icon: mapped.item_icon,
                  item_color: mapped.item_color || 'gray',
                  item_type_id: entry.item_type_id || null,
                  item_id: entry.item_id || null,
                  title: entry.title || '',
                  description: entry.description || '',
                  location: entry.location || '',
                  duration: entry.duration || '',
                  start_time: times.start_time,
                  end_time: times.end_time,
                  status: entry.status || 'active',
                  created_at: entry.created_at || entry.createdAt || '',
                };

                allEntries.push(processedEntry);
              }
            }
            
            // Also track all days (even if they have no activities) to ensure they appear in the listing
            for (const day of itineraryDays) {
              const dayNumber = day.day_number || day.day || 1;
              const dayTitle = day.title || day.day_title || '';
              const dayKey = `${trip.id}-${dayNumber}`;
              
              // Store day info for grouping later
              if (!allDays.has(dayKey)) {
                allDays.set(dayKey, {
                  trip_id: trip.id,
                  trip_title: trip.title || trip.name || '',
                  day: dayNumber,
                  day_title: dayTitle,
                });
              }
            }
          } catch (error: any) {
            console.error(`Failed to fetch itinerary for trip ${trip.id}:`, error);
          }
        }

        // Group by trip and day
        // First, create groups from all days (even if they have no activities)
        const grouped: DayGroup[] = [];
        const seen = new Set<string>();

        // Add all days first (from allDays map)
        allDays.forEach((dayInfo: { trip_id: number; trip_title: string; day: number; day_title: string }, key: string) => {
          if (!seen.has(key)) {
            seen.add(key);
            grouped.push({
              trip_id: dayInfo.trip_id,
              trip_title: dayInfo.trip_title,
              day: dayInfo.day,
              day_title: dayInfo.day_title,
              entries: allEntries.filter(e => e.trip_id === dayInfo.trip_id && e.day === dayInfo.day),
            });
          }
        });

        // Also add any days that have entries but weren't in allDays (fallback)
        allEntries.forEach(entry => {
          const key = `${entry.trip_id}-${entry.day}`;
          if (!seen.has(key)) {
            seen.add(key);
            grouped.push({
              trip_id: entry.trip_id,
              trip_title: entry.trip_title,
              day: entry.day,
              day_title: entry.day_title,
              entries: allEntries.filter(e => e.trip_id === entry.trip_id && e.day === entry.day),
            });
          }
        });

        // Sort by trip_id and day
        grouped.sort((a, b) => {
          if (a.trip_id !== b.trip_id) return a.trip_id - b.trip_id;
          return a.day - b.day;
        });

        return grouped;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load itinerary', 'Failed to load itinerary'), 'error');
        return [];
      }
    },
    enabled: can('yatra_view_trips') && !!tripsData && !!tripFilter,
    staleTime: 0, // Always refetch to ensure fresh data
    gcTime: 0, // Don't cache to ensure fresh data (formerly cacheTime)
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
  });

  // Auto-expand first day when data loads
  useEffect(() => {
    if (data && data.length > 0 && expandedDays.size === 0) {
      const firstDay = data[0];
      setExpandedDays(new Set([`${firstDay.trip_id}-${firstDay.day}`]));
    }
  }, [data, expandedDays.size]);

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await apiClient.delete('/itinerary', {
        data: { ids },
      });
      return response?.data || response;
    },
    onSuccess: (data) => {
      const deleted = data?.deleted || 0;
      const failed = data?.failed || 0;
      
      if (deleted > 0) {
        showToast(
          failed > 0
            ? `${deleted} item(s) deleted successfully. ${failed} item(s) failed to delete.`
            : `${deleted} item(s) deleted successfully.`,
          'success'
        );
      } else {
        showToast('Failed to delete items. Please try again.', 'error');
      }
      
      setBulkDeleteConfirm({ isOpen: false, entryIds: [] });
      setSelectedEntries(new Set());
      queryClient.invalidateQueries({ queryKey: ['itinerary'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trips-simple'] });
      refetch();
    },
    onError: (error: any) => {
      showToast(error?.message || 'Failed to delete items. Please try again.', 'error');
      setBulkDeleteConfirm({ isOpen: false, entryIds: [] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (entry: ItineraryEntry) => {
      try {
        const response = await apiClient.delete(`/itinerary/${entry.id}`);
        return { response: response?.data || response, entry };
      } catch (error: any) {
        throw error;
      }
    },
    onSuccess: (data) => {
      const entry = data.entry;
      const isDayDeletion = (entry as any)?._isDayDeletion;
      showToast(
        isDayDeletion
          ? __('Day and all activities deleted successfully', 'Day and all activities deleted successfully')
          : __('Itinerary entry deleted successfully', 'Itinerary entry deleted successfully'),
        'success'
      );
      // Close confirmation dialog
      setDeleteConfirm({ isOpen: false, entry: null });
      // Refresh itinerary data
      queryClient.invalidateQueries({ queryKey: ['itinerary'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trips-simple'] });
      // Force refetch
      refetch();
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete itinerary entry', 'Failed to delete itinerary entry'), 'error');
    },
  });

  // Mutation to update itinerary entry item
  const updateItemMutation = useMutation({
    mutationFn: async ({ entryId, itemId, itemTypeId }: { entryId: number; itemId: number; itemTypeId: number }) => {
      // First, get the current entry data
      const currentEntry = await apiClient.get(`/itinerary/${entryId}`);
      const entryData = currentEntry?.data?.data || currentEntry?.data || currentEntry;
      
      // Update with new item_id and item_type_id
      return await apiClient.put(`/itinerary/${entryId}`, {
        ...entryData,
        item_id: itemId,
        item_type_id: itemTypeId,
      });
    },
    onSuccess: () => {
      showToast(__('Item updated successfully', 'Item updated successfully'), 'success');
      queryClient.invalidateQueries({ queryKey: ['itinerary'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trips-simple'] });
      refetch();
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to update item', 'Failed to update item'), 'error');
    },
  });

  const handleAddDay = () => {
    // Navigate to add day form - this creates a new day entry
    // If a trip is selected, pass trip_id; otherwise let the form show the trip selector
    if (tripFilter) {
      // Get the max day number for this trip to suggest the next day
      const tripEntries = dayGroups.filter((dg: DayGroup) => dg.trip_id === parseInt(tripFilter));
      const maxDay = tripEntries.length > 0 
        ? Math.max(...tripEntries.map((dg: DayGroup) => dg.day))
        : 0;
      const nextDay = maxDay + 1;
      
      window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripFilter}&day=${nextDay}&mode=day`;
    } else {
      // No trip selected - navigate without trip_id so form shows trip selector
      window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&mode=day`;
    }
  };

  // Get quick add options from item types and items
  const quickAddOptions = useMemo(() => {
    const itemTypes = Array.isArray(itemTypesData) ? itemTypesData : [];
    
    return itemTypes.map((itemType: any) => {
      // Extract icon - handle both string and object formats
      let iconName = 'footprints'; // default
      if (itemType.icon) {
        if (typeof itemType.icon === 'string') {
          iconName = itemType.icon;
        } else if (typeof itemType.icon === 'object' && itemType.icon.value) {
          // If it's an image URL, we can't use IconSelector, so use a default
          // Otherwise use the value as icon name
          if (itemType.icon.type === 'image') {
            iconName = 'image'; // Special case for images
          } else {
            iconName = itemType.icon.value;
          }
        }
      }
      
      // Extract color - default to blue if not set
      const color = itemType.color || 'blue';
      
      return {
        typeId: itemType.id,
        typeName: itemType.name || '',
        typeIcon: iconName,
        typeIconData: itemType.icon, // Keep full icon data for image handling
        typeColor: color,
      };
    }).filter((option: any) => option.typeName); // Filter out invalid options
  }, [itemTypesData]);

  const handleQuickAdd = (typeId: number | string) => {
    if (!selectedDay) {
      // Select first day if none selected
      const firstDay = data?.[0];
      if (firstDay) {
        setSelectedDay({ tripId: firstDay.trip_id, day: firstDay.day });
        const key = `${firstDay.trip_id}-${firstDay.day}`;
        setExpandedDays(new Set([key]));
      }
    }
    
    const tripId = selectedDay?.tripId || (tripFilter ? parseInt(tripFilter) : 1);
    const day = selectedDay?.day || 1;
    
    // Use item type ID for navigation
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripId}&day=${day}&type_id=${typeId}`;
  };

  const handleEdit = (entry: ItineraryEntry) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=edit&id=${entry.id}`;
  };

  const handleEditDay = (tripId: number, day: number) => {
    // Navigate to edit day form - find the day entry (with null item_type_id and item_id)
    const dayGroup = dayGroups.find((dg: DayGroup) => dg.trip_id === tripId && dg.day === day);
    if (dayGroup && dayGroup.entries.length > 0) {
      // Find the day entry (the one with null/undefined item_type_id and item_id)
      // Check explicitly for null/undefined, not just falsy values (to avoid matching 0)
      const dayEntry = dayGroup.entries.find((entry: any) => 
        (entry.item_type_id === null || entry.item_type_id === undefined) && 
        (entry.item_id === null || entry.item_id === undefined)
      );
      
      if (dayEntry && dayEntry.id) {
        // Use the day entry's ID for edit mode
        window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=edit&id=${dayEntry.id}&mode=day`;
      } else {
        // No day entry found, but day exists - use first activity's ID to get day info
        // The form will detect it's day mode and load day info from the day metadata
        const firstEntry = dayGroup.entries[0];
        if (firstEntry && firstEntry.id) {
          // Navigate to edit mode with first entry's ID, but mode=day will tell form to edit day
          window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=edit&id=${firstEntry.id}&mode=day&trip_id=${tripId}&day=${day}`;
        } else {
          // Fallback to create mode
          window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripId}&day=${day}&mode=day`;
        }
      }
    } else {
      // No entries yet, navigate to create day form with existing day info
      window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripId}&day=${day}&mode=day`;
    }
    setDayMenuOpen(null);
  };

  const handleDeleteDay = (tripId: number, day: number) => {
    // Find the day entry to delete
    const dayGroup = dayGroups.find((dg: DayGroup) => dg.trip_id === tripId && dg.day === day);
    if (dayGroup && dayGroup.entries.length > 0) {
      // Find the day entry (the one with null/undefined item_type_id and item_id)
      const dayEntry = dayGroup.entries.find((entry: any) => 
        (entry.item_type_id === null || entry.item_type_id === undefined) && 
        (entry.item_id === null || entry.item_id === undefined)
      );
      
      if (dayEntry && dayEntry.id) {
        // Mark this as a day deletion for custom message
        const dayEntryWithFlag = { ...dayEntry, _isDayDeletion: true, _dayNumber: day } as ItineraryEntry & { _isDayDeletion?: boolean; _dayNumber?: number };
        setDeleteConfirm({ isOpen: true, entry: dayEntryWithFlag });
      } else {
        // No day entry found, but day exists - show error
        showToast(__('Day entry not found', 'Day entry not found'), 'error');
      }
    } else {
      showToast(__('Day not found', 'Day not found'), 'error');
    }
    setDayMenuOpen(null);
  };

  const handleDelete = (entry: ItineraryEntry) => {
    setDeleteConfirm({ isOpen: true, entry });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.entry) {
      deleteMutation.mutate(deleteConfirm.entry);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, entry: null });
  };

  // Bulk selection handlers
  const handleToggleSelect = (entryId: number) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (dayGroup: DayGroup) => {
    const allEntryIds = dayGroup.entries.map(e => e.id);
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      const allSelected = allEntryIds.every(id => newSet.has(id));
      if (allSelected) {
        allEntryIds.forEach(id => newSet.delete(id));
      } else {
        allEntryIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleSelectAllDays = () => {
    const allEntryIds = dayGroups.flatMap(dg => dg.entries.map(e => e.id));
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      const allSelected = allEntryIds.length > 0 && allEntryIds.every(id => newSet.has(id));
      if (allSelected) {
        allEntryIds.forEach(id => newSet.delete(id));
      } else {
        allEntryIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleBulkDelete = () => {
    const entryIds = Array.from(selectedEntries);
    if (entryIds.length === 0) return;
    
    setBulkDeleteConfirm({ isOpen: true, entryIds });
  };

  const handleBulkDeleteConfirm = () => {
    bulkDeleteMutation.mutate(bulkDeleteConfirm.entryIds);
  };

  const handleBulkDeleteCancel = () => {
    setBulkDeleteConfirm({ isOpen: false, entryIds: [] });
  };

  const toggleDay = (tripId: number, day: number) => {
    const key = `${tripId}-${day}`;
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setSelectedDay({ tripId, day });
  };

  const getItemCounts = (entries: ItineraryEntry[]) => {
    const meals = entries.filter(e => e.item_type === 'Meal').length;
    const activities = entries.filter(e => e.item_type === 'Activity').length;
    const accommodations = entries.filter(e => e.item_type === 'Accommodation').length;
    return { meals, activities, accommodations, total: entries.length };
  };


  const formatTime = (time: string) => {
    // Convert 24h to 12h format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const dayGroups: DayGroup[] = (data || []) as DayGroup[];

  // Close day menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setDayMenuOpen(null);
    };
    if (dayMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [dayMenuOpen]);

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {__('Build your complete itinerary with activities, meals, and accommodations', 'Build your complete itinerary with activities, meals, and accommodations')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedEntries.size > 0 && (
            <ConditionalRender capability="yatra_delete_trips">
              <Button 
                onClick={handleBulkDelete}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {__('Delete Selected', 'Delete Selected')} ({selectedEntries.size})
              </Button>
            </ConditionalRender>
          )}
          {tripFilter && (() => {
            const selectedTrip = tripsData?.find((t: any) => t.id.toString() === tripFilter);
            const isSingleDay = selectedTrip?.trip_type === 'single_day';
            const buttonLabel = isSingleDay ? __('Add Entry', 'Add Entry') : __('Add Day', 'Add Day');
            
            return (
              <ConditionalRender capability="yatra_edit_trips">
                <Button onClick={handleAddDay} className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
                  <Plus className="w-4 h-4" />
                  {buttonLabel}
                </Button>
              </ConditionalRender>
            );
          })()}
        </div>
      </div>

      {/* Trip Selector - Clean Design */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__('Select Trip', 'Select Trip')}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {__('Choose a trip to manage its itinerary entries and day-by-day schedule', 'Choose a trip to manage its itinerary entries and day-by-day schedule')}
            </p>
          </div>
        </div>
        
        <div className="space-y-4 overflow-visible">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {__('Trip', 'Trip')} <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={tripFilter}
              onChange={(value) => setTripFilter(value)}
              options={((Array.isArray(tripsData) ? tripsData : []).map((trip: any) => ({
                value: trip.id.toString(),
                label: `${trip.title || trip.name || ''}${trip.trip_type === 'single_day' ? ' (Single Day)' : trip.trip_type === 'multi_day' ? ' (Multi-Day)' : ''}`,
              })) || [])}
              placeholder={__('Search or select a trip...', 'Search or select a trip...')}
              searchPlaceholder={__('Search by trip name or ID...', 'Search by trip name or ID...')}
              className="w-full"
              required
            />
          </div>

          {tripFilter && (() => {
            const tripsList = Array.isArray(tripsData) ? tripsData : [];
            const selectedTrip = tripsList.find((t: any) => t.id === parseInt(tripFilter));
            return selectedTrip ? (
              <div className="flex items-center gap-4 pt-2 border-t border-blue-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">{selectedTrip.starting_location || selectedTrip.start_location || 'N/A'}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{selectedTrip.ending_location || selectedTrip.end_location || 'N/A'}</span>
                </div>
                {selectedTrip.trip_type && (
                  <Badge className={
                    selectedTrip.trip_type === 'single_day'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                  }>
                    {selectedTrip.trip_type === 'single_day' ? __('Single Day', 'Single Day') : __('Multi-Day', 'Multi-Day')}
                  </Badge>
                )}
              </div>
            ) : null;
          })()}

          {!tripFilter && (
            <div className="mt-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200/50 dark:border-gray-700/50 overflow-visible">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {__('Get Started', 'Get Started')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {__('Select a trip from the dropdown above to view and manage its itinerary entries and day-by-day schedule.', 'Select a trip from the dropdown above to view and manage its itinerary entries and day-by-day schedule.')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConditionalRender capability="yatra_view_trips">
        {error ? (
          <Alert variant="error" title={__('Error Loading Itinerary', 'Error Loading Itinerary')}>
            {__('We couldn\'t load itinerary entries. Please refresh the page or try again later.', 'We couldn\'t load itinerary entries. Please refresh the page or try again later.')}
          </Alert>
        ) : isLoading || isLoadingTrips ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : dayGroups.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {(() => {
                      const selectedTrip = tripsData?.find((t: any) => t.id.toString() === tripFilter);
                      const isSingleDay = selectedTrip?.trip_type === 'single_day';
                      return isSingleDay ? __('No itinerary entries yet', 'No itinerary entries yet') : __('No itinerary days yet', 'No itinerary days yet');
                    })()}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {(() => {
                      const selectedTrip = tripsData?.find((t: any) => t.id.toString() === tripFilter);
                      const isSingleDay = selectedTrip?.trip_type === 'single_day';
                      return isSingleDay 
                        ? __('Start building your itinerary by adding your first entry.', 'Start building your itinerary by adding your first entry.')
                        : __('Start building your itinerary by adding your first day.', 'Start building your itinerary by adding your first day.');
                    })()}
                  </p>
                  <Button onClick={handleAddDay} className="flex items-center gap-2 mx-auto">
                    <Plus className="w-4 h-4" />
                    {(() => {
                      const selectedTrip = tripsData?.find((t: any) => t.id.toString() === tripFilter);
                      const isSingleDay = selectedTrip?.trip_type === 'single_day';
                      return isSingleDay ? __('Add Your First Entry', 'Add Your First Entry') : __('Add Your First Day', 'Add Your First Day');
                    })()}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Bulk Select All Option */}
            {dayGroups.length > 0 && (
              <ConditionalRender capability="yatra_delete_trips">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={dayGroups.length > 0 && dayGroups.every(dg => dg.entries.length > 0 && dg.entries.every(e => selectedEntries.has(e.id)))}
                      onChange={handleSelectAllDays}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      {__('Select All', 'Select All')}
                    </label>
                    {selectedEntries.size > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({selectedEntries.size} {__('selected', 'selected')})
                      </span>
                    )}
                  </div>
                  {selectedEntries.size > 0 && (
                    <Button 
                      onClick={handleBulkDelete}
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {__('Delete Selected', 'Delete Selected')}
                    </Button>
                  )}
                </div>
              </ConditionalRender>
            )}
            {dayGroups.map((dayGroup) => {
              const key = `${dayGroup.trip_id}-${dayGroup.day}`;
              const isExpanded = expandedDays.has(key);
              const counts = getItemCounts(dayGroup.entries);
              const sortedEntries = [...dayGroup.entries].sort((a, b) => {
                const timeA = a.start_time.split(':').map(Number);
                const timeB = b.start_time.split(':').map(Number);
                return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
              });

              return (
              <Card key={key} className="overflow-visible">
                <CardContent className="p-0 overflow-visible">
                  {/* Day Header */}
                  <div 
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <ConditionalRender capability="yatra_delete_trips">
                      <input
                        type="checkbox"
                        checked={dayGroup.entries.length > 0 && dayGroup.entries.every(e => selectedEntries.has(e.id))}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectAll(dayGroup);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        title={__('Select all entries for this day', 'Select all entries for this day')}
                      />
                    </ConditionalRender>
                    <div 
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => toggleDay(dayGroup.trip_id, dayGroup.day)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-medium">
                          {__('Day', 'Day')} {dayGroup.day}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {dayGroup.day_title 
                              ? `${__('Day', 'Day')} ${dayGroup.day}: ${dayGroup.day_title}`
                              : `${__('Day', 'Day')} ${dayGroup.day}`
                            }
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <span>{counts.total} {__('items', 'items')}</span>
                            {counts.meals > 0 && (
                              <div className="flex items-center gap-1">
                                <UtensilsCrossed className="w-3.5 h-3.5" />
                                <span>{counts.meals}</span>
                              </div>
                            )}
                            {counts.activities > 0 && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{counts.activities}</span>
                              </div>
                            )}
                            {counts.accommodations > 0 && (
                              <div className="flex items-center gap-1">
                                <Hotel className="w-3.5 h-3.5" />
                                <span>{__('Stay', 'Stay')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 relative">
                      <ConditionalRender capability="yatra_edit_trips">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (dayMenuOpen && dayMenuOpen.tripId === dayGroup.trip_id && dayMenuOpen.day === dayGroup.day) {
                                setDayMenuOpen(null);
                              } else {
                                setDayMenuOpen({ tripId: dayGroup.trip_id, day: dayGroup.day });
                              }
                            }}
                            title={__('Day Options', 'Day Options')}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                          {dayMenuOpen && dayMenuOpen.tripId === dayGroup.trip_id && dayMenuOpen.day === dayGroup.day && (
                            <div 
                              className="absolute right-0 top-10 z-50 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleEditDay(dayGroup.trip_id, dayGroup.day)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Pencil className="w-4 h-4" />
                                {__('Edit Day', 'Edit Day')}
                              </button>
                              <ConditionalRender capability="yatra_delete_trips">
                                <button
                                  onClick={() => handleDeleteDay(dayGroup.trip_id, dayGroup.day)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {__('Delete Day', 'Delete Day')}
                                </button>
                              </ConditionalRender>
                            </div>
                          )}
                        </div>
                      </ConditionalRender>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Day Content - Expanded */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 overflow-visible">
                      {/* Quick Add Section */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                          {__('QUICK ADD', 'QUICK ADD')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {quickAddOptions.length > 0 ? (
                            quickAddOptions.map((option: any) => {
                              // Determine if icon is an image
                              const isImageIcon = option.typeIconData && 
                                typeof option.typeIconData === 'object' && 
                                option.typeIconData.type === 'image';
                              
                              // Get color classes based on typeColor
                              const colorClasses: Record<string, string> = {
                                blue: 'border-blue-500 text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20',
                                green: 'border-green-500 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20',
                                red: 'border-red-500 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20',
                                yellow: 'border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20',
                                purple: 'border-purple-500 text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20',
                                orange: 'border-orange-500 text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20',
                                pink: 'border-pink-500 text-pink-700 hover:bg-pink-50 dark:text-pink-400 dark:hover:bg-pink-900/20',
                                indigo: 'border-indigo-500 text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20',
                                gray: 'border-gray-500 text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900/20',
                              };
                              
                              const colorClass = colorClasses[option.typeColor] || colorClasses.blue;
                              
                              return (
                                <Button
                                  key={option.typeId}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickAdd(option.typeId)}
                                  className={`flex items-center gap-2 ${colorClass}`}
                                  style={{
                                    borderColor: option.typeColor ? `var(--color-${option.typeColor}-500)` : undefined,
                                  }}
                                >
                                  {isImageIcon && option.typeIconData.value ? (
                                    <img 
                                      src={option.typeIconData.value} 
                                      alt={option.typeName}
                                      className="w-4 h-4 object-contain"
                                    />
                                  ) : (
                                    <IconSelector 
                                      iconName={option.typeIcon as any} 
                                      className="w-4 h-4"
                                    />
                                  )}
                                  {option.typeName}
                                </Button>
                              );
                            })
                          ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {__('No item types available', 'No item types available')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Itinerary Items */}
                      <div className="p-4 space-y-3 overflow-visible">
                        {sortedEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-start gap-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-visible"
                          >
                            {/* Checkbox */}
                            <ConditionalRender capability="yatra_delete_trips">
                              <input
                                type="checkbox"
                                checked={selectedEntries.has(entry.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelect(entry.id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                title={__('Select this entry', 'Select this entry')}
                              />
                            </ConditionalRender>
                            {/* Time */}
                            <div className="flex flex-col items-center min-w-[80px]">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatTime(entry.start_time)}
                              </div>
                              <div className="mt-1 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge 
                                      className="text-xs font-medium px-2 py-0.5"
                                      style={{
                                        backgroundColor: entry.item_color === 'blue' ? 'rgb(219, 234, 254)' : 
                                                       entry.item_color === 'green' ? 'rgb(220, 252, 231)' :
                                                       entry.item_color === 'orange' ? 'rgb(255, 237, 213)' :
                                                       entry.item_color === 'purple' ? 'rgb(243, 232, 255)' :
                                                       entry.item_color === 'red' ? 'rgb(254, 226, 226)' :
                                                       entry.item_color === 'yellow' ? 'rgb(254, 249, 195)' :
                                                       'rgb(243, 244, 246)',
                                        color: entry.item_color === 'blue' ? 'rgb(29, 78, 216)' :
                                               entry.item_color === 'green' ? 'rgb(21, 128, 61)' :
                                               entry.item_color === 'orange' ? 'rgb(194, 65, 12)' :
                                               entry.item_color === 'purple' ? 'rgb(126, 34, 206)' :
                                               entry.item_color === 'red' ? 'rgb(185, 28, 28)' :
                                               entry.item_color === 'yellow' ? 'rgb(161, 98, 7)' :
                                               'rgb(55, 65, 81)',
                                        borderColor: entry.item_color === 'blue' ? 'rgb(147, 197, 253)' :
                                                    entry.item_color === 'green' ? 'rgb(134, 239, 172)' :
                                                    entry.item_color === 'orange' ? 'rgb(254, 215, 170)' :
                                                    entry.item_color === 'purple' ? 'rgb(221, 214, 254)' :
                                                    entry.item_color === 'red' ? 'rgb(252, 165, 165)' :
                                                    entry.item_color === 'yellow' ? 'rgb(253, 230, 138)' :
                                                    'rgb(209, 213, 219)',
                                        borderWidth: '1px',
                                        borderStyle: 'solid',
                                      }}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <IconSelector 
                                          iconName={entry.item_icon as any} 
                                          className="w-3 h-3"
                                        />
                                        <span>{entry.item_type}</span>
                                      </div>
                                    </Badge>
                                  </div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    {entry.title}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {entry.description}
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    {entry.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>{entry.location}</span>
                                      </div>
                                    )}
                                    {entry.duration && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{entry.duration}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 relative z-10">
                                  <Select
                                    value={(() => {
                                      // Find the current item by item_id to get exact name match
                                      if (entry.item_id && itemsData) {
                                        const currentItem = itemsData.find((item: any) => 
                                          item.id === entry.item_id || item.id?.toString() === entry.item_id?.toString()
                                        );
                                        return currentItem?.name || entry.item_name || '';
                                      }
                                      return entry.item_name || '';
                                    })()}
                                    className="h-8 text-xs min-w-[140px] w-auto relative z-10 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-2 py-1"
                                    style={{ 
                                      minWidth: '140px', 
                                      width: 'auto',
                                      color: 'rgb(17, 24, 39)',
                                      backgroundColor: 'rgb(255, 255, 255)',
                                      paddingLeft: '8px',
                                      paddingRight: '24px',
                                      paddingTop: '4px',
                                      paddingBottom: '4px',
                                    }}
                                    onChange={(e) => {
                                      // Find the selected item
                                      const selectedItemName = e.target.value;
                                      if (!selectedItemName) return;
                                      
                                      const selectedItem = itemsData?.find((item: any) => 
                                        item.name === selectedItemName
                                      );
                                      
                                      // Use entry.item_type_id directly (no need to find by name)
                                      if (selectedItem && entry.item_type_id) {
                                        // Update the entry with new item
                                        updateItemMutation.mutate({
                                          entryId: entry.id,
                                          itemId: selectedItem.id,
                                          itemTypeId: entry.item_type_id,
                                        });
                                      }
                                    }}
                                    disabled={updateItemMutation.isPending}
                                  >
                                    <option value="">{__('Select item...', 'Select item...')}</option>
                                    {(() => {
                                      // Use entry.item_type_id directly
                                      const itemTypeId = entry.item_type_id;
                                      
                                      // Ensure itemsData is an array
                                      const allItems = Array.isArray(itemsData) ? itemsData : [];
                                      
                                      if (!itemTypeId || itemTypeId === null || itemTypeId === undefined) {
                                        return (
                                          <option value="" disabled>
                                            {__('No item type selected', 'No item type selected')}
                                          </option>
                                        );
                                      }
                                      
                                      if (allItems.length === 0) {
                                        return (
                                          <option value="" disabled>
                                            {__('Loading items...', 'Loading items...')}
                                          </option>
                                        );
                                      }
                                      
                                      // Convert itemTypeId to number for comparison
                                      const itemTypeIdNum = itemTypeId ? (typeof itemTypeId === 'string' ? parseInt(itemTypeId, 10) : Number(itemTypeId)) : null;
                                      
                                      if (!itemTypeIdNum || itemTypeIdNum <= 0 || isNaN(itemTypeIdNum)) {
                                        return (
                                          <option value="" disabled>
                                            {__('Invalid item type', 'Invalid item type')}
                                          </option>
                                        );
                                      }
                                      
                                      // Filter items by this item type ID
                                      // Items from API have 'type_id' field
                                      const filteredItems = allItems.filter((item: any) => {
                                        if (!item || !item.id) return false;
                                        
                                        // Get type_id from item - could be type_id or item_type_id
                                        const itemTypeIdFromItem = item.type_id || item.item_type_id;
                                        
                                        if (!itemTypeIdFromItem) return false;
                                        
                                        // Convert to number for comparison
                                        const itemTypeIdNumFromItem = typeof itemTypeIdFromItem === 'string' 
                                          ? parseInt(itemTypeIdFromItem, 10) 
                                          : Number(itemTypeIdFromItem);
                                        
                                        // Compare as numbers
                                        return !isNaN(itemTypeIdNumFromItem) && itemTypeIdNumFromItem === itemTypeIdNum;
                                      });
                                      
                                      if (filteredItems.length === 0) {
                                        return (
                                          <option value="" disabled>
                                            {__('No items available for this type', 'No items available for this type')}
                                          </option>
                                        );
                                      }
                                      
                                      return filteredItems.map((item: any) => (
                                        <option key={item.id} value={item.name}>
                                          {item.name}
                                        </option>
                                      ));
                                    })()}
                                  </Select>
                                  <ConditionalRender capability="yatra_edit_trips">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(entry)}
                                      className="h-8 w-8"
                                      title={__('Edit Activity', 'Edit Activity')}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                  </ConditionalRender>
                                  <ConditionalRender capability="yatra_delete_trips">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(entry)}
                                      className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                      title={__('Delete', 'Delete')}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </ConditionalRender>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Add Activity Button */}
                        <ConditionalRender capability="yatra_edit_trips">
                          <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 border-dashed"
                            onClick={() => {
                              const tripId = dayGroup.trip_id;
                              const day = dayGroup.day;
                              window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripId}&day=${day}&mode=activity`;
                            }}
                          >
                            <Plus className="w-4 h-4" />
                            {__('Add Activity', 'Add Activity')}
                          </Button>
                        </ConditionalRender>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </ConditionalRender>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={
          (deleteConfirm.entry as any)?._isDayDeletion
            ? __('Delete Day', 'Delete Day')
            : __('Delete Itinerary Entry', 'Delete Itinerary Entry')
        }
        message={
          (deleteConfirm.entry as any)?._isDayDeletion
            ? __('Are you sure you want to delete this day and all its activities? This action cannot be undone.', 'Are you sure you want to delete this day and all its activities? This action cannot be undone.')
            : __('Are you sure you want to delete this itinerary entry? This action cannot be undone.', 'Are you sure you want to delete this itinerary entry? This action cannot be undone.')
        }
        confirmText={__('Delete', 'Delete')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={bulkDeleteConfirm.isOpen}
        onClose={handleBulkDeleteCancel}
        onConfirm={handleBulkDeleteConfirm}
        title={__('Bulk Delete', 'Bulk Delete')}
        message={__(
          `Are you sure you want to delete ${bulkDeleteConfirm.entryIds.length} selected item(s)? This will also delete all activities for any selected days. This action cannot be undone.`,
          `Are you sure you want to delete ${bulkDeleteConfirm.entryIds.length} selected item(s)? This will also delete all activities for any selected days. This action cannot be undone.`
        )}
        confirmText={__('Delete All', 'Delete All')}
        variant="danger"
        isLoading={bulkDeleteMutation.isPending}
      />
    </div>
  );
};

export default Itinerary;
