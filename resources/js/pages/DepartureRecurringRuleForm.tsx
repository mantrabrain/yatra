/**
 * Departure Recurring Rule Form
 * Create and edit recurring rules for departures
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { HelpText } from '../components/ui/help-text';
import { DatePicker } from '../components/ui/date-picker';
import { apiClient } from '../lib/api-client';
import { useToast } from '../components/ui/toast';

interface RecurringRuleFormData {
  recurrence_type: 'daily' | 'weekly' | 'monthly' | 'custom_days';
  weekdays: number[];
  start_date?: string;
  end_date?: string;
  max_capacity: string;
  base_price?: string;
  is_active: boolean;
}

const dayOptions = [
  { value: 0, label: __('Sunday', 'Sunday') },
  { value: 1, label: __('Monday', 'Monday') },
  { value: 2, label: __('Tuesday', 'Tuesday') },
  { value: 3, label: __('Wednesday', 'Wednesday') },
  { value: 4, label: __('Thursday', 'Thursday') },
  { value: 5, label: __('Friday', 'Friday') },
  { value: 6, label: __('Saturday', 'Saturday') },
];

const DepartureRecurringRuleForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // Get trip_id and id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get('trip_id') ? parseInt(urlParams.get('trip_id')!) : null;
  const ruleId = urlParams.get('id') || null;
  const isEditMode = !!ruleId;

  const [formData, setFormData] = useState<RecurringRuleFormData>({
    recurrence_type: 'weekly',
    weekdays: [],
    start_date: '',
    end_date: '',
    max_capacity: '',
    base_price: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RecurringRuleFormData, string>>>({});

  // Fetch existing rule data if editing
  const { data: ruleData, isLoading: isLoadingRule } = useQuery({
    queryKey: ['recurring-rule', ruleId],
    queryFn: async () => {
      if (!ruleId || !tripId) return null;
      const response = await apiClient.get(`/trips/${tripId}/recurring-rules/${ruleId}`);
      return response?.data || response;
    },
    enabled: isEditMode && !!ruleId && !!tripId,
  });

  // Load form data when rule data is available
  useEffect(() => {
    if (ruleData) {
      setFormData({
        recurrence_type: ruleData.recurrence_type || 'weekly',
        weekdays: ruleData.weekdays || [],
        start_date: ruleData.start_date || '',
        end_date: ruleData.end_date || '',
        max_capacity: ruleData.max_capacity?.toString() || '',
        base_price: ruleData.base_price?.toString() || '',
        is_active: ruleData.is_active !== false,
      });
    }
  }, [ruleData]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: RecurringRuleFormData) => {
      if (!tripId) throw new Error('Trip ID is required');
      
      const payload: any = {
        trip_id: tripId,
        recurrence_type: data.recurrence_type,
        max_capacity: parseInt(data.max_capacity),
        is_active: data.is_active,
      };

      if (data.recurrence_type === 'weekly' || data.recurrence_type === 'custom_days') {
        payload.weekdays = data.weekdays;
      }

      if (data.start_date) payload.start_date = data.start_date;
      if (data.end_date) payload.end_date = data.end_date;
      if (data.base_price) payload.base_price = parseFloat(data.base_price);

      if (isEditMode && ruleId) {
        return await apiClient.put(`/trips/${tripId}/recurring-rules/${ruleId}`, payload);
      } else {
        return await apiClient.post(`/trips/${tripId}/recurring-rules`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules', tripId] });
      showToast(
        isEditMode 
          ? __('Recurring rule updated successfully', 'Recurring rule updated successfully')
          : __('Recurring rule created successfully', 'Recurring rule created successfully'),
        'success'
      );
      window.location.href = `?page=yatra&subpage=trips&tab=departures&action=rules&trip_id=${tripId}`;
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to save rule', 'Failed to save rule'), 'error');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RecurringRuleFormData, string>> = {};

    if (!formData.max_capacity) {
      newErrors.max_capacity = __('Max capacity is required', 'Max capacity is required');
    } else if (parseInt(formData.max_capacity) < 1) {
      newErrors.max_capacity = __('Max capacity must be at least 1', 'Max capacity must be at least 1');
    }

    if ((formData.recurrence_type === 'weekly' || formData.recurrence_type === 'custom_days') && formData.weekdays.length === 0) {
      newErrors.weekdays = __('At least one weekday must be selected', 'At least one weekday must be selected');
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
    window.location.href = `?page=yatra&subpage=trips&tab=departures&action=rules${tripId ? `&trip_id=${tripId}` : ''}`;
  };

  const toggleWeekday = (day: number) => {
    setFormData({
      ...formData,
      weekdays: formData.weekdays.includes(day)
        ? formData.weekdays.filter(d => d !== day)
        : [...formData.weekdays, day].sort(),
    });
  };

  if (isLoadingRule) {
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
        title={isEditMode ? __('Edit Recurring Rule', 'Edit Recurring Rule') : __('Add Recurring Rule', 'Add Recurring Rule')}
        description={__('Create a recurring pattern for automatic departure date generation', 'Create a recurring pattern for automatic departure date generation')}
        actions={
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {__('Back', 'Back')}
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Recurrence Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__('Recurrence Type', 'Recurrence Type')} <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.recurrence_type}
                onChange={(e) => {
                  setFormData({ ...formData, recurrence_type: e.target.value as any, weekdays: [] });
                }}
              >
                <option value="daily">{__('Daily', 'Daily')}</option>
                <option value="weekly">{__('Weekly', 'Weekly')}</option>
                <option value="monthly">{__('Monthly', 'Monthly')}</option>
                <option value="custom_days">{__('Custom Days', 'Custom Days')}</option>
              </Select>
              <HelpText text={__('Select how often departures should be generated', 'Select how often departures should be generated')} />
            </div>

            {/* Weekdays (for weekly/custom_days) */}
            {(formData.recurrence_type === 'weekly' || formData.recurrence_type === 'custom_days') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {__('Days of Week', 'Days of Week')} <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeekday(day.value)}
                      className={`px-4 py-2 rounded-md border ${
                        formData.weekdays.includes(day.value)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {errors.weekdays && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.weekdays}</p>
                )}
                <HelpText text={__('Select which days of the week departures should be generated', 'Select which days of the week departures should be generated')} />
              </div>
            )}

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__('Start Date', 'Start Date')} <span className="text-gray-400">({__('Optional', 'Optional')})</span>
              </label>
              <DatePicker
                value={formData.start_date || ''}
                onChange={(value) => setFormData({ ...formData, start_date: value })}
              />
              <HelpText text={__('When should this rule start generating dates?', 'When should this rule start generating dates?')} />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__('End Date', 'End Date')} <span className="text-gray-400">({__('Optional', 'Optional')})</span>
              </label>
              <DatePicker
                value={formData.end_date || ''}
                onChange={(value) => setFormData({ ...formData, end_date: value })}
                minDate={formData.start_date ? new Date(formData.start_date) : undefined}
              />
              <HelpText text={__('When should this rule stop generating dates? Leave empty for no end date', 'When should this rule stop generating dates? Leave empty for no end date')} />
            </div>

            {/* Max Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__('Max Capacity', 'Max Capacity')} <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={formData.max_capacity}
                onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                placeholder={__('e.g., 20', 'e.g., 20')}
              />
              {errors.max_capacity && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.max_capacity}</p>
              )}
              <HelpText text={__('Maximum number of travelers for generated departures', 'Maximum number of travelers for generated departures')} />
            </div>

            {/* Base Price (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__('Base Price', 'Base Price')} <span className="text-gray-400">({__('Optional', 'Optional')})</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.base_price || ''}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                placeholder={__('e.g., 150.00', 'e.g., 150.00')}
              />
              <HelpText text={__('Base price per person for generated departures (optional)', 'Base price per person for generated departures (optional)')} />
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {__('Active', 'Active')}
                </span>
              </label>
              <HelpText text={__('Only active rules will generate departure dates', 'Only active rules will generate departure dates')} />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={handleBack}>
                {__('Cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {__('Saving...', 'Saving...')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {__('Save Rule', 'Save Rule')}
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

export default DepartureRecurringRuleForm;

