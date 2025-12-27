/**
 * Items Page (Item Subtypes)
 * Manage specific items under item types (Hiking, Lunch, Bus, etc.)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api-client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { IconSelector } from '../components/ui/icon-selector';
import { Badge } from '../components/ui/badge';
import { Table as SharedTable } from '../components/shared/Table';
import { Pagination } from '../components/shared/Pagination';
import { BulkActionToolbar } from '../components/shared/BulkActionToolbar';

interface Item {
  id: number;
  name: string;
  slug: string;
  description: string;
  type_id: number;
  type_name?: string;
  type_icon?: string;
  status: 'draft' | 'publish' | 'trash';
  usage_count?: number;
  created_at: string;
  updated_at: string;
  created_by: number; // user_id
  updated_by: number; // user_id
  created_by_name?: string; // Optional: user name from API
  updated_by_name?: string; // Optional: user name from API
}

const Items: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [bulkMutationPending, setBulkMutationPending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: Item | null }>({
    isOpen: false,
    item: null,
  });
  const [statusActionConfirm, setStatusActionConfirm] = useState<{
    isOpen: boolean;
    item: Item | null;
    action: 'publish' | 'draft' | 'trash' | 'restore' | null;
  }>({
    isOpen: false,
    item: null,
    action: null,
  });

  const updateItemStatus = async (item: Item, status: 'draft' | 'publish' | 'trash') => {
    await apiClient.put(`/items/${item.id}`, {
      // Required for validation
      name: item.name,
      type_id: item.type_id,
      // Preserve current slug and description so status change is safe
      slug: item.slug,
      description: item.description,
      status,
      preserve_slug: true,
    });
  };
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();

  const baseAdminUrl = (window as any).yatraAdmin?.adminUrl || '';

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

    if (typeFilter !== 'all') {
      params.type_id = typeFilter;
    }

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    return params;
  }, [searchTerm, typeFilter, statusFilter, sortBy, sortOrder, page]);

  // Fetch stable status counts from API (independent of filters)
  const { data: statsData } = useQuery({
    queryKey: ['items-stats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/items/stats');
        return response;
      } catch (error: any) {
        return { all: 0, publish: 0, draft: 0, trash: 0 };
      }
    },
    enabled: can('yatra_view_trips'),
  });

  // State for available types (populated from items API response)
  const [availableTypes, setAvailableTypes] = useState<Array<{ id: number; name: string }>>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['items', queryParams],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/items', { params: queryParams });
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load items', 'Failed to load items'), 'error');
        throw error;
      }
    },
    enabled: can('yatra_view_trips'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['items-stats'] });
      showToast(__('Item deleted successfully', 'Item deleted successfully'), 'success');
      setDeleteConfirm({ isOpen: false, item: null });
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete item', 'Failed to delete item'), 'error');
    },
  });

  const items = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  // Extract available types from API response meta
  useEffect(() => {
    if (data?.meta?.available_types) {
      setAvailableTypes(data.meta.available_types);
    }
  }, [data]);

  const types = availableTypes;

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

  const handleCreate = () => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=itinerary&tab=items&action=create`;
  };

  const handleEdit = (item: Item) => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=itinerary&tab=items&action=edit&id=${item.id}`;
  };

  const handleDelete = (item: Item) => {
    setDeleteConfirm({ isOpen: true, item });
  };

  const confirmDelete = () => {
    if (deleteConfirm.item) {
      deleteMutation.mutate(deleteConfirm.item.id);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
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

  const hasFilters = searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc';

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    item: true,
    type: true,
    description: true,
    status: true,
    usage: true,
    date: true,
    author: true,
  });

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const columnOptions = [
    { key: 'item', label: __('Item', 'Item'), visible: visibleColumns.item },
    { key: 'type', label: __('Type', 'Type'), visible: visibleColumns.type },
    { key: 'description', label: __('Description', 'Description'), visible: visibleColumns.description },
    { key: 'status', label: __('Status', 'Status'), visible: visibleColumns.status },
    { key: 'usage', label: __('Usage', 'Usage'), visible: visibleColumns.usage },
    { key: 'date', label: __('Date', 'Date'), visible: visibleColumns.date },
    { key: 'author', label: __('Author', 'Author'), visible: visibleColumns.author },
  ];

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  const handleSelectItem = (id: string | number, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(existingId => existingId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(items.map((item: Item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
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

  const statusOptions = [
    { key: 'all', label: __('All', 'All'), count: statusCounts.all },
    { key: 'draft', label: __('Draft', 'Draft'), count: statusCounts.draft },
    { key: 'publish', label: __('Publish', 'Publish'), count: statusCounts.publish },
    { key: 'trash', label: __('Trash', 'Trash'), count: statusCounts.trash },
  ];

  const bulkActionOptions = useMemo(() => {
    if (statusFilter === 'trash') {
      return [
        { value: 'restore', label: __('Restore to Draft', 'Restore to Draft') },
        { value: 'delete', label: __('Delete Permanently', 'Delete Permanently') },
      ];
    }

    return [
      { value: 'publish', label: __('Mark as Published', 'Mark as Published') },
      { value: 'draft', label: __('Mark as Draft', 'Mark as Draft') },
      { value: 'trash', label: __('Move to Trash', 'Move to Trash') },
      { value: 'delete', label: __('Delete Permanently', 'Delete Permanently') },
    ];
  }, [statusFilter]);

  const handleBulkApply = async () => {
    if (!bulkAction || selectedIds.length === 0) {
      showToast(__('Please select items and a bulk action first.', 'Please select items and a bulk action first.'), 'error');
      return;
    }

    try {
      setBulkMutationPending(true);

      const selectedItems = items.filter((item: Item) => selectedIds.includes(item.id));

      if (bulkAction === 'delete') {
        await Promise.all(selectedIds.map(id => apiClient.delete(`/items/${id}`)));
        showToast(__('Items deleted successfully', 'Items deleted successfully'), 'success');
      } else if (bulkAction === 'publish') {
        await Promise.all(selectedItems.map((item: Item) => updateItemStatus(item, 'publish')));
        showToast(__('Items marked as published', 'Items marked as published'), 'success');
      } else if (bulkAction === 'draft') {
        const targetStatus: 'draft' = 'draft';
        await Promise.all(selectedItems.map((item: Item) => updateItemStatus(item, targetStatus)));
        showToast(
          statusFilter === 'trash'
            ? __('Items restored to draft', 'Items restored to draft')
            : __('Items marked as draft', 'Items marked as draft'),
          'success'
        );
      } else if (bulkAction === 'trash') {
        await Promise.all(selectedItems.map((item: Item) => updateItemStatus(item, 'trash')));
        showToast(__('Items moved to trash', 'Items moved to trash'), 'success');
      } else if (bulkAction === 'restore') {
        await Promise.all(selectedItems.map((item: Item) => updateItemStatus(item, 'draft')));
        showToast(__('Items restored to draft', 'Items restored to draft'), 'success');
      }

      await queryClient.invalidateQueries({ queryKey: ['items'] });
      await queryClient.invalidateQueries({ queryKey: ['items-stats'] });
      setSelectedIds([]);
      setBulkAction('');
    } catch (error) {
      showToast(__('Bulk action failed', 'Bulk action failed'), 'error');
    } finally {
      setBulkMutationPending(false);
    }
  };

  const columns = [
    {
      key: 'item',
      label: __('Item', 'Item'),
      sortable: true,
      width: 'w-[200px]',
      visible: visibleColumns.item,
      render: (item: Item) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            <a
              href={`${baseAdminUrl}?page=yatra&subpage=itinerary&tab=items&action=edit&id=${item.id}`}
              className="hover:underline underline-offset-2 text-blue-600 dark:text-blue-400"
            >
              {item.name}
            </a>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {item.slug}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: __('Type', 'Type'),
      sortable: true,
      width: 'w-[150px]',
      visible: visibleColumns.type,
      render: (item: Item) => (
        <div className="flex items-center gap-2">
          {item.type_icon && (
            <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <IconSelector
                iconName={item.type_icon as any}
                className="w-4 h-4 text-gray-700 dark:text-gray-300"
              />
            </div>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {item.type_name || __('Unknown', 'Unknown')}
          </span>
        </div>
      ),
    },
    {
      key: 'description',
      label: __('Description', 'Description'),
      sortable: false,
      width: 'w-[200px]',
      visible: visibleColumns.description,
      render: (item: Item) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
          {item.description || __('No description', 'No description')}
        </span>
      ),
    },
    {
      key: 'status',
      label: __('Status', 'Status'),
      sortable: true,
      width: 'w-[100px]',
      visible: visibleColumns.status,
      render: (item: Item) => getStatusBadge(item.status),
    },
    {
      key: 'usage',
      label: __('Usage', 'Usage'),
      sortable: false,
      width: 'w-[100px]',
      visible: visibleColumns.usage,
      render: (item: Item) => (
        <div className="text-center">
          <Badge variant="outline" className="font-medium">
            {item.usage_count ?? 0}
          </Badge>
        </div>
      ),
    },
    {
      key: 'date',
      label: __('Date', 'Date'),
      sortable: true,
      width: 'w-[150px]',
      visible: visibleColumns.date,
      render: (item: Item) => (
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          <div>{formatDate(item.created_at)}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {__('Updated', 'Updated')}: {formatDate(item.updated_at)}
          </div>
        </div>
      ),
    },
    {
      key: 'author',
      label: __('Author', 'Author'),
      sortable: false,
      width: 'w-[150px]',
      visible: visibleColumns.author,
      render: (item: Item) => (
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          <div>{formatUser(item.created_by, item.created_by_name)}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {__('Updated by', 'Updated by')}: {formatUser(item.updated_by, item.updated_by_name)}
          </div>
        </div>
      ),
    },
  ];

  const tableActions = useMemo(() => {
    const actions: any[] = [];

    if (can('yatra_edit_trips')) {
      actions.push({
        key: 'edit',
        label: __('Edit', 'Edit'),
        icon: <Edit className="w-4 h-4" />,
        onClick: (item: Item) => handleEdit(item),
      });

      actions.push({
        key: 'publish',
        label: __('Mark as Published', 'Mark as Published'),
        icon: <ArrowUp className="w-4 h-4" />,
        onClick: (item: Item) => {
          setStatusActionConfirm({ isOpen: true, item, action: 'publish' });
        },
        condition: (item: Item) => item.status !== 'publish' && item.status !== 'trash',
      });

      actions.push({
        key: 'draft',
        label: __('Mark as Draft', 'Mark as Draft'),
        icon: <ArrowDown className="w-4 h-4" />,
        onClick: (item: Item) => {
          setStatusActionConfirm({ isOpen: true, item, action: 'draft' });
        },
        condition: (item: Item) => item.status !== 'draft' && item.status !== 'trash',
      });

      actions.push({
        key: 'trash',
        label: __('Move to Trash', 'Move to Trash'),
        icon: <Trash2 className="w-4 h-4" />,
        onClick: (item: Item) => {
          setStatusActionConfirm({ isOpen: true, item, action: 'trash' });
        },
        condition: (item: Item) => item.status !== 'trash',
      });

      actions.push({
        key: 'restore',
        label: __('Restore to Draft', 'Restore to Draft'),
        icon: <ArrowUp className="w-4 h-4" />,
        onClick: (item: Item) => {
          setStatusActionConfirm({ isOpen: true, item, action: 'restore' });
        },
        condition: (item: Item) => item.status === 'trash',
      });
    }

    if (can('yatra_delete_trips')) {
      actions.push({
        key: 'delete',
        label: __('Delete Permanently', 'Delete Permanently'),
        icon: <Trash2 className="w-4 h-4" />,
        onClick: (item: Item) => handleDelete(item),
        variant: 'destructive' as const,
        condition: (item: Item) => item.status === 'trash',
      });
    }

    return actions;
  }, [can, queryClient, showToast]);

  return (
    <div className="space-y-3">
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        title={__('Delete Item', 'Delete Item')}
        message={deleteConfirm.item 
          ? __('Are you sure you want to delete "{name}"? This action cannot be undone.', 'Are you sure you want to delete "{name}"? This action cannot be undone.').replace('{name}', deleteConfirm.item.name)
          : __('Are you sure you want to delete this item? This action cannot be undone.', 'Are you sure you want to delete this item? This action cannot be undone.')
        }
        confirmText={__('Delete', 'Delete')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={statusActionConfirm.isOpen}
        onClose={() => setStatusActionConfirm({ isOpen: false, item: null, action: null })}
        onConfirm={async () => {
          const { item, action } = statusActionConfirm;
          if (!item || !action) {
            return;
          }

          const targetStatus = action === 'restore' ? 'draft' : action;

          await updateItemStatus(item, targetStatus as 'draft' | 'publish' | 'trash');

          const successMessage =
            action === 'publish'
              ? __('Item marked as published.', 'Item marked as published.')
              : action === 'draft' || action === 'restore'
                ? __('Item marked as draft.', 'Item marked as draft.')
                : __('Item moved to trash.', 'Item moved to trash.');

          showToast(successMessage, 'success');
          queryClient.invalidateQueries({ queryKey: ['items'] });
          queryClient.invalidateQueries({ queryKey: ['items-stats'] });
          setStatusActionConfirm({ isOpen: false, item: null, action: null });
        }}
        title={(() => {
          switch (statusActionConfirm.action) {
            case 'publish':
              return __('Publish Item', 'Publish Item');
            case 'draft':
              return __('Mark as Draft', 'Mark as Draft');
            case 'trash':
              return __('Move to Trash', 'Move to Trash');
            case 'restore':
              return __('Restore Item', 'Restore Item');
            default:
              return __('Confirm Action', 'Confirm Action');
          }
        })()}
        message={(() => {
          const name = statusActionConfirm.item?.name || '';
          switch (statusActionConfirm.action) {
            case 'publish':
              return __('Are you sure you want to publish "{name}"?', 'Are you sure you want to publish "{name}"?').replace('{name}', name);
            case 'draft':
              return __('Are you sure you want to mark "{name}" as draft?', 'Are you sure you want to mark "{name}" as draft?').replace('{name}', name);
            case 'trash':
              return __('Are you sure you want to move "{name}" to trash?', 'Are you sure you want to move "{name}" to trash?').replace('{name}', name);
            case 'restore':
              return __('Are you sure you want to restore "{name}" to draft?', 'Are you sure you want to restore "{name}" to draft?').replace('{name}', name);
            default:
              return __('Are you sure you want to perform this action?', 'Are you sure you want to perform this action?');
          }
        })()}
        confirmText={(() => {
          switch (statusActionConfirm.action) {
            case 'publish':
              return __('Publish', 'Publish');
            case 'draft':
            case 'restore':
              return __('Mark as Draft', 'Mark as Draft');
            case 'trash':
              return __('Move to Trash', 'Move to Trash');
            default:
              return __('Confirm', 'Confirm');
          }
        })()}
        cancelText={__('Cancel', 'Cancel')}
        variant="warning"
        isLoading={false}
      />

      <PageHeader
        title={__('Items', 'Items')}
        description={__('Manage specific items (subtypes) under item types. Examples: Hiking (under Activity), Lunch (under Meal), Bus (under Transportation).', 'Manage specific items (subtypes) under item types. Examples: Hiking (under Activity), Lunch (under Meal), Bus (under Transportation).')}
        actionCapability="yatra_edit_trips"
        actions={
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Item', 'Add New Item')}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__('Search items...', 'Search items...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full md:w-48"
            >
              <option value="all">{__('All Types', 'All Types')}</option>
              {types.map((type: any) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40"
            >
              <option value="all">{__('All Status', 'All Status')}</option>
              <option value="draft">{__('Draft', 'Draft')}</option>
              <option value="publish">{__('Publish', 'Publish')}</option>
              <option value="trash">{__('Trash', 'Trash')}</option>
            </Select>

            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-40"
            >
              <option value="name">{__('Name', 'Name')}</option>
              <option value="type_id">{__('Type', 'Type')}</option>
              <option value="status">{__('Status', 'Status')}</option>
              <option value="created_at">{__('Created At', 'Created At')}</option>
              <option value="updated_at">{__('Updated At', 'Updated At')}</option>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 flex items-center gap-1.5"
              title={sortOrder === 'asc' ? __('Ascending', 'Ascending') : __('Descending', 'Descending')}
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
              <span className="text-xs">{sortOrder === 'asc' ? __('Asc', 'Asc') : __('Desc', 'Desc')}</span>
            </Button>

            {hasFilters && (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {__('Reset', 'Reset')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_trips">
        <>
          <BulkActionToolbar
            selectedIds={selectedIds}
            bulkAction={bulkAction}
            setBulkAction={setBulkAction}
            onApply={handleBulkApply}
            onClearSelection={handleClearSelection}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            statusOptions={statusOptions}
            showColumnsDropdown={showColumnsDropdown}
            setShowColumnsDropdown={setShowColumnsDropdown}
            columnOptions={columnOptions}
            onToggleColumn={toggleColumn}
            bulkMutationPending={bulkMutationPending}
            totalItems={total}
            bulkActionOptions={bulkActionOptions}
          />

          <Card>
            <CardContent className="p-0">
              <SharedTable
                data={items}
                columns={columns}
                actions={tableActions}
                isLoading={isLoading}
                isError={!!error}
                errorText={__('Error loading items', 'Error loading items')}
                emptyText={__('No items found', 'No items found')}
                emptyDescription={hasFilters
                  ? __('Try adjusting your filters to see more results.', 'Try adjusting your filters to see more results.')
                  : __('Get started by creating your first item.', 'Get started by creating your first item.')
                }
                onCreateClick={can('yatra_edit_trips') ? handleCreate : undefined}
                onSort={handleSort}
                getSortIcon={getSortIcon}
                selectedItemIds={selectedIds}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                isAllSelected={isAllSelected}
                getItemId={(item: Item) => item.id}
                getItemStatus={(item: Item) => item.status}
                statusFilter={statusFilter}
                capability="yatra_view_trips"
              />
            </CardContent>
          </Card>

          {total > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={10}
                onPageChange={setPage}
                itemName={__('items', 'items')}
              />
            </div>
          )}
        </>
      </ConditionalRender>
    </div>
  );
};

export default Items;
