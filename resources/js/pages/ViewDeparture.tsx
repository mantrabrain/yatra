import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { __ } from '../lib/i18n';
import { apiClient } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '--';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null) {
    return '--';
  }

  const admin = (window as any)?.yatraAdmin || {};
  const currencyCode: string = admin.currency || 'USD';
  const position: string = admin.currency_position || 'left';
  const decimalsRaw = admin.currency_decimals;
  const decimals = Number.isFinite(Number(decimalsRaw)) ? Math.max(0, Math.min(4, Number(decimalsRaw))) : 2;

  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    GHS: '₵',
    AUD: 'A$',
    CAD: 'C$',
  };

  const symbol = symbolMap[currencyCode] || currencyCode;
  const core = (Number(value) || 0).toFixed(decimals);

  switch (position) {
    case 'right':
      return `${core}${symbol}`;
    case 'left_space':
      return `${symbol} ${core}`;
    case 'right_space':
      return `${core} ${symbol}`;
    case 'left':
    default:
      return `${symbol}${core}`;
  }
};

const ViewDeparture: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('id');
  const tripIdParam = params.get('trip_id');

  const id = idParam ? parseInt(idParam, 10) : NaN;
  const tripId = tripIdParam ? parseInt(tripIdParam, 10) : NaN;

  const { data, isLoading, error } = useQuery({
    queryKey: ['departure-view', tripId, id],
    enabled: Number.isFinite(id) && Number.isFinite(tripId),
    queryFn: async () => {
      if (!Number.isFinite(id) || !Number.isFinite(tripId)) {
        throw new Error('Invalid departure or trip ID');
      }
      const response = await apiClient.get(`/trips/${tripId}/departures/${id}`);
      return response || {};
    },
  });

  if (!Number.isFinite(id) || !Number.isFinite(tripId)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{__('Departure not found', 'Departure not found')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {__('Missing or invalid departure ID or trip ID in the URL.', 'Missing or invalid departure ID or trip ID in the URL.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{__('Error loading departure', 'Error loading departure')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400">
            {(error as any)?.message || __('Unable to load departure details.', 'Unable to load departure details.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const departure: any = data?.data || data || {};
  const tripTitle = departure?.trip?.title || departure?.trip_title || '--';
  const tripSummary = departure?.trip?.summary || '';
  const status = departure?.status || 'upcoming';
  const maxCapacity = departure?.max_capacity ?? departure?.total_spots ?? 0;
  const booked = departure?.booked_count ?? departure?.bookings_count ?? 0;
  const available = departure?.available_capacity ?? departure?.available_spots ?? 0;
  const source = departure?.source || 'manual';

  const statusLabelMap: Record<string, string> = {
    upcoming: __('Upcoming', 'Upcoming'),
    full: __('Full', 'Full'),
    past: __('Past', 'Past'),
    cancelled: __('Cancelled', 'Cancelled'),
    trash: __('Trash', 'Trash'),
  };

  const sourceLabelMap: Record<string, string> = {
    manual: __('Manual', 'Manual'),
    booking_created: __('Booking Created', 'Booking Created'),
  };

  const statusLabel = statusLabelMap[status] || status;
  const sourceLabel = sourceLabelMap[source] || source;

  const occupancy = maxCapacity > 0 ? Math.max(0, Math.min(100, ((maxCapacity - available) / maxCapacity) * 100)) : 0;
  const travelers: any[] = Array.isArray(departure.travelers) ? departure.travelers : [];
  const bookingIds: number[] = Array.isArray(departure.booking_ids) ? departure.booking_ids : [];

  const bookingsSummary = bookingIds.map((bookingId) => {
    const relatedTravelers = travelers.filter((t) => t.booking_id === bookingId);
    const leadTraveler = relatedTravelers.find((t) => t.is_lead) || relatedTravelers[0];
    const reference = leadTraveler?.booking_reference || `#${bookingId}`;
    const travelerCount = relatedTravelers.length;

    return {
      id: bookingId,
      reference,
      travelerCount,
      leadName: leadTraveler ? `${leadTraveler.first_name || ''} ${leadTraveler.last_name || ''}`.trim() : '',
    };
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>{tripTitle}</CardTitle>
              {tripSummary && (
                <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl">
                  {tripSummary}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge>{statusLabel}</Badge>
              <Badge variant="outline">{sourceLabel}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-700 dark:text-gray-200">
          {/* Core details card */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {__('Departure Date', 'Departure Date')}
                </div>
                <div>{formatDate(departure.start_date || departure.date)}</div>
              </div>
              {departure.time && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {__('Time', 'Time')}
                  </div>
                  <div>{departure.time}</div>
                </div>
              )}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {__('Capacity', 'Capacity')}
                </div>
                <div>
                  {booked} {__('booked', 'booked')} / {maxCapacity} {__('total', 'total')}{' '}
                  ({available} {__('available', 'available')})
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {__('Occupancy', 'Occupancy')}
                </div>
                <div className="mt-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${occupancy}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                    {occupancy.toFixed(0)}% {__('occupied', 'occupied')}
                  </span>
                </div>
              </div>
              {departure.total_revenue !== undefined && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {__('Total Revenue', 'Total Revenue')}
                  </div>
                  <div>{formatCurrency(departure.total_revenue)}</div>
                </div>
              )}
              {departure.price_override !== undefined && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {__('Price Override', 'Price Override')}
                  </div>
                  <div>{formatCurrency(departure.price_override)}</div>
                </div>
              )}
              {departure.created_at && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {__('Created At', 'Created At')}
                  </div>
                  <div>{formatDate(departure.created_at)}</div>
                </div>
              )}
              {departure.updated_at && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {__('Last Updated', 'Last Updated')}
                  </div>
                  <div>{formatDate(departure.updated_at)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Notes card */}
          {departure.notes && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                {__('Notes', 'Notes')}
              </div>
              <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {departure.notes}
              </div>
            </div>
          )}

          {/* Bookings + Travelers card (side by side) */}
          {(bookingIds.length > 0 || travelers.length > 0) && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                {__('Bookings & Travelers', 'Bookings & Travelers')}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: bookings list */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    {__('Bookings', 'Bookings')}
                  </div>
                  {bookingsSummary.length > 0 ? (
                    <div className="space-y-2">
                      {bookingsSummary.map((b) => (
                        <a
                          key={b.id}
                          href={`?page=yatra&subpage=bookings&action=view&id=${b.id}`}
                          className="block rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm transition hover:border-blue-500 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-blue-400 dark:hover:text-blue-300"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">
                              {b.reference}
                            </span>
                            {b.travelerCount > 0 && (
                              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                {b.travelerCount}{' '}
                                {b.travelerCount === 1
                                  ? __('traveler', 'traveler')
                                  : __('travelers', 'travelers')}
                              </span>
                            )}
                          </div>
                          {b.leadName && (
                            <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                              {__('Lead:', 'Lead:')} {b.leadName}
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {__('No bookings linked to this departure yet.', 'No bookings linked to this departure yet.')}
                    </p>
                  )}
                </div>

                {/* Right: traveler cards */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    {__('Travelers', 'Travelers')}
                  </div>
                  {travelers.length > 0 ? (
                    <div className="space-y-2">
                      {travelers.map((t) => (
                        <div
                          key={t.id}
                          className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900"
                        >
                          <div>
                            <div className="font-medium">
                              {t.first_name} {t.last_name}{' '}
                              {t.is_lead && (
                                <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                                  ({__('Lead Traveler', 'Lead Traveler')})
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">
                              {t.email}
                              {t.phone && ` \u00b7 ${t.phone}`}
                            </div>
                          </div>
                          {t.booking_reference && (
                            <a
                              href={`?page=yatra&subpage=bookings&action=view&id=${t.booking_id}`}
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {__('View Booking', 'View Booking')} #{t.booking_reference}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {__('No travelers found for this departure yet.', 'No travelers found for this departure yet.')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
;

export default ViewDeparture;
