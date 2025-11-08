/**
 * View Payment Page
 * Display payment details in a clean, minimal SaaS-style design
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Mail, Phone, Calendar, CreditCard, Edit, ExternalLink } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';

const ViewPayment: React.FC = () => {
  const { can } = usePermissions();

  // Get payment id from URL
  const paymentId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  // Fetch payment data
  const { data: payment, isLoading, error } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => {
      if (!paymentId) return null;
      // return await apiClient.get(`/yatra/v1/payments/${paymentId}`);
      // Dummy data
      const today = new Date();
      const getDate = (days: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
      };

      return {
        id: paymentId,
        payment_number: 'PAY-2024-001',
        booking_id: 1,
        booking_number: 'YT-2024-001',
        customer_name: 'John Smith',
        customer_email: 'john.smith@example.com',
        customer_phone: '+1 234-567-8900',
        trip_id: 1,
        trip_title: 'Everest Base Camp Trek',
        amount: 2500,
        payment_method: 'Credit Card',
        payment_status: 'completed',
        transaction_id: 'TXN-123456789',
        payment_date: getDate(5),
        notes: 'Full payment received via credit card. Transaction processed successfully.',
        created_at: getDate(5),
        updated_at: getDate(2),
      };
    },
    enabled: !!paymentId && can('yatra_view_bookings'),
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

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'completed': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Completed', 'Completed'),
      },
      'pending': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: __('Pending', 'Pending'),
      },
      'partial': {
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        label: __('Partial', 'Partial'),
      },
      'failed': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Failed', 'Failed'),
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
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=payments`;
  };

  const handleEdit = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=payments&action=edit&id=${paymentId}`;
  };

  const handleViewBooking = () => {
    if (payment?.booking_id) {
      window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings&action=view&id=${payment.booking_id}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__('Payment Not Found', 'Payment Not Found')}
          actions={
            <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {__('Back to Payments', 'Back to Payments')}
            </Button>
          }
        />
        <Card>
          <CardContent className="p-8 text-center text-red-500">
            {__('Payment not found or you do not have permission to view it.', 'Payment not found or you do not have permission to view it.')}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Payment Details', 'Payment Details')}
        description={__('View complete payment information', 'View complete payment information')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {__('Back', 'Back')}
            </Button>
            <ConditionalRender capability="yatra_edit_bookings">
              <Button onClick={handleEdit} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                {__('Edit Payment', 'Edit Payment')}
              </Button>
            </ConditionalRender>
          </div>
        }
      />

      <ConditionalRender capability="yatra_view_bookings">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-3">
            {/* Payment Information */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{__('Payment Information', 'Payment Information')}</CardTitle>
                  {getPaymentStatusBadge(payment.payment_status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {__('Payment Number', 'Payment Number')}
                    </label>
                    <p className="mt-1 text-sm font-mono font-semibold text-gray-900 dark:text-white">
                      {payment.payment_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {__('Payment Amount', 'Payment Amount')}
                    </label>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {formatPrice(payment.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {__('Payment Method', 'Payment Method')}
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {payment.payment_method}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {__('Payment Date', 'Payment Date')}
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(payment.payment_date)}
                      </p>
                    </div>
                  </div>
                  {payment.transaction_id && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {__('Transaction ID', 'Transaction ID')}
                      </label>
                      <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                        {payment.transaction_id}
                      </p>
                    </div>
                  )}
                </div>

                {payment.notes && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                      {__('Notes', 'Notes')}
                    </label>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {payment.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Information */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{__('Related Booking', 'Related Booking')}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleViewBooking}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    {__('View Booking', 'View Booking')}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {__('Booking Number', 'Booking Number')}
                    </label>
                    <p className="mt-1 text-sm font-mono font-semibold text-gray-900 dark:text-white">
                      {payment.booking_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {__('Trip', 'Trip')}
                    </label>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {payment.trip_title}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Customer Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{__('Customer', 'Customer')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {payment.customer_name}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{payment.customer_email}</span>
                </div>
                {payment.customer_phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>{payment.customer_phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{__('Timeline', 'Timeline')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {__('Created', 'Created')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDate(payment.created_at)}
                  </p>
                </div>
                {payment.updated_at && payment.updated_at !== payment.created_at && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {__('Last Updated', 'Last Updated')}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formatDate(payment.updated_at)}
                    </p>
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

export default ViewPayment;

