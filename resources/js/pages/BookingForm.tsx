/**
 * Booking Form Page
 * Add/Edit Booking form with clean, minimal SaaS-style design
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';

interface BookingFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  trip_id: string;
  booking_date: string;
  travel_date: string;
  travelers: string;
  total_amount: string;
  payment_status: string;
  booking_status: string;
  payment_method: string;
  notes: string;
}

const BookingForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [formData, setFormData] = useState<BookingFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    trip_id: '',
    booking_date: new Date().toISOString().split('T')[0],
    travel_date: '',
    travelers: '1',
    total_amount: '',
    payment_status: 'pending',
    booking_status: 'pending',
    payment_method: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const bookingId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  const isEditMode = action === 'edit' && bookingId !== null;

  // Fetch trips for dropdown
  const { data: tripsData } = useQuery({
    queryKey: ['trips-list'],
    queryFn: async () => {
      // return await apiClient.get('/yatra/v1/trips', { params: { per_page: 100 } });
      // Dummy trips data
      return {
        data: [
          { id: 1, title: 'Everest Base Camp Trek', price: 1250 },
          { id: 2, title: 'Annapurna Circuit Adventure', price: 980 },
          { id: 3, title: 'Golden Triangle Tour', price: 750 },
          { id: 4, title: 'Bhutan Cultural Journey', price: 1100 },
          { id: 5, title: 'Tibet Spiritual Tour', price: 850 },
          { id: 6, title: 'Langtang Valley Trek', price: 920 },
          { id: 7, title: 'Manaslu Circuit Trek', price: 1350 },
          { id: 8, title: 'Upper Mustang Trek', price: 1450 },
        ],
      };
    },
    enabled: can('yatra_view_trips'),
  });

  // Fetch booking data if editing
  const { data: bookingData, isLoading: isLoadingBooking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      // return await apiClient.get(`/bookings/${bookingId}`);
      // Dummy data for now
      return {
        id: bookingId,
        customer_name: 'John Smith',
        customer_email: 'john.smith@example.com',
        customer_phone: '+1234567890',
        trip_id: 1,
        booking_date: new Date().toISOString().split('T')[0],
        travel_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        travelers: 2,
        total_amount: 2500,
        payment_status: 'paid',
        booking_status: 'confirmed',
        payment_method: 'Credit Card',
        notes: 'Customer requested early check-in',
      };
    },
    enabled: isEditMode && can('yatra_view_bookings'),
  });

  // Load booking data into form when editing
  useEffect(() => {
    if (bookingData && isEditMode) {
      setFormData({
        customer_name: bookingData.customer_name || '',
        customer_email: bookingData.customer_email || '',
        customer_phone: bookingData.customer_phone || '',
        trip_id: bookingData.trip_id?.toString() || '',
        booking_date: bookingData.booking_date || new Date().toISOString().split('T')[0],
        travel_date: bookingData.travel_date || '',
        travelers: bookingData.travelers?.toString() || '1',
        total_amount: bookingData.total_amount?.toString() || '',
        payment_status: bookingData.payment_status || 'pending',
        booking_status: bookingData.booking_status || 'pending',
        payment_method: bookingData.payment_method || '',
        notes: bookingData.notes || '',
      });
    }
  }, [bookingData, isEditMode]);

  // Calculate total amount when trip or travelers change
  useEffect(() => {
    if (formData.trip_id && formData.travelers) {
      const selectedTrip = tripsData?.data?.find((trip: any) => trip.id === parseInt(formData.trip_id));
      if (selectedTrip) {
        const total = selectedTrip.price * parseInt(formData.travelers);
        setFormData(prev => ({ ...prev, total_amount: total.toString() }));
      }
    }
  }, [formData.trip_id, formData.travelers, tripsData]);

  const handleFieldChange = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = __('Customer name is required', 'Customer name is required');
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = __('Customer email is required', 'Customer email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = __('Invalid email address', 'Invalid email address');
    }

    if (!formData.trip_id) {
      newErrors.trip_id = __('Trip is required', 'Trip is required');
    }

    if (!formData.booking_date) {
      newErrors.booking_date = __('Booking date is required', 'Booking date is required');
    }

    if (!formData.travel_date) {
      newErrors.travel_date = __('Travel date is required', 'Travel date is required');
    }

    if (!formData.travelers || parseInt(formData.travelers) < 1) {
      newErrors.travelers = __('Number of travelers must be at least 1', 'Number of travelers must be at least 1');
    }

    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      newErrors.total_amount = __('Total amount must be greater than 0', 'Total amount must be greater than 0');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const payload = {
        customer_name: data.customer_name.trim(),
        customer_email: data.customer_email.trim(),
        customer_phone: data.customer_phone.trim(),
        trip_id: parseInt(data.trip_id),
        booking_date: data.booking_date,
        travel_date: data.travel_date,
        travelers: parseInt(data.travelers),
        total_amount: parseFloat(data.total_amount),
        payment_status: data.payment_status,
        booking_status: data.booking_status,
        payment_method: data.payment_method.trim(),
        notes: data.notes.trim(),
      };

      if (isEditMode && bookingId) {
        // return await apiClient.put(`/bookings/${bookingId}`, payload);
        console.log('Updating booking:', bookingId, payload);
        return { success: true, id: bookingId };
      } else {
        // return await apiClient.post('/bookings', payload);
        console.log('Creating booking:', payload);
        return { success: true, id: Math.floor(Math.random() * 1000) };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      // Redirect to bookings list
      window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings`;
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving the booking', 'An error occurred while saving the booking');
      setErrors({ submit: errorMessage });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings`;
  };

  if (isEditMode && isLoadingBooking) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{__('Loading booking...', 'Loading booking...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Booking', 'Edit Booking') : __('Create Booking', 'Create Booking')}
        description={isEditMode ? __('Update booking information', 'Update booking information') : __('Create a new customer booking', 'Create a new customer booking')}
        actions={
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {__('Back', 'Back')}
          </Button>
        }
      />

      <ConditionalRender capability="yatra_edit_bookings">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Main Form Fields */}
            <div className="lg:col-span-2 space-y-3">
              {/* Customer Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Customer Information', 'Customer Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Customer Name */}
                    <div>
                      <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Customer Name', 'Customer Name')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="customer_name"
                        type="text"
                        value={formData.customer_name}
                        onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                        placeholder={__('Enter customer name', 'Enter customer name')}
                        className={errors.customer_name ? 'border-red-500' : ''}
                        required
                      />
                      {errors.customer_name && (
                        <p className="mt-1 text-sm text-red-500">{errors.customer_name}</p>
                      )}
                    </div>

                    {/* Customer Email */}
                    <div>
                      <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Customer Email', 'Customer Email')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="customer_email"
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => handleFieldChange('customer_email', e.target.value)}
                        placeholder={__('customer@example.com', 'customer@example.com')}
                        className={errors.customer_email ? 'border-red-500' : ''}
                        required
                      />
                      {errors.customer_email && (
                        <p className="mt-1 text-sm text-red-500">{errors.customer_email}</p>
                      )}
                    </div>
                  </div>

                  {/* Customer Phone */}
                  <div>
                    <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Customer Phone', 'Customer Phone')}
                    </label>
                    <Input
                      id="customer_phone"
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => handleFieldChange('customer_phone', e.target.value)}
                      placeholder={__('+1234567890', '+1234567890')}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Booking Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Booking Details', 'Booking Details')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Trip Selection */}
                  <div>
                    <label htmlFor="trip_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Trip', 'Trip')} <span className="text-red-500">*</span>
                    </label>
                    <Select
                      id="trip_id"
                      value={formData.trip_id}
                      onChange={(e) => handleFieldChange('trip_id', e.target.value)}
                      className={`h-9 ${errors.trip_id ? 'border-red-500' : ''}`}
                      required
                    >
                      <option value="">{__('Select a trip', 'Select a trip')}</option>
                      {tripsData?.data?.map((trip: any) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.title} - ${trip.price}
                        </option>
                      ))}
                    </Select>
                    {errors.trip_id && (
                      <p className="mt-1 text-sm text-red-500">{errors.trip_id}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Booking Date */}
                    <div>
                      <label htmlFor="booking_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Booking Date', 'Booking Date')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="booking_date"
                        type="date"
                        value={formData.booking_date}
                        onChange={(e) => handleFieldChange('booking_date', e.target.value)}
                        className={errors.booking_date ? 'border-red-500' : ''}
                        required
                      />
                      {errors.booking_date && (
                        <p className="mt-1 text-sm text-red-500">{errors.booking_date}</p>
                      )}
                    </div>

                    {/* Travel Date */}
                    <div>
                      <label htmlFor="travel_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Travel Date', 'Travel Date')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="travel_date"
                        type="date"
                        value={formData.travel_date}
                        onChange={(e) => handleFieldChange('travel_date', e.target.value)}
                        className={errors.travel_date ? 'border-red-500' : ''}
                        required
                      />
                      {errors.travel_date && (
                        <p className="mt-1 text-sm text-red-500">{errors.travel_date}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Number of Travelers */}
                    <div>
                      <label htmlFor="travelers" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Number of Travelers', 'Number of Travelers')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="travelers"
                        type="number"
                        min="1"
                        value={formData.travelers}
                        onChange={(e) => handleFieldChange('travelers', e.target.value)}
                        className={errors.travelers ? 'border-red-500' : ''}
                        required
                      />
                      {errors.travelers && (
                        <p className="mt-1 text-sm text-red-500">{errors.travelers}</p>
                      )}
                    </div>

                    {/* Total Amount */}
                    <div>
                      <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Total Amount', 'Total Amount')} (USD) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          id="total_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.total_amount}
                          onChange={(e) => handleFieldChange('total_amount', e.target.value)}
                          placeholder="0.00"
                          className={`pl-7 ${errors.total_amount ? 'border-red-500' : ''}`}
                          required
                        />
                      </div>
                      {errors.total_amount && (
                        <p className="mt-1 text-sm text-red-500">{errors.total_amount}</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Notes', 'Notes')}
                    </label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      placeholder={__('Additional notes or special requests', 'Additional notes or special requests')}
                      rows={3}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Status & Payment */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Status & Payment', 'Status & Payment')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Booking Status */}
                  <div>
                    <label htmlFor="booking_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Booking Status', 'Booking Status')}
                    </label>
                    <Select
                      id="booking_status"
                      value={formData.booking_status}
                      onChange={(e) => handleFieldChange('booking_status', e.target.value)}
                      className="h-9"
                    >
                      <option value="pending">{__('Pending', 'Pending')}</option>
                      <option value="confirmed">{__('Confirmed', 'Confirmed')}</option>
                      <option value="cancelled">{__('Cancelled', 'Cancelled')}</option>
                      <option value="completed">{__('Completed', 'Completed')}</option>
                    </Select>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label htmlFor="payment_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Payment Status', 'Payment Status')}
                    </label>
                    <Select
                      id="payment_status"
                      value={formData.payment_status}
                      onChange={(e) => handleFieldChange('payment_status', e.target.value)}
                      className="h-9"
                    >
                      <option value="pending">{__('Pending', 'Pending')}</option>
                      <option value="partial">{__('Partial', 'Partial')}</option>
                      <option value="paid">{__('Paid', 'Paid')}</option>
                      <option value="refunded">{__('Refunded', 'Refunded')}</option>
                    </Select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Payment Method', 'Payment Method')}
                    </label>
                    <Select
                      id="payment_method"
                      value={formData.payment_method}
                      onChange={(e) => handleFieldChange('payment_method', e.target.value)}
                      className="h-9"
                    >
                      <option value="">{__('Select payment method', 'Select payment method')}</option>
                      <option value="Credit Card">{__('Credit Card', 'Credit Card')}</option>
                      <option value="Bank Transfer">{__('Bank Transfer', 'Bank Transfer')}</option>
                      <option value="PayPal">{__('PayPal', 'PayPal')}</option>
                      <option value="Stripe">{__('Stripe', 'Stripe')}</option>
                      <option value="Cash">{__('Cash', 'Cash')}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Actions */}
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {errors.submit && (
                      <div className="p-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                        {errors.submit}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {__('Saving...', 'Saving...')}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {isEditMode ? __('Update Booking', 'Update Booking') : __('Create Booking', 'Create Booking')}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                      >
                        {__('Cancel', 'Cancel')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </ConditionalRender>
    </div>
  );
};

export default BookingForm;

