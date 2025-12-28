/**
 * Difficulty Levels Page
 * Manage trip difficulty levels with ordering
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api-client';
import { getErrorContext } from '../lib/errors';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table } from '../components/shared/Table';
import { Pagination, SearchFilterToolbar, BulkActionToolbar } from '../components/shared';
import { getDefaultBulkStatusOptions } from '../components/shared/bulkStatusOptions';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { Edit, Trash2 } from 'lucide-react';
import { IconSelector } from '../components/ui/icon-selector';
import type { IconPickerValue } from '../components/ui/icon-picker';

interface DifficultyLevel {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: IconPickerValue | null;
  sorting: number;
  status: string;
  trip_count?: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  created_by_name?: string;
  updated_by_name?: string;
}

const DifficultyLevels: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('sorting');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const defaultColumns = {
      sorting: true,
      name: true,
      description: true,
      trips: true,
      status: true,
      created_at: false,
    };
    const saved = localStorage.getItem('yatra_difficulty_levels_columns');
    return saved ? { ...defaultColumns, ...JSON.parse(saved) } : defaultColumns;
  });

  const { can } = usePermissions();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; level: DifficultyLevel | null }>(
    {
      isOpen: false,
      level: null,
    }
  );

  // Define table columns
  const columns = [
    {
      key: 'sorting',
      label: __('Order', 'Order'),
      sortable: true,
      width: '100px',
      visible: visibleColumns.sorting,
      render: (level: DifficultyLevel) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {level.sorting}
        </div>
      ),
    },
    {
      key: 'name',
      label: __('Name', 'Name'),
      sortable: true,
      visible: visibleColumns.name,
      render: (level: DifficultyLevel) => (
        <div className="flex items-center gap-3">
          {renderIcon(level.icon)}
          <div>
            <a
              href={`${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=difficulty-levels&action=edit&id=${level.id}`}
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer"
            >
              {level.name}
            </a>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>{level.slug || '—'}</span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                ({__('ID:', 'ID:')} {level.id})
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: __('Description', 'Description'),
      visible: visibleColumns.description,
      render: (level: DifficultyLevel) => (
        <div className="max-w-xs truncate text-sm text-gray-600 dark:text-gray-400">
          {level.description || '—'}
        </div>
      ),
    },
    {
      key: 'trips',
      label: __('Trips', 'Trips'),
      visible: visibleColumns.trips,
      render: (level: DifficultyLevel) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {typeof level.trip_count === 'number' ? level.trip_count : 0}
        </span>
      ),
    },
    {
      key: 'status',
      label: __('Status', 'Status'),
      sortable: true,
      visible: visibleColumns.status,
      render: (level: DifficultyLevel) => getStatusBadge(level.status),
    },
    {
      key: 'created_at',
      label: __('Created', 'Created'),
      sortable: true,
      visible: visibleColumns.created_at,
      render: (level: DifficultyLevel) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(level.created_at)}
        </div>
      ),
    },
  ];

  // Define table actions
  const actions = [
    {
      key: 'edit',
      label: __('Edit', 'Edit'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (level: DifficultyLevel) => handleEdit(level),
      condition: () => can('yatra_edit_trips'),
    },
    {
      key: 'publish',
      label: __('Make Published', 'Make Published'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (level: DifficultyLevel) => statusMutation.mutate({ id: level.id, status: 'publish' }),
      condition: (level: DifficultyLevel) =>
        can('yatra_edit_trips') && level.status !== 'publish',
    },
    {
      key: 'draft',
      label: __('Make Draft', 'Make Draft'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (level: DifficultyLevel) => statusMutation.mutate({ id: level.id, status: 'draft' }),
      condition: (level: DifficultyLevel) =>
        can('yatra_edit_trips') && level.status !== 'draft',
    },
    {
      key: 'delete',
      label: __('Delete', 'Delete'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (level: DifficultyLevel) =>
        setDeleteConfirm({ isOpen: true, level }),
      variant: 'destructive' as const,
      condition: (level: DifficultyLevel) => can('yatra_edit_trips') && level.status === 'trash',
    },
    {
      key: 'trash',
      label: __('Move to Trash', 'Move to Trash'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (level: DifficultyLevel) => statusMutation.mutate({ id: level.id, status: 'trash' }),
      variant: 'destructive' as const,
      condition: (level: DifficultyLevel) =>
        can('yatra_edit_trips') && level.status !== 'trash',
    },
  ];

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: 20,
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

  // Fetch stable status counts from API (independent of filters)
  const { data: statsData } = useQuery({
    queryKey: ['difficulty-levels-stats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/difficulty-levels/stats');
        return response;
      } catch (error: any) {
        return { all: 0, publish: 0, draft: 0, trash: 0 };
      }
    },
    enabled: can('yatra_view_trips'),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['difficulty-levels', queryParams],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/difficulty-levels', { params: queryParams });
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load difficulty levels', 'Failed to load difficulty levels'), 'error');
        throw error;
      }
    },
    enabled: can('yatra_view_trips'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`/difficulty-levels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['difficulty-levels'] });
      queryClient.invalidateQueries({ queryKey: ['difficulty-levels-stats'] });
      showToast(__('Difficulty level deleted successfully', 'Difficulty level deleted successfully'), 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete difficulty level', 'Failed to delete difficulty level'), 'error');
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const levelResponse = await apiClient.get(`/difficulty-levels/${id}`);
      const level = levelResponse as DifficultyLevel;

      return apiClient.put(`/difficulty-levels/${id}`, {
        name: level.name,
        slug: level.slug,
        description: level.description,
        icon: level.icon,
        sorting: level.sorting,
        status,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['difficulty-levels'] });
      queryClient.invalidateQueries({ queryKey: ['difficulty-levels-stats'] });
      const msgMap: Record<string, string> = {
        trash: __('Difficulty level moved to trash', 'Difficulty level moved to trash'),
        draft: __('Difficulty level marked as draft', 'Difficulty level marked as draft'),
        publish: __('Difficulty level published', 'Difficulty level published'),
      };
      const msg = msgMap[variables.status] || __('Difficulty level updated successfully', 'Difficulty level updated successfully');
      showToast(msg, 'success');
    },
    onError: (error: any, variables) => {
      const msgMapError: Record<string, string> = {
        trash: __('Failed to move difficulty level to trash', 'Failed to move difficulty level to trash'),
        draft: __('Failed to mark difficulty level as draft', 'Failed to mark difficulty level as draft'),
        publish: __('Failed to publish difficulty level', 'Failed to publish difficulty level'),
      };
      const fallback = msgMapError[variables.status] || __('Failed to update difficulty level', 'Failed to update difficulty level');
      showToast(error?.message || fallback, 'error');
    },
  });

  const levels = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);
  const errorContext = getErrorContext(error);

  // Status counts from stats API (stable across filters)
  const statusCounts = useMemo(() => {
    if (statsData) {
      return {
        all: statsData.all ?? 0,
        publish: statsData.publish ?? 0,
        draft: statsData.draft ?? 0,
        trash: statsData.trash ?? 0,
      };
    }

    return {
      all: 0,
      publish: 0,
      draft: 0,
      trash: 0,
    };
  }, [statsData]);

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
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { className: string; label: string }> = {
      publish: { className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', label: __('Publish', 'Publish') },
      draft: { className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400', label: __('Draft', 'Draft') },
      trash: { className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', label: __('Trash', 'Trash') },
    };
    const info = map[status] || map.draft;
    return <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${info.className}`}>{info.label}</span>;
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
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.innerHTML =
                '<div class="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><span class="text-xs text-gray-400 dark:text-gray-500">—</span></div>';
            }
          }}
        />
      );
    }
    return (
      <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <IconSelector iconName={icon.value} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </div>
    );
  };

  const handleEdit = (level: DifficultyLevel) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=difficulty-levels&action=edit&id=${level.id}`;
  };

  const handleCreate = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=difficulty-levels&action=create`;
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
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 w-3.5 h-3.5" />
    ) : (
      <ArrowDown className="ml-1 w-3.5 h-3.5" />
    );
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('sorting');
    setSortOrder('asc');
    setPage(1);
  };

  const hasFilters =
    !!searchTerm || statusFilter !== 'all' || sortBy !== 'sorting' || sortOrder !== 'asc';

  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey as keyof typeof visibleColumns],
    };
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem('yatra_difficulty_levels_columns', JSON.stringify(newVisibleColumns));
  };

  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(
        __('Select a bulk action first.', 'Select a bulk action first.'),
        'warning'
      );
      return;
    }

    if (selectedIds.length === 0) {
      showToast(
        __('Select at least one difficulty level.', 'Select at least one difficulty level.'),
        'warning'
      );
      return;
    }

    const performBulk = async () => {
      try {
        if (bulkAction === 'delete') {
          await Promise.all(
            selectedIds.map((id) => apiClient.delete(`/difficulty-levels/${id}`))
          );
          showToast(
            __('Selected difficulty levels deleted successfully', 'Selected difficulty levels deleted successfully'),
            'success'
          );
        } else if (bulkAction === 'trash' || bulkAction === 'draft' || bulkAction === 'publish') {
          const status =
            bulkAction === 'trash' ? 'trash' : bulkAction === 'draft' ? 'draft' : 'publish';

          await Promise.all(
            selectedIds.map(async (id) => {
              try {
                const levelResponse = await apiClient.get(`/difficulty-levels/${id}`);
                const level = levelResponse;
                if (!level || !level.name) {
                  return;
                }

                await apiClient.put(`/difficulty-levels/${id}`, {
                  name: level.name,
                  slug: level.slug,
                  description: level.description,
                  icon: level.icon,
                  sorting: level.sorting,
                  status,
                });
              } catch {
                // If a single item fails, let the outer catch handle messaging
                throw new Error('bulk_item_failed');
              }
            })
          );
          const msgMap: Record<string, string> = {
            trash: __('Selected difficulty levels moved to trash', 'Selected difficulty levels moved to trash'),
            draft: __('Selected difficulty levels marked as draft', 'Selected difficulty levels marked as draft'),
            publish: __('Selected difficulty levels published', 'Selected difficulty levels published'),
          };
          showToast(msgMap[bulkAction], 'success');
        }

        queryClient.invalidateQueries({ queryKey: ['difficulty-levels'] });
        queryClient.invalidateQueries({ queryKey: ['difficulty-levels-stats'] });
        setSelectedIds([]);
        setBulkAction('');
      } catch (error: any) {
        const msgMapError: Record<string, string> = {
          delete: __('Failed to delete selected difficulty levels', 'Failed to delete selected difficulty levels'),
          trash: __('Failed to move selected difficulty levels to trash', 'Failed to move selected difficulty levels to trash'),
          draft: __('Failed to mark selected difficulty levels as draft', 'Failed to mark selected difficulty levels as draft'),
          publish: __('Failed to publish selected difficulty levels', 'Failed to publish selected difficulty levels'),
        };
        showToast(
          error?.message || msgMapError[bulkAction],
          'error'
        );
      }
    };

    void performBulk();
  };

  return (
    <div className="space-y-3">
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, level: null })}
        onConfirm={() => {
          if (deleteConfirm.level) {
            deleteMutation.mutate(deleteConfirm.level.id);
            setDeleteConfirm({ isOpen: false, level: null });
          }
        }}
        title={__('Delete Difficulty Level', 'Delete Difficulty Level')}
        message={
          deleteConfirm.level
            ? __(
                'Are you sure you want to delete "{name}"? This action cannot be undone.',
                'Are you sure you want to delete "{name}"? This action cannot be undone.'
              ).replace('{name}', deleteConfirm.level.name)
            : __(
                'Are you sure you want to delete this difficulty level? This action cannot be undone.',
                'Are you sure you want to delete this difficulty level? This action cannot be undone.'
              )
        }
        confirmText={__('Delete', 'Delete')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
      <PageHeader
        title={__('Difficulty Levels', 'Difficulty Levels')}
        description={__('Manage trip difficulty levels and their ordering', 'Manage trip difficulty levels and their ordering')}
        actionCapability="yatra_edit_trips"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            {__('Add New', 'Add New')}
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <SearchFilterToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            statusOptions={[
              { value: 'all', label: __('All Status', 'All Status') },
              { value: 'publish', label: __('Published', 'Published') },
              { value: 'draft', label: __('Draft', 'Draft') },
            ]}
            sortBy={sortBy}
            onSortByChange={(value) => {
              setSortBy(value);
              setSortOrder('asc');
              setPage(1);
            }}
            sortOrder={sortOrder}
            onSortOrderChange={(order) => {
              setSortOrder(order);
              setPage(1);
            }}
            sortOptions={[
              { value: 'sorting', label: __('Order', 'Order') },
              { value: 'name', label: __('Name', 'Name') },
              { value: 'created_at', label: __('Created', 'Created') },
            ]}
            onResetFilters={handleResetFilters}
            hasFilters={hasFilters}
            placeholder={__('Search difficulty levels...', 'Search difficulty levels...')}
          />
        </CardContent>
      </Card>

      {!error && (
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
          statusOptions={[
            { key: 'all', label: __('All', 'All'), count: statusCounts.all },
            { key: 'publish', label: __('Published', 'Published'), count: statusCounts.publish },
            { key: 'draft', label: __('Draft', 'Draft'), count: statusCounts.draft },
            { key: 'trash', label: __('Trash', 'Trash'), count: statusCounts.trash },
          ]}
          showColumnsDropdown={showColumnsDropdown}
          setShowColumnsDropdown={setShowColumnsDropdown}
          columnOptions={[
            { key: 'sorting', label: __('Order', 'Order'), visible: visibleColumns.sorting },
            { key: 'name', label: __('Name', 'Name'), visible: visibleColumns.name },
            { key: 'slug', label: __('Slug', 'Slug'), visible: visibleColumns.slug },
            { key: 'description', label: __('Description', 'Description'), visible: visibleColumns.description },
            { key: 'status', label: __('Status', 'Status'), visible: visibleColumns.status },
            { key: 'created_at', label: __('Created', 'Created'), visible: visibleColumns.created_at },
          ]}
          onToggleColumn={toggleColumn}
          bulkMutationPending={false}
          totalItems={levels.length}
          bulkActionOptions={getDefaultBulkStatusOptions(statusFilter)}
        />
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            data={levels}
            columns={columns}
            actions={actions}
            isLoading={isLoading}
            isError={!!error}
            errorText={__('Failed to load difficulty levels', 'Failed to load difficulty levels')}
            errorDescription={__(
              'We couldn’t connect to the difficulty levels service. Please refresh or try again shortly.',
              'We couldn’t connect to the difficulty levels service. Please refresh or try again shortly.'
            )}
            onRetry={() => queryClient.invalidateQueries({ queryKey: ['difficulty-levels'] })}
            errorDetails={errorContext.details}
            errorRequestInfo={errorContext.requestInfo}
            emptyText={__('No difficulty levels found', 'No difficulty levels found')}
            emptyDescription={__(
              'Get started by creating your first difficulty level to categorize trips by their physical challenge level.',
              'Get started by creating your first difficulty level to categorize trips by their physical challenge level.'
            )}
            onCreateClick={handleCreate}
            onSort={handleSort}
            getSortIcon={getSortIcon}
            selectedItemIds={selectedIds}
            onSelectItem={(id: string | number, checked: boolean) => {
              if (checked) {
                setSelectedIds([...selectedIds, id]);
              } else {
                setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
              }
            }}
            onSelectAll={(checked: boolean) => {
              if (checked) {
                setSelectedIds(levels.map((level: DifficultyLevel) => level.id));
              } else {
                setSelectedIds([]);
              }
            }}
            isAllSelected={levels.length > 0 && selectedIds.length === levels.length}
            getItemId={(level: DifficultyLevel) => level.id}
            getItemStatus={(level: DifficultyLevel) => level.status}
            statusFilter={statusFilter}
            skeletonRows={5}
            capability="yatra_edit_trips"
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={10}
            onPageChange={(newPage) => setPage(newPage)}
            itemName={__('difficulty levels', 'difficulty levels')}
          />
        </div>
      )}
    </div>
  );
};

export default DifficultyLevels;