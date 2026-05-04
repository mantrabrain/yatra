/**
 * View Payment Page
 * Display payment details in a clean, minimal SaaS-style design
 */

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Edit,
  ExternalLink,
  Download,
} from "lucide-react";
import { __ } from "../lib/i18n";
import { apiService } from "../lib/api-client";
import { downloadAdminInvoice } from "../lib/invoice-download";
import { useToast } from "../components/ui/toast";
import { usePermissions } from "../hooks/usePermissions";
import { Button } from "../components/ui/button";
import { PageHeader } from "../components/common/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ConditionalRender } from "../components/ui/conditional-render";
import { Skeleton } from "../components/ui/skeleton";
import { formatYatraMoney } from "../lib/currency-display";

function paymentStr(v: unknown, fallback = ""): string {
  if (v == null || v === "") return fallback;
  return String(v);
}

function paymentNum(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isNaN(n) ? 0 : n;
}

interface ViewPaymentRow {
  id: number;
  payment_number: string;
  booking_id: number;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  trip_id: number;
  trip_title: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
  payment_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const ViewPayment: React.FC = () => {
  const { can } = usePermissions();
  const { showToast } = useToast();
  const [isDownloadingInvoice, setIsDownloadingInvoice] = React.useState(false);

  // Get payment id from URL
  const paymentId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") ? parseInt(params.get("id") || "0") : null;
  }, []);

  // Fetch payment data
  const {
    data: payment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: async () => {
      if (!paymentId) return null;

      const result = await apiService.getPayment(paymentId);

      if (!result) {
        throw new Error("Failed to fetch payment");
      }

      if (!result.success) {
        throw new Error(result.message || "Payment not found");
      }

      const data = result.data;
      const idNum = paymentNum(data.id);
      const bookingId = paymentNum(data.booking_id);
      const ref = paymentStr(data.booking_reference);
      const row: ViewPaymentRow = {
        id: idNum,
        payment_number: `PAY-${String(idNum).padStart(6, "0")}`,
        booking_id: bookingId,
        booking_number: ref || `#${bookingId}`,
        customer_name: paymentStr(data.customer_name, "N/A"),
        customer_email: paymentStr(data.customer_email),
        customer_phone: paymentStr(data.customer_phone),
        trip_id: paymentNum(data.trip_id),
        trip_title: paymentStr(data.trip_title),
        amount: paymentNum(data.amount),
        payment_method: paymentStr(data.gateway),
        payment_status: paymentStr(data.status, "pending"),
        transaction_id: paymentStr(data.transaction_id),
        payment_date: paymentStr(data.processed_at || data.created_at),
        notes: paymentStr(data.notes),
        created_at: paymentStr(data.created_at),
        updated_at: paymentStr(data.updated_at),
      };
      return row;
    },
    enabled: !!paymentId && can("yatra_view_bookings"),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: number, currencyCode: string = "USD") =>
    formatYatraMoney(Number(price) || 0, currencyCode, {
      zeroAsUnknown: false,
    });

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      completed: {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Completed", "yatra"),
      },
      pending: {
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        label: __("Pending", "yatra"),
      },
      partial: {
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        label: __("Partial", "yatra"),
      },
      failed: {
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        label: __("Failed", "yatra"),
      },
      refunded: {
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
        label: __("Refunded", "yatra"),
      },
    };

    const statusInfo = statusMap[status] || {
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  const handleBack = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=payments`;
  };

  const handleEdit = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=payments&action=edit&id=${paymentId}`;
  };

  const handleViewBooking = () => {
    if (payment?.booking_id) {
      window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=bookings&action=view&id=${payment.booking_id}`;
    }
  };

  const handleDownloadInvoice = async () => {
    if (!paymentId) return;
    setIsDownloadingInvoice(true);
    try {
      await downloadAdminInvoice(paymentId);
    } catch (e: any) {
      showToast(
        e?.message || __("Failed to download invoice", "yatra"),
        "error",
      );
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const canDownloadInvoice =
    !!payment &&
    ["completed", "paid"].includes(
      String(payment.payment_status).toLowerCase(),
    );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__("Payment Details", "yatra")}
          actions={
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__("Back", "yatra")}
            </Button>
          }
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__("Payment Not Found", "yatra")}
          actions={
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__("Back to Payments", "yatra")}
            </Button>
          }
        />
        <Card>
          <CardContent className="p-8 text-center text-red-500">
            {__(
              "Payment not found or you do not have permission to view it.",
              "yatra",
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={__("Payment Details", "yatra")}
        description={__("View complete payment information", "yatra")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__("Back", "yatra")}
            </Button>
            {canDownloadInvoice && (
              <Button
                variant="outline"
                onClick={handleDownloadInvoice}
                disabled={isDownloadingInvoice}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isDownloadingInvoice
                  ? __("Downloading…", "yatra")
                  : __("Download Invoice", "yatra")}
              </Button>
            )}
            <ConditionalRender capability="yatra_edit_bookings">
              <Button onClick={handleEdit} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                {__("Edit Payment", "yatra")}
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
                  <CardTitle className="text-base">
                    {__("Payment Information", "yatra")}
                  </CardTitle>
                  {getPaymentStatusBadge(payment.payment_status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {__("Payment Number", "yatra")}
                    </label>
                    <p className="mt-1 text-sm font-mono font-semibold text-gray-900 dark:text-white">
                      {payment.payment_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {__("Payment Amount", "yatra")}
                    </label>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {formatPrice(payment.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {__("Payment Method", "yatra")}
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
                      {__("Payment Date", "yatra")}
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
                        {__("Transaction ID", "yatra")}
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
                      {__("Notes", "yatra")}
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
                  <CardTitle className="text-base">
                    {__("Related Booking", "yatra")}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleViewBooking}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    {__("View Booking", "yatra")}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {__("Booking Number", "yatra")}
                    </label>
                    <p className="mt-1 text-sm font-mono font-semibold text-gray-900 dark:text-white">
                      {payment.booking_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {__("Trip", "yatra")}
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
                <CardTitle className="text-base">
                  {__("Customer", "yatra")}
                </CardTitle>
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
                <CardTitle className="text-base">
                  {__("Timeline", "yatra")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {__("Created", "yatra")}
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDate(payment.created_at)}
                  </p>
                </div>
                {payment.updated_at &&
                  payment.updated_at !== payment.created_at && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {__("Last Updated", "yatra")}
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
