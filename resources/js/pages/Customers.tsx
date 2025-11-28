/**
 * Customers Page
 * Clean, minimal SaaS-style customers management page with dynamic data
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Trash2, Mail, Phone, MapPin, Award, Users } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Skeleton } from '../components/ui/skeleton';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';

interface Customer {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city?: string;
  total_bookings: number;
  total_spent: number;
  loyalty_tier: string;
  status: string;
  created_at: string;
  last_booking_date?: string;
}

interface CustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loyaltyFilter, setLoyaltyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
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

    if (loyaltyFilter !== 'all') {
      params.loyalty_tier = loyaltyFilter;
    }

    return params;
  }, [searchTerm, statusFilter, loyaltyFilter, sortBy, sortOrder, page]);

  // Fetch customers from API
  const { data, isLoading, error } = useQuery<CustomersResponse>({
    queryKey: ['customers', queryParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const response = await fetch(`${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/customers?${params.toString()}`, {
        headers: { 'X-WP-Nonce': window.yatraAdmin?.nonce || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    },
    enabled: can('yatra_view_bookings'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/customers/${id}`, {
        method: 'DELETE',
        headers: { 'X-WP-Nonce': window.yatraAdmin?.nonce || '' }
      });
      if (!response.ok) throw new Error('Failed to delete customer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    },
  });

  const customers = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.pages || Math.ceil(total / 10);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
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
      'blocked': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Blocked', 'Blocked'),
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

  const getLoyaltyBadge = (tier: string) => {
    const tierMap: Record<string, { className: string; icon: string }> = {
      'bronze': {
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
        icon: '🥉',
      },
      'silver': {
        className: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
        icon: '🥈',
      },
      'gold': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        icon: '🥇',
      },
      'platinum': {
        className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
        icon: '💎',
      },
    };

    const tierInfo = tierMap[tier] || tierMap['bronze'];

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${tierInfo.className}`}>
        <span>{tierInfo.icon}</span>
        <span className="capitalize">{tier}</span>
      </span>
    );
  };

  const handleEdit = (customer: Customer) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=customers&action=edit&id=${customer.id}`;
  };

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
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
    setLoyaltyFilter('all');
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

  const hasFilters = searchTerm || statusFilter !== 'all' || loyaltyFilter !== 'all' || sortBy !== 'created_at' || sortOrder !== 'desc';

  // Skeleton loader
  const renderSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px]">{__('Customer', 'Customer')}</TableHead>
          <TableHead>{__('Location', 'Location')}</TableHead>
          {isPro && <TableHead>{__('Bookings', 'Bookings')}</TableHead>}
          {isPro && <TableHead>{__('Total Spent', 'Total Spent')}</TableHead>}
          <TableHead>{__('Loyalty', 'Loyalty')}</TableHead>
          <TableHead>{__('Status', 'Status')}</TableHead>
          <TableHead>{__('Registered', 'Registered')}</TableHead>
          <TableHead className="text-right w-[100px]">{__('Actions', 'Actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            {isPro && <TableCell><Skeleton className="h-4 w-8" /></TableCell>}
            {isPro && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
            <TableCell><Skeleton className="h-6 w-16 rounded" /></TableCell>
            <TableCell><Skeleton className="h-6 w-14 rounded" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

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

      {/* Filters, Search, and Sorting */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            {/* Search */}
            <div className="relative min-w-0 w-full lg:flex-[2]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__('Search customers...', 'Search customers...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-36"
            >
              <option value="all">{__('All Status', 'All Status')}</option>
              <option value="active">{__('Active', 'Active')}</option>
              <option value="inactive">{__('Inactive', 'Inactive')}</option>
              <option value="blocked">{__('Blocked', 'Blocked')}</option>
            </Select>

            {/* Loyalty Filter */}
            {isPro && (
              <Select
                value={loyaltyFilter}
                onChange={(e) => setLoyaltyFilter(e.target.value)}
                className="w-full md:w-36"
              >
                <option value="all">{__('All Tiers', 'All Tiers')}</option>
                <option value="bronze">{__('Bronze', 'Bronze')}</option>
                <option value="silver">{__('Silver', 'Silver')}</option>
                <option value="gold">{__('Gold', 'Gold')}</option>
                <option value="platinum">{__('Platinum', 'Platinum')}</option>
              </Select>
            )}

            {/* Sort By */}
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-40"
            >
              <option value="created_at">{__('Registration Date', 'Registration Date')}</option>
              <option value="name">{__('Name', 'Name')}</option>
              <option value="email">{__('Email', 'Email')}</option>
              <option value="country">{__('Country', 'Country')}</option>
              <option value="total_bookings">{__('Bookings', 'Bookings')}</option>
              <option value="total_spent">{__('Total Spent', 'Total Spent')}</option>
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
                  renderSkeleton()
                ) : customers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium">{__('No customers found', 'No customers found')}</p>
                    <p className="text-sm mt-1">{__('Customers will appear here when bookings are made', 'Customers will appear here when bookings are made')}</p>
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
                          <div className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            {__('Loyalty', 'Loyalty')}
                          </div>
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
                            onClick={() => handleSort('created_at')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Registered', 'Registered')}
                            {getSortIcon('created_at')}
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
                                {customer.name || `${customer.first_name} ${customer.last_name}`}
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
                            {customer.country ? (
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>
                                  {customer.city ? `${customer.city}, ` : ''}{customer.country}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
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
                          <TableCell>
                            {getLoyaltyBadge(customer.loyalty_tier || 'bronze')}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(customer.status)}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {formatDate(customer.created_at)}
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

            {/* Pagination */}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={__('Delete Customer', 'Delete Customer')}
        message={customerToDelete ? 
          __('Are you sure you want to delete this customer? This action cannot be undone.', 'Are you sure you want to delete this customer? This action cannot be undone.') + 
          ` (${customerToDelete.name || customerToDelete.email})` : ''
        }
        confirmText={__('Delete', 'Delete')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Customers;
