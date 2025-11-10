/**
 * Discounts Page
 * Manage discount coupons for trips
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Copy, Tag, Users } from 'lucide-react';
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
import { Badge } from '../components/ui/badge';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';

interface Discount {
  id: number;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed';
  amount: number;
  max_discount_amount?: number;
  usage_limit: number;
  usage_limit_per_customer?: number;
  usage_count: number;
  valid_from?: string;
  expiry_date?: string;
  status: 'draft' | 'publish' | 'trash';
  applicable_to: 'all' | 'specific_trips';
  trip_ids?: number[];
  min_amount?: number;
  first_time_customer_only?: boolean;
  is_group_discount?: boolean;
  min_group_size?: number;
  group_discount_type?: 'percentage' | 'fixed';
  group_discount_amount?: number;
  created_at: string;
  updated_at: string;
  created_by: number; // user_id
  updated_by: number; // user_id
  created_by_name?: string; // Optional: user name from API
  updated_by_name?: string; // Optional: user name from API
}

const Discounts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; discount: Discount | null }>({ isOpen: false, discount: null });
  const queryClient = useQueryClient();
  const { can } = usePermissions();
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

    if (typeFilter !== 'all') {
      params.type = typeFilter;
    }

    return params;
  }, [searchTerm, statusFilter, typeFilter, sortBy, sortOrder, page]);

  // Fetch discounts from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['discounts', queryParams],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/discounts', { params: queryParams });
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load discounts', 'Failed to load discounts'), 'error');
        throw error;
      }
    },
    enabled: can('yatra_view_bookings'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/discounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      showToast(__('Discount deleted successfully', 'Discount deleted successfully'), 'success');
      setDeleteConfirm({ isOpen: false, discount: null });
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete discount', 'Failed to delete discount'), 'error');
    },
  });

  const discounts = data?.data || [];
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
      return __('Invalid date', 'Invalid date');
    }
  };

  const formatUser = (userId: number, userName?: string) => {
    if (userName) return userName;
    return userId ? `User #${userId}` : __('Unknown', 'Unknown');
  };

  const confirmDelete = () => {
    if (deleteConfirm.discount) {
      deleteMutation.mutate(deleteConfirm.discount.id);
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

  const formatDiscount = (discount: Discount) => {
    if (discount.type === 'percentage') {
      return `${discount.amount}%`;
    }
    return `$${discount.amount}`;
  };

  const handleEdit = (discount: Discount) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=discounts&action=edit&id=${discount.id}`;
  };

  const handleDelete = (discount: Discount) => {
    setDeleteConfirm({ isOpen: true, discount });
  };

  const handleDuplicate = (discount: Discount) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=discounts&action=create&duplicate=${discount.id}`;
  };

  const handleCreateDiscount = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=discounts&action=create`;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
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

  const hasFilters = searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || sortBy !== 'created_at' || sortOrder !== 'desc';

  return (
    <div className="space-y-3">
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, discount: null })}
        onConfirm={confirmDelete}
        title={__('Delete Discount', 'Delete Discount')}
        message={deleteConfirm.discount 
          ? __('Are you sure you want to delete discount code "{code}"? This action cannot be undone.', 'Are you sure you want to delete discount code "{code}"? This action cannot be undone.').replace('{code}', deleteConfirm.discount.code)
          : __('Are you sure you want to delete this discount? This action cannot be undone.', 'Are you sure you want to delete this discount? This action cannot be undone.')
        }
        confirmText={__('Delete', 'Delete')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <PageHeader
        title={__('Discount Coupons', 'Discount Coupons')}
        description={__('Create and manage discount coupons for your trips', 'Create and manage discount coupons for your trips')}
      />

      {/* Filters, Search, and Sorting - Always Visible */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__('Search by code...', 'Search by code...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 h-9"
            >
              <option value="all">{__('All Status', 'All Status')}</option>
              <option value="active">{__('Active', 'Active')}</option>
              <option value="inactive">{__('Inactive', 'Inactive')}</option>
              <option value="expired">{__('Expired', 'Expired')}</option>
            </Select>

            {/* Type Filter */}
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full md:w-40 h-9"
            >
              <option value="all">{__('All Types', 'All Types')}</option>
              <option value="percentage">{__('Percentage', 'Percentage')}</option>
              <option value="fixed">{__('Fixed Amount', 'Fixed Amount')}</option>
            </Select>

            {/* Sort By */}
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-40 h-9"
            >
              <option value="created_at">{__('Created Date', 'Created Date')}</option>
              <option value="code">{__('Code', 'Code')}</option>
              <option value="type">{__('Type', 'Type')}</option>
              <option value="amount">{__('Amount', 'Amount')}</option>
              <option value="usage_count">{__('Usage', 'Usage')}</option>
              <option value="expiry_date">{__('Expiry Date', 'Expiry Date')}</option>
              <option value="status">{__('Status', 'Status')}</option>
            </Select>

            {/* Sort Order */}
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

            {/* Reset Button */}
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

      <ConditionalRender capability="yatra_view_bookings">
        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              {__('Error loading discounts', 'Error loading discounts')}
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
                        <TableHead className="w-[200px]">{__('Coupon Code', 'Coupon Code')}</TableHead>
                        <TableHead>{__('Type', 'Type')}</TableHead>
                        <TableHead>{__('Discount', 'Discount')}</TableHead>
                        <TableHead>{__('Usage', 'Usage')}</TableHead>
                        <TableHead>{__('Expiry Date', 'Expiry Date')}</TableHead>
                        <TableHead>{__('Status', 'Status')}</TableHead>
                        <TableHead className="w-[150px]">{__('Date', 'Date')}</TableHead>
                        <TableHead className="w-[150px]">{__('Author', 'Author')}</TableHead>
                        <TableHead className="text-right w-[120px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(5)].map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell>
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
                              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : discounts.length === 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">{__('Coupon Code', 'Coupon Code')}</TableHead>
                        <TableHead>{__('Type', 'Type')}</TableHead>
                        <TableHead>{__('Discount', 'Discount')}</TableHead>
                        <TableHead>{__('Usage', 'Usage')}</TableHead>
                        <TableHead>{__('Expiry Date', 'Expiry Date')}</TableHead>
                        <TableHead>{__('Status', 'Status')}</TableHead>
                        <TableHead className="w-[150px]">{__('Date', 'Date')}</TableHead>
                        <TableHead className="w-[150px]">{__('Author', 'Author')}</TableHead>
                        <TableHead className="text-right w-[120px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={9} className="h-64">
                          <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                              <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              {__('No discounts found', 'No discounts found')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                              {hasFilters
                                ? __('Try adjusting your filters to see more results.', 'Try adjusting your filters to see more results.')
                                : __('Get started by creating your first discount coupon.', 'Get started by creating your first discount coupon.')
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
                              can('yatra_edit_bookings') && (
                                <Button
                                  onClick={handleCreateDiscount}
                                  className="flex items-center gap-2"
                                >
                                  <Plus className="w-4 h-4" />
                                  {__('Create Discount', 'Create Discount')}
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
                            onClick={() => handleSort('code')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Coupon Code', 'Coupon Code')}
                            {getSortIcon('code')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('type')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Type', 'Type')}
                            {getSortIcon('type')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('amount')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Discount', 'Discount')}
                            {getSortIcon('amount')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('usage_count')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Usage', 'Usage')}
                            {getSortIcon('usage_count')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('expiry_date')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Expiry Date', 'Expiry Date')}
                            {getSortIcon('expiry_date')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('status')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Status', 'Status')}
                            {getSortIcon('status')}
                          </button>
                        </TableHead>
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
                        <TableHead className="text-right w-[120px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discounts.map((discount: Discount) => (
                        <TableRow key={discount.id}>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Tag className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                                  {discount.code}
                                </span>
                                {discount.is_group_discount && (
                                  <Badge variant="info" className="text-xs flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {__('Group', 'Group')}
                                  </Badge>
                                )}
                              </div>
                              {discount.description && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {discount.description}
                                </div>
                              )}
                              {discount.is_group_discount && discount.min_group_size && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {__('Min', 'Min')} {discount.min_group_size} {__('people', 'people')} - {discount.group_discount_type === 'percentage' ? `${discount.group_discount_amount}%` : `$${discount.group_discount_amount}`} {__('extra discount', 'extra discount')}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={discount.type === 'percentage' ? 'info' : 'default'} className="text-xs">
                              {discount.type === 'percentage' ? __('Percentage', 'Percentage') : __('Fixed', 'Fixed')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-white">
                            {formatDiscount(discount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-medium">
                              {discount.usage_count} / {discount.usage_limit === 0 ? '∞' : discount.usage_limit}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {discount.expiry_date ? formatDate(discount.expiry_date) : __('No expiry', 'No expiry')}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(discount.status)}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            <div>
                              <div>{formatDate(discount.created_at)}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {__('Updated', 'Updated')}: {formatDate(discount.updated_at)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                            <div>
                              <div>{formatUser(discount.created_by, discount.created_by_name)}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {__('Updated by', 'Updated by')}: {formatUser(discount.updated_by, discount.updated_by_name)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <ConditionalRender capability="yatra_edit_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDuplicate(discount)}
                                  className="h-8 w-8"
                                  aria-label={__('Duplicate coupon', 'Duplicate coupon')}
                                  title={__('Duplicate', 'Duplicate')}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(discount)}
                                  className="h-8 w-8"
                                  aria-label={__('Edit coupon', 'Edit coupon')}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>

                              <ConditionalRender capability="yatra_delete_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(discount)}
                                  className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  aria-label={__('Delete coupon', 'Delete coupon')}
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
                      {__('Showing', 'Showing')} <span className="font-medium text-gray-900 dark:text-white">{(page - 1) * 10 + 1}</span> - <span className="font-medium text-gray-900 dark:text-white">{Math.min(page * 10, total)}</span> {__('of', 'of')} <span className="font-medium text-gray-900 dark:text-white">{total}</span> {__('coupons', 'coupons')}
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

export default Discounts;

