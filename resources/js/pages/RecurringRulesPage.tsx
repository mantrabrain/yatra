/**
 * Recurring Rules Page
 * Manage recurring rules for trip departures
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Edit, Trash2, AlertCircle, Search, Copy, Clock, CheckCircle, XCircle } from 'lucide-react';
import { __ } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { apiClient } from '../lib/api-client';
import { useToast } from '../components/ui/toast';
import { Table as SharedTable } from '../components/shared';
import { getErrorContext } from '../lib/errors';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { useNavigate } from '../hooks/useNavigate';


interface RecurringRule {
  id: number;
  trip_id: number;
  name?: string;
  rule_type: 'weekly' | 'monthly' | 'interval';
  days_of_week?: string;
  days_of_week_array?: number[];
  week_of_month?: string;
  day_of_week?: number;
  interval_days?: number;
  start_date: string;
  end_date?: string;
  seats_total: number;
  original_price?: number;
  sale_price?: number;
  pricing_type?: string;
  status: 'active' | 'inactive' | 'paused';
  generated_count?: number;
  created_at: string;
  updated_at?: string;
}


const RecurringRulesPage: React.FC = () => {
  const { navigate } = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // Get trip_id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get('trip_id') ? parseInt(urlParams.get('trip_id')!) : null;
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  
  // Confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; rule: RecurringRule | null }>({ isOpen: false, rule: null });
  const [duplicateConfirm, setDuplicateConfirm] = useState<{ isOpen: boolean; rule: RecurringRule | null }>({ isOpen: false, rule: null });

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
  const { data: rulesResponse, isLoading, error } = useQuery<any>({
    queryKey: ['recurring-availability', tripId, statusFilter, searchTerm, page],
    queryFn: async () => {
      if (!tripId) return { data: [], total: 0 };
      const response = await apiClient.get('/recurring-availability', {
        params: {
          trip_id: tripId,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm || undefined,
          page,
          per_page: 50,
        }
      });
      return {
        data: response?.data || [],
        total: response?.total || 0,
      };
    },
    enabled: !!tripId,
  });
  
  const rulesData = rulesResponse?.data || [];
  const errorContext = getErrorContext(error);
  const apiErrorMessage = (rulesResponse as any)?.error || (rulesResponse as any)?.message;
  const isRulesError = !!error || !!apiErrorMessage;

  // Delete rule mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/recurring-availability/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-availability'] });
      showToast(__('Recurring rule deleted successfully', 'yatra'), 'success');
      setDeleteConfirm({ isOpen: false, rule: null });
      setSelectedIds([]);
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete rule', 'yatra'), 'error');
    },
  });
  
  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => apiClient.delete(`/recurring-availability/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-availability'] });
      showToast(__('Rules deleted successfully', 'yatra'), 'success');
      setSelectedIds([]);
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete rules', 'yatra'), 'error');
    },
  });
  
  // Duplicate rule mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/recurring-availability/${id}/duplicate`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-availability'] });
      showToast(__('Rule duplicated successfully', 'yatra'), 'success');
      setDuplicateConfirm({ isOpen: false, rule: null });
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to duplicate rule', 'yatra'), 'error');
    },
  });

  // Handle bulk actions
  const handleBulkAction = () => {
    if (!bulkAction || selectedIds.length === 0) return;
    
    switch (bulkAction) {
      case 'delete':
        if (confirm(__('Are you sure you want to delete {count} rule(s)?', 'yatra').replace('{count}', selectedIds.length.toString()))) {
          bulkDeleteMutation.mutate(selectedIds);
        }
        break;
    }
    
    setBulkAction('');
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };
  
  // Handle status filter
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  // Format helpers
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getRuleTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      weekly: __('Weekly', 'yatra'),
      monthly: __('Monthly', 'yatra'),
      interval: __('Interval', 'yatra'),
    };
    return labels[type] || type;
  };

  const getWeekdaysLabel = (rule: RecurringRule): string => {
    const weekdays = rule.days_of_week_array || (rule.days_of_week ? rule.days_of_week.split(',').map(Number) : []);
    if (!weekdays || weekdays.length === 0) return '--';
    const dayNames = [__('Sun', 'yatra'), __('Mon', 'yatra'), __('Tue', 'yatra'), __('Wed', 'yatra'), __('Thu', 'yatra'), __('Fri', 'yatra'), __('Sat', 'yatra')];
    return weekdays.map(d => dayNames[d]).join(', ');
  };
  
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      active: {
        label: __('Active', 'yatra'),
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        icon: <CheckCircle className="w-3 h-3" />,
      },
      inactive: {
        label: __('Inactive', 'yatra'),
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        icon: <XCircle className="w-3 h-3" />,
      },
      paused: {
        label: __('Paused', 'yatra'),
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        icon: <Clock className="w-3 h-3" />,
      },
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Define table columns
  const tableColumns = useMemo(() => {
    return [
      {
        key: 'name',
        label: __('Rule Name', 'yatra'),
        render: (rule: RecurringRule) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {rule.name || `Rule #${rule.id}`}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getRuleTypeLabel(rule.rule_type)}
            </span>
          </div>
        ),
      },
      {
        key: 'pattern',
        label: __('Pattern', 'yatra'),
        render: (rule: RecurringRule) => (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {rule.rule_type === 'weekly' ? getWeekdaysLabel(rule) : 
             rule.rule_type === 'interval' ? `Every ${rule.interval_days || 7} days` :
             rule.week_of_month ? `${rule.week_of_month} week` : '--'}
          </div>
        ),
      },
      {
        key: 'date_range',
        label: __('Date Range', 'yatra'),
        render: (rule: RecurringRule) => (
          <div className="flex flex-col text-sm">
            <span className="text-gray-900 dark:text-white">{formatDate(rule.start_date)}</span>
            {rule.end_date && (
              <span className="text-gray-500 dark:text-gray-400">to {formatDate(rule.end_date)}</span>
            )}
          </div>
        ),
      },
      {
        key: 'capacity',
        label: __('Seats', 'yatra'),
        render: (rule: RecurringRule) => (
          <div className="text-center">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {rule.seats_total || 0}
            </span>
          </div>
        ),
      },
      {
        key: 'generated',
        label: __('Generated', 'yatra'),
        render: (rule: RecurringRule) => (
          <div className="text-center">
            <Badge variant="default" className="text-xs">
              {rule.generated_count || 0} {__('dates', 'yatra')}
            </Badge>
          </div>
        ),
      },
      {
        key: 'status',
        label: __('Status', 'yatra'),
        render: (rule: RecurringRule) => getStatusBadge(rule.status),
      },
    ];
  }, [formatDate, getRuleTypeLabel, getWeekdaysLabel, getStatusBadge]);

  const tableActions = [
    {
      key: 'edit',
      label: __('Edit', 'yatra'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (rule: RecurringRule) => navigate({ subpage: 'trips', tab: 'availability', action: 'edit-recurring', id: rule.id.toString(), trip_id: tripId?.toString() }),
    },
    {
      key: 'duplicate',
      label: __('Duplicate', 'yatra'),
      icon: <Copy className="w-4 h-4" />,
      onClick: (rule: RecurringRule) => setDuplicateConfirm({ isOpen: true, rule }),
    },
    {
      key: 'delete',
      label: __('Delete', 'yatra'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (rule: RecurringRule) => setDeleteConfirm({ isOpen: true, rule }),
      variant: 'destructive' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, rule: null })}
        onConfirm={() => {
          if (deleteConfirm.rule) {
            deleteMutation.mutate(deleteConfirm.rule.id);
          }
        }}
        title={__('Delete Recurring Rule', 'yatra')}
        message={deleteConfirm.rule
          ? __('Are you sure you want to delete the rule "{name}"? This action cannot be undone.', 'yatra')
              .replace('{name}', deleteConfirm.rule.name || `Rule #${deleteConfirm.rule.id}`)
          : __('Are you sure you want to delete this rule? This action cannot be undone.', 'yatra')}
        confirmText={__('Delete', 'yatra')}
        cancelText={__('Cancel', 'yatra')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={duplicateConfirm.isOpen}
        onClose={() => setDuplicateConfirm({ isOpen: false, rule: null })}
        onConfirm={() => {
          if (duplicateConfirm.rule) {
            duplicateMutation.mutate(duplicateConfirm.rule.id);
          }
        }}
        title={__('Duplicate Recurring Rule', 'yatra')}
        message={__('This will create a copy of this rule. You can edit it after creation.', 'yatra')}
        confirmText={__('Duplicate', 'yatra')}
        cancelText={__('Cancel', 'yatra')}
        isLoading={duplicateMutation.isPending}
      />

      <PageHeader
        title={__('Recurring Rules', 'yatra')}
        description={tripData ? `${__('Recurring availability rules for', 'yatra')}: ${tripData.title}` : __('Manage recurring availability rules', 'yatra')}
        actions={
          <div className="flex gap-2">
            {tripId && (
              <Button onClick={() => navigate({ subpage: 'trips', tab: 'availability', action: 'create-recurring', trip_id: tripId.toString() })} variant="default">
                <Plus className="w-4 h-4 mr-2" />
                {__('Add Rule', 'yatra')}
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate({ subpage: 'trips', tab: 'availability', trip_id: tripId?.toString() })}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {__('Back', 'yatra')}
            </Button>
          </div>
        }
      />

      {!tripId ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{__('Trip ID is required', 'yatra')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={__('Search rules...', 'yatra')}
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilter(e.target.value)}
                  >
                    <option value="all">{__('All Status', 'yatra')}</option>
                    <option value="active">{__('Active', 'yatra')}</option>
                    <option value="inactive">{__('Inactive', 'yatra')}</option>
                    <option value="paused">{__('Paused', 'yatra')}</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions (hide when error) */}
          {selectedIds.length > 0 && !isRulesError && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedIds.length} {__('selected', 'yatra')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedIds([])}
                    >
                      {__('Clear Selection', 'yatra')}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="w-48"
                    >
                      <option value="">{__('Bulk Actions', 'yatra')}</option>
                      <option value="delete">{__('Delete', 'yatra')}</option>
                    </Select>
                    <Button
                      onClick={handleBulkAction}
                      disabled={!bulkAction}
                      variant="default"
                    >
                      {__('Apply', 'yatra')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card>
            <CardContent className="pt-6">
              <SharedTable
                data={rulesData}
                columns={tableColumns}
                actions={tableActions}
                isLoading={isLoading}
                isError={isRulesError}
                errorText={__('Error loading recurring rules', 'yatra')}
                errorDescription={__(
                  'We couldn’t connect to the recurring rules service. Please refresh or try again shortly.',
                  'We couldn’t connect to the recurring rules service. Please refresh or try again shortly.'
                )}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['recurring-availability'] })}
                errorDetails={errorContext.details || apiErrorMessage}
                errorRequestInfo={errorContext.requestInfo}
                selectedItemIds={selectedIds}
                onSelectItem={(id, checked) => {
                  if (checked) {
                    setSelectedIds([...selectedIds, id.toString()]);
                  } else {
                    setSelectedIds(selectedIds.filter(sid => sid !== id.toString()));
                  }
                }}
                onSelectAll={(checked) => {
                  if (checked) {
                    setSelectedIds(rulesData.map((r: RecurringRule) => r.id.toString()));
                  } else {
                    setSelectedIds([]);
                  }
                }}
                isAllSelected={selectedIds.length === rulesData.length && rulesData.length > 0}
                getItemId={(rule) => rule.id}
                emptyText={__('No recurring rules found', 'yatra')}
                emptyDescription={__('Create your first recurring rule to get started', 'yatra')}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default RecurringRulesPage;

