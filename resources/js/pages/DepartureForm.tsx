/**
 * Departure Form
 * Add or edit a departure for a trip
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { HelpText } from '../components/ui/help-text';
import { DatePicker } from '../components/ui/date-picker';
import { TimePicker } from '../components/ui/time-picker';
import { apiClient } from '../lib/api-client';
import { useToast } from '../components/ui/toast';

interface DepartureFormData {
  date: string;
  time?: string;
  max_capacity: string;
  price_override?: string;
  notes?: string;
}

const DepartureForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // Get trip_id and id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get('trip_id') ? parseInt(urlParams.get('trip_id')!) : null;
  const departureId = urlParams.get('id') || null;
  const isEditMode = !!departureId;

  const [formData, setFormData] = useState<DepartureFormData>({
    date: '',
    time: '',
    max_capacity: '',
    price_override: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DepartureFormData, string>>>({});

  // Fetch existing departure data if editing
  const { data: departureData, isLoading: isLoadingDeparture } = useQuery({
    queryKey: ['departure', departureId],
    queryFn: async () => {
      if (!departureId || !tripId) return null;
      const response = await apiClient.get(`/trips/${tripId}/departures/${departureId}`);
      return response?.data || response;
    },
    enabled: isEditMode && !!departureId && !!tripId,
  });

  // Load form data when departure data is available
  useEffect(() => {
    if (departureData) {
      setFormData({
        date: departureData.date || '',
        time: departureData.time || '',
        max_capacity: departureData.max_capacity?.toString() || '',
        price_override: departureData.price_override?.toString() || '',
        notes: departureData.notes || '',
      });
    }
  }, [departureData]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: DepartureFormData) => {
      if (!tripId) throw new Error('Trip ID is required');
      
      const payload: any = {
        trip_id: tripId,
        date: data.date,
        max_capacity: parseInt(data.max_capacity),
        source: 'manual',
      };

      if (data.time) payload.time = data.time;
      if (data.price_override) payload.price_override = parseFloat(data.price_override);
      if (data.notes) payload.notes = data.notes;

      if (isEditMode && departureId) {
        return await apiClient.put(`/trips/${tripId}/departures/${departureId}`, payload);
      } else {
        return await apiClient.post(`/trips/${tripId}/departures`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departures', tripId] });
      showToast(
        isEditMode 
          ? __('Departure updated successfully', 'yatra')
          : __('Departure created successfully', 'yatra'),
        'success'
      );
      window.location.href = `?page=yatra&subpage=trips&tab=departures&trip_id=${tripId}`;
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to save departure', 'yatra'), 'error');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof DepartureFormData, string>> = {};

    if (!formData.date) {
      newErrors.date = __('Date is required', 'yatra');
    }

    if (!formData.max_capacity) {
      newErrors.max_capacity = __('Max capacity is required', 'yatra');
    } else if (parseInt(formData.max_capacity) < 1) {
      newErrors.max_capacity = __('Max capacity must be at least 1', 'yatra');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      saveMutation.mutate(formData);
    }
  };

  const handleBack = () => {
    window.location.href = `?page=yatra&subpage=trips&tab=departures${tripId ? `&trip_id=${tripId}` : ''}`;
  };

  if (isLoadingDeparture) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? __('Edit Departure', 'yatra') : __('Add Departure', 'yatra')}
        description={__('Create or update a departure date for this trip', 'yatra')}
        actions={
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {__('Back', 'yatra')}
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__('Departure Date', 'yatra')} <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={formData.date}
                onChange={(value) => setFormData({ ...formData, date: value })}
                minDate={new Date()}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>
              )}
              <HelpText text={__('Select the departure date for this trip', 'yatra')} />
            </div>

            {/* Time (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__('Departure Time', 'yatra')} <span className="text-gray-400">({__('Optional', 'yatra')})</span>
              </label>
              <TimePicker
                value={formData.time || ''}
                onChange={(value) => setFormData({ ...formData, time: value })}
              />
              <HelpText text={__('Optional departure time (e.g., 09:00 AM)', 'yatra')} />
            </div>

            {/* Max Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__('Max Capacity', 'yatra')} <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={formData.max_capacity}
                onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                placeholder={__('e.g., 20', 'yatra')}
              />
              {errors.max_capacity && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.max_capacity}</p>
              )}
              <HelpText text={__('Maximum number of travelers for this departure', 'yatra')} />
            </div>

            {/* Price Override (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__('Price Override', 'yatra')} <span className="text-gray-400">({__('Optional', 'yatra')})</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price_override || ''}
                onChange={(e) => setFormData({ ...formData, price_override: e.target.value })}
                placeholder={__('e.g., 150.00', 'yatra')}
              />
              <HelpText text={__('Override the default trip price for this specific departure', 'yatra')} />
            </div>

            {/* Notes (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__('Notes', 'yatra')} <span className="text-gray-400">({__('Optional', 'yatra')})</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                rows={4}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={__('Additional notes about this departure...', 'yatra')}
              />
              <HelpText text={__('Internal notes about this departure (not visible to customers)', 'yatra')} />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={handleBack}>
                {__('Cancel', 'yatra')}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {__('Saving...', 'yatra')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {__('Save Departure', 'yatra')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default DepartureForm;

