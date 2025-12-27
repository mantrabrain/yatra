import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { __ } from '../../lib/i18n';
import { apiClient } from '../../lib/api-client';
import { Select } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Loader2, Search, X } from 'lucide-react';

type ApplicableValue = 'all' | 'specific_trips';

interface ApplicableTripSelectorProps {
  value: ApplicableValue;
  onValueChange: (value: ApplicableValue) => void;
  selectedTripIds: number[];
  onTripIdsChange: (ids: number[]) => void;
  description?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
}

interface TripOption {
  id: number;
  label: string;
}

const toTripOption = (item: any): TripOption => {
  const id = Number(item?.id || 0);
  const label = item?.title || item?.name || item?.slug || `Trip #${id}`;
  return { id, label };
};

export const ApplicableTripSelector: React.FC<ApplicableTripSelectorProps> = ({
  value,
  onValueChange,
  selectedTripIds,
  onTripIdsChange,
  description = __('Control whether this applies to all trips or only selected trips.'),
  placeholder = __('Click to select trips...'),
  helperText = __('Only the selected trips will be eligible.'),
  disabled = false,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: trips = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['applicable-trips', debouncedSearch],
    queryFn: async () => {
      const params: Record<string, any> = { per_page: 100 };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      const response = await apiClient.get('/trips', { params });
      console.log('Search API response:', response);
      const items = response?.data?.data || response?.data || response || [];
      return Array.isArray(items) ? items.map(toTripOption) : [];
    },
    enabled: value === 'specific_trips',
    staleTime: 5 * 60 * 1000,
  });

  // Fetch selected trip details using React Query
  const { data: selectedTripsData = [] } = useQuery({
    queryKey: ['selected-trips', selectedTripIds],
    queryFn: async () => {
      if (selectedTripIds.length === 0) return [];
      
      console.log('Fetching trips for IDs:', selectedTripIds);
      
      // Try using the list endpoint with include parameter instead of individual calls
      try {
        const response = await apiClient.get('/trips', { 
          params: { 
            per_page: 100,
            include: selectedTripIds.join(',') // Try to include specific IDs
          } 
        });
        console.log('List API response for selected trips:', response);
        
        const items = response?.data?.data || response?.data || response || [];
        const trips = Array.isArray(items) ? items.map(toTripOption) : [];
        console.log('Converted selected trips:', trips);
        return trips;
      } catch (error) {
        console.warn('List API failed, trying individual calls:', error);
        
        // Fallback to individual calls
        const results = await Promise.all(
          selectedTripIds.map(async (id) => {
            try {
              const response = await apiClient.get(`/trips/${id}`);
              console.log(`Response for trip ${id}:`, response?.data);
              if (response?.data) {
                const trip = toTripOption(response.data);
                console.log(`Converted trip ${id}:`, trip);
                return trip;
              }
            } catch (error) {
              console.warn(`Failed to fetch trip ${id}:`, error);
            }
            return { id, label: `Trip #${id}` };
          })
        );
        console.log('Final selectedTripsData:', results);
        return results;
      }
    },
    enabled: selectedTripIds.length > 0,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const tripLookup = useMemo(() => {
    const map = new Map<number, string>();
    // Add search results
    trips.forEach((trip) => {
      map.set(trip.id, trip.label);
    });
    // Add selected trips data
    selectedTripsData.forEach((trip) => {
      map.set(trip.id, trip.label);
    });
    console.log('Final tripLookup:', Array.from(map.entries()));
    return map;
  }, [trips, selectedTripsData]);

  const selectedChips = useMemo(() => {
    const chips = selectedTripIds.map((id) => ({
      id,
      label: tripLookup.get(id) || `Trip #${id}`,
    }));
    console.log('Selected chips:', chips);
    return chips;
  }, [selectedTripIds, tripLookup]);

  const toggleTrip = (tripId: number, checked: boolean) => {
    if (checked) {
      if (!selectedTripIds.includes(tripId)) {
        onTripIdsChange([...selectedTripIds, tripId]);
      }
    } else {
      onTripIdsChange(selectedTripIds.filter((id) => id !== tripId));
    }
  };

  const clearTrips = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onTripIdsChange([]);
  };

  const handleModeChange = (newValue: ApplicableValue) => {
    onValueChange(newValue);
    if (newValue === 'all' && selectedTripIds.length > 0) {
      onTripIdsChange([]);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{description}</p>
        <Select
          value={value}
          onChange={(e) => handleModeChange(e.target.value as ApplicableValue)}
          disabled={disabled}
        >
          <option value="all">{__('All Trips')}</option>
          <option value="specific_trips">{__('Specific Trips')}</option>
        </Select>
      </div>

      {value === 'specific_trips' && (
        <div className="space-y-2 relative">
          <div
            className={`border border-gray-300 dark:border-gray-600 rounded-lg p-2 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800 ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && setShowDropdown((prev) => !prev)}
          >
            {selectedChips.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedChips.map((chip) => (
                  <span
                    key={chip.id}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded-full h-6 min-w-[24px]"
                  >
                    <span className="truncate">{chip.label}</span>
                    <span className="text-[9px] text-gray-500 font-normal flex-shrink-0">#{chip.id}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTrip(chip.id, false);
                      }}
                      className="hover:text-blue-600 text-[10px] flex-shrink-0 leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearTrips}
                  className="text-xs text-red-500 hover:text-red-600 px-2 py-0 h-6 flex items-center"
                >
                  {__('Clear')}
                </Button>
              </div>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </div>

          {helperText && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
          )}

          {showDropdown && !disabled && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={__('Search trips...')}
                    className="pl-8"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  {isFetching && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-2 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    {__('Loading trips...')}
                  </div>
                ) : trips.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {trips.map((trip) => {
                      const checked = selectedTripIds.includes(trip.id);
                      return (
                        <label
                          key={trip.id}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => toggleTrip(trip.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">
                            {trip.label}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">#{trip.id}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? __('No trips found') : __('No trips available')}
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedTripIds.length} {__('selected')}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDropdown(false)}
                  className="text-xs"
                >
                  <X className="w-4 h-4 mr-1" />
                  {__('Close')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
