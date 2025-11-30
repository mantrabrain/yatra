import React from 'react';
import {
  CreditCard,
  CheckCircle,
  Clock as ClockIcon,
  DollarSign as DollarSignIcon,
  Calendar as CalendarIcon,
  FileText as FileTextIcon,
  Eye,
} from 'lucide-react';
import { __ } from '../../lib/i18n';
import { formatDate, getBadge, currency } from './utils';
import type { Payment } from './types';

interface PaymentsProps {
  payments: Payment[];
  onSectionChange: (section: string) => void;
}

const Payments: React.FC<PaymentsProps> = ({ payments, onSectionChange }) => {
  const displayPayments = payments;
  
  // Calculate payment statistics
  const paymentStats = {
    total: displayPayments.length,
    paid: displayPayments.filter((p) => p.status === 'paid').length,
    pending: displayPayments.filter((p) => p.status === 'pending').length,
    totalPaid: displayPayments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    totalPending: displayPayments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="yatra-payments-page space-y-6">
      {/* Header */}
      <div className="yatra-payments-header bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              {__('Payments & Invoices', 'Payments & Invoices')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {__('Track deposits, balances, and installment schedules with secure payment links.', 'Track deposits, balances, and installment schedules with secure payment links.')}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="yatra-payments-stats grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Total Payments', 'Total Payments')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{paymentStats.total}</p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Paid', 'Paid')}</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{paymentStats.paid}</p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Pending', 'Pending')}</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{paymentStats.pending}</p>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Outstanding', 'Outstanding')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{currency(paymentStats.totalPending)}</p>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <DollarSignIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Payments List */}
      {displayPayments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">{__('No payments found', 'No payments found')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">{__('Payment history will appear here once you make a booking.', 'Payment history will appear here once you make a booking.')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayPayments.map((payment) => {
            const isPending = payment.status === 'pending';
            const isPaid = payment.status === 'paid';
            
            return (
              <div
                key={payment.id}
                className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-6">
                  {/* Header Row */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          isPaid ? 'bg-emerald-50 dark:bg-emerald-900/20' : 
                          isPending ? 'bg-amber-50 dark:bg-amber-900/20' : 
                          'bg-gray-50 dark:bg-gray-700'
                        }`}>
                          <CreditCard className={`w-5 h-5 ${
                            isPaid ? 'text-emerald-600 dark:text-emerald-400' : 
                            isPending ? 'text-amber-600 dark:text-amber-400' : 
                            'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium mb-1">
                            {payment.reference}
                          </p>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                            {__('Booking', 'Booking')}: {payment.booking_number}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {formatDate(payment.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-start">
                      <span className={getBadge(payment.status)}>{__(payment.status, payment.status)}</span>
                      <span className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 capitalize">
                        {payment.type}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="yatra-payment-details grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <DollarSignIcon className="w-3.5 h-3.5" />
                        {__('Amount', 'Amount')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{currency(payment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        {__('Payment Method', 'Payment Method')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{payment.method}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {__('Payment Date', 'Payment Date')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(payment.date)}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="yatra-payment-actions flex flex-wrap gap-3">
                    {isPaid && (
                      <div role="button" tabIndex={0} onClick={() => {}} className="yatra-payment-action yatra-payment-action-receipt inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer">
                        <FileTextIcon className="w-4 h-4" />
                        {__('View Receipt', 'View Receipt')}
                      </div>
                    )}
                    {isPending && (
                      <div role="button" tabIndex={0} onClick={() => {}} className="yatra-payment-action yatra-payment-action-pay inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium cursor-pointer">
                        <CreditCard className="w-4 h-4" />
                        {__('Pay Now', 'Pay Now')}
                      </div>
                    )}
                    <div role="button" tabIndex={0} onClick={() => onSectionChange('bookings')} className="yatra-payment-action yatra-payment-action-booking inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer">
                      <Eye className="w-4 h-4" />
                      {__('View Booking', 'View Booking')}
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

export default Payments;

