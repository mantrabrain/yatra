import React, { useState } from 'react';
import {
  Package,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  CheckCircle,
  DollarSign as DollarSignIcon,
  Users,
  MapPin as MapPinIcon,
  Eye,
  Download,
  CreditCard,
  LifeBuoy,
} from 'lucide-react';
import { __ } from '../../lib/i18n';
import { formatDate, getBadge, currency } from './utils';
import type { Booking } from './types';
import BookingDetails from './BookingDetails';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';

interface BookingsProps {
  bookings: Booking[];
  onSectionChange: (section: string) => void;
}

const Bookings: React.FC<BookingsProps> = ({ bookings, onSectionChange }) => {
  const [bookingFilter, setBookingFilter] = useState<'all' | 'upcoming' | 'pending' | 'completed'>('all');
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [payLoading, setPayLoading] = useState<number | null>(null);
  const apiBase = window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1';
  const nonce = window.yatraAdmin?.nonce || '';

  const startRemainingPaymentSession = async (bookingId: number) => {
    try {
      setPayLoading(bookingId);
      const response = await fetch(`${apiBase}/payment/remaining/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || __('Unable to start payment session.', 'Unable to start payment session.'));
      }

      // Redirect to checkout URL (same URL for both new bookings and remaining payments)
      const checkoutUrl = payload?.data?.checkout_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      alert(__('Unable to find checkout session. Please contact support.', 'Unable to find checkout session. Please contact support.'));
    } catch (error: any) {
      console.error('Remaining payment session error:', error);
      alert(error?.message || __('Failed to start remaining balance payment.', 'Failed to start remaining balance payment.'));
    } finally {
      setPayLoading(null);
    }
  };

  // Fetch full booking details when a booking is selected
  const { data: bookingDetails, isLoading: isLoadingBookingDetails } = useQuery<any>({
    queryKey: ['account-booking-details', selectedBookingId],
    queryFn: async () => {
      if (!selectedBookingId) return null;
      try {
        const response = await apiClient.get(`/bookings/${selectedBookingId}`);
        if (response && response.success && response.data) {
          const data = response.data;
          return {
            id: data.id,
            booking_number: data.reference || data.booking_number,
            customer_name: data.customer_name || (data.contact?.first_name && data.contact?.last_name 
              ? `${data.contact.first_name} ${data.contact.last_name}`.trim()
              : `${data.contact_first_name || ''} ${data.contact_last_name || ''}`.trim()) || 'N/A',
            customer_email: data.customer_email || data.contact_email,
            customer_phone: data.customer_phone || data.contact_phone,
            customer_country: data.contact_country,
            trip_id: data.trip_id,
            trip_title: data.trip_title || `Trip #${data.trip_id}`,
            trip_image: data.trip_image,
            trip_price: data.total_amount / (data.travelers_count || 1),
            booking_date: data.created_at || data.booking_date,
            travel_date: data.travel_date,
            travelers: data.travelers_count || data.travelers || 0,
            travelers_data: data.travelers || data.travelers_data || [],
            total_amount: data.total_amount,
            amount_paid: data.amount_paid || 0,
            amount_due: data.amount_due || 0,
            currency: data.currency || (window as any).yatraAdmin?.currency || 'USD',
            payment_status: data.payment_status,
            booking_status: data.status,
            payment_method: data.payment_gateway,
            payment_date: data.payment_date,
            notes: data.special_requests,
            emergency_contact: data.emergency_contact,
            contact_data: data.contact_data,
            payments: data.payments || [],
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
        return null;
      } catch (error) {
        console.error('Error fetching booking details:', error);
        return null;
      }
    },
    enabled: !!selectedBookingId,
  });

  // If a booking is selected, show booking details
  if (selectedBookingId) {
    return (
      <BookingDetails
        booking={bookingDetails}
        isLoading={isLoadingBookingDetails}
        onBack={() => setSelectedBookingId(null)}
      />
    );
  }

  const displayBookings = bookings;
  
  // Filter bookings based on selected filter
  let filteredDisplayBookings = displayBookings;
  if (bookingFilter === 'upcoming') {
    filteredDisplayBookings = displayBookings.filter((b) => new Date(b.travel_date) >= new Date());
  } else if (bookingFilter === 'pending') {
    filteredDisplayBookings = displayBookings.filter((b) => b.payment_status === 'pending' || b.booking_status === 'pending');
  } else if (bookingFilter === 'completed') {
    filteredDisplayBookings = displayBookings.filter((b) => b.booking_status === 'completed');
  }

  // Calculate booking statistics
  const bookingStats = {
    total: displayBookings.length,
    upcoming: displayBookings.filter((b) => new Date(b.travel_date) >= new Date()).length,
    pending: displayBookings.filter((b) => b.payment_status === 'pending' || b.booking_status === 'pending').length,
    completed: displayBookings.filter((b) => b.booking_status === 'completed').length,
    totalSpent: displayBookings.reduce((sum, b) => sum + b.total_amount, 0),
  };

  return (
    <div className="yatra-bookings-page space-y-6">
      {/* Header */}
      <div className="yatra-bookings-header bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              {__('My Bookings', 'My Bookings')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {__('Manage your trips, download documents, and track your travel history.', 'Manage your trips, download documents, and track your travel history.')}
            </p>
          </div>
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            {(['all', 'upcoming', 'pending', 'completed'] as const).map((filter) => (
              <div
                key={filter}
                role="button"
                tabIndex={0}
                onClick={() => setBookingFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  bookingFilter === filter
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {__(filter.charAt(0).toUpperCase() + filter.slice(1), filter)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid - Clean Dashboard Style */}
      <div className="flex flex-nowrap gap-6 overflow-x-auto">
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Total Bookings', 'Total Bookings')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{bookingStats.total}</p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Upcoming', 'Upcoming')}</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{bookingStats.upcoming}</p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Pending', 'Pending')}</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{bookingStats.pending}</p>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Completed', 'Completed')}</p>
              <p className="text-xl font-bold text-gray-600 dark:text-gray-400">{bookingStats.completed}</p>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Total Spent', 'Total Spent')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{currency(bookingStats.totalSpent)}</p>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <DollarSignIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {filteredDisplayBookings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">{__('No bookings found', 'No bookings found')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">{__('Try adjusting your filters or check back later.', 'Try adjusting your filters or check back later.')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDisplayBookings.map((booking) => {
            const bookingId = Number(booking.id);
            const isUpcoming = new Date(booking.travel_date) > new Date();
            const isCompleted = booking.booking_status === 'completed';
            const paidNumeric = typeof booking.amount_paid === 'number'
              ? booking.amount_paid
              : booking.amount_paid != null
                ? parseFloat(String(booking.amount_paid))
                : null;
            const dueNumeric = typeof booking.amount_due === 'number'
              ? booking.amount_due
              : booking.amount_due != null
                ? parseFloat(String(booking.amount_due))
                : null;
            const totalPaid = paidNumeric;
            const derivedDue = dueNumeric != null
              ? dueNumeric
              : booking.total_amount - (paidNumeric ?? 0);
            const amountDue = Math.max(0, derivedDue);
            const canPayRemaining = Number.isFinite(bookingId) && amountDue > 0.01;

            return (
              <div
                key={booking.id}
                className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-6">
                  {/* Header Row */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          isUpcoming ? 'bg-emerald-50 dark:bg-emerald-900/20' : 
                          isCompleted ? 'bg-gray-50 dark:bg-gray-700' : 
                          'bg-amber-50 dark:bg-amber-900/20'
                        }`}>
                          <MapPinIcon className={`w-5 h-5 ${
                            isUpcoming ? 'text-emerald-600 dark:text-emerald-400' : 
                            isCompleted ? 'text-gray-400' : 
                            'text-amber-600 dark:text-amber-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium mb-1">
                            {booking.booking_number}
                          </p>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{booking.trip_title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <MapPinIcon className="w-4 h-4" />
                            {booking.destination || __('Multiple destinations', 'Multiple destinations')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-start">
                      <span className={getBadge(booking.booking_status)}>{__(booking.booking_status, booking.booking_status)}</span>
                      <span className={getBadge(booking.payment_status)}>{__(booking.payment_status, booking.payment_status)}</span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="yatra-booking-details grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {__('Travel Date', 'Travel Date')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(booking.travel_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {__('Travelers', 'Travelers')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{booking.travelers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <DollarSignIcon className="w-3.5 h-3.5" />
                        {__('Total Amount', 'Total Amount')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{currency(booking.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        {__('Paid / Due', 'Paid / Due')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {currency(totalPaid ?? 0)}
                        {amountDue !== null && (
                          <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">
                            {__('Due:', 'Due:')} {currency(amountDue)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {__('Booked On', 'Booked On')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(booking.booking_date || booking.created_at)}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="yatra-booking-actions flex flex-wrap gap-3">
                    <div role="button" tabIndex={0} onClick={() => setSelectedBookingId(bookingId)} className="yatra-booking-action yatra-booking-action-view inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer">
                      <Eye className="w-4 h-4" />
                      {__('View Details', 'View Details')}
                    </div>
                    <div role="button" tabIndex={0} onClick={() => {}} className="yatra-booking-action yatra-booking-action-download inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer">
                      <Download className="w-4 h-4" />
                      {__('Download Voucher', 'Download Voucher')}
                    </div>
                    <div role="button" tabIndex={0} onClick={() => onSectionChange('payments')} className="yatra-booking-action yatra-booking-action-payment inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer">
                      <CreditCard className="w-4 h-4" />
                      {__('Payment', 'Payment')}
                    </div>
                    {canPayRemaining && (
                      <button
                        type="button"
                        onClick={() => bookingId && startRemainingPaymentSession(bookingId)}
                        disabled={payLoading === bookingId}
                        className="yatra-booking-action inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {payLoading === bookingId ? (
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                            <path d="M4 12a8 8 0 0 1 8-8" />
                          </svg>
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                        {__('Pay Remaining Balance', 'Pay Remaining Balance')}
                      </button>
                    )}
                    <div role="button" tabIndex={0} onClick={() => onSectionChange('support')} className="yatra-booking-action yatra-booking-action-support inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer">
                      <LifeBuoy className="w-4 h-4" />
                      {__('Support', 'Support')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bookings;

