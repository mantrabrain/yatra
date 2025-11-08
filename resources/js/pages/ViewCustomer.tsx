/**
 * View Customer Page
 * Display customer details in a clean, minimal SaaS-style design
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Mail, Phone, MapPin, Calendar, Users, DollarSign, FileText, Edit } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const ViewCustomer: React.FC = () => {
  const { can, isPro } = usePermissions();

  // Get customer id from URL
  const customerId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  // Fetch customer data
  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      // return await apiClient.get(`/customers/${customerId}`);
      // Dummy data for now
      const today = new Date();
      const getDate = (days: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
      };

      return {
        id: customerId,
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1 234-567-8900',
        country: 'United States',
        city: 'New York',
        address: '123 Main Street, Apt 4B, New York, NY 10001',
        status: 'active',
        notes: 'VIP customer, prefers window seats and vegetarian meals. Very satisfied with previous bookings.',
        registered_at: getDate(120),
        total_bookings: 3,
        total_spent: 6250,
        recent_bookings: [
          {
            id: 1,
            booking_number: 'YT-2024-001',
            trip_title: 'Everest Base Camp Trek',
            booking_date: getDate(5),
            travel_date: getDate(30),
            amount: 2500,
            status: 'confirmed',
          },
          {
            id: 2,
            booking_number: 'YT-2023-045',
            trip_title: 'Annapurna Circuit Adventure',
            booking_date: getDate(45),
            travel_date: getDate(60),
            amount: 1960,
            status: 'completed',
          },
          {
            id: 3,
            booking_number: 'YT-2023-032',
            trip_title: 'Langtang Valley Trek',
            booking_date: getDate(90),
            travel_date: getDate(105),
            amount: 1840,
            status: 'completed',
          },
        ],
      };
    },
    enabled: !!customerId && can('yatra_view_bookings'),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
      <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getBookingStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'confirmed': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Confirmed', 'Confirmed'),
      },
      'completed': {
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        label: __('Completed', 'Completed'),
      },
      'pending': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: __('Pending', 'Pending'),
      },
      'cancelled': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Cancelled', 'Cancelled'),
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

  const handleBack = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=customers`;
  };

  const handleEdit = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=customers&action=edit&id=${customerId}`;
  };

  const handleViewBooking = (bookingId: number) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings&action=view&id=${bookingId}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{__('Loading customer...', 'Loading customer...')}</span>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__('Customer Not Found', 'Customer Not Found')}
          description={__('The customer you are looking for does not exist', 'The customer you are looking for does not exist')}
          actions={
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__('Back to Customers', 'Back to Customers')}
            </Button>
          }
        />
        <Card>
          <CardContent className="p-8 text-center text-red-500">
            {__('Error loading customer or customer not found', 'Error loading customer or customer not found')}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Customer Details', 'Customer Details')}
        description={__('View complete customer information', 'View complete customer information')}
        actions={
          <div className="flex gap-2">
            <ConditionalRender capability="yatra_edit_bookings">
              <Button
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {__('Edit Customer', 'Edit Customer')}
              </Button>
            </ConditionalRender>
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__('Back', 'Back')}
            </Button>
          </div>
        }
      />

      <ConditionalRender capability="yatra_view_bookings">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-3">
            {/* Customer Overview */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{__('Customer Overview', 'Customer Overview')}</CardTitle>
                  {getStatusBadge(customer.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Full Name', 'Full Name')}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {customer.name}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {__('Email Address', 'Email Address')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {customer.email}
                    </div>
                  </div>
                  {customer.phone && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {__('Phone Number', 'Phone Number')}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.phone}
                      </div>
                    </div>
                  )}
                </div>

                {customer.address && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {__('Address', 'Address')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {customer.address}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__('City', 'City')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {customer.city}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__('Country', 'Country')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {customer.country}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            {customer.recent_bookings && customer.recent_bookings.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Recent Bookings', 'Recent Bookings')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{__('Booking #', 'Booking #')}</TableHead>
                        <TableHead>{__('Trip', 'Trip')}</TableHead>
                        <TableHead>{__('Booking Date', 'Booking Date')}</TableHead>
                        <TableHead>{__('Travel Date', 'Travel Date')}</TableHead>
                        <TableHead>{__('Amount', 'Amount')}</TableHead>
                        <TableHead>{__('Status', 'Status')}</TableHead>
                        <TableHead className="text-right">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.recent_bookings.map((booking: any) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium text-gray-900 dark:text-white">
                            {booking.booking_number}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            {booking.trip_title}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {formatDate(booking.booking_date)}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {formatDate(booking.travel_date)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(booking.amount)}
                          </TableCell>
                          <TableCell>
                            {getBookingStatusBadge(booking.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBooking(booking.id)}
                              className="h-8"
                            >
                              {__('View', 'View')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {customer.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {__('Notes', 'Notes')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {customer.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Statistics */}
            {isPro && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Statistics', 'Statistics')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {__('Total Bookings', 'Total Bookings')}
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {customer.total_bookings || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {__('Total Spent', 'Total Spent')}
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatPrice(customer.total_spent || 0)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{__('Timeline', 'Timeline')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {__('Registered', 'Registered')}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatDate(customer.registered_at)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ConditionalRender>
    </div>
  );
};

export default ViewCustomer;

