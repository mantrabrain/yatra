/**
 * Payment Form Page
 * Add/Edit Payment form
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import { __ } from '../lib/i18n';
import { apiService } from '../lib/api-client';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { HelpText } from '../components/ui/help-text';
import { Alert } from '../components/ui/alert';

interface PaymentFormData {
  booking_id: string;
  amount: string;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partial';
  payment_date: string;
  transaction_id: string;
  notes: string;
}

const PaymentForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [formData, setFormData] = useState<PaymentFormData>({
    booking_id: '',
    amount: '',
    payment_method: 'Credit Card',
    payment_status: 'pending',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_id: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const paymentId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  const isEditMode = action === 'edit' && paymentId !== null;

  // Fetch payment data if editing
  const { data: paymentData, isLoading: isLoadingPayment } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => {
      if (!paymentId) return null;
      
      const result = await apiService.getPayment(paymentId);

      if (!result) {
        throw new Error('Failed to fetch payment');
      }
      
      if (!result.success) {
        throw new Error(result.message || 'Payment not found');
      }

      const data = result.data;
      return {
        id: data.id,
        booking_id: data.booking_id,
        amount: data.amount,
        payment_method: data.gateway,
        payment_status: data.status,
        payment_date: data.processed_at ? data.processed_at.split(' ')[0] : new Date().toISOString().split('T')[0],
        transaction_id: data.transaction_id || '',
        notes: data.notes || '',
      };
    },
    enabled: isEditMode && can('yatra_view_bookings'),
  });

  // Load payment data into form when editing
  useEffect(() => {
    if (paymentData && isEditMode) {
      setFormData({
        booking_id: paymentData.booking_id?.toString() || '',
        amount: paymentData.amount?.toString() || '',
        payment_method: paymentData.payment_method || 'Credit Card',
        payment_status: (paymentData.payment_status || 'pending') as PaymentFormData['payment_status'],
        payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
        transaction_id: paymentData.transaction_id || '',
        notes: paymentData.notes || '',
      });
    }
  }, [paymentData, isEditMode]);

  const handleFieldChange = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.booking_id.trim()) {
      newErrors.booking_id = __('Booking is required', 'Booking is required');
    } else {
      const bookingId = parseInt(formData.booking_id);
      if (isNaN(bookingId) || bookingId <= 0) {
        newErrors.booking_id = __('Valid booking ID is required', 'Valid booking ID is required');
      }
    }

    if (!formData.amount.trim()) {
      newErrors.amount = __('Payment amount is required', 'Payment amount is required');
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = __('Payment amount must be a positive number', 'Payment amount must be a positive number');
      }
    }

    if (!formData.payment_method.trim()) {
      newErrors.payment_method = __('Payment method is required', 'Payment method is required');
    }

    if (!formData.payment_date.trim()) {
      newErrors.payment_date = __('Payment date is required', 'Payment date is required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const payload = {
        booking_id: parseInt(data.booking_id),
        amount: parseFloat(data.amount),
        gateway: data.payment_method,
        status: data.payment_status,
        processed_at: data.payment_date,
        transaction_id: data.transaction_id.trim() || null,
        notes: data.notes.trim() || null,
      };

      return isEditMode && paymentId
        ? await apiService.updatePayment(paymentId, payload)
        : await apiService.createPayment(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      // Redirect to payments list
      window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=payments`;
    },
    onError: (error: any) => {
      console.error('Error saving payment:', error);
      setErrors({ submit: error.message || __('Failed to save payment', 'Failed to save payment') });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await saveMutation.mutateAsync(formData);
    } catch (error) {
      // Error handled in mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=payments`;
  };

  if (isLoadingPayment) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Payment', 'Edit Payment') : __('Add New Payment', 'Add New Payment')}
        description={isEditMode ? __('Update payment details', 'Update payment details') : __('Record a new payment for a booking', 'Record a new payment for a booking')}
        actions={
          <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
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
              {/* Payment Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Payment Information', 'Payment Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Booking ID */}
                  <div>
                    <label htmlFor="booking_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Booking', 'Booking')} <span className="text-red-500">*</span>
                    </label>
                    <HelpText 
                      text={__('Select the booking this payment is for. You can search by booking number or customer name.', 'Select the booking this payment is for. You can search by booking number or customer name.')}
                      className="mb-2"
                    />
                    <Input
                      id="booking_id"
                      type="text"
                      value={formData.booking_id}
                      onChange={(e) => handleFieldChange('booking_id', e.target.value)}
                      placeholder={__('Enter booking ID or search...', 'Enter booking ID or search...')}
                      className={errors.booking_id ? 'border-red-500' : ''}
                      required
                    />
                    {errors.booking_id && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.booking_id}
                      </p>
                    )}
                  </div>

                  {/* Amount and Payment Method */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Amount */}
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Payment Amount', 'Payment Amount')} <span className="text-red-500">*</span>
                      </label>
                      <HelpText 
                        text={__('Enter the payment amount received.', 'Enter the payment amount received.')}
                        className="mb-2"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <Input
                          id="amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => handleFieldChange('amount', e.target.value)}
                          placeholder={__('e.g., 2500.00', 'e.g., 2500.00')}
                          className={`pl-7 ${errors.amount ? 'border-red-500' : ''}`}
                          required
                        />
                      </div>
                      {errors.amount && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.amount}
                        </p>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Payment Method', 'Payment Method')} <span className="text-red-500">*</span>
                      </label>
                      <HelpText 
                        text={__('Select the payment method used for this transaction.', 'Select the payment method used for this transaction.')}
                        className="mb-2"
                      />
                      <Select
                        id="payment_method"
                        value={formData.payment_method}
                        onChange={(e) => handleFieldChange('payment_method', e.target.value)}
                        className={errors.payment_method ? 'border-red-500' : ''}
                        required
                      >
                        <option value="Credit Card">{__('Credit Card', 'Credit Card')}</option>
                        <option value="Debit Card">{__('Debit Card', 'Debit Card')}</option>
                        <option value="PayPal">{__('PayPal', 'PayPal')}</option>
                        <option value="Bank Transfer">{__('Bank Transfer', 'Bank Transfer')}</option>
                        <option value="Cash">{__('Cash', 'Cash')}</option>
                        <option value="Check">{__('Check', 'Check')}</option>
                        <option value="Other">{__('Other', 'Other')}</option>
                      </Select>
                      {errors.payment_method && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.payment_method}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment Date and Transaction ID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Payment Date */}
                    <div>
                      <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Payment Date', 'Payment Date')} <span className="text-red-500">*</span>
                      </label>
                      <HelpText 
                        text={__('Date when the payment was received.', 'Date when the payment was received.')}
                        className="mb-2"
                      />
                      <Input
                        id="payment_date"
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) => handleFieldChange('payment_date', e.target.value)}
                        className={errors.payment_date ? 'border-red-500' : ''}
                        required
                      />
                      {errors.payment_date && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.payment_date}
                        </p>
                      )}
                    </div>

                    {/* Transaction ID */}
                    <div>
                      <label htmlFor="transaction_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Transaction ID', 'Transaction ID')}
                      </label>
                      <HelpText 
                        text={__('Optional transaction ID or reference number from the payment gateway.', 'Optional transaction ID or reference number from the payment gateway.')}
                        className="mb-2"
                      />
                      <Input
                        id="transaction_id"
                        type="text"
                        value={formData.transaction_id}
                        onChange={(e) => handleFieldChange('transaction_id', e.target.value)}
                        placeholder={__('e.g., TXN-123456789', 'e.g., TXN-123456789')}
                        className={errors.transaction_id ? 'border-red-500' : ''}
                      />
                      {errors.transaction_id && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.transaction_id}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Notes', 'Notes')}
                    </label>
                    <HelpText 
                      text={__('Optional notes about this payment for internal reference.', 'Optional notes about this payment for internal reference.')}
                      className="mb-2"
                    />
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      placeholder={__('e.g., Full payment received, Partial payment - balance pending', 'e.g., Full payment received, Partial payment - balance pending')}
                      rows={3}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Payment Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Payment Status', 'Payment Status')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={formData.payment_status}
                    onChange={(e) => handleFieldChange('payment_status', e.target.value as PaymentFormData['payment_status'])}
                  >
                    <option value="pending">{__('Pending', 'Pending')}</option>
                    <option value="completed">{__('Completed', 'Completed')}</option>
                    <option value="partial">{__('Partial', 'Partial')}</option>
                    <option value="failed">{__('Failed', 'Failed')}</option>
                    <option value="refunded">{__('Refunded', 'Refunded')}</option>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.payment_status === 'completed' && __('Payment has been successfully processed.', 'Payment has been successfully processed.')}
                    {formData.payment_status === 'pending' && __('Payment is awaiting processing or confirmation.', 'Payment is awaiting processing or confirmation.')}
                    {formData.payment_status === 'partial' && __('This is a partial payment. Balance may be pending.', 'This is a partial payment. Balance may be pending.')}
                    {formData.payment_status === 'failed' && __('Payment processing failed or was declined.', 'Payment processing failed or was declined.')}
                    {formData.payment_status === 'refunded' && __('Payment has been refunded to the customer.', 'Payment has been refunded to the customer.')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          {errors.submit && (
            <Alert variant="error" className="mt-3">
              {errors.submit}
            </Alert>
          )}

          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              {__('Cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {__('Saving...', 'Saving...')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? __('Update Payment', 'Update Payment') : __('Create Payment', 'Create Payment')}
                </>
              )}
            </Button>
          </div>
        </form>
      </ConditionalRender>
    </div>
  );
};

export default PaymentForm;

