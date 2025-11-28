/**
 * Travelers Listing Page
 * Display all travelers from bookings with search and filter
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Eye, Mail, Phone, Calendar } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';

interface Traveler {
  id: string;
  booking_id: number;
  booking_reference: string;
  trip_id: number;
  trip_title: string;
  travel_date: string;
  traveler_index: number;
  is_lead: boolean;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  nationality?: string;
  passport?: string;
  passport_expiry?: string;
  // Dynamic fields
  [key: string]: any;
}

const Travelers: React.FC = () => {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [tripFilter, setTripFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Fetch travelers from API
  const { data, isLoading } = useQuery({
    queryKey: ['travelers', searchTerm, tripFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (searchTerm) params.append('search', searchTerm);
      if (tripFilter) params.append('trip_id', tripFilter);

      const response = await fetch(
        `${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/travelers?${params.toString()}`,
        {
          headers: {
            'X-WP-Nonce': window.yatraAdmin?.nonce || '',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch travelers');
      }

      return await response.json();
    },
    enabled: can('yatra_view_bookings'),
  });

  // Fetch trips for filter dropdown
  const { data: tripsData } = useQuery({
    queryKey: ['trips-list-filter'],
    queryFn: async () => {
      const response = await fetch(
        `${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/trips?per_page=100`,
        {
          headers: {
            'X-WP-Nonce': window.yatraAdmin?.nonce || '',
          },
        }
      );
      if (!response.ok) return { data: [] };
      const result = await response.json();
      return { data: result.data || [] };
    },
  });

  const travelers = data?.data || [];
  const totalTravelers = data?.meta?.total || 0;
  const totalPages = Math.ceil(totalTravelers / perPage);

  const handleViewBooking = (bookingId: number) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings&action=view&id=${bookingId}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Travelers', 'Travelers')}
        description={__('View all travelers from bookings', 'View all travelers from bookings')}
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__('Search by name, email, passport...', 'Search by name, email, passport...')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={tripFilter}
              onChange={(e) => {
                setTripFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-64"
            >
              <option value="">{__('All Trips', 'All Trips')}</option>
              {tripsData?.data?.map((trip: any) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{__('Total Travelers', 'Total Travelers')}</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? <Skeleton className="h-6 w-16" /> : totalTravelers}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Travelers Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{__('Traveler', 'Traveler')}</TableHead>
                  <TableHead>{__('Contact', 'Contact')}</TableHead>
                  <TableHead>{__('Trip', 'Trip')}</TableHead>
                  <TableHead>{__('Travel Date', 'Travel Date')}</TableHead>
                  <TableHead>{__('Passport', 'Passport')}</TableHead>
                  <TableHead>{__('Booking', 'Booking')}</TableHead>
                  <TableHead className="text-right">{__('Actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : travelers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || tripFilter
                  ? __('No travelers found matching your criteria', 'No travelers found matching your criteria')
                  : __('No travelers found', 'No travelers found')
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{__('Traveler', 'Traveler')}</TableHead>
                  <TableHead>{__('Contact', 'Contact')}</TableHead>
                  <TableHead>{__('Trip', 'Trip')}</TableHead>
                  <TableHead>{__('Travel Date', 'Travel Date')}</TableHead>
                  <TableHead>{__('Passport', 'Passport')}</TableHead>
                  <TableHead>{__('Booking', 'Booking')}</TableHead>
                  <TableHead className="text-right">{__('Actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {travelers.map((traveler: Traveler) => (
                  <TableRow key={traveler.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                          {(traveler.first_name?.[0] || '?').toUpperCase()}
                          {(traveler.last_name?.[0] || '').toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            {[traveler.first_name, traveler.last_name].filter(Boolean).join(' ') || 'N/A'}
                            {traveler.is_lead && (
                              <Badge variant="info" className="text-xs">
                                {__('Lead', 'Lead')}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            {traveler.gender && <span className="capitalize">{traveler.gender}</span>}
                            {traveler.nationality && (
                              <>
                                {traveler.gender && <span>•</span>}
                                <span>{traveler.nationality}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {traveler.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[180px]">{traveler.email}</span>
                          </div>
                        )}
                        {traveler.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-3 h-3" />
                            <span>{traveler.phone}</span>
                          </div>
                        )}
                        {!traveler.email && !traveler.phone && (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={traveler.trip_title}>
                        {traveler.trip_title || `Trip #${traveler.trip_id}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(traveler.travel_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {traveler.passport ? (
                        <div>
                          <div className="font-mono text-sm">{traveler.passport}</div>
                          {traveler.passport_expiry && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Exp: {formatDate(traveler.passport_expiry)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings&action=view&id=${traveler.booking_id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono text-sm"
                      >
                        {traveler.booking_reference}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewBooking(traveler.booking_id)}
                        title={__('View Booking', 'View Booking')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {__('Showing', 'Showing')} {((page - 1) * perPage) + 1} - {Math.min(page * perPage, totalTravelers)} {__('of', 'of')} {totalTravelers}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              {__('Previous', 'Previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              {__('Next', 'Next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Travelers;

