/**
 * Departures Page
 * Manage trip departures (manual and recurring-generated)
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { DatePicker } from '../components/ui/date-picker';
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
  status: 'upcoming' | 'full' | 'past' | 'cancelled';
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
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'full' | 'past' | 'cancelled'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'booking_created'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState(1);
  const [travelerModalDeparture, setTravelerModalDeparture] = useState<Departure | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch trips for dropdown
  const { data: tripsData } = useQuery({
    queryKey: ['trips', 'all'],
    queryFn: async () => {
      const response = await apiClient.get('/trips', { params: { per_page: 1000 } });
      return response?.data || [];
    },
  });

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: 20,
    };

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    if (sourceFilter !== 'all') {
      params.source = sourceFilter;
    }

    if (searchTerm) {
      params.search = searchTerm;
    }

    // Add date range filters
    if (dateFrom) {
      params.date_from = dateFrom; // Already in YYYY-MM-DD format
    }

    if (dateTo) {
      params.date_to = dateTo; // Already in YYYY-MM-DD format
    }

    return params;
  }, [statusFilter, sourceFilter, searchTerm, dateFrom, dateTo, page]);

  // Fetch departures
  const { data: departuresData, isLoading } = useQuery({
    queryKey: ['departures', selectedTripId, queryParams],
    queryFn: async () => {
      if (!selectedTripId) return { data: [], total: 0 };
      const response = await apiClient.get(`/trips/${selectedTripId}/departures`, { params: queryParams });
      return {
        data: response?.data || [],
        total: response?.meta?.total || 0,
      };
    },
    enabled: !!selectedTripId,
  });

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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      upcoming: { label: __('Upcoming', 'Upcoming'), className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
      full: { label: __('Full', 'Full'), className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
      past: { label: __('Past', 'Past'), className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' },
      cancelled: { label: __('Cancelled', 'Cancelled'), className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
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

  const clearDateFilters = () => {
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const openTravelerModal = (departure: Departure) => {
    if (!departure.travelers || !departure.travelers.length) {
      return;
    }
    setTravelerModalDeparture(departure);
  };

  const closeTravelerModal = () => setTravelerModalDeparture(null);

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

      {selectedTripId && (
        <>
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
                </div>
                <div className="flex gap-4 items-end flex-wrap border-t pt-4">
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Date From', 'Date From')}
                    </label>
                    <DatePicker
                      value={dateFrom}
                      onChange={(dateStr) => {
                        setDateFrom(dateStr || '');
                        setPage(1);
                      }}
                      placeholder={__('Start date', 'Start date')}
                    />
                  </div>
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Date To', 'Date To')}
                    </label>
                    <DatePicker
                      value={dateTo}
                      onChange={(dateStr) => {
                        setDateTo(dateStr || '');
                        setPage(1);
                      }}
                      placeholder={__('End date', 'End date')}
                      minDate={dateFrom ? new Date(dateFrom) : undefined}
                    />
                  </div>
                  {(dateFrom || dateTo) && (
                    <div>
                      <Button
                        variant="outline"
                        onClick={clearDateFilters}
                        className="h-10"
                      >
                        {__('Clear Dates', 'Clear Dates')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Departures Table */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">{__('Loading...', 'Loading...')}</div>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{__('Trip', 'Trip')}</TableHead>
                      <TableHead>{__('Date', 'Date')}</TableHead>
                      <TableHead>{__('Time', 'Time')}</TableHead>
                      <TableHead>{__('Capacity', 'Capacity')}</TableHead>
                      <TableHead>{__('Booked', 'Booked')}</TableHead>
                      <TableHead>{__('Available', 'Available')}</TableHead>
                      <TableHead>{__('Revenue', 'Revenue')}</TableHead>
                      <TableHead>{__('Travelers', 'Travelers')}</TableHead>
                      <TableHead>{__('Bookings', 'Bookings')}</TableHead>
                      <TableHead>{__('Status', 'Status')}</TableHead>
                      <TableHead>{__('Source', 'Source')}</TableHead>
                      <TableHead>{__('Actions', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departuresData.data.map((departure: Departure) => (
                      <TableRow key={departure.id}>
                        <TableCell>
                          {departure.trip?.title ? (
                            <a
                              href={`?page=yatra&subpage=trips&action=edit&id=${departure.trip.id}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                              title={__('View trip', 'View trip')}
                            >
                              {departure.trip.title}
                            </a>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(departure.start_date || departure.date)}
                        </TableCell>
                        <TableCell>
                          {departure.time ? (
                            <span className="font-mono">{departure.time}</span>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span title={__('Max Capacity', 'Max Capacity')}>
                            {departure.max_capacity}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span title={__('Booked Count', 'Booked Count')}>
                            {departure.booked_count}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span 
                            className={departure.available_capacity === 0 ? 'text-red-600 font-semibold' : ''}
                            title={__('Available Capacity', 'Available Capacity')}
                          >
                            {departure.available_capacity}
                          </span>
                        </TableCell>
                        <TableCell>
                          {departure.total_revenue !== undefined && departure.total_revenue > 0 ? (
                            <span className="font-semibold text-green-600">
                              {formatCurrency(departure.total_revenue)}
                            </span>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTravelerModal(departure)}
                            disabled={!departure.travelers || departure.travelers.length === 0}
                          >
                            {departure.travelers_count || departure.travelers?.length || 0}{' '}
                            {__('Traveler(s)', 'Traveler(s)')}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {departure.booking_ids && departure.booking_ids.length > 0 ? (
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
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(departure.status)}</TableCell>
                        <TableCell>{getSourceBadge(departure.source)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigateToEdit(departure.id)}
                              title={__('Edit departure', 'Edit departure')}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {departure.source === 'booking_created' && departure.booked_count === 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(departure.id)}
                                className="text-red-600 hover:text-red-700"
                                title={__('Delete departure', 'Delete departure')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedTripId && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{__('Please select a trip to view departures', 'Please select a trip to view departures')}</p>
            </div>
          </CardContent>
        </Card>
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

