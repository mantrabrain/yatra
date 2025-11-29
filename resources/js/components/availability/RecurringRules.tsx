/**
 * Recurring Availability Rules Component
 * Manage recurring patterns for trip availability
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  RefreshCw,
  Clock,
  Users,
  DollarSign,
  Eye,
  X,
  Check,
  AlertCircle,
  Ban
} from 'lucide-react';
import { __ } from '../../lib/i18n';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { apiClient } from '../../lib/api';
import { useToast } from '../ui/toast';

interface RecurringRule {
  id: number;
  trip_id: number;
  name: string;
  rule_type: 'weekly' | 'monthly' | 'interval';
  days_of_week?: string;
  days_of_week_array?: number[];
  week_of_month?: 'first' | 'second' | 'third' | 'fourth' | 'last';
  day_of_week?: number;
  interval_days?: number;
  start_date: string;
  end_date?: string;
  excluded_dates: string[];
  original_price?: number;
  sale_price?: number;
  seats_total: number;
  departure_time?: string;
  arrival_time?: string;
  from_location?: string;
  to_location?: string;
  cutoff_hours: number;
  status: 'active' | 'inactive';
  generated_count?: number;
  preview?: {
    total: number;
    dates: any[];
    excluded_count: number;
  };
}

interface RecurringRulesProps {
  tripId: number;
  onAddRule: () => void;
  onEditRule: (id: number) => void;
}

const dayNames = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const weekPositions = [
  { value: 'first', label: 'First' },
  { value: 'second', label: 'Second' },
  { value: 'third', label: 'Third' },
  { value: 'fourth', label: 'Fourth' },
  { value: 'last', label: 'Last' },
];

export const RecurringRules: React.FC<RecurringRulesProps> = ({
  tripId,
  onAddRule,
  onEditRule,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [previewRuleId, setPreviewRuleId] = useState<number | null>(null);

  // Fetch recurring rules
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['recurring-availability', tripId],
    queryFn: async () => {
      const response = await apiClient.get('/recurring-availability', {
        params: { trip_id: tripId },
      });
      return {
        rules: (response?.data || []) as RecurringRule[],
        total: response?.total || 0,
      };
    },
    enabled: !!tripId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/recurring-availability/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-availability'] });
      showToast(__('Recurring rule deleted successfully', 'Recurring rule deleted successfully'), 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete rule', 'Failed to delete rule'), 'error');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'active' | 'inactive' }) => {
      return await apiClient.put(`/recurring-availability/${id}`, { 
        trip_id: tripId,
        status 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-availability'] });
      showToast(__('Rule status updated', 'Rule status updated'), 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to update status', 'Failed to update status'), 'error');
    },
  });

  // Preview query
  const { data: previewData } = useQuery({
    queryKey: ['recurring-preview', previewRuleId],
    queryFn: async () => {
      if (!previewRuleId) return null;
      const response = await apiClient.get(`/recurring-availability/${previewRuleId}`);
      return response?.preview;
    },
    enabled: !!previewRuleId,
  });

  // Format rule pattern for display
  const formatRulePattern = (rule: RecurringRule): string => {
    switch (rule.rule_type) {
      case 'weekly':
        const days = (rule.days_of_week_array || [])
          .map(d => dayNames.find(dn => dn.value === d)?.label.slice(0, 3))
          .filter(Boolean)
          .join(', ');
        return `Every ${days}`;
      case 'monthly':
        const weekPos = weekPositions.find(w => w.value === rule.week_of_month)?.label || '';
        const dayName = dayNames.find(d => d.value === rule.day_of_week)?.label || '';
        return `${weekPos} ${dayName} of each month`;
      case 'interval':
        return `Every ${rule.interval_days} days`;
      default:
        return 'Unknown pattern';
    }
  };

  // Format date range
  const formatDateRange = (startDate: string, endDate?: string): string => {
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!endDate) return `From ${start} (ongoing)`;
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  // Format time
  const formatTime = (timeString?: string): string => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const rules = rulesData?.rules || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {__('Recurring Rules', 'Recurring Rules')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {__('Automatically generate availability dates based on patterns', 'Automatically generate availability dates based on patterns')}
          </p>
        </div>
        <Button onClick={onAddRule}>
          <Plus className="w-4 h-4 mr-2" />
          {__('Add Recurring Rule', 'Add Recurring Rule')}
        </Button>
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="animate-pulse">
                  <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                  <div className="flex gap-4">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {__('No recurring rules set up yet', 'No recurring rules set up yet')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              {__('Create recurring patterns to automatically generate availability dates', 'Create recurring patterns to automatically generate availability dates')}
            </p>
            <Button onClick={onAddRule}>
              <Plus className="w-4 h-4 mr-2" />
              {__('Create First Rule', 'Create First Rule')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={rule.status === 'inactive' ? 'opacity-60' : ''}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Rule Name & Pattern */}
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {rule.name || formatRulePattern(rule)}
                      </h4>
                      <Badge variant={rule.status === 'active' ? 'success' : 'outline'}>
                        {rule.status === 'active' ? __('Active', 'Active') : __('Inactive', 'Inactive')}
                      </Badge>
                      {rule.generated_count !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {rule.generated_count} {__('dates', 'dates')}
                        </Badge>
                      )}
                    </div>

                    {/* Pattern Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <RefreshCw className="w-4 h-4 inline mr-1" />
                      {formatRulePattern(rule)}
                    </p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateRange(rule.start_date, rule.end_date)}</span>
                      </div>
                      {rule.departure_time && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(rule.departure_time)}</span>
                          {rule.arrival_time && <span>- {formatTime(rule.arrival_time)}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{rule.seats_total} {__('seats', 'seats')}</span>
                      </div>
                      {rule.sale_price && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <DollarSign className="w-4 h-4" />
                          <span>${rule.sale_price}</span>
                          {rule.original_price && rule.original_price > rule.sale_price && (
                            <span className="line-through text-gray-400">${rule.original_price}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Excluded Dates */}
                    {rule.excluded_dates && rule.excluded_dates.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <Ban className="w-4 h-4 text-orange-500" />
                        <span className="text-xs text-orange-600 dark:text-orange-400">
                          {rule.excluded_dates.length} {__('excluded dates', 'excluded dates')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreviewRuleId(previewRuleId === rule.id ? null : rule.id)}
                      title={__('Preview generated dates', 'Preview generated dates')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleStatusMutation.mutate({
                        id: rule.id,
                        status: rule.status === 'active' ? 'inactive' : 'active'
                      })}
                      title={rule.status === 'active' ? __('Deactivate', 'Deactivate') : __('Activate', 'Activate')}
                    >
                      {rule.status === 'active' ? (
                        <X className="w-4 h-4 text-orange-500" />
                      ) : (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditRule(rule.id)}
                      title={__('Edit', 'Edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(__('Are you sure you want to delete this rule?', 'Are you sure you want to delete this rule?'))) {
                          deleteMutation.mutate(rule.id);
                        }
                      }}
                      title={__('Delete', 'Delete')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Preview Panel */}
                {previewRuleId === rule.id && previewData && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {__('Generated Dates Preview', 'Generated Dates Preview')} ({previewData.total} {__('total', 'total')})
                      </h5>
                      {previewData.excluded_count > 0 && (
                        <span className="text-xs text-orange-600 dark:text-orange-400">
                          {previewData.excluded_count} {__('excluded', 'excluded')}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {previewData.dates.slice(0, 12).map((date: any, index: number) => (
                        <div
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded"
                        >
                          {new Date(date.departure_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      ))}
                      {previewData.total > 12 && (
                        <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          +{previewData.total - 12} {__('more', 'more')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Box */}
      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                {__('How Recurring Rules Work', 'How Recurring Rules Work')}
              </h5>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• {__('Dates are generated automatically based on your patterns', 'Dates are generated automatically based on your patterns')}</li>
                <li>• {__('Specific dates (added manually) take priority over generated dates', 'Specific dates (added manually) take priority over generated dates')}</li>
                <li>• {__('Use excluded dates to skip holidays or special occasions', 'Use excluded dates to skip holidays or special occasions')}</li>
                <li>• {__('Bookings for generated dates create specific availability entries', 'Bookings for generated dates create specific availability entries')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecurringRules;

