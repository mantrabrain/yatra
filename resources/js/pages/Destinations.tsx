/**
 * Destinations Page
 * Clean, minimal SaaS-style destinations management page
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, Edit, Trash2 } from 'lucide-react';
import { Pagination, SearchFilterToolbar, BulkActionToolbar, Table as SharedTable } from '../components/shared';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { IconSelector } from '../components/ui/icon-selector';
import type { IconPickerValue } from '../components/ui/icon-picker';

interface Destination {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  icon?: IconPickerValue | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  created_by_name?: string;
  updated_by_name?: string;
}

const Destinations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('yatra_destinations_visible_columns');
    return saved ? JSON.parse(saved) : {
      name: true,
      description: true,
      status: true,
      created_at: false,
      updated_at: false,
      created_by_name: false,
      updated_by_name: false,
    };
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; destination: Destination | null }>({
    isOpen: false,
    destination: null,
  });
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-columns-trigger]') && !target.closest('[data-columns-content]')) {
        setShowColumnsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Fetch destinations from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['destinations', queryParams],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/destinations', { params: queryParams });
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load destinations', 'Failed to load destinations'), 'error');
        throw error;
      }
    },
    enabled: can('yatra_view_trips'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return await apiClient.delete(`/destinations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      showToast(__('Destination deleted successfully', 'Destination deleted successfully'), 'success');
      setDeleteConfirm({ isOpen: false, destination: null });
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete destination', 'Failed to delete destination'), 'error');
    },
  });

  const destinations = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const handleEdit = (destination: Destination) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=destinations&action=edit&id=${destination.id}`;
  };

  const handleDelete = (destination: Destination) => {
    setDeleteConfirm({ isOpen: true, destination });
  };

  const confirmDelete = () => {
    if (deleteConfirm.destination) {
      deleteMutation.mutate(deleteConfirm.destination.id);
    }
  };

  const handleCreateDestination = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=destinations&action=create`;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('name');
    setSortOrder('asc');
    setPage(1);
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

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey as keyof typeof visibleColumns]
    };
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem('yatra_destinations_visible_columns', JSON.stringify(newVisibleColumns));
  };

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = {
      all: total,
      publish: 0,
      draft: 0,
      trash: 0,
    };
    return counts;
  }, [total]);

  // Bulk actions mutation
  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: (string | number)[] }) => {
      return await apiClient.post('/destinations/bulk', { action, ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      showToast(__('Bulk action completed successfully', 'Bulk action completed successfully'), 'success');
      setSelectedIds([]);
      setBulkAction('');
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to perform bulk action', 'Failed to perform bulk action'), 'error');
    },
  });

  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(__('Select a bulk action first.', 'Select a bulk action first.'), 'warning');
      return;
    }

    if (selectedIds.length === 0) {
      showToast(__('Select at least one destination.', 'Select at least one destination.'), 'warning');
      return;
    }

    // Execute bulk action (confirmation is now handled in BulkActionToolbar)
    bulkMutation.mutate({ action: bulkAction, ids: selectedIds });
  };

  const viewFilters = [
    { key: 'all', label: __('All', 'All'), count: statusCounts.all ?? 0 },
    { key: 'publish', label: __('Published', 'Published'), count: statusCounts.publish ?? 0 },
    { key: 'draft', label: __('Draft', 'Draft'), count: statusCounts.draft ?? 0 },
    { key: 'trash', label: __('Trash', 'Trash'), count: statusCounts.trash ?? 0 },
  ];

  const hasFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc';

  return (
    <div className="space-y-3">
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, destination: null })}
        onConfirm={confirmDelete}
        title={__('Delete Destination', 'Delete Destination')}
        message={deleteConfirm.destination 
          ? __('Are you sure you want to delete "{name}"? This action cannot be undone.', 'Are you sure you want to delete "{name}"? This action cannot be undone.').replace('{name}', deleteConfirm.destination.name)
          : __('Are you sure you want to delete this destination? This action cannot be undone.', 'Are you sure you want to delete this destination? This action cannot be undone.')
        }
        confirmText={__('Delete', 'Delete')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <PageHeader
        title={__('Destinations', 'Destinations')}
        description={__('Manage your travel destinations', 'Manage your travel destinations')}
        actionCapability="yatra_edit_trips"
        actions={
          <Button onClick={handleCreateDestination} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Destination', 'Add New Destination')}
          </Button>
        }
      />

      {/* Filters, Search, and Sorting - Always Visible */}
      <Card>
        <CardContent className="p-3">
          <SearchFilterToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setPage(1);
              setSelectedIds([]);
              setBulkAction('');
            }}
            statusOptions={[
              { value: "all", label: __('All Status', 'All Status') },
              { value: "publish", label: __('Published', 'Published') },
              { value: "draft", label: __('Draft', 'Draft') },
              { value: "trash", label: __('Trash', 'Trash') }
            ]}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            sortOptions={[
              { value: "name", label: __('Name', 'Name') },
              { value: "status", label: __('Status', 'Status') },
              { value: "created_at", label: __('Created At', 'Created At') },
              { value: "updated_at", label: __('Updated At', 'Updated At') }
            ]}
            onResetFilters={handleResetFilters}
            hasFilters={!!hasFilters}
            placeholder={__('Search destinations...', 'Search destinations...')}
          />
        </CardContent>
      </Card>

      <BulkActionToolbar
        selectedIds={selectedIds}
        bulkAction={bulkAction}
        setBulkAction={setBulkAction}
        onApply={handleBulkApply}
        onClearSelection={() => setSelectedIds([])}
        statusFilter={statusFilter}
        setStatusFilter={(value) => {
          setStatusFilter(value);
          setPage(1);
          setSelectedIds([]);
          setBulkAction('');
        }}
        statusOptions={viewFilters}
        showColumnsDropdown={showColumnsDropdown}
        setShowColumnsDropdown={setShowColumnsDropdown}
        columnOptions={[
          { key: 'name', label: __('Destination', 'Destination'), visible: visibleColumns.name },
          { key: 'description', label: __('Description', 'Description'), visible: visibleColumns.description },
          { key: 'status', label: __('Status', 'Status'), visible: visibleColumns.status },
          { key: 'created_at', label: __('Created Date', 'Created Date'), visible: visibleColumns.created_at },
          { key: 'updated_at', label: __('Updated Date', 'Updated Date'), visible: visibleColumns.updated_at },
          { key: 'created_by_name', label: __('Created By', 'Created By'), visible: visibleColumns.created_by_name },
          { key: 'updated_by_name', label: __('Updated By', 'Updated By'), visible: visibleColumns.updated_by_name }
        ]}
        onToggleColumn={toggleColumn}
        bulkMutationPending={bulkMutation.isPending}
        totalItems={destinations.length}
        bulkActionOptions={(() => {
          const options = [];
          switch (statusFilter) {
            case 'publish':
              options.push({ value: 'trash', label: __('Move to Trash', 'Move to Trash') });
              options.push({ value: 'draft', label: __('Make Draft', 'Make Draft') });
              break;
            case 'draft':
              options.push({ value: 'publish', label: __('Make Published', 'Make Published') });
              options.push({ value: 'trash', label: __('Move to Trash', 'Move to Trash') });
              break;
            case 'trash':
              options.push({ value: 'publish', label: __('Make Published', 'Make Published') });
              options.push({ value: 'draft', label: __('Make Draft', 'Make Draft') });
              options.push({ value: 'delete', label: __('Delete Permanently', 'Delete Permanently') });
              break;
            case 'all':
            default:
              options.push({ value: 'publish', label: __('Make Published', 'Make Published') });
              options.push({ value: 'draft', label: __('Make Draft', 'Make Draft') });
              options.push({ value: 'trash', label: __('Move to Trash', 'Move to Trash') });
              break;
          }
          return options;
        })()}
      />

      <ConditionalRender capability="yatra_view_trips">
        {/* Table */}
        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              {__('Error loading destinations', 'Error loading destinations')}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="overflow-visible">
              <CardContent className="p-0 overflow-visible">
                <SharedTable
                  data={destinations}
                  columns={[
                    {
                      key: 'name',
                      label: __('Destination', 'Destination'),
                      sortable: true,
                      visible: visibleColumns.name,
                      render: (destination: Destination) => (
                        <div className="flex items-center gap-3">
                          {/* Icon/Image */}
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            {destination.icon ? (
                              destination.icon.type === 'image' ? (
                                <img 
                                  src={destination.icon.value} 
                                  alt={destination.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <IconSelector 
                                  iconName={destination.icon.value} 
                                  className="w-5 h-5 text-blue-600 dark:text-blue-400" 
                                />
                              )
                            ) : (
                              <div className="w-5 h-5 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-semibold">
                                {destination.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          {/* Text */}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {destination.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {destination.slug}
                            </div>
                          </div>
                        </div>
                      )
                    },
                    {
                      key: 'description',
                      label: __('Description', 'Description'),
                      visible: visibleColumns.description,
                      render: (destination: Destination) => (
                        <span className={destination.status === 'trash' || statusFilter === 'trash' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}>
                          {destination.description || __('No description', 'No description')}
                        </span>
                      )
                    },
                    {
                      key: 'status',
                      label: __('Status', 'Status'),
                      sortable: true,
                      visible: visibleColumns.status,
                      render: (destination: Destination) => (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          destination.status === 'trash' || statusFilter === 'trash'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : destination.status === 'publish'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {destination.status === 'trash' || statusFilter === 'trash'
                            ? __('Trash', 'Trash')
                            : destination.status === 'publish'
                              ? __('Published', 'Published')
                              : __('Draft', 'Draft')
                          }
                        </span>
                      )
                    },
                    {
                      key: 'created_at',
                      label: __('Created Date', 'Created Date'),
                      sortable: true,
                      visible: visibleColumns.created_at,
                      render: (destination: Destination) => (
                        <span className={destination.status === 'trash' || statusFilter === 'trash' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}>
                          {new Date(destination.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )
                    },
                    {
                      key: 'updated_at',
                      label: __('Updated Date', 'Updated Date'),
                      sortable: true,
                      visible: visibleColumns.updated_at,
                      render: (destination: Destination) => (
                        <span className={destination.status === 'trash' || statusFilter === 'trash' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}>
                          {new Date(destination.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )
                    },
                    {
                      key: 'created_by_name',
                      label: __('Created By', 'Created By'),
                      visible: visibleColumns.created_by_name,
                      render: (destination: Destination) => (
                        <span className={destination.status === 'trash' || statusFilter === 'trash' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}>
                          {destination.created_by_name || __('Unknown', 'Unknown')}
                        </span>
                      )
                    },
                    {
                      key: 'updated_by_name',
                      label: __('Updated By', 'Updated By'),
                      visible: visibleColumns.updated_by_name,
                      render: (destination: Destination) => (
                        <span className={destination.status === 'trash' || statusFilter === 'trash' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}>
                          {destination.updated_by_name || __('Unknown', 'Unknown')}
                        </span>
                      )
                    }
                  ]}
                  actions={[
                    {
                      key: 'edit',
                      label: __('Edit', 'Edit'),
                      icon: <Edit className="w-4 h-4" />,
                      onClick: handleEdit,
                      condition: () => can('yatra_edit_trips'),
                    },
                    {
                      key: 'restore',
                      label: __('Restore', 'Restore'),
                      icon: <RotateCcw className="w-4 h-4" />,
                      onClick: (destination: Destination) => {
                        // Handle restore action
                        bulkMutation.mutate({ action: 'restore', ids: [destination.id] });
                      },
                      condition: (destination: Destination) => (destination.status === 'trash' || statusFilter === 'trash') && can('yatra_edit_trips'),
                    },
                    {
                      key: 'trash',
                      label: __('Move to Trash', 'Move to Trash'),
                      icon: <Trash2 className="w-4 h-4" />,
                      onClick: (destination: Destination) => {
                        bulkMutation.mutate({ action: 'trash', ids: [destination.id] });
                      },
                      condition: (destination: Destination) => destination.status !== 'trash' && statusFilter !== 'trash' && can('yatra_edit_trips'),
                    },
                    {
                      key: 'delete',
                      label: __('Delete Permanently', 'Delete Permanently'),
                      icon: <Trash2 className="w-4 h-4" />,
                      onClick: handleDelete,
                      condition: (destination: Destination) => (destination.status === 'trash' || statusFilter === 'trash') && can('yatra_delete_trips'),
                      variant: 'destructive',
                    }
                  ]}
                  isLoading={isLoading}
                  isError={!!error}
                  errorText={__('Error loading destinations', 'Error loading destinations')}
                  emptyText={__('No destinations found', 'No destinations found')}
                  emptyDescription={hasFilters 
                    ? __('Try adjusting your filters to see more results.', 'Try adjusting your filters to see more results.')
                    : __('Get started by creating your first destination.', 'Get started by creating your first destination.')
                  }
                  onCreateClick={can('yatra_edit_trips') ? handleCreateDestination : undefined}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                  selectedItemIds={selectedIds}
                  onSelectItem={(id: string | number, checked: boolean) => {
                    if (checked) {
                      setSelectedIds([...selectedIds, id]);
                    } else {
                      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
                    }
                  }}
                  onSelectAll={(checked: boolean) => {
                    if (checked) {
                      setSelectedIds(destinations.map((d: Destination) => d.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  isAllSelected={destinations.length > 0 && selectedIds.length === destinations.length}
                  getItemId={(destination: Destination) => destination.id}
                  getItemStatus={(destination: Destination) => destination.status}
                  statusFilter={statusFilter}
                  skeletonRows={5}
                />
              </CardContent>
            </Card>

            {/* Pagination - Always Visible */}
            {total > 0 && (
              <Card>
                <CardContent className="p-3">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={total}
                    itemsPerPage={10}
                    onPageChange={setPage}
                    itemName={__('destinations', 'destinations')}
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </ConditionalRender>
    </div>
  );
};

export default Destinations;
