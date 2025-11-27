/**
 * Payments Page
 * Manage payments for bookings
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Eye, CreditCard } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ConditionalRender } from '../components/ui/conditional-render';

interface Payment {
  id: number;
  payment_number: string;
  booking_id: number;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  trip_title: string;
  amount: number;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partial';
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
      params.payment_status = statusFilter;
    }

    if (methodFilter !== 'all') {
      params.payment_method = methodFilter;
    }

    return params;
  }, [searchTerm, statusFilter, methodFilter, sortBy, sortOrder, page]);

  // Fetch payments with dummy data
  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', queryParams],
    queryFn: async () => {
      // return await apiClient.get('/yatra/v1/payments', { params: queryParams });
      // Dummy data
      const today = new Date();
      const getDate = (days: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
      };

      const allPayments: Payment[] = [
        {
          id: 1,
          payment_number: 'PAY-2024-001',
          booking_id: 1,
          booking_number: 'YT-2024-001',
          customer_name: 'John Smith',
          customer_email: 'john.smith@example.com',
          trip_title: 'Everest Base Camp Trek',
          amount: 2500,
          payment_method: 'Credit Card',
          payment_status: 'completed',
          transaction_id: 'TXN-123456789',
          payment_date: getDate(5),
          notes: 'Full payment received',
          created_at: getDate(5),
        },
        {
          id: 2,
          payment_number: 'PAY-2024-002',
          booking_id: 2,
          booking_number: 'YT-2024-002',
          customer_name: 'Sarah Johnson',
          customer_email: 'sarah.j@example.com',
          trip_title: 'Annapurna Circuit Adventure',
          amount: 980,
          payment_method: 'PayPal',
          payment_status: 'completed',
          transaction_id: 'PP-987654321',
          payment_date: getDate(3),
          created_at: getDate(3),
        },
        {
          id: 3,
          payment_number: 'PAY-2024-003',
          booking_id: 3,
          booking_number: 'YT-2024-003',
          customer_name: 'Michael Chen',
          customer_email: 'm.chen@example.com',
          trip_title: 'Golden Triangle Tour',
          amount: 1500,
          payment_method: 'Bank Transfer',
          payment_status: 'pending',
          payment_date: getDate(2),
          notes: 'Awaiting bank confirmation',
          created_at: getDate(2),
        },
        {
          id: 4,
          payment_number: 'PAY-2024-004',
          booking_id: 4,
          booking_number: 'YT-2024-004',
          customer_name: 'Emma Williams',
          customer_email: 'emma.w@example.com',
          trip_title: 'Bhutan Cultural Tour',
          amount: 1200,
          payment_method: 'Credit Card',
          payment_status: 'partial',
          transaction_id: 'TXN-456789012',
          payment_date: getDate(1),
          notes: 'Partial payment - balance pending',
          created_at: getDate(1),
        },
        {
          id: 5,
          payment_number: 'PAY-2024-005',
          booking_id: 5,
          booking_number: 'YT-2024-005',
          customer_name: 'David Brown',
          customer_email: 'd.brown@example.com',
          trip_title: 'Langtang Valley Trek',
          amount: 920,
          payment_method: 'Cash',
          payment_status: 'completed',
          payment_date: getDate(0),
          notes: 'Cash payment at office',
          created_at: getDate(0),
        },
        {
          id: 6,
          payment_number: 'PAY-2024-006',
          booking_id: 6,
          booking_number: 'YT-2024-006',
          customer_name: 'Lisa Anderson',
          customer_email: 'lisa.a@example.com',
          trip_title: 'Chitwan National Park Safari',
          amount: 800,
          payment_method: 'Credit Card',
          payment_status: 'failed',
          transaction_id: 'TXN-FAILED-001',
          payment_date: getDate(7),
          notes: 'Card declined - insufficient funds',
          created_at: getDate(7),
        },
        {
          id: 7,
          payment_number: 'PAY-2024-007',
          booking_id: 7,
          booking_number: 'YT-2024-007',
          customer_name: 'Robert Taylor',
          customer_email: 'r.taylor@example.com',
          trip_title: 'Pokhara Adventure',
          amount: 600,
          payment_method: 'PayPal',
          payment_status: 'refunded',
          transaction_id: 'PP-REFUND-001',
          payment_date: getDate(10),
          notes: 'Refunded due to cancellation',
          created_at: getDate(10),
        },
      ];

      // Apply filters
      let filtered = allPayments;
      if (searchTerm) {
        filtered = filtered.filter(payment =>
          payment.payment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.trip_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (statusFilter !== 'all') {
        filtered = filtered.filter(payment => payment.payment_status === statusFilter);
      }
      if (methodFilter !== 'all') {
        filtered = filtered.filter(payment => payment.payment_method === methodFilter);
      }

      // Apply sorting
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'payment_number':
            aValue = a.payment_number.toLowerCase();
            bValue = b.payment_number.toLowerCase();
            break;
          case 'customer_name':
            aValue = a.customer_name.toLowerCase();
            bValue = b.customer_name.toLowerCase();
            break;
          case 'amount':
            aValue = a.amount;
            bValue = b.amount;
            break;
          case 'payment_method':
            aValue = a.payment_method.toLowerCase();
            bValue = b.payment_method.toLowerCase();
            break;
          case 'payment_status':
            aValue = a.payment_status;
            bValue = b.payment_status;
            break;
          case 'payment_date':
            aValue = new Date(a.payment_date).getTime();
            bValue = new Date(b.payment_date).getTime();
            break;
          default:
            aValue = new Date(a.payment_date).getTime();
            bValue = new Date(b.payment_date).getTime();
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
      // return await apiClient.delete(`/yatra/v1/payments/${_id}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const payments = data?.data || [];
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
    if (confirm(__('Are you sure you want to delete this payment?', 'Are you sure you want to delete this payment?'))) {
      deleteMutation.mutate(payment.id);
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

  return (
    <div className="space-y-3">
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

      {/* Filters, Search, and Sorting - Always Visible */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__('Search payments...', 'Search payments...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40"
            >
              <option value="all">{__('All Status', 'All Status')}</option>
              <option value="completed">{__('Completed', 'Completed')}</option>
              <option value="pending">{__('Pending', 'Pending')}</option>
              <option value="partial">{__('Partial', 'Partial')}</option>
              <option value="failed">{__('Failed', 'Failed')}</option>
              <option value="refunded">{__('Refunded', 'Refunded')}</option>
            </Select>

            {/* Payment Method Filter */}
            <Select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full md:w-40"
            >
              <option value="all">{__('All Methods', 'All Methods')}</option>
              <option value="Credit Card">{__('Credit Card', 'Credit Card')}</option>
              <option value="PayPal">{__('PayPal', 'PayPal')}</option>
              <option value="Bank Transfer">{__('Bank Transfer', 'Bank Transfer')}</option>
              <option value="Cash">{__('Cash', 'Cash')}</option>
            </Select>

            {/* Sort By */}
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-40"
            >
              <option value="payment_date">{__('Payment Date', 'Payment Date')}</option>
              <option value="payment_number">{__('Payment Number', 'Payment Number')}</option>
              <option value="customer_name">{__('Customer', 'Customer')}</option>
              <option value="amount">{__('Amount', 'Amount')}</option>
              <option value="payment_method">{__('Payment Method', 'Payment Method')}</option>
              <option value="payment_status">{__('Status', 'Status')}</option>
            </Select>

            {/* Sort Order */}
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

            {/* Reset Button */}
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

      <ConditionalRender capability="yatra_view_bookings">
        {/* Table */}
        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              {__('Error loading payments', 'Error loading payments')}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {__('Loading payments...', 'Loading payments...')}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {__('No payments found', 'No payments found')}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">
                          <button
                            onClick={() => handleSort('payment_number')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Payment', 'Payment')}
                            {getSortIcon('payment_number')}
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
                        <TableHead>{__('Booking', 'Booking')}</TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('amount')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Amount', 'Amount')}
                            {getSortIcon('amount')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('payment_method')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Method', 'Method')}
                            {getSortIcon('payment_method')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('payment_status')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Status', 'Status')}
                            {getSortIcon('payment_status')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('payment_date')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Date', 'Date')}
                            {getSortIcon('payment_date')}
                          </button>
                        </TableHead>
                        <TableHead className="text-right w-[100px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CreditCard className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                                  {payment.payment_number}
                                </span>
                              </div>
                              {payment.transaction_id && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {__('TXN', 'TXN')}: {payment.transaction_id}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {payment.customer_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {payment.customer_email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {payment.booking_number}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {payment.trip_title}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-gray-900 dark:text-white">
                            {formatPrice(payment.amount)}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {payment.payment_method}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.payment_status)}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {formatDate(payment.payment_date)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <ConditionalRender capability="yatra_view_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(payment)}
                                  className="h-8 w-8"
                                  aria-label={__('View payment', 'View payment')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>

                              <ConditionalRender capability="yatra_edit_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(payment)}
                                  className="h-8 w-8"
                                  aria-label={__('Edit payment', 'Edit payment')}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>

                              <ConditionalRender capability="yatra_delete_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(payment)}
                                  className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  aria-label={__('Delete payment', 'Delete payment')}
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
                      {__('Showing', 'Showing')} <span className="font-medium text-gray-900 dark:text-white">{(page - 1) * 10 + 1}</span> - <span className="font-medium text-gray-900 dark:text-white">{Math.min(page * 10, total)}</span> {__('of', 'of')} <span className="font-medium text-gray-900 dark:text-white">{total}</span> {__('payments', 'payments')}
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

export default Payments;

