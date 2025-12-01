/**
 * Recurring Rules Page
 * Manage recurring rules for trip departures
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Calendar, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';
import { __ } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { apiClient } from '../lib/api';
import { useToast } from '../components/ui/toast';

// Format date helper
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '--';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

interface RecurringRule {
  id: number;
  trip_id: number;
  recurrence_type: 'daily' | 'weekly' | 'monthly' | 'custom_days';
  weekdays: number[];
  start_date?: string;
  end_date?: string;
  max_capacity: number;
  base_price?: number;
  is_active: boolean;
  created_at: string;
}


const RecurringRulesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // Get trip_id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get('trip_id') ? parseInt(urlParams.get('trip_id')!) : null;

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

  // Fetch recurring rules
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['recurring-rules', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const response = await apiClient.get(`/trips/${tripId}/recurring-rules`);
      return response?.data || [];
    },
    enabled: !!tripId,
  });

  // Delete rule mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!tripId) return;
      await apiClient.delete(`/trips/${tripId}/recurring-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules', tripId] });
      showToast(__('Recurring rule deleted successfully', 'Recurring rule deleted successfully'), 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete rule', 'Failed to delete rule'), 'error');
    },
  });

  const handleDelete = (id: number) => {
    if (!confirm(__('Are you sure you want to delete this recurring rule?', 'Are you sure you want to delete this recurring rule?'))) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const handlePreview = async (ruleId: number) => {
    try {
      const response = await apiClient.get(`/trips/${tripId}/recurring-rules/${ruleId}/preview`, {
        params: { count: 10 },
      });
      const dates = response?.data || [];
      
      if (dates.length === 0) {
        showToast(__('No dates generated for this rule', 'No dates generated for this rule'), 'info');
        return;
      }

      const datesList = dates.map((d: any) => formatDate(d.date)).join(', ');
      alert(__('Next 10 generated dates:', 'Next 10 generated dates:') + '\n\n' + datesList);
    } catch (error: any) {
      showToast(error?.message || __('Failed to preview dates', 'Failed to preview dates'), 'error');
    }
  };

  const navigateToAdd = () => {
    if (!tripId) return;
    window.location.href = `?page=yatra&subpage=trips&tab=departures&action=create-rule&trip_id=${tripId}`;
  };

  const navigateToEdit = (id: number) => {
    if (!tripId) return;
    window.location.href = `?page=yatra&subpage=trips&tab=departures&action=edit-rule&id=${id}&trip_id=${tripId}`;
  };

  const handleBack = () => {
    window.location.href = `?page=yatra&subpage=trips&tab=departures${tripId ? `&trip_id=${tripId}` : ''}`;
  };

  const getRecurrenceTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      daily: __('Daily', 'Daily'),
      weekly: __('Weekly', 'Weekly'),
      monthly: __('Monthly', 'Monthly'),
      custom_days: __('Custom Days', 'Custom Days'),
    };
    return labels[type] || type;
  };

  const getWeekdaysLabel = (weekdays: number[]): string => {
    if (!weekdays || weekdays.length === 0) return '--';
    const dayNames = [__('Sun', 'Sun'), __('Mon', 'Mon'), __('Tue', 'Tue'), __('Wed', 'Wed'), __('Thu', 'Thu'), __('Fri', 'Fri'), __('Sat', 'Sat')];
    return weekdays.map(d => dayNames[d]).join(', ');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={__('Recurring Rules', 'Recurring Rules')}
        description={tripData ? `${__('Recurring departure rules for', 'Recurring departure rules for')}: ${tripData.title}` : __('Manage recurring departure rules', 'Manage recurring departure rules')}
        actions={
          <div className="flex gap-2">
            {tripId && (
              <Button onClick={navigateToAdd} variant="default">
                <Plus className="w-4 h-4 mr-2" />
                {__('Add Rule', 'Add Rule')}
              </Button>
            )}
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {__('Back', 'Back')}
            </Button>
          </div>
        }
      />

      {!tripId ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{__('Trip ID is required', 'Trip ID is required')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">{__('Loading...', 'Loading...')}</div>
            ) : !rulesData?.length ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{__('No recurring rules found', 'No recurring rules found')}</p>
                <Button onClick={navigateToAdd} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  {__('Add First Rule', 'Add First Rule')}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{__('Type', 'Type')}</TableHead>
                    <TableHead>{__('Pattern', 'Pattern')}</TableHead>
                    <TableHead>{__('Date Range', 'Date Range')}</TableHead>
                    <TableHead>{__('Capacity', 'Capacity')}</TableHead>
                    <TableHead>{__('Base Price', 'Base Price')}</TableHead>
                    <TableHead>{__('Status', 'Status')}</TableHead>
                    <TableHead>{__('Actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rulesData.map((rule: RecurringRule) => (
                    <TableRow key={rule.id}>
                      <TableCell>{getRecurrenceTypeLabel(rule.recurrence_type)}</TableCell>
                      <TableCell>
                        {rule.recurrence_type === 'weekly' || rule.recurrence_type === 'custom_days' 
                          ? getWeekdaysLabel(rule.weekdays)
                          : '--'
                        }
                      </TableCell>
                      <TableCell>
                        {formatDate(rule.start_date)} - {formatDate(rule.end_date)}
                      </TableCell>
                      <TableCell>{rule.max_capacity}</TableCell>
                      <TableCell>{rule.base_price ? `$${rule.base_price.toFixed(2)}` : '--'}</TableCell>
                      <TableCell>
                        {rule.is_active ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            {__('Active', 'Active')}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                            {__('Inactive', 'Inactive')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(rule.id)}
                            title={__('Preview dates', 'Preview dates')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateToEdit(rule.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rule.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecurringRulesPage;

