/**
 * Bookings Page
 * Clean, minimal SaaS-style bookings management page
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Trash2, AlertTriangle } from 'lucide-react';
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
import { Skeleton } from '../components/ui/skeleton';
import { getCurrencySymbol, getCurrency } from '../data/currencies';
import { formatDate as formatDateUtil } from '../lib/dateFormat';

interface Booking {
  id: number;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  trip_title: string;
  trip_id: number;
  booking_date: string;
  travel_date: string;
  travelers: number;
  total_amount: number;
  currency?: string;
  payment_status: string;
  booking_status: string;
  payment_method: string;
  created_at: string;
}

const Bookings: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('booking_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        booking_number: true,
        customer: true,
        trip: true,
        travelers: true,
        booking_date: true,
        travel_date: true,
        amount: true,
        payment_status: true,
        booking_status: true,
      };
    }
    const saved = window.localStorage.getItem('yatra-bookings-visible-columns');
    return saved
      ? JSON.parse(saved)
      : {
          booking_number: true,
          customer: true,
          trip: true,
          travelers: true,
          booking_date: true,
          travel_date: true,
          amount: true,
          payment_status: true,
          booking_status: true,
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
      params.status = statusFilter;
    }

    if (paymentFilter !== 'all') {
      params.payment_status = paymentFilter;
    }

    return params;
  }, [searchTerm, statusFilter, paymentFilter, sortBy, sortOrder, page]);

  // Fetch bookings from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings', queryParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(queryParams.page));
      params.append('per_page', String(queryParams.per_page));
      
      if (queryParams.search) {
        params.append('search', queryParams.search);
      }
      if (queryParams.status) {
        params.append('status', queryParams.status);
      }
      if (queryParams.payment_status) {
        params.append('payment_status', queryParams.payment_status);
      }

      const response = await fetch(`${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/bookings?${params.toString()}`, {
        headers: {
          'X-WP-Nonce': window.yatraAdmin?.nonce || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const result = await response.json();
      
      if (result.success) {
        // Debug: Log first 3 bookings to see what currency we're getting
        if (result.data.length > 0) {
          console.log('Bookings API Response - First 3:', result.data.slice(0, 3).map((b: any) => ({
            id: b.id,
            reference: b.reference,
            currency: b.currency,
            total_amount: b.total_amount
          })));
        }
        
        // Map API response to expected format
        const bookings = result.data.map((booking: any) => {
          console.log(`Booking ${booking.reference}: currency="${booking.currency}"`);
          return {
            id: booking.id,
            booking_number: booking.reference,
            customer_name: booking.customer_name || 'N/A',
            customer_email: booking.customer_email,
            trip_title: booking.trip_title || `Trip #${booking.trip_id}`,
            trip_id: booking.trip_id,
            booking_date: booking.created_at,
            travel_date: booking.travel_date,
            travelers: booking.travelers_count,
            total_amount: booking.total_amount,
            currency: booking.currency || 'USD',
            payment_status: booking.payment_status,
            booking_status: booking.status,
            payment_method: booking.payment_gateway,
            created_at: booking.created_at,
          };
        });

        return {
          data: bookings,
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
      const response = await fetch(`${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/bookings/${id}`, {
        method: 'DELETE',
        headers: {
          'X-WP-Nonce': window.yatraAdmin?.nonce || '',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast(__('Booking deleted successfully', 'Booking deleted successfully'), 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete booking', 'Failed to delete booking'), 'error');
    },
  });

  const bookings: Booking[] = data?.data || [];
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

  const getBookingStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'confirmed': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Confirmed', 'Confirmed'),
      },
      'pending': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: __('Pending', 'Pending'),
      },
      'cancelled': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Cancelled', 'Cancelled'),
      },
      'completed': {
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        label: __('Completed', 'Completed'),
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

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'paid': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Paid', 'Paid'),
      },
      'pending': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: __('Pending', 'Pending'),
      },
      'partial': {
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
        label: __('Partial', 'Partial'),
      },
      'refunded': {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        label: __('Refunded', 'Refunded'),
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

  const handleEdit = (booking: Booking) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings&action=edit&id=${booking.id}`;
  };

  const handleDelete = (booking: Booking) => {
    setBookingToDelete(booking);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (bookingToDelete) {
      deleteMutation.mutate(bookingToDelete.id);
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setBookingToDelete(null);
  };

  const handleView = (booking: Booking) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings&action=view&id=${booking.id}`;
  };

  const handleCreateBooking = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings&action=create`;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setSortBy('booking_date');
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

  const hasFilters = searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || sortBy !== 'booking_date' || sortOrder !== 'desc';

  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey as keyof typeof visibleColumns],
    };
    setVisibleColumns(newVisibleColumns);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('yatra-bookings-visible-columns', JSON.stringify(newVisibleColumns));
    }
  };

  const handleSelectItem = (id: string | number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id)));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(bookings.map((booking: Booking) => booking.id));
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected = bookings.length > 0 && selectedIds.length === bookings.length;

  const updateStatusForIds = async (
    ids: (string | number)[],
    newStatus: string
  ) => {
    await Promise.all(
      ids.map(async (id) => {
        const response = await fetch(`${apiBase}/bookings/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': (window as any)?.yatraAdmin?.nonce || '',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to update booking status');
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
            fetch(`${apiBase}/bookings/${id}`, {
              method: 'DELETE',
              headers: {
                'X-WP-Nonce': (window as any)?.yatraAdmin?.nonce || '',
              },
            })
          )
        );
        showToast(__('Selected bookings deleted successfully', 'Selected bookings deleted successfully'), 'success');
      } else {
        await updateStatusForIds(selectedIds, bulkAction);
        showToast(__('Bulk booking status updated successfully', 'Bulk booking status updated successfully'), 'success');
      }

      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setSelectedIds([]);
      setBulkAction('');
    } catch (error: any) {
      showToast(
        error?.message || __('Failed to perform bulk action on bookings', 'Failed to perform bulk action on bookings'),
        'error'
      );
    } finally {
      setIsBulkPending(false);
    }
  };

  const allBulkActionOptions = [
    { value: 'confirmed', label: __('Mark as Confirmed', 'Mark as Confirmed') },
    { value: 'pending', label: __('Mark as Pending', 'Mark as Pending') },
    { value: 'cancelled', label: __('Mark as Cancelled', 'Mark as Cancelled') },
    { value: 'completed', label: __('Mark as Completed', 'Mark as Completed') },
    { value: 'delete', label: __('Delete permanently', 'Delete permanently') },
  ];

  const getBulkActionOptionsForStatus = (view: string) => {
    switch (view) {
      case 'confirmed':
        return allBulkActionOptions.filter((opt) =>
          ['pending', 'cancelled', 'completed', 'delete'].includes(opt.value)
        );
      case 'pending':
        return allBulkActionOptions.filter((opt) =>
          ['confirmed', 'cancelled', 'completed', 'delete'].includes(opt.value)
        );
      case 'cancelled':
        return allBulkActionOptions.filter((opt) =>
          ['pending', 'confirmed', 'delete'].includes(opt.value)
        );
      case 'completed':
        return allBulkActionOptions.filter((opt) =>
          ['confirmed', 'cancelled', 'delete'].includes(opt.value)
        );
      default:
        return allBulkActionOptions;
    }
  };

  const bulkActionOptions = getBulkActionOptionsForStatus(statusFilter);

  const statusOptions = [
    { value: 'all', label: __('All Status', 'All Status') },
    { value: 'confirmed', label: __('Confirmed', 'Confirmed') },
    { value: 'pending', label: __('Pending', 'Pending') },
    { value: 'cancelled', label: __('Cancelled', 'Cancelled') },
    { value: 'completed', label: __('Completed', 'Completed') },
  ];

  const sortOptions = [
    { value: 'booking_date', label: __('Booking Date', 'Booking Date') },
    { value: 'travel_date', label: __('Travel Date', 'Travel Date') },
    { value: 'booking_number', label: __('Booking Number', 'Booking Number') },
    { value: 'customer_name', label: __('Customer', 'Customer') },
    { value: 'trip_title', label: __('Trip', 'Trip') },
    { value: 'total_amount', label: __('Amount', 'Amount') },
    { value: 'booking_status', label: __('Status', 'Status') },
  ];

  const columnOptions = [
    { key: 'booking_number', label: __('Booking #', 'Booking #'), visible: visibleColumns.booking_number },
    { key: 'customer', label: __('Customer', 'Customer'), visible: visibleColumns.customer },
    { key: 'trip', label: __('Trip', 'Trip'), visible: visibleColumns.trip },
    { key: 'travelers', label: __('Travelers', 'Travelers'), visible: visibleColumns.travelers },
    { key: 'booking_date', label: __('Booking Date', 'Booking Date'), visible: visibleColumns.booking_date },
    { key: 'travel_date', label: __('Travel Date', 'Travel Date'), visible: visibleColumns.travel_date },
    { key: 'amount', label: __('Amount', 'Amount'), visible: visibleColumns.amount },
    { key: 'payment_status', label: __('Payment', 'Payment'), visible: visibleColumns.payment_status },
    { key: 'booking_status', label: __('Status', 'Status'), visible: visibleColumns.booking_status },
  ];

  const columns = [
    {
      key: 'booking_number',
      label: __('Booking #', 'Booking #'),
      sortable: true,
      visible: visibleColumns.booking_number,
      width: 'w-[140px]',
      render: (booking: Booking) => (
        <button
          type="button"
          onClick={() => handleView(booking)}
          className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
        >
          {booking.booking_number}
        </button>
      ),
    },
    {
      key: 'customer',
      label: __('Customer', 'Customer'),
      sortable: true,
      visible: visibleColumns.customer,
      render: (booking: Booking) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {booking.customer_name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {booking.customer_email}
          </div>
        </div>
      ),
    },
    {
      key: 'trip',
      label: __('Trip', 'Trip'),
      sortable: true,
      visible: visibleColumns.trip,
      render: (booking: Booking) => (
        <span className="text-gray-900 dark:text-white">{booking.trip_title}</span>
      ),
    },
    {
      key: 'travelers',
      label: __('Travelers', 'Travelers'),
      sortable: false,
      visible: visibleColumns.travelers,
      render: (booking: Booking) => (
        <span className="text-gray-600 dark:text-gray-400">{booking.travelers}</span>
      ),
    },
    {
      key: 'booking_date',
      label: __('Booking Date', 'Booking Date'),
      sortable: true,
      visible: visibleColumns.booking_date,
      render: (booking: Booking) => (
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {formatDate(booking.booking_date)}
        </span>
      ),
    },
    {
      key: 'travel_date',
      label: __('Travel Date', 'Travel Date'),
      sortable: true,
      visible: visibleColumns.travel_date,
      render: (booking: Booking) => (
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {formatDate(booking.travel_date)}
        </span>
      ),
    },
    {
      key: 'amount',
      label: __('Amount', 'Amount'),
      sortable: true,
      visible: visibleColumns.amount,
      render: (booking: Booking) => (
        <span className="font-medium">
          {formatPrice(booking.total_amount, booking.currency || defaultCurrency)}
        </span>
      ),
    },
    {
      key: 'payment_status',
      label: __('Payment', 'Payment'),
      sortable: true,
      visible: visibleColumns.payment_status,
      render: (booking: Booking) => getPaymentStatusBadge(booking.payment_status),
    },
    {
      key: 'booking_status',
      label: __('Status', 'Status'),
      sortable: true,
      visible: visibleColumns.booking_status,
      render: (booking: Booking) => getBookingStatusBadge(booking.booking_status),
    },
  ];

  const actions = [
    {
      key: 'view',
      label: __('View', 'View'),
      icon: <Eye className="w-4 h-4" />,
      onClick: (booking: Booking) => handleView(booking),
    },
    {
      key: 'edit',
      label: __('Edit', 'Edit'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (booking: Booking) => handleEdit(booking),
      condition: () => can('yatra_edit_bookings'),
    },
    {
      key: 'mark_confirmed',
      label: __('Mark as Confirmed', 'Mark as Confirmed'),
      icon: <ArrowUp className="w-4 h-4" />,
      onClick: async (booking: Booking) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([booking.id], 'confirmed');
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          showToast(__('Booking status updated', 'Booking status updated'), 'success');
        } catch (error: any) {
          showToast(error?.message || __('Failed to update booking status', 'Failed to update booking status'), 'error');
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (booking: Booking) => can('yatra_edit_bookings') && booking.booking_status !== 'confirmed',
    },
    {
      key: 'mark_pending',
      label: __('Mark as Pending', 'Mark as Pending'),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (booking: Booking) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([booking.id], 'pending');
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          showToast(__('Booking status updated', 'Booking status updated'), 'success');
        } catch (error: any) {
          showToast(error?.message || __('Failed to update booking status', 'Failed to update booking status'), 'error');
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (booking: Booking) => can('yatra_edit_bookings') && booking.booking_status !== 'pending',
    },
    {
      key: 'mark_cancelled',
      label: __('Mark as Cancelled', 'Mark as Cancelled'),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (booking: Booking) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([booking.id], 'cancelled');
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          showToast(__('Booking status updated', 'Booking status updated'), 'success');
        } catch (error: any) {
          showToast(error?.message || __('Failed to update booking status', 'Failed to update booking status'), 'error');
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (booking: Booking) => can('yatra_edit_bookings') && booking.booking_status !== 'cancelled',
    },
    {
      key: 'mark_completed',
      label: __('Mark as Completed', 'Mark as Completed'),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (booking: Booking) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([booking.id], 'completed');
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          showToast(__('Booking status updated', 'Booking status updated'), 'success');
        } catch (error: any) {
          showToast(error?.message || __('Failed to update booking status', 'Failed to update booking status'), 'error');
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (booking: Booking) => can('yatra_edit_bookings') && booking.booking_status !== 'completed',
    },
    {
      key: 'delete',
      label: __('Delete', 'Delete'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (booking: Booking) => handleDelete(booking),
      variant: 'destructive' as const,
      condition: () => can('yatra_delete_bookings'),
    },
  ];

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Bookings', 'Bookings')}
        description={__('Manage customer bookings and reservations', 'Manage customer bookings and reservations')}
        actionCapability="yatra_edit_bookings"
        actions={
          <Button onClick={handleCreateBooking} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Create Booking', 'Create Booking')}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center w-full">
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
                placeholder={__('Search bookings...', 'Search bookings...')}
              />
            </div>

            {/* Payment Status Filter */}
            <div className="w-full lg:w-auto lg:min-w-[160px]">
              <Select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              >
                <option value="all">{__('All Payments', 'All Payments')}</option>
                <option value="paid">{__('Paid', 'Paid')}</option>
                <option value="pending">{__('Pending', 'Pending')}</option>
                <option value="partial">{__('Partial', 'Partial')}</option>
                <option value="refunded">{__('Refunded', 'Refunded')}</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_bookings">
        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              {__('Error loading bookings', 'Error loading bookings')}
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
                { key: 'confirmed', label: __('Confirmed', 'Confirmed'), count: 0 },
                { key: 'pending', label: __('Pending', 'Pending'), count: 0 },
                { key: 'cancelled', label: __('Cancelled', 'Cancelled'), count: 0 },
                { key: 'completed', label: __('Completed', 'Completed'), count: 0 },
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
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <Skeleton className="h-4 w-24" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <div className="flex gap-1">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <SharedTable
                    data={bookings}
                    columns={columns}
                    actions={actions}
                    isLoading={isLoading}
                    isError={!!error}
                    errorText={__('Error loading bookings', 'Error loading bookings')}
                    emptyText={__('No bookings found', 'No bookings found')}
                    emptyDescription={
                      hasFilters
                        ? __('Try adjusting your filters to see more results.', 'Try adjusting your filters to see more results.')
                        : __('Get started by creating your first booking.', 'Get started by creating your first booking.')
                    }
                    onCreateClick={
                      can('yatra_edit_bookings') ? handleCreateBooking : undefined
                    }
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                    selectedItemIds={selectedIds}
                    onSelectItem={handleSelectItem}
                    onSelectAll={handleSelectAll}
                    isAllSelected={isAllSelected}
                    getItemId={(booking: Booking) => booking.id}
                    skeletonRows={5}
                    capability="yatra_view_bookings"
                  />
                )}
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
                  itemName={__('bookings', 'bookings')}
                />
              </div>
            )}
          </>
        )}
      </ConditionalRender>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title={__('Delete Booking', 'Delete Booking')}
        description={
          bookingToDelete
            ? __(`Are you sure you want to delete booking "${bookingToDelete.booking_number}"? This action cannot be undone.`, `Are you sure you want to delete booking "${bookingToDelete.booking_number}"? This action cannot be undone.`)
            : __('Are you sure you want to delete this booking?', 'Are you sure you want to delete this booking?')
        }
        confirmText={__('Delete', 'Delete')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
        icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
      />
    </div>
  );
};

export default Bookings;

