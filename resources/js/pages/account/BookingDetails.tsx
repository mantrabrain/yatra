import React from "react";
import {
  Calendar as CalendarIcon,
  Users,
  DollarSign as DollarSignIcon,
  CreditCard,
  Mail,
  Phone as PhoneIcon,
  FileText as FileTextIcon,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Download,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import {
  formatDate,
  formatTravelDateRange,
  getBadge,
  formatPriceForBooking,
} from "./utils";
import TaxDisplay from "../../components/booking/TaxDisplay";

const getCountryName = (code: string): string => {
  if (!code || typeof code !== "string") {
    return "";
  }
  const upperCode = code.trim().toUpperCase();
  if (upperCode.length !== 2) {
    return code;
  }
  try {
    const display = new Intl.DisplayNames(undefined, { type: "region" });
    const name = display.of(upperCode);
    return name && name !== upperCode ? name : code;
  } catch {
    return code;
  }
};

interface BookingDetailsData {
  id: number;
  booking_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_country?: string;
  trip_id: number;
  trip_title: string;
  trip_url?: string;
  trip_image?: string;
  trip_price: number;
  booking_date: string;
  travel_date: string;
  end_date?: string | null;
  start_date?: string | null;
  travelers: number;
  travelers_data?: any[];
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  discount_amount?: number;
  payment_status: string;
  booking_status: string;
  payment_method?: string;
  payment_date?: string;
  notes?: string;
  emergency_contact?: any;
  contact_data?: any;
  payments?: any[];
  itinerary_costs?: Array<{
    id: number;
    name: string;
    description?: string;
    price: number;
    price_per: string;
    total_cost: number;
    cost_per_person: boolean;
    item_type?: string;
    day_number?: number;
  }>;
  itinerary_costs_total?: number;
  downloads?: Array<{
    id: string;
    title: string;
    url: string;
    visibility?: string;
    access_label?: string;
    locked?: boolean;
    locked_reason?: string;
  }>;
  created_at: string;
  updated_at?: string;
}

interface BookingDetailsProps {
  booking: BookingDetailsData | null;
  isLoading: boolean;
  onBack: () => void;
}

const BookingDetails: React.FC<BookingDetailsProps> = ({
  booking,
  isLoading,
  onBack,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {__("Booking Details", "yatra")}
            </h2>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            {__("Back to Bookings", "yatra")}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {__("Booking Details", "yatra")}
            </h2>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            {__("Back to Bookings", "yatra")}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6 text-center text-red-500">
          {__("Booking not found or error loading booking", "yatra")}
        </div>
      </div>
    );
  }

  const normalizeRecord = (value: any): Record<string, any> | null => {
    if (!value) return null;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
          return parsed as Record<string, any>;
      } catch {
        return null;
      }
      return null;
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, any>;
    }
    return null;
  };

  const emergencyContact = normalizeRecord((booking as any).emergency_contact);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {__("Booking Details", "yatra")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {__("Complete booking information", "yatra")}
          </p>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          {__("Back to Bookings", "yatra")}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Overview */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("Booking Overview", "yatra")}
              </h3>
              <div className="flex items-center gap-2">
                <span className={getBadge(booking.booking_status)}>
                  {__(
                    booking.booking_status || "pending",
                    booking.booking_status || "pending",
                  )}
                </span>
                <span className={getBadge(booking.payment_status)}>
                  {__(
                    booking.payment_status || "pending",
                    booking.payment_status || "pending",
                  )}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__("Booking Number", "yatra")}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {booking.booking_number || `#${booking.id}`}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__("Trip", "yatra")}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {booking.trip_title}
                </div>
                {booking.trip_url ? (
                  <a
                    href={booking.trip_url}
                    className="mt-2 inline-flex items-center gap-2 text-sm text-yatra-primary dark:text-yatra-on-dark hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {__("View Trip", "yatra")}
                  </a>
                ) : null}
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {__("Booking Date", "yatra")}
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDate(booking.booking_date || booking.created_at)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {__("Travel Date", "yatra")}
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatTravelDateRange(
                    booking.travel_date,
                    booking.end_date,
                  )}
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

            {/* Payment Summary with Gross/Net and Tax Breakdown */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {__("Payment Summary", "yatra")}
              </h4>
              <div className="space-y-2">
                {/* Gross Total */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {__("Gross Total", "yatra")}
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {formatPriceForBooking(
                      (booking as any).subtotal || booking.total_amount,
                      booking.currency,
                    )}
                  </span>
                </div>

                {/* Taxable Amount (SubTotal) */}
                {typeof (booking as any).taxable_amount === "number" &&
                  (booking as any).taxable_amount > 0 &&
                  ((booking as any).tax_amount > 0 ||
                    (booking as any).tax_breakdown?.length > 0) && (
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-600 dark:text-gray-400">
                        {__("Subtotal (Taxable Amount)", "yatra")}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {formatPriceForBooking(
                          (booking as any).taxable_amount,
                          booking.currency,
                        )}
                      </span>
                    </div>
                  )}

                {/* Discount if any */}
                {booking.discount_amount && booking.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {__("Discount", "yatra")}
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      -
                      {formatPriceForBooking(
                        booking.discount_amount,
                        booking.currency,
                      )}
                    </span>
                  </div>
                )}

                {/* Itinerary Costs */}
                {booking.itinerary_costs &&
                  booking.itinerary_costs.length > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          {__("Itinerary Costs", "yatra")}
                        </span>
                      </div>
                      {booking.itinerary_costs.map((cost, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm ml-4"
                        >
                          <span className="text-gray-600 dark:text-gray-400">
                            {cost.name}
                            {cost.price_per === "person" && (
                              <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">
                                ({__("per person", "yatra")})
                              </span>
                            )}
                            {cost.price_per === "group" && (
                              <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">
                                ({__("per booking", "yatra")})
                              </span>
                            )}
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {formatPriceForBooking(
                              cost.total_cost,
                              booking.currency,
                            )}
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                {/* Tax Breakdown */}
                {(booking as any).tax_amount > 0 && (
                  <>
                    {(() => {
                      // Use tax_breakdown if available (already parsed by backend)
                      const taxBreakdown = (booking as any).tax_breakdown;

                      if (
                        Array.isArray(taxBreakdown) &&
                        taxBreakdown.length > 0
                      ) {
                        return taxBreakdown.map((tax: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-600 dark:text-gray-400">
                              {tax.name} ({tax.rate}%)
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {formatPriceForBooking(
                                tax.amount,
                                booking.currency,
                              )}
                            </span>
                          </div>
                        ));
                      }

                      // Fallback: try parsing tax_details JSON string
                      const taxDetails = (booking as any).tax_details;
                      if (taxDetails) {
                        try {
                          const taxes =
                            typeof taxDetails === "string"
                              ? JSON.parse(taxDetails)
                              : taxDetails;

                          if (Array.isArray(taxes) && taxes.length > 0) {
                            return taxes.map((tax: any, index: number) => (
                              <div
                                key={index}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-600 dark:text-gray-400">
                                  {tax.name} ({tax.rate}%)
                                </span>
                                <span className="text-gray-900 dark:text-white">
                                  {formatPriceForBooking(
                                    tax.amount,
                                    booking.currency,
                                  )}
                                </span>
                              </div>
                            ));
                          }
                        } catch (e) {
                          console.error("Failed to parse tax_details:", e);
                        }
                      }

                      // Final fallback: show single tax line
                      if ((booking as any).tax_amount > 0) {
                        return (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {__("Tax", "yatra")} ({(booking as any).tax_rate}
                              %)
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {formatPriceForBooking(
                                (booking as any).tax_amount,
                                booking.currency,
                              )}
                            </span>
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </>
                )}

                {/* Net Amount (Total with tax) */}
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">
                    {__("Net Amount", "yatra")}
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {formatPriceForBooking(
                      booking.total_amount,
                      booking.currency,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {__("Customer Information", "yatra")}
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {booking.customer_name}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {booking.customer_email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      {booking.customer_email}
                    </div>
                  )}
                  {booking.customer_phone && (
                    <div className="flex items-center gap-1.5">
                      <PhoneIcon className="w-4 h-4" />
                      {booking.customer_phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Travelers Information */}
          {booking.travelers_data && booking.travelers_data.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {__("Travelers Information", "yatra")}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({booking.travelers_data.length}{" "}
                  {booking.travelers_data.length === 1
                    ? __("traveler", "yatra")
                    : __("travelers", "yatra")}
                  )
                </span>
              </h3>
              <div className="space-y-4">
                {booking.travelers_data.map((traveler: any, index: number) => {
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
                    travelerFieldsData.first_name || traveler.first_name || "";
                  const lastName =
                    travelerFieldsData.last_name || traveler.last_name || "";

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${index === 0 ? "bg-yatra-soft dark:bg-yatra-surface-dark-muted border border-yatra-border-subtle dark:border-yatra-border-dark" : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {index === 0
                            ? __("Lead Traveler", "yatra")
                            : `${__("Traveler", "yatra")} ${index + 1}`}
                          {(firstName || lastName) && (
                            <span className="font-normal text-gray-500 dark:text-gray-400 ml-2">
                              -{" "}
                              {[firstName, lastName].filter(Boolean).join(" ")}
                            </span>
                          )}
                        </h4>
                        {index === 0 && (
                          <span className="text-xs bg-yatra-chip-bg text-yatra-primary-dark dark:bg-yatra-surface-dark dark:text-yatra-primary-light px-2 py-0.5 rounded">
                            {__("Primary Contact", "yatra")}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {travelerEntries.map(([fieldId, fieldValue]) => {
                          if (
                            fieldId === "first_name" ||
                            fieldId === "last_name"
                          )
                            return null;
                          const label = fieldId
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase());
                          let displayValue = String(fieldValue);
                          if (
                            fieldId.includes("date") ||
                            fieldId.includes("expiry")
                          ) {
                            try {
                              displayValue = formatDate(fieldValue as string);
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
                            <div key={fieldId}>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                {label}
                              </div>
                              <div
                                className={`text-sm text-gray-900 dark:text-white ${fieldId === "passport" ? "font-mono" : ""}`}
                              >
                                {displayValue}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {emergencyContact &&
            Object.values(emergencyContact).some(
              (v: any) => v && String(v).trim() !== "",
            ) && (
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {__("Emergency Contact", "yatra")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(emergencyContact)
                    .filter(
                      ([_, value]) => value && String(value).trim() !== "",
                    )
                    .map(([fieldId, fieldValue]) => {
                      const label = fieldId
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase());
                      return (
                        <div key={fieldId}>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                            {label}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {String(fieldValue)}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

          {/* Special Requests */}
          {booking.notes && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileTextIcon className="w-5 h-5" />
                {__("Special Requests", "yatra")}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {booking.notes}
              </p>
            </div>
          )}

          {/* Downloads */}
          {Array.isArray((booking as any).downloads) &&
            (booking as any).downloads.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  {__("Downloads", "yatra")}
                </h3>
                <div className="space-y-3">
                  {(booking as any).downloads.map((d: any) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {d.title}
                        </div>
                        {d.access_label ? (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {d.access_label}
                          </div>
                        ) : null}
                        {d.locked && d.locked_reason ? (
                          <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            {d.locked_reason}
                          </div>
                        ) : null}
                      </div>
                      {d.locked || !d.url ? (
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium cursor-not-allowed">
                          <Download className="w-4 h-4" />
                          {__("Not Available", "yatra")}
                        </div>
                      ) : (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yatra-primary text-white hover:bg-yatra-primary-dark transition-colors text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          {__("Download", "yatra")}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Information */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {__("Payment Information", "yatra")}
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__("Payment Status", "yatra")}
                </div>
                <div className="mt-1">
                  <span className={getBadge(booking.payment_status)}>
                    {__(
                      booking.payment_status || "pending",
                      booking.payment_status || "pending",
                    )}
                  </span>
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
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__("Total Amount", "yatra")}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatPriceForBooking(
                    booking.total_amount,
                    booking.currency,
                  )}
                </div>
              </div>
              {booking.amount_paid > 0 && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__("Amount Paid", "yatra")}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatPriceForBooking(
                      booking.amount_paid,
                      booking.currency,
                    )}
                  </div>
                </div>
              )}
              {booking.amount_due > 0 && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__("Amount Due", "yatra")}
                  </div>
                  <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {formatPriceForBooking(
                      booking.amount_due,
                      booking.currency,
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {__("Timeline", "yatra")}
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__("Created", "yatra")}
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDate(booking.created_at || booking.booking_date)}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
