/**
 * Discounts Page
 * Manage discount coupons for trips
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Copy, Tag, Users } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Badge } from '../components/ui/badge';

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
  status: 'active' | 'inactive' | 'expired';
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
}

const Discounts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { can } = usePermissions();

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

  // Fetch discounts with dummy data
  const { data, isLoading, error } = useQuery({
    queryKey: ['discounts', queryParams],
    queryFn: async () => {
      // return await apiClient.get('/yatra/v1/discounts', { params: queryParams });
      // Dummy data
      const today = new Date();
      const getDate = (days: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
      };

      const allDiscounts: Discount[] = [
        {
          id: 1,
          code: 'SUMMER2024',
          description: 'Summer discount for all trips',
          type: 'percentage',
          amount: 15,
          max_discount_amount: 500,
          usage_limit: 100,
          usage_limit_per_customer: 1,
          usage_count: 45,
          valid_from: getDate(-30),
          expiry_date: getDate(30),
          status: 'active',
          applicable_to: 'all',
          min_amount: 100,
          first_time_customer_only: false,
          is_group_discount: true,
          min_group_size: 5,
          group_discount_type: 'percentage',
          group_discount_amount: 10,
          created_at: getDate(-60),
          updated_at: getDate(-5),
        },
        {
          id: 2,
          code: 'WELCOME10',
          description: 'Welcome discount for new customers',
          type: 'fixed',
          amount: 50,
          usage_limit: 500,
          usage_count: 234,
          expiry_date: getDate(90),
          status: 'active',
          applicable_to: 'all',
          min_amount: 200,
          created_at: getDate(-120),
          updated_at: getDate(-10),
        },
        {
          id: 3,
          code: 'EARLYBIRD',
          description: 'Early bird discount for specific premium trips',
          type: 'percentage',
          amount: 20,
          usage_limit: 50,
          usage_count: 50,
          expiry_date: getDate(-5),
          status: 'expired',
          applicable_to: 'specific_trips',
          trip_ids: [1, 2, 3],
          min_amount: 500,
          created_at: getDate(-180),
          updated_at: getDate(-5),
        },
        {
          id: 4,
          code: 'STUDENT15',
          description: 'Student discount for all trips',
          type: 'percentage',
          amount: 15,
          usage_limit: 200,
          usage_count: 89,
          status: 'active',
          applicable_to: 'all',
          min_amount: 150,
          created_at: getDate(-45),
          updated_at: getDate(-2),
        },
        {
          id: 5,
          code: 'FLAT25',
          description: 'Flat discount for all bookings',
          type: 'fixed',
          amount: 25,
          usage_limit: 1000,
          usage_count: 567,
          expiry_date: getDate(15),
          status: 'active',
          applicable_to: 'all',
          created_at: getDate(-30),
          updated_at: getDate(-1),
        },
        {
          id: 6,
          code: 'VIP30',
          description: 'VIP discount for premium trips only',
          type: 'percentage',
          amount: 30,
          usage_limit: 10,
          usage_count: 10,
          expiry_date: getDate(60),
          status: 'inactive',
          applicable_to: 'specific_trips',
          trip_ids: [5, 6],
          min_amount: 1000,
          created_at: getDate(-90),
          updated_at: getDate(-20),
        },
      ];

      // Apply filters
      let filtered = allDiscounts;
      if (searchTerm) {
        filtered = filtered.filter(discount =>
          discount.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (statusFilter !== 'all') {
        filtered = filtered.filter(discount => discount.status === statusFilter);
      }
      if (typeFilter !== 'all') {
        filtered = filtered.filter(discount => discount.type === typeFilter);
      }

      // Apply sorting
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'code':
            aValue = a.code.toLowerCase();
            bValue = b.code.toLowerCase();
            break;
          case 'type':
            aValue = a.type;
            bValue = b.type;
            break;
          case 'amount':
            aValue = a.amount;
            bValue = b.amount;
            break;
          case 'usage_count':
            aValue = a.usage_count;
            bValue = b.usage_count;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'expiry_date':
            aValue = a.expiry_date ? new Date(a.expiry_date).getTime() : 0;
            bValue = b.expiry_date ? new Date(b.expiry_date).getTime() : 0;
            break;
          case 'created_at':
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
          default:
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      // Apply pagination
      const start = (page - 1) * 10;
      const end = start + 10;
      const paginated = filtered.slice(start, end);

      return {
        data: paginated,
        total: filtered.length,
        page,
        per_page: 10,
      };
    },
    enabled: can('yatra_view_bookings'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (_id: number) => {
      // return await apiClient.delete(`/yatra/v1/discounts/${_id}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
  });

  const discounts = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'active': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Active', 'Active'),
      },
      'inactive': {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        label: __('Inactive', 'Inactive'),
      },
      'expired': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Expired', 'Expired'),
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
    if (confirm(__('Are you sure you want to delete this discount coupon?', 'Are you sure you want to delete this discount coupon?'))) {
      deleteMutation.mutate(discount.id);
    }
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
      <PageHeader
        title={__('Discount Coupons', 'Discount Coupons')}
        description={__('Create and manage discount coupons for your trips', 'Create and manage discount coupons for your trips')}
        actionCapability="yatra_edit_bookings"
        actions={
          <Button onClick={handleCreateDiscount} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Coupon', 'Add New Coupon')}
          </Button>
        }
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
        {/* Table */}
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
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {__('Loading discounts...', 'Loading discounts...')}
                  </div>
                ) : discounts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {__('No discount coupons found', 'No discount coupons found')}
                  </div>
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
                        <TableHead className="text-right w-[120px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discounts.map((discount) => (
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
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {discount.usage_count} / {discount.usage_limit === 0 ? '∞' : discount.usage_limit}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {discount.expiry_date ? formatDate(discount.expiry_date) : __('No expiry', 'No expiry')}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(discount.status)}
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

