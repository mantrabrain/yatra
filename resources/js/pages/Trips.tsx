/**
 * All Trips Page
 * Clean, minimal SaaS-style trips management page
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Package } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Edit, Trash2, Eye } from 'lucide-react';
import { HelpText } from '../components/ui/help-text';
import { Alert } from '../components/ui/alert';

interface Trip {
  id: number;
  title: string;
  slug: string;
  price: number;
  status: string;
  created_at: string;
  bookings_count?: number;
  featured?: boolean;
}

const Trips: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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

  // Fetch trips with dummy data
  const { data, isLoading, error } = useQuery({
    queryKey: ['trips', queryParams],
    queryFn: async () => {
      // return await apiClient.get('/yatra/v1/trips', { params: queryParams });
      // Dummy data
      const today = new Date();
      const getDate = (days: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
      };

      const allTrips: Trip[] = [
        {
          id: 1,
          title: 'Everest Base Camp Trek',
          slug: 'everest-base-camp-trek',
          price: 1250,
          status: 'active',
          created_at: getDate(30),
          bookings_count: 45,
          featured: true,
        },
        {
          id: 2,
          title: 'Annapurna Circuit Adventure',
          slug: 'annapurna-circuit-adventure',
          price: 980,
          status: 'active',
          created_at: getDate(25),
          bookings_count: 32,
          featured: false,
        },
        {
          id: 3,
          title: 'Golden Triangle Tour',
          slug: 'golden-triangle-tour',
          price: 750,
          status: 'active',
          created_at: getDate(20),
          bookings_count: 28,
          featured: false,
        },
        {
          id: 4,
          title: 'Bhutan Cultural Journey',
          slug: 'bhutan-cultural-journey',
          price: 1100,
          status: 'active',
          created_at: getDate(15),
          bookings_count: 18,
          featured: true,
        },
        {
          id: 5,
          title: 'Tibet Spiritual Tour',
          slug: 'tibet-spiritual-tour',
          price: 850,
          status: 'draft',
          created_at: getDate(10),
          bookings_count: 0,
          featured: false,
        },
        {
          id: 6,
          title: 'Langtang Valley Trek',
          slug: 'langtang-valley-trek',
          price: 920,
          status: 'active',
          created_at: getDate(8),
          bookings_count: 15,
          featured: false,
        },
        {
          id: 7,
          title: 'Manaslu Circuit Trek',
          slug: 'manaslu-circuit-trek',
          price: 1350,
          status: 'active',
          created_at: getDate(5),
          bookings_count: 22,
          featured: true,
        },
        {
          id: 8,
          title: 'Upper Mustang Trek',
          slug: 'upper-mustang-trek',
          price: 1450,
          status: 'inactive',
          created_at: getDate(3),
          bookings_count: 8,
          featured: false,
        },
      ];

      // Apply filters
      let filtered = allTrips;
      if (searchTerm) {
        filtered = filtered.filter(trip =>
          trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.slug.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (statusFilter !== 'all') {
        filtered = filtered.filter(trip => trip.status === statusFilter);
      }

      // Apply sorting
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'date':
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
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
    enabled: can('yatra_view_trips'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (_id: number) => {
      // return await apiClient.delete(`/yatra/v1/trips/${_id}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const trips = data?.data || [];
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
      'draft': {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        label: __('Draft', 'Draft'),
      },
      'inactive': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Inactive', 'Inactive'),
      },
      'pending': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: __('Pending', 'Pending'),
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

  const handleEdit = (trip: Trip) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&action=edit&id=${trip.id}`;
  };

  const handleDelete = (trip: Trip) => {
    const confirmMessage = __('Are you sure you want to delete "{title}"? This action cannot be undone and will remove all associated bookings.', 'Are you sure you want to delete "{title}"? This action cannot be undone and will remove all associated bookings.').replace('{title}', trip.title);
    if (confirm(confirmMessage)) {
      deleteMutation.mutate(trip.id);
    }
  };

  const handleView = (trip: Trip) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&action=view&id=${trip.id}`;
  };

  const handleCreateTrip = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&action=create`;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('title');
    setSortOrder('asc');
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
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

  const hasFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'title' || sortOrder !== 'asc';

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('All Trips', 'All Trips')}
        description={__('Manage your travel packages and tours. Create, edit, and organize all your trips in one place.', 'Manage your travel packages and tours. Create, edit, and organize all your trips in one place.')}
        actionCapability="yatra_edit_trips"
        actions={
          <Button onClick={handleCreateTrip} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Trip', 'Add New Trip')}
          </Button>
        }
      />

      {/* Filters, Search, and Sorting - Always Visible */}
      <Card>
        <CardContent className="p-3">
          <div className="mb-2">
            <HelpText 
              text={__('Use the search box to find trips by name. Use filters to show only active, draft, or inactive trips. Click column headers to sort.', 'Use the search box to find trips by name. Use filters to show only active, draft, or inactive trips. Click column headers to sort.')}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__('Search by trip name...', 'Search by trip name...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
                title={__('Type to search for trips by name', 'Type to search for trips by name')}
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
              <option value="draft">{__('Draft', 'Draft')}</option>
              <option value="inactive">{__('Inactive', 'Inactive')}</option>
            </Select>

            {/* Sort By */}
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-40 h-9"
            >
              <option value="title">{__('Title', 'Title')}</option>
              <option value="price">{__('Price', 'Price')}</option>
              <option value="date">{__('Date', 'Date')}</option>
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

      <ConditionalRender capability="yatra_view_trips">

        {/* Table */}
        {error ? (
          <Alert variant="error" title={__('Error Loading Trips', 'Error Loading Trips')}>
            {__('We couldn\'t load your trips. Please refresh the page or try again later.', 'We couldn\'t load your trips. Please refresh the page or try again later.')}
          </Alert>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {__('Loading your trips...', 'Loading your trips...')}
                      </p>
                    </div>
                  </div>
                ) : trips.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                          {searchTerm || statusFilter !== 'all' 
                            ? __('No trips match your search', 'No trips match your search')
                            : __('No trips yet', 'No trips yet')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {searchTerm || statusFilter !== 'all'
                            ? __('Try adjusting your search or filters to see more results.', 'Try adjusting your search or filters to see more results.')
                            : __('Get started by creating your first travel package. Click the button above to add a new trip.', 'Get started by creating your first travel package. Click the button above to add a new trip.')}
                        </p>
                        {(!searchTerm && statusFilter === 'all') && (
                          <Button onClick={handleCreateTrip} className="flex items-center gap-2 mx-auto">
                            <Plus className="w-4 h-4" />
                            {__('Create Your First Trip', 'Create Your First Trip')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">
                          <button
                            onClick={() => handleSort('title')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Trip', 'Trip')}
                            {getSortIcon('title')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('price')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Price', 'Price')}
                            {getSortIcon('price')}
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
                        {isPro && (
                          <TableHead>{__('Bookings', 'Bookings')}</TableHead>
                        )}
                        <TableHead>
                          <button
                            onClick={() => handleSort('date')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Created', 'Created')}
                            {getSortIcon('date')}
                          </button>
                        </TableHead>
                        <TableHead className="text-right w-[120px]">
                          <span className="sr-only">{__('Actions', 'Actions')}</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trips.map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {trip.title}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {trip.slug}
                                </div>
                              </div>
                              {trip.featured && isPro && (
                                <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                  {__('Featured', 'Featured')}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(trip.price)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(trip.status)}
                          </TableCell>
                          {isPro && (
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {trip.bookings_count || 0}
                            </TableCell>
                          )}
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {formatDate(trip.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <ConditionalRender capability="yatra_view_trips">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(trip)}
                                  className="h-8 w-8"
                                  title={__('View trip details', 'View trip details')}
                                  aria-label={__('View trip', 'View trip')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>

                              <ConditionalRender capability="yatra_edit_trips">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(trip)}
                                  className="h-8 w-8"
                                  title={__('Edit this trip', 'Edit this trip')}
                                  aria-label={__('Edit trip', 'Edit trip')}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>

                              <ConditionalRender capability="yatra_delete_trips">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(trip)}
                                  className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  title={__('Delete this trip (cannot be undone)', 'Delete this trip (cannot be undone)')}
                                  aria-label={__('Delete trip', 'Delete trip')}
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
                      {__('Showing', 'Showing')} <span className="font-medium text-gray-900 dark:text-white">{(page - 1) * 10 + 1}</span> - <span className="font-medium text-gray-900 dark:text-white">{Math.min(page * 10, total)}</span> {__('of', 'of')} <span className="font-medium text-gray-900 dark:text-white">{total}</span> {__('trips', 'trips')}
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

export default Trips;
