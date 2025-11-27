/**
 * Bookings Page
 * Clean, minimal SaaS-style bookings management page
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Trash2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ConditionalRender } from '../components/ui/conditional-render';

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

    if (paymentFilter !== 'all') {
      params.payment_status = paymentFilter;
    }

    return params;
  }, [searchTerm, statusFilter, paymentFilter, sortBy, sortOrder, page]);

  // Fetch bookings with dummy data
  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings', queryParams],
    queryFn: async () => {
      // return await apiClient.get('/yatra/v1/bookings', { params: queryParams });
      // Dummy data
      const today = new Date();
      const getDate = (days: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
      };

      const allBookings: Booking[] = [
        {
          id: 1,
          booking_number: 'YT-2024-001',
          customer_name: 'John Smith',
          customer_email: 'john.smith@example.com',
          trip_title: 'Everest Base Camp Trek',
          trip_id: 1,
          booking_date: getDate(5),
          travel_date: getDate(30),
          travelers: 2,
          total_amount: 2500,
          payment_status: 'paid',
          booking_status: 'confirmed',
          payment_method: 'Credit Card',
          created_at: getDate(5),
        },
        {
          id: 2,
          booking_number: 'YT-2024-002',
          customer_name: 'Sarah Johnson',
          customer_email: 'sarah.j@example.com',
          trip_title: 'Annapurna Circuit Adventure',
          trip_id: 2,
          booking_date: getDate(3),
          travel_date: getDate(25),
          travelers: 1,
          total_amount: 980,
          payment_status: 'pending',
          booking_status: 'pending',
          payment_method: 'Bank Transfer',
          created_at: getDate(3),
        },
        {
          id: 3,
          booking_number: 'YT-2024-003',
          customer_name: 'Michael Chen',
          customer_email: 'm.chen@example.com',
          trip_title: 'Golden Triangle Tour',
          trip_id: 3,
          booking_date: getDate(10),
          travel_date: getDate(20),
          travelers: 4,
          total_amount: 3000,
          payment_status: 'paid',
          booking_status: 'confirmed',
          payment_method: 'PayPal',
          created_at: getDate(10),
        },
        {
          id: 4,
          booking_number: 'YT-2024-004',
          customer_name: 'Emma Williams',
          customer_email: 'emma.w@example.com',
          trip_title: 'Bhutan Cultural Journey',
          trip_id: 4,
          booking_date: getDate(15),
          travel_date: getDate(35),
          travelers: 2,
          total_amount: 2200,
          payment_status: 'partial',
          booking_status: 'confirmed',
          payment_method: 'Credit Card',
          created_at: getDate(15),
        },
        {
          id: 5,
          booking_number: 'YT-2024-005',
          customer_name: 'David Brown',
          customer_email: 'd.brown@example.com',
          trip_title: 'Langtang Valley Trek',
          trip_id: 6,
          booking_date: getDate(2),
          travel_date: getDate(40),
          travelers: 1,
          total_amount: 920,
          payment_status: 'paid',
          booking_status: 'confirmed',
          payment_method: 'Stripe',
          created_at: getDate(2),
        },
        {
          id: 6,
          booking_number: 'YT-2024-006',
          customer_name: 'Lisa Anderson',
          customer_email: 'lisa.a@example.com',
          trip_title: 'Manaslu Circuit Trek',
          trip_id: 7,
          booking_date: getDate(8),
          travel_date: getDate(28),
          travelers: 3,
          total_amount: 4050,
          payment_status: 'refunded',
          booking_status: 'cancelled',
          payment_method: 'Credit Card',
          created_at: getDate(8),
        },
        {
          id: 7,
          booking_number: 'YT-2024-007',
          customer_name: 'Robert Taylor',
          customer_email: 'r.taylor@example.com',
          trip_title: 'Everest Base Camp Trek',
          trip_id: 1,
          booking_date: getDate(12),
          travel_date: getDate(45),
          travelers: 2,
          total_amount: 2500,
          payment_status: 'pending',
          booking_status: 'pending',
          payment_method: 'Bank Transfer',
          created_at: getDate(12),
        },
        {
          id: 8,
          booking_number: 'YT-2024-008',
          customer_name: 'Maria Garcia',
          customer_email: 'maria.g@example.com',
          trip_title: 'Tibet Spiritual Tour',
          trip_id: 5,
          booking_date: getDate(20),
          travel_date: getDate(50),
          travelers: 1,
          total_amount: 850,
          payment_status: 'paid',
          booking_status: 'completed',
          payment_method: 'PayPal',
          created_at: getDate(20),
        },
      ];

      // Apply filters
      let filtered = allBookings;
      if (searchTerm) {
        filtered = filtered.filter(booking =>
          booking.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.trip_title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (statusFilter !== 'all') {
        filtered = filtered.filter(booking => booking.booking_status === statusFilter);
      }
      if (paymentFilter !== 'all') {
        filtered = filtered.filter(booking => booking.payment_status === paymentFilter);
      }

      // Apply sorting
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'booking_number':
            aValue = a.booking_number;
            bValue = b.booking_number;
            break;
          case 'customer_name':
            aValue = a.customer_name.toLowerCase();
            bValue = b.customer_name.toLowerCase();
            break;
          case 'trip_title':
            aValue = a.trip_title.toLowerCase();
            bValue = b.trip_title.toLowerCase();
            break;
          case 'booking_date':
            aValue = new Date(a.booking_date).getTime();
            bValue = new Date(b.booking_date).getTime();
            break;
          case 'travel_date':
            aValue = new Date(a.travel_date).getTime();
            bValue = new Date(b.travel_date).getTime();
            break;
          case 'total_amount':
            aValue = a.total_amount;
            bValue = b.total_amount;
            break;
          case 'booking_status':
            aValue = a.booking_status;
            bValue = b.booking_status;
            break;
          case 'payment_status':
            aValue = a.payment_status;
            bValue = b.payment_status;
            break;
          default:
            aValue = new Date(a.booking_date).getTime();
            bValue = new Date(b.booking_date).getTime();
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
      // return await apiClient.delete(`/yatra/v1/bookings/${_id}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const bookings = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
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
    if (confirm(__('Are you sure you want to delete this booking?', 'Are you sure you want to delete this booking?'))) {
      deleteMutation.mutate(booking.id);
    }
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
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {__('Loading bookings...', 'Loading bookings...')}
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
                            {formatPrice(booking.total_amount)}
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
    </div>
  );
};

export default Bookings;

