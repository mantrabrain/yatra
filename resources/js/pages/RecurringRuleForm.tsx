/**
 * Recurring Availability Rule Form
 * Create and edit recurring availability patterns
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Clock,
  DollarSign,
  RefreshCw,
  Plus,
  X,
  AlertCircle,
  Eye
} from 'lucide-react';
import { __ } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { SearchableSelect } from '../components/ui/searchable-select';
import { DatePicker } from '../components/ui/date-picker';
import { TimePicker } from '../components/ui/time-picker';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert } from '../components/ui/alert';
import { useNavigate } from '../hooks/useNavigate';
import { apiClient } from '../lib/api';
import { useToast } from '../components/ui/toast';
import { RecurringRuleFormSkeleton } from '../components/availability/RecurringRuleFormSkeleton';

interface Trip {
  id: number;
  title: string;
  trip_type?: 'single_day' | 'multi_day';
  duration_days?: number;
  starting_location?: string;
  ending_location?: string;
  pricing_type?: 'regular' | 'traveler_based';
}

interface TravelerCategory {
  id: number;
  name?: string;
  label?: string;
  description?: string;
  min_age?: number;
  max_age?: number;
  age_min?: number;
  age_max?: number;
  status?: string;
}

interface TravelerPricing {
  category_id: number;
  original_price: number;
  sale_price?: number;
}

interface TimeSlot {
  departure_time: string;
  arrival_time: string;
  seats: number;
  price: number;
  sale_price?: number;
  traveler_pricing?: TravelerPricing[];
}

interface RecurringRule {
  id?: number;
  trip_id: number;
  name: string;
  rule_type: 'weekly' | 'monthly' | 'interval';
  days_of_week: number[];
  week_of_month?: 'first' | 'second' | 'third' | 'fourth' | 'last';
  day_of_week?: number;
  interval_days?: number;
  start_date: string;
  end_date?: string;
  excluded_dates: string[];
  months: number[]; // Array of month numbers (1-12) to filter by
  time_slots: TimeSlot[]; // For single-day trips with multiple slots
  pricing_type: 'regular' | 'traveler_based'; // Allow override of trip's pricing type
  original_price?: number;
  sale_price?: number;
  traveler_pricing?: TravelerPricing[]; // For traveler-based pricing
  seats_total: number;
  departure_time?: string;
  arrival_time?: string;
  from_location?: string;
  to_location?: string;
  cutoff_hours: number;
  alert_threshold: number;
  status: 'active' | 'inactive';
}

const dayOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const weekOptions = [
  { value: 'first', label: 'First' },
  { value: 'second', label: 'Second' },
  { value: 'third', label: 'Third' },
  { value: 'fourth', label: 'Fourth' },
  { value: 'last', label: 'Last' },
];

const RecurringRuleForm: React.FC = () => {
  const { navigate } = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Get parameters from URL
  const params = new URLSearchParams(window.location.search);
  const ruleId = params.get('id');
  const tripIdFromUrl = params.get('trip_id');
  const isEditing = !!ruleId;

  // Form state
  const [formData, setFormData] = useState<RecurringRule>({
    trip_id: tripIdFromUrl ? parseInt(tripIdFromUrl) : 0,
    name: '',
    rule_type: 'weekly',
    days_of_week: [0], // Sunday by default
    week_of_month: 'first',
    day_of_week: 0,
    interval_days: 7,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    excluded_dates: [],
    months: [], // Empty = all months, otherwise specific months (1-12)
    time_slots: [], // For single-day trips with multiple slots
    pricing_type: 'regular', // Will be updated based on trip's pricing type
    original_price: undefined,
    sale_price: undefined,
    traveler_pricing: [], // For traveler-based pricing
    seats_total: 20,
    departure_time: '',
    arrival_time: '',
    from_location: '',
    to_location: '',
    cutoff_hours: 24,
    alert_threshold: 5,
    status: 'active',
  });

  const [newExcludedDate, setNewExcludedDate] = useState('');
  const [previewData, setPreviewData] = useState<{ total: number; dates: any[] } | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  // Fetch trips for dropdown
  const { data: tripsData } = useQuery({
    queryKey: ['trips', 'all'],
    queryFn: async () => {
      const response = await apiClient.get('/trips', { params: { per_page: 100, status: 'publish' } });
      return {
        trips: (response?.data || []).map((trip: any) => ({
          id: Number(trip.id) || 0,
          title: trip.title,
          trip_type: trip.trip_type || (trip.duration_days <= 1 ? 'single_day' : 'multi_day'),
          duration_days: trip.duration_days || 1,
          starting_location: trip.starting_location,
          ending_location: trip.ending_location,
          pricing_type: trip.pricing_type || 'regular',
        })) as Trip[]
      };
    },
  });

  // Fetch traveler categories
  const { data: travelerCategories = [] } = useQuery({
    queryKey: ['traveler-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/traveler-categories', { params: { per_page: 100 } });
      return (response?.data || []) as TravelerCategory[];
    },
  });

  // Get selected trip details
  const selectedTrip = tripsData?.trips.find(t => t.id === formData.trip_id);
  const { data: fallbackTripData } = useQuery({
    queryKey: ['trip', formData.trip_id, 'recurring-rule-form'],
    queryFn: async () => {
      if (!formData.trip_id || selectedTrip) {
        return null;
      }
      const response = await apiClient.get(`/trips/${formData.trip_id}`);
      return response?.data || response || null;
    },
    enabled: !!formData.trip_id && !selectedTrip,
    staleTime: 5 * 60 * 1000,
  });
  const effectiveTrip = selectedTrip || (fallbackTripData ? {
    id: Number(fallbackTripData.id) || formData.trip_id,
    title: fallbackTripData.title,
  } : null);
  const tripNameLabel = effectiveTrip?.title || __('Unnamed Trip', 'Unnamed Trip');
  let headerDescription = __('Set up automatic availability patterns for your trips', 'Set up automatic availability patterns for your trips');
  if (effectiveTrip) {
    headerDescription = `${isEditing ? __('Edit', 'Edit') : __('Add', 'Add')} ${__('availability rule for', 'availability rule for')} ${tripNameLabel} (Trip ID: ${effectiveTrip.id})`;
  } else if (formData.trip_id) {
    headerDescription = `${isEditing ? __('Edit', 'Edit') : __('Add', 'Add')} ${__('availability rule for Trip ID:', 'availability rule for Trip ID:')} ${formData.trip_id}`;
  }
  const isSingleDayTrip = selectedTrip?.trip_type === 'single_day' || (selectedTrip?.duration_days || 1) <= 1;
  // Use form's pricing_type which defaults to trip's pricing type but can be overridden
  const isTravelerBasedPricing = formData.pricing_type === 'traveler_based';

  // Fetch existing rule if editing
  const { data: existingRule, isLoading: isLoadingRule } = useQuery({
    queryKey: ['recurring-availability', ruleId],
    queryFn: async () => {
      if (!ruleId) return null;
      const response = await apiClient.get(`/recurring-availability/${ruleId}`);
      return response?.data || response; // Unwrap data property from API response
    },
    enabled: !!ruleId,
  });

  // Update form when existing rule is loaded
  useEffect(() => {
    if (existingRule && tripsData) {
      // Parse days_of_week - handle both array and string formats
      let daysOfWeek = [0]; // Default to Sunday
      if (existingRule.days_of_week_array && Array.isArray(existingRule.days_of_week_array)) {
        daysOfWeek = existingRule.days_of_week_array;
      } else if (existingRule.days_of_week) {
        if (typeof existingRule.days_of_week === 'string') {
          daysOfWeek = existingRule.days_of_week.split(',').map(Number).filter((n: number) => !isNaN(n));
        } else if (Array.isArray(existingRule.days_of_week)) {
          daysOfWeek = existingRule.days_of_week.map(Number);
        }
      }
      
      // Ensure rule_type is properly typed
      const ruleType = (existingRule.rule_type || 'weekly') as 'weekly' | 'monthly' | 'interval';
      
      setFormData({
        trip_id: existingRule.trip_id || 0,
        name: existingRule.name || '',
        rule_type: ruleType,
        days_of_week: daysOfWeek.length > 0 ? daysOfWeek : [0],
        week_of_month: existingRule.week_of_month || 'first',
        day_of_week: existingRule.day_of_week ?? 0,
        interval_days: existingRule.interval_days || 7,
        start_date: existingRule.start_date || new Date().toISOString().split('T')[0],
        end_date: existingRule.end_date || '',
        excluded_dates: Array.isArray(existingRule.excluded_dates) ? existingRule.excluded_dates : [],
        months: Array.isArray(existingRule.months) ? existingRule.months : [],
        time_slots: Array.isArray(existingRule.time_slots) ? existingRule.time_slots : [],
        pricing_type: existingRule.pricing_type || 'regular',
        original_price: existingRule.original_price,
        sale_price: existingRule.sale_price,
        traveler_pricing: Array.isArray(existingRule.traveler_pricing) ? existingRule.traveler_pricing : [],
        seats_total: existingRule.seats_total || 20,
        departure_time: existingRule.departure_time || '',
        arrival_time: existingRule.arrival_time || '',
        from_location: existingRule.from_location || '',
        to_location: existingRule.to_location || '',
        cutoff_hours: existingRule.cutoff_hours || 24,
        alert_threshold: existingRule.alert_threshold || 5,
        status: existingRule.status || 'active',
      });
    }
  }, [existingRule, tripsData]);

  // Set pricing type based on selected trip when not editing
  useEffect(() => {
    if (!isEditing && selectedTrip && !existingRule) {
      setFormData(prev => ({
        ...prev,
        pricing_type: (selectedTrip.pricing_type || 'regular') as 'regular' | 'traveler_based',
        from_location: prev.from_location || selectedTrip.starting_location || '',
        to_location: prev.to_location || selectedTrip.ending_location || '',
      }));
    }
  }, [isEditing, selectedTrip, existingRule]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: RecurringRule) => {
      return await apiClient.post('/recurring-availability', {
        ...data,
        days_of_week: data.days_of_week.join(','),
        time_slots: data.time_slots.length > 0 ? data.time_slots : undefined,
        traveler_pricing: data.traveler_pricing && data.traveler_pricing.length > 0 ? data.traveler_pricing : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-availability'] });
      showToast(__('Recurring rule created successfully', 'Recurring rule created successfully'), 'success');
      navigate({ subpage: 'trips', tab: 'availability', trip_id: formData.trip_id.toString() });
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to create rule', 'Failed to create rule'), 'error');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: RecurringRule) => {
      return await apiClient.put(`/recurring-availability/${ruleId}`, {
        ...data,
        days_of_week: data.days_of_week.join(','),
        time_slots: data.time_slots.length > 0 ? data.time_slots : undefined,
        traveler_pricing: data.traveler_pricing && data.traveler_pricing.length > 0 ? data.traveler_pricing : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-availability'] });
      showToast(__('Recurring rule updated successfully', 'Recurring rule updated successfully'), 'success');
      navigate({ subpage: 'trips', tab: 'availability', trip_id: formData.trip_id.toString() });
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to update rule', 'Failed to update rule'), 'error');
    },
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async (data: RecurringRule) => {
      return await apiClient.post('/recurring-availability/preview', {
        ...data,
        days_of_week: data.days_of_week.join(','),
        time_slots: data.time_slots.length > 0 ? data.time_slots : undefined,
        traveler_pricing: data.traveler_pricing && data.traveler_pricing.length > 0 ? data.traveler_pricing : undefined,
        preview_limit: 20,
      });
    },
    onSuccess: (response) => {
      // Unwrap the data property from API response
      const previewResult = response?.data || response;
      setPreviewData(previewResult);
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to generate preview', 'Failed to generate preview'), 'error');
    },
  });

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.trip_id) {
      showToast(__('Please select a trip', 'Please select a trip'), 'error');
      return;
    }

    if (formData.rule_type === 'weekly' && formData.days_of_week.length === 0) {
      showToast(__('Please select at least one day of the week', 'Please select at least one day of the week'), 'error');
      return;
    }

    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  // Handle day toggle for weekly rules
  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort((a, b) => a - b),
    }));
  };

  // Add excluded date
  const addExcludedDate = () => {
    if (newExcludedDate && !formData.excluded_dates.includes(newExcludedDate)) {
      setFormData(prev => ({
        ...prev,
        excluded_dates: [...prev.excluded_dates, newExcludedDate].sort(),
      }));
      setNewExcludedDate('');
    }
  };

  // Remove excluded date
  const removeExcludedDate = (date: string) => {
    setFormData(prev => ({
      ...prev,
      excluded_dates: prev.excluded_dates.filter(d => d !== date),
    }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingRule) {
    return <RecurringRuleFormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? __('Edit Recurring Rule', 'Edit Recurring Rule') : __('Create Recurring Rule', 'Create Recurring Rule')}
        description={headerDescription}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate({ subpage: 'trips', tab: 'availability', trip_id: formData.trip_id?.toString() || tripIdFromUrl || '' })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {__('Back to Availability', 'Back to Availability')}
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>{__('Basic Information', 'Basic Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Trip', 'Trip')} <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      value={formData.trip_id?.toString() || ''}
                      onChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        trip_id: parseInt(value) || 0,
                        // Reset pricing when trip changes and set pricing_type based on new trip
                        pricing_type: (tripsData?.trips.find(t => t.id === parseInt(value))?.pricing_type || 'regular') as 'regular' | 'traveler_based',
                        traveler_pricing: [],
                        original_price: undefined,
                        sale_price: undefined,
                      }))}
                      options={[
                        { value: '', label: __('-- Select Trip --', '-- Select Trip --') },
                        ...(tripsData?.trips.map(trip => ({
                          value: trip.id.toString(),
                          label: `${trip.title} (${trip.pricing_type === 'traveler_based' ? 'Traveler-Based' : 'Regular'})`,
                        })) || [])
                      ]}
                      placeholder={__('Select a trip', 'Select a trip')}
                      disabled={isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Rule Name', 'Rule Name')}
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={__('e.g., Weekend Departures', 'e.g., Weekend Departures')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__('Rule Type', 'Rule Type')} <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.rule_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, rule_type: e.target.value as 'weekly' | 'monthly' | 'interval' }))}
                  >
                    <option value="weekly">{__('Weekly (specific days)', 'Weekly (specific days)')}</option>
                    <option value="monthly">{__('Monthly (e.g., first Sunday)', 'Monthly (e.g., first Sunday)')}</option>
                    <option value="interval">{__('Interval (every X days)', 'Interval (every X days)')}</option>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pattern Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  {__('Recurrence Pattern', 'Recurrence Pattern')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.rule_type === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {__('Days of Week', 'Days of Week')} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {dayOptions.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            formData.days_of_week.includes(day.value)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.rule_type === 'monthly' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__('Week of Month', 'Week of Month')}
                      </label>
                      <Select
                        value={formData.week_of_month || 'first'}
                        onChange={(e) => setFormData(prev => ({ ...prev, week_of_month: e.target.value as any }))}
                      >
                        {weekOptions.map(week => (
                          <option key={week.value} value={week.value}>{week.label}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__('Day of Week', 'Day of Week')}
                      </label>
                      <Select
                        value={formData.day_of_week?.toString() || '0'}
                        onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
                      >
                        {dayOptions.map(day => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                )}

                {formData.rule_type === 'interval' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Every X Days', 'Every X Days')}
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={formData.interval_days || 7}
                      onChange={(e) => setFormData(prev => ({ ...prev, interval_days: parseInt(e.target.value) || 7 }))}
                    />
                  </div>
                )}

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Start Date', 'Start Date')} <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={formData.start_date}
                      onChange={(value: string) => setFormData(prev => ({ ...prev, start_date: value }))}
                      placeholder={__('Select start date', 'Select start date')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('End Date', 'End Date')} <span className="text-gray-400">({__('optional', 'optional')})</span>
                    </label>
                    <DatePicker
                      value={formData.end_date || ''}
                      onChange={(value: string) => setFormData(prev => ({ ...prev, end_date: value }))}
                      minDate={formData.start_date ? new Date(formData.start_date) : undefined}
                      placeholder={__('Select end date (optional)', 'Select end date (optional)')}
                    />
                  </div>
                </div>

                {/* Month Filter */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__('Specific Months', 'Specific Months')} <span className="text-gray-400">({__('optional - leave empty for all months', 'optional - leave empty for all months')})</span>
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {[
                      { value: 1, label: __('January', 'January') },
                      { value: 2, label: __('February', 'February') },
                      { value: 3, label: __('March', 'March') },
                      { value: 4, label: __('April', 'April') },
                      { value: 5, label: __('May', 'May') },
                      { value: 6, label: __('June', 'June') },
                      { value: 7, label: __('July', 'July') },
                      { value: 8, label: __('August', 'August') },
                      { value: 9, label: __('September', 'September') },
                      { value: 10, label: __('October', 'October') },
                      { value: 11, label: __('November', 'November') },
                      { value: 12, label: __('December', 'December') },
                    ].map((month) => (
                      <label
                        key={month.value}
                        className={`flex items-center justify-center px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                          formData.months.includes(month.value)
                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.months.includes(month.value)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              months: checked
                                ? [...prev.months, month.value].sort((a, b) => a - b)
                                : prev.months.filter(m => m !== month.value)
                            }));
                          }}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{month.label.slice(0, 3)}</span>
                      </label>
                    ))}
                  </div>
                  {formData.months.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {__('Selected:', 'Selected:')} {formData.months.length} {formData.months.length === 1 ? __('month', 'month') : __('months', 'months')}
                    </p>
                  )}
                </div>

                {/* Excluded Dates */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__('Excluded Dates', 'Excluded Dates')} <span className="text-gray-400">({__('holidays, etc.', 'holidays, etc.')})</span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <DatePicker
                        value={newExcludedDate}
                        onChange={(value: string) => setNewExcludedDate(value)}
                        placeholder={__('Select date to exclude', 'Select date to exclude')}
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={addExcludedDate} disabled={!newExcludedDate}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.excluded_dates.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.excluded_dates.map(date => (
                        <Badge key={date} variant="outline" className="flex items-center gap-1">
                          {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                          <button type="button" onClick={() => removeExcludedDate(date)} className="ml-1 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Capacity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {__('Pricing & Availability', 'Pricing & Availability')}
                </CardTitle>
                <CardDescription>
                  {__('Set pricing for traveler categories and seat availability for this rule', 'Set pricing for traveler categories and seat availability for this rule')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pricing Override Info */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {__('Pricing Override (Optional)', 'Pricing Override (Optional)')}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {__('Leave pricing fields empty to use the trip\'s default pricing. Fill them in only if you want to override the default pricing for dates generated by this rule.', 'Leave pricing fields empty to use the trip\'s default pricing. Fill them in only if you want to override the default pricing for dates generated by this rule.')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pricing Type Info - Inherited from Trip */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isTravelerBasedPricing ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                      {isTravelerBasedPricing ? (
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                        </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {isTravelerBasedPricing 
                          ? __('Traveler-Based Pricing', 'Traveler-Based Pricing')
                          : __('Regular Pricing', 'Regular Pricing')
                        }
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {isTravelerBasedPricing
                          ? __('This trip uses traveler category pricing. Set prices for each category below.', 'This trip uses traveler category pricing. Set prices for each category below.')
                          : __('This trip uses regular pricing. Set a single price for all travelers below.', 'This trip uses regular pricing. Set a single price for all travelers below.')
                        }
                      </p>
                      </div>
                        </div>
                </div>

                {/* Regular Pricing Fields */}
                {!isTravelerBasedPricing && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {__('Original Price', 'Original Price')} <span className="text-gray-400 text-xs">({__('Optional', 'Optional')})</span>
                        </label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={formData.original_price || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, original_price: parseFloat(e.target.value) || undefined }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {__('Sale Price', 'Sale Price')}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={formData.sale_price || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, sale_price: parseFloat(e.target.value) || undefined }))}
                          placeholder="0.00"
                        />
                        <p className="mt-1 text-xs text-gray-500">{__('Leave empty if no discount', 'Leave empty if no discount')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Traveler-Based Pricing */}
                {isTravelerBasedPricing && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__('Traveler Category Pricing', 'Traveler Category Pricing')} <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        {__('Add pricing for traveler categories. Categories are managed in Traveler Categories page.', 'Add pricing for traveler categories. Categories are managed in Traveler Categories page.')}
                      </p>
                    </div>

                    {/* Active Categories Filter */}
                    {(() => {
                      const activeCategories = travelerCategories.filter((cat: TravelerCategory) => 
                        cat.status === 'active' || cat.status === 'publish'
                      );
                      
                      if (activeCategories.length === 0) {
                        return (
                          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {__('No active traveler categories found.', 'No active traveler categories found.')}
                            </p>
                        <Button
                          type="button"
                          variant="outline"
                              onClick={() => window.location.href = '?page=yatra&subpage=traveler-categories&action=create'}
                              className="flex items-center gap-2 mx-auto"
                            >
                              <Plus className="w-4 h-4" />
                              {__('Create Category', 'Create Category')}
                            </Button>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-4">
                          {/* Add Pricing Button with Dropdown */}
                          <div className="relative">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowCategorySelector(!showCategorySelector)}
                              className="flex items-center gap-2"
                              disabled={activeCategories.filter(cat => !formData.traveler_pricing?.some(tp => tp.category_id === cat.id)).length === 0}
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
                                      .filter(cat => !formData.traveler_pricing?.some(tp => tp.category_id === cat.id))
                                      .length === 0 ? (
                                      <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                                        {__('All categories have pricing added', 'All categories have pricing added')}
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        {activeCategories
                                          .filter(cat => !formData.traveler_pricing?.some(tp => tp.category_id === cat.id))
                                          .map((category: TravelerCategory) => {
                                            const minAge = category.age_min ?? category.min_age;
                                            const maxAge = category.age_max ?? category.max_age;
                                            const ageRange = minAge !== undefined || maxAge !== undefined
                                              ? minAge !== undefined && maxAge !== undefined
                                                ? `${minAge}-${maxAge} ${__('years', 'years')}`
                                                : minAge !== undefined
                                                ? `${minAge}+ ${__('years', 'years')}`
                                                : maxAge !== undefined
                                                ? `${__('Under', 'Under')} ${maxAge} ${__('years', 'years')}`
                                                : ''
                                              : null;
                                            const categoryName = category.label || category.name || `Category ${category.id}`;

                                            return (
                                              <button
                                                key={category.id}
                                                type="button"
                          onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                traveler_pricing: [...(prev.traveler_pricing || []), {
                                                      category_id: category.id,
                                  original_price: 0,
                                  sale_price: undefined,
                                }]
                              }));
                                                  setShowCategorySelector(false);
                          }}
                                                className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                              >
                                                <div className="font-medium text-sm text-gray-900 dark:text-white">
                                                  {categoryName}
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
                          {formData.traveler_pricing && formData.traveler_pricing.length > 0 && (
                      <div className="space-y-3">
                        {formData.traveler_pricing.map((pricing, index) => {
                                const category = activeCategories.find(cat => cat.id === pricing.category_id);
                                if (!category) return null;
                                
                                const minAge = category.age_min ?? category.min_age;
                                const maxAge = category.age_max ?? category.max_age;
                                const categoryName = category.label || category.name || `Category ${pricing.category_id}`;

                          return (
                                  <div key={pricing.category_id} className="p-4 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {categoryName}
                                            {(minAge !== undefined || maxAge !== undefined) && (
                                              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                (
                                                {minAge !== undefined && maxAge !== undefined
                                                  ? `${minAge}-${maxAge} ${__('years', 'years')}`
                                                  : minAge !== undefined
                                                  ? `${minAge}+ ${__('years', 'years')}`
                                                  : maxAge !== undefined
                                                  ? `${__('Under', 'Under')} ${maxAge} ${__('years', 'years')}`
                                                  : ''}
                                                )
                                    </span>
                                  )}
                                          </h4>
                                        </div>
                                        {category.description && (
                                          <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {category.description}
                                          </p>
                                        )}
                                      </div>
                                      <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({
                                    ...prev,
                                    traveler_pricing: prev.traveler_pricing?.filter((_, i) => i !== index) || []
                                  }))}
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
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={pricing.original_price || ''}
                                    onChange={(e) => {
                                      const newPricing = [...(formData.traveler_pricing || [])];
                                      newPricing[index].original_price = parseFloat(e.target.value) || 0;
                                      setFormData(prev => ({ ...prev, traveler_pricing: newPricing }));
                                    }}
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                          {__('Sale Price', 'Sale Price')} ({__('Optional', 'Optional')})
                                  </label>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={pricing.sale_price || ''}
                                    onChange={(e) => {
                                      const newPricing = [...(formData.traveler_pricing || [])];
                                      newPricing[index].sale_price = parseFloat(e.target.value) || undefined;
                                      setFormData(prev => ({ ...prev, traveler_pricing: newPricing }));
                                    }}
                                    className="text-sm"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Inventory Management - Common for both pricing types */}
                {selectedTrip && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                      {__('Inventory Management', 'Inventory Management')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {__('Total Capacity', 'Total Capacity')} <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={formData.seats_total}
                          onChange={(e) => setFormData(prev => ({ ...prev, seats_total: parseInt(e.target.value) || 1 }))}
                        />
                        <p className="mt-1 text-xs text-gray-500">{__('Maximum number of seats available for this rule', 'Maximum number of seats available for this rule')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {__('Alert Threshold', 'Alert Threshold')}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.alert_threshold}
                          onChange={(e) => setFormData(prev => ({ ...prev, alert_threshold: parseInt(e.target.value) || 0 }))}
                        />
                        <p className="mt-1 text-xs text-gray-500">{__('Alert when available seats drop below this number', 'Alert when available seats drop below this number')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* No trip selected message */}
                {!selectedTrip && (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {__('Select a trip above to configure pricing', 'Select a trip above to configure pricing')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Time & Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {__('Time & Location', 'Time & Location')}
                </CardTitle>
                {selectedTrip && (
                  <CardDescription>
                    <Badge variant={isSingleDayTrip ? 'default' : 'outline'} className="mr-2">
                      {isSingleDayTrip ? __('Single-Day Trip', 'Single-Day Trip') : __('Multi-Day Trip', 'Multi-Day Trip')}
                    </Badge>
                    {!isSingleDayTrip && selectedTrip.duration_days && (
                      <span className="text-gray-500">({selectedTrip.duration_days} {__('days', 'days')})</span>
                    )}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Single-Day Trip: Multiple Time Slots */}
                {isSingleDayTrip && formData.trip_id > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {__('Time Slots', 'Time Slots')} 
                        <span className="text-gray-400 ml-1">({__('for each recurring day', 'for each recurring day')})</span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          time_slots: [...prev.time_slots, { 
                            departure_time: '09:00', 
                            arrival_time: '17:00', 
                            seats: 20, 
                            price: 0,
                            traveler_pricing: isTravelerBasedPricing ? [] : undefined
                          }]
                        }))}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {__('Add Slot', 'Add Slot')}
                      </Button>
                    </div>

                    {formData.time_slots.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {__('No time slots added yet', 'No time slots added yet')}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {__('Add multiple time slots for tours throughout the day (e.g., morning, afternoon, evening)', 'Add multiple time slots for tours throughout the day (e.g., morning, afternoon, evening)')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.time_slots.map((slot, index) => (
                          <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {__('Slot', 'Slot')} {index + 1}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  time_slots: prev.time_slots.filter((_, i) => i !== index)
                                }))}
                                className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="space-y-3">
                              {/* Time fields on first line */}
                              <div className="grid grid-cols-2 gap-3">
                                              <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  {__('Departure Time', 'Departure Time')}
                                                </label>
                                                <TimePicker
                                  value={slot.departure_time || ''}
                                                  onChange={(value: string) => {
                                                    const newSlots = [...formData.time_slots];
                                                    newSlots[index].departure_time = value;
                                                    setFormData(prev => ({ ...prev, time_slots: newSlots }));
                                                  }}
                                                  placeholder="09:00"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  {__('Arrival Time', 'Arrival Time')}
                                                </label>
                                                <TimePicker
                                  value={slot.arrival_time || ''}
                                                  onChange={(value: string) => {
                                                    const newSlots = [...formData.time_slots];
                                                    newSlots[index].arrival_time = value;
                                                    setFormData(prev => ({ ...prev, time_slots: newSlots }));
                                                  }}
                                                  placeholder="17:00"
                                                />
                                              </div>
                              </div>
                              
                              {/* Seats, Price and Sale Price on second line */}
                              {!isTravelerBasedPricing && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  {__('Seats', 'Seats')}
                                </label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={slot.seats}
                                  onChange={(e) => {
                                    const newSlots = [...formData.time_slots];
                                    newSlots[index].seats = parseInt(e.target.value) || 1;
                                    setFormData(prev => ({ ...prev, time_slots: newSlots }));
                                  }}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  {__('Price', 'Price')}
                                </label>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={slot.price || ''}
                                  onChange={(e) => {
                                    const newSlots = [...formData.time_slots];
                                    newSlots[index].price = parseFloat(e.target.value) || 0;
                                    setFormData(prev => ({ ...prev, time_slots: newSlots }));
                                  }}
                                  className="text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                      {__('Sale Price', 'Sale Price')}
                                    </label>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={slot.sale_price || ''}
                                      onChange={(e) => {
                                        const newSlots = [...formData.time_slots];
                                        newSlots[index].sale_price = parseFloat(e.target.value) || undefined;
                                        setFormData(prev => ({ ...prev, time_slots: newSlots }));
                                      }}
                                      className="text-sm"
                                      placeholder="0.00"
                                    />
                            </div>
                                </div>
                              )}
                              
                              {/* For traveler-based pricing, only show seats on second line */}
                              {isTravelerBasedPricing && (
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    {__('Seats', 'Seats')}
                                  </label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={slot.seats}
                                    onChange={(e) => {
                                      const newSlots = [...formData.time_slots];
                                      newSlots[index].seats = parseInt(e.target.value) || 1;
                                      setFormData(prev => ({ ...prev, time_slots: newSlots }));
                                    }}
                                    className="text-sm"
                                  />
                                </div>
                              )}
                            </div>
                            
                            {/* Traveler Pricing for Time Slot - only show when traveler-based */}
                            {isTravelerBasedPricing && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                      {__('Traveler Category Pricing', 'Traveler Category Pricing')}
                                    </span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {__('Set pricing for each traveler category for this time slot', 'Set pricing for each traveler category for this time slot')}
                                    </p>
                                  </div>
                                </div>
                                
                                {(() => {
                                  const activeCategories = travelerCategories.filter((cat: TravelerCategory) => 
                                    cat.status === 'active' || cat.status === 'publish'
                                  );
                                  const slotTravelerPricing = slot.traveler_pricing || [];
                                  const availableCategories = activeCategories.filter(cat => 
                                    !slotTravelerPricing.some(tp => tp.category_id === cat.id)
                                  );
                                  
                                  return (
                                    <div className="space-y-3">
                                      {/* Add Pricing Button with Dropdown */}
                                      <div className="relative">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            // Toggle dropdown for this specific slot
                                            const dropdownId = `slot-${index}-category-dropdown`;
                                            const dropdown = document.getElementById(dropdownId);
                                            if (dropdown) {
                                              dropdown.classList.toggle('hidden');
                                            }
                                          }}
                                          disabled={availableCategories.length === 0}
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          {__('Add Pricing', 'Add Pricing')}
                                        </Button>
                                        
                                        {/* Category Selection Dropdown */}
                                        <div 
                                          id={`slot-${index}-category-dropdown`}
                                          className="hidden absolute top-full left-0 mt-2 w-full max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto"
                                        >
                                          <div className="p-2">
                                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 px-3 py-2 mb-1">
                                              {__('Select a category to add pricing', 'Select a category to add pricing')}
                                            </div>
                                            {availableCategories.length === 0 ? (
                                              <div className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                                                {__('All categories have pricing added', 'All categories have pricing added')}
                                              </div>
                                            ) : (
                                              <div className="space-y-1">
                                                {availableCategories.map((category: TravelerCategory) => {
                                                  const minAge = category.age_min ?? category.min_age;
                                                  const maxAge = category.age_max ?? category.max_age;
                                                  const ageRange = minAge !== undefined || maxAge !== undefined
                                                    ? minAge !== undefined && maxAge !== undefined
                                                      ? `${minAge}-${maxAge} ${__('years', 'years')}`
                                                      : minAge !== undefined
                                                      ? `${minAge}+ ${__('years', 'years')}`
                                                      : `${__('Under', 'Under')} ${maxAge} ${__('years', 'years')}`
                                                    : null;
                                                  const categoryName = category.label || category.name || `Category ${category.id}`;

                                                  return (
                                                    <button
                                                      key={category.id}
                                                      type="button"
                                                      onClick={() => {
                                                        const newSlots = [...formData.time_slots];
                                                        if (!newSlots[index].traveler_pricing) {
                                                          newSlots[index].traveler_pricing = [];
                                                        }
                                                        newSlots[index].traveler_pricing = [...newSlots[index].traveler_pricing!, {
                                                          category_id: category.id,
                                                          original_price: 0,
                                                          sale_price: undefined,
                                                        }];
                                                        setFormData(prev => ({ ...prev, time_slots: newSlots }));
                                                        // Hide dropdown
                                                        const dropdown = document.getElementById(`slot-${index}-category-dropdown`);
                                                        if (dropdown) dropdown.classList.add('hidden');
                                                      }}
                                                      className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                      <div className="font-medium text-xs text-gray-900 dark:text-white">
                                                        {categoryName}
                                                        {ageRange && (
                                                          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                            ({ageRange})
                                                          </span>
                                                        )}
                                                      </div>
                                                      {category.description && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
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
                                      </div>

                                      {/* Added Pricing List */}
                                      {slotTravelerPricing.length > 0 && (
                                        <div className="space-y-2">
                                          {slotTravelerPricing.map((tp, tpIndex) => {
                                            const category = activeCategories.find(cat => cat.id === tp.category_id);
                                            if (!category) return null;
                                            
                                            const minAge = category.age_min ?? category.min_age;
                                            const maxAge = category.age_max ?? category.max_age;
                                            const categoryName = category.label || category.name || `Category ${tp.category_id}`;

                                            return (
                                              <div key={tp.category_id} className="p-3 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <div className="flex items-start justify-between mb-2">
                                                  <div className="flex-1">
                                                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                                      {categoryName}
                                                      {(minAge !== undefined || maxAge !== undefined) && (
                                                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                          ({minAge !== undefined && maxAge !== undefined
                                                            ? `${minAge}-${maxAge}`
                                                            : minAge !== undefined
                                                            ? `${minAge}+`
                                                            : `<${maxAge}`} {__('yrs', 'yrs')})
                                                        </span>
                                                      )}
                                                    </span>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const newSlots = [...formData.time_slots];
                                                      if (newSlots[index] && newSlots[index].traveler_pricing) {
                                                        newSlots[index].traveler_pricing = newSlots[index].traveler_pricing!.filter((_, i) => i !== tpIndex);
                                                        setFormData(prev => ({ ...prev, time_slots: newSlots }));
                                                      }
                                                    }}
                                                    className="p-0.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                  <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                      {__('Price', 'Price')} <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input
                                                      type="number"
                                                      min={0}
                                                      step="0.01"
                                                      value={tp.original_price || ''}
                                                      onChange={(e) => {
                                                        const newSlots = [...formData.time_slots];
                                                        if (newSlots[index] && newSlots[index].traveler_pricing) {
                                                          newSlots[index].traveler_pricing![tpIndex].original_price = parseFloat(e.target.value) || 0;
                                                          setFormData(prev => ({ ...prev, time_slots: newSlots }));
                                                        }
                                                      }}
                                                      className="text-xs"
                                                      placeholder="0.00"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                      {__('Sale', 'Sale')}
                                                    </label>
                                                    <Input
                                                      type="number"
                                                      min={0}
                                                      step="0.01"
                                                      value={tp.sale_price || ''}
                                                      onChange={(e) => {
                                                        const newSlots = [...formData.time_slots];
                                                        if (newSlots[index] && newSlots[index].traveler_pricing) {
                                                          newSlots[index].traveler_pricing![tpIndex].sale_price = parseFloat(e.target.value) || undefined;
                                                          setFormData(prev => ({ ...prev, time_slots: newSlots }));
                                                        }
                                                      }}
                                                      className="text-xs"
                                                      placeholder="0.00"
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                      
                                      {slotTravelerPricing.length === 0 && (
                                        <div className="text-center py-3 bg-gray-100 dark:bg-gray-800 rounded border border-dashed border-gray-300 dark:border-gray-600">
                                          <p className="text-xs text-gray-500">
                                            {__('Click "Add Pricing" to set prices for traveler categories', 'Click "Add Pricing" to set prices for traveler categories')}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* If no time slots, show default fields as fallback */}
                    {formData.time_slots.length === 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          {__('Or use default time (applies to all generated dates):', 'Or use default time (applies to all generated dates):')}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {__('Default Start Time', 'Default Start Time')}
                            </label>
                            <TimePicker
                              value={formData.departure_time || ''}
                              onChange={(value: string) => setFormData(prev => ({ ...prev, departure_time: value }))}
                              placeholder="09:00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {__('Default End Time', 'Default End Time')}
                            </label>
                            <TimePicker
                              value={formData.arrival_time || ''}
                              onChange={(value: string) => setFormData(prev => ({ ...prev, arrival_time: value }))}
                              placeholder="17:00"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Multi-Day Trip: Single Departure Time */}
                {!isSingleDayTrip && formData.trip_id > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__('Departure Time', 'Departure Time')}
                      </label>
                      <TimePicker
                        value={formData.departure_time || ''}
                        onChange={(value: string) => setFormData(prev => ({ ...prev, departure_time: value }))}
                        placeholder="08:00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__('Return Time', 'Return Time')} <span className="text-gray-400">({__('on final day', 'on final day')})</span>
                      </label>
                      <TimePicker
                        value={formData.arrival_time || ''}
                        onChange={(value: string) => setFormData(prev => ({ ...prev, arrival_time: value }))}
                        placeholder="18:00"
                      />
                    </div>
                  </div>
                )}

                {/* No trip selected */}
                {!formData.trip_id && (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {__('Select a trip above to configure time settings', 'Select a trip above to configure time settings')}
                    </p>
                  </div>
                )}

                {/* Location & Cutoff - always shown when trip selected */}
                {formData.trip_id > 0 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {__('From Location', 'From Location')}
                        </label>
                        <Input
                          type="text"
                          value={formData.from_location || selectedTrip?.starting_location || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, from_location: e.target.value }))}
                          placeholder={selectedTrip?.starting_location || __('e.g., Airport', 'e.g., Airport')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {__('To Location', 'To Location')}
                        </label>
                        <Input
                          type="text"
                          value={formData.to_location || selectedTrip?.ending_location || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, to_location: e.target.value }))}
                          placeholder={selectedTrip?.ending_location || __('e.g., Hotel', 'e.g., Hotel')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__('Booking Cutoff (hours before)', 'Booking Cutoff (hours before)')}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.cutoff_hours}
                        onChange={(e) => setFormData(prev => ({ ...prev, cutoff_hours: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>{__('Status', 'Status')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                >
                  <option value="active">{__('Active', 'Active')}</option>
                  <option value="inactive">{__('Inactive', 'Inactive')}</option>
                </Select>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  {__('Preview', 'Preview')}
                </CardTitle>
                <CardDescription>
                  {__('See which dates will be generated', 'See which dates will be generated')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mb-4"
                  onClick={() => previewMutation.mutate(formData)}
                  disabled={previewMutation.isPending || !formData.trip_id}
                >
                  {previewMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  {__('Generate Preview', 'Generate Preview')}
                </Button>

                {previewData && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{__('Total dates:', 'Total dates:')}</span>
                      <Badge variant="success">{previewData.total}</Badge>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {previewData.dates && Array.isArray(previewData.dates) && previewData.dates.map((date: any, index: number) => (
                        <div
                          key={index}
                          className="text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded flex justify-between"
                        >
                          <span>
                            {new Date(date.departure_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          {date.departure_time && (
                            <span className="text-gray-500">{date.departure_time}</span>
                          )}
                        </div>
                      ))}
                      {previewData.total > 20 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{previewData.total - 20} {__('more dates', 'more dates')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isEditing ? __('Update Rule', 'Update Rule') : __('Create Rule', 'Create Rule')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate({ subpage: 'trips', tab: 'availability', trip_id: formData.trip_id?.toString() || tripIdFromUrl || '' })}
                  >
                    {__('Cancel', 'Cancel')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Alert>
              <div className="ml-2">
                <h4 className="font-medium">{__('How it works', 'How it works')}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {__('Dates are generated automatically based on your pattern. Manually added specific dates will take priority over generated dates.', 'Dates are generated automatically based on your pattern. Manually added specific dates will take priority over generated dates.')}
                </p>
              </div>
            </Alert>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RecurringRuleForm;

