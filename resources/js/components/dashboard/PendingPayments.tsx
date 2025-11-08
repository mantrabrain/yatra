/**
 * Pending Payments Widget
 * Displays bookings with pending payments
 */

import React from 'react';
import { __ } from '../../lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DollarSign, Clock, User } from 'lucide-react';
import { ConditionalRender } from '../ui/conditional-render';

interface PendingPayment {
  id: number;
  booking_id: number;
  customer_name: string;
  trip_title: string;
  amount: number;
  due_date: string;
  days_overdue?: number;
  payment_method?: string;
}

interface PendingPaymentsProps {
  payments: PendingPayment[];
  loading?: boolean;
  onView?: (payment: PendingPayment) => void;
  onCollect?: (payment: PendingPayment) => void;
}

/**
 * Pending Payments Widget
 */
export const PendingPayments: React.FC<PendingPaymentsProps> = ({
  payments,
  loading = false,
  onView,
  onCollect,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const totalPending = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{__('Pending Payments', 'Pending Payments')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {__('Loading...', 'Loading...')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{__('Pending Payments', 'Pending Payments')}</CardTitle>
          {totalPending > 0 && (
            <Badge variant="warning" className="text-sm">
              {formatCurrency(totalPending)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {payments && payments.length > 0 ? (
          <div className="space-y-2">
            {payments.slice(0, 2).map((payment) => (
              <div
                key={payment.id}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {payment.trip_title}
                      </h4>
                      {payment.days_overdue && payment.days_overdue > 0 && (
                        <Badge variant="error" className="text-xs">
                          {payment.days_overdue} {__('days overdue', 'days overdue')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <User className="w-3 h-3" />
                      <span>{payment.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{__('Due', 'Due')}: {formatDate(payment.due_date)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(payment.amount)}
                    </p>
                    {payment.payment_method && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.payment_method}
                      </p>
                    )}
                  </div>
                </div>
                
                <ConditionalRender capability="yatra_edit_bookings">
                  <div className="flex gap-2 mt-2">
                    {onView && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(payment)}
                        className="flex-1"
                      >
                        {__('View', 'View')}
                      </Button>
                    )}
                    {onCollect && (
                      <Button
                        size="sm"
                        onClick={() => onCollect(payment)}
                        className="flex-1"
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        {__('Collect', 'Collect')}
                      </Button>
                    )}
                  </div>
                </ConditionalRender>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {__('No pending payments', 'No pending payments')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingPayments;

