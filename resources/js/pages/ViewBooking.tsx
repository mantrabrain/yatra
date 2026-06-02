/**
 * View Booking Page
 * Display booking details in a clean, minimal SaaS-style design
 */

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Users,
  DollarSign,
  CreditCard,
  FileText,
  AlertCircle,
  FileSignature,
  CheckCircle,
  Clock,
  Send,
} from "lucide-react";
import { apiClient, apiService } from "../lib/api-client";
import { __ } from "../lib/i18n";
import { formatDate as formatDateUtil } from "../lib/dateFormat";
import { usePermissions } from "../hooks/usePermissions";
import { getCountryName } from "../lib/countries";
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

interface GoogleCalendarSyncInfo {
  synced: boolean;
  calendar_id: string | null;
  event_id: string | null;
  event_type: string | null;
  sync_status: string | null;
  error_message: string | null;
  last_synced_at: string | null;
}

interface FormFieldConfig {
  id: string;
  type: string;
  label: string;
  enabled: boolean;
  order: number;
  section?: string;
}

interface FormSectionConfig {
  title: string;
  enabled: boolean;
  fields: FormFieldConfig[];
}

interface BookingFormConfig {
  contact_form: FormSectionConfig;
  emergency_contact_form: FormSectionConfig;
  traveler_form: FormSectionConfig;
}

