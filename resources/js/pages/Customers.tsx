/**
 * Customers Page
 * Clean, minimal SaaS-style customers management page
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ConditionalRender } from '../components/ui/conditional-render';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  total_bookings: number;
  total_spent: number;
  total_payments: number;
  total_payment_amount: number;
  status: string;
  registered_at: string;
  last_booking_date?: string;
}

const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('registered_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { can, isPro } = usePermissions();

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

  // Fetch customers with dummy data
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', queryParams],
    queryFn: async () => {
      // return await apiClient.get('/yatra/v1/customers', { params: queryParams });
      // Dummy data
      const today = new Date();
      const getDate = (days: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
      };

      const allCustomers: Customer[] = [
        {
          id: 1,
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '+1 234-567-8900',
          country: 'United States',
          city: 'New York',
          total_bookings: 3,
          total_spent: 6250,
          total_payments: 5,
          total_payment_amount: 6250,
          status: 'active',
          registered_at: getDate(120),
          last_booking_date: getDate(5),
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          email: 'sarah.j@example.com',
          phone: '+1 345-678-9012',
          country: 'Canada',
          city: 'Toronto',
          total_bookings: 2,
          total_spent: 1960,
          total_payments: 3,
          total_payment_amount: 1960,
          status: 'active',
          registered_at: getDate(90),
          last_booking_date: getDate(3),
        },
        {
          id: 3,
          name: 'Michael Chen',
          email: 'm.chen@example.com',
          phone: '+86 138-0013-8000',
          country: 'China',
          city: 'Beijing',
          total_bookings: 1,
          total_spent: 3000,
          total_payments: 2,
          total_payment_amount: 3000,
          status: 'active',
          registered_at: getDate(60),
          last_booking_date: getDate(10),
        },
        {
          id: 4,
          name: 'Emma Williams',
          email: 'emma.w@example.com',
          phone: '+44 20-7946-0958',
          country: 'United Kingdom',
          city: 'London',
          total_bookings: 2,
          total_spent: 3300,
          total_payments: 4,
          total_payment_amount: 3300,
          status: 'active',
          registered_at: getDate(45),
          last_booking_date: getDate(15),
        },
        {
          id: 5,
          name: 'David Brown',
          email: 'd.brown@example.com',
          phone: '+61 2-9374-4000',
          country: 'Australia',
          city: 'Sydney',
          total_bookings: 1,
          total_spent: 920,
          total_payments: 1,
          total_payment_amount: 920,
          status: 'active',
          registered_at: getDate(30),
          last_booking_date: getDate(2),
        },
        {
          id: 6,
          name: 'Lisa Anderson',
          email: 'lisa.a@example.com',
          phone: '+1 456-789-0123',
          country: 'United States',
          city: 'Los Angeles',
          total_bookings: 1,
          total_spent: 4050,
          total_payments: 2,
          total_payment_amount: 4050,
          status: 'inactive',
          registered_at: getDate(180),
          last_booking_date: getDate(150),
        },
        {
          id: 7,
          name: 'Robert Taylor',
          email: 'r.taylor@example.com',
          phone: '+1 567-890-1234',
          country: 'United States',
          city: 'Chicago',
          total_bookings: 1,
          total_spent: 2500,
          total_payments: 1,
          total_payment_amount: 2500,
          status: 'active',
          registered_at: getDate(20),
          last_booking_date: getDate(12),
        },
        {
          id: 8,
          name: 'Maria Garcia',
          email: 'maria.g@example.com',
          phone: '+34 91-123-4567',
          country: 'Spain',
          city: 'Madrid',
          total_bookings: 1,
          total_spent: 850,
          total_payments: 1,
          total_payment_amount: 850,
          status: 'active',
          registered_at: getDate(15),
          last_booking_date: getDate(20),
        },
      ];

      // Apply filters
      let filtered = allCustomers;
      if (searchTerm) {
        filtered = filtered.filter(customer =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.city.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (statusFilter !== 'all') {
        filtered = filtered.filter(customer => customer.status === statusFilter);
      }

      // Apply sorting
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'email':
            aValue = a.email.toLowerCase();
            bValue = b.email.toLowerCase();
            break;
          case 'country':
            aValue = a.country.toLowerCase();
            bValue = b.country.toLowerCase();
            break;
          case 'total_bookings':
            aValue = a.total_bookings;
            bValue = b.total_bookings;
            break;
          case 'total_spent':
            aValue = a.total_spent;
            bValue = b.total_spent;
            break;
          case 'total_payments':
            aValue = a.total_payment_amount;
            bValue = b.total_payment_amount;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'registered_at':
            aValue = new Date(a.registered_at).getTime();
            bValue = new Date(b.registered_at).getTime();
            break;
          default:
            aValue = new Date(a.registered_at).getTime();
            bValue = new Date(b.registered_at).getTime();
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
      // return await apiClient.delete(`/yatra/v1/customers/${_id}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const customers = data?.data || [];
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
      'active': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Active', 'Active'),
      },
      'inactive': {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        label: __('Inactive', 'Inactive'),
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

  const handleEdit = (customer: Customer) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=customers&action=edit&id=${customer.id}`;
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(__('Are you sure you want to delete this customer?', 'Are you sure you want to delete this customer?'))) {
      deleteMutation.mutate(customer.id);
    }
  };

  const handleView = (customer: Customer) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=customers&action=view&id=${customer.id}`;
  };

  const handleCreateCustomer = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=customers&action=create`;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('registered_at');
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

  const hasFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'registered_at' || sortOrder !== 'desc';

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Customers', 'Customers')}
        description={__('Manage your customer database', 'Manage your customer database')}
        actionCapability="yatra_edit_bookings"
        actions={
          <Button onClick={handleCreateCustomer} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Customer', 'Add New Customer')}
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
                placeholder={__('Search customers...', 'Search customers...')}
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
              <option value="active">{__('Active', 'Active')}</option>
              <option value="inactive">{__('Inactive', 'Inactive')}</option>
            </Select>

            {/* Sort By */}
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-40"
            >
              <option value="registered_at">{__('Registration Date', 'Registration Date')}</option>
              <option value="name">{__('Name', 'Name')}</option>
              <option value="email">{__('Email', 'Email')}</option>
              <option value="country">{__('Country', 'Country')}</option>
              <option value="total_bookings">{__('Bookings', 'Bookings')}</option>
              <option value="total_spent">{__('Total Spent', 'Total Spent')}</option>
              <option value="total_payments">{__('Payments', 'Payments')}</option>
              <option value="status">{__('Status', 'Status')}</option>
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
              {__('Error loading customers', 'Error loading customers')}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {__('Loading customers...', 'Loading customers...')}
                  </div>
                ) : customers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {__('No customers found', 'No customers found')}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Customer', 'Customer')}
                            {getSortIcon('name')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('country')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Location', 'Location')}
                            {getSortIcon('country')}
                          </button>
                        </TableHead>
                        {isPro && (
                          <TableHead>
                            <button
                              onClick={() => handleSort('total_bookings')}
                              className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                              {__('Bookings', 'Bookings')}
                              {getSortIcon('total_bookings')}
                            </button>
                          </TableHead>
                        )}
                        {isPro && (
                          <TableHead>
                            <button
                              onClick={() => handleSort('total_spent')}
                              className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                              {__('Total Spent', 'Total Spent')}
                              {getSortIcon('total_spent')}
                            </button>
                          </TableHead>
                        )}
                        <TableHead>
                          <button
                            onClick={() => handleSort('total_payments')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Payments', 'Payments')}
                            {getSortIcon('total_payments')}
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
                        <TableHead>
                          <button
                            onClick={() => handleSort('registered_at')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Registered', 'Registered')}
                            {getSortIcon('registered_at')}
                          </button>
                        </TableHead>
                        <TableHead className="text-right w-[100px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {customer.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {customer.email}
                                </div>
                                {customer.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {customer.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{customer.city}, {customer.country}</span>
                            </div>
                          </TableCell>
                          {isPro && (
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {customer.total_bookings}
                            </TableCell>
                          )}
                          {isPro && (
                            <TableCell className="font-medium">
                              {formatPrice(customer.total_spent)}
                            </TableCell>
                          )}
                          <TableCell className="font-medium">
                            {formatPrice(customer.total_payment_amount)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(customer.status)}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {formatDate(customer.registered_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <ConditionalRender capability="yatra_view_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(customer)}
                                  className="h-8 w-8"
                                  aria-label={__('View customer', 'View customer')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>

                              <ConditionalRender capability="yatra_edit_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(customer)}
                                  className="h-8 w-8"
                                  aria-label={__('Edit customer', 'Edit customer')}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>

                              <ConditionalRender capability="yatra_delete_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(customer)}
                                  className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  aria-label={__('Delete customer', 'Delete customer')}
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
                      {__('Showing', 'Showing')} <span className="font-medium text-gray-900 dark:text-white">{(page - 1) * 10 + 1}</span> - <span className="font-medium text-gray-900 dark:text-white">{Math.min(page * 10, total)}</span> {__('of', 'of')} <span className="font-medium text-gray-900 dark:text-white">{total}</span> {__('customers', 'customers')}
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

export default Customers;

