import React from "react";
import {
  CreditCard,
  CheckCircle,
  Clock as ClockIcon,
  DollarSign as DollarSignIcon,
  Calendar as CalendarIcon,
  FileText as FileTextIcon,
  Eye,
  Download,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import { formatDate, getBadge, currency } from "./utils";
import { downloadInvoice } from "./utils/downloads";
import type { Payment } from "./types";

interface PaymentsProps {
  payments: Payment[];
  onSectionChange: (section: string) => void;
}

const Payments: React.FC<PaymentsProps> = ({ payments, onSectionChange }) => {
  const displayPayments = payments;

  const bookingSummaries = React.useMemo(() => {
    const map = new Map<number, { total: number; paid: number; due: number }>();

    displayPayments.forEach((payment) => {
      if (typeof payment.booking_id !== "number") {
        return;
      }
      const total =
        typeof payment.booking_total_amount === "number"
          ? payment.booking_total_amount
          : null;
      const dueValue =
        typeof payment.booking_amount_due === "number"
          ? payment.booking_amount_due
          : null;
      const paidValue =
        typeof payment.booking_amount_paid === "number"
          ? payment.booking_amount_paid
          : null;
      const paid =
        paidValue ??
        (total !== null && dueValue !== null ? total - dueValue : null);
      const due =
        dueValue ?? (total !== null && paid !== null ? total - paid : null);
      const existing = map.get(payment.booking_id);
      const summary = {
        total: total ?? existing?.total ?? 0,
        paid: paid ?? existing?.paid ?? 0,
        due: due ?? existing?.due ?? 0,
      };

      // Prefer the latest (smallest due) snapshot
      if (!existing || summary.due < existing.due) {
        map.set(payment.booking_id, summary);
      }
    });

    return Array.from(map.values());
  }, [displayPayments]);

  const paymentStats = React.useMemo(() => {
    const totals = bookingSummaries.reduce(
      (acc, summary) => {
        acc.totalAmount += summary.total;
        acc.paidAmount += summary.total - summary.due;
        acc.outstanding += summary.due;
        if (summary.due > 0) {
          acc.pendingBookings += 1;
        } else {
          acc.paidBookings += 1;
        }
        return acc;
      },
      {
        totalAmount: 0,
        paidAmount: 0,
        outstanding: 0,
        pendingBookings: 0,
        paidBookings: 0,
      },
    );

    return {
      total: displayPayments.length,
      paid: totals.paidBookings,
      pending: totals.pendingBookings,
      totalPaidAmount: totals.paidAmount,
      outstandingAmount: totals.outstanding,
    };
  }, [displayPayments, bookingSummaries]);

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
              {__("Payments & Invoices", "yatra")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {__(
                "Track deposits, balances, and installment schedules with secure payment links.",
                "yatra",
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="yatra-payments-stats grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {__("Total Payments", "yatra")}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {paymentStats.total}
              </p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {__("Paid", "yatra")}
              </p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {paymentStats.paid}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {currency(paymentStats.totalPaidAmount)}
              </p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {__("Pending", "yatra")}
              </p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {paymentStats.pending}
              </p>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="yatra-payment-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {__("Outstanding", "yatra")}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {currency(paymentStats.outstandingAmount)}
              </p>
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
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">
            {__("No payments found", "yatra")}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {__(
              "Payment history will appear here once you make a booking.",
              "yatra",
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayPayments.map((payment) => {
            const bookingTotal =
              typeof payment.booking_total_amount === "number"
                ? payment.booking_total_amount
                : null;
            const bookingPaid =
              typeof payment.booking_amount_paid === "number"
                ? payment.booking_amount_paid
                : null;
            const bookingDue =
              typeof payment.booking_amount_due === "number"
                ? payment.booking_amount_due
                : null;
            const total = bookingTotal ?? payment.amount;
            const paid =
              bookingPaid ??
              (bookingDue !== null && bookingTotal !== null
                ? bookingTotal - bookingDue
                : payment.amount);
            const dueRaw =
              bookingDue ??
              (bookingTotal !== null ? bookingTotal - paid : total - paid);
            const due = Math.max(0, dueRaw || 0);
            const canPayRemaining =
              typeof payment.booking_id === "number" && due > 0.01;
            const isPaid =
              payment.status === "paid" || payment.status === "completed";
            const isPending = payment.status === "pending";

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
                        <div
                          className={`p-2 rounded-lg ${
                            payment.status === "paid"
                              ? "bg-emerald-50 dark:bg-emerald-900/20"
                              : payment.status === "pending"
                                ? "bg-amber-50 dark:bg-amber-900/20"
                                : "bg-gray-50 dark:bg-gray-700"
                          }`}
                        >
                          <CreditCard
                            className={`w-5 h-5 ${
                              payment.status === "paid"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : payment.status === "pending"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium mb-1">
                            {payment.reference}
                          </p>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                            {__("Booking", "yatra")}: {payment.booking_number}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {formatDate(payment.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-start">
                      <span className={getBadge(payment.status)}>
                        {__(payment.status, payment.status)}
                      </span>
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
                        {__("Amount", "yatra")}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {currency(payment.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        {__("Payment Method", "yatra")}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {payment.method}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {__("Payment Date", "yatra")}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDate(payment.date)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="yatra-payment-actions flex flex-wrap gap-3">
                    {/* Download Invoice - show for paid/completed payments */}
                    {isPaid && (
                      <button
                        onClick={() => downloadInvoice(payment.id)}
                        className="yatra-payment-action yatra-payment-action-invoice inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: "#059669", color: "#ffffff" }}
                      >
                        <Download className="w-4 h-4" />
                        {__("Download Invoice", "yatra")}
                      </button>
                    )}
                    {isPaid && (
                      <a
                        href={`${(window as any).yatraAdmin?.siteUrl || ""}/?yatra_invoice=${payment.id}&_wpnonce=${(window as any).yatraAdmin?.nonce || ""}&view=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="yatra-payment-action yatra-payment-action-receipt inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                      >
                        <FileTextIcon className="w-4 h-4" />
                        {__("View Receipt", "yatra")}
                      </a>
                    )}
                    {isPending && !canPayRemaining && (
                      <button
                        type="button"
                        className="yatra-payment-action inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium"
                      >
                        <ClockIcon className="w-4 h-4" />
                        {__("Pending approval", "yatra")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSectionChange("bookings")}
                      className="yatra-payment-action yatra-payment-action-booking inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      {__("View Booking Details", "yatra")}
                    </button>
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
