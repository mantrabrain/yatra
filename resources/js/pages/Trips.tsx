/**
 * All Trips Page
 * Clean, minimal SaaS-style trips management page
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Package, MapPin, Calendar, Users, Tag, Mountain, Archive } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Edit, Trash2, Eye } from 'lucide-react';
import { HelpText } from '../components/ui/help-text';
import { apiClient } from '../lib/api';
import { useToast } from '../components/ui/toast';
import { generateSlug } from '../lib/slug';
import { getCurrencySymbol, getCurrency } from '../data/currencies';
import { Pagination } from '../components/shared/Pagination';
import { Table as SharedTable } from '../components/shared/Table';
import { BulkActionToolbar } from '../components/shared/BulkActionToolbar';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';

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
  countries?: string[];
  regions?: string[];
  trip_category?: Array<{
    id: number;
    name: string;
    slug?: string;
    is_primary?: boolean;
    order?: number;
  }>;
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
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
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
      setIsDeleteDialogOpen(false);
      setTripToDelete(null);
      showToast(__('Trip deleted permanently.', 'Trip deleted permanently.'), 'success');
    },
    onError: () => {
      showToast(__('Failed to delete trip. Please try again.', 'Failed to delete trip. Please try again.'), 'error');
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

  const summarizeCategories = (trip: Trip) => {
    const names = (trip.trip_category || []).map(cat => cat.name).filter(Boolean);
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
    const currencyCode = (trip as any).currency || 'USD';
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
      'trash': {
        className: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        label: __('Trash', 'Trash'),
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
    setTripToDelete(trip);
    setIsDeleteDialogOpen(true);
  };

  // Fetch trip_base setting for permalink
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/settings');
        return response;
      } catch (error) {
        return null;
      }
    },
    enabled: can('manage_yatra'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleView = (trip: Trip) => {
    const siteUrl = window.yatraAdmin?.siteUrl || '';
    const tripBase = settings?.trip_base || 'trip';
    const tripSlug = trip.slug || '';
    
    if (!tripSlug) {
      showToast(__('Trip slug is missing', 'Trip slug is missing'), 'error');
      return;
    }
    
    // Construct URL: domain.com/tripbase/tripslug
    const tripUrl = `${siteUrl.replace(/\/$/, '')}/${tripBase}/${tripSlug}`;
    window.open(tripUrl, '_blank', 'noopener,noreferrer');
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

  // Helper: update trip status, including required fields for backend validation
  const updateTripStatus = async (trip: Trip, status: string) => {
    await apiClient.put(`/trips/${trip.id}`, {
      status,
      title: trip.title,
      slug: trip.slug,
    });
  };

  // Column visibility state with localStorage persistence
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const defaults = {
      trip: true,
      price: true,
      status: true,
      trip_type: true,
      duration: false,
      countries: false,
      difficulty: false,
      bookings: true,
      created: true,
    };

    if (typeof window === 'undefined') {
      return defaults;
    }

    const stored = window.localStorage.getItem('yatra-trips-visible-columns');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        // Merge stored config with defaults so new columns (duration, countries, difficulty) default to true
        return { ...defaults, ...parsed };
      } catch {
        return defaults;
      }
    }
    return defaults;
  });

  const toggleColumn = (columnKey: string) => {
    const updated = { ...visibleColumns, [columnKey]: !visibleColumns[columnKey] };
    setVisibleColumns(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('yatra-trips-visible-columns', JSON.stringify(updated));
    }
  };

  const columnOptions = [
    { key: 'trip', label: __('Trip', 'Trip'), visible: visibleColumns.trip },
    { key: 'price', label: __('Price', 'Price'), visible: visibleColumns.price },
    { key: 'status', label: __('Status', 'Status'), visible: visibleColumns.status },
    { key: 'trip_type', label: __('Trip Type', 'Trip Type'), visible: visibleColumns.trip_type },
    { key: 'duration', label: __('Duration', 'Duration'), visible: visibleColumns.duration },
    { key: 'countries', label: __('Countries', 'Countries'), visible: visibleColumns.countries },
    { key: 'difficulty', label: __('Difficulty', 'Difficulty'), visible: visibleColumns.difficulty },
    ...(isPro ? [{ key: 'bookings', label: __('Bookings', 'Bookings'), visible: visibleColumns.bookings }] : []),
    { key: 'created', label: __('Created', 'Created'), visible: visibleColumns.created },
  ];

  // Selection helpers for shared table
  const isAllSelected = trips.length > 0 && selectedIds.length === trips.length;

  const handleSelectItem = (id: string | number, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(existingId => existingId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(trips.map((trip: Trip) => trip.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Status counts for filter tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: total,
      published: 0,
      draft: 0,
      review: 0,
      approved: 0,
      archived: 0,
      trash: 0,
    };
    trips.forEach((trip: Trip) => {
      if (counts[trip.status] !== undefined) {
        counts[trip.status] += 1;
      }
    });
    return counts;
  }, [trips, total]);

  const statusOptions = [
    { key: 'all', label: __('All', 'All'), count: statusCounts.all },
    { key: 'published', label: __('Published', 'Published'), count: statusCounts.published },
    { key: 'draft', label: __('Draft', 'Draft'), count: statusCounts.draft },
    { key: 'review', label: __('Review', 'Review'), count: statusCounts.review },
    { key: 'approved', label: __('Approved', 'Approved'), count: statusCounts.approved },
    { key: 'archived', label: __('Archived', 'Archived'), count: statusCounts.archived },
    { key: 'trash', label: __('Trash', 'Trash'), count: statusCounts.trash },
  ];

  // Bulk action options (status + delete)
  const bulkActionOptions = useMemo(() => {
    // In Trash view: allow restore to Draft and permanent delete only
    if (statusFilter === 'trash') {
      return [
        { value: 'mark_draft', label: __('Restore to Draft', 'Restore to Draft') },
        { value: 'delete', label: __('Delete Permanently', 'Delete Permanently') },
      ];
    }

    // Other views: normal status changes + move to trash + delete
    return [
      { value: 'mark_published', label: __('Mark as Published', 'Mark as Published') },
      { value: 'mark_draft', label: __('Mark as Draft', 'Mark as Draft') },
      { value: 'mark_archived', label: __('Archive', 'Archive') },
      { value: 'mark_trash', label: __('Move to Trash', 'Move to Trash') },
      { value: 'delete', label: __('Delete Permanently', 'Delete Permanently') },
    ];
  }, [statusFilter]);

  // Bulk apply handler
  const handleBulkApply = async () => {
    if (!bulkAction || selectedIds.length === 0) return;

    const confirmMessages: Record<string, string> = {
      delete: __('Are you sure you want to permanently delete {count} trip(s)? This cannot be undone.', 'Are you sure you want to permanently delete {count} trip(s)? This cannot be undone.').replace('{count}', selectedIds.length.toString()),
      mark_published: __('Mark {count} trip(s) as Published?', 'Mark {count} trip(s) as Published?').replace('{count}', selectedIds.length.toString()),
      mark_draft: statusFilter === 'trash'
        ? __('Restore {count} trip(s) to Draft?', 'Restore {count} trip(s) to Draft?').replace('{count}', selectedIds.length.toString())
        : __('Mark {count} trip(s) as Draft?', 'Mark {count} trip(s) as Draft?').replace('{count}', selectedIds.length.toString()),
      mark_archived: __('Archive {count} trip(s)?', 'Archive {count} trip(s)?').replace('{count}', selectedIds.length.toString()),
      mark_trash: __('Move {count} trip(s) to Trash?', 'Move {count} trip(s) to Trash?').replace('{count}', selectedIds.length.toString()),
    };

    const message = confirmMessages[bulkAction];
    if (message && !window.confirm(message)) return;

    try {
      if (bulkAction === 'delete') {
        await Promise.all(selectedIds.map(id => apiClient.delete(`/trips/${id}`)));
        showToast(__('Trips deleted successfully', 'Trips deleted successfully'), 'success');
      } else if (bulkAction.startsWith('mark_')) {
        const status = bulkAction.replace('mark_', '');
        // Only update trips that are currently loaded in this page
        const selectedTrips = trips.filter((trip: Trip) => selectedIds.includes(trip.id));
        await Promise.all(selectedTrips.map((trip: Trip) => updateTripStatus(trip, status)));
        showToast(__('Trip status updated successfully', 'Trip status updated successfully'), 'success');
      }
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setSelectedIds([]);
      setBulkAction('');
    } catch (error) {
      showToast(__('Bulk action failed', 'Bulk action failed'), 'error');
    }
  };

  // Columns configuration for shared table
  const columns = useMemo(() => {
    const cols: { key: string; label: string; sortable?: boolean; visible?: boolean; width?: string; render?: (trip: Trip, index: number) => React.ReactNode }[] = [];

    cols.push({
      key: 'title',
      label: __('Trip', 'Trip'),
      sortable: true,
      visible: visibleColumns.trip,
      width: 'w-[300px]',
      render: (trip: Trip) => (
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
              const categoryLabel = summarizeCategories(trip);
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
      ),
    });

    cols.push({
      key: 'price',
      label: __('Price', 'Price'),
      sortable: true,
      visible: visibleColumns.price,
      render: (trip: Trip) => (
        <span className="font-medium">{formatPrice(trip)}</span>
      ),
    });

    cols.push({
      key: 'status',
      label: __('Status', 'Status'),
      sortable: true,
      visible: visibleColumns.status,
      render: (trip: Trip) => getStatusBadge(trip.status),
    });

    cols.push({
      key: 'trip_type',
      label: __('Trip Type', 'Trip Type'),
      sortable: true,
      visible: visibleColumns.trip_type,
      render: (trip: Trip) => getTripTypeBadge(trip.trip_type),
    });

    // Duration column (days / nights)
    cols.push({
      key: 'duration',
      label: __('Duration', 'Duration'),
      sortable: false,
      visible: visibleColumns.duration,
      render: (trip: Trip) => {
        if (!trip.duration_days && !trip.duration_nights) return null;
        const days = trip.duration_days ? `${trip.duration_days} ${__('days', 'days')}` : '';
        const nights = trip.duration_nights ? `${trip.duration_nights} ${__('nights', 'nights')}` : '';
        const label = [days, nights].filter(Boolean).join(' / ');
        return <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>;
      },
    });

    // Countries column
    cols.push({
      key: 'countries',
      label: __('Countries', 'Countries'),
      sortable: false,
      visible: visibleColumns.countries,
      render: (trip: Trip) => {
        const list = (trip.countries || []).filter(Boolean);
        if (!list.length) return null;
        return <span className="text-sm text-gray-700 dark:text-gray-300">{list.join(', ')}</span>;
      },
    });

    // Difficulty column (from difficulty_level)
    cols.push({
      key: 'difficulty',
      label: __('Difficulty', 'Difficulty'),
      sortable: false,
      visible: visibleColumns.difficulty,
      render: (trip: Trip) => {
        if (!trip.difficulty_level) return null;
        return <span className="text-sm text-gray-700 dark:text-gray-300">{formatLabel(trip.difficulty_level)}</span>;
      },
    });

    if (isPro) {
      cols.push({
        key: 'bookings',
        label: __('Bookings', 'Bookings'),
        sortable: false,
        visible: visibleColumns.bookings,
        render: (trip: Trip) => (
          <span className="text-gray-600 dark:text-gray-400">{trip.bookings_count || 0}</span>
        ),
      });
    }

    cols.push({
      key: 'date',
      label: __('Created', 'Created'),
      sortable: true,
      visible: visibleColumns.created,
      render: (trip: Trip) => (
        <span className="text-gray-500 dark:text-gray-400 text-sm">{formatDate(trip.created_at)}</span>
      ),
    });

    return cols;
  }, [isPro, visibleColumns, summarizeDestinations, summarizeTravelers, summarizeCategories, formatLabel, formatPrice, getStatusBadge, getTripTypeBadge]);

  // Row actions for shared table (3-dot menu)
  const tableActions = useMemo(() => {
    const actions: any[] = [];

    // View is always available (if capability allows)
    if (can('yatra_view_trips')) {
      actions.push({
        key: 'view',
        label: __('View', 'View'),
        icon: <Eye className="w-4 h-4" />,
        onClick: (trip: Trip) => handleView(trip),
      });
    }

    // Edit available for all statuses
    if (can('yatra_edit_trips')) {
      actions.push({
        key: 'edit',
        label: __('Edit', 'Edit'),
        icon: <Edit className="w-4 h-4" />,
        onClick: (trip: Trip) => handleEdit(trip),
      });

      // Status-based actions
      actions.push({
        key: 'publish',
        label: __('Mark as Published', 'Mark as Published'),
        icon: <ArrowUp className="w-4 h-4" />,
        onClick: async (trip: Trip) => {
          await updateTripStatus(trip, 'published');
          showToast(__('Trip marked as published.', 'Trip marked as published.'), 'success');
          queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
        condition: (trip: Trip) => trip.status !== 'published' && trip.status !== 'trash',
      });

      actions.push({
        key: 'draft',
        label: __('Mark as Draft', 'Mark as Draft'),
        icon: <ArrowDown className="w-4 h-4" />,
        onClick: async (trip: Trip) => {
          await updateTripStatus(trip, 'draft');
          showToast(__('Trip marked as draft.', 'Trip marked as draft.'), 'success');
          queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
        condition: (trip: Trip) => trip.status !== 'draft' && trip.status !== 'trash',
      });

      actions.push({
        key: 'archive',
        label: __('Archive', 'Archive'),
        icon: <Archive className="w-4 h-4" />,
        onClick: async (trip: Trip) => {
          await updateTripStatus(trip, 'archived');
          showToast(__('Trip archived.', 'Trip archived.'), 'success');
          queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
        condition: (trip: Trip) => trip.status !== 'archived' && trip.status !== 'trash',
      });

      actions.push({
        key: 'trash',
        label: __('Move to Trash', 'Move to Trash'),
        icon: <Trash2 className="w-4 h-4" />,
        onClick: async (trip: Trip) => {
          await updateTripStatus(trip, 'trash');
          showToast(__('Trip moved to trash.', 'Trip moved to trash.'), 'success');
          queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
        condition: (trip: Trip) => trip.status !== 'trash',
      });

      actions.push({
        key: 'restore',
        label: __('Restore to Draft', 'Restore to Draft'),
        icon: <ArrowUp className="w-4 h-4" />,
        onClick: async (trip: Trip) => {
          await updateTripStatus(trip, 'draft');
          showToast(__('Trip restored to draft.', 'Trip restored to draft.'), 'success');
          queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
        condition: (trip: Trip) => trip.status === 'trash',
      });
    }

    // Permanent delete only for items in Trash
    if (can('yatra_delete_trips')) {
      actions.push({
        key: 'delete',
        label: __('Delete Permanently', 'Delete Permanently'),
        icon: <Trash2 className="w-4 h-4" />,
        onClick: (trip: Trip) => handleDelete(trip),
        variant: 'destructive' as const,
        condition: (trip: Trip) => trip.status === 'trash',
      });
    }

    return actions;
  }, [can, queryClient, showToast]);

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
                className="pl-10 w-full"
                title={__('Type to search for trips by name', 'Type to search for trips by name')}
              />
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-auto lg:min-w-[160px]">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full"
              >
                <option value="all">{__('All Status', 'All Status')}</option>
                <option value="published">{__('Published', 'Published')}</option>
                <option value="draft">{__('Draft', 'Draft')}</option>
                <option value="review">{__('Review', 'Review')}</option>
                <option value="approved">{__('Approved', 'Approved')}</option>
                <option value="archived">{__('Archived', 'Archived')}</option>
                <option value="trash">{__('Trash', 'Trash')}</option>
              </Select>
            </div>

            {/* Sort By */}
            <div className="w-full lg:w-auto lg:min-w-[140px]">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full"
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

      <ConditionalRender capability="yatra_view_trips">

        {/* Bulk Actions & Column Visibility */}
        <BulkActionToolbar
          selectedIds={selectedIds}
          bulkAction={bulkAction}
          setBulkAction={setBulkAction}
          onApply={handleBulkApply}
          onClearSelection={() => setSelectedIds([])}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          statusOptions={statusOptions}
          showColumnsDropdown={showColumnsDropdown}
          setShowColumnsDropdown={setShowColumnsDropdown}
          columnOptions={columnOptions}
          onToggleColumn={toggleColumn}
          bulkMutationPending={false}
          totalItems={total}
          bulkActionOptions={bulkActionOptions}
        />

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <SharedTable
              data={trips}
              columns={columns}
              actions={tableActions}
              isLoading={isLoading}
              isError={!!error}
              errorText={__('Error Loading Trips', 'Error Loading Trips')}
              emptyText={searchTerm || statusFilter !== 'all'
                ? __('No trips match your search', 'No trips match your search')
                : __('No trips yet', 'No trips yet')}
              emptyDescription={searchTerm || statusFilter !== 'all'
                ? __('Try adjusting your search or filters to see more results.', 'Try adjusting your search or filters to see more results.')
                : __('Get started by creating your first travel package. Click the button above to add a new trip.', 'Get started by creating your first travel package. Click the button above to add a new trip.')}
              onCreateClick={!searchTerm && statusFilter === 'all' ? handleCreateTrip : undefined}
              onSort={handleSort}
              getSortIcon={getSortIcon}
              selectedItemIds={selectedIds}
              onSelectItem={handleSelectItem}
              onSelectAll={handleSelectAll}
              isAllSelected={isAllSelected}
              getItemId={(trip: Trip) => trip.id}
            />
          </CardContent>
        </Card>

        {/* Pagination - Always Visible */}
        {total > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={10}
              onPageChange={setPage}
              itemName={__('trips', 'trips')}
            />
          </div>
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

    {/* Permanent Delete Confirmation (for Trash only) */}
    <ConfirmationDialog
      isOpen={isDeleteDialogOpen && !!tripToDelete}
      onClose={() => {
        if (!deleteMutation.isPending) {
          setIsDeleteDialogOpen(false);
          setTripToDelete(null);
        }
      }}
      onConfirm={() => {
        if (tripToDelete && !deleteMutation.isPending) {
          deleteMutation.mutate(tripToDelete.id);
        }
      }}
      title={__('Delete Trip Permanently', 'Delete Trip Permanently')}
      message={tripToDelete
        ? __('Are you sure you want to permanently delete "{title}"? This cannot be undone and will remove all associated bookings.', 'Are you sure you want to permanently delete "{title}"? This cannot be undone and will remove all associated bookings.').replace('{title}', tripToDelete.title)
        : ''}
      confirmText={__('Delete Permanently', 'Delete Permanently')}
      cancelText={__('Cancel', 'Cancel')}
      variant="danger"
      isLoading={deleteMutation.isPending}
    />
    </>
  );
};

export default Trips;