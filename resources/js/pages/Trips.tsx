/**
 * All Trips Page
 * Clean, minimal SaaS-style trips management page
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Package, MapPin, Calendar, Users, Tag, Mountain } from 'lucide-react';
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
import { apiClient } from '../lib/api';
import { useToast } from '../components/ui/toast';
import { generateSlug } from '../lib/slug';

interface Trip {
  id: number;
  title: string;
  slug: string;
  original_price?: number;
  discounted_price?: number;
  sale_price?: number;
  status: string;
  created_at: string;
  bookings_count?: number;
  featured?: boolean;
  trip_type?: 'single_day' | 'multi_day' | 'flexible';
  featured_priority?: string;
  duration_days?: number;
  duration_nights?: number;
  min_travelers?: number;
  max_travelers?: number;
  trip_category?: string;
  difficulty_level?: string;
  destinations?: Array<{
    id: number;
    name: string;
    slug?: string;
    is_primary?: boolean;
  }>;
}

const Trips: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState('');
  const [createTripError, setCreateTripError] = useState<string | null>(null);
  const [newTripSlug, setNewTripSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const queryClient = useQueryClient();
  const { can, isPro } = usePermissions();
  const { showToast } = useToast();

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

  // Fetch trips from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['trips', queryParams],
    queryFn: async () => {
      const response = await apiClient.get('/trips', { params: queryParams });
      return response;
    },
    enabled: can('yatra_view_trips'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/trips/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const createTripMutation = useMutation({
    mutationFn: async ({ title, slug }: { title: string; slug: string }) => {
      const trimmedTitle = title.trim();
      const trimmedSlug = slug.trim();
      const payload = {
        title: trimmedTitle,
        slug: trimmedSlug,
        status: 'draft',
        trip_type: 'multi_day',
      };
      const response = await apiClient.post('/trips', payload);
      return response?.data || response;
    },
    onSuccess: (data) => {
      showToast(__('Trip created as draft. Redirecting to builder...', 'Trip created as draft. Redirecting to builder...'), 'success');
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setIsCreateModalOpen(false);
      setNewTripTitle('');
      setNewTripSlug('');
      setIsSlugManuallyEdited(false);
      setCreateTripError(null);
      if (data?.id) {
        setTimeout(() => {
          window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&action=edit&id=${data.id}`;
        }, 600);
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || __('Failed to create trip. Please try again.', 'Failed to create trip. Please try again.');
      setCreateTripError(message);
      showToast(message, 'error');
    },
  });

  const trips = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const formatLabel = (value?: string | null) => {
    if (!value) return '';
    return value
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const summarizeDestinations = (trip: Trip) => {
    const names = (trip.destinations || []).map(dest => dest.name).filter(Boolean);
    if (!names.length) return null;
    const summary = names.slice(0, 2).join(', ');
    const remaining = names.length - 2;
    return remaining > 0 ? `${summary} +${remaining}` : summary;
  };

  const summarizeTravelers = (trip: Trip) => {
    const { min_travelers, max_travelers } = trip;
    if (min_travelers && max_travelers) {
      return `${min_travelers}-${max_travelers} ${__('pax', 'pax')}`;
    }
    if (min_travelers) {
      return `${__('Min', 'Min')} ${min_travelers} ${__('pax', 'pax')}`;
    }
    if (max_travelers) {
      return `${__('Up to', 'Up to')} ${max_travelers} ${__('pax', 'pax')}`;
    }
    return null;
  };

  const handleNewTripTitleChange = (value: string) => {
    setNewTripTitle(value);
    if (!isSlugManuallyEdited) {
      setNewTripSlug(generateSlug(value));
    }
  };

  const handleNewTripSlugChange = (value: string) => {
    if (!isSlugManuallyEdited) {
      setIsSlugManuallyEdited(true);
    }
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setNewTripSlug(sanitized);
  };

  const enableSlugEditing = () => {
    if (!isSlugManuallyEdited) {
      if (!newTripSlug.trim()) {
        setNewTripSlug(generateSlug(newTripTitle || 'new-trip'));
      }
      setIsSlugManuallyEdited(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (trip: Trip) => {
    // Use sale_price if available, otherwise discounted_price, otherwise original_price
    const price = trip.sale_price || trip.discounted_price || trip.original_price || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'published': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Published', 'Published'),
      },
      'draft': {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        label: __('Draft', 'Draft'),
      },
      'archived': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Archived', 'Archived'),
      },
      'review': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: __('Review', 'Review'),
      },
      'approved': {
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        label: __('Approved', 'Approved'),
      },
      'suspended': {
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
        label: __('Suspended', 'Suspended'),
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

  const getTripTypeBadge = (tripType?: 'single_day' | 'multi_day' | 'flexible') => {
    if (!tripType) return null;
    
    const typeMap: Record<string, { className: string; label: string }> = {
      'single_day': {
        className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
        label: __('Single Day', 'Single Day'),
      },
      'multi_day': {
        className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
        label: __('Multi-Day', 'Multi-Day'),
      },
      'flexible': {
        className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
        label: __('Flexible', 'Flexible'),
      },
    };

    const typeInfo = typeMap[tripType] || {
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
      label: tripType,
    };

    return (
      <Badge className={`text-xs ${typeInfo.className}`}>
        {typeInfo.label}
      </Badge>
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
    setIsCreateModalOpen(true);
    setCreateTripError(null);
    setNewTripTitle('');
    setNewTripSlug('');
    setIsSlugManuallyEdited(false);
  };

  const handleCreateTripConfirm = () => {
    const title = newTripTitle.trim();
    if (!title) {
      setCreateTripError(__('Trip title is required', 'Trip title is required'));
      return;
    }
    const slugBase = isSlugManuallyEdited ? newTripSlug : generateSlug(title);
    const slug = slugBase.trim();
    if (!slug) {
      setCreateTripError(__('Trip slug is required', 'Trip slug is required'));
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setCreateTripError(__('Slug can only contain lowercase letters, numbers, and hyphens', 'Slug can only contain lowercase letters, numbers, and hyphens'));
      return;
    }
    setNewTripSlug(slug);
    createTripMutation.mutate({ title, slug });
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
    <>
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
        <CardContent className="p-4">
          <div className="mb-3">
            <HelpText 
              text={__('Use the search box to find trips by name. Use filters to show only published, draft, or other status trips. Click column headers to sort.', 'Use the search box to find trips by name. Use filters to show only published, draft, or other status trips. Click column headers to sort.')}
            />
          </div>
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center w-full">
            {/* Search */}
            <div className="flex-1 min-w-0 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder={__('Search by trip name...', 'Search by trip name...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 w-full"
                title={__('Type to search for trips by name', 'Type to search for trips by name')}
              />
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-auto lg:min-w-[160px]">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10"
              >
                <option value="all">{__('All Status', 'All Status')}</option>
                <option value="published">{__('Published', 'Published')}</option>
                <option value="draft">{__('Draft', 'Draft')}</option>
                <option value="review">{__('Review', 'Review')}</option>
                <option value="approved">{__('Approved', 'Approved')}</option>
                <option value="archived">{__('Archived', 'Archived')}</option>
                <option value="suspended">{__('Suspended', 'Suspended')}</option>
              </Select>
            </div>

            {/* Sort By */}
            <div className="w-full lg:w-auto lg:min-w-[140px]">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full h-10"
              >
                <option value="title">{__('Title', 'Title')}</option>
                <option value="price">{__('Price', 'Price')}</option>
                <option value="date">{__('Date', 'Date')}</option>
                <option value="status">{__('Status', 'Status')}</option>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="w-full lg:w-auto lg:flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="h-10 px-4 flex items-center gap-2 w-full lg:w-auto"
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
                  className="flex items-center gap-2 h-10 w-full lg:w-auto"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm">{__('Reset', 'Reset')}</span>
                </Button>
              </div>
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">
                            {__('Trip', 'Trip')}
                          </TableHead>
                          <TableHead>
                            {__('Price', 'Price')}
                          </TableHead>
                          <TableHead>
                            {__('Status', 'Status')}
                          </TableHead>
                          <TableHead>
                            {__('Trip Type', 'Trip Type')}
                          </TableHead>
                          {isPro && (
                            <TableHead>{__('Bookings', 'Bookings')}</TableHead>
                          )}
                          <TableHead>
                            {__('Created', 'Created')}
                          </TableHead>
                          <TableHead className="text-right w-[120px]">
                            <span className="sr-only">{__('Actions', 'Actions')}</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...Array(10)].map((_, index) => (
                          <TableRow key={`skeleton-${index}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                </div>
                                {index % 3 === 0 && (
                                  <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            </TableCell>
                            <TableCell>
                              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                            </TableCell>
                            <TableCell>
                              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                            </TableCell>
                            {isPro && (
                              <TableCell>
                                <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                  <div className="overflow-x-auto">
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
                        <TableHead>
                          <button
                            onClick={() => handleSort('trip_type')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Trip Type', 'Trip Type')}
                            {getSortIcon('trip_type')}
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
                      {trips.map((trip: Trip) => (
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
                                {(() => {
                                  const destinationLabel = summarizeDestinations(trip);
                                  const durationLabel = trip.duration_days
                                    ? `${trip.duration_days}${__('d', 'd')}${trip.duration_nights ? ` / ${trip.duration_nights}${__('n', 'n')}` : ''}`
                                    : null;
                                  const travelerLabel = summarizeTravelers(trip);
                                  const categoryLabel = formatLabel(trip.trip_category);
                                  const difficultyLabel = formatLabel(trip.difficulty_level);
                                  const chips = [
                                    destinationLabel && { key: 'dest', label: destinationLabel, icon: MapPin },
                                    durationLabel && { key: 'duration', label: durationLabel, icon: Calendar },
                                    travelerLabel && { key: 'traveler', label: travelerLabel, icon: Users },
                                    categoryLabel && { key: 'category', label: categoryLabel, icon: Tag },
                                    difficultyLabel && { key: 'difficulty', label: difficultyLabel, icon: Mountain },
                                  ].filter(Boolean) as Array<{ key: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }>;
                                  if (!chips.length) return null;
                                  return (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {chips.map(({ key, label, icon: Icon }) => (
                                        <span
                                          key={`${trip.id}-${key}`}
                                          className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 text-[11px]"
                                        >
                                          <Icon className="w-3 h-3" />
                                          {label}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                              {(trip.featured_priority && trip.featured_priority !== 'none' && isPro) && (
                                <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                  {trip.featured_priority === 'featured' ? __('Featured', 'Featured') :
                                   trip.featured_priority === 'popular' ? __('Popular', 'Popular') :
                                   trip.featured_priority === 'new' ? __('New', 'New') :
                                   trip.featured_priority === 'limited' ? __('Limited', 'Limited') :
                                   trip.featured_priority === 'bestseller' ? __('Bestseller', 'Bestseller') :
                                   trip.featured_priority}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(trip)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(trip.status)}
                          </TableCell>
                          <TableCell>
                            {getTripTypeBadge(trip.trip_type)}
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
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination - Always Visible */}
            {total > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                      {__('Showing', 'Showing')} <span className="font-medium text-gray-900 dark:text-white">{(page - 1) * 10 + 1}</span> - <span className="font-medium text-gray-900 dark:text-white">{Math.min(page * 10, total)}</span> {__('of', 'of')} <span className="font-medium text-gray-900 dark:text-white">{total}</span> {__('trips', 'trips')}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-9 px-4 min-w-[100px]"
                      >
                        {__('Previous', 'Previous')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="h-9 px-4 min-w-[100px]"
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

    {isCreateModalOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={() => {
          if (!createTripMutation.isPending) {
            setIsCreateModalOpen(false);
            setCreateTripError(null);
          }
        }}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__('Create Trip Draft', 'Create Trip Draft')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {__('Give your trip a name. We\'ll create a draft and take you to the builder.', 'Give your trip a name. We\'ll create a draft and take you to the builder.')}
              </p>
            </div>
            <button
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              onClick={() => {
                if (!createTripMutation.isPending) {
                  setIsCreateModalOpen(false);
                  setCreateTripError(null);
                }
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {__('Trip Title', 'Trip Title')}
              </label>
              <Input
                value={newTripTitle}
                onChange={(e) => handleNewTripTitleChange(e.target.value)}
                placeholder={__('e.g., Bali Beach Retreat', 'e.g., Bali Beach Retreat')}
                disabled={createTripMutation.isPending}
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  {__('Trip Slug', 'Trip Slug')}
                  <span className="text-[10px] font-normal text-gray-400">{__('(URL friendly)', '(URL friendly)')}</span>
                </label>
                {!isSlugManuallyEdited && (
                  <button
                    type="button"
                    onClick={enableSlugEditing}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {__('Customize URL', 'Customize URL')}
                  </button>
                )}
              </div>
              <Input
                value={newTripSlug}
                onChange={(e) => handleNewTripSlugChange(e.target.value)}
                placeholder={__('bali-beach-retreat', 'bali-beach-retreat')}
                disabled={createTripMutation.isPending}
                readOnly={!isSlugManuallyEdited}
                className={`font-mono text-sm ${!isSlugManuallyEdited ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isSlugManuallyEdited
                  ? __('Editing slug manually. Keep it short, lowercase, and hyphen-separated.', 'Editing slug manually. Keep it short, lowercase, and hyphen-separated.')
                  : __('Auto-generated from the title. Click "Customize URL" if you need a custom slug.', 'Auto-generated from the title. Click "Customize URL" if you need a custom slug.')}
              </p>
              {(newTripSlug || newTripTitle) && (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {(window as any).yatraAdmin?.siteUrl || 'https://example.com'}/trips/{newTripSlug || generateSlug(newTripTitle)}
                </p>
              )}
            </div>
            {createTripError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {createTripError}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!createTripMutation.isPending) {
                  setIsCreateModalOpen(false);
                  setCreateTripError(null);
                }
              }}
              disabled={createTripMutation.isPending}
            >
              {__('Cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleCreateTripConfirm}
              className="flex items-center gap-2"
              disabled={createTripMutation.isPending}
            >
              {createTripMutation.isPending && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {createTripMutation.isPending ? __('Creating…', 'Creating…') : __('Create & Continue', 'Create & Continue')}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Trips;
