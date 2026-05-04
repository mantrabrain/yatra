/**
 * View Customer Page
 * Display customer details with dynamic data from API
 */

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Edit,
  Award,
  Globe,
  User,
  AlertCircle,
} from "lucide-react";
import { __ } from "../lib/i18n";
import { apiService } from "../lib/api-client";
import { formatDate as formatDateUtil } from "../lib/dateFormat";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Skeleton } from "../components/ui/skeleton";
import { formatYatraMoney } from "../lib/currency-display";

interface Customer {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string;
  secondary_phone?: string;
  country: string;
  city?: string;
  state?: string;
  address?: string;
  postal_code?: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: string;
  emergency_name?: string;
  emergency_phone?: string;
  emergency_relationship?: string;
  dietary_requirements?: string;
  medical_conditions?: string;
  special_needs?: string;
  newsletter_optin: boolean;
  marketing_optin: boolean;
  total_bookings: number;
  total_spent: number;
  total_travelers: number;
  loyalty_tier: string;
  loyalty_points: number;
  status: string;
  notes?: string;
  created_at: string;
  last_booking_date?: string;
  last_travel_date?: string;
}

interface Booking {
  id: number;
  reference: string;
  trip_id: number;
  trip_title: string;
  trip_slug?: string;
  travel_date: string;
  travelers_count: number;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
}