const ViewBooking: React.FC = () => {
  const { can } = usePermissions();

  // Get booking id from URL
  const bookingId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") ? parseInt(params.get("id") || "0") : null;
  }, []);

  // Fetch booking form configuration for dynamic field labels
  const { data: formConfig } = useQuery<BookingFormConfig>({
    queryKey: ["booking-form-config"],
    queryFn: async () => {
      const response = await apiService.getSettings();
      return (
        response?.data?.booking_form_config ||
        response?.booking_form_config ||
        null
      );
    },
  });

  // Get enabled traveler fields from config
  const travelerFields = useMemo(() => {
    if (!formConfig?.traveler_form?.fields) return [];
    return formConfig.traveler_form.fields
      .filter((field) => field.enabled)
      .sort((a, b) => a.order - b.order);
  }, [formConfig]);

  // Get enabled emergency contact fields
  const emergencyFields = useMemo(() => {
    if (!formConfig?.emergency_contact_form?.fields) return [];
    return formConfig.emergency_contact_form.fields
      .filter((field) => field.enabled)
      .sort((a, b) => a.order - b.order);
  }, [formConfig]);

  // Get enabled contact (lead traveler) fields — used to label and format the
  // country / nationality / address / custom contact fields in the summary.
  const contactFields = useMemo(() => {
    if (!formConfig?.contact_form?.fields) return [];
    return formConfig.contact_form.fields
      .filter((field) => field.enabled)
      .sort((a, b) => a.order - b.order);
  }, [formConfig]);

  // Helper to get field label by ID
  const getFieldLabel = (
    fieldId: string,
    fields: FormFieldConfig[],
  ): string => {
    const field = fields.find((f) => f.id === fieldId);
    return (
      field?.label ||
      fieldId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  // Fetch booking data from API
  const {
    data: booking,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;

      const result = await apiService.getBooking(bookingId);

      if (!result) {
        throw new Error("Failed to fetch booking");
      }

      // Handle both wrapped { success, data } and direct data response formats
      const data = (result as any)?.data ?? result;

      if (data && data.id) {
        const contact = (data as any).contact || {};
        return {
          id: data.id,
          booking_number: data.reference,
          customer_name:
            data.customer_name ||
            (data.contact?.first_name && data.contact?.last_name
              ? `${data.contact.first_name} ${data.contact.last_name}`.trim()
              : `${data.contact_first_name || ""} ${data.contact_last_name || ""}`.trim()) ||
            "N/A",
          customer_email:
            data.customer_email || data.contact_email || contact.email || "",
          customer_phone:
            data.customer_phone || data.contact_phone || contact.phone || "",
          customer_country: data.contact_country || contact.country || "",
          trip_id: data.trip_id,
          trip_title: data.trip_title || `Trip #${data.trip_id}`,
          trip_image: data.trip_image,
          trip_price:
            (parseFloat(data.subtotal) || data.total_amount || 0) /
            (data.travelers_count || 1),
          booking_date: data.created_at,
          travel_date: data.travel_date,
          travelers: data.travelers_count,
          travelers_data: data.travelers || [],
          total_amount: data.total_amount,
          amount_paid: data.amount_paid || 0,
          amount_due: data.amount_due || 0,
          discount_amount: data.discount_amount || 0,
          discount_code: data.discount_code || null,
          currency: data.currency || "USD",
          // Tax fields
          subtotal: data.subtotal,
          tax_amount: data.tax_amount,
          tax_rate: data.tax_rate,
          tax_inclusive: data.tax_inclusive,
          tax_details: data.tax_details,
          tax_breakdown: data.tax_breakdown,
          taxable_amount: data.taxable_amount,
          // Itinerary costs
          itinerary_costs: data.itinerary_costs,
          itinerary_costs_total: data.itinerary_costs_total,
          // Additional services
          additional_services: data.additional_services,
          services_total: data.services_total,
          // End tax fields
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
          google_calendar: data.google_calendar as
            | GoogleCalendarSyncInfo
            | undefined,
        };
      }

      return null;
    },
    enabled: !!bookingId && can("yatra_view_bookings"),
  });

  // Fetch consent status for this booking (only if Pro is active)
  const isPro = !!(window as any).yatraAdmin?.isPro;
  const { data: consentStatus } = useQuery({
    queryKey: ["booking-consent-status", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const response = await apiClient.get(
        `/bookings/${bookingId}/consent-status`,
      );
      return response?.data || null;
    },
    enabled: !!bookingId && isPro,
  });

  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString);
  };

  const formatPrice = (price: number, currencyCode: string = "USD") =>
    formatYatraMoney(Number(price) || 0, currencyCode, {
      zeroAsUnknown: false,
    });

  const getBookingStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      confirmed: {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Confirmed", "yatra"),
      },
      pending: {
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        label: __("Pending", "yatra"),
      },
      cancelled: {
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        label: __("Cancelled", "yatra"),
      },
      completed: {
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        label: __("Completed", "yatra"),
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

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      paid: {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Paid", "yatra"),
      },
      pending: {
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        label: __("Pending", "yatra"),
      },
      partial: {
        className:
          "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
        label: __("Partial", "yatra"),
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
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=bookings`;
  };

  const handleEdit = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=bookings&action=edit&id=${bookingId}`;
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
          title={__("Booking Not Found", "yatra")}
          description={__(
            "The booking you are looking for does not exist",
            "yatra",
          )}
          actions={
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__("Back to Bookings", "yatra")}
            </Button>
          }
        />
        <Card>
          <CardContent className="p-8 text-center text-red-500">
            {__("Error loading booking or booking not found", "yatra")}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={__("Booking Details", "yatra")}
        description={__("View complete booking information", "yatra")}
        actions={
          <div className="flex gap-2">
            <ConditionalRender capability="yatra_edit_bookings">
              <Button onClick={handleEdit} className="flex items-center gap-2">
                {__("Edit Booking", "yatra")}
              </Button>
            </ConditionalRender>
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__("Back", "yatra")}
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
                  <CardTitle className="text-base">
                    {__("Booking Overview", "yatra")}
                  </CardTitle>
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
                      {__("Booking Number", "yatra")}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {booking.booking_number}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__("Trip", "yatra")}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {booking.trip_title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__("Trip ID", "yatra")}: #{booking.trip_id}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {__("Booking Date", "yatra")}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(booking.booking_date)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {__("Travel Date", "yatra")}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(booking.travel_date)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {__("Number of Travelers", "yatra")}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {booking.travelers}{" "}
                      {booking.travelers === 1
                        ? __("Traveler", "yatra")
                        : __("Travelers", "yatra")}
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    {__("Payment Summary", "yatra")}
                  </h4>
                  {(() => {
                    // ── Raw figures ──────────────────────────────────────────
                    const dbSubtotal =
                      parseFloat((booking as any).subtotal) ||
                      booking.total_amount ||
                      0;
                    const discountAmount = booking.discount_amount || 0;
                    const itineraryCostsTotal =
                      parseFloat((booking as any).itinerary_costs_total) || 0;
                    const taxAmount =
                      parseFloat((booking as any).tax_amount) || 0;
                    // Handle both PHP bool (true/false) and int/string (1/0/"1"/"0")
                    const taxInclusiveRaw = (booking as any).tax_inclusive;
                    const taxInclusive =
                      taxInclusiveRaw === true ||
                      parseInt(String(taxInclusiveRaw), 10) === 1;
                    const totalAmount = booking.total_amount || 0;
                    const amountPaid = booking.amount_paid || 0;
                    const amountDue = booking.amount_due || 0;

                    // ── Tax breakdown ────────────────────────────────────────
                    let taxLines: {
                      name: string;
                      rate: number;
                      amount: number;
                    }[] = [];
                    const taxBreakdownRaw = (booking as any).tax_breakdown;
                    if (
                      Array.isArray(taxBreakdownRaw) &&
                      taxBreakdownRaw.length > 0
                    ) {
                      taxLines = taxBreakdownRaw;
                    } else {
                      const taxDetailsRaw = (booking as any).tax_details;
                      if (taxDetailsRaw) {
                        try {
                          const parsed =
                            typeof taxDetailsRaw === "string"
                              ? JSON.parse(taxDetailsRaw)
                              : taxDetailsRaw;
                          if (Array.isArray(parsed) && parsed.length > 0)
                            taxLines = parsed;
                        } catch (_) {}
                      }
                      if (taxLines.length === 0 && taxAmount > 0) {
                        taxLines = [
                          {
                            name: __("Tax", "yatra"),
                            rate: parseFloat((booking as any).tax_rate) || 0,
                            amount: taxAmount,
                          },
                        ];
                      }
                    }

                    // ── Itinerary costs ──────────────────────────────────────
                    let itineraryCosts: any[] = [];
                    const itineraryCostsRaw = (booking as any).itinerary_costs;
                    if (typeof itineraryCostsRaw === "string") {
                      try {
                        itineraryCosts = JSON.parse(itineraryCostsRaw);
                      } catch (_) {}
                    } else if (Array.isArray(itineraryCostsRaw)) {
                      itineraryCosts = itineraryCostsRaw;
                    }

                    // ── Services ─────────────────────────────────────────────
                    const rawServices = (booking as any).additional_services;
                    const selectedServices: any[] = Array.isArray(rawServices)
                      ? rawServices.filter((s: any) => s?.selected !== false)
                      : [];
                    const getServiceAmt = (s: any) =>
                      parseFloat(
                        s?.total_price ??
                          s?.calculated_price ??
                          s?.total_cost ??
                          s?.amount ??
                          s?.unit_price ??
                          s?.price ??
                          0,
                      );
                    const servicesTotal = selectedServices.reduce(
                      (sum, s) => sum + getServiceAmt(s),
                      0,
                    );
                    const baseTripCost = dbSubtotal - servicesTotal;

                    // ── Derived amounts ──────────────────────────────────────
                    const taxableAmount =
                      Math.max(0, dbSubtotal - discountAmount) +
                      itineraryCostsTotal;

                    const hasServices = selectedServices.length > 0;
                    const hasDiscount = discountAmount > 0;
                    const hasItinerary =
                      itineraryCosts.length > 0 && itineraryCostsTotal > 0;
                    const hasTax = taxLines.length > 0;
                    const showTaxableRow =
                      hasTax && (hasDiscount || hasItinerary);

                    const Row = ({
                      label,
                      value,
                      sub = false,
                      green = false,
                      bold = false,
                    }: any) => (
                      <div
                        className={`flex justify-between text-sm${sub ? " ml-4" : ""}`}
                      >
                        <span
                          className={
                            bold
                              ? "font-semibold text-gray-900 dark:text-white"
                              : "text-gray-600 dark:text-gray-400"
                          }
                        >
                          {label}
                        </span>
                        <span
                          className={
                            bold
                              ? "font-semibold text-gray-900 dark:text-white"
                              : green
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-900 dark:text-white"
                          }
                        >
                          {value}
                        </span>
                      </div>
                    );

                    return (
                      <div className="space-y-1.5">
                        {/* Trip Base Price — always the first line */}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                            {__("Trip Base Price", "yatra")}
                            {taxInclusive && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                {__("Tax Incl.", "yatra")}
                              </span>
                            )}
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {formatPrice(baseTripCost, booking.currency)}
                          </span>
                        </div>

                        {/* Additional Services section — only when services exist */}
                        {hasServices && (
                          <>
                            <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-1">
                              <span>
                                + {__("Additional Services", "yatra")}
                              </span>
                              <span></span>
                            </div>
                            {selectedServices.map((s: any, i: number) => (
                              <Row
                                key={i}
                                sub
                                label={
                                  s?.service_name ||
                                  s?.name ||
                                  s?.title ||
                                  s?.label ||
                                  __("Service", "yatra")
                                }
                                value={formatPrice(
                                  getServiceAmt(s),
                                  booking.currency,
                                )}
                              />
                            ))}
                            {/* Gross Total = Trip Base Price + Services */}
                            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 dark:border-gray-600 pt-1.5 mt-0.5">
                              <span className="text-gray-900 dark:text-white">
                                {__("Gross Total", "yatra")}
                              </span>
                              <span className="text-gray-900 dark:text-white">
                                {formatPrice(dbSubtotal, booking.currency)}
                              </span>
                            </div>
                          </>
                        )}

                        {/* Discount */}
                        {hasDiscount && (
                          <Row
                            label={__("Discount", "yatra")}
                            value={`-${formatPrice(discountAmount, booking.currency)}`}
                            green
                          />
                        )}

                        {/* Itinerary Costs section */}
                        {hasItinerary && (
                          <>
                            <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-1">
                              <span>+ {__("Itinerary Costs", "yatra")}</span>
                              <span></span>
                            </div>
                            {itineraryCosts.map((cost: any, i: number) => (
                              <Row
                                key={i}
                                sub
                                label={`${cost.name} ${cost.price_per === "person" ? __("(per person)", "yatra") : cost.price_per === "group" ? __("(per booking)", "yatra") : __("(flat rate)", "yatra")}`}
                                value={formatPrice(
                                  cost.total_cost ?? cost.price,
                                  booking.currency,
                                )}
                              />
                            ))}
                          </>
                        )}

                        {/* Taxable Amount — only for exclusive tax when discount/itinerary exist above it */}
                        {!taxInclusive && showTaxableRow && (
                          <div className="flex justify-between text-sm font-semibold border-t border-dashed border-gray-300 dark:border-gray-600 pt-1.5 mt-0.5">
                            <span className="text-gray-700 dark:text-gray-300">
                              {__("Taxable Amount", "yatra")}
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {formatPrice(taxableAmount, booking.currency)}
                            </span>
                          </div>
                        )}

                        {/* Exclusive tax — shown as an addition before Net Amount */}
                        {hasTax && !taxInclusive && (
                          <>
                            <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-1">
                              <span>+ {__("Tax", "yatra")}</span>
                              <span></span>
                            </div>
                            {taxLines.map((tax: any, i: number) => (
                              <div
                                key={i}
                                className="flex justify-between text-sm ml-4"
                              >
                                <span className="text-gray-600 dark:text-gray-400">
                                  {tax.name}
                                  {tax.rate > 0 ? ` (${tax.rate}%)` : ""}
                                </span>
                                <span className="text-gray-900 dark:text-white">
                                  +
                                  {formatPrice(
                                    parseFloat(tax.amount) || 0,
                                    booking.currency,
                                  )}
                                </span>
                              </div>
                            ))}
                          </>
                        )}

                        {/* Net Amount */}
                        <div className="flex justify-between text-base font-bold border-t-2 border-gray-800 dark:border-gray-300 pt-2 mt-1">
                          <span className="text-gray-900 dark:text-white">
                            {__("Net Amount", "yatra")}
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {formatPrice(totalAmount, booking.currency)}
                          </span>
                        </div>

                        {/* Inclusive tax — informational footnote after Net Amount */}
                        {hasTax && taxInclusive && (
                          <div className="mt-1 space-y-0.5">
                            {taxLines.map((tax: any, i: number) => (
                              <div
                                key={i}
                                className="text-xs text-gray-400 dark:text-gray-500 italic"
                              >
                                {__("Incl.", "yatra")} {tax.name}
                                {tax.rate > 0 ? ` (${tax.rate}%)` : ""}:{" "}
                                {formatPrice(
                                  parseFloat(tax.amount) || 0,
                                  booking.currency,
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Amount Paid */}
                        {amountPaid > 0 && (
                          <Row
                            label={__("Amount Paid", "yatra")}
                            value={formatPrice(amountPaid, booking.currency)}
                            green
                          />
                        )}

                        {/* Due Now */}
                        {amountDue > 0 && (
                          <div className="flex justify-between text-sm font-semibold">
                            <span className="text-orange-600 dark:text-orange-400">
                              {__("Due Now", "yatra")}
                            </span>
                            <span className="text-orange-600 dark:text-orange-400">
                              {formatPrice(amountDue, booking.currency)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {__("Customer Information", "yatra")}
                </CardTitle>
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

                {/* Country + dynamic/custom contact fields (nationality,
                    address, and any custom contact field). Mirrors the
                    Emergency/Traveler dynamic-field display. */}
                {(() => {
                  const cd =
                    booking.contact_data &&
                    typeof booking.contact_data === "object"
                      ? (booking.contact_data as Record<string, unknown>)
                      : {};
                  const CORE = ["first_name", "last_name", "email", "phone"];
                  const extras = Object.entries(cd).filter(
                    ([k, v]) =>
                      !CORE.includes(k) &&
                      k !== "country" &&
                      v != null &&
                      String(v).trim() !== "",
                  );
                  const countryCode =
                    booking.customer_country ||
                    (cd.country ? String(cd.country) : "");
                  if (!countryCode && extras.length === 0) return null;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-gray-100 dark:border-gray-700">
                      {countryCode && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                            {getFieldLabel("country", contactFields)}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getCountryName(countryCode)}
                          </div>
                        </div>
                      )}
                      {extras.map(([fieldId, value]) => {
                        const field = contactFields.find(
                          (f) => f.id === fieldId,
                        );
                        const display =
                          field?.type === "country"
                            ? getCountryName(String(value))
                            : String(value);
                        return (
                          <div key={fieldId}>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                              {getFieldLabel(fieldId, contactFields)}
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {display}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Travelers Information - Dynamic Fields */}
            {booking.travelers_data && booking.travelers_data.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {formConfig?.traveler_form?.title ||
                      __("Travelers Information", "yatra")}
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                      ({booking.travelers_data.length}{" "}
                      {booking.travelers_data.length === 1
                        ? __("traveler", "yatra")
                        : __("travelers", "yatra")}
                      )
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {booking.travelers_data.map(
                    (traveler: any, index: number) => {
                      // Extract fields from traveler - handle both flat structure and nested fields property
                      const travelerFieldsData = traveler.fields || traveler;
                      const systemFields = [
                        "id",
                        "booking_id",
                        "traveller_index",
                        "is_lead",
                        "created_at",
                        "updated_at",
                        "fields",
                      ];

                      // Get all non-empty fields from the traveler data, excluding system fields
                      const travelerEntries = Object.entries(
                        travelerFieldsData,
                      ).filter(([key, value]) => {
                        // Exclude system fields
                        if (systemFields.includes(key)) return false;
                        // Exclude empty values
                        if (
                          !value ||
                          (typeof value === "string" && value.trim() === "")
                        )
                          return false;
                        // Exclude objects (they should be in fields)
                        if (typeof value === "object" && !Array.isArray(value))
                          return false;
                        return true;
                      });

                      // Get name from fields or direct properties
                      const firstName =
                        travelerFieldsData.first_name ||
                        traveler.first_name ||
                        "";
                      const lastName =
                        travelerFieldsData.last_name ||
                        traveler.last_name ||
                        "";

                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-lg ${index === 0 ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {index === 0
                                ? __("Lead Traveler", "yatra")
                                : `${__("Traveler", "yatra")} ${index + 1}`}
                              {/* Show name if available */}
                              {(firstName || lastName) && (
                                <span className="font-normal text-gray-500 dark:text-gray-400 ml-2">
                                  -{" "}
                                  {[firstName, lastName]
                                    .filter(Boolean)
                                    .join(" ")}
                                </span>
                              )}
                            </h4>
                            {index === 0 && (
                              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">
                                {__("Primary Contact", "yatra")}
                              </span>
                            )}
                          </div>

                          {/* Dynamic Fields Display */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {travelerEntries.map(([fieldId, fieldValue]) => {
                              // Skip first_name and last_name as they're shown in header
                              if (
                                fieldId === "first_name" ||
                                fieldId === "last_name"
                              )
                                return null;

                              const fieldConfig = travelerFields.find(
                                (f) => f.id === fieldId,
                              );
                              const label =
                                fieldConfig?.label ||
                                getFieldLabel(fieldId, travelerFields);
                              const isLongField =
                                fieldConfig?.type === "textarea" ||
                                String(fieldValue).length > 50;

                              // Format date fields
                              let displayValue = String(fieldValue);
                              if (
                                fieldConfig?.type === "date" ||
                                fieldId.includes("date") ||
                                fieldId.includes("expiry")
                              ) {
                                try {
                                  displayValue = new Date(
                                    fieldValue as string,
                                  ).toLocaleDateString();
                                } catch {
                                  displayValue = String(fieldValue);
                                }
                              }

                              // Format country/nationality fields - convert code to full name
                              if (
                                (fieldId === "nationality" ||
                                  fieldId === "country") &&
                                fieldValue &&
                                typeof fieldValue === "string" &&
                                fieldValue.length === 2
                              ) {
                                displayValue = getCountryName(fieldValue);
                              }

                              return (
                                <div
                                  key={fieldId}
                                  className={
                                    isLongField
                                      ? "col-span-2 md:col-span-3"
                                      : ""
                                  }
                                >
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                    {label}
                                  </div>
                                  <div
                                    className={`text-sm text-gray-900 dark:text-white ${fieldId === "passport" ? "font-mono" : ""} capitalize`}
                                  >
                                    {displayValue}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {travelerEntries.length <= 2 && (
                            <div className="text-sm text-gray-400 dark:text-gray-500 italic mt-2">
                              {__(
                                "Limited traveler information provided",
                                "yatra",
                              )}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </CardContent>
              </Card>
            )}

            {/* Emergency Contact - Dynamic Fields */}
            {booking.emergency_contact &&
              Object.values(booking.emergency_contact).some(
                (v) => v && String(v).trim() !== "",
              ) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {formConfig?.emergency_contact_form?.title ||
                        __("Emergency Contact", "yatra")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Object.entries(booking.emergency_contact)
                        .filter(
                          ([_, value]) => value && String(value).trim() !== "",
                        )
                        .map(([fieldId, fieldValue]) => {
                          const label = getFieldLabel(fieldId, emergencyFields);
                          return (
                            <div key={fieldId}>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                {label}
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                {String(fieldValue)}
                              </div>
                            </div>
                          );
                        })}
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
                    {__("Special Requests", "yatra")}
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
            {/* Google Calendar Sync */}
            {(window as any).yatraAdmin?.isPro &&
              !!(window as any).yatraAdmin?.googleCalendar?.enabled &&
              (booking as any).google_calendar && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {__("Google Calendar Sync", "yatra")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const gc = (booking as any)
                        .google_calendar as GoogleCalendarSyncInfo;
                      const status =
                        gc.sync_status || (gc.synced ? "synced" : "not_synced");
                      const statusClass =
                        status === "synced"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : status === "failed"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";

                      return (
                        <>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              {__("Status", "yatra")}
                            </div>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${statusClass}`}
                            >
                              {status}
                            </span>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              {__("Last Synced", "yatra")}
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {gc.last_synced_at
                                ? formatDate(gc.last_synced_at)
                                : __("—", "yatra")}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              {__("Calendar", "yatra")}
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white break-all">
                              {gc.calendar_id || __("—", "yatra")}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              {__("Event ID", "yatra")}
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white font-mono break-all">
                              {gc.event_id || __("—", "yatra")}
                            </div>
                          </div>

                          {gc.error_message && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                {__("Error", "yatra")}
                              </div>
                              <div className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">
                                {gc.error_message}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

            {/* Payment Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {__("Payment Information", "yatra")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__("Payment Status", "yatra")}
                  </div>
                  <div className="mt-1">
                    {getPaymentStatusBadge(booking.payment_status)}
                  </div>
                </div>
                {booking.payment_method && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      {__("Payment Method", "yatra")}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {booking.payment_method}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    {__("Trip Price per Person", "yatra")}
                    {((v) => v === true || parseInt(String(v), 10) === 1)(
                      (booking as any).tax_inclusive,
                    ) && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 normal-case tracking-normal">
                        {__("Tax Incl.", "yatra")}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {(() => {
                      // subtotal (DB) = base trip cost + services when Pro is active.
                      // Subtract services total to get the pure trip base cost.
                      const subtotal =
                        parseFloat((booking as any).subtotal) ||
                        booking.total_amount ||
                        0;
                      const travelers = booking.travelers || 1;

                      const rawServices = (booking as any).additional_services;
                      const servicesTotal = Array.isArray(rawServices)
                        ? rawServices
                            .filter((s: any) => s?.selected !== false)
                            .reduce(
                              (sum: number, s: any) =>
                                sum +
                                parseFloat(
                                  s?.total_price ??
                                    s?.calculated_price ??
                                    s?.total_cost ??
                                    s?.amount ??
                                    s?.unit_price ??
                                    s?.price ??
                                    0,
                                ),
                              0,
                            )
                        : 0;

                      const baseTripCost = subtotal - servicesTotal;
                      return formatPrice(
                        baseTripCost / travelers,
                        booking.currency,
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    {__("Total Amount", "yatra")}
                    {((v) => v === true || parseInt(String(v), 10) === 1)(
                      (booking as any).tax_inclusive,
                    ) && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 normal-case tracking-normal">
                        {__("Tax Incl.", "yatra")}
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatPrice(booking.total_amount || 0, booking.currency)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discount Applied Card */}
            {booking.discount_amount > 0 && (
              <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-4 h-4"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                      <path d="M2 17l10 5 10-5"></path>
                      <path d="M2 12l10 5 10-5"></path>
                    </svg>
                    {__("Discount Applied", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                      {__("Discount Type", "yatra")}
                    </div>
                    <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {booking.discount_code?.toLowerCase().includes("group") ||
                      booking.discount_code?.includes("GROUP")
                        ? __("Group Discount", "yatra")
                        : __("Coupon Discount", "yatra")}
                    </div>
                  </div>
                  {booking.discount_code && (
                    <div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                        {__("Code", "yatra")}
                      </div>
                      <div className="text-sm font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded inline-block">
                        {booking.discount_code}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                      {__("Savings", "yatra")}
                    </div>
                    <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                      -{formatPrice(booking.discount_amount, booking.currency)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Consent Status Card - Only show if Pro is active and there are consent forms */}
            {isPro && consentStatus && consentStatus.total_required > 0 && (
              <Card
                className={
                  consentStatus.all_signed
                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                    : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
                }
              >
                <CardHeader className="pb-2">
                  <CardTitle
                    className={`text-base flex items-center gap-2 ${
                      consentStatus.all_signed
                        ? "text-green-700 dark:text-green-400"
                        : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    <FileSignature className="w-4 h-4" />
                    {__("Consent Status", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${consentStatus.all_signed ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}
                    >
                      {consentStatus.all_signed ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {__("All Consents Signed", "yatra")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {__("Pending Signatures", "yatra")}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {__("Signed", "yatra")}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {consentStatus.total_signed} /{" "}
                      {consentStatus.total_required}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${consentStatus.all_signed ? "bg-green-500" : "bg-amber-500"}`}
                      style={{
                        width: `${(consentStatus.total_signed / consentStatus.total_required) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Pending requests */}
                  {consentStatus.pending_requests &&
                    consentStatus.pending_requests.length > 0 && (
                      <div className="pt-2 border-t border-amber-200 dark:border-amber-700">
                        <div className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">
                          {__("Pending", "yatra")}
                        </div>
                        <div className="space-y-1">
                          {consentStatus.pending_requests
                            .slice(0, 3)
                            .map((req: any, idx: number) => (
                              <div
                                key={idx}
                                className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                                {req.recipient_name || req.recipient_email}
                              </div>
                            ))}
                          {consentStatus.pending_requests.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{consentStatus.pending_requests.length - 3}{" "}
                              {__("more", "yatra")}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Link to consent management */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=trip-consent`;
                    }}
                  >
                    {__("Manage Consents", "yatra")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Booking Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {__("Timeline", "yatra")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__("Created", "yatra")}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatDate(booking.created_at)}
                  </div>
                </div>
                {booking.updated_at &&
                  booking.updated_at !== booking.created_at && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        {__("Last Updated", "yatra")}
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
