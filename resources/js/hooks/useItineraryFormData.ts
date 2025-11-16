/**
 * Custom hook for fetching all data needed by ItineraryForm
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '../lib/api';
import { usePermissions } from './usePermissions';
import { useToast } from '../components/ui/toast';
import { __ } from '../lib/i18n';

interface UseItineraryFormDataParams {
  entryId: number | null;
  isEditMode: boolean;
  isEditDayMode: boolean;
  isAddDayMode: boolean;
  tripIdParam: string | null;
  dayParam: string | null;
  formDataItemTypeId: string;
}

export const useItineraryFormData = ({
  entryId,
  isEditMode,
  isEditDayMode,
  isAddDayMode,
  tripIdParam,
  dayParam,
  formDataItemTypeId,
}: UseItineraryFormDataParams) => {
  const { can } = usePermissions();
  const { showToast } = useToast();

  // Extract stable primitive values for entry data
  const entryIdStable = useMemo(() => entryId, [entryId]);

  // Fetch trips
  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ['trips-simple'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/trips', {
          params: {
            per_page: 100,
            status: 'all'
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

  // Fetch item types
  const { data: typesData } = useQuery({
    queryKey: ['item-types-published'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/item-types', { 
          params: { 
            per_page: 100,
            status: 'publish'
          } 
        });
        const types = response?.data?.data || response?.data || response || [];
        return Array.isArray(types) ? types : [];
      } catch (error: any) {
        console.error('Failed to load item types:', error);
        return [];
      }
    },
    enabled: can('yatra_view_trips'),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch items - in day mode fetch all items, in activity mode fetch by type
  const itemsQueryKey = useMemo(() => 
    isAddDayMode 
      ? ['items-all-published']
      : ['items-by-type', formDataItemTypeId],
    [isAddDayMode, formDataItemTypeId]
  );

  const { data: itemsData } = useQuery({
    queryKey: itemsQueryKey,
    queryFn: async () => {
      try {
        if (isAddDayMode) {
          const response = await apiClient.get('/items', { 
            params: { 
              per_page: 1000,
              status: 'publish'
            } 
          });
          const items = response?.data?.data || response?.data || response || [];
          return Array.isArray(items) ? items : [];
        }
        
        if (!formDataItemTypeId) return [];
        
        const response = await apiClient.get('/items', { 
          params: { 
            per_page: 1000,
            type_id: formDataItemTypeId,
            status: 'publish'
          } 
        });
        const items = response?.data?.data || response?.data || response || [];
        return Array.isArray(items) ? items : [];
      } catch (error: any) {
        console.error('Failed to load items:', error);
        return [];
      }
    },
    enabled: can('yatra_view_trips'),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch existing entry for edit mode
  const { data: entryData, isLoading: isLoadingEntry } = useQuery({
    queryKey: ['itinerary-entry', entryIdStable],
    queryFn: async () => {
      if (!entryIdStable) return null;
      try {
        const response = await apiClient.get(`/itinerary/${entryIdStable}`);
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

  // Extract stable primitive values from entryData
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

  // Fetch trip data to get day title when in activity mode, and to check existing days in day mode
  const tripDataQueryKey = useMemo(() => 
    ['trip-for-day', tripIdParam || '', dayParam || ''],
    [tripIdParam, dayParam]
  );

  const { data: tripDataForDay } = useQuery({
    queryKey: tripDataQueryKey,
    queryFn: async () => {
      if (!tripIdParam) return null;
      try {
        const response = await apiClient.get(`/trips/${tripIdParam}`);
        return response?.data || response;
      } catch (error) {
        console.error('Failed to fetch trip data:', error);
        return null;
      }
    },
    enabled: !isEditDayMode && !!tripIdParam && can('yatra_view_trips'),
  });

  // Use dayTripData when in edit day mode, otherwise use tripDataForDay
  const effectiveTripData = isEditDayMode ? dayTripData : tripDataForDay;

  return {
    tripsData: tripsData || [],
    isLoadingTrips,
    typesData: typesData || [],
    itemsData: itemsData || [],
    entryData,
    isLoadingEntry,
    dayTripData,
    tripDataForDay,
    effectiveTripData,
    entryTripId,
    entryDay,
  };
};

