/**
 * Activities Page
 * Clean, minimal SaaS-style activities management page
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, MoreVertical, Columns } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ConditionalRender } from '../components/ui/conditional-render';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { Edit, Trash2 } from 'lucide-react';
import { IconSelector } from '../components/ui/icon-selector';
import type { IconPickerValue } from '../components/ui/icon-picker';

interface Activity {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: IconPickerValue | null;
  status: string;
  trips_count?: number;
  created_at: string;
  updated_at: string;
  created_by: number; // user_id
  updated_by: number; // user_id
  created_by_name?: string; // Optional: user name from API
  updated_by_name?: string; // Optional: user name from API
}

const Activities: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [permanentDeleteConfirm, setPermanentDeleteConfirm] = useState<{ isOpen: boolean; activity: Activity | null }>({
    isOpen: false,
    activity: null,
  });
  const [bulkActionConfirm, setBulkActionConfirm] = useState<{ isOpen: boolean; action: string; count: number }>({
    isOpen: false,
    action: '',
    count: 0,
  });
  const [individualActionConfirm, setIndividualActionConfirm] = useState<{ isOpen: boolean; action: string; activity: Activity | null }>({
    isOpen: false,
    action: '',
    activity: null,
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  
  // Column visibility state with localStorage
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('yatra-activities-columns');
    return saved ? JSON.parse(saved) : {
      description: true,
      status: true,
      trips: true,
      date: true,
      author: true,
    };
  });

  const queryClient = useQueryClient();
  const { can, isPro } = usePermissions();
  const { showToast } = useToast();

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem('yatra-activities-columns', JSON.stringify(newVisibleColumns));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking on dropdown button or dropdown content
      if (target.closest('[data-dropdown-trigger]') || target.closest('[data-dropdown-content]') || 
          target.closest('[data-columns-trigger]') || target.closest('[data-columns-content]')) {
        return;
      }
      setOpenDropdown(null);
      setShowColumnsDropdown(false);
    };
    
    if (openDropdown !== null || showColumnsDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown, showColumnsDropdown]);

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: 10,
      orderby: sortBy,
      order: sortOrder,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    return params;
  }, [searchTerm, statusFilter, sortBy, sortOrder, page]);

  // Fetch activities from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['activities', queryParams],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/activities', { params: queryParams });
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load activities', 'Failed to load activities'), 'error');
        throw error;
      }
    },
    enabled: can('yatra_view_trips'),
  });
  // Status counts for WP-style views
  const { data: statsData } = useQuery({
    queryKey: ['activities', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get('/activities/stats');
      console.log('Stats API Response:', response);
      return response;
    },
    enabled: can('yatra_view_trips'),
  });


  const activities = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const statusCounts = statsData?.data || {
    all: 0,
    publish: 0,
    draft: 0,
    trash: 0,
  };

  console.log('Status Counts:', statusCounts);

  // Bulk actions mutation
  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: number[] }) => {
      return await apiClient.post('/activities/bulk', { action, ids });
    },
    onSuccess: (response: any) => {
      const message = response?.message || __('Bulk action completed.', 'Bulk action completed.');
      showToast(message, 'success');
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities', 'stats'] });
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to process bulk action', 'Failed to process bulk action'), 'error');
    },
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return __('N/A', 'N/A');
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'publish': {
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800',
        label: __('Published', 'Published'),
      },
      'draft': {
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
        label: __('Draft', 'Draft'),
      },
      'trash': {
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800',
        label: __('Trash', 'Trash'),
      },
    };

    const statusInfo = statusMap[status] || {
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600',
      label: status,
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const formatUser = (userId: number, userName?: string) => {
    if (userName) {
      return userName;
    }
    return `User #${userId}`;
  };

  const renderIcon = (icon: IconPickerValue | null | undefined) => {
    if (!icon) {
      return (
        <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
        </div>
      );
    }

    if (icon.type === 'image') {
      return (
        <img
          src={icon.value}
          alt=""
          className="w-8 h-8 rounded object-cover"
          onError={(e) => {
            // Fallback if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.innerHTML = '<div class="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><span class="text-xs text-gray-400 dark:text-gray-500">—</span></div>';
            }
          }}
        />
      );
    }

    // Icon type
    return (
      <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <IconSelector iconName={icon.value} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </div>
    );
  };

  const handleEdit = (activity: Activity) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=activities&action=edit&id=${activity.id}`;
  };

  const handleDelete = (activity: Activity) => {
    // Show confirmation dialog for move to trash
    setIndividualActionConfirm({
      isOpen: true,
      action: 'trash',
      activity: activity
    });
  };

  const handleRestore = (activity: Activity) => {
    // Show confirmation dialog for restore
    setIndividualActionConfirm({
      isOpen: true,
      action: 'restore',
      activity: activity
    });
  };

  const handlePermanentDelete = (activity: Activity) => {
    setPermanentDeleteConfirm({ isOpen: true, activity });
  };

  const confirmPermanentDelete = () => {
    if (permanentDeleteConfirm.activity) {
      bulkMutation.mutate({ action: 'delete', ids: [permanentDeleteConfirm.activity.id] });
      setPermanentDeleteConfirm({ isOpen: false, activity: null });
    }
  };

  const confirmIndividualAction = () => {
    if (individualActionConfirm.activity) {
      const action = individualActionConfirm.action === 'restore' ? 'restore' : 'trash';
      bulkMutation.mutate({ action, ids: [individualActionConfirm.activity.id] });
      setIndividualActionConfirm({ isOpen: false, action: '', activity: null });
    }
  };

  const handleCreateActivity = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=activities&action=create`;
  };

  // Keep selection in sync with current page data
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => activities.some((activity: Activity) => activity.id === id))
    );
  }, [activities]);

  const isAllSelected = activities.length > 0 && selectedIds.length === activities.length;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(activities.map((activity: Activity) => activity.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectItem = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return [...new Set([...prev, id])];
      }
      return prev.filter((itemId) => itemId !== id);
    });
  };

  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(__('Select a bulk action first.', 'Select a bulk action first.'), 'warning');
      return;
    }

    if (selectedIds.length === 0) {
      showToast(__('Select at least one activity.', 'Select at least one activity.'), 'warning');
      return;
    }

    // Show confirmation dialog
    setBulkActionConfirm({
      isOpen: true,
      action: bulkAction,
      count: selectedIds.length
    });
  };

  const confirmBulkAction = () => {
    bulkMutation.mutate({ action: bulkActionConfirm.action, ids: selectedIds });
    setBulkActionConfirm({ isOpen: false, action: '', count: 0 });
    setBulkAction('');
  };

  const viewFilters = [
    { key: 'all', label: __('All', 'All'), count: statusCounts.all ?? 0 },
    { key: 'publish', label: __('Published', 'Published'), count: statusCounts.publish ?? 0 },
    { key: 'draft', label: __('Draft', 'Draft'), count: statusCounts.draft ?? 0 },
    { key: 'trash', label: __('Trash', 'Trash'), count: statusCounts.trash ?? 0 },
  ];

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('name');
    setSortOrder('asc');
    setPage(1);
    setSelectedIds([]);
    setBulkAction('');
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-gray-600 dark:text-gray-300" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1 text-gray-600 dark:text-gray-300" />;
  };

  const hasFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc';

  return (
    <div className="space-y-3">
      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={permanentDeleteConfirm.isOpen}
        onClose={() => setPermanentDeleteConfirm({ isOpen: false, activity: null })}
        onConfirm={confirmPermanentDelete}
        title={__('Delete Activity Permanently', 'Delete Activity Permanently')}
        message={permanentDeleteConfirm.activity 
          ? __('Are you sure you want to permanently delete "{name}"? This action cannot be undone.', 'Are you sure you want to permanently delete "{name}"? This action cannot be undone.').replace('{name}', permanentDeleteConfirm.activity.name)
          : __('Are you sure you want to permanently delete this activity? This action cannot be undone.', 'Are you sure you want to permanently delete this activity? This action cannot be undone.')
        }
        confirmText={__('Delete Permanently', 'Delete Permanently')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={bulkMutation.isPending}
      />

      {/* Bulk Action Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={bulkActionConfirm.isOpen}
        onClose={() => setBulkActionConfirm({ isOpen: false, action: '', count: 0 })}
        onConfirm={confirmBulkAction}
        title={(() => {
          switch (bulkActionConfirm.action) {
            case 'trash':
              return __('Move to Trash', 'Move to Trash');
            case 'publish':
              return __('Make Published', 'Make Published');
            case 'draft':
              return __('Make Draft', 'Make Draft');
            case 'delete':
              return __('Delete Permanently', 'Delete Permanently');
            default:
              return __('Confirm Action', 'Confirm Action');
          }
        })()}
        message={(() => {
          const count = bulkActionConfirm.count;
          switch (bulkActionConfirm.action) {
            case 'trash':
              return count === 1 
                ? __('Are you sure you want to move this activity to trash?', 'Are you sure you want to move this activity to trash?')
                : __('Are you sure you want to move {count} activities to trash?', 'Are you sure you want to move {count} activities to trash?').replace('{count}', count.toString());
            case 'publish':
              return count === 1 
                ? __('Are you sure you want to publish this activity?', 'Are you sure you want to publish this activity?')
                : __('Are you sure you want to publish {count} activities?', 'Are you sure you want to publish {count} activities?').replace('{count}', count.toString());
            case 'draft':
              return count === 1 
                ? __('Are you sure you want to make this activity draft?', 'Are you sure you want to make this activity draft?')
                : __('Are you sure you want to make {count} activities draft?', 'Are you sure you want to make {count} activities draft?').replace('{count}', count.toString());
            case 'delete':
              return count === 1 
                ? __('Are you sure you want to permanently delete this activity? This action cannot be undone.', 'Are you sure you want to permanently delete this activity? This action cannot be undone.')
                : __('Are you sure you want to permanently delete {count} activities? This action cannot be undone.', 'Are you sure you want to permanently delete {count} activities? This action cannot be undone.').replace('{count}', count.toString());
            default:
              return __('Are you sure you want to perform this action?', 'Are you sure you want to perform this action?');
          }
        })()}
        confirmText={(() => {
          switch (bulkActionConfirm.action) {
            case 'trash':
              return __('Move to Trash', 'Move to Trash');
            case 'publish':
              return __('Make Published', 'Make Published');
            case 'draft':
              return __('Make Draft', 'Make Draft');
            case 'delete':
              return __('Delete Permanently', 'Delete Permanently');
            default:
              return __('Confirm', 'Confirm');
          }
        })()}
        cancelText={__('Cancel', 'Cancel')}
        variant={bulkActionConfirm.action === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkMutation.isPending}
      />

      {/* Individual Action Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={individualActionConfirm.isOpen}
        onClose={() => setIndividualActionConfirm({ isOpen: false, action: '', activity: null })}
        onConfirm={confirmIndividualAction}
        title={individualActionConfirm.action === 'trash' ? __('Move to Trash', 'Move to Trash') : __('Restore Activity', 'Restore Activity')}
        message={individualActionConfirm.activity 
          ? (individualActionConfirm.action === 'trash' 
              ? __('Are you sure you want to move "{name}" to trash?', 'Are you sure you want to move "{name}" to trash?').replace('{name}', individualActionConfirm.activity.name)
              : __('Are you sure you want to restore "{name}"?', 'Are you sure you want to restore "{name}"?').replace('{name}', individualActionConfirm.activity.name)
            )
          : (individualActionConfirm.action === 'trash' 
              ? __('Are you sure you want to move this activity to trash?', 'Are you sure you want to move this activity to trash?')
              : __('Are you sure you want to restore this activity?', 'Are you sure you want to restore this activity?')
            )
        }
        confirmText={individualActionConfirm.action === 'trash' ? __('Move to Trash', 'Move to Trash') : __('Restore', 'Restore')}
        cancelText={__('Cancel', 'Cancel')}
        variant="warning"
        isLoading={bulkMutation.isPending}
      />

      <PageHeader
        title={__('Activities', 'Activities')}
        description={__('Manage your travel activities and experiences', 'Manage your travel activities and experiences')}
        actionCapability="yatra_edit_trips"
        actions={
          <Button onClick={handleCreateActivity} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Activity', 'Add New Activity')}
          </Button>
        }
      />


      {/* Filters, Search, and Sorting - Always Visible */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
            {/* Search */}
            <div className="relative min-w-0 w-full lg:flex-[2]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__('Search activities...', 'Search activities...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
                setSelectedIds([]);
                setBulkAction('');
              }}
              className="w-full lg:flex-1"
            >
              <option value="all">{__('All Status', 'All Status')}</option>
              <option value="publish">{__('Published', 'Published')}</option>
              <option value="draft">{__('Draft', 'Draft')}</option>
              <option value="trash">{__('Trash', 'Trash')}</option>
            </Select>

            {/* Sort By */}
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full lg:flex-1"
            >
              <option value="name">{__('Name', 'Name')}</option>
              <option value="status">{__('Status', 'Status')}</option>
              <option value="created_at">{__('Created At', 'Created At')}</option>
              <option value="updated_at">{__('Updated At', 'Updated At')}</option>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-11 px-4 flex items-center gap-1.5 flex-shrink-0"
              title={sortOrder === 'asc' ? __('Ascending', 'Ascending') : __('Descending', 'Descending')}
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
              <span className="text-xs">{sortOrder === 'asc' ? __('Asc', 'Asc') : __('Desc', 'Desc')}</span>
            </Button>

            {/* Reset Button */}
            {hasFilters && (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="h-11 flex items-center gap-2 flex-shrink-0"
              >
                <X className="w-4 h-4" />
                {__('Reset', 'Reset')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_trips">
        {/* Table */}
        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              {__('Error loading activities', 'Error loading activities')}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Bulk actions toolbar - Always above the table */}
            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b space-y-3">
                  {/* Top row: Bulk actions and status tabs */}
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Bulk actions - all in one line */}
                    <div className="flex items-center gap-3 flex-nowrap">
                      <Select
                        value={bulkAction}
                        onChange={(e) => setBulkAction(e.target.value)}
                        className="min-w-[140px]"
                        disabled={activities.length === 0}
                      >
                        <option value="">{__('Bulk actions', 'Bulk actions')}</option>
                        {(() => {
                          switch (statusFilter) {
                            case 'publish':
                              return (
                                <>
                                  <option value="trash">{__('Move to Trash', 'Move to Trash')}</option>
                                  <option value="draft">{__('Make Draft', 'Make Draft')}</option>
                                </>
                              );
                            case 'draft':
                              return (
                                <>
                                  <option value="publish">{__('Make Published', 'Make Published')}</option>
                                  <option value="trash">{__('Move to Trash', 'Move to Trash')}</option>
                                </>
                              );
                            case 'trash':
                              return (
                                <>
                                  <option value="publish">{__('Make Published', 'Make Published')}</option>
                                  <option value="draft">{__('Make Draft', 'Make Draft')}</option>
                                  <option value="delete">{__('Delete Permanently', 'Delete Permanently')}</option>
                                </>
                              );
                            case 'all':
                            default:
                              return (
                                <>
                                  <option value="publish">{__('Make Published', 'Make Published')}</option>
                                  <option value="draft">{__('Make Draft', 'Make Draft')}</option>
                                  <option value="trash">{__('Move to Trash', 'Move to Trash')}</option>
                                </>
                              );
                          }
                        })()}
                      </Select>
                      <Button
                        variant="outline"
                        onClick={handleBulkApply}
                        disabled={bulkMutation.isPending || selectedIds.length === 0}
                        className="h-11 px-4 flex-shrink-0"
                      >
                        {__('Apply', 'Apply')}
                      </Button>
                      
                      {/* Selection info right after Apply button */}
                      {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-200 dark:border-blue-800 whitespace-nowrap">
                          <span className="font-medium text-xs">{`${__('Selected:', 'Selected:')} ${selectedIds.length}`}</span>
                          <button
                            type="button"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                            onClick={() => setSelectedIds([])}
                          >
                            {__('Clear', 'Clear')}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right: Status filter tabs */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {viewFilters.map((filter) => {
                        const isActive = statusFilter === filter.key;
                        return (
                          <button
                            key={filter.key}
                            type="button"
                            className={`px-3 py-2.5 text-sm font-medium rounded border transition-all duration-200 ${
                              isActive
                                ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:border-gray-500'
                            }`}
                            onClick={() => {
                              setStatusFilter(filter.key);
                              setPage(1);
                              setSelectedIds([]);
                              setBulkAction('');
                            }}
                          >
                            <span className="flex items-center gap-2">
                              {filter.label}
                              <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${
                                isActive 
                                  ? 'bg-white text-gray-900' 
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                              }`}>
                                {filter.count ?? 0}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                      
                      {/* Columns visibility toggle */}
                      <div className="relative ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowColumnsDropdown(!showColumnsDropdown);
                          }}
                          className="h-10 px-3 flex items-center gap-2"
                          data-columns-trigger
                        >
                          <Columns className="w-4 h-4" />
                          {__('Columns', 'Columns')}
                        </Button>
                        
                        {/* Columns dropdown */}
                        {showColumnsDropdown && (console.log('Columns dropdown is showing with new styles'),
                          <div 
                            className="absolute right-0 top-11 z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-2"
                            style={{ width: '240px', minWidth: '240px' }}
                            data-columns-content
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                              {__('Show Columns', 'Show Columns')}
                            </div>
                            
                            <div className="py-1">
                              <label className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.description}
                                  onChange={() => toggleColumn('description')}
                                  className="rounded border-gray-300 dark:border-gray-600 h-4 w-4 mr-3 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">{__('Description', 'Description')}</span>
                              </label>
                              
                              <label className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.status}
                                  onChange={() => toggleColumn('status')}
                                  className="rounded border-gray-300 dark:border-gray-600 h-4 w-4 mr-3 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">{__('Status', 'Status')}</span>
                              </label>
                              
                              {isPro && (
                                <label className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={visibleColumns.trips}
                                    onChange={() => toggleColumn('trips')}
                                    className="rounded border-gray-300 dark:border-gray-600 h-4 w-4 mr-3 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">{__('Trips', 'Trips')}</span>
                                </label>
                              )}
                              
                              <label className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.date}
                                  onChange={() => toggleColumn('date')}
                                  className="rounded border-gray-300 dark:border-gray-600 h-4 w-4 mr-3 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">{__('Date', 'Date')}</span>
                              </label>
                              
                              <label className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.author}
                                  onChange={() => toggleColumn('author')}
                                  className="rounded border-gray-300 dark:border-gray-600 h-4 w-4 mr-3 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">{__('Author', 'Author')}</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">{__('Activity', 'Activity')}</TableHead>
                        <TableHead className="w-[200px]">{__('Description', 'Description')}</TableHead>
                        <TableHead className="w-[100px]">{__('Status', 'Status')}</TableHead>
                        {isPro && (
                          <TableHead className="w-[80px]">{__('Trips', 'Trips')}</TableHead>
                        )}
                        <TableHead className="w-[150px]">{__('Date', 'Date')}</TableHead>
                        <TableHead className="w-[150px]">{__('Author', 'Author')}</TableHead>
                        <TableHead className="text-right w-[100px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(5)].map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </TableCell>
                          {isPro && (
                            <TableCell>
                              <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="space-y-1">
                              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : activities.length === 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">{__('Activity', 'Activity')}</TableHead>
                        {visibleColumns.description && (
                          <TableHead className="w-[200px]">{__('Description', 'Description')}</TableHead>
                        )}
                        {visibleColumns.status && (
                          <TableHead className="w-[100px]">{__('Status', 'Status')}</TableHead>
                        )}
                        {isPro && visibleColumns.trips && (
                          <TableHead className="w-[80px]">{__('Trips', 'Trips')}</TableHead>
                        )}
                        {visibleColumns.date && (
                          <TableHead className="w-[150px]">{__('Date', 'Date')}</TableHead>
                        )}
                        {visibleColumns.author && (
                          <TableHead className="w-[150px]">{__('Author', 'Author')}</TableHead>
                        )}
                        <TableHead className="text-right w-[100px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={
                          1 + // Activity column (always visible)
                          (visibleColumns.description ? 1 : 0) +
                          (visibleColumns.status ? 1 : 0) +
                          (isPro && visibleColumns.trips ? 1 : 0) +
                          (visibleColumns.date ? 1 : 0) +
                          (visibleColumns.author ? 1 : 0) +
                          1 // Actions column (always visible)
                        } className="h-64">
                          <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                              <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              {__('No activities found', 'No activities found')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                              {hasFilters 
                                ? __('Try adjusting your filters to see more results.', 'Try adjusting your filters to see more results.')
                                : __('Get started by creating your first activity.', 'Get started by creating your first activity.')
                              }
                            </p>
                            {hasFilters ? (
                              <Button
                                variant="outline"
                                onClick={handleResetFilters}
                                className="flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                {__('Clear Filters', 'Clear Filters')}
                              </Button>
                            ) : (
                              can('yatra_edit_trips') && (
                                <Button onClick={handleCreateActivity} className="flex items-center gap-2">
                                  <Plus className="w-4 h-4" />
                                  {__('Add New Activity', 'Add New Activity')}
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 dark:border-gray-600"
                            checked={isAllSelected}
                            onChange={(e) => toggleSelectAll(e.target.checked)}
                            aria-label={__('Select all activities', 'Select all activities')}
                          />
                        </TableHead>
                        <TableHead className="w-[250px]">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Activity', 'Activity')}
                            {getSortIcon('name')}
                          </button>
                        </TableHead>
                        {visibleColumns.description && (
                          <TableHead className="w-[200px]">{__('Description', 'Description')}</TableHead>
                        )}
                        {visibleColumns.status && (
                          <TableHead className="w-[100px]">
                            <button
                              onClick={() => handleSort('status')}
                              className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                              {__('Status', 'Status')}
                              {getSortIcon('status')}
                            </button>
                          </TableHead>
                        )}
                        {isPro && visibleColumns.trips && (
                          <TableHead className="w-[80px]">{__('Trips', 'Trips')}</TableHead>
                        )}
                        {visibleColumns.date && (
                          <TableHead className="w-[150px]">
                            <button
                              onClick={() => handleSort('created_at')}
                              className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                              {__('Date', 'Date')}
                              {getSortIcon('created_at')}
                            </button>
                          </TableHead>
                        )}
                        {visibleColumns.author && (
                          <TableHead className="w-[150px]">{__('Author', 'Author')}</TableHead>
                        )}
                        <TableHead className="text-right w-[100px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((activity: Activity) => {
                        const isTrash = activity.status === 'trash' || statusFilter === 'trash';
                        return (
                        <TableRow 
                          key={activity.id} 
                          className={isTrash ? 'bg-red-50/30 dark:bg-red-900/10 opacity-75 hover:bg-red-50/50 dark:hover:bg-red-900/20' : ''}
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 dark:border-gray-600"
                              checked={selectedIds.includes(activity.id)}
                              onChange={(e) => toggleSelectItem(activity.id, e.target.checked)}
                              aria-label={__('Select activity', 'Select activity')}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`flex-shrink-0 ${isTrash ? 'opacity-50 grayscale' : ''}`}>
                                {renderIcon(activity.icon)}
                              </div>
                              <div className="min-w-0">
                                <button
                                  onClick={() => handleEdit(activity)}
                                  className={`font-medium truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left ${
                                    isTrash 
                                      ? 'text-gray-500 dark:text-gray-500' 
                                      : 'text-gray-900 dark:text-white'
                                  }`}
                                >
                                  {activity.name}
                                </button>
                                <div className={`text-sm truncate ${
                                  isTrash 
                                    ? 'text-gray-400 dark:text-gray-600' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {activity.slug}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          {visibleColumns.description && (
                            <TableCell className={`text-sm ${
                              isTrash 
                                ? 'text-gray-400 dark:text-gray-600' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              <div className="line-clamp-2">
                                {activity.description || __('No description', 'No description')}
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.status && (
                            <TableCell>
                              {getStatusBadge(activity.status)}
                            </TableCell>
                          )}
                          {isPro && visibleColumns.trips && (
                            <TableCell className={isTrash 
                              ? 'text-gray-400 dark:text-gray-600' 
                              : 'text-gray-600 dark:text-gray-400'
                            }>
                              <span>
                                {activity.trips_count || 0}
                              </span>
                            </TableCell>
                          )}
                          {visibleColumns.date && (
                            <TableCell className={`text-sm ${
                              isTrash 
                                ? 'text-gray-400 dark:text-gray-600' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <div>
                                <div>{formatDate(activity.created_at)}</div>
                                <div className={`text-xs mt-0.5 ${
                                  isTrash 
                                    ? 'text-gray-400 dark:text-gray-600' 
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {__('Updated', 'Updated')}: {formatDate(activity.updated_at)}
                                </div>
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.author && (
                            <TableCell className={`text-sm ${
                              isTrash 
                                ? 'text-gray-400 dark:text-gray-600' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              <div>
                                <div>{formatUser(activity.created_by, activity.created_by_name)}</div>
                                <div className={`text-xs mt-0.5 ${
                                  isTrash 
                                    ? 'text-gray-400 dark:text-gray-600' 
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {__('Updated by', 'Updated by')}: {formatUser(activity.updated_by, activity.updated_by_name)}
                                </div>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenDropdown(openDropdown === activity.id ? null : activity.id);
                                }}
                                className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label={__('More actions', 'More actions')}
                                data-dropdown-trigger
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                              
                              {/* Dropdown Menu */}
                              {openDropdown === activity.id && (
                                <div 
                                  className="absolute right-0 top-8 z-[9999] min-w-[180px] w-max bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1"
                                  data-dropdown-content
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ConditionalRender capability="yatra_edit_trips">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleEdit(activity);
                                        setOpenDropdown(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      <Edit className="w-4 h-4" />
                                      {__('Edit', 'Edit')}
                                    </button>
                                  </ConditionalRender>
                                  
                                  <ConditionalRender capability="yatra_delete_trips">
                                    {activity.status === 'trash' || statusFilter === 'trash' ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleRestore(activity);
                                            setOpenDropdown(null);
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors cursor-pointer whitespace-nowrap"
                                        >
                                          <RotateCcw className="w-4 h-4" />
                                          {__('Restore', 'Restore')}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handlePermanentDelete(activity);
                                            setOpenDropdown(null);
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors cursor-pointer whitespace-nowrap"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          {__('Delete Permanently', 'Delete Permanently')}
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleDelete(activity);
                                          setOpenDropdown(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors cursor-pointer whitespace-nowrap"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        {__('Move to Trash', 'Move to Trash')}
                                      </button>
                                    )}
                                  </ConditionalRender>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Pagination - Always Visible */}
            {total > 0 && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {__('Showing', 'Showing')} <span className="font-medium text-gray-900 dark:text-white">{(page - 1) * 10 + 1}</span> - <span className="font-medium text-gray-900 dark:text-white">{Math.min(page * 10, total)}</span> {__('of', 'of')} <span className="font-medium text-gray-900 dark:text-white">{total}</span> {__('activities', 'activities')}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Previous Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-8 px-3"
                      >
                        {__('‹', '‹')}
                      </Button>

                      {/* Page Numbers */}
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                        
                        // Adjust start if we're near the end
                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1);
                        }

                        // First page + ellipsis
                        if (startPage > 1) {
                          pages.push(
                            <Button
                              key={1}
                              variant={1 === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(1)}
                              className="h-8 w-8 p-0"
                            >
                              1
                            </Button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span key="ellipsis1" className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                        }

                        // Visible page range
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={i === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(i)}
                              className="h-8 w-8 p-0"
                            >
                              {i}
                            </Button>
                          );
                        }

                        // Ellipsis + last page
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="ellipsis2" className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                          pages.push(
                            <Button
                              key={totalPages}
                              variant={totalPages === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(totalPages)}
                              className="h-8 w-8 p-0"
                            >
                              {totalPages}
                            </Button>
                          );
                        }

                        return pages;
                      })()}

                      {/* Next Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="h-8 px-3"
                      >
                        {__('›', '›')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </ConditionalRender>
    </div>
  );
};

export default Activities;
