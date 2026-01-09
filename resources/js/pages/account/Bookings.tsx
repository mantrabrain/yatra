import React, { useState } from 'react';
import { Package, CheckCircle, Calendar, Clock, DollarSign, MapPin } from 'lucide-react';
import { __ } from '../../lib/i18n';
import { formatDate, getBadge, currency } from './utils';
import { downloadVoucher } from './utils/downloads';
import type { Booking } from './types';
import BookingDetails from './BookingDetails';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';

interface BookingsProps {
  bookings: Booking[];
  onSectionChange: (section: string) => void;
}

const Bookings: React.FC<BookingsProps> = ({ bookings, onSectionChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'upcoming' | 'pending' | 'completed'>('all');
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isLoadingBookingDetails, setIsLoadingBookingDetails] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [payLoading, setPayLoading] = useState<number | null>(null);

  // Fetch booking details when a booking is selected
  const { data: bookingDetailsData } = useQuery({
    queryKey: ['booking-details', selectedBookingId],
    queryFn: async () => {
      if (!selectedBookingId) return null;
      const response = await apiClient.get(`/bookings/${selectedBookingId}`);
      return response.data;
    },
    enabled: !!selectedBookingId,
  });

  // Update booking details when data is loaded
  React.useEffect(() => {
    if (bookingDetailsData) {
      setBookingDetails(bookingDetailsData);
      setIsLoadingBookingDetails(false);
    }
  }, [bookingDetailsData]);

  // Handle booking selection
  const handleBookingSelect = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setIsLoadingBookingDetails(true);
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedBookingId(null);
    setBookingDetails(null);
  };

  // Handle download click
  const handleDownloadClick = (bookingId: number) => {
    downloadVoucher(bookingId);
  };

  // Handle remaining payment
  const startRemainingPaymentSession = async (bookingId: number) => {
    setPayLoading(bookingId);
    try {
      const response = await apiClient.post(`/bookings/${bookingId}/pay-remaining`);
      const { payment_url } = response.data;
      
      if (payment_url) {
        window.location.href = payment_url;
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
    } finally {
      setPayLoading(null);
    }
  };

  // If booking details are being viewed
  if (selectedBookingId && bookingDetails) {
    return (
      <BookingDetails
        booking={bookingDetails}
        isLoading={isLoadingBookingDetails}
        onBack={handleBackToList}
      />
    );
  }

  const displayBookings = bookings;
  
  // Filter bookings based on selected filter and search term
  let filteredDisplayBookings = displayBookings;
  
  // Apply filter
  if (bookingFilter === 'upcoming') {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    filteredDisplayBookings = filteredDisplayBookings.filter((b) => {
      const travelDate = new Date(b.travel_date);
      return travelDate >= today;
    });
  } else if (bookingFilter === 'pending') {
    filteredDisplayBookings = filteredDisplayBookings.filter((b) => b.payment_status === 'pending' || b.booking_status === 'pending');
  } else if (bookingFilter === 'completed') {
    filteredDisplayBookings = filteredDisplayBookings.filter((b) => b.booking_status === 'completed');
  }
  
  // Apply search
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase().trim();
    filteredDisplayBookings = filteredDisplayBookings.filter((b: any) => 
      (b.trip_title && b.trip_title.toLowerCase().includes(searchLower)) ||
      (b.booking_number && b.booking_number.toLowerCase().includes(searchLower)) ||
      (b.destination && b.destination.toLowerCase().includes(searchLower)) ||
      (b.payment_status && b.payment_status.toLowerCase().includes(searchLower)) ||
      (b.booking_status && b.booking_status.toLowerCase().includes(searchLower))
    );
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {__('Bookings', 'yatra')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {__('Manage and view all your travel bookings', 'yatra')}
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            {/* Search Input */}
            <div className="relative">
              <input
                placeholder={__('Search bookings...', 'yatra')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-64 pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value as 'all' | 'upcoming' | 'pending' | 'completed')}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                <option value="all">{__('All Bookings', 'yatra')}</option>
                <option value="upcoming">{__('Upcoming', 'yatra')}</option>
                <option value="pending">{__('Pending', 'yatra')}</option>
                <option value="completed">{__('Completed', 'yatra')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Clean Dashboard Style */}
      <div className="flex flex-nowrap gap-6 overflow-x-auto">
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Total Bookings', 'yatra')}</p>
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Upcoming', 'yatra')}</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{bookingStats.upcoming}</p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Pending', 'yatra')}</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{bookingStats.pending}</p>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Completed', 'yatra')}</p>
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Total Spent', 'yatra')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{currency(bookingStats.totalSpent)}</p>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {filteredDisplayBookings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">{__('No bookings found', 'yatra')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">{__('Try adjusting your filters or check back later.', 'yatra')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDisplayBookings.map((booking) => {
            const bookingId = Number(booking.id);
            const isUpcoming = new Date(booking.travel_date) > new Date();
            const isCompleted = booking.booking_status === 'completed';
            const paidNumeric = typeof booking.amount_paid === 'number'
              ? booking.amount_paid
              : parseFloat(booking.amount_paid || '0');
            const totalNumeric = typeof booking.total_amount === 'number'
              ? booking.total_amount
              : parseFloat(booking.total_amount || '0');
            const totalPaid = paidNumeric;
            const amountDue = totalNumeric - totalPaid;
            const canPayRemaining = amountDue > 0 && booking.payment_status !== 'paid';

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
                          <MapPin className={`w-5 h-5 ${
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
                            <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            {booking.destination || __('Multiple destinations', 'yatra')}
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {__('Travel Date', 'yatra')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(booking.travel_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {__('Travelers', 'yatra')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{booking.travelers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {__('Total Amount', 'yatra')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{currency(booking.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {__('Paid / Due', 'yatra')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {currency(totalPaid ?? 0)}
                        {amountDue !== null && (
                          <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">
                            {__('Due:', 'yatra')} {currency(amountDue)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {__('Booked On', 'yatra')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(booking.booking_date || booking.created_at)}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="yatra-booking-actions flex flex-wrap gap-3">
                    <div 
                      role="button" 
                      tabIndex={0} 
                      onClick={() => handleBookingSelect(bookingId)} 
                      className="yatra-booking-action yatra-booking-action-view inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
                    >
                      {__('View Details', 'yatra')}
                    </div>
                    <div 
                      role="button" 
                      tabIndex={0} 
                      onClick={() => handleDownloadClick(bookingId)} 
                      className="yatra-booking-action yatra-booking-action-download inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer"
                    >
                      {__('Download Voucher', 'yatra')}
                    </div>
                    <div 
                      role="button" 
                      tabIndex={0} 
                      onClick={() => onSectionChange('payments')} 
                      className="yatra-booking-action yatra-booking-action-payment inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer"
                    >
                      {__('Payment', 'yatra')}
                    </div>
                    {canPayRemaining && (
                      <button
                        type="button"
                        onClick={() => bookingId && startRemainingPaymentSession(bookingId)}
                        disabled={payLoading === bookingId}
                        className="yatra-booking-action inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {payLoading === bookingId ? (
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                            <path d="M4 12a8 8 0 0 1 8-8" />
                          </svg>
                        ) : null}
                        {__('Pay Remaining Balance', 'yatra')}
                      </button>
                    )}
                    <div 
                      role="button" 
                      tabIndex={0} 
                      onClick={() => onSectionChange('support')} 
                      className="yatra-booking-action yatra-booking-action-support inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer"
                    >
                      {__('Support', 'yatra')}
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
