/**
 * Item Types Page
 * Manage itinerary item types (Activity, Meal, Accommodation, etc.)
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2 } from 'lucide-react';
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
import { IconSelector } from '../components/ui/icon-selector';
import { Badge } from '../components/ui/badge';
import type { IconPickerValue } from '../components/ui/icon-picker';

interface ItemType {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string | IconPickerValue | null; // Can be string (old format) or IconPickerValue (new format)
  color: string;
  status: 'draft' | 'publish' | 'trash';
  items_count?: number;
  created_at: string;
  updated_at: string;
  created_by: number; // user_id
  updated_by: number; // user_id
  created_by_name?: string; // Optional: user name from API
  updated_by_name?: string; // Optional: user name from API
}

const ItemTypes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; itemType: ItemType | null }>({
    isOpen: false,
    itemType: null,
  });
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();

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

  const { data, isLoading, error } = useQuery({
    queryKey: ['item-types', queryParams],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/item-types', { params: queryParams });
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load item types', 'Failed to load item types'), 'error');
        throw error;
      }
    },
    enabled: can('yatra_view_trips'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/item-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-types'] });
      showToast(__('Item type deleted successfully', 'Item type deleted successfully'), 'success');
      setDeleteConfirm({ isOpen: false, itemType: null });
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete item type', 'Failed to delete item type'), 'error');
    },
  });

  const itemTypes = data?.data || [];
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

  const renderIcon = (icon: IconPickerValue | string | null | undefined) => {
    if (!icon) {
      return (
        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
        </div>
      );
    }

    // New format: IconPickerValue object
    if (typeof icon === 'object' && icon !== null) {
      const iconValue = icon as IconPickerValue;
      if (iconValue.type === 'image') {
        return (
          <img
            src={iconValue.value}
            alt=""
            className="w-10 h-10 rounded-lg object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.innerHTML = '<div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><span class="text-xs text-gray-400 dark:text-gray-500">—</span></div>';
              }
            }}
          />
        );
      } else {
        // Icon type
        return (
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <IconSelector 
              iconName={iconValue.value as any} 
              className="w-5 h-5 text-gray-700 dark:text-gray-300"
            />
          </div>
        );
      }
    }

    // Old format: string icon name
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <IconSelector 
          iconName={icon as any} 
          className="w-5 h-5 text-gray-700 dark:text-gray-300"
        />
      </div>
    );
  };

  const handleCreate = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=item-types&action=create`;
  };

  const handleEdit = (itemType: ItemType) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=item-types&action=edit&id=${itemType.id}`;
  };

  const handleDelete = (itemType: ItemType) => {
    setDeleteConfirm({ isOpen: true, itemType });
  };

  const confirmDelete = () => {
    if (deleteConfirm.itemType) {
      deleteMutation.mutate(deleteConfirm.itemType.id);
    }
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

  const hasFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc';

  return (
    <div className="space-y-3">
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, itemType: null })}
        onConfirm={confirmDelete}
        title={__('Delete Item Type', 'Delete Item Type')}
        message={deleteConfirm.itemType 
          ? __('Are you sure you want to delete "{name}"? This action cannot be undone.', 'Are you sure you want to delete "{name}"? This action cannot be undone.').replace('{name}', deleteConfirm.itemType.name)
          : __('Are you sure you want to delete this item type? This action cannot be undone.', 'Are you sure you want to delete this item type? This action cannot be undone.')
        }
        confirmText={__('Delete', 'Delete')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <PageHeader
        title={__('Item Types', 'Item Types')}
        description={__('Manage categories for itinerary items like Activity, Meal, Accommodation, etc.', 'Manage categories for itinerary items like Activity, Meal, Accommodation, etc.')}
        actionCapability="yatra_edit_trips"
        actions={
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Type', 'Add New Type')}
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
                placeholder={__('Search item types...', 'Search item types...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 h-9"
            >
              <option value="all">{__('All Status', 'All Status')}</option>
              <option value="draft">{__('Draft', 'Draft')}</option>
              <option value="publish">{__('Publish', 'Publish')}</option>
              <option value="trash">{__('Trash', 'Trash')}</option>
            </Select>

            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-40 h-9"
            >
              <option value="name">{__('Name', 'Name')}</option>
              <option value="status">{__('Status', 'Status')}</option>
              <option value="created_at">{__('Created At', 'Created At')}</option>
              <option value="updated_at">{__('Updated At', 'Updated At')}</option>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-9 px-3 flex items-center gap-1.5"
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
                className="flex items-center gap-2 h-9"
              >
                <X className="w-4 h-4" />
                {__('Reset', 'Reset')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_trips">
        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              {__('Error loading item types', 'Error loading item types')}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">{__('Type', 'Type')}</TableHead>
                        <TableHead className="w-[200px]">{__('Description', 'Description')}</TableHead>
                        <TableHead className="w-[100px]">{__('Status', 'Status')}</TableHead>
                        <TableHead className="w-[100px] text-center">{__('Items', 'Items')}</TableHead>
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
                              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
                          </TableCell>
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
                ) : itemTypes.length === 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">{__('Type', 'Type')}</TableHead>
                        <TableHead className="w-[200px]">{__('Description', 'Description')}</TableHead>
                        <TableHead className="w-[100px]">{__('Status', 'Status')}</TableHead>
                        <TableHead className="w-[100px] text-center">{__('Items', 'Items')}</TableHead>
                        <TableHead className="w-[150px]">{__('Date', 'Date')}</TableHead>
                        <TableHead className="w-[150px]">{__('Author', 'Author')}</TableHead>
                        <TableHead className="text-right w-[100px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={7} className="h-64">
                          <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                              <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              {__('No item types found', 'No item types found')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                              {hasFilters
                                ? __('Try adjusting your filters to see more results.', 'Try adjusting your filters to see more results.')
                                : __('Get started by creating your first item type.', 'Get started by creating your first item type.')
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
                                <Button
                                  onClick={handleCreate}
                                  className="flex items-center gap-2"
                                >
                                  <Plus className="w-4 h-4" />
                                  {__('Create Item Type', 'Create Item Type')}
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
                        <TableHead className="w-[200px]">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Type', 'Type')}
                            {getSortIcon('name')}
                          </button>
                        </TableHead>
                        <TableHead className="w-[200px]">{__('Description', 'Description')}</TableHead>
                        <TableHead className="w-[100px]">
                          <button
                            onClick={() => handleSort('status')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Status', 'Status')}
                            {getSortIcon('status')}
                          </button>
                        </TableHead>
                        <TableHead className="w-[100px] text-center">{__('Items', 'Items')}</TableHead>
                        <TableHead className="w-[150px]">
                          <button
                            onClick={() => handleSort('created_at')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Date', 'Date')}
                            {getSortIcon('created_at')}
                          </button>
                        </TableHead>
                        <TableHead className="w-[150px]">{__('Author', 'Author')}</TableHead>
                        <TableHead className="text-right w-[100px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemTypes.map((itemType: ItemType) => (
                        <TableRow key={itemType.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {renderIcon(itemType.icon)}
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {itemType.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {itemType.slug}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                            <div className="line-clamp-2">
                              {itemType.description || __('No description', 'No description')}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(itemType.status)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-medium">
                              {itemType.items_count ?? 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            <div>
                              <div>{formatDate(itemType.created_at)}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {__('Updated', 'Updated')}: {formatDate(itemType.updated_at)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                            <div>
                              <div>{formatUser(itemType.created_by, itemType.created_by_name)}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {__('Updated by', 'Updated by')}: {formatUser(itemType.updated_by, itemType.updated_by_name)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <ConditionalRender capability="yatra_edit_trips">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(itemType)}
                                  className="h-8 w-8"
                                  aria-label={__('Edit item type', 'Edit item type')}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>

                              <ConditionalRender capability="yatra_delete_trips">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(itemType)}
                                  className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  aria-label={__('Delete item type', 'Delete item type')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {total > 0 && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {__('Showing', 'Showing')} <span className="font-medium text-gray-900 dark:text-white">{(page - 1) * 10 + 1}</span> - <span className="font-medium text-gray-900 dark:text-white">{Math.min(page * 10, total)}</span> {__('of', 'of')} <span className="font-medium text-gray-900 dark:text-white">{total}</span> {__('item types', 'item types')}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-8"
                      >
                        {__('Previous', 'Previous')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="h-8"
                      >
                        {__('Next', 'Next')}
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

export default ItemTypes;
