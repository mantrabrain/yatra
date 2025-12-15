/**
 * Additional Services Form
 * 
 * Form component for creating and editing additional services.
 * This is part of the premium module - functionality provided by Yatra Pro.
 * 
 * @package Yatra
 * @since 3.0.0
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { useToast } from '../components/ui/toast';
import { usePermissions } from '../hooks/usePermissions';
import { IconPicker, IconPickerValue } from '../components/ui/icon-picker';
import { apiClient } from '../lib/api';
import { __ } from '../lib/i18n';
import { 
  ArrowLeft, 
  Save, 
  Package,
  Loader2,
  X
} from 'lucide-react';

// Types
interface AdditionalService {
  id?: number;
  name: string;
  description: string;
  price: number;
  price_type: 'fixed' | 'percentage';
  price_per: 'person' | 'booking' | 'day';
  icon: IconPickerValue | null;
  status: 'publish' | 'draft' | 'trash';
  sort_order: number;
  applicable_to: 'all' | 'specific_trips';
  trip_ids: number[];
  is_required: boolean;
}

const defaultService: AdditionalService = {
  name: '',
  description: '',
  price: 0,
  price_type: 'fixed',
  price_per: 'person',
  icon: null,
  status: 'publish',
  sort_order: 0,
  applicable_to: 'all',
  trip_ids: [],
  is_required: false,
};

// Check if module is available
const isModuleAvailable = (): boolean => {
  const yatraAdmin = (window as any)?.yatraAdmin;
  return Boolean(yatraAdmin?.isPro && yatraAdmin?.additionalServicesEnabled);
};

const AdditionalServicesForm: React.FC = () => {
  const [formData, setFormData] = useState<AdditionalService>(defaultService);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTripDropdown, setShowTripDropdown] = useState(false);
  const [tripSearchQuery, setTripSearchQuery] = useState('');
  const [debouncedTripSearch, setDebouncedTripSearch] = useState('');
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  // Get ID from URL for edit mode
  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get('id');
  const isEditMode = !!serviceId;

  // Debounce trip search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTripSearch(tripSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [tripSearchQuery]);

  // Fetch trips for applicable_to selection
  const tripsQuery = useQuery({
    queryKey: ['trips-for-service', debouncedTripSearch],
    queryFn: async () => {
      try {
        const params: Record<string, any> = { 
          per_page: 100,
        };
        if (debouncedTripSearch.trim()) {
          params.search = debouncedTripSearch.trim();
        }
        const response = await apiClient.get('/trips', { params });
        const trips = response?.data?.data || response?.data || response || [];
        return Array.isArray(trips) ? trips : [];
      } catch (error: any) {
        console.error('Failed to load trips:', error);
        return [];
      }
    },
    enabled: formData.applicable_to === 'specific_trips',
    staleTime: 5 * 60 * 1000,
  });

  // Trip options for dropdown
  const tripOptions = (tripsQuery.data || [])
    .filter((t: any) => !!t && (typeof t.id === 'number' || typeof t.id === 'string'))
    .map((trip: any) => ({
      value: Number(trip.id),
      label: trip.title || trip.name || `Trip #${trip.id}`,
    }));

  // Fetch service data for edit mode
  const { data: serviceData, isLoading: isLoadingService } = useQuery({
    queryKey: ['additional-service', serviceId],
    queryFn: async () => {
      const response = await apiClient.get(`/additional-services/${serviceId}`);
      // API returns { success: true, data: service }, extract the service object
      return response.data?.data || response.data;
    },
    enabled: isEditMode && isModuleAvailable(),
  });

  // Populate form with existing data
  useEffect(() => {
    if (serviceData) {
      // Handle icon - could be old format (image_id/image_url) or new format (IconPickerValue)
      let iconValue: IconPickerValue | null = null;
      if (serviceData.icon) {
        iconValue = serviceData.icon as IconPickerValue;
      } else if (serviceData.image_url) {
        // Convert old format to new IconPickerValue format
        iconValue = { type: 'image', value: serviceData.image_url };
      }

      setFormData({
        id: serviceData.id,
        name: serviceData.name || '',
        description: serviceData.description || '',
        price: parseFloat(serviceData.price) || 0,
        price_type: serviceData.price_type || 'fixed',
        price_per: serviceData.price_per || 'person',
        icon: iconValue,
        status: serviceData.status || 'draft',
        sort_order: serviceData.sort_order || 0,
        applicable_to: serviceData.applicable_to || 'all',
        trip_ids: serviceData.trip_ids || [],
        is_required: serviceData.is_required === true || serviceData.is_required === 1 || serviceData.is_required === '1',
      });
    }
  }, [serviceData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: AdditionalService) => {
      if (isEditMode) {
        return apiClient.put(`/additional-services/${serviceId}`, data);
      }
      return apiClient.post('/additional-services', data);
    },
    onSuccess: () => {
      showToast(
        isEditMode 
          ? __('Service updated successfully') 
          : __('Service created successfully'),
        'success'
      );
      queryClient.invalidateQueries({ queryKey: ['additional-services'] });
      // Only navigate back on create, stay on page for updates
      if (!isEditMode) {
        navigateBack();
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || __('Failed to save service');
      showToast(message, 'error');
    },
  });

  const navigateBack = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('action');
    params.delete('id');
    params.set('subpage', 'trips');
    params.set('tab', 'additional-services');
    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleFieldChange = (field: keyof AdditionalService, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = __('Service name is required');
    }

    if (formData.price < 0) {
      newErrors.price = __('Price cannot be negative');
    }

    if (formData.price_type === 'percentage' && formData.price > 100) {
      newErrors.price = __('Percentage cannot exceed 100%');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast(__('Please fix the errors before saving'), 'error');
      return;
    }

    saveMutation.mutate(formData);
  };

  
  // Check permissions - allow admins and users with yatra capabilities
  const hasPermission = can('manage_options') || can('yatra_manage_settings') || can('yatra_edit_trips');
  if (!hasPermission) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {__('You do not have permission to manage services.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show premium gate if module not available
  if (!isModuleAvailable()) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {__('Premium Feature')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {__('Additional Services is a premium feature. Upgrade to Yatra Pro to unlock.')}
          </p>
          <Button
            onClick={() => window.open('https://wpyatra.com/pricing?module=additional-services', '_blank')}
          >
            {__('Upgrade to Pro')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isEditMode && isLoadingService) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
        </div>

        {/* Form Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Details Card */}
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name field */}
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                {/* Description field */}
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Card */}
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Card */}
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            {/* Icon/Image Card */}
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={isEditMode 
          ? __('Update the details of this additional service.')
          : __('Create a new additional service that customers can add to their bookings.')
        }
        actions={
          <Button variant="outline" onClick={navigateBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {__('Back to Services')}
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>{__('Service Details')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {__('Service Name')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder={__('e.g., Airport Transfer, Travel Insurance')}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {__('Description')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('description', e.target.value)}
                    placeholder={__('Describe what this service includes...')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <input
                    type="checkbox"
                    id="is_required"
                    checked={formData.is_required}
                    onChange={(e) => handleFieldChange('is_required', e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <div>
                    <label htmlFor="is_required" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                      {__('Required Service')}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {__('If enabled, customers must select this service when booking.')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>{__('Pricing')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {__('Price')}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
                      className={errors.price ? 'border-red-500' : ''}
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {__('Price Type')}
                    </label>
                    <Select
                      value={formData.price_type}
                      onChange={(e) => handleFieldChange('price_type', e.target.value)}
                    >
                      <option value="fixed">{__('Fixed Amount')}</option>
                      <option value="percentage">{__('Percentage of Trip Price')}</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {__('Price Per')}
                    </label>
                    <Select
                      value={formData.price_per}
                      onChange={(e) => handleFieldChange('price_per', e.target.value)}
                    >
                      <option value="person">{__('Per Person')}</option>
                      <option value="booking">{__('Per Booking')}</option>
                      <option value="day">{__('Per Day')}</option>
                    </Select>
                  </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.price_type === 'percentage' 
                    ? __('The price will be calculated as a percentage of the trip base price.')
                    : formData.price_per === 'person'
                      ? __('This price will be multiplied by the number of travelers.')
                      : formData.price_per === 'day'
                        ? __('This price will be multiplied by the trip duration in days.')
                        : __('This is a flat fee charged once per booking.')
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{__('Publish')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {__('Status')}
                  </label>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                  >
                    <option value="draft">{__('Draft')}</option>
                    <option value="publish">{__('Published')}</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {__('Sort Order')}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => handleFieldChange('sort_order', parseInt(e.target.value) || 0)}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {__('Lower numbers appear first')}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {__('Saving...')}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {isEditMode ? __('Update Service') : __('Create Service')}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Applicable To */}
            <Card>
              <CardHeader>
                <CardTitle>{__('Applicable To')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={formData.applicable_to}
                  onChange={(e) => handleFieldChange('applicable_to', e.target.value as 'all' | 'specific_trips')}
                >
                  <option value="all">{__('All Trips')}</option>
                  <option value="specific_trips">{__('Specific Trips')}</option>
                </Select>
                {formData.applicable_to === 'specific_trips' && (
                  <div className="mt-3 space-y-2 relative">
                    {/* Selected trips display / Dropdown trigger */}
                    <div 
                      className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
                      onClick={() => setShowTripDropdown(!showTripDropdown)}
                    >
                      {formData.trip_ids.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {formData.trip_ids.slice(0, 3).map((tripId) => {
                            const trip = tripOptions.find((t: any) => t.value === tripId);
                            return (
                              <span
                                key={tripId}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                              >
                                {trip?.label || `Trip #${tripId}`}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFieldChange('trip_ids', formData.trip_ids.filter(id => id !== tripId));
                                  }}
                                  className="hover:text-blue-600 dark:hover:text-blue-200"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                          {formData.trip_ids.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                              +{formData.trip_ids.length - 3} {__('more')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {__('Click to select trips...')}
                        </span>
                      )}
                    </div>
                    
                    {/* Dropdown panel */}
                    {showTripDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                          <div className="relative">
                            <Input
                              type="text"
                              placeholder={__('Search trips...')}
                              value={tripSearchQuery}
                              onChange={(e) => setTripSearchQuery(e.target.value)}
                              className="w-full text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            {tripsQuery.isFetching && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Trip list */}
                        <div className="max-h-[200px] overflow-y-auto">
                          {tripsQuery.isLoading ? (
                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                              {__('Loading trips...')}
                            </div>
                          ) : tripOptions.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                              {tripOptions.map((trip: any) => (
                                <label
                                  key={trip.value}
                                  className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={formData.trip_ids.includes(trip.value)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          handleFieldChange('trip_ids', [...formData.trip_ids, trip.value]);
                                        } else {
                                          handleFieldChange('trip_ids', formData.trip_ids.filter(id => id !== trip.value));
                                        }
                                      }}
                                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{trip.label}</span>
                                  </div>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">#{trip.value}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                              {__('No trips found')}
                            </div>
                          )}
                        </div>
                        
                        {/* Close button */}
                        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setShowTripDropdown(false)}
                          >
                            {__('Done')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.applicable_to === 'all' 
                    ? __('This service will be available for all trips.')
                    : __('This service will only be available for the selected trips.')
                  }
                </p>
              </CardContent>
            </Card>

            {/* Icon/Image */}
            <Card>
              <CardHeader>
                <CardTitle>{__('Service Icon or Image')}</CardTitle>
              </CardHeader>
              <CardContent>
                <IconPicker
                  value={formData.icon}
                  onChange={(value) => handleFieldChange('icon', value)}
                  label={__('Service Icon or Image')}
                  helpText={__('Select an icon from the library or upload a custom image for this service.')}
                  allowImageUpload={true}
                  allowIconSelection={true}
                  size="md"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdditionalServicesForm;
