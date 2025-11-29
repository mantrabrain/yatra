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
  name: string;
  min_age?: number;
  max_age?: number;
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
  time_slots: TimeSlot[]; // For single-day trips with multiple slots
  original_price?: number;
  sale_price?: number;
  traveler_pricing?: TravelerPricing[]; // For traveler-based pricing
  seats_total: number;
  departure_time?: string;
  arrival_time?: string;
  from_location?: string;
  to_location?: string;
  cutoff_hours: number;
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
    time_slots: [], // For single-day trips with multiple slots
    original_price: undefined,
    sale_price: undefined,
    traveler_pricing: [], // For traveler-based pricing
    seats_total: 20,
    departure_time: '',
    arrival_time: '',
    from_location: '',
    to_location: '',
    cutoff_hours: 24,
    status: 'active',
  });

  const [newExcludedDate, setNewExcludedDate] = useState('');
  const [previewData, setPreviewData] = useState<{ total: number; dates: any[] } | null>(null);

  // Fetch trips for dropdown
  const { data: tripsData } = useQuery({
    queryKey: ['trips', 'all'],
    queryFn: async () => {
      const response = await apiClient.get('/trips', { params: { per_page: 100, status: 'published' } });
      return {
        trips: (response?.data || []).map((trip: any) => ({
          id: trip.id,
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
  const isSingleDayTrip = selectedTrip?.trip_type === 'single_day' || (selectedTrip?.duration_days || 1) <= 1;
  const isTravelerBasedPricing = selectedTrip?.pricing_type === 'traveler_based';

  // Fetch existing rule if editing
  const { data: existingRule, isLoading: isLoadingRule } = useQuery({
    queryKey: ['recurring-availability', ruleId],
    queryFn: async () => {
      if (!ruleId) return null;
      const response = await apiClient.get(`/recurring-availability/${ruleId}`);
      return response;
    },
    enabled: !!ruleId,
  });

  // Update form when existing rule is loaded
  useEffect(() => {
    if (existingRule) {
      setFormData({
        trip_id: existingRule.trip_id,
        name: existingRule.name || '',
        rule_type: existingRule.rule_type,
        days_of_week: existingRule.days_of_week_array || existingRule.days_of_week?.split(',').map(Number) || [0],
        week_of_month: existingRule.week_of_month || 'first',
        day_of_week: existingRule.day_of_week ?? 0,
        interval_days: existingRule.interval_days || 7,
        start_date: existingRule.start_date,
        end_date: existingRule.end_date || '',
        excluded_dates: existingRule.excluded_dates || [],
        time_slots: existingRule.time_slots || [],
        original_price: existingRule.original_price,
        sale_price: existingRule.sale_price,
        traveler_pricing: existingRule.traveler_pricing || [],
        seats_total: existingRule.seats_total || 20,
        departure_time: existingRule.departure_time || '',
        arrival_time: existingRule.arrival_time || '',
        from_location: existingRule.from_location || '',
        to_location: existingRule.to_location || '',
        cutoff_hours: existingRule.cutoff_hours || 24,
        status: existingRule.status || 'active',
      });
    }
  }, [existingRule]);

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
    onSuccess: (data) => {
      setPreviewData(data);
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
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? __('Edit Recurring Rule', 'Edit Recurring Rule') : __('Create Recurring Rule', 'Create Recurring Rule')}
        description={__('Set up automatic availability patterns for your trips', 'Set up automatic availability patterns for your trips')}
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
                        // Reset pricing when trip changes
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
                  {__('Pricing & Capacity', 'Pricing & Capacity')}
                </CardTitle>
                {selectedTrip && (
                  <CardDescription>
                    <Badge variant={isTravelerBasedPricing ? 'success' : 'default'}>
                      {isTravelerBasedPricing 
                        ? __('Traveler-Based Pricing', 'Traveler-Based Pricing') 
                        : __('Regular Pricing', 'Regular Pricing')}
                    </Badge>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Regular Pricing */}
                {!isTravelerBasedPricing && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__('Original Price', 'Original Price')}
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
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__('Seats per Departure', 'Seats per Departure')}
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.seats_total}
                        onChange={(e) => setFormData(prev => ({ ...prev, seats_total: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>
                )}

                {/* Traveler-Based Pricing */}
                {isTravelerBasedPricing && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {__('Pricing by Traveler Category', 'Pricing by Traveler Category')}
                      </label>
                      {travelerCategories.length > 0 && (formData.traveler_pricing?.length || 0) < travelerCategories.length && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Add the first unassigned category
                            const existingCategoryIds = formData.traveler_pricing?.map(tp => tp.category_id) || [];
                            const nextCategory = travelerCategories.find(cat => !existingCategoryIds.includes(cat.id));
                            if (nextCategory) {
                              setFormData(prev => ({
                                ...prev,
                                traveler_pricing: [...(prev.traveler_pricing || []), {
                                  category_id: nextCategory.id,
                                  original_price: 0,
                                  sale_price: undefined,
                                }]
                              }));
                            }
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {__('Add Category', 'Add Category')}
                        </Button>
                      )}
                    </div>

                    {(!formData.traveler_pricing || formData.traveler_pricing.length === 0) ? (
                      <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {__('No traveler pricing configured yet', 'No traveler pricing configured yet')}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {__('Add pricing for different traveler categories (e.g., Adult, Child, Senior)', 'Add pricing for different traveler categories (e.g., Adult, Child, Senior)')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.traveler_pricing.map((pricing, index) => {
                          const category = travelerCategories.find(cat => cat.id === pricing.category_id);
                          return (
                            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {category?.name || `Category ${pricing.category_id}`}
                                  {category?.min_age !== undefined && category?.max_age !== undefined && (
                                    <span className="text-gray-400 font-normal ml-2">
                                      ({category.min_age}-{category.max_age} {__('years', 'years')})
                                    </span>
                                  )}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setFormData(prev => ({
                                    ...prev,
                                    traveler_pricing: prev.traveler_pricing?.filter((_, i) => i !== index) || []
                                  }))}
                                  className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    {__('Original Price', 'Original Price')}
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

                    {/* Seats - always needed for traveler-based pricing */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__('Seats per Departure', 'Seats per Departure')}
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.seats_total}
                        onChange={(e) => setFormData(prev => ({ ...prev, seats_total: parseInt(e.target.value) || 1 }))}
                        className="max-w-xs"
                      />
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
                          time_slots: [...prev.time_slots, { departure_time: '09:00', arrival_time: '17:00', seats: 20, price: 0 }]
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
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                              <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                  {__('Start Time', 'Start Time')}
                                                </label>
                                                <TimePicker
                                                  value={slot.departure_time}
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
                                                  {__('End Time', 'End Time')}
                                                </label>
                                                <TimePicker
                                                  value={slot.arrival_time}
                                                  onChange={(value: string) => {
                                                    const newSlots = [...formData.time_slots];
                                                    newSlots[index].arrival_time = value;
                                                    setFormData(prev => ({ ...prev, time_slots: newSlots }));
                                                  }}
                                                  placeholder="17:00"
                                                />
                                              </div>
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
                            </div>
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
                      {previewData.dates.map((date: any, index: number) => (
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
              <AlertCircle className="w-4 h-4" />
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

