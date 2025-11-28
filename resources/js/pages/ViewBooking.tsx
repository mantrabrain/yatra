/**
 * View Booking Page
 * Display booking details in a clean, minimal SaaS-style design
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Calendar, Users, DollarSign, CreditCard, FileText } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Skeleton } from '../components/ui/skeleton';

const ViewBooking: React.FC = () => {
  const { can } = usePermissions();

  // Get booking id from URL
  const bookingId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  // Fetch booking data from API
  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      
      const response = await fetch(`${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/bookings/${bookingId}`, {
        headers: {
          'X-WP-Nonce': window.yatraAdmin?.nonce || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch booking');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const data = result.data;
        return {
          id: data.id,
          booking_number: data.reference,
          customer_name: data.customer_name || `${data.contact_first_name || ''} ${data.contact_last_name || ''}`.trim() || 'N/A',
          customer_email: data.customer_email,
          customer_phone: data.customer_phone,
          customer_country: data.contact_country,
          trip_id: data.trip_id,
          trip_title: data.trip_title || `Trip #${data.trip_id}`,
          trip_image: data.trip_image,
          trip_price: data.total_amount / (data.travelers_count || 1),
          booking_date: data.created_at,
          travel_date: data.travel_date,
          travelers: data.travelers_count,
          travelers_data: data.travelers || [],
          total_amount: data.total_amount,
          amount_paid: data.amount_paid || 0,
          amount_due: data.amount_due || 0,
          currency: data.currency || 'USD',
          payment_status: data.payment_status,
          booking_status: data.status,
          payment_method: data.payment_gateway,
          payment_date: data.payment_date,
          notes: data.special_requests,
          internal_notes: data.internal_notes,
          emergency_contact: data.emergency_contact,
          contact_data: data.contact_data,
          payments: data.payments || [],
          created_at: data.created_at,
          updated_at: data.updated_at,
          confirmed_at: data.confirmed_at,
          completed_at: data.completed_at,
          cancelled_at: data.cancelled_at,
          cancellation_reason: data.cancellation_reason,
          trip_details: data.trip_details,
        };
      }

      return null;
    },
    enabled: !!bookingId && can('yatra_view_bookings'),
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

  const getBookingStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'confirmed': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Confirmed', 'Confirmed'),
      },
      'pending': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: __('Pending', 'Pending'),
      },
      'cancelled': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Cancelled', 'Cancelled'),
      },
      'completed': {
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        label: __('Completed', 'Completed'),
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

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'paid': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Paid', 'Paid'),
      },
      'pending': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: __('Pending', 'Pending'),
      },
      'partial': {
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
        label: __('Partial', 'Partial'),
      },
      'refunded': {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        label: __('Refunded', 'Refunded'),
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

  const handleBack = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings`;
  };

  const handleEdit = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings&action=edit&id=${bookingId}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-3">
            {/* Booking Overview Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-36" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-20 rounded-md" />
                    <Skeleton className="h-6 w-16 rounded-md" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Information Card */}
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-36" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-3">
            {/* Payment Information Card */}
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-20" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__('Booking Not Found', 'Booking Not Found')}
          description={__('The booking you are looking for does not exist', 'The booking you are looking for does not exist')}
          actions={
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__('Back to Bookings', 'Back to Bookings')}
            </Button>
          }
        />
        <Card>
          <CardContent className="p-8 text-center text-red-500">
            {__('Error loading booking or booking not found', 'Error loading booking or booking not found')}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Booking Details', 'Booking Details')}
        description={__('View complete booking information', 'View complete booking information')}
        actions={
          <div className="flex gap-2">
            <ConditionalRender capability="yatra_edit_bookings">
              <Button
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                {__('Edit Booking', 'Edit Booking')}
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
            {/* Booking Overview */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{__('Booking Overview', 'Booking Overview')}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getBookingStatusBadge(booking.booking_status)}
                    {getPaymentStatusBadge(booking.payment_status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__('Booking Number', 'Booking Number')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {booking.booking_number}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__('Trip', 'Trip')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {booking.trip_title}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {__('Booking Date', 'Booking Date')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(booking.booking_date)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {__('Travel Date', 'Travel Date')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(booking.travel_date)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {__('Number of Travelers', 'Number of Travelers')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {booking.travelers} {booking.travelers === 1 ? __('Traveler', 'Traveler') : __('Travelers', 'Travelers')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {__('Total Amount', 'Total Amount')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatPrice(booking.total_amount)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{__('Customer Information', 'Customer Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {booking.customer_name}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      {booking.customer_email}
                    </div>
                    {booking.customer_phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4" />
                        {booking.customer_phone}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Travelers Information */}
            {booking.travelers_data && booking.travelers_data.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {__('Travelers Information', 'Travelers Information')}
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                      ({booking.travelers_data.length} {booking.travelers_data.length === 1 ? __('traveler', 'traveler') : __('travelers', 'travelers')})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {booking.travelers_data.map((traveler: any, index: number) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg ${index === 0 ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {index === 0 ? __('Lead Traveler', 'Lead Traveler') : `${__('Traveler', 'Traveler')} ${index + 1}`}
                        </h4>
                        {index === 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">
                            {__('Primary Contact', 'Primary Contact')}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {/* Name */}
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{__('Full Name', 'Full Name')}</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {[traveler.first_name, traveler.last_name].filter(Boolean).join(' ') || '-'}
                          </div>
                        </div>
                        
                        {/* Gender */}
                        {traveler.gender && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{__('Gender', 'Gender')}</div>
                            <div className="text-sm text-gray-900 dark:text-white capitalize">{traveler.gender}</div>
                          </div>
                        )}
                        
                        {/* Date of Birth */}
                        {traveler.date_of_birth && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{__('Date of Birth', 'Date of Birth')}</div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {new Date(traveler.date_of_birth).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                        
                        {/* Nationality */}
                        {traveler.nationality && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{__('Nationality', 'Nationality')}</div>
                            <div className="text-sm text-gray-900 dark:text-white">{traveler.nationality}</div>
                          </div>
                        )}
                        
                        {/* Passport Number */}
                        {traveler.passport && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{__('Passport No.', 'Passport No.')}</div>
                            <div className="text-sm text-gray-900 dark:text-white font-mono">{traveler.passport}</div>
                          </div>
                        )}
                        
                        {/* Passport Expiry */}
                        {traveler.passport_expiry && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{__('Passport Expiry', 'Passport Expiry')}</div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {new Date(traveler.passport_expiry).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                        
                        {/* Dietary Requirements */}
                        {traveler.dietary && (
                          <div className="col-span-2 md:col-span-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{__('Dietary Requirements', 'Dietary Requirements')}</div>
                            <div className="text-sm text-gray-900 dark:text-white">{traveler.dietary}</div>
                          </div>
                        )}
                        
                        {/* Medical Conditions */}
                        {traveler.medical && (
                          <div className="col-span-2 md:col-span-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{__('Medical Conditions', 'Medical Conditions')}</div>
                            <div className="text-sm text-gray-900 dark:text-white">{traveler.medical}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Emergency Contact */}
            {booking.emergency_contact && (booking.emergency_contact.name || booking.emergency_contact.phone) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {__('Emergency Contact', 'Emergency Contact')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {booking.emergency_contact.name && (
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{__('Contact Name', 'Contact Name')}</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.emergency_contact.name}</div>
                      </div>
                    )}
                    {booking.emergency_contact.phone && (
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{__('Phone Number', 'Phone Number')}</div>
                        <div className="text-sm text-gray-900 dark:text-white">{booking.emergency_contact.phone}</div>
                      </div>
                    )}
                    {booking.emergency_contact.relationship && (
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{__('Relationship', 'Relationship')}</div>
                        <div className="text-sm text-gray-900 dark:text-white capitalize">{booking.emergency_contact.relationship}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {booking.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {__('Special Requests', 'Special Requests')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {booking.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Payment Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{__('Payment Information', 'Payment Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Payment Status', 'Payment Status')}
                  </div>
                  <div className="mt-1">
                    {getPaymentStatusBadge(booking.payment_status)}
                  </div>
                </div>
                {booking.payment_method && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      {__('Payment Method', 'Payment Method')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {booking.payment_method}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Trip Price per Person', 'Trip Price per Person')}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatPrice(booking.trip_price)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Total Amount', 'Total Amount')}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatPrice(booking.total_amount)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{__('Timeline', 'Timeline')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Created', 'Created')}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatDate(booking.created_at)}
                  </div>
                </div>
                {booking.updated_at && booking.updated_at !== booking.created_at && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__('Last Updated', 'Last Updated')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(booking.updated_at)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ConditionalRender>
    </div>
  );
};

export default ViewBooking;

