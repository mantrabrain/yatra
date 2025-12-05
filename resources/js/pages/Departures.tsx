/**
 * Departures Page
 * Manage trip departures (manual and recurring-generated)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, AlertCircle, Edit, Trash2, RotateCcw, Eye } from 'lucide-react';
import { __ } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { DateRangePicker } from '../components/ui/date-range-picker';
import { DeparturesTableSkeleton } from '../components/ui/table-skeleton';
import { BulkActionToolbar } from '../components/shared/BulkActionToolbar';
import { Table as SharedTable } from '../components/shared/Table';
import { Pagination } from '../components/shared/Pagination';
import { apiClient } from '../lib/api';
import { useToast } from '../components/ui/toast';
// Format date helper
const formatDate = (dateString: string): string => {
  if (!dateString) return '--';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

interface Traveler {
  id: number;
  booking_id: number;
  booking_reference: string;
  is_lead: boolean;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface Departure {
  id: number;
  trip_id: number;
  date: string;
  start_date?: string;
  time?: string;
  max_capacity: number;
  booked_count: number;
  available_capacity: number;
  status: 'upcoming' | 'full' | 'past' | 'cancelled' | 'trash';
  source: 'manual' | 'booking_created';
  price_override?: number;
  total_revenue?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  trip?: {
    id: number;
    title: string;
    slug?: string;
  };
  booking_ids?: number[];
  bookings_count?: number;
  travelers?: Traveler[];
  travelers_count?: number;
}

interface Trip {
  id: number;
  title: string;
}

const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null) {
    return '--';
  }
  const currency = (window as any).yatraAdmin?.currency || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

const Departures: React.FC = () => {
  // Load selected trip from localStorage on initial render
  const [selectedTripId, setSelectedTripId] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('yatra_selected_trip_id');
      return saved ? parseInt(saved) : null;
    } catch {
      return null;
    }
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'full' | 'past' | 'cancelled' | 'trash'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'booking_created'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('yatra_departures_visible_columns');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore errors
    }
    // Default column visibility (trip and source hidden by default)
    return {
      trip: false,
      date: true,
      time: true,
      capacity: true,
      booked: true,
      available: true,
      revenue: true,
      travelers: true,
      bookings: true,
      status: true,
      source: false,
    };
  });
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const [travelerModalDeparture, setTravelerModalDeparture] = useState<Departure | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Save column visibility to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('yatra_departures_visible_columns', JSON.stringify(visibleColumns));
    } catch (error) {
      console.error('Failed to save column visibility to localStorage:', error);
    }
  }, [visibleColumns]);

  // Close column menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setShowColumnMenu(false);
      }
    };

    if (showColumnMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnMenu]);

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev: typeof visibleColumns) => ({ ...prev, [column]: !prev[column] }));
  };

  const columnOptions = Object.entries(visibleColumns).map(([key, value]) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    visible: Boolean(value),
  }));

  // Save selected trip to localStorage whenever it changes
  useEffect(() => {
    try {
      if (selectedTripId) {
        localStorage.setItem('yatra_selected_trip_id', selectedTripId.toString());
      } else {
        localStorage.removeItem('yatra_selected_trip_id');
      }
    } catch (error) {
      console.error('Failed to save trip selection to localStorage:', error);
    }
  }, [selectedTripId]);

  // Fetch trips for dropdown
  const { data: tripsData } = useQuery({
    queryKey: ['trips', 'all'],
    queryFn: async () => {
      const response = await apiClient.get('/trips', { params: { per_page: 1000 } });
      return response?.data || [];
    },
  });

  // Note: We pass filter values directly to the API call instead of building queryParams

  // Fetch departures data for the current status tab (filtered list)
  const { data: departuresData, isLoading } = useQuery({
    queryKey: ['departures', selectedTripId, statusFilter, sourceFilter, searchTerm, dateFrom, dateTo, page],
    queryFn: async () => {
      // API endpoint based on if a trip is selected
      const endpoint = selectedTripId ? `/trips/${selectedTripId}/departures` : '/departures';
      
      const response = await apiClient.get(endpoint, {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          source: sourceFilter !== 'all' ? sourceFilter : undefined,
          search: searchTerm || undefined,
          date_from: (dateFrom && dateFrom.trim() !== '') ? dateFrom : undefined,
          date_to: (dateTo && dateTo.trim() !== '') ? dateTo : undefined,
          include_past: (dateFrom && dateFrom.trim() !== '') || (dateTo && dateTo.trim() !== '') ? 'true' : 'false',
          page: page,
          per_page: 20,
        },
      });
      
      // apiClient returns the full response: {success, data, meta}
      // response.data is the array of departures
      // We need to return the structure as {data: [...], meta: {...}}
      const result = {
        data: response?.data || [],
        meta: response?.meta || { total: 0 }
      };
      
      // Debug: Log the first departure to see time and revenue values
      if (result.data.length > 0) {
        console.log('First departure data:', result.data[0]);
        console.log('Time value:', result.data[0].time);
        console.log('Revenue value:', result.data[0].total_revenue);
      }
      
      return result;
    },
    // Always enabled, whether trip is selected or not
    enabled: true,
  });

  const departures: Departure[] = departuresData?.data || [];

  const totalItems = departuresData?.meta?.total ?? 0;
  const itemsPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Fetch departures stats without status filter so tab counts stay stable across tabs
  const { data: departuresStatsData } = useQuery({
    queryKey: ['departures-stats', selectedTripId, sourceFilter, searchTerm, dateFrom, dateTo],
    queryFn: async () => {
      const endpoint = selectedTripId ? `/trips/${selectedTripId}/departures` : '/departures';

      const response = await apiClient.get(endpoint, {
        params: {
          // NOTE: intentionally no status param here
          source: sourceFilter !== 'all' ? sourceFilter : undefined,
          search: searchTerm || undefined,
          date_from: (dateFrom && dateFrom.trim() !== '') ? dateFrom : undefined,
          date_to: (dateTo && dateTo.trim() !== '') ? dateTo : undefined,
          include_past: (dateFrom && dateFrom.trim() !== '') || (dateTo && dateTo.trim() !== '') ? 'true' : 'false',
          page: 1,
          per_page: 1000,
        },
      });

      return response?.data || [];
    },
    enabled: true,
  });

  const statusCounts = useMemo(() => {
    const allDepartures: Departure[] = Array.isArray(departuresStatsData) ? departuresStatsData : [];

    const counts = {
      all: allDepartures.length,
      upcoming: 0,
      full: 0,
      past: 0,
      cancelled: 0,
      trash: 0,
    };

    allDepartures.forEach((departure) => {
      if (departure.status === 'upcoming') counts.upcoming += 1;
      if (departure.status === 'full') counts.full += 1;
      if (departure.status === 'past') counts.past += 1;
      if (departure.status === 'cancelled') counts.cancelled += 1;
      if (departure.status === 'trash') counts.trash += 1;
    });

    return counts;
  }, [departuresStatsData]);

  const statusOptions = [
    { key: 'all', label: __('All', 'All'), count: statusCounts.all },
    { key: 'upcoming', label: __('Upcoming', 'Upcoming'), count: statusCounts.upcoming },
    { key: 'full', label: __('Full', 'Full'), count: statusCounts.full },
    { key: 'past', label: __('Past', 'Past'), count: statusCounts.past },
    { key: 'cancelled', label: __('Cancelled', 'Cancelled'), count: statusCounts.cancelled },
    { key: 'trash', label: __('Trash', 'Trash'), count: statusCounts.trash },
  ];

  const bulkActionOptions = useMemo(
    () => {
      if (statusFilter === 'trash') {
        return [
          { value: 'restore', label: __('Restore', 'Restore') },
          { value: 'delete', label: __('Delete Permanently', 'Delete Permanently') },
        ];
      }
      return [
        { value: 'trash', label: __('Move to Trash', 'Move to Trash') },
      ];
    },
    [statusFilter]
  );

  const handleBulkApply = async () => {
    const ids = selectedIds;

    if (!bulkAction || ids.length === 0) {
      showToast(
        __('Please select departures and a bulk action first.', 'Please select departures and a bulk action first.'),
        'error'
      );
      return;
    }

    if (!selectedTripId) {
      showToast(__('Please select a trip first', 'Please select a trip first'), 'error');
      return;
    }

    try {
      if (bulkAction === 'trash') {
        // Move to trash
        await Promise.all(
          ids.map((id) =>
            apiClient.patch(`/trips/${selectedTripId}/departures/${id}`, {
              status: 'trash',
            })
          )
        );
        showToast(
          __('Selected departures moved to trash.', 'Selected departures moved to trash.'),
          'success'
        );
      } else if (bulkAction === 'restore') {
        // Restore from trash
        await Promise.all(
          ids.map((id) =>
            apiClient.patch(`/trips/${selectedTripId}/departures/${id}`, {
              status: 'upcoming',
            })
          )
        );
        showToast(
          __('Selected departures restored.', 'Selected departures restored.'),
          'success'
        );
      } else if (bulkAction === 'delete') {
        // Delete permanently (only from trash)
        const eligibleIds = departures
          .filter(
            (d) =>
              ids.includes(d.id) &&
              d.status === 'trash' &&
              d.source === 'booking_created' &&
              d.booked_count === 0
          )
          .map((d) => d.id);

        if (eligibleIds.length === 0) {
          showToast(
            __('No selected departures can be deleted (must be in trash, booking-created with zero bookings).',
              'No selected departures can be deleted (must be in trash, booking-created with zero bookings).'),
            'error'
          );
          return;
        }

        await Promise.all(
          eligibleIds.map((id) =>
            apiClient.delete(`/trips/${selectedTripId}/departures/${id}`)
          )
        );
        showToast(
          __('Selected departures deleted permanently.', 'Selected departures deleted permanently.'),
          'success'
        );
      }

      setSelectedIds([]);
      setBulkAction('');
      queryClient.invalidateQueries({ queryKey: ['departures', selectedTripId] });
      queryClient.invalidateQueries({ queryKey: ['departures-stats', selectedTripId] });
    } catch (error: any) {
      showToast(
        error?.message ||
          __('Failed to perform bulk action. Please try again.',
            'Failed to perform bulk action. Please try again.'),
        'error'
      );
    }
  };

  // Delete departure mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!selectedTripId) return;
      await apiClient.delete(`/trips/${selectedTripId}/departures/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departures', selectedTripId] });
      showToast(__('Departure deleted successfully', 'Departure deleted successfully'), 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete departure', 'Failed to delete departure'), 'error');
    },
  });

  const handleDelete = (id: number) => {
    if (!confirm(__('Are you sure you want to delete this departure?', 'Are you sure you want to delete this departure?'))) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const isAllSelected = departures.length > 0 && selectedIds.length === departures.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(departures.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((existingId) => existingId !== id)
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      upcoming: { label: __('Upcoming', 'Upcoming'), className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
      full: { label: __('Full', 'Full'), className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
      past: { label: __('Past', 'Past'), className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' },
      cancelled: { label: __('Cancelled', 'Cancelled'), className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
      trash: { label: __('Trash', 'Trash'), className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
    };

    const statusInfo = statusMap[status] || statusMap.upcoming;

    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    if (source === 'manual') {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">{__('Manual', 'Manual')}</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">{__('Booking Created', 'Booking Created')}</Badge>;
  };

  const navigateToAdd = () => {
    if (!selectedTripId) {
      showToast(__('Please select a trip first', 'Please select a trip first'), 'error');
      return;
    }
    window.location.href = `?page=yatra&subpage=departures&action=create&trip_id=${selectedTripId}`;
  };

  const navigateToEdit = (id: number) => {
    if (!selectedTripId) return;
    window.location.href = `?page=yatra&subpage=departures&action=edit&id=${id}&trip_id=${selectedTripId}`;
  };

  const navigateToView = (id: number) => {
    if (!selectedTripId) return;
    window.location.href = `?page=yatra&subpage=departures&action=view&id=${id}&trip_id=${selectedTripId}`;
  };

  const clearDateFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  const openTravelerModal = (departure: Departure) => {
    if (!departure.travelers || !departure.travelers.length) {
      return;
    }
    setTravelerModalDeparture(departure);
  };

  const closeTravelerModal = () => setTravelerModalDeparture(null);

  const departureColumns = React.useMemo(
    () => [
      {
        key: 'trip',
        label: __('Trip', 'Trip'),
        visible: visibleColumns.trip,
        render: (departure: Departure) =>
          departure.trip?.title ? (
            <a
              href={`?page=yatra&subpage=trips&action=edit&id=${departure.trip.id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
              title={__('View trip', 'View trip')}
            >
              {departure.trip.title}
            </a>
          ) : (
            <span className="text-gray-400">--</span>
          ),
      },
      {
        key: 'date',
        label: __('Date', 'Date'),
        visible: visibleColumns.date,
        render: (departure: Departure) =>
          formatDate(departure.start_date || departure.date),
      },
      {
        key: 'time',
        label: __('Time', 'Time'),
        visible: visibleColumns.time,
        render: (departure: Departure) =>
          departure.time ? (
            <span className="font-mono">{departure.time}</span>
          ) : (
            <span className="text-gray-400">--</span>
          ),
      },
      {
        key: 'capacity',
        label: __('Capacity', 'Capacity'),
        visible: visibleColumns.capacity,
        render: (departure: Departure) => (
          <span title={__('Max Capacity', 'Max Capacity')}>
            {departure.max_capacity}
          </span>
        ),
      },
      {
        key: 'booked',
        label: __('Booked', 'Booked'),
        visible: visibleColumns.booked,
        render: (departure: Departure) => (
          <span title={__('Booked Count', 'Booked Count')}>
            {departure.booked_count}
          </span>
        ),
      },
      {
        key: 'available',
        label: __('Available', 'Available'),
        visible: visibleColumns.available,
        render: (departure: Departure) => (
          <span
            className={departure.available_capacity === 0 ? 'text-red-600 font-semibold' : ''}
            title={__('Available Capacity', 'Available Capacity')}
          >
            {departure.available_capacity}
          </span>
        ),
      },
      {
        key: 'revenue',
        label: __('Revenue', 'Revenue'),
        visible: visibleColumns.revenue,
        render: (departure: Departure) =>
          departure.total_revenue !== undefined && departure.total_revenue > 0 ? (
            <span className="font-semibold text-green-600">
              {formatCurrency(departure.total_revenue)}
            </span>
          ) : (
            <span className="text-gray-400">--</span>
          ),
      },
      {
        key: 'travelers',
        label: __('Travelers', 'Travelers'),
        visible: visibleColumns.travelers,
        render: (departure: Departure) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openTravelerModal(departure)}
            disabled={!departure.travelers || departure.travelers.length === 0}
            className="px-3 py-1.5"
          >
            {departure.travelers_count || departure.travelers?.length || 0}{' '}
            {__('Traveler(s)', 'Traveler(s)')}
          </Button>
        ),
      },
      {
        key: 'bookings',
        label: __('Bookings', 'Bookings'),
        visible: visibleColumns.bookings,
        render: (departure: Departure) =>
          departure.booking_ids && departure.booking_ids.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {departure.booking_ids.slice(0, 3).map((bookingId) => (
                <a
                  key={bookingId}
                  href={`?page=yatra&subpage=bookings&action=view&id=${bookingId}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                  title={__('View booking', 'View booking')}
                >
                  #{bookingId}
                </a>
              ))}
              {departure.booking_ids.length > 3 && (
                <span className="text-gray-500 text-sm">
                  +{departure.booking_ids.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400">--</span>
          ),
      },
      {
        key: 'status',
        label: __('Status', 'Status'),
        visible: visibleColumns.status,
        render: (departure: Departure) => getStatusBadge(departure.status),
      },
      {
        key: 'source',
        label: __('Source', 'Source'),
        visible: visibleColumns.source,
        render: (departure: Departure) => getSourceBadge(departure.source),
      },
    ],
    [visibleColumns, openTravelerModal]
  );

  const handleMoveToTrash = async (departure: Departure) => {
    if (!selectedTripId) return;
    if (!window.confirm(__('Are you sure you want to move this departure to trash?', 'Are you sure you want to move this departure to trash?'))) {
      return;
    }
    try {
      await apiClient.patch(`/trips/${selectedTripId}/departures/${departure.id}`, {
        status: 'trash',
      });
      showToast(__('Departure moved to trash.', 'Departure moved to trash.'), 'success');
      queryClient.invalidateQueries({ queryKey: ['departures', selectedTripId] });
      queryClient.invalidateQueries({ queryKey: ['departures-stats', selectedTripId] });
    } catch (error: any) {
      showToast(error?.message || __('Failed to move departure to trash', 'Failed to move departure to trash'), 'error');
    }
  };

  const handleRestore = async (departure: Departure) => {
    if (!selectedTripId) return;
    if (!window.confirm(__('Are you sure you want to restore this departure?', 'Are you sure you want to restore this departure?'))) {
      return;
    }
    try {
      await apiClient.patch(`/trips/${selectedTripId}/departures/${departure.id}`, {
        status: 'upcoming',
      });
      showToast(__('Departure restored.', 'Departure restored.'), 'success');
      queryClient.invalidateQueries({ queryKey: ['departures', selectedTripId] });
      queryClient.invalidateQueries({ queryKey: ['departures-stats', selectedTripId] });
    } catch (error: any) {
      showToast(error?.message || __('Failed to restore departure', 'Failed to restore departure'), 'error');
    }
  };

  const tableActions = React.useMemo(
    () => {
      const actions = [
        {
          key: 'view',
          label: __('View', 'View'),
          icon: <Eye className="w-4 h-4" />,
          onClick: (departure: Departure) => navigateToView(departure.id),
        },
        {
          key: 'edit',
          label: __('Edit', 'Edit'),
          icon: <Edit className="w-4 h-4" />,
          onClick: (departure: Departure) => navigateToEdit(departure.id),
          condition: (departure: Departure) => departure.status !== 'trash',
        },
      ];

      if (statusFilter === 'trash') {
        actions.push({
          key: 'restore',
          label: __('Restore', 'Restore'),
          icon: <RotateCcw className="w-4 h-4" />,
          onClick: (departure: Departure) => handleRestore(departure),
        } as any);
        actions.push({
          key: 'delete',
          label: __('Delete Permanently', 'Delete Permanently'),
          icon: <Trash2 className="w-4 h-4" />,
          onClick: (departure: Departure) => handleDelete(departure.id),
        } as any);
      } else {
        actions.push({
          key: 'trash',
          label: __('Move to Trash', 'Move to Trash'),
          icon: <Trash2 className="w-4 h-4" />,
          onClick: (departure: Departure) => handleMoveToTrash(departure),
          variant: 'destructive' as const,
        } as any);
      }

      return actions;
    },
    [statusFilter, navigateToEdit, handleDelete, handleRestore, handleMoveToTrash]
  );

  return (
    <>
      <div className="space-y-6">
      <PageHeader
        title={__('Departures', 'Departures')}
        description={__('Manage trip departure dates and capacity', 'Manage trip departure dates and capacity')}
        actions={
          <div className="flex gap-2">
            {selectedTripId && (
              <Button onClick={navigateToAdd} variant="default">
                <Plus className="w-4 h-4 mr-2" />
                {__('Add Departure', 'Add Departure')}
              </Button>
            )}
          </div>
        }
      />

      {/* Trip Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__('Select Trip', 'Select Trip')}
              </label>
              <Select
                value={selectedTripId?.toString() || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedTripId(value ? parseInt(value) : null);
                  setPage(1);
                }}
              >
                <option value="">{__('-- Select a trip --', '-- Select a trip --')}</option>
                {tripsData?.map((trip: Trip) => (
                  <option key={trip.id} value={trip.id.toString()}>
                    {trip.title}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex gap-4 items-end flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Search', 'Search')}
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder={__('Search by date or notes...', 'Search by date or notes...')}
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setPage(1);
                        }}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Status', 'Status')}
                    </label>
                    <Select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value as any);
                        setPage(1);
                      }}
                    >
                      <option value="all">{__('All Status', 'All Status')}</option>
                      <option value="upcoming">{__('Upcoming', 'Upcoming')}</option>
                      <option value="full">{__('Full', 'Full')}</option>
                      <option value="past">{__('Past', 'Past')}</option>
                      <option value="cancelled">{__('Cancelled', 'Cancelled')}</option>
                    </Select>
                  </div>
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Source', 'Source')}
                    </label>
                    <Select
                      value={sourceFilter}
                      onChange={(e) => {
                        setSourceFilter(e.target.value as any);
                        setPage(1);
                      }}
                    >
                      <option value="all">{__('All Sources', 'All Sources')}</option>
                      <option value="manual">{__('Manual', 'Manual')}</option>
                      <option value="booking_created">{__('Booking Created', 'Booking Created')}</option>
                    </Select>
                  </div>
                  <div className="w-80">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Date Range', 'Date Range')}
                    </label>
                    <DateRangePicker
                      dateFrom={dateFrom}
                      dateTo={dateTo}
                      onDateFromChange={(dateStr) => {
                        setDateFrom(dateStr || '');
                        setPage(1);
                      }}
                      onDateToChange={(dateStr) => {
                        setDateTo(dateStr || '');
                        setPage(1);
                      }}
                      onClear={clearDateFilters}
                      placeholder={__('Select date range...', 'Select date range...')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk actions + status tabs */}
          <BulkActionToolbar
            selectedIds={selectedIds}
            bulkAction={bulkAction}
            setBulkAction={setBulkAction}
            onApply={handleBulkApply}
            onClearSelection={() => setSelectedIds([])}
            statusFilter={statusFilter}
            setStatusFilter={(filter) => {
              setStatusFilter(filter as any);
              setPage(1);
            }}
            statusOptions={statusOptions}
            showColumnsDropdown={showColumnMenu}
            setShowColumnsDropdown={setShowColumnMenu}
            columnOptions={columnOptions}
            onToggleColumn={(key) => toggleColumn(key as keyof typeof visibleColumns)}
            bulkMutationPending={deleteMutation.isPending}
            totalItems={departures.length}
            bulkActionOptions={bulkActionOptions}
          />

          {/* Departures Table */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <DeparturesTableSkeleton visibleColumns={visibleColumns} />
              ) : !departuresData?.data?.length ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{__('No departures found', 'No departures found')}</p>
                  <Button onClick={navigateToAdd} variant="outline" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    {__('Add Departure', 'Add Departure')}
                  </Button>
                </div>
              ) : (
                <SharedTable
                  data={departures}
                  columns={departureColumns}
                  actions={tableActions}
                  selectedItemIds={selectedIds}
                  onSelectItem={(id, checked) => handleSelectRow(id as number, checked)}
                  onSelectAll={handleSelectAll}
                  isAllSelected={isAllSelected}
                  getItemId={(departure: Departure) => departure.id}
                  getItemStatus={(departure: Departure) => departure.status}
                />
              )}
            </CardContent>
          </Card>

          {totalItems > 0 && departures.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={(newPage) => setPage(newPage)}
                itemName={__('departures', 'departures')}
              />
            </div>
          )}
    </div>

      {travelerModalDeparture && travelerModalDeparture.travelers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {__('Travelers for', 'Travelers for')}{' '}
                  {travelerModalDeparture.trip?.title || __('Trip', 'Trip')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(travelerModalDeparture.start_date || travelerModalDeparture.date)}
                </p>
              </div>
              <Button variant="outline" onClick={closeTravelerModal}>
                {__('Close', 'Close')}
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{__('Traveler', 'Traveler')}</TableHead>
                    <TableHead>{__('Lead', 'Lead')}</TableHead>
                    <TableHead>{__('Email', 'Email')}</TableHead>
                    <TableHead>{__('Phone', 'Phone')}</TableHead>
                    <TableHead>{__('Booking', 'Booking')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {travelerModalDeparture.travelers.map((traveler) => (
                    <TableRow key={traveler.id}>
                      <TableCell className="font-semibold text-gray-800 dark:text-gray-100">
                        {traveler.first_name || '—'} {traveler.last_name || ''}
                      </TableCell>
                      <TableCell>
                        {traveler.is_lead ? (
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            {__('Lead', 'Lead')}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>{traveler.email || '—'}</TableCell>
                      <TableCell>{traveler.phone || '—'}</TableCell>
                      <TableCell>
                        <a
                          href={`?page=yatra&subpage=bookings&action=view&id=${traveler.booking_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {traveler.booking_reference || `#${traveler.booking_id}`}
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Departures;