const ViewCustomer: React.FC = () => {
  const { can, isPro } = usePermissions();

  const baseAdminUrl = (window as any).yatraAdmin?.adminUrl || "";

  // Get customer id from URL
  const customerId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") ? parseInt(params.get("id") || "0") : null;
  }, []);

  // Fetch customer data from API
  const {
    data: customer,
    isLoading,
    error,
  } = useQuery<Customer>({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      if (!customerId) throw new Error("No customer ID");
      const response = await apiService.getCustomer(customerId);
      const data = (response as any)?.data ?? response;

      // Normalize nested emergency_contact structure to flat fields expected by the UI
      const emergency = (data as any).emergency_contact || {};

      return {
        ...data,
        emergency_name: (data as any).emergency_name ?? emergency.name ?? null,
        emergency_phone:
          (data as any).emergency_phone ?? emergency.phone ?? null,
        emergency_relationship:
          (data as any).emergency_relationship ??
          emergency.relationship ??
          null,
      } as Customer;
    },
    enabled: !!customerId && can("yatra_view_bookings"),
  });

  // Fetch customer bookings
  const { data: bookings, isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["customer-bookings", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const json = await apiService.getCustomerBookings(customerId);
      // API returns an object with data property; ensure we always return an array
      if (Array.isArray(json)) {
        return json;
      }
      if (json && Array.isArray(json.data)) {
        return json.data;
      }
      return [];
    },
    enabled: !!customerId && can("yatra_view_bookings"),
  });

  const formatDate = (dateString: string | null | undefined) => {
    return formatDateUtil(dateString);
  };

  const formatShortDate = (dateString: string | null | undefined) => {
    return formatDateUtil(dateString);
  };

  const formatPrice = (price: number, currencyCode: string = "USD") =>
    formatYatraMoney(Number(price) || 0, currencyCode, {
      zeroAsUnknown: false,
    });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      active: {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Active", "yatra"),
      },
      inactive: {
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
        label: __("Inactive", "yatra"),
      },
      blocked: {
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        label: __("Blocked", "yatra"),
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

  const getBookingStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      confirmed: {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Confirmed", "yatra"),
      },
      completed: {
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        label: __("Completed", "yatra"),
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
    };

    const statusInfo = statusMap[status] || {
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  const getLoyaltyBadge = (tier: string) => {
    const tierMap: Record<string, { className: string; icon: string }> = {
      bronze: {
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
        icon: "🥉",
      },
      silver: {
        className:
          "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300",
        icon: "🥈",
      },
      gold: {
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        icon: "🥇",
      },
      platinum: {
        className:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
        icon: "💎",
      },
    };

    const tierInfo = tierMap[tier] || tierMap["bronze"];

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium ${tierInfo.className}`}
      >
        <span>{tierInfo.icon}</span>
        <span className="capitalize">{tier}</span>
      </span>
    );
  };

  const handleBack = () => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=customers`;
  };

  const handleEdit = () => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=customers&action=edit&id=${customerId}`;
  };

  const handleViewBooking = (bookingId: number) => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=bookings&action=view&id=${bookingId}`;
  };

  // Skeleton loader
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="lg:col-span-2 space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-6 w-16 rounded" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-64" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-12" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__("Customer Details", "yatra")}
          description={__("Loading...", "yatra")}
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
        {renderSkeleton()}
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__("Customer Not Found", "yatra")}
          description={__(
            "The customer you are looking for does not exist",
            "yatra",
          )}
          actions={
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__("Back to Customers", "yatra")}
            </Button>
          }
        />
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
            <p className="text-red-500">
              {__("Error loading customer or customer not found", "yatra")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={__("Customer Details", "yatra")}
        description={__("View complete customer information", "yatra")}
        actions={
          <div className="flex gap-2">
            <ConditionalRender capability="yatra_edit_bookings">
              <Button onClick={handleEdit} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                {__("Edit Customer", "yatra")}
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
            {/* Customer Overview */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {__("Customer Overview", "yatra")}
                  </CardTitle>
                  <div className="flex gap-2">
                    {getStatusBadge(customer.status)}
                    {getLoyaltyBadge(customer.loyalty_tier || "bronze")}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {__("Full Name", "yatra")}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    <a
                      href={`${baseAdminUrl}?page=yatra&subpage=customers&action=view&id=${customer.id}`}
                      className="hover:underline text-primary-600 dark:text-primary-400"
                    >
                      {customer.name ||
                        `${customer.first_name} ${customer.last_name}`}
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {__("Email Address", "yatra")}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {customer.email}
                    </div>
                  </div>
                  {customer.phone && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {__("Phone Number", "yatra")}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.phone}
                        {customer.secondary_phone && (
                          <span className="text-gray-500 ml-2">
                            / {customer.secondary_phone}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {customer.address && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {__("Address", "yatra")}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {customer.address}
                      {customer.city && `, ${customer.city}`}
                      {customer.state && `, ${customer.state}`}
                      {customer.postal_code && ` ${customer.postal_code}`}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {customer.country && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {__("Country", "yatra")}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.country}
                      </div>
                    </div>
                  )}
                  {customer.nationality && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        {__("Nationality", "yatra")}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.nationality}
                      </div>
                    </div>
                  )}
                  {customer.date_of_birth && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        {__("Date of Birth", "yatra")}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatShortDate(customer.date_of_birth)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {customer.emergency_name && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    {__("Emergency Contact", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        {__("Name", "yatra")}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.emergency_name}
                      </div>
                    </div>
                    {customer.emergency_phone && (
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          {__("Phone", "yatra")}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {customer.emergency_phone}
                        </div>
                      </div>
                    )}
                    {customer.emergency_relationship && (
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          {__("Relationship", "yatra")}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {customer.emergency_relationship}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Bookings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {__("Booking History", "yatra")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingBookings ? (
                  <div className="p-4 space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : !bookings || bookings.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {__("No bookings yet", "yatra")}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{__("Reference", "yatra")}</TableHead>
                        <TableHead>{__("Trip", "yatra")}</TableHead>
                        <TableHead>{__("Travel Date", "yatra")}</TableHead>
                        <TableHead>{__("Amount", "yatra")}</TableHead>
                        <TableHead>{__("Status", "yatra")}</TableHead>
                        <TableHead className="text-right">
                          {__("Actions", "yatra")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium text-gray-900 dark:text-white">
                            {booking.reference}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            {booking.trip_title}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {formatShortDate(booking.travel_date)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(
                              booking.total_amount,
                              booking.currency,
                            )}
                          </TableCell>
                          <TableCell>
                            {getBookingStatusBadge(booking.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBooking(booking.id)}
                              className="h-8"
                            >
                              {__("View", "yatra")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {customer.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {__("Internal Notes", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {customer.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Special Requirements */}
            {(customer.dietary_requirements ||
              customer.medical_conditions ||
              customer.special_needs) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Special Requirements", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customer.dietary_requirements && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        {__("Dietary Requirements", "yatra")}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.dietary_requirements}
                      </div>
                    </div>
                  )}
                  {customer.medical_conditions && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        {__("Medical Conditions", "yatra")}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.medical_conditions}
                      </div>
                    </div>
                  )}
                  {customer.special_needs && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        {__("Special Needs", "yatra")}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.special_needs}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Statistics */}
            {isPro && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Statistics", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {__("Total Bookings", "yatra")}
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {customer.total_bookings || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {__("Total Spent", "yatra")}
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatPrice(customer.total_spent || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {__("Total Travelers", "yatra")}
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {customer.total_travelers || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loyalty */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  {__("Loyalty", "yatra")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__("Current Tier", "yatra")}
                  </div>
                  <div>
                    {getLoyaltyBadge(customer.loyalty_tier || "bronze")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__("Points", "yatra")}
                  </div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {customer.loyalty_points || 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {__("Timeline", "yatra")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {__("Registered", "yatra")}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatDate(customer.created_at)}
                  </div>
                </div>
                {customer.last_booking_date && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__("Last Booking", "yatra")}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatShortDate(customer.last_booking_date)}
                    </div>
                  </div>
                )}
                {customer.last_travel_date && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__("Last Travel", "yatra")}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatShortDate(customer.last_travel_date)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {__("Preferences", "yatra")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {__("Newsletter", "yatra")}
                  </span>
                  <span
                    className={
                      customer.newsletter_optin
                        ? "text-green-600"
                        : "text-gray-400"
                    }
                  >
                    {customer.newsletter_optin
                      ? __("Subscribed", "yatra")
                      : __("Not subscribed", "yatra")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {__("Marketing", "yatra")}
                  </span>
                  <span
                    className={
                      customer.marketing_optin
                        ? "text-green-600"
                        : "text-gray-400"
                    }
                  >
                    {customer.marketing_optin
                      ? __("Opted in", "yatra")
                      : __("Opted out", "yatra")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ConditionalRender>
    </div>
  );
};

export default ViewCustomer;
