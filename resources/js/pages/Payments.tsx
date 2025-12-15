/**
 * Payments Page
 * Manage payments for bookings
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Eye, CreditCard } from 'lucide-react';
import { Pagination, SearchFilterToolbar, BulkActionToolbar, Table as SharedTable } from '../components/shared';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { getCurrencySymbol, getCurrency } from '../data/currencies';
import { formatDate as formatDateUtil } from '../lib/dateFormat';

interface Payment {
  id: number;
  payment_number: string;
  booking_id: number;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  trip_title: string;
  amount: number;
  currency?: string;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partial' | 'cancelled';
  transaction_id?: string;
  payment_date: string;
  notes?: string;
  created_at: string;
}

const Payments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('payment_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; payment: Payment | null }>({
    isOpen: false,
    payment: null,
  });
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        payment: true,
        customer: true,
        booking: true,
        amount: true,
        method: true,
        status: true,
        date: true,
      };
    }
    const saved = window.localStorage.getItem('yatra-payments-visible-columns');
    return saved
      ? JSON.parse(saved)
      : {
          payment: true,
          customer: true,
          booking: true,
          amount: true,
          method: true,
          status: true,
          date: true,
        };
  });
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const defaultCurrency = (window as any)?.yatraAdmin?.currency || (window as any)?.yatraBookingData?.currency || 'USD';
  const apiBase = (window as any)?.yatraAdmin?.apiUrl || '/wp-json/yatra/v1';

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
      params.payment_status = statusFilter;
    }

    if (methodFilter !== 'all') {
      params.payment_method = methodFilter;
    }

    return params;
  }, [searchTerm, statusFilter, methodFilter, sortBy, sortOrder, page]);

  // Fetch payments from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', queryParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(queryParams.page));
      params.append('per_page', String(queryParams.per_page));
      
      if (queryParams.search) {
        params.append('search', queryParams.search);
      }
      if (queryParams.payment_status) {
        params.append('status', queryParams.payment_status);
      }
      if (queryParams.payment_method) {
        params.append('gateway', queryParams.payment_method);
      }

      const response = await fetch(`${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/payments?${params.toString()}`, {
        headers: {
          'X-WP-Nonce': window.yatraAdmin?.nonce || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const result = await response.json();
      
      if (result.success) {
        // Map API response to expected format
        const payments = result.data.map((payment: any) => ({
          id: payment.id,
          payment_number: `PAY-${payment.id.toString().padStart(6, '0')}`,
          booking_id: payment.booking_id,
          booking_number: payment.booking_reference || `#${payment.booking_id}`,
          customer_name: payment.customer_name || 'N/A',
          customer_email: payment.customer_email || '',
          trip_title: payment.trip_title || '',
          amount: payment.amount,
          currency: payment.currency || 'USD',
          payment_method: payment.gateway,
          payment_status: payment.status,
          transaction_id: payment.transaction_id,
          payment_date: payment.processed_at || payment.created_at,
          notes: payment.notes,
          created_at: payment.created_at,
        }));

        return {
          data: payments,
          total: result.meta.total,
          page: result.meta.page,
          per_page: result.meta.per_page,
        };
      }

      return { data: [], total: 0, page: 1, per_page: 10 };
    },
    enabled: can('yatra_view_bookings'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/payments/${id}`, {
        method: 'DELETE',
        headers: {
          'X-WP-Nonce': window.yatraAdmin?.nonce || '',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete payment');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete payment');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast(__('Payment deleted successfully', 'Payment deleted successfully'), 'success');
      setDeleteConfirm({ isOpen: false, payment: null });
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete payment', 'Failed to delete payment'), 'error');
    },
  });

  const payments: Payment[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString);
  };

  const formatPrice = (price: number, currencyCode: string = defaultCurrency) => {
    const symbol = getCurrencySymbol(currencyCode);
    const currencyData = getCurrency(currencyCode);
    const decimals = currencyData?.decimalDigits ?? 2;
    
    return `${symbol}${new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(price)}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'completed': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Completed', 'Completed'),
      },
      'pending': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: __('Pending', 'Pending'),
      },
      'partial': {
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        label: __('Partial', 'Partial'),
      },
      'failed': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Failed', 'Failed'),
      },
      'refunded': {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        label: __('Refunded', 'Refunded'),
      },
      'cancelled': {
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
        label: __('Cancelled', 'Cancelled'),
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

  const handleEdit = (payment: Payment) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=payments&action=edit&id=${payment.id}`;
  };

  const handleDelete = (payment: Payment) => {
    setDeleteConfirm({ isOpen: true, payment });
  };

  const confirmDelete = () => {
    if (deleteConfirm.payment) {
      deleteMutation.mutate(deleteConfirm.payment.id);
    }
  };

  const handleView = (payment: Payment) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=payments&action=view&id=${payment.id}`;
  };

  const handleCreatePayment = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=payments&action=create`;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setMethodFilter('all');
    setSortBy('payment_date');
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

  const hasFilters = searchTerm || statusFilter !== 'all' || methodFilter !== 'all' || sortBy !== 'payment_date' || sortOrder !== 'desc';

  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey as keyof typeof visibleColumns],
    };
    setVisibleColumns(newVisibleColumns);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('yatra-payments-visible-columns', JSON.stringify(newVisibleColumns));
    }
  };

  const handleSelectItem = (id: string | number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id)));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(payments.map((payment: Payment) => payment.id));
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected = payments.length > 0 && selectedIds.length === payments.length;

  const updateStatusForIds = async (
    ids: (string | number)[],
    newStatus: Payment['payment_status']
  ) => {
    await Promise.all(
      ids.map(async (id) => {
        const response = await fetch(`${apiBase}/payments/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': (window as any)?.yatraAdmin?.nonce || '',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to update payment status');
        }
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
          selectedIds.map((id) =>
            fetch(`${apiBase}/payments/${id}`, {
              method: 'DELETE',
              headers: {
                'X-WP-Nonce': (window as any)?.yatraAdmin?.nonce || '',
              },
            })
          )
        );
        showToast(__('Selected payments deleted successfully', 'Selected payments deleted successfully'), 'success');
      } else {
        const newStatus = bulkAction as Payment['payment_status'];
        await updateStatusForIds(selectedIds, newStatus);
        showToast(__('Bulk status updated successfully', 'Bulk status updated successfully'), 'success');
      }

      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setSelectedIds([]);
      setBulkAction('');
    } catch (error: any) {
      showToast(
        error?.message || __('Failed to perform bulk action on payments', 'Failed to perform bulk action on payments'),
        'error'
      );
    } finally {
      setIsBulkPending(false);
    }
  };

  const allBulkActionOptions = [
    { value: 'completed', label: __('Mark as Completed', 'Mark as Completed') },
    { value: 'failed', label: __('Mark as Failed', 'Mark as Failed') },
    { value: 'refunded', label: __('Mark as Refunded', 'Mark as Refunded') },
    { value: 'cancelled', label: __('Mark as Cancelled', 'Mark as Cancelled') },
    { value: 'delete', label: __('Delete permanently', 'Delete permanently') },
  ];

  const getBulkActionOptionsForStatus = (view: string) => {
    switch (view) {
      case 'completed':
        return allBulkActionOptions.filter((opt) =>
          ['failed', 'refunded', 'cancelled', 'delete'].includes(opt.value)
        );
      case 'pending':
        return allBulkActionOptions.filter((opt) =>
          ['completed', 'failed', 'cancelled', 'delete'].includes(opt.value)
        );
      case 'partial':
        return allBulkActionOptions.filter((opt) =>
          ['completed', 'cancelled', 'delete'].includes(opt.value)
        );
      case 'failed':
        return allBulkActionOptions.filter((opt) =>
          ['completed', 'cancelled', 'delete'].includes(opt.value)
        );
      case 'refunded':
        return allBulkActionOptions.filter((opt) =>
          ['completed', 'cancelled', 'delete'].includes(opt.value)
        );
      case 'cancelled':
        return allBulkActionOptions.filter((opt) =>
          ['completed', 'delete'].includes(opt.value)
        );
      default:
        return allBulkActionOptions;
    }
  };

  const bulkActionOptions = getBulkActionOptionsForStatus(statusFilter);

  const statusOptions = [
    { value: 'all', label: __('All Status', 'All Status') },
    { value: 'completed', label: __('Completed', 'Completed') },
    { value: 'partial', label: __('Partial', 'Partial') },
    { value: 'failed', label: __('Failed', 'Failed') },
    { value: 'refunded', label: __('Refunded', 'Refunded') },
    { value: 'cancelled', label: __('Cancelled', 'Cancelled') },
  ];

  const sortOptions = [
    { value: 'payment_date', label: __('Payment Date', 'Payment Date') },
    { value: 'payment_number', label: __('Payment Number', 'Payment Number') },
    { value: 'customer_name', label: __('Customer', 'Customer') },
    { value: 'amount', label: __('Amount', 'Amount') },
    { value: 'payment_method', label: __('Payment Method', 'Payment Method') },
    { value: 'payment_status', label: __('Status', 'Status') },
  ];

  const columnOptions = [
    { key: 'payment', label: __('Payment', 'Payment'), visible: visibleColumns.payment },
    { key: 'customer', label: __('Customer', 'Customer'), visible: visibleColumns.customer },
    { key: 'booking', label: __('Booking', 'Booking'), visible: visibleColumns.booking },
    { key: 'amount', label: __('Amount', 'Amount'), visible: visibleColumns.amount },
    { key: 'method', label: __('Method', 'Method'), visible: visibleColumns.method },
    { key: 'status', label: __('Status', 'Status'), visible: visibleColumns.status },
    { key: 'date', label: __('Date', 'Date'), visible: visibleColumns.date },
  ];

  const columns = [
    {
      key: 'payment',
      label: __('Payment', 'Payment'),
      sortable: true,
      visible: visibleColumns.payment,
      width: 'w-[220px]',
      render: (payment: Payment) => (
        <div>
          <button
            type="button"
            onClick={() => handleView(payment)}
            className="flex items-center gap-2 mb-1 group cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300" />
            <span className="font-medium text-blue-600 dark:text-blue-400 font-mono text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300 group-hover:underline">
              {payment.payment_number}
            </span>
          </button>
          {payment.transaction_id && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {__('TXN', 'TXN')}: {payment.transaction_id}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'customer',
      label: __('Customer', 'Customer'),
      sortable: true,
      visible: visibleColumns.customer,
      render: (payment: Payment) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {payment.customer_name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {payment.customer_email}
          </div>
        </div>
      ),
    },
    {
      key: 'booking',
      label: __('Booking', 'Booking'),
      sortable: false,
      visible: visibleColumns.booking,
      render: (payment: Payment) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {payment.booking_number}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {payment.trip_title}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: __('Amount', 'Amount'),
      sortable: true,
      visible: visibleColumns.amount,
      render: (payment: Payment) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatPrice(payment.amount, payment.currency || defaultCurrency)}
        </span>
      ),
    },
    {
      key: 'method',
      label: __('Method', 'Method'),
      sortable: true,
      visible: visibleColumns.method,
      render: (payment: Payment) => (
        <span className="text-gray-600 dark:text-gray-400">
          {payment.payment_method}
        </span>
      ),
    },
    {
      key: 'status',
      label: __('Status', 'Status'),
      sortable: true,
      visible: visibleColumns.status,
      render: (payment: Payment) => getStatusBadge(payment.payment_status),
    },
    {
      key: 'date',
      label: __('Date', 'Date'),
      sortable: true,
      visible: visibleColumns.date,
      render: (payment: Payment) => (
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {formatDate(payment.payment_date)}
        </span>
      ),
    },
  ];

  const actions = [
    {
      key: 'view',
      label: __('View', 'View'),
      icon: <Eye className="w-4 h-4" />,
      onClick: (payment: Payment) => handleView(payment),
    },
    {
      key: 'edit',
      label: __('Edit', 'Edit'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (payment: Payment) => handleEdit(payment),
    },
    {
      key: 'mark_completed',
      label: __('Mark as Completed', 'Mark as Completed'),
      icon: <ArrowUp className="w-4 h-4" />,
      onClick: async (payment: Payment) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([payment.id], 'completed');
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          showToast(__('Payment status updated', 'Payment status updated'), 'success');
        } catch (error: any) {
          showToast(error?.message || __('Failed to update payment status', 'Failed to update payment status'), 'error');
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (payment: Payment) => can('yatra_edit_bookings') && payment.payment_status !== 'completed',
    },
    {
      key: 'mark_failed',
      label: __('Mark as Failed', 'Mark as Failed'),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (payment: Payment) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([payment.id], 'failed');
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          showToast(__('Payment status updated', 'Payment status updated'), 'success');
        } catch (error: any) {
          showToast(error?.message || __('Failed to update payment status', 'Failed to update payment status'), 'error');
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (payment: Payment) => can('yatra_edit_bookings') && payment.payment_status !== 'failed',
    },
    {
      key: 'mark_refunded',
      label: __('Mark as Refunded', 'Mark as Refunded'),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (payment: Payment) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([payment.id], 'refunded');
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          showToast(__('Payment status updated', 'Payment status updated'), 'success');
        } catch (error: any) {
          showToast(error?.message || __('Failed to update payment status', 'Failed to update payment status'), 'error');
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (payment: Payment) => can('yatra_edit_bookings') && payment.payment_status !== 'refunded',
    },
    {
      key: 'mark_cancelled',
      label: __('Mark as Cancelled', 'Mark as Cancelled'),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (payment: Payment) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([payment.id], 'cancelled');
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          showToast(__('Payment status updated', 'Payment status updated'), 'success');
        } catch (error: any) {
          showToast(error?.message || __('Failed to update payment status', 'Failed to update payment status'), 'error');
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (payment: Payment) => can('yatra_edit_bookings') && payment.payment_status !== 'cancelled',
    },
    {
      key: 'delete',
      label: __('Delete', 'Delete'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (payment: Payment) => handleDelete(payment),
      variant: 'destructive' as const,
    },
  ];

  return (
    <div className="space-y-3">
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, payment: null })}
        onConfirm={confirmDelete}
        title={__('Delete Payment', 'Delete Payment')}
        message={deleteConfirm.payment
          ? __('Are you sure you want to delete payment "{number}"? This action cannot be undone.', 'Are you sure you want to delete payment "{number}"? This action cannot be undone.').replace('{number}', deleteConfirm.payment.payment_number)
          : __('Are you sure you want to delete this payment? This action cannot be undone.', 'Are you sure you want to delete this payment? This action cannot be undone.')}
        confirmText={__('Delete', 'Delete')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <PageHeader
        title={__('Payments', 'Payments')}
        description={__('Manage payment records for bookings', 'Manage payment records for bookings')}
        actionCapability="yatra_edit_bookings"
        actions={
          <Button onClick={handleCreatePayment} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Payment', 'Add New Payment')}
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
                placeholder={__('Search payments...', 'Search payments...')}
              />
            </div>

            <div className="w-full lg:w-auto flex lg:justify-end">
              <Select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full lg:w-48 max-w-xs"
              >
                <option value="all">{__('All Methods', 'All Methods')}</option>
                <option value="Credit Card">{__('Credit Card', 'Credit Card')}</option>
                <option value="PayPal">{__('PayPal', 'PayPal')}</option>
                <option value="Bank Transfer">{__('Bank Transfer', 'Bank Transfer')}</option>
                <option value="Cash">{__('Cash', 'Cash')}</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_bookings">
        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              {__('Error loading payments', 'Error loading payments')}
            </CardContent>
          </Card>
        ) : (
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
                { key: 'all', label: __('All', 'All'), count: 0 },
                { key: 'completed', label: __('Completed', 'Completed'), count: 0 },
                { key: 'pending', label: __('Pending', 'Pending'), count: 0 },
                { key: 'partial', label: __('Partial', 'Partial'), count: 0 },
                { key: 'failed', label: __('Failed', 'Failed'), count: 0 },
                { key: 'refunded', label: __('Refunded', 'Refunded'), count: 0 },
                { key: 'cancelled', label: __('Cancelled', 'Cancelled'), count: 0 },
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
                  data={payments}
                  columns={columns}
                  actions={actions}
                  isLoading={isLoading}
                  isError={!!error}
                  errorText={__('Error loading payments', 'Error loading payments')}
                  emptyText={__('No payments found', 'No payments found')}
                  emptyDescription={
                    hasFilters
                      ? __('Try adjusting your filters to see more results.', 'Try adjusting your filters to see more results.')
                      : __('Get started by recording your first payment.', 'Get started by recording your first payment.')
                  }
                  onCreateClick={
                    can('yatra_edit_bookings') ? handleCreatePayment : undefined
                  }
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                  selectedItemIds={selectedIds}
                  onSelectItem={handleSelectItem}
                  onSelectAll={handleSelectAll}
                  isAllSelected={isAllSelected}
                  getItemId={(payment: Payment) => payment.id}
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
                  itemsPerPage={10}
                  onPageChange={(newPage) => setPage(newPage)}
                  itemName={__('payments', 'payments')}
                />
              </div>
            )}
          </>
        )}
      </ConditionalRender>
    </div>
  );
};

export default Payments;

