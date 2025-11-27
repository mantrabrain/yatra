/**
 * Destinations Page
 * Clean, minimal SaaS-style destinations management page
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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

interface Destination {
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

const Destinations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; destination: Destination | null }>({
    isOpen: false,
    destination: null,
  });
  const queryClient = useQueryClient();
  const { can, isPro } = usePermissions();
  const { showToast } = useToast();

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
    mutationFn: async (id: number) => {
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

  const hasFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc';

  return (
    <div className="space-y-3">
      {/* Confirmation Dialog */}
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
          <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
            {/* Search */}
            <div className="relative min-w-0 w-full lg:flex-[2]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__('Search destinations...', 'Search destinations...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full lg:flex-1"
            >
              <option value="all">{__('All Status', 'All Status')}</option>
              <option value="draft">{__('Draft', 'Draft')}</option>
              <option value="publish">{__('Publish', 'Publish')}</option>
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
              {__('Error loading destinations', 'Error loading destinations')}
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
                        <TableHead className="w-[250px]">{__('Destination', 'Destination')}</TableHead>
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
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                              <div className="space-y-2">
                                <div className="h-4 w-36 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
                          </TableCell>
                          {isPro && (
                            <TableCell>
                              <div className="h-4 w-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="space-y-1">
                              <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                              <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                              <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-9 w-9 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                              <div className="h-9 w-9 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : destinations.length === 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">{__('Destination', 'Destination')}</TableHead>
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
                      <TableRow>
                        <TableCell colSpan={isPro ? 7 : 6} className="h-64">
                          <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                              <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              {__('No destinations found', 'No destinations found')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                              {hasFilters 
                                ? __('Try adjusting your filters to see more results.', 'Try adjusting your filters to see more results.')
                                : __('Get started by creating your first destination.', 'Get started by creating your first destination.')
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
                                  onClick={handleCreateDestination}
                                  className="flex items-center gap-2"
                                >
                                  <Plus className="w-4 h-4" />
                                  {__('Create Destination', 'Create Destination')}
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
                        <TableHead className="w-[250px]">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Destination', 'Destination')}
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
                        {isPro && (
                          <TableHead className="w-[80px]">{__('Trips', 'Trips')}</TableHead>
                        )}
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
                      {destinations.map((destination: Destination) => (
                        <TableRow key={destination.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {renderIcon(destination.icon)}
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {destination.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {destination.slug}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                            <div className="line-clamp-2">
                              {destination.description || __('No description', 'No description')}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(destination.status)}
                          </TableCell>
                          {isPro && (
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {destination.trips_count || 0}
                            </TableCell>
                          )}
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            <div>
                              <div>{formatDate(destination.created_at)}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {__('Updated', 'Updated')}: {formatDate(destination.updated_at)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                            <div>
                              <div>{formatUser(destination.created_by, destination.created_by_name)}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {__('Updated by', 'Updated by')}: {formatUser(destination.updated_by, destination.updated_by_name)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <ConditionalRender capability="yatra_edit_trips">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(destination)}
                                  className="h-9 w-9 p-0"
                                  aria-label={__('Edit destination', 'Edit destination')}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>

                              <ConditionalRender capability="yatra_delete_trips">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(destination)}
                                  className="h-9 w-9 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  aria-label={__('Delete destination', 'Delete destination')}
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

            {/* Pagination - Always Visible */}
            {total > 0 && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {__('Showing', 'Showing')} <span className="font-medium text-gray-900 dark:text-white">{(page - 1) * 10 + 1}</span> - <span className="font-medium text-gray-900 dark:text-white">{Math.min(page * 10, total)}</span> {__('of', 'of')} <span className="font-medium text-gray-900 dark:text-white">{total}</span> {__('destinations', 'destinations')}
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

export default Destinations;
