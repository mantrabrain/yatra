/**
 * Availability Form
 * Add or edit availability dates for a trip
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '../hooks/useNavigate';
import { ArrowLeft, Save, Plus, X, Loader2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { HelpText } from '../components/ui/help-text';
import { Alert } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { DatePicker } from '../components/ui/date-picker';
import { TimePicker } from '../components/ui/time-picker';
import { apiClient } from '../lib/api';
import { useToast } from '../components/ui/toast';

interface PriceType {
  category_id: number;
  original_price: string;
  discounted_price: string;
}

interface TravelerCategory {
  id: number;
  label: string;
  description: string;
  status: 'active' | 'inactive' | 'publish' | 'draft';
  age_min?: number;
  age_max?: number;
}

interface AvailabilityFormData {
  departure_date: string;
  departure_time: string;
  arrival_date: string;
  arrival_time: string;
  total_seats: string; // Total capacity
  booked_seats: string; // Currently booked (read-only in edit mode)
  seats_remaining: string; // Legacy field
  pricing_type: 'regular' | 'traveler_based';
  original_price: string;
  discounted_price: string;
  price_types: PriceType[];
  status: 'available' | 'sold_out' | 'limited' | 'closed' | 'blocked';
  is_blocked: boolean; // Blocked for maintenance/holidays
  block_reason: string; // Reason for blocking
  alert_threshold: string; // Alert when seats drop below this
  from_location: string;
  to_location: string;
}

const AvailabilityForm: React.FC = () => {
  const { navigate } = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // Get trip_id and id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const tripIdFromUrl = urlParams.get('trip_id') ? parseInt(urlParams.get('trip_id')!) : null;
  const availabilityId = urlParams.get('id') || null;
  const isEditMode = !!availabilityId;
  
  // In edit mode, trip_id can come from availability data, so we'll use state
  const [tripId, setTripId] = useState<number | null>(tripIdFromUrl);

  const [formData, setFormData] = useState<AvailabilityFormData>({
    departure_date: '',
    departure_time: '',
    arrival_date: '',
    arrival_time: '',
    total_seats: '',
    booked_seats: '0',
    seats_remaining: '',
    pricing_type: 'regular',
    original_price: '',
    discounted_price: '',
    price_types: [],
    status: 'available',
    is_blocked: false,
    block_reason: '',
    alert_threshold: '5',
    from_location: '',
    to_location: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AvailabilityFormData, string>> & { submit?: string; [key: string]: string | undefined }>({});
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  // Fetch trip details
  const { data: tripData } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      if (!tripId) return null;
      const response = await apiClient.get(`/trips/${tripId}`);
      return response?.data || response;
    },
    enabled: !!tripId,
  });

  // Fetch traveler categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['traveler-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/traveler-categories');
      const categories = response?.data || response || [];
      return {
        categories: Array.isArray(categories) ? categories : []
      };
    },
  });

  // Filter for active categories - check both 'active' and 'publish' status
  const activeCategories = categoriesData?.categories?.filter((cat: TravelerCategory) => 
    cat.status === 'active' || cat.status === 'publish'
  ) || [];

  // Fetch existing availability data if editing
  const { data: availabilityData, isLoading: isLoadingAvailability } = useQuery({
    queryKey: ['availability', availabilityId],
    queryFn: async () => {
      if (!availabilityId) return null;
      const response = await apiClient.get(`/availability/${availabilityId}`);
      return response?.data || response;
    },
    enabled: isEditMode && !!availabilityId,
  });

  // Set trip_id from availability data if not in URL (for edit mode)
  useEffect(() => {
    if (availabilityData && availabilityData.trip_id && !tripId) {
      setTripId(availabilityData.trip_id);
    }
  }, [availabilityData, tripId]);

  // Load form data when trip or availability data is available
  useEffect(() => {
    if (tripData && !isEditMode) {
      setFormData(prev => ({
        ...prev,
        from_location: tripData.starting_location || '',
        to_location: tripData.ending_location || '',
      }));
    }
  }, [tripData, isEditMode]);

  useEffect(() => {
    if (availabilityData) {
      const totalSeats = availabilityData.total_seats || availabilityData.seats_total || 0;
      const availableSeats = availabilityData.available_seats || availabilityData.seats_available || 0;
      const bookedSeats = totalSeats - availableSeats;
      
      setFormData({
        departure_date: availabilityData.departure_date || '',
        departure_time: availabilityData.departure_time || '',
        arrival_date: availabilityData.arrival_date || availabilityData.departure_date || '',
        arrival_time: availabilityData.arrival_time || '',
        total_seats: totalSeats.toString(),
        booked_seats: bookedSeats.toString(),
        seats_remaining: availableSeats > 10 ? '10+' : availableSeats.toString(),
        pricing_type: 'regular' as 'regular' | 'traveler_based',
        original_price: availabilityData.original_price?.toString() || '',
        discounted_price: availabilityData.discounted_price?.toString() || '',
        price_types: [],
        status: (availabilityData.status || (availabilityData.is_blocked ? 'blocked' : 'available')) as 'available' | 'sold_out' | 'limited' | 'closed' | 'blocked',
        is_blocked: availabilityData.is_blocked || availabilityData.status === 'blocked' || false,
        block_reason: availabilityData.block_reason || '',
        alert_threshold: availabilityData.alert_threshold?.toString() || '5',
        from_location: availabilityData.from_location || tripData?.starting_location || '',
        to_location: availabilityData.to_location || tripData?.ending_location || '',
      });
    }
  }, [availabilityData, tripData]);

  const handleFieldChange = (field: keyof AvailabilityFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePriceTypeAdd = (categoryId: number) => {
    // Check if category already exists
    if (formData.price_types.some(pt => pt.category_id === categoryId)) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      price_types: [...prev.price_types, { category_id: categoryId, original_price: '', discounted_price: '' }],
    }));
  };

  const handlePriceTypeRemove = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      price_types: prev.price_types.filter(pt => pt.category_id !== categoryId),
    }));
  };

  const handlePriceTypeChange = (categoryId: number, field: 'original_price' | 'discounted_price', value: string) => {
    setFormData(prev => ({
      ...prev,
      price_types: prev.price_types.map(pt => 
        pt.category_id === categoryId ? { ...pt, [field]: value } : pt
      ),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AvailabilityFormData, string>> & { [key: string]: string } = {};

    if (!formData.departure_date) {
      newErrors.departure_date = __('Departure date is required', 'Departure date is required');
    }

    if (!formData.arrival_date) {
      newErrors.arrival_date = __('Arrival date is required', 'Arrival date is required');
    }

    // Validate dates and times based on trip type
    const isSingleDay = tripData?.trip_type === 'single_day';
    
    if (isSingleDay) {
      // For single day trips, both dates should be the same
      if (formData.departure_date && formData.arrival_date && formData.departure_date !== formData.arrival_date) {
        newErrors.arrival_date = __('For single day trips, departure and arrival must be on the same date', 'For single day trips, departure and arrival must be on the same date');
      }
      // Validate times
      if (!formData.departure_time) {
        newErrors.departure_time = __('Departure time is required for single day trips', 'Departure time is required for single day trips');
      }
      if (!formData.arrival_time) {
        newErrors.arrival_time = __('Arrival time is required for single day trips', 'Arrival time is required for single day trips');
      }
      // Validate that arrival time is after departure time
      if (formData.departure_time && formData.arrival_time && formData.departure_date === formData.arrival_date) {
        const [depHour, depMin] = formData.departure_time.split(':').map(Number);
        const [arrHour, arrMin] = formData.arrival_time.split(':').map(Number);
        const depMinutes = depHour * 60 + depMin;
        const arrMinutes = arrHour * 60 + arrMin;
        if (arrMinutes <= depMinutes) {
          newErrors.arrival_time = __('Arrival time must be after departure time', 'Arrival time must be after departure time');
        }
      }
    } else {
      // For multi-day trips, validate dates
      if (formData.departure_date && formData.arrival_date) {
        const departure = new Date(formData.departure_date);
        const arrival = new Date(formData.arrival_date);
        if (arrival <= departure) {
          newErrors.arrival_date = __('Arrival date must be after departure date', 'Arrival date must be after departure date');
        }
      }
    }

    // Validate inventory
    if (!formData.total_seats || parseInt(formData.total_seats) <= 0) {
      newErrors.total_seats = __('Total capacity is required and must be greater than 0', 'Total capacity is required and must be greater than 0');
    }
    
    if (isEditMode && formData.booked_seats) {
      const total = parseInt(formData.total_seats) || 0;
      const booked = parseInt(formData.booked_seats) || 0;
      if (booked > total) {
        newErrors.booked_seats = __('Booked seats cannot exceed total capacity', 'Booked seats cannot exceed total capacity');
      }
    }

    // Validate pricing based on pricing type
    if (formData.pricing_type === 'regular') {
      if (!formData.original_price || parseFloat(formData.original_price) <= 0) {
        newErrors.original_price = __('Original price is required and must be greater than 0', 'Original price is required and must be greater than 0');
      }
      if (formData.discounted_price && parseFloat(formData.discounted_price) >= parseFloat(formData.original_price)) {
        newErrors.discounted_price = __('Discounted price must be less than original price', 'Discounted price must be less than original price');
      }
    } else {
      // Validate price types
      if (formData.price_types.length === 0) {
        newErrors.price_types = __('At least one traveler category pricing is required', 'At least one traveler category pricing is required');
      } else {
        formData.price_types.forEach((priceType, index) => {
          if (!priceType.original_price || isNaN(parseFloat(priceType.original_price)) || parseFloat(priceType.original_price) < 0) {
            newErrors[`price_type_${index}_original`] = __('Original price must be a valid number', 'Original price must be a valid number');
          }
          if (priceType.discounted_price && (isNaN(parseFloat(priceType.discounted_price)) || parseFloat(priceType.discounted_price) < 0)) {
            newErrors[`price_type_${index}_discounted`] = __('Discounted price must be a valid number', 'Discounted price must be a valid number');
          }
          if (priceType.discounted_price && priceType.original_price && parseFloat(priceType.discounted_price) >= parseFloat(priceType.original_price)) {
            newErrors[`price_type_${index}_discounted`] = __('Discounted price must be less than original price', 'Discounted price must be less than original price');
          }
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: AvailabilityFormData) => {
      const totalSeats = data.total_seats ? parseInt(data.total_seats) : 0;
      const bookedSeats = isEditMode && data.booked_seats ? parseInt(data.booked_seats) : 0;
      const availableSeats = totalSeats - bookedSeats;
      
      const payload = {
        trip_id: tripId,
        departure_date: data.departure_date,
        departure_time: tripData?.trip_type === 'single_day' ? (data.departure_time || null) : null,
        arrival_date: data.arrival_date || null,
        arrival_time: tripData?.trip_type === 'single_day' ? (data.arrival_time || null) : null,
        seats_total: totalSeats,
        seats_available: availableSeats,
        seats_reserved: 0,
        seats_waitlist: 0,
        original_price: data.pricing_type === 'regular' && data.original_price ? parseFloat(data.original_price) : null,
        discounted_price: data.pricing_type === 'regular' && data.discounted_price ? parseFloat(data.discounted_price) : null,
        status: data.is_blocked ? 'blocked' : data.status,
        from_location: data.from_location || null,
        to_location: data.to_location || null,
        special_notes: null,
        cutoff_hours: 24,
      };

      if (isEditMode && availabilityId) {
        const response = await apiClient.put(`/availability/${availabilityId}`, payload);
        return response?.data || response;
      } else {
        const response = await apiClient.post('/availability', payload);
        return response?.data || response;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      // Navigate immediately, toast will be shown on the availability page if needed
      navigate({ subpage: 'trips', tab: 'availability', trip_id: tripId?.toString() });
      // Show toast after a brief delay to ensure navigation happens first
      setTimeout(() => {
        showToast(
          isEditMode 
            ? __('Availability date updated successfully', 'Availability date updated successfully')
            : __('Availability date created successfully', 'Availability date created successfully'),
          'success',
          3000 // Shorter duration
        );
      }, 100);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.data?.message || __('An error occurred while saving', 'An error occurred while saving');
      showToast(errorMessage, 'error');
      setErrors({ 
        submit: errorMessage
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    saveMutation.mutate(formData);
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
    };
    return symbols[currency] || currency;
  };

  // Show loading if we're in edit mode and waiting for availability data to get trip_id
  if (isEditMode && !tripId && isLoadingAvailability) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!tripId) {
    return (
      <Alert variant="error">
        <AlertCircle className="w-4 h-4" />
        <div>
          <p className="font-medium">{__('Trip ID Required', 'Trip ID Required')}</p>
          <p className="text-sm">{__('Please select a trip first.', 'Please select a trip first.')}</p>
        </div>
      </Alert>
    );
  }

  // Show skeleton loader while loading data
  if (isLoadingAvailability || (isEditMode && !availabilityData)) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
        </div>

        {/* Form Skeleton */}
        <div className="space-y-6 animate-pulse">
          {/* Date & Time Section */}
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seats Section */}
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Section */}
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buttons Skeleton */}
          <div className="flex items-center justify-end gap-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? __('Edit Availability Date', 'Edit Availability Date') : __('Add Availability Date', 'Add Availability Date')}
        description={
          tripData 
            ? `${isEditMode ? __('Edit', 'Edit') : __('Add')} availability date for ${tripData.title}`
            : __('Add a new availability date for this trip', 'Add a new availability date for this trip')
        }
        actions={
          tripId ? (
          <Button
            variant="outline"
            onClick={() => navigate({ subpage: 'trips', tab: 'availability', trip_id: tripId.toString() })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {__('Back', 'Back')}
          </Button>
          ) : null
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{__('Date Information', 'Date Information')}</CardTitle>
            <CardDescription>
              {__('Set the departure and arrival dates for this availability', 'Set the departure and arrival dates for this availability')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tripData?.trip_type === 'single_day' ? (
              // Single Day Trip - Show date and time pickers
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {__('Date', 'Date')} <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={formData.departure_date}
                    onChange={(value: string) => {
                      handleFieldChange('departure_date', value);
                      handleFieldChange('arrival_date', value); // Same date for single day
                    }}
                    placeholder={__('Select date', 'Select date')}
                    error={!!errors.departure_date}
                  />
                  {errors.departure_date && (
                    <p className="mt-1 text-xs text-red-600">{errors.departure_date}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Departure Time', 'Departure Time')} <span className="text-red-500">*</span>
                    </label>
                    <TimePicker
                      value={formData.departure_time}
                      onChange={(value: string) => handleFieldChange('departure_time', value)}
                      placeholder={__('Select departure time', 'Select departure time')}
                      error={!!errors.departure_time}
                    />
                    {errors.departure_time && (
                      <p className="mt-1 text-xs text-red-600">{errors.departure_time}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Arrival Time', 'Arrival Time')} <span className="text-red-500">*</span>
                    </label>
                    <TimePicker
                      value={formData.arrival_time}
                      onChange={(value: string) => handleFieldChange('arrival_time', value)}
                      placeholder={__('Select arrival time', 'Select arrival time')}
                      error={!!errors.arrival_time}
                    />
                    {errors.arrival_time && (
                      <p className="mt-1 text-xs text-red-600">{errors.arrival_time}</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              // Multi-Day Trip - Show date pickers only
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {__('Departure Date', 'Departure Date')} <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={formData.departure_date}
                    onChange={(value: string) => handleFieldChange('departure_date', value)}
                    placeholder={__('Select departure date', 'Select departure date')}
                    error={!!errors.departure_date}
                  />
                  {errors.departure_date && (
                    <p className="mt-1 text-xs text-red-600">{errors.departure_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {__('Arrival Date', 'Arrival Date')} <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={formData.arrival_date}
                    onChange={(value: string) => handleFieldChange('arrival_date', value)}
                    minDate={formData.departure_date ? new Date(formData.departure_date) : undefined}
                    placeholder={__('Select arrival date', 'Select arrival date')}
                    error={!!errors.arrival_date}
                  />
                  {errors.arrival_date && (
                    <p className="mt-1 text-xs text-red-600">{errors.arrival_date}</p>
                  )}
                  {tripData?.duration_days && formData.departure_date && formData.arrival_date && (
                    <div className="mt-1.5">
                      {(() => {
                        const departure = new Date(formData.departure_date);
                        const arrival = new Date(formData.arrival_date);
                        const selectedDays = Math.ceil((arrival.getTime() - departure.getTime()) / (1000 * 60 * 60 * 24));
                        const expectedDays = tripData.duration_days;
                        const diff = selectedDays - expectedDays;
                        
                        if (diff === 0) {
                          return (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              {__('Duration matches trip duration', 'Duration matches trip duration')} ({selectedDays} {__('days', 'days')})
                            </p>
                          );
                        } else if (diff < 0) {
                          return (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              {__('Shorter than trip duration', 'Shorter than trip duration')}: {selectedDays} {__('days', 'days')} ({Math.abs(diff)} {__('days shorter', 'days shorter')} than expected {expectedDays} {__('days', 'days')})
                            </p>
                          );
                        } else {
                          return (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              {__('Longer than trip duration', 'Longer than trip duration')}: {selectedDays} {__('days', 'days')} ({diff} {__('days longer', 'days longer')} than expected {expectedDays} {__('days', 'days')})
                            </p>
                          );
                        }
                      })()}
                    </div>
                  )}
                  {tripData?.duration_days && !formData.arrival_date && (
                    <HelpText
                      text={`${__('Trip duration', 'Trip duration')}: ${tripData.duration_days} ${tripData.duration_days === 1 ? __('day', 'day') : __('days', 'days')}${tripData.duration_nights ? ` (${tripData.duration_nights} ${tripData.duration_nights === 1 ? __('night', 'night') : __('nights', 'nights')})` : ''}`}
                      className="mt-1"
                    />
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {__('From Location', 'From Location')}
                </label>
                <Input
                  type="text"
                  value={formData.from_location}
                  onChange={(e) => handleFieldChange('from_location', e.target.value)}
                  placeholder={tripData?.starting_location || __('e.g., Rome', 'e.g., Rome')}
                />
                <HelpText
                  text={__('Leave empty to use trip default location', 'Leave empty to use trip default location')}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {__('To Location', 'To Location')}
                </label>
                <Input
                  type="text"
                  value={formData.to_location}
                  onChange={(e) => handleFieldChange('to_location', e.target.value)}
                  placeholder={tripData?.ending_location || __('e.g., Rome', 'e.g., Rome')}
                />
                <HelpText
                  text={__('Leave empty to use trip default location', 'Leave empty to use trip default location')}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{__('Pricing & Availability', 'Pricing & Availability')}</CardTitle>
            <CardDescription>
              {__('Set pricing for traveler categories and seat availability for this date', 'Set pricing for traveler categories and seat availability for this date')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pricing Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {__('Pricing Type', 'Pricing Type')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                  formData.pricing_type === 'regular'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                }`}>
                  <input
                    type="radio"
                    name="pricing_type"
                    value="regular"
                    checked={formData.pricing_type === 'regular'}
                    onChange={(e) => handleFieldChange('pricing_type', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex flex-1">
                    <div className="flex flex-col">
                      <span className={`block text-sm font-medium ${
                        formData.pricing_type === 'regular'
                          ? 'text-blue-900 dark:text-blue-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {__('Regular Pricing', 'Regular Pricing')}
                      </span>
                      <span className={`mt-1 flex items-center text-sm ${
                        formData.pricing_type === 'regular'
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {__('Set a single price for all travelers', 'Set a single price for all travelers')}
                      </span>
                    </div>
                  </div>
                  {formData.pricing_type === 'regular' && (
                    <div className="absolute top-4 right-4">
                      <div className="h-4 w-4 rounded-full bg-blue-600"></div>
                    </div>
                  )}
                </label>

                <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                  formData.pricing_type === 'traveler_based'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                }`}>
                  <input
                    type="radio"
                    name="pricing_type"
                    value="traveler_based"
                    checked={formData.pricing_type === 'traveler_based'}
                    onChange={(e) => handleFieldChange('pricing_type', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex flex-1">
                    <div className="flex flex-col">
                      <span className={`block text-sm font-medium ${
                        formData.pricing_type === 'traveler_based'
                          ? 'text-blue-900 dark:text-blue-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {__('Traveler-Based Pricing', 'Traveler-Based Pricing')}
                      </span>
                      <span className={`mt-1 flex items-center text-sm ${
                        formData.pricing_type === 'traveler_based'
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {__('Set different prices for each traveler category', 'Set different prices for each traveler category')}
                      </span>
                    </div>
                  </div>
                  {formData.pricing_type === 'traveler_based' && (
                    <div className="absolute top-4 right-4">
                      <div className="h-4 w-4 rounded-full bg-blue-600"></div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Regular Pricing */}
            {formData.pricing_type === 'regular' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Original Price', 'Original Price')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        {getCurrencySymbol(tripData?.currency || 'USD')}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.original_price}
                        onChange={(e) => handleFieldChange('original_price', e.target.value)}
                        placeholder="0.00"
                        className={`pl-7 ${errors.original_price ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.original_price && (
                      <p className="mt-1 text-xs text-red-600">{errors.original_price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Discounted Price', 'Discounted Price')} ({__('Optional', 'Optional')})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        {getCurrencySymbol(tripData?.currency || 'USD')}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.discounted_price}
                        onChange={(e) => handleFieldChange('discounted_price', e.target.value)}
                        placeholder="0.00"
                        className={`pl-7 ${errors.discounted_price ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.discounted_price && (
                      <p className="mt-1 text-xs text-red-600">{errors.discounted_price}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Traveler Category Pricing */}
            {formData.pricing_type === 'traveler_based' && (
              <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__('Traveler Category Pricing', 'Traveler Category Pricing')} <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {__('Add pricing for traveler categories. Categories are managed in Traveler Categories page.', 'Add pricing for traveler categories. Categories are managed in Traveler Categories page.')}
                </p>
                </div>
                
                {isLoadingCategories ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : activeCategories.length === 0 ? (
                  <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {__('No active traveler categories found.', 'No active traveler categories found.')}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.location.href = '?subpage=traveler-categories&action=create'}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      {__('Create Category', 'Create Category')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Add Pricing Button */}
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCategorySelector(!showCategorySelector)}
                        className="flex items-center gap-2"
                        disabled={activeCategories.filter(cat => !formData.price_types.some(pt => pt.category_id === cat.id)).length === 0}
                      >
                        <Plus className="w-4 h-4" />
                        {__('Add Pricing', 'Add Pricing')}
                      </Button>
                      
                      {/* Category Selection Dropdown */}
                      {showCategorySelector && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowCategorySelector(false)}
                          />
                          <div className="absolute top-full left-0 mt-2 w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                            <div className="p-2">
                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 px-3 py-2 mb-1">
                                {__('Select a category to add pricing', 'Select a category to add pricing')}
                              </div>
                              {activeCategories
                                .filter(cat => !formData.price_types.some(pt => pt.category_id === cat.id))
                                .length === 0 ? (
                                <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                                  {__('All categories have pricing added', 'All categories have pricing added')}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {activeCategories
                                    .filter(cat => !formData.price_types.some(pt => pt.category_id === cat.id))
                                    .map((category: TravelerCategory) => {
                                      const ageRange = category.age_min !== undefined || category.age_max !== undefined
                                        ? category.age_min !== undefined && category.age_max !== undefined
                                          ? `${category.age_min}-${category.age_max} ${__('years', 'years')}`
                                          : category.age_min !== undefined
                                          ? `${category.age_min}+ ${__('years', 'years')}`
                                          : category.age_max !== undefined
                                          ? `${__('Under', 'Under')} ${category.age_max} ${__('years', 'years')}`
                                          : ''
                                        : null;

                                      return (
                                        <button
                                          key={category.id}
                                          type="button"
                                          onClick={() => {
                                            handlePriceTypeAdd(category.id);
                                            setShowCategorySelector(false);
                                          }}
                                          className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                                            {category.label}
                                            {ageRange && (
                                              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                ({ageRange})
                                              </span>
                                            )}
                                          </div>
                                          {category.description && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {category.description}
                                          </div>
                                          )}
                                        </button>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Added Pricing List */}
                    {formData.price_types.length > 0 && (
                      <div className="space-y-3">
                        {formData.price_types.map((priceType, index) => {
                          const category = activeCategories.find(cat => cat.id === priceType.category_id);
                          if (!category) return null;

                          return (
                            <div key={priceType.category_id} className="p-4 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {category.label}
                                      {(category.age_min !== undefined || category.age_max !== undefined) && (
                                        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                          (
                                          {category.age_min !== undefined && category.age_max !== undefined
                                            ? `${category.age_min}-${category.age_max} ${__('years', 'years')}`
                                            : category.age_min !== undefined
                                            ? `${category.age_min}+ ${__('years', 'years')}`
                                            : category.age_max !== undefined
                                            ? `${__('Under', 'Under')} ${category.age_max} ${__('years', 'years')}`
                                            : ''}
                                          )
                                        </span>
                                      )}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {category.description}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handlePriceTypeRemove(category.id)}
                                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title={__('Remove Pricing', 'Remove Pricing')}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {__('Original Price', 'Original Price')} <span className="text-red-500">*</span>
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                      {getCurrencySymbol(tripData?.currency || 'USD')}
                                    </span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={priceType.original_price}
                                      onChange={(e) => handlePriceTypeChange(category.id, 'original_price', e.target.value)}
                                      placeholder="0.00"
                                      className={`pl-7 ${errors[`price_type_${index}_original`] ? 'border-red-500' : ''}`}
                                    />
                                  </div>
                                  {errors[`price_type_${index}_original`] && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                      {errors[`price_type_${index}_original`]}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {__('Discounted Price', 'Discounted Price')} ({__('Optional', 'Optional')})
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                      {getCurrencySymbol(tripData?.currency || 'USD')}
                                    </span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={priceType.discounted_price}
                                      onChange={(e) => handlePriceTypeChange(category.id, 'discounted_price', e.target.value)}
                                      placeholder="0.00"
                                      className={`pl-7 ${errors[`price_type_${index}_discounted`] ? 'border-red-500' : ''}`}
                                    />
                                  </div>
                                  {errors[`price_type_${index}_discounted`] && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                      {errors[`price_type_${index}_discounted`]}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {errors.price_types && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {errors.price_types}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Inventory Management */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {__('Inventory Management', 'Inventory Management')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {__('Total Capacity', 'Total Capacity')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.total_seats}
                    onChange={(e) => handleFieldChange('total_seats', e.target.value)}
                    placeholder="20"
                    className={errors.total_seats ? 'border-red-500' : ''}
                  />
                  {errors.total_seats && (
                    <p className="mt-1 text-xs text-red-600">{errors.total_seats}</p>
                  )}
                  <HelpText
                    text={__('Maximum number of seats available for this date', 'Maximum number of seats available for this date')}
                    className="mt-1"
                  />
                </div>
                {isEditMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Booked Seats', 'Booked Seats')}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.booked_seats}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    />
                    <HelpText
                      text={__('Currently booked seats (read-only)', 'Currently booked seats (read-only)')}
                      className="mt-1"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {__('Alert Threshold', 'Alert Threshold')}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.alert_threshold}
                    onChange={(e) => handleFieldChange('alert_threshold', e.target.value)}
                    placeholder="5"
                  />
                  <HelpText
                    text={__('Alert when available seats drop below this number', 'Alert when available seats drop below this number')}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Block Date */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {__('Block Date', 'Block Date')}
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_blocked}
                    onChange={(e) => {
                      handleFieldChange('is_blocked', e.target.checked);
                      if (e.target.checked) {
                        handleFieldChange('status', 'blocked');
                      } else {
                        handleFieldChange('status', 'available');
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {__('Block this date from bookings', 'Block this date from bookings')}
                  </span>
                </label>
              </div>
              {formData.is_blocked && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {__('Block Reason', 'Block Reason')}
                  </label>
                  <Input
                    type="text"
                    value={formData.block_reason}
                    onChange={(e) => handleFieldChange('block_reason', e.target.value)}
                    placeholder={__('e.g., Maintenance, Holiday, Special Event', 'e.g., Maintenance, Holiday, Special Event')}
                  />
                  <HelpText
                    text={__('Reason for blocking this date (optional but recommended)', 'Reason for blocking this date (optional but recommended)')}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {/* Status */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {__('Status', 'Status')}
              </label>
              <Select
                value={formData.status}
                onChange={(e) => {
                  handleFieldChange('status', e.target.value);
                  if (e.target.value === 'blocked') {
                    handleFieldChange('is_blocked', true);
                  } else if (formData.is_blocked && e.target.value !== 'blocked') {
                    handleFieldChange('is_blocked', false);
                  }
                }}
                disabled={formData.is_blocked}
              >
                <option value="available">{__('Available', 'Available')}</option>
                <option value="limited">{__('Limited', 'Limited')}</option>
                <option value="sold_out">{__('Sold Out', 'Sold Out')}</option>
                <option value="closed">{__('Closed', 'Closed')}</option>
                <option value="blocked">{__('Blocked', 'Blocked')}</option>
              </Select>
              {formData.is_blocked && (
                <HelpText
                  text={__('Status is automatically set to "Blocked" when date is blocked', 'Status is automatically set to "Blocked" when date is blocked')}
                  className="mt-1"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {errors.submit && (
          <Alert variant="error">
            <AlertCircle className="w-4 h-4" />
            <p>{errors.submit}</p>
          </Alert>
        )}

        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (tripId) {
                navigate({ subpage: 'trips', tab: 'availability', trip_id: tripId.toString() });
              } else {
                navigate({ subpage: 'trips', tab: 'availability' });
              }
            }}
          >
            {__('Cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {__('Saving...', 'Saving...')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {__('Save Availability', 'Save Availability')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AvailabilityForm;

