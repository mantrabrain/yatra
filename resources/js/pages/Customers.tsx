/**
 * Customers Page
 * Clean, minimal SaaS-style customers management page with dynamic data
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { Pagination, SearchFilterToolbar, BulkActionToolbar, Table as SharedTable } from '../components/shared';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Skeleton } from '../components/ui/skeleton';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { getCurrencySymbol, getCurrency } from '../data/currencies';

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
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const queryClient = useQueryClient();
  const { can, isPro } = usePermissions();
  const { showToast } = useToast();

  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        customer: true,
        location: true,
        total_bookings: true,
        total_spent: true,
        loyalty: true,
        status: true,
        created_at: true,
      };
    }
    const saved = window.localStorage.getItem('yatra-customers-visible-columns');
    return saved
      ? JSON.parse(saved)
      : {
          customer: true,
          location: true,
          total_bookings: true,
          total_spent: true,
          loyalty: true,
          status: true,
          created_at: true,
        };
  });

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
      const response = await fetch(`${apiBase}/customers/${id}`, {
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
      showToast(__('Customer deleted successfully', 'Customer deleted successfully'), 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete customer', 'Failed to delete customer'), 'error');
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

  const formatPrice = (price: number, currencyCode: string = 'USD') => {
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

  const toggleColumn = (key: string) => {
    const next = {
      ...visibleColumns,
      [key]: !visibleColumns[key as keyof typeof visibleColumns],
    };
    setVisibleColumns(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('yatra-customers-visible-columns', JSON.stringify(next));
    }
  };

  const handleSelectItem = (id: string | number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((v) => v !== id)));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(customers.map((customer) => customer.id));
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected = customers.length > 0 && selectedIds.length === customers.length;

  const updateStatusForIds = async (
    ids: (string | number)[],
    newStatus: string
  ) => {
    await Promise.all(
      ids.map(async (id) => {
        const response = await fetch(`${apiBase}/customers/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': (window as any)?.yatraAdmin?.nonce || '',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to update customer status');
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
            fetch(`${apiBase}/customers/${id}`, {
              method: 'DELETE',
              headers: { 'X-WP-Nonce': (window as any)?.yatraAdmin?.nonce || '' },
            })
          )
        );
        showToast(__('Selected customers deleted successfully', 'Selected customers deleted successfully'), 'success');
      } else {
        await updateStatusForIds(selectedIds, bulkAction);
        showToast(__('Customer statuses updated successfully', 'Customer statuses updated successfully'), 'success');
      }

      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedIds([]);
      setBulkAction('');
    } catch (error: any) {
      showToast(
        error?.message || __('Failed to perform bulk action on customers', 'Failed to perform bulk action on customers'),
        'error'
      );
    } finally {
      setIsBulkPending(false);
    }
  };

  const allBulkActionOptions = [
    { value: 'active', label: __('Mark as Active', 'Mark as Active') },
    { value: 'inactive', label: __('Mark as Inactive', 'Mark as Inactive') },
    { value: 'blocked', label: __('Mark as Blocked', 'Mark as Blocked') },
    { value: 'delete', label: __('Delete permanently', 'Delete permanently') },
  ];

  const getBulkActionOptionsForStatus = (view: string) => {
    switch (view) {
      case 'active':
        return allBulkActionOptions.filter((opt) =>
          ['inactive', 'blocked', 'delete'].includes(opt.value)
        );
      case 'inactive':
        return allBulkActionOptions.filter((opt) =>
          ['active', 'blocked', 'delete'].includes(opt.value)
        );
      case 'blocked':
        return allBulkActionOptions.filter((opt) =>
          ['active', 'inactive', 'delete'].includes(opt.value)
        );
      default:
        return allBulkActionOptions;
    }
  };

  const bulkActionOptions = getBulkActionOptionsForStatus(statusFilter);

  const statusOptions = [
    { value: 'all', label: __('All Status', 'All Status') },
    { value: 'active', label: __('Active', 'Active') },
    { value: 'inactive', label: __('Inactive', 'Inactive') },
    { value: 'blocked', label: __('Blocked', 'Blocked') },
  ];

  const sortOptions = [
    { value: 'created_at', label: __('Registration Date', 'Registration Date') },
    { value: 'name', label: __('Name', 'Name') },
    { value: 'email', label: __('Email', 'Email') },
    { value: 'country', label: __('Country', 'Country') },
    { value: 'total_bookings', label: __('Bookings', 'Bookings') },
    { value: 'total_spent', label: __('Total Spent', 'Total Spent') },
    { value: 'status', label: __('Status', 'Status') },
  ];

  const columnOptions = [
    { key: 'customer', label: __('Customer', 'Customer'), visible: visibleColumns.customer },
    { key: 'location', label: __('Location', 'Location'), visible: visibleColumns.location },
    { key: 'total_bookings', label: __('Bookings', 'Bookings'), visible: visibleColumns.total_bookings },
    { key: 'total_spent', label: __('Total Spent', 'Total Spent'), visible: visibleColumns.total_spent },
    { key: 'loyalty', label: __('Loyalty', 'Loyalty'), visible: visibleColumns.loyalty },
    { key: 'status', label: __('Status', 'Status'), visible: visibleColumns.status },
    { key: 'created_at', label: __('Registered', 'Registered'), visible: visibleColumns.created_at },
  ];

  const columns = [
    {
      key: 'customer',
      label: __('Customer', 'Customer'),
      sortable: true,
      visible: visibleColumns.customer,
      width: 'w-[250px]',
      render: (customer: Customer) => (
        <div>
          <button
            type="button"
            onClick={() => handleView(customer)}
            className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
          >
            {customer.name || `${customer.first_name} ${customer.last_name}`}
          </button>
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
      ),
    },
    {
      key: 'location',
      label: __('Location', 'Location'),
      sortable: true,
      visible: visibleColumns.location,
      render: (customer: Customer) => (
        customer.country ? (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {customer.city ? `${customer.city}, ` : ''}{customer.country}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    isPro && {
      key: 'total_bookings',
      label: __('Bookings', 'Bookings'),
      sortable: true,
      visible: visibleColumns.total_bookings,
      render: (customer: Customer) => (
        <span className="text-gray-600 dark:text-gray-400">{customer.total_bookings}</span>
      ),
    },
    isPro && {
      key: 'total_spent',
      label: __('Total Spent', 'Total Spent'),
      sortable: true,
      visible: visibleColumns.total_spent,
      render: (customer: Customer) => (
        <span className="font-medium">{formatPrice(customer.total_spent)}</span>
      ),
    },
    {
      key: 'loyalty',
      label: __('Loyalty', 'Loyalty'),
      sortable: false,
      visible: visibleColumns.loyalty,
      render: (customer: Customer) => getLoyaltyBadge(customer.loyalty_tier || 'bronze'),
    },
    {
      key: 'status',
      label: __('Status', 'Status'),
      sortable: true,
      visible: visibleColumns.status,
      render: (customer: Customer) => getStatusBadge(customer.status),
    },
    {
      key: 'created_at',
      label: __('Registered', 'Registered'),
      sortable: true,
      visible: visibleColumns.created_at,
      render: (customer: Customer) => (
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {formatDate(customer.created_at)}
        </span>
      ),
    },
  ].filter(Boolean);

  const actions = [
    {
      key: 'view',
      label: __('View', 'View'),
      icon: <Eye className="w-4 h-4" />,
      onClick: (customer: Customer) => handleView(customer),
    },
    {
      key: 'edit',
      label: __('Edit', 'Edit'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (customer: Customer) => handleEdit(customer),
      condition: () => can('yatra_edit_bookings'),
    },
    {
      key: 'mark_active',
      label: __('Mark as Active', 'Mark as Active'),
      icon: <ArrowUp className="w-4 h-4" />,
      onClick: async (customer: Customer) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([customer.id], 'active');
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          showToast(__('Customer status updated', 'Customer status updated'), 'success');
        } catch (error: any) {
          showToast(error?.message || __('Failed to update customer status', 'Failed to update customer status'), 'error');
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (customer: Customer) => can('yatra_edit_bookings') && customer.status !== 'active',
    },
    {
      key: 'mark_inactive',
      label: __('Mark as Inactive', 'Mark as Inactive'),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (customer: Customer) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([customer.id], 'inactive');
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          showToast(__('Customer status updated', 'Customer status updated'), 'success');
        } catch (error: any) {
          showToast(error?.message || __('Failed to update customer status', 'Failed to update customer status'), 'error');
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (customer: Customer) => can('yatra_edit_bookings') && customer.status !== 'inactive',
    },
    {
      key: 'mark_blocked',
      label: __('Mark as Blocked', 'Mark as Blocked'),
      icon: <ArrowDown className="w-4 h-4" />,
      onClick: async (customer: Customer) => {
        setIsBulkPending(true);
        try {
          await updateStatusForIds([customer.id], 'blocked');
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          showToast(__('Customer status updated', 'Customer status updated'), 'success');
        } catch (error: any) {
          showToast(error?.message || __('Failed to update customer status', 'Failed to update customer status'), 'error');
        } finally {
          setIsBulkPending(false);
        }
      },
      condition: (customer: Customer) => can('yatra_edit_bookings') && customer.status !== 'blocked',
    },
    {
      key: 'delete',
      label: __('Delete', 'Delete'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (customer: Customer) => handleDelete(customer),
      variant: 'destructive' as const,
      condition: () => can('yatra_delete_bookings'),
    },
  ];

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

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            <div className="relative min-w-0 w-full lg:flex-[2]">
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
                placeholder={__('Search customers...', 'Search customers...')}
              />
            </div>

            {/* Loyalty Filter */}
            {isPro && (
              <Select
                value={loyaltyFilter}
                onChange={(e) => {
                  setLoyaltyFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-36"
              >
                <option value="all">{__('All Tiers', 'All Tiers')}</option>
                <option value="bronze">{__('Bronze', 'Bronze')}</option>
                <option value="silver">{__('Silver', 'Silver')}</option>
                <option value="gold">{__('Gold', 'Gold')}</option>
                <option value="platinum">{__('Platinum', 'Platinum')}</option>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_bookings">
        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              {__('Error loading customers', 'Error loading customers')}
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
                { key: 'active', label: __('Active', 'Active'), count: 0 },
                { key: 'inactive', label: __('Inactive', 'Inactive'), count: 0 },
                { key: 'blocked', label: __('Blocked', 'Blocked'), count: 0 },
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
                  renderSkeleton()
                ) : (
                  <SharedTable
                    data={customers}
                    columns={columns as any}
                    actions={actions as any}
                    isLoading={isLoading}
                    isError={!!error}
                    errorText={__('Error loading customers', 'Error loading customers')}
                    emptyText={__('No customers found', 'No customers found')}
                    emptyDescription={
                      hasFilters
                        ? __('Try adjusting your filters to see more results.', 'Try adjusting your filters to see more results.')
                        : __('Customers will appear here when bookings are made', 'Customers will appear here when bookings are made')
                    }
                    onCreateClick={
                      can('yatra_edit_bookings') ? handleCreateCustomer : undefined
                    }
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                    selectedItemIds={selectedIds}
                    onSelectItem={handleSelectItem}
                    onSelectAll={handleSelectAll}
                    isAllSelected={isAllSelected}
                    getItemId={(customer: Customer) => customer.id}
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
                  itemName={__('customers', 'customers')}
                />
              </div>
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
