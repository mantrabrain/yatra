/**
 * Itinerary Page - Day-by-Day Schedule Builder
 * Manage itinerary entries organized by days with expandable cards
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  MoreVertical, 
  Trash2, 
  MapPin, 
  Clock, 
  Info,
  UtensilsCrossed,
  Footprints,
  Hotel,
  Car,
  Calendar
} from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Alert } from '../components/ui/alert';
import { IconSelector } from '../components/ui/icon-selector';

interface ItineraryEntry {
  id: number;
  trip_id: number;
  trip_title: string;
  day: number;
  day_title?: string;
  item_type: string;
  item_name: string;
  item_icon: string;
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
  const [tripFilter, setTripFilter] = useState('1');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(['1-1'])); // trip-day format
  const [selectedDay, setSelectedDay] = useState<{ tripId: number; day: number } | null>(null);
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  // Fetch trips for filter
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['itinerary', tripFilter],
    queryFn: async () => {
      const allEntries: ItineraryEntry[] = [
        {
          id: 1,
          trip_id: 1,
          trip_title: 'Everest Base Camp Trek',
          day: 1,
          day_title: 'Arrival & Welcome to Paradise',
          item_type: 'Meal',
          item_name: 'Breakfast',
          item_icon: 'utensils',
          title: 'Tropical breakfast buffet',
          description: 'Tropical breakfast buffet',
          location: 'Resort restaurant',
          duration: '1 hour',
          start_time: '08:00',
          end_time: '09:00',
          status: 'active',
          created_at: '2024-01-15',
        },
        {
          id: 2,
          trip_id: 1,
          trip_title: 'Everest Base Camp Trek',
          day: 1,
          day_title: 'Arrival & Welcome to Paradise',
          item_type: 'Activity',
          item_name: 'Beach relaxation',
          item_icon: 'footprints',
          title: 'Beach relaxation',
          description: 'Sunbathe, swim, beach activities',
          location: 'Private beach',
          duration: '3 hours',
          start_time: '10:00',
          end_time: '13:00',
          status: 'active',
          created_at: '2024-01-15',
        },
        {
          id: 3,
          trip_id: 1,
          trip_title: 'Everest Base Camp Trek',
          day: 1,
          day_title: 'Arrival & Welcome to Paradise',
          item_type: 'Meal',
          item_name: 'Lunch',
          item_icon: 'utensils',
          title: 'Welcome Lunch',
          description: 'Traditional Nepali lunch at hotel',
          location: 'Hotel restaurant',
          duration: '1 hour',
          start_time: '13:00',
          end_time: '14:00',
          status: 'active',
          created_at: '2024-01-15',
        },
        {
          id: 4,
          trip_id: 1,
          trip_title: 'Everest Base Camp Trek',
          day: 1,
          day_title: 'Arrival & Welcome to Paradise',
          item_type: 'Accommodation',
          item_name: 'Hotel Stay',
          item_icon: 'hotel',
          title: 'Resort Accommodation',
          description: 'Luxury beachfront resort',
          location: 'Beach Resort',
          start_time: '14:00',
          end_time: '10:00',
          status: 'active',
          created_at: '2024-01-15',
        },
        {
          id: 5,
          trip_id: 1,
          trip_title: 'Everest Base Camp Trek',
          day: 2,
          day_title: 'Beach Day & Spa',
          item_type: 'Meal',
          item_name: 'Breakfast',
          item_icon: 'utensils',
          title: 'Breakfast',
          description: 'Continental breakfast',
          location: 'Resort restaurant',
          duration: '1 hour',
          start_time: '08:00',
          end_time: '09:00',
          status: 'active',
          created_at: '2024-01-15',
        },
        {
          id: 6,
          trip_id: 1,
          trip_title: 'Everest Base Camp Trek',
          day: 2,
          day_title: 'Beach Day & Spa',
          item_type: 'Activity',
          item_name: 'Spa Treatment',
          item_icon: 'footprints',
          title: 'Spa Treatment',
          description: 'Relaxing spa session',
          location: 'Resort spa',
          duration: '2 hours',
          start_time: '14:00',
          end_time: '16:00',
          status: 'active',
          created_at: '2024-01-15',
        },
      ];

      let filtered = allEntries;
      if (tripFilter !== 'all') {
        filtered = filtered.filter(e => e.trip_id === parseInt(tripFilter));
      }

      // Group by trip and day
      const grouped: DayGroup[] = [];
      const seen = new Set<string>();

      filtered.forEach(entry => {
        const key = `${entry.trip_id}-${entry.day}`;
        if (!seen.has(key)) {
          seen.add(key);
          grouped.push({
            trip_id: entry.trip_id,
            trip_title: entry.trip_title,
            day: entry.day,
            day_title: entry.day_title,
            entries: filtered.filter(e => e.trip_id === entry.trip_id && e.day === entry.day),
          });
        }
      });

      // Sort by trip_id and day
      grouped.sort((a, b) => {
        if (a.trip_id !== b.trip_id) return a.trip_id - b.trip_id;
        return a.day - b.day;
      });

      return grouped;
    },
    enabled: can('yatra_view_trips'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log('Deleting itinerary entry:', id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary'] });
    },
  });

  const handleAddDay = () => {
    // Navigate to add day form
    const tripId = tripFilter !== 'all' ? tripFilter : '1';
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripId}`;
  };

  const handleQuickAdd = (type: string, itemName: string) => {
    if (!selectedDay) {
      // Select first day if none selected
      const firstDay = data?.[0];
      if (firstDay) {
        setSelectedDay({ tripId: firstDay.trip_id, day: firstDay.day });
        const key = `${firstDay.trip_id}-${firstDay.day}`;
        setExpandedDays(new Set([key]));
      }
    }
    
    const tripId = selectedDay?.tripId || (tripFilter !== 'all' ? parseInt(tripFilter) : 1);
    const day = selectedDay?.day || 1;
    
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripId}&day=${day}&type=${type}&item=${itemName}`;
  };

  const handleEdit = (entry: ItineraryEntry) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=edit&id=${entry.id}`;
  };

  const handleDelete = (entry: ItineraryEntry) => {
    const confirmMessage = __('Are you sure you want to delete this itinerary entry? This action cannot be undone.', 'Are you sure you want to delete this itinerary entry? This action cannot be undone.');
    if (confirm(confirmMessage)) {
      deleteMutation.mutate(entry.id);
    }
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

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'Meal':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Activity':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Accommodation':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Transportation':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatTime = (time: string) => {
    // Convert 24h to 12h format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const trips = tripsData || [];
  const dayGroups = data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {__('Build your complete itinerary with activities, meals, and accommodations', 'Build your complete itinerary with activities, meals, and accommodations')}
          </p>
        </div>
        <ConditionalRender capability="yatra_edit_trips">
          <Button onClick={handleAddDay} className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
            <Plus className="w-4 h-4" />
            {__('Add Day', 'Add Day')}
          </Button>
        </ConditionalRender>
      </div>

      {/* Trip Filter */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {__('Trip:', 'Trip:')}
            </label>
            <Select
              value={tripFilter}
              onChange={(e) => setTripFilter(e.target.value)}
              className="w-64 h-9"
            >
              <option value="all">{__('All Trips', 'All Trips')}</option>
              {trips.map((trip: any) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_trips">
        {error ? (
          <Alert variant="error" title={__('Error Loading Itinerary', 'Error Loading Itinerary')}>
            {__('We couldn\'t load itinerary entries. Please refresh the page or try again later.', 'We couldn\'t load itinerary entries. Please refresh the page or try again later.')}
          </Alert>
        ) : isLoading ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {__('Loading itinerary...', 'Loading itinerary...')}
              </p>
            </div>
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
                    {__('No itinerary days yet', 'No itinerary days yet')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {__('Start building your itinerary by adding your first day.', 'Start building your itinerary by adding your first day.')}
                  </p>
                  <Button onClick={handleAddDay} className="flex items-center gap-2 mx-auto">
                    <Plus className="w-4 h-4" />
                    {__('Add Your First Day', 'Add Your First Day')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
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
              <Card key={key} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Day Header */}
                  <div 
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => toggleDay(dayGroup.trip_id, dayGroup.day)}
                  >
                    <div className="flex items-center gap-4 flex-1">
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle menu
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Day Content - Expanded */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      {/* Quick Add Section */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                          {__('QUICK ADD', 'QUICK ADD')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdd('Meal', 'Breakfast')}
                            className="flex items-center gap-2"
                          >
                            <UtensilsCrossed className="w-4 h-4" />
                            {__('Breakfast', 'Breakfast')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdd('Meal', 'Lunch')}
                            className="flex items-center gap-2"
                          >
                            <UtensilsCrossed className="w-4 h-4" />
                            {__('Lunch', 'Lunch')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdd('Meal', 'Dinner')}
                            className="flex items-center gap-2"
                          >
                            <UtensilsCrossed className="w-4 h-4" />
                            {__('Dinner', 'Dinner')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdd('Activity', 'Activity')}
                            className="flex items-center gap-2"
                          >
                            <Footprints className="w-4 h-4" />
                            {__('Activity', 'Activity')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdd('Transportation', 'Transfer')}
                            className="flex items-center gap-2"
                          >
                            <Car className="w-4 h-4" />
                            {__('Transfer', 'Transfer')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdd('Accommodation', 'Hotel Stay')}
                            className="flex items-center gap-2"
                          >
                            <Hotel className="w-4 h-4" />
                            {__('Hotel Stay', 'Hotel Stay')}
                          </Button>
                        </div>
                      </div>

                      {/* Itinerary Items */}
                      <div className="p-4 space-y-3">
                        {sortedEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-start gap-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
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
                                    <Badge className={`${getItemTypeColor(entry.item_type)} text-xs font-medium px-2 py-0.5`}>
                                      <div className="flex items-center gap-1.5">
                                        <IconSelector 
                                          iconName={entry.item_icon as any} 
                                          className="w-3 h-3"
                                        />
                                        <span>{entry.item_name}</span>
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
                                <div className="flex items-center gap-1">
                                  <Select
                                    value={entry.item_type}
                                    className="h-8 text-xs min-w-[100px]"
                                    onChange={() => {
                                      // Handle type change
                                    }}
                                  >
                                    <option value="Meal">{__('Meal', 'Meal')}</option>
                                    <option value="Activity">{__('Activity', 'Activity')}</option>
                                    <option value="Accommodation">{__('Accommodation', 'Accommodation')}</option>
                                    <option value="Transportation">{__('Transportation', 'Transportation')}</option>
                                  </Select>
                                  <ConditionalRender capability="yatra_edit_trips">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(entry)}
                                      className="h-8 w-8"
                                      title={__('Edit', 'Edit')}
                                    >
                                      <Info className="w-4 h-4" />
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
                              window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&action=create&trip_id=${tripId}&day=${day}`;
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
    </div>
  );
};

export default Itinerary;
