/**
 * Bookings Page
 * Clean, minimal SaaS-style bookings management page
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ConditionalRender } from '../components/ui/conditional-render';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { Skeleton } from '../components/ui/skeleton';
import { getCurrencySymbol, getCurrency } from '../data/currencies';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const defaultCurrency = (window as any)?.yatraAdmin?.currency || (window as any)?.yatraBookingData?.currency || 'USD';

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
    },
  });

  const bookings: Booking[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

      {/* Filters, Search, and Sorting - Always Visible */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center w-full">
            {/* Search */}
            <div className="flex-1 min-w-0 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder={__('Search bookings...', 'Search bookings...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Booking Status Filter */}
            <div className="w-full lg:w-auto lg:min-w-[160px]">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full"
              >
                <option value="all">{__('All Status', 'All Status')}</option>
                <option value="confirmed">{__('Confirmed', 'Confirmed')}</option>
                <option value="pending">{__('Pending', 'Pending')}</option>
                <option value="cancelled">{__('Cancelled', 'Cancelled')}</option>
                <option value="completed">{__('Completed', 'Completed')}</option>
              </Select>
            </div>

            {/* Payment Status Filter */}
            <div className="w-full lg:w-auto lg:min-w-[160px]">
              <Select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full"
              >
                <option value="all">{__('All Payments', 'All Payments')}</option>
                <option value="paid">{__('Paid', 'Paid')}</option>
                <option value="pending">{__('Pending', 'Pending')}</option>
                <option value="partial">{__('Partial', 'Partial')}</option>
                <option value="refunded">{__('Refunded', 'Refunded')}</option>
              </Select>
            </div>

            {/* Sort By */}
            <div className="w-full lg:w-auto lg:min-w-[160px]">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full"
              >
                <option value="booking_date">{__('Booking Date', 'Booking Date')}</option>
                <option value="travel_date">{__('Travel Date', 'Travel Date')}</option>
                <option value="booking_number">{__('Booking Number', 'Booking Number')}</option>
                <option value="customer_name">{__('Customer', 'Customer')}</option>
                <option value="trip_title">{__('Trip', 'Trip')}</option>
                <option value="total_amount">{__('Amount', 'Amount')}</option>
                <option value="booking_status">{__('Status', 'Status')}</option>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="w-full lg:w-auto lg:flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 flex items-center gap-2 w-full lg:w-auto"
                title={sortOrder === 'asc' ? __('Ascending', 'Ascending') : __('Descending', 'Descending')}
              >
                {sortOrder === 'asc' ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                <span className="text-sm whitespace-nowrap">{sortOrder === 'asc' ? __('Asc', 'Asc') : __('Desc', 'Desc')}</span>
              </Button>
            </div>

            {/* Reset Button */}
            {hasFilters && (
              <div className="w-full lg:w-auto lg:flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="flex items-center gap-2 w-full lg:w-auto"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm">{__('Reset', 'Reset')}</span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_bookings">
        {/* Table */}
        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              {__('Error loading bookings', 'Error loading bookings')}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
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
                ) : bookings.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {__('No bookings found', 'No bookings found')}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">
                          <button
                            onClick={() => handleSort('booking_number')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Booking #', 'Booking #')}
                            {getSortIcon('booking_number')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('customer_name')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Customer', 'Customer')}
                            {getSortIcon('customer_name')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('trip_title')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Trip', 'Trip')}
                            {getSortIcon('trip_title')}
                          </button>
                        </TableHead>
                        <TableHead>{__('Travelers', 'Travelers')}</TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('booking_date')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Booking Date', 'Booking Date')}
                            {getSortIcon('booking_date')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('travel_date')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Travel Date', 'Travel Date')}
                            {getSortIcon('travel_date')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('total_amount')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Amount', 'Amount')}
                            {getSortIcon('total_amount')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('payment_status')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Payment', 'Payment')}
                            {getSortIcon('payment_status')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('booking_status')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Status', 'Status')}
                            {getSortIcon('booking_status')}
                          </button>
                        </TableHead>
                        <TableHead className="text-right w-[100px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium text-gray-900 dark:text-white">
                            {booking.booking_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {booking.customer_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {booking.customer_email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            {booking.trip_title}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {booking.travelers}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {formatDate(booking.booking_date)}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {formatDate(booking.travel_date)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(booking.total_amount, booking.currency || defaultCurrency)}
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(booking.payment_status)}
                          </TableCell>
                          <TableCell>
                            {getBookingStatusBadge(booking.booking_status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <ConditionalRender capability="yatra_view_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(booking)}
                                  className="h-8 w-8"
                                  aria-label={__('View booking', 'View booking')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>

                              <ConditionalRender capability="yatra_edit_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(booking)}
                                  className="h-8 w-8"
                                  aria-label={__('Edit booking', 'Edit booking')}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>

                              <ConditionalRender capability="yatra_delete_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(booking)}
                                  className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  aria-label={__('Delete booking', 'Delete booking')}
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
                      {__('Showing', 'Showing')} <span className="font-medium text-gray-900 dark:text-white">{(page - 1) * 10 + 1}</span> - <span className="font-medium text-gray-900 dark:text-white">{Math.min(page * 10, total)}</span> {__('of', 'of')} <span className="font-medium text-gray-900 dark:text-white">{total}</span> {__('bookings', 'bookings')}
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

