import { r as reactExports, u as useQuery, j as jsxRuntimeExports, z as ArrowLeft, p as Calendar, U as Users, d as Mail, aW as Phone, az as AlertCircle, k as FileText, i as CreditCard, F as FileSignature, av as CheckCircle, ar as Clock, bh as Send } from "./react-vendor-CqkbFEvK.js";
import { _ as __, f as formatYatraMoney, b as apiService, a as apiClient } from "./index-fqW8jODk.js";
import { u as usePermissions, O as Skeleton, C as Card, f as CardHeader, d as CardContent, P as PageHeader, B as Button, s as ConditionalRender, g as CardTitle, ac as getCountryName, ad as formatDate } from "../../admin/dist/js/app.js";
const ViewBooking = () => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const { can } = usePermissions();
  const bookingId = reactExports.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") ? parseInt(params.get("id") || "0") : null;
  }, []);
  const { data: formConfig } = useQuery({
    queryKey: ["booking-form-config"],
    queryFn: async () => {
      var _a2;
      const response = await apiService.getSettings();
      return ((_a2 = response == null ? void 0 : response.data) == null ? void 0 : _a2.booking_form_config) || (response == null ? void 0 : response.booking_form_config) || null;
    }
  });
  const travelerFields = reactExports.useMemo(() => {
    var _a2;
    if (!((_a2 = formConfig == null ? void 0 : formConfig.traveler_form) == null ? void 0 : _a2.fields)) return [];
    return formConfig.traveler_form.fields.filter((field) => field.enabled).sort((a, b) => a.order - b.order);
  }, [formConfig]);
  const emergencyFields = reactExports.useMemo(() => {
    var _a2;
    if (!((_a2 = formConfig == null ? void 0 : formConfig.emergency_contact_form) == null ? void 0 : _a2.fields)) return [];
    return formConfig.emergency_contact_form.fields.filter((field) => field.enabled).sort((a, b) => a.order - b.order);
  }, [formConfig]);
  const getFieldLabel = (fieldId, fields) => {
    const field = fields.find((f) => f.id === fieldId);
    return (field == null ? void 0 : field.label) || fieldId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };
  const {
    data: booking,
    isLoading,
    error
  } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      var _a2, _b2;
      if (!bookingId) return null;
      const result = await apiService.getBooking(bookingId);
      if (!result) {
        throw new Error("Failed to fetch booking");
      }
      const data = (result == null ? void 0 : result.data) ?? result;
      if (data && data.id) {
        const contact = data.contact || {};
        return {
          id: data.id,
          booking_number: data.reference,
          customer_name: data.customer_name || (((_a2 = data.contact) == null ? void 0 : _a2.first_name) && ((_b2 = data.contact) == null ? void 0 : _b2.last_name) ? `${data.contact.first_name} ${data.contact.last_name}`.trim() : `${data.contact_first_name || ""} ${data.contact_last_name || ""}`.trim()) || "N/A",
          customer_email: data.customer_email || data.contact_email || contact.email || "",
          customer_phone: data.customer_phone || data.contact_phone || contact.phone || "",
          customer_country: data.contact_country || contact.country || "",
          trip_id: data.trip_id,
          trip_title: data.trip_title || `Trip #${data.trip_id}`,
          trip_image: data.trip_image,
          trip_price: (parseFloat(data.subtotal) || data.total_amount || 0) / (data.travelers_count || 1),
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
          google_calendar: data.google_calendar
        };
      }
      return null;
    },
    enabled: !!bookingId && can("yatra_view_bookings")
  });
  const isPro = !!((_a = window.yatraAdmin) == null ? void 0 : _a.isPro);
  const { data: consentStatus } = useQuery({
    queryKey: ["booking-consent-status", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const response = await apiClient.get(
        `/bookings/${bookingId}/consent-status`
      );
      return (response == null ? void 0 : response.data) || null;
    },
    enabled: !!bookingId && isPro
  });
  const formatDate$1 = (dateString) => {
    return formatDate(dateString);
  };
  const formatPrice = (price, currencyCode = "USD") => formatYatraMoney(Number(price) || 0, currencyCode, {
    zeroAsUnknown: false
  });
  const getBookingStatusBadge = (status) => {
    const statusMap = {
      confirmed: {
        className: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Confirmed", "yatra")
      },
      pending: {
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        label: __("Pending", "yatra")
      },
      cancelled: {
        className: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        label: __("Cancelled", "yatra")
      },
      completed: {
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        label: __("Completed", "yatra")
      }
    };
    const statusInfo = statusMap[status] || {
      className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
      label: status
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        className: `inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${statusInfo.className}`,
        children: statusInfo.label
      }
    );
  };
  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      paid: {
        className: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: __("Paid", "yatra")
      },
      pending: {
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        label: __("Pending", "yatra")
      },
      partial: {
        className: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
        label: __("Partial", "yatra")
      },
      refunded: {
        className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
        label: __("Refunded", "yatra")
      }
    };
    const statusInfo = statusMap[status] || {
      className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
      label: status
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        className: `inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${statusInfo.className}`,
        children: statusInfo.label
      }
    );
  };
  const handleBack = () => {
    var _a2;
    window.location.href = `${((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=bookings`;
  };
  const handleEdit = () => {
    var _a2;
    window.location.href = `${((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=bookings&action=edit&id=${bookingId}`;
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-48" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-64" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-28" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-20" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-36" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-20 rounded-md" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-16 rounded-md" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [...Array(6)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-32" })
            ] }, i)) }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-40" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-36" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-48" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-32" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-16" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-20 w-full" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-36" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-16 rounded-md" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-28" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-32" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-20" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-28" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-20" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-16" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-40" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-40" })
              ] })
            ] })
          ] })
        ] })
      ] })
    ] });
  }
  if (error || !booking) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        PageHeader,
        {
          title: __("Booking Not Found", "yatra"),
          description: __(
            "The booking you are looking for does not exist",
            "yatra"
          ),
          actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              onClick: handleBack,
              className: "flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" }),
                __("Back to Bookings", "yatra")
              ]
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-8 text-center text-red-500", children: __("Error loading booking or booking not found", "yatra") }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        title: __("Booking Details", "yatra"),
        description: __("View complete booking information", "yatra"),
        actions: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_edit_bookings", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleEdit, className: "flex items-center gap-2", children: __("Edit Booking", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              onClick: handleBack,
              className: "flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" }),
                __("Back", "yatra")
              ]
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_view_bookings", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Booking Overview", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              getBookingStatusBadge(booking.booking_status),
              getPaymentStatusBadge(booking.payment_status)
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Booking Number", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: booking.booking_number })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Trip", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: booking.trip_title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: [
                  __("Trip ID", "yatra"),
                  ": #",
                  booking.trip_id
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3 h-3" }),
                  __("Booking Date", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate$1(booking.booking_date) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3 h-3" }),
                  __("Travel Date", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate$1(booking.travel_date) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-3 h-3" }),
                  __("Number of Travelers", "yatra")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-gray-900 dark:text-white", children: [
                  booking.travelers,
                  " ",
                  booking.travelers === 1 ? __("Traveler", "yatra") : __("Travelers", "yatra")
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 pt-4 border-t border-gray-200 dark:border-gray-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-3", children: __("Payment Summary", "yatra") }),
              (() => {
                const dbSubtotal = parseFloat(booking.subtotal) || booking.total_amount || 0;
                const discountAmount = booking.discount_amount || 0;
                const itineraryCostsTotal = parseFloat(booking.itinerary_costs_total) || 0;
                const taxAmount = parseFloat(booking.tax_amount) || 0;
                const taxInclusiveRaw = booking.tax_inclusive;
                const taxInclusive = taxInclusiveRaw === true || parseInt(String(taxInclusiveRaw), 10) === 1;
                const totalAmount = booking.total_amount || 0;
                const amountPaid = booking.amount_paid || 0;
                const amountDue = booking.amount_due || 0;
                let taxLines = [];
                const taxBreakdownRaw = booking.tax_breakdown;
                if (Array.isArray(taxBreakdownRaw) && taxBreakdownRaw.length > 0) {
                  taxLines = taxBreakdownRaw;
                } else {
                  const taxDetailsRaw = booking.tax_details;
                  if (taxDetailsRaw) {
                    try {
                      const parsed = typeof taxDetailsRaw === "string" ? JSON.parse(taxDetailsRaw) : taxDetailsRaw;
                      if (Array.isArray(parsed) && parsed.length > 0)
                        taxLines = parsed;
                    } catch (_) {
                    }
                  }
                  if (taxLines.length === 0 && taxAmount > 0) {
                    taxLines = [
                      {
                        name: __("Tax", "yatra"),
                        rate: parseFloat(booking.tax_rate) || 0,
                        amount: taxAmount
                      }
                    ];
                  }
                }
                let itineraryCosts = [];
                const itineraryCostsRaw = booking.itinerary_costs;
                if (typeof itineraryCostsRaw === "string") {
                  try {
                    itineraryCosts = JSON.parse(itineraryCostsRaw);
                  } catch (_) {
                  }
                } else if (Array.isArray(itineraryCostsRaw)) {
                  itineraryCosts = itineraryCostsRaw;
                }
                const rawServices = booking.additional_services;
                const selectedServices = Array.isArray(rawServices) ? rawServices.filter((s) => (s == null ? void 0 : s.selected) !== false) : [];
                const getServiceAmt = (s) => parseFloat(
                  (s == null ? void 0 : s.total_price) ?? (s == null ? void 0 : s.calculated_price) ?? (s == null ? void 0 : s.total_cost) ?? (s == null ? void 0 : s.amount) ?? (s == null ? void 0 : s.unit_price) ?? (s == null ? void 0 : s.price) ?? 0
                );
                const servicesTotal = selectedServices.reduce(
                  (sum, s) => sum + getServiceAmt(s),
                  0
                );
                const baseTripCost = dbSubtotal - servicesTotal;
                const taxableAmount = Math.max(0, dbSubtotal - discountAmount) + itineraryCostsTotal;
                const hasServices = selectedServices.length > 0;
                const hasDiscount = discountAmount > 0;
                const hasItinerary = itineraryCosts.length > 0 && itineraryCostsTotal > 0;
                const hasTax = taxLines.length > 0;
                const showTaxableRow = hasTax && (hasDiscount || hasItinerary);
                const Row = ({
                  label,
                  value,
                  sub = false,
                  green = false,
                  bold = false
                }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `flex justify-between text-sm${sub ? " ml-4" : ""}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: bold ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400",
                          children: label
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: bold ? "font-semibold text-gray-900 dark:text-white" : green ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white",
                          children: value
                        }
                      )
                    ]
                  }
                );
                return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-600 dark:text-gray-400 flex items-center gap-1.5", children: [
                      __("Trip Base Price", "yatra"),
                      taxInclusive && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", children: __("Tax Incl.", "yatra") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPrice(baseTripCost, booking.currency) })
                  ] }),
                  hasServices && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        "+ ",
                        __("Additional Services", "yatra")
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {})
                    ] }),
                    selectedServices.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Row,
                      {
                        sub: true,
                        label: (s == null ? void 0 : s.service_name) || (s == null ? void 0 : s.name) || (s == null ? void 0 : s.title) || (s == null ? void 0 : s.label) || __("Service", "yatra"),
                        value: formatPrice(
                          getServiceAmt(s),
                          booking.currency
                        )
                      },
                      i
                    )),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm font-semibold border-t border-gray-200 dark:border-gray-600 pt-1.5 mt-0.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: __("Gross Total", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPrice(dbSubtotal, booking.currency) })
                    ] })
                  ] }),
                  hasDiscount && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Row,
                    {
                      label: __("Discount", "yatra"),
                      value: `-${formatPrice(discountAmount, booking.currency)}`,
                      green: true
                    }
                  ),
                  hasItinerary && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        "+ ",
                        __("Itinerary Costs", "yatra")
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {})
                    ] }),
                    itineraryCosts.map((cost, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Row,
                      {
                        sub: true,
                        label: `${cost.name} ${cost.price_per === "person" ? __("(per person)", "yatra") : cost.price_per === "group" ? __("(per booking)", "yatra") : __("(flat rate)", "yatra")}`,
                        value: formatPrice(
                          cost.total_cost ?? cost.price,
                          booking.currency
                        )
                      },
                      i
                    ))
                  ] }),
                  !taxInclusive && showTaxableRow && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm font-semibold border-t border-dashed border-gray-300 dark:border-gray-600 pt-1.5 mt-0.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700 dark:text-gray-300", children: __("Taxable Amount", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPrice(taxableAmount, booking.currency) })
                  ] }),
                  hasTax && !taxInclusive && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        "+ ",
                        __("Tax", "yatra")
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {})
                    ] }),
                    taxLines.map((tax, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "flex justify-between text-sm ml-4",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-600 dark:text-gray-400", children: [
                            tax.name,
                            tax.rate > 0 ? ` (${tax.rate}%)` : ""
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-900 dark:text-white", children: [
                            "+",
                            formatPrice(
                              parseFloat(tax.amount) || 0,
                              booking.currency
                            )
                          ] })
                        ]
                      },
                      i
                    ))
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-base font-bold border-t-2 border-gray-800 dark:border-gray-300 pt-2 mt-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: __("Net Amount", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: formatPrice(totalAmount, booking.currency) })
                  ] }),
                  hasTax && taxInclusive && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 space-y-0.5", children: taxLines.map((tax, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "text-xs text-gray-400 dark:text-gray-500 italic",
                      children: [
                        __("Incl.", "yatra"),
                        " ",
                        tax.name,
                        tax.rate > 0 ? ` (${tax.rate}%)` : "",
                        ":",
                        " ",
                        formatPrice(
                          parseFloat(tax.amount) || 0,
                          booking.currency
                        )
                      ]
                    },
                    i
                  )) }),
                  amountPaid > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Row,
                    {
                      label: __("Amount Paid", "yatra"),
                      value: formatPrice(amountPaid, booking.currency),
                      green: true
                    }
                  ),
                  amountDue > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm font-semibold", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-orange-600 dark:text-orange-400", children: __("Due Now", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-orange-600 dark:text-orange-400", children: formatPrice(amountDue, booking.currency) })
                  ] })
                ] });
              })()
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Customer Information", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white mb-1", children: booking.customer_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-4 h-4" }),
                booking.customer_email
              ] }),
              booking.customer_phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "w-4 h-4" }),
                booking.customer_phone
              ] })
            ] })
          ] }) })
        ] }),
        booking.travelers_data && booking.travelers_data.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-4 h-4" }),
            ((_b = formConfig == null ? void 0 : formConfig.traveler_form) == null ? void 0 : _b.title) || __("Travelers Information", "yatra"),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-xs font-normal text-gray-500 dark:text-gray-400", children: [
              "(",
              booking.travelers_data.length,
              " ",
              booking.travelers_data.length === 1 ? __("traveler", "yatra") : __("travelers", "yatra"),
              ")"
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: booking.travelers_data.map(
            (traveler, index) => {
              const travelerFieldsData = traveler.fields || traveler;
              const systemFields = [
                "id",
                "booking_id",
                "traveller_index",
                "is_lead",
                "created_at",
                "updated_at",
                "fields"
              ];
              const travelerEntries = Object.entries(
                travelerFieldsData
              ).filter(([key, value]) => {
                if (systemFields.includes(key)) return false;
                if (!value || typeof value === "string" && value.trim() === "")
                  return false;
                if (typeof value === "object" && !Array.isArray(value))
                  return false;
                return true;
              });
              const firstName = travelerFieldsData.first_name || traveler.first_name || "";
              const lastName = travelerFieldsData.last_name || traveler.last_name || "";
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `p-4 rounded-lg ${index === 0 ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: [
                        index === 0 ? __("Lead Traveler", "yatra") : `${__("Traveler", "yatra")} ${index + 1}`,
                        (firstName || lastName) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-normal text-gray-500 dark:text-gray-400 ml-2", children: [
                          "-",
                          " ",
                          [firstName, lastName].filter(Boolean).join(" ")
                        ] })
                      ] }),
                      index === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded", children: __("Primary Contact", "yatra") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: travelerEntries.map(([fieldId, fieldValue]) => {
                      if (fieldId === "first_name" || fieldId === "last_name")
                        return null;
                      const fieldConfig = travelerFields.find(
                        (f) => f.id === fieldId
                      );
                      const label = (fieldConfig == null ? void 0 : fieldConfig.label) || getFieldLabel(fieldId, travelerFields);
                      const isLongField = (fieldConfig == null ? void 0 : fieldConfig.type) === "textarea" || String(fieldValue).length > 50;
                      let displayValue = String(fieldValue);
                      if ((fieldConfig == null ? void 0 : fieldConfig.type) === "date" || fieldId.includes("date") || fieldId.includes("expiry")) {
                        try {
                          displayValue = new Date(
                            fieldValue
                          ).toLocaleDateString();
                        } catch {
                          displayValue = String(fieldValue);
                        }
                      }
                      if ((fieldId === "nationality" || fieldId === "country") && fieldValue && typeof fieldValue === "string" && fieldValue.length === 2) {
                        displayValue = getCountryName(fieldValue);
                      }
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "div",
                        {
                          className: isLongField ? "col-span-2 md:col-span-3" : "",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mb-0.5", children: label }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "div",
                              {
                                className: `text-sm text-gray-900 dark:text-white ${fieldId === "passport" ? "font-mono" : ""} capitalize`,
                                children: displayValue
                              }
                            )
                          ]
                        },
                        fieldId
                      );
                    }) }),
                    travelerEntries.length <= 2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-400 dark:text-gray-500 italic mt-2", children: __(
                      "Limited traveler information provided",
                      "yatra"
                    ) })
                  ]
                },
                index
              );
            }
          ) })
        ] }),
        booking.emergency_contact && Object.values(booking.emergency_contact).some(
          (v) => v && String(v).trim() !== ""
        ) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
            ((_c = formConfig == null ? void 0 : formConfig.emergency_contact_form) == null ? void 0 : _c.title) || __("Emergency Contact", "yatra")
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: Object.entries(booking.emergency_contact).filter(
            ([_, value]) => value && String(value).trim() !== ""
          ).map(([fieldId, fieldValue]) => {
            const label = getFieldLabel(fieldId, emergencyFields);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mb-0.5", children: label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white capitalize", children: String(fieldValue) })
            ] }, fieldId);
          }) }) })
        ] }),
        booking.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4" }),
            __("Special Requests", "yatra")
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap", children: booking.notes }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        ((_d = window.yatraAdmin) == null ? void 0 : _d.isPro) && !!((_f = (_e = window.yatraAdmin) == null ? void 0 : _e.googleCalendar) == null ? void 0 : _f.enabled) && booking.google_calendar && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Google Calendar Sync", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: (() => {
            const gc = booking.google_calendar;
            const status = gc.sync_status || (gc.synced ? "synced" : "not_synced");
            const statusClass = status === "synced" ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Status", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: `inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${statusClass}`,
                    children: status
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Last Synced", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: gc.last_synced_at ? formatDate$1(gc.last_synced_at) : __("—", "yatra") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Calendar", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white break-all", children: gc.calendar_id || __("—", "yatra") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Event ID", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white font-mono break-all", children: gc.event_id || __("—", "yatra") })
              ] }),
              gc.error_message && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Error", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap", children: gc.error_message })
              ] })
            ] });
          })() })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Payment Information", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Payment Status", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1", children: getPaymentStatusBadge(booking.payment_status) })
            ] }),
            booking.payment_method && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-3 h-3" }),
                __("Payment Method", "yatra")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: booking.payment_method })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                __("Trip Price per Person", "yatra"),
                ((v) => v === true || parseInt(String(v), 10) === 1)(
                  booking.tax_inclusive
                ) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 normal-case tracking-normal", children: __("Tax Incl.", "yatra") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: (() => {
                const subtotal = parseFloat(booking.subtotal) || booking.total_amount || 0;
                const travelers = booking.travelers || 1;
                const rawServices = booking.additional_services;
                const servicesTotal = Array.isArray(rawServices) ? rawServices.filter((s) => (s == null ? void 0 : s.selected) !== false).reduce(
                  (sum, s) => sum + parseFloat(
                    (s == null ? void 0 : s.total_price) ?? (s == null ? void 0 : s.calculated_price) ?? (s == null ? void 0 : s.total_cost) ?? (s == null ? void 0 : s.amount) ?? (s == null ? void 0 : s.unit_price) ?? (s == null ? void 0 : s.price) ?? 0
                  ),
                  0
                ) : 0;
                const baseTripCost = subtotal - servicesTotal;
                return formatPrice(
                  baseTripCost / travelers,
                  booking.currency
                );
              })() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1", children: [
                __("Total Amount", "yatra"),
                ((v) => v === true || parseInt(String(v), 10) === 1)(
                  booking.tax_inclusive
                ) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 normal-case tracking-normal", children: __("Tax Incl.", "yatra") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: formatPrice(booking.total_amount || 0, booking.currency) })
            ] })
          ] })
        ] }),
        booking.discount_amount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "svg",
              {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                className: "w-4 h-4",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2L2 7l10 5 10-5-10-5z" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M2 17l10 5 10-5" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M2 12l10 5 10-5" })
                ]
              }
            ),
            __("Discount Applied", "yatra")
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1", children: __("Discount Type", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-emerald-700 dark:text-emerald-300", children: ((_g = booking.discount_code) == null ? void 0 : _g.toLowerCase().includes("group")) || ((_h = booking.discount_code) == null ? void 0 : _h.includes("GROUP")) ? __("Group Discount", "yatra") : __("Coupon Discount", "yatra") })
            ] }),
            booking.discount_code && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1", children: __("Code", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded inline-block", children: booking.discount_code })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1", children: __("Savings", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xl font-bold text-emerald-700 dark:text-emerald-300", children: [
                "-",
                formatPrice(booking.discount_amount, booking.currency)
              ] })
            ] })
          ] })
        ] }),
        isPro && consentStatus && consentStatus.total_required > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Card,
          {
            className: consentStatus.all_signed ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20" : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                CardTitle,
                {
                  className: `text-base flex items-center gap-2 ${consentStatus.all_signed ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileSignature, { className: "w-4 h-4" }),
                    __("Consent Status", "yatra")
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: `text-sm ${consentStatus.all_signed ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`,
                    children: consentStatus.all_signed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4" }),
                      __("All Consents Signed", "yatra")
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4" }),
                      __("Pending Signatures", "yatra")
                    ] })
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: __("Signed", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-gray-900 dark:text-white", children: [
                    consentStatus.total_signed,
                    " /",
                    " ",
                    consentStatus.total_required
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: `h-2 rounded-full ${consentStatus.all_signed ? "bg-green-500" : "bg-amber-500"}`,
                    style: {
                      width: `${consentStatus.total_signed / consentStatus.total_required * 100}%`
                    }
                  }
                ) }),
                consentStatus.pending_requests && consentStatus.pending_requests.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2 border-t border-amber-200 dark:border-amber-700", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2", children: __("Pending", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    consentStatus.pending_requests.slice(0, 3).map((req, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-3 h-3" }),
                          req.recipient_name || req.recipient_email
                        ]
                      },
                      idx
                    )),
                    consentStatus.pending_requests.length > 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500", children: [
                      "+",
                      consentStatus.pending_requests.length - 3,
                      " ",
                      __("more", "yatra")
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    className: "w-full mt-2",
                    onClick: () => {
                      var _a2;
                      window.location.href = `${((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=trips&tab=trip-consent`;
                    },
                    children: __("Manage Consents", "yatra")
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Timeline", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Created", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate$1(booking.created_at) })
            ] }),
            booking.updated_at && booking.updated_at !== booking.created_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1", children: __("Last Updated", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-900 dark:text-white", children: formatDate$1(booking.updated_at) })
            ] })
          ] })
        ] })
      ] })
    ] }) })
  ] });
};
export {
  ViewBooking as default
};
//# sourceMappingURL=ViewBooking-B2LuTZaL.js.map
