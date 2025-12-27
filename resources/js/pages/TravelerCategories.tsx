/**
 * Traveler Categories Page
 * Clean, minimal SaaS-style traveler categories management page
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api-client';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { Edit, Trash2 } from 'lucide-react';
import { IconSelector } from '../components/ui/icon-selector';
import type { IconPickerValue } from '../components/ui/icon-picker';
import { SearchFilterToolbar, BulkActionToolbar, Pagination, Table as SharedTable } from '../components/shared';
import { getDefaultBulkStatusOptions } from '../components/shared/bulkStatusOptions';

interface TravelerCategory {
  id: number;
  label: string;
  slug: string;
  description: string;
  age_min?: number | null;
  age_max?: number | null;
  icon?: IconPickerValue | null;
  status: 'draft' | 'publish' | 'trash';
  pricing_mode?: 'per_person' | 'per_group';
  min_pax?: number | null;
  max_pax?: number | null;
  created_at: string;
  updated_at: string;
  created_by: number; // user_id
  updated_by: number; // user_id
  created_by_name?: string; // Optional: user name from API
  updated_by_name?: string; // Optional: user name from API
}

const TravelerCategories: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; category: TravelerCategory | null }>({
    isOpen: false,
    category: null,
  });
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();

  const baseAdminUrl = (window as any).yatraAdmin?.adminUrl || '';

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

  // Fetch stable status counts from API (independent of filters)
  const { data: statsData } = useQuery({
    queryKey: ['traveler-categories-stats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/traveler-categories/stats');
        return response;
      } catch (error: any) {
        return { all: 0, publish: 0, draft: 0, trash: 0 };
      }
    },
    enabled: can('yatra_view_trips'),
  });

  // Fetch categories from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['traveler-categories', queryParams],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/traveler-categories', { params: queryParams });
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load traveler categories', 'Failed to load traveler categories'), 'error');
        throw error;
      }
    },
    enabled: can('yatra_view_trips'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/traveler-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traveler-categories'] });
      queryClient.invalidateQueries({ queryKey: ['traveler-categories-stats'] });
      showToast(__('Traveler category deleted successfully', 'Traveler category deleted successfully'), 'success');
      setDeleteConfirm({ isOpen: false, category: null });
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete traveler category', 'Failed to delete traveler category'), 'error');
    },
  });

  const categories = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

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
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Publish', 'Publish'),
      },
      'draft': {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        label: __('Draft', 'Draft'),
      },
      'trash': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Trash', 'Trash'),
      },
    };

    const statusInfo = statusMap[status] || {
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
      label: status,
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusInfo.className}`}>
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

  const formatAgeRange = (ageMin?: number | null, ageMax?: number | null) => {
    if (ageMin !== null && ageMin !== undefined && ageMax !== null && ageMax !== undefined) {
      return `${ageMin}-${ageMax} ${__('years', 'years')}`;
    } else if (ageMin !== null && ageMin !== undefined) {
      return `${ageMin}+ ${__('years', 'years')}`;
    } else if (ageMax !== null && ageMax !== undefined) {
      return `${__('Under', 'Under')} ${ageMax} ${__('years', 'years')}`;
    }
    return __('No age restriction', 'No age restriction');
  };

  const formatPricing = (category: TravelerCategory) => {
    const mode = category.pricing_mode || 'per_person';

    if (mode === 'per_group') {
      const hasMin = category.min_pax !== null && category.min_pax !== undefined;
      const hasMax = category.max_pax !== null && category.max_pax !== undefined;

      if (hasMin && hasMax) {
        return `${__('Per group', 'Per group')} (${category.min_pax}-${category.max_pax})`;
      }

      if (hasMin) {
        return `${__('Per group', 'Per group')} (${__('From', 'From')} ${category.min_pax})`;
      }

      if (hasMax) {
        return `${__('Per group', 'Per group')} (${__('Up to', 'Up to')} ${category.max_pax})`;
      }

      return __('Per group', 'Per group');
    }

    return __('Per person', 'Per person');
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
              target.parentElement.innerHTML = '<div class="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><span class="text-xs text-gray-400 dark:text-gray-500">—</span></div>';
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

  const handleEdit = (category: TravelerCategory) => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=traveler-categories&action=edit&id=${category.id}`;
  };

  const handleDelete = (category: TravelerCategory) => {
    setDeleteConfirm({ isOpen: true, category });
  };

  const confirmDelete = () => {
    if (deleteConfirm.category) {
      deleteMutation.mutate(deleteConfirm.category.id);
    }
  };

  const handleCreateCategory = () => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=traveler-categories&action=create`;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('label');
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

  const hasFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'id' || sortOrder !== 'desc';

  // Bulk selection & column visibility state
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    category: true,
    description: true,
    age_range: true,
    pricing: true,
    status: true,
    dates: true,
    author: true,
  });

  const toggleColumnVisibility = (key: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

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

  // Bulk mutation for status changes and deletes
  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: (string | number)[] }) => {
      if (action === 'delete') {
        await Promise.all(ids.map(id => apiClient.delete(`/traveler-categories/${id}`)));
      } else {
        // Status change - fetch each category and update with full payload
        await Promise.all(
          ids.map(async (id) => {
            try {
              const response = await apiClient.get(`/traveler-categories/${id}`);
              const category = response as TravelerCategory;
              if (!category || !category.label) {
                return;
              }

              await apiClient.put(`/traveler-categories/${id}`, {
                label: category.label,
                slug: category.slug,
                description: category.description,
                age_min: category.age_min,
                age_max: category.age_max,
                icon: category.icon,
                pricing_mode: category.pricing_mode || 'per_person',
                min_pax: category.min_pax ?? null,
                max_pax: category.max_pax ?? null,
                status: action,
              });
            } catch {
              throw new Error('bulk_item_failed');
            }
          })
        );
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['traveler-categories'] });
      queryClient.invalidateQueries({ queryKey: ['traveler-categories-stats'] });
      const msgMap: Record<string, string> = {
        delete: __('Selected traveler categories deleted successfully', 'Selected traveler categories deleted successfully'),
        trash: __('Selected traveler categories moved to trash', 'Selected traveler categories moved to trash'),
        draft: __('Selected traveler categories marked as draft', 'Selected traveler categories marked as draft'),
        publish: __('Selected traveler categories published', 'Selected traveler categories published'),
      };
      showToast(msgMap[variables.action] || __('Bulk action completed', 'Bulk action completed'), 'success');
      setSelectedIds([]);
      setBulkAction('');
    },
    onError: (error: any, variables) => {
      const msgMapError: Record<string, string> = {
        delete: __('Failed to delete selected traveler categories', 'Failed to delete selected traveler categories'),
        trash: __('Failed to move traveler categories to trash', 'Failed to move traveler categories to trash'),
        draft: __('Failed to mark traveler categories as draft', 'Failed to mark traveler categories as draft'),
        publish: __('Failed to publish traveler categories', 'Failed to publish traveler categories'),
      };
      showToast(
        error?.message || msgMapError[variables.action] || __('Bulk action failed', 'Bulk action failed'),
        'error'
      );
    },
  });

  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(__('Select a bulk action first.', 'Select a bulk action first.'), 'warning');
      return;
    }

    if (selectedIds.length === 0) {
      showToast(__('Select at least one traveler category.', 'Select at least one traveler category.'), 'warning');
      return;
    }

    bulkMutation.mutate({ action: bulkAction, ids: selectedIds });
  };

  // Columns config for shared Table
  const columns = [
    {
      key: 'category',
      label: __('Category', 'Category'),
      sortable: true,
      visible: visibleColumns.category,
      render: (category: TravelerCategory) => (
        <div className="flex items-center gap-3">
          {renderIcon(category.icon)}
          <div>
            <a
              href={`${baseAdminUrl}?page=yatra&subpage=traveler-categories&action=edit&id=${category.id}`}
              className="font-medium text-gray-900 dark:text-white text-blue-600 dark:text-blue-400 hover:underline underline-offset-2"
            >
              {category.label}
            </a>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
              <span>{category.slug}</span>
              <span className="text-gray-400 dark:text-gray-500">(ID: {category.id})</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: __('Description', 'Description'),
      visible: visibleColumns.description,
      render: (category: TravelerCategory) => (
        <div className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
          {category.description || __('No description', 'No description')}
        </div>
      ),
    },
    {
      key: 'age_range',
      label: __('Age Range', 'Age Range'),
      visible: visibleColumns.age_range,
      render: (category: TravelerCategory) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          {formatAgeRange(category.age_min, category.age_max)}
        </span>
      ),
    },
    {
      key: 'pricing',
      label: __('Pricing', 'Pricing'),
      visible: visibleColumns.pricing,
      render: (category: TravelerCategory) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          {formatPricing(category)}
        </span>
      ),
    },
    {
      key: 'status',
      label: __('Status', 'Status'),
      sortable: true,
      visible: visibleColumns.status,
      render: (category: TravelerCategory) => getStatusBadge(category.status),
    },
    {
      key: 'dates',
      label: __('Date', 'Date'),
      sortable: true,
      visible: visibleColumns.dates,
      render: (category: TravelerCategory) => (
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          <div>{formatDate(category.created_at)}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {__('Updated', 'Updated')}: {formatDate(category.updated_at)}
          </div>
        </div>
      ),
    },
    {
      key: 'author',
      label: __('Author', 'Author'),
      visible: visibleColumns.author,
      render: (category: TravelerCategory) => (
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          <div>{formatUser(category.created_by, category.created_by_name)}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {__('Updated by', 'Updated by')}: {formatUser(category.updated_by, category.updated_by_name)}
          </div>
        </div>
      ),
    },
  ];

  const actions = [
    {
      key: 'edit',
      label: __('Edit', 'Edit'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (category: TravelerCategory) => handleEdit(category),
      condition: () => can('yatra_edit_trips'),
    },
    {
      key: 'publish',
      label: __('Make Published', 'Make Published'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (category: TravelerCategory) => bulkMutation.mutate({ action: 'publish', ids: [category.id] }),
      condition: (category: TravelerCategory) => can('yatra_edit_trips') && category.status !== 'publish',
    },
    {
      key: 'draft',
      label: __('Make Draft', 'Make Draft'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (category: TravelerCategory) => bulkMutation.mutate({ action: 'draft', ids: [category.id] }),
      condition: (category: TravelerCategory) => can('yatra_edit_trips') && category.status !== 'draft',
    },
    {
      key: 'trash',
      label: __('Move to Trash', 'Move to Trash'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (category: TravelerCategory) => bulkMutation.mutate({ action: 'trash', ids: [category.id] }),
      variant: 'destructive' as const,
      condition: (category: TravelerCategory) => can('yatra_edit_trips') && category.status !== 'trash',
    },
    {
      key: 'delete',
      label: __('Delete Permanently', 'Delete Permanently'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (category: TravelerCategory) => handleDelete(category),
      variant: 'destructive' as const,
      condition: (category: TravelerCategory) => can('yatra_delete_trips') && category.status === 'trash',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, category: null })}
        onConfirm={confirmDelete}
        title={__('Delete Traveler Category', 'Delete Traveler Category')}
        message={deleteConfirm.category 
          ? __('Are you sure you want to delete "{label}"? This action cannot be undone.', 'Are you sure you want to delete "{label}"? This action cannot be undone.').replace('{label}', deleteConfirm.category.label)
          : __('Are you sure you want to delete this traveler category? This action cannot be undone.', 'Are you sure you want to delete this traveler category? This action cannot be undone.')
        }
        confirmText={__('Delete', 'Delete')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <PageHeader
        title={__('Traveler Categories', 'Traveler Categories')}
        description={__('Manage pricing categories for different types of travelers', 'Manage pricing categories for different types of travelers')}
        actionCapability="yatra_edit_trips"
        actions={
          <Button onClick={handleCreateCategory} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Category', 'Add New Category')}
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
              { value: 'publish', label: __('Publish', 'Publish') },
              { value: 'draft', label: __('Draft', 'Draft') },
              { value: 'trash', label: __('Trash', 'Trash') },
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
              { value: 'id', label: __('ID', 'ID') },
              { value: 'label', label: __('Label', 'Label') },
              { value: 'status', label: __('Status', 'Status') },
              { value: 'created_at', label: __('Created At', 'Created At') },
              { value: 'updated_at', label: __('Updated At', 'Updated At') },
            ]}
            onResetFilters={handleResetFilters}
            hasFilters={!!hasFilters}
            placeholder={__('Search categories...', 'Search categories...')}
          />
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_trips">
        {/* Bulk actions toolbar */}
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
            { key: 'category', label: __('Category', 'Category'), visible: visibleColumns.category },
            { key: 'description', label: __('Description', 'Description'), visible: visibleColumns.description },
            { key: 'age_range', label: __('Age Range', 'Age Range'), visible: visibleColumns.age_range },
            { key: 'pricing', label: __('Pricing', 'Pricing'), visible: visibleColumns.pricing },
            { key: 'status', label: __('Status', 'Status'), visible: visibleColumns.status },
            { key: 'dates', label: __('Date', 'Date'), visible: visibleColumns.dates },
            { key: 'author', label: __('Author', 'Author'), visible: visibleColumns.author },
          ]}
          onToggleColumn={(key) => toggleColumnVisibility(key as keyof typeof visibleColumns)}
          bulkMutationPending={bulkMutation.isPending}
          totalItems={categories.length}
          bulkActionOptions={getDefaultBulkStatusOptions(statusFilter)}
        />

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <SharedTable
              data={categories}
              columns={columns}
              actions={actions}
              isLoading={isLoading}
              isError={!!error}
              errorText={__('Error loading traveler categories', 'Error loading traveler categories')}
              emptyText={__('No traveler categories found', 'No traveler categories found')}
              emptyDescription={
                hasFilters
                  ? __('Try adjusting your filters to see more results.', 'Try adjusting your filters to see more results.')
                  : __('Get started by creating your first traveler category.', 'Get started by creating your first traveler category.')
              }
              onCreateClick={can('yatra_edit_trips') ? handleCreateCategory : undefined}
              onSort={handleSort}
              getSortIcon={getSortIcon}
              capability="yatra_view_trips"
              selectedItemIds={selectedIds}
              onSelectItem={(id, checked) => {
                if (checked) {
                  setSelectedIds(prev => Array.from(new Set([...prev, id])));
                } else {
                  setSelectedIds(prev => prev.filter(existingId => existingId !== id));
                }
              }}
              onSelectAll={(checked) => {
                if (checked) {
                  setSelectedIds(categories.map((cat: TravelerCategory) => cat.id));
                } else {
                  setSelectedIds([]);
                }
              }}
              isAllSelected={categories.length > 0 && selectedIds.length === categories.length}
              getItemId={(cat: TravelerCategory) => cat.id}
              getItemStatus={(cat: TravelerCategory) => cat.status}
              statusFilter={statusFilter}
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
              itemName={__('categories', 'categories')}
            />
          </div>
        )}
      </ConditionalRender>
    </div>
  );
};

export default TravelerCategories;
