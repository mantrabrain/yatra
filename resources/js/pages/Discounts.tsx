/**
 * Discounts Page
 * Manage discount coupons for trips
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Copy, Tag, Users, Lock } from 'lucide-react';
import { PremiumUpgradeDialog } from '../components/modules/PremiumUpgradeDialog';
import { Pagination, SearchFilterToolbar, BulkActionToolbar, Table as SharedTable } from '../components/shared';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api-client';
import { getErrorContext } from '../lib/errors';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Badge } from '../components/ui/badge';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { Modal } from '../components/ui/modal';

interface GroupDiscountRange {
  id: string;
  min_group_size: string;
  max_group_size: string;
  discount_type: 'percentage' | 'fixed';
  discount_amount: string;
}

interface CategoryDiscount {
  traveler_category_id: string;
  traveler_category_label: string;
  ranges: GroupDiscountRange[];
}

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
  status: 'publish' | 'draft' | 'trash' | 'expired';
  applicable_to: 'all' | 'specific_trips';
  trip_ids?: number[];
  min_amount?: number;
  first_time_customer_only?: boolean;
  is_group_discount?: boolean;
  discount_mode?: 'promo' | 'group' | 'both'; // Type of discount
  min_group_size?: number;
  group_discount_type?: 'percentage' | 'fixed';
  group_discount_amount?: number;
  group_discount_mode?: 'total' | 'category_based';
  group_discount_ranges?: GroupDiscountRange[];
  category_discounts?: CategoryDiscount[];
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
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [showDiscountTypeModal, setShowDiscountTypeModal] = useState(false);
  const [premiumDialog, setPremiumDialog] = useState<{ open: boolean; type: 'group' | 'both' | null }>({ open: false, type: null });
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        code: true,
        type: true,
        discount: true,
        usage: true,
        expiry_date: true,
        status: true,
      };
    }
    const saved = window.localStorage.getItem('yatra-discounts-visible-columns');
    return saved
      ? JSON.parse(saved)
      : {
          code: true,
          type: true,
          discount: true,
          usage: true,
          expiry_date: true,
          status: true,
        };
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

    if (typeFilter !== 'all') {
      params.type = typeFilter;
    }

    return params;
  }, [searchTerm, statusFilter, typeFilter, sortBy, sortOrder, page]);

  // Fetch discounts from API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['discounts', queryParams],
    queryFn: async () => {
      // Check URL parameter for error simulation (for testing)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('simulate_error') === 'true') {
        throw new Error('Simulated API error for testing error UI functionality');
      }
      
      const response = await apiClient.get('/discounts', { params: queryParams });
      return response;
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
  const itemsPerPage = 10;
  const totalPages = Math.ceil(total / itemsPerPage);

  // Enhanced error handling
  const errorContext = getErrorContext(error);
  const apiErrorMessage = (data as any)?.error || (data as any)?.message;
  const derivedErrorDetails =
    errorContext.details ||
    (apiErrorMessage ? String(apiErrorMessage) : undefined) ||
    (error ? String(error?.message || error) : undefined);
  const isDiscountsError = !!error || !!apiErrorMessage;

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


  const confirmDelete = () => {
    if (deleteConfirm.discount) {
      deleteMutation.mutate(deleteConfirm.discount.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      publish: {
        className:
          'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Publish', 'Publish'),
      },
      draft: {
        className:
          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        label: __('Draft', 'Draft'),
      },
      trash: {
        className:
          'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Trash', 'Trash'),
      },
      expired: {
        className:
          'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
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

  const handleEdit = (discount: Discount) => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=discounts&action=edit&id=${discount.id}`;
  };

  const handleDelete = (discount: Discount) => {
    setDeleteConfirm({ isOpen: true, discount });
  };

  const handleDuplicate = (discount: Discount) => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=discounts&action=create&duplicate=${discount.id}`;
  };

  const handleCreateDiscount = () => {
    setShowDiscountTypeModal(true);
  };

  // Check if Advanced Discount module is enabled (Pro plugin sets this flag via yatraAdmin)
  const isAdvancedDiscountEnabled = !!(window as any).yatraAdmin?.advancedDiscountEnabled;

  const handleSelectDiscountType = (type: 'promo' | 'group' | 'both') => {
    // Block group and both options if Advanced Discount module is not enabled - show premium dialog
    if ((type === 'group' || type === 'both') && !isAdvancedDiscountEnabled) {
      setPremiumDialog({ open: true, type });
      return;
    }
    setShowDiscountTypeModal(false);
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=discounts&action=create&discount_mode=${type}`;
  };
  
  // Get premium dialog content based on type
  const getPremiumDialogContent = () => {
    if (premiumDialog.type === 'group') {
      return {
        name: __('Group Discount', 'Group Discount'),
        description: __('Create powerful group discounts that automatically apply when customers book for multiple travelers. Set tiered pricing based on group size, offer category-specific discounts, and boost your group bookings without requiring promo codes.', 'Create powerful group discounts that automatically apply when customers book for multiple travelers. Set tiered pricing based on group size, offer category-specific discounts, and boost your group bookings without requiring promo codes.'),
        purchaseUrl: 'https://wpyatra.com/pricing?module=advanced-discount',
      };
    }
    return {
      name: __('Promo + Group Discount', 'Promo + Group Discount'),
      description: __('Combine the power of promo codes with automatic group discounts. Customers get a base discount with their promo code, plus additional savings when booking for groups. Perfect for maximizing conversions and encouraging larger bookings.', 'Combine the power of promo codes with automatic group discounts. Customers get a base discount with their promo code, plus additional savings when booking for groups. Perfect for maximizing conversions and encouraging larger bookings.'),
      purchaseUrl: 'https://wpyatra.com/pricing?module=advanced-discount',
    };
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

  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey as keyof typeof visibleColumns],
    };
    setVisibleColumns(newVisibleColumns);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('yatra-discounts-visible-columns', JSON.stringify(newVisibleColumns));
    }
  };

  const handleSelectItem = (id: string | number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(discounts.map((discount: Discount) => discount.id));
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected =
    discounts.length > 0 && selectedIds.length === discounts.length;

  const updateStatusForIds = async (
    ids: (string | number)[],
    newStatus: Discount['status']
  ) => {
    await Promise.all(
      ids.map((id) => {
        const discount = discounts.find((item: Discount) => item.id === id);
        if (!discount) {
          return Promise.resolve();
        }

        const payload: Partial<Discount> = {
          ...discount,
          status: newStatus,
        };

        return apiClient.put(`/discounts/${id}`, payload);
      })
    );
  };

  const handleBulkApply = async () => {
    if (!bulkAction || selectedIds.length === 0) {
      return;
    }

    try {
      setIsBulkPending(true);

      if (bulkAction === 'delete') {
        await Promise.all(
          selectedIds.map((id) => apiClient.delete(`/discounts/${id}`))
        );
        showToast(
          __('Selected discounts deleted successfully', 'Selected discounts deleted successfully'),
          'success'
        );
      } else {
        const newStatus = bulkAction as Discount['status'];
        await updateStatusForIds(selectedIds, newStatus);
        showToast(
          __('Bulk status updated successfully', 'Bulk status updated successfully'),
          'success'
        );
      }

      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      setSelectedIds([]);
      setBulkAction('');
    } catch (error: any) {
      showToast(
        error?.message ||
          __('Failed to perform bulk action on discounts', 'Failed to perform bulk action on discounts'),
        'error'
      );
    } finally {
      setIsBulkPending(false);
    }
  };

  const allBulkActionOptions = [
    { value: 'publish', label: __('Mark as Publish', 'Mark as Publish') },
    { value: 'draft', label: __('Mark as Draft', 'Mark as Draft') },
    { value: 'trash', label: __('Move to Trash', 'Move to Trash') },
    { value: 'expired', label: __('Mark as Expired', 'Mark as Expired') },
    { value: 'delete', label: __('Delete permanently', 'Delete permanently') },
  ];

  const getBulkActionOptionsForStatus = (view: string) => {
    switch (view) {
      case 'publish':
        return allBulkActionOptions.filter((opt) =>
          ['draft', 'trash', 'expired', 'delete'].includes(opt.value)
        );
      case 'draft':
        return allBulkActionOptions.filter((opt) =>
          ['publish', 'trash', 'expired', 'delete'].includes(opt.value)
        );
      case 'trash':
        return allBulkActionOptions.filter((opt) =>
          ['publish', 'draft', 'delete'].includes(opt.value)
        );
      case 'expired':
        return allBulkActionOptions.filter((opt) =>
          ['publish', 'draft', 'trash', 'delete'].includes(opt.value)
        );
      default:
        // "all" view: allow all actions
        return allBulkActionOptions;
    }
  };

  const bulkActionOptions = getBulkActionOptionsForStatus(statusFilter);

  const statusOptions = [
    { value: 'all', label: __('All Status', 'All Status') },
    { value: 'publish', label: __('Publish', 'Publish') },
    { value: 'draft', label: __('Draft', 'Draft') },
    { value: 'trash', label: __('Trash', 'Trash') },
    { value: 'expired', label: __('Expired', 'Expired') },
  ];

  const sortOptions = [
    { value: 'created_at', label: __('Created Date', 'Created Date') },
    { value: 'code', label: __('Code', 'Code') },
    { value: 'type', label: __('Type', 'Type') },
    { value: 'amount', label: __('Amount', 'Amount') },
    { value: 'usage_count', label: __('Usage', 'Usage') },
    { value: 'expiry_date', label: __('Expiry Date', 'Expiry Date') },
    { value: 'status', label: __('Status', 'Status') },
  ];

  const columnOptions = [
    {
      key: 'code',
      label: __('Coupon Code', 'Coupon Code'),
      visible: visibleColumns.code,
    },
    {
      key: 'type',
      label: __('Type', 'Type'),
      visible: visibleColumns.type,
    },
    {
      key: 'discount',
      label: __('Discount', 'Discount'),
      visible: visibleColumns.discount,
    },
    {
      key: 'usage',
      label: __('Usage', 'Usage'),
      visible: visibleColumns.usage,
    },
    {
      key: 'expiry_date',
      label: __('Expiry Date', 'Expiry Date'),
      visible: visibleColumns.expiry_date,
    },
    {
      key: 'status',
      label: __('Status', 'Status'),
      visible: visibleColumns.status,
    },
  ];

  const columns = [
    {
      key: 'code',
      label: __('Name / Code', 'Name / Code'),
      sortable: true,
      visible: visibleColumns.code,
      width: 'w-[280px]',
      render: (discount: Discount) => (
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {/* Discount Mode Badge */}
            {discount.discount_mode === 'group' ? (
              <Badge variant="success" className="text-xs flex items-center gap-1">
                <Users className="w-3 h-3" />
                {__('Group Only', 'Group Only')}
              </Badge>
            ) : discount.discount_mode === 'promo' ? (
              <Badge variant="info" className="text-xs flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {__('Promo Code', 'Promo Code')}
              </Badge>
            ) : discount.is_group_discount ? (
              <Badge variant="warning" className="text-xs flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <Users className="w-3 h-3" />
                {__('Promo + Group', 'Promo + Group')}
              </Badge>
            ) : (
              <Badge variant="info" className="text-xs flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {__('Promo Code', 'Promo Code')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <a
              href={`${baseAdminUrl}?page=yatra&subpage=discounts&action=edit&id=${discount.id}`}
              className="font-medium font-mono text-sm text-blue-600 dark:text-blue-400 hover:underline underline-offset-2"
            >
              {discount.code}
            </a>
          </div>
          {discount.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {discount.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      label: __('Discount', 'Discount'),
      sortable: true,
      visible: visibleColumns.type,
      render: (discount: Discount) => (
        <div className="space-y-1.5">
          {/* Base discount - only show if not group-only */}
          {discount.discount_mode !== 'group' && (
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-900 dark:text-white">
                {discount.type === 'percentage' ? `${discount.amount}%` : `$${discount.amount}`}
              </span>
              <span className="text-xs text-gray-500">
                {__('off', 'off')}
              </span>
            </div>
          )}
          {/* Group discount info */}
          {discount.is_group_discount && (
            <div className="space-y-1">
              {/* Category-based discounts */}
              {discount.group_discount_mode === 'category_based' && discount.category_discounts && discount.category_discounts.length > 0 ? (
                <div className="space-y-1">
                  {discount.category_discounts.map((cat, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{cat.traveler_category_label}:</span>
                      <span className="ml-1 text-green-600 dark:text-green-400">
                        {cat.ranges && cat.ranges.length > 0 ? (
                          cat.ranges.map((range, rIdx) => (
                            <span key={rIdx}>
                              {rIdx > 0 && ', '}
                              {range.min_group_size}{range.max_group_size ? `-${range.max_group_size}` : '+'}: 
                              {range.discount_type === 'percentage' ? `${range.discount_amount}%` : `$${range.discount_amount}`}
                            </span>
                          ))
                        ) : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : discount.group_discount_ranges && discount.group_discount_ranges.length > 0 ? (
                /* Total-based group discount ranges */
                <div className="space-y-0.5">
                  {discount.group_discount_ranges.map((range, idx) => (
                    <div key={idx} className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>
                        {range.min_group_size}{range.max_group_size ? `-${range.max_group_size}` : '+'} {__('pax', 'pax')}: 
                        {range.discount_type === 'percentage' ? ` ${range.discount_amount}%` : ` $${range.discount_amount}`} {__('off', 'off')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback for legacy data */
                <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {discount.min_group_size 
                    ? `${discount.min_group_size}+ ${__('travelers', 'travelers')}: ${discount.group_discount_type === 'percentage' ? `${discount.group_discount_amount}%` : `$${discount.group_discount_amount}`}`
                    : __('Group pricing', 'Group pricing')
                  }
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'usage',
      label: __('Usage', 'Usage'),
      sortable: true,
      visible: visibleColumns.usage,
      render: (discount: Discount) => (
        <div className="text-center">
          <Badge variant="outline" className="font-medium">
            {discount.usage_count} /{' '}
            {discount.usage_limit === 0 ? '∞' : discount.usage_limit}
          </Badge>
        </div>
      ),
    },
    {
      key: 'expiry_date',
      label: __('Expiry Date', 'Expiry Date'),
      sortable: true,
      visible: visibleColumns.expiry_date,
      render: (discount: Discount) => (
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {discount.expiry_date
            ? formatDate(discount.expiry_date)
            : __('No expiry', 'No expiry')}
        </span>
      ),
    },
    {
      key: 'status',
      label: __('Status', 'Status'),
      sortable: true,
      visible: visibleColumns.status,
      render: (discount: Discount) => getStatusBadge(discount.status),
    },
  ];

  const actions = [
    {
      key: 'duplicate',
      label: __('Duplicate', 'Duplicate'),
      icon: <Copy className="w-4 h-4" />,
      onClick: (discount: Discount) => handleDuplicate(discount),
    },
    {
      key: 'edit',
      label: __('Edit', 'Edit'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (discount: Discount) => handleEdit(discount),
    },
    {
      key: 'mark_publish',
      label: __('Mark as Publish', 'Mark as Publish'),
      icon: <ArrowUp className="w-4 h-4" />,
      onClick: async (discount: Discount) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([discount.id], 'publish');
          queryClient.invalidateQueries({ queryKey: ['discounts'] });
          showToast(
            __('Discount status updated', 'Discount status updated'),
            'success'
          );
        } catch (error: any) {
          showToast(
            error?.message ||
              __('Failed to update discount status', 'Failed to update discount status'),
            'error'
          );
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (discount: Discount) => discount.status !== 'publish',
    },
    {
      key: 'mark_draft',
      label: __('Mark as Draft', 'Mark as Draft'),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (discount: Discount) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([discount.id], 'draft');
          queryClient.invalidateQueries({ queryKey: ['discounts'] });
          showToast(
            __('Discount status updated', 'Discount status updated'),
            'success'
          );
        } catch (error: any) {
          showToast(
            error?.message ||
              __('Failed to update discount status', 'Failed to update discount status'),
            'error'
          );
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (discount: Discount) => discount.status !== 'draft',
    },
    {
      key: 'move_trash',
      label: __('Move to Trash', 'Move to Trash'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: async (discount: Discount) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([discount.id], 'trash');
          queryClient.invalidateQueries({ queryKey: ['discounts'] });
          showToast(
            __('Discount moved to trash', 'Discount moved to trash'),
            'success'
          );
        } catch (error: any) {
          showToast(
            error?.message ||
              __('Failed to move discount to trash', 'Failed to move discount to trash'),
            'error'
          );
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (discount: Discount) => discount.status !== 'trash',
    },
    {
      key: 'mark_expired',
      label: __('Mark as Expired', 'Mark as Expired'),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (discount: Discount) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([discount.id], 'expired');
          queryClient.invalidateQueries({ queryKey: ['discounts'] });
          showToast(
            __('Discount status updated', 'Discount status updated'),
            'success'
          );
        } catch (error: any) {
          showToast(
            error?.message ||
              __('Failed to update discount status', 'Failed to update discount status'),
            'error'
          );
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (discount: Discount) => discount.status !== 'expired',
    },
    {
      key: 'delete',
      label: __('Delete', 'Delete'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (discount: Discount) => handleDelete(discount),
      variant: 'destructive' as const,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Discount Type Selection Modal */}
      <Modal
        isOpen={showDiscountTypeModal}
        onClose={() => setShowDiscountTypeModal(false)}
        title={__('What type of discount do you want to create?', 'What type of discount do you want to create?')}
        description={__('Choose the discount type that best fits your needs', 'Choose the discount type that best fits your needs')}
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowDiscountTypeModal(false)}
            >
              {__('Cancel', 'Cancel')}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Promo Code Option */}
          <button
            onClick={() => handleSelectDiscountType('promo')}
            className="flex flex-col items-center p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group text-left"
          >
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
              <Tag className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {__('Promo Code', 'Promo Code')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {__('Customer enters a code to get a percentage or fixed discount', 'Customer enters a code to get a percentage or fixed discount')}
            </p>
          </button>

          {/* Group Discount Option */}
          <button
            onClick={() => handleSelectDiscountType('group')}
            className="relative flex flex-col items-center p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group text-left"
          >
            {!isAdvancedDiscountEnabled && (
              <div 
                className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-full shadow-md"
                style={{ background: 'linear-gradient(to right, #f59e0b, #f97316)', color: '#ffffff', border: '1px solid #fbbf24' }}
              >
                <Lock className="w-3 h-3" style={{ color: '#ffffff' }} />
                <span style={{ color: '#ffffff' }}>{__('Pro', 'Pro')}</span>
              </div>
            )}
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
              <Users className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {__('Group Discount', 'Group Discount')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {__('Auto-applies when booking multiple travelers. No code needed.', 'Auto-applies when booking multiple travelers. No code needed.')}
            </p>
          </button>

          {/* Both Option */}
          <button
            onClick={() => handleSelectDiscountType('both')}
            className="relative flex flex-col items-center p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group text-left"
          >
            {!isAdvancedDiscountEnabled && (
              <div 
                className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-full shadow-md"
                style={{ background: 'linear-gradient(to right, #f59e0b, #f97316)', color: '#ffffff', border: '1px solid #fbbf24' }}
              >
                <Lock className="w-3 h-3" style={{ color: '#ffffff' }} />
                <span style={{ color: '#ffffff' }}>{__('Pro', 'Pro')}</span>
              </div>
            )}
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
              <div className="flex -space-x-1">
                <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {__('Promo + Group', 'Promo + Group')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {__('Promo code gives base discount + extra savings for groups', 'Promo code gives base discount + extra savings for groups')}
            </p>
          </button>
        </div>
      </Modal>

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

      {/* Premium Upgrade Dialog for Group Discount features */}
      <PremiumUpgradeDialog
        open={premiumDialog.open}
        onClose={() => setPremiumDialog({ open: false, type: null })}
        moduleName={getPremiumDialogContent().name}
        moduleDescription={getPremiumDialogContent().description}
        purchaseUrl={getPremiumDialogContent().purchaseUrl}
      />

      <PageHeader
        title={__('Discounts', 'Discounts')}
        description={__('Create and manage discount coupons for your trips', 'Create and manage discount coupons for your trips')}
        actionCapability="yatra_edit_bookings"
        actions={
          <Button onClick={handleCreateDiscount} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Create Discount', 'Create Discount')}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <SearchFilterToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                statusOptions={statusOptions}
                sortBy={sortBy}
                onSortByChange={(field) => {
                  setSortBy(field);
                  setPage(1);
                }}
                sortOrder={sortOrder}
                onSortOrderChange={(order) => {
                  setSortOrder(order);
                  setPage(1);
                }}
                sortOptions={sortOptions}
                onResetFilters={handleResetFilters}
                hasFilters={!!hasFilters}
                placeholder={__('Search by code...', 'Search by code...')}
              />
            </div>

            <div className="w-full lg:w-auto flex lg:justify-end">
              <Select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full lg:w-48 max-w-xs"
              >
                <option value="all">{__('All Types', 'All Types')}</option>
                <option value="percentage">{__('Percentage', 'Percentage')}</option>
                <option value="fixed">{__('Fixed Amount', 'Fixed Amount')}</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_bookings">
        <>
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
            }}
            statusOptions={[
              {
                key: 'all',
                label: __('All', 'All'),
                count: 0,
              },
              {
                key: 'publish',
                label: __('Publish', 'Publish'),
                count: 0,
              },
              {
                key: 'draft',
                label: __('Draft', 'Draft'),
                count: 0,
              },
              {
                key: 'trash',
                label: __('Trash', 'Trash'),
                count: 0,
              },
              {
                key: 'expired',
                label: __('Expired', 'Expired'),
                count: 0,
              },
            ]}
            showColumnsDropdown={showColumnsDropdown}
            setShowColumnsDropdown={setShowColumnsDropdown}
            columnOptions={columnOptions}
            onToggleColumn={toggleColumn}
            bulkMutationPending={isBulkPending}
            totalItems={total}
            bulkActionOptions={bulkActionOptions}
          />

          <Card>
            <CardContent className="p-0">
              <SharedTable
                data={discounts}
                columns={columns}
                actions={actions}
                isLoading={isLoading}
                isError={isDiscountsError}
                errorText={__('Error loading discounts', 'Error loading discounts')}
                errorDescription={__('We couldn\'t connect to the discounts service. Please refresh or try again shortly.', 'We couldn\'t connect to the discounts service. Please refresh or try again shortly.')}
                errorDetails={derivedErrorDetails}
                errorRequestInfo={errorContext.requestInfo}
                onRetry={() => refetch()}
                emptyText={__('No discounts found', 'No discounts found')}
                emptyDescription={
                  hasFilters
                    ? __('Try adjusting your filters to see more results.', 'Try adjusting your filters to see more results.')
                    : __('Get started by creating your first discount coupon.', 'Get started by creating your first discount coupon.')
                }
                onCreateClick={
                  can('yatra_edit_bookings') ? handleCreateDiscount : undefined
                }
                onSort={handleSort}
                getSortIcon={getSortIcon}
                selectedItemIds={selectedIds}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                isAllSelected={isAllSelected}
                getItemId={(discount: Discount) => discount.id}
                skeletonRows={5}
                capability="yatra_view_bookings"
              />
            </CardContent>
          </Card>

            {total > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={itemsPerPage}
                onPageChange={(newPage) => setPage(newPage)}
                itemName={__('coupons', 'coupons')}
              />
            </div>
          )}
        </>
      </ConditionalRender>
    </div>
  );
}
;

export default Discounts;

